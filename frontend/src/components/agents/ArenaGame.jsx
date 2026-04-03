import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { interviewAPI } from '../../services/api';
import { useGamificationStore } from '../../store/gamificationStore';
import { Zap, Clock as ClockIcon, Trophy, Target, ArrowLeft, Loader, Flame, Heart as HeartIcon, Circle as CircleIcon } from 'lucide-react';

const QUESTIONS_COUNT = 10;
const TIME_BONUS_MULTIPLIER = 1;

const ArenaGame = ({ onExit, levelConfig }) => {
    const timeLimit = levelConfig?.timeLimit || 15;
    const baseXP = 10 + ((levelConfig?.id || 1) * 5);
    const isBoss = levelConfig?.isBoss || false;
    
    // Game States: 'start', 'loading', 'playing', 'results'
    const [gameState, setGameState] = useState('start');
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(timeLimit);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);
    const [earnedXP, setEarnedXP] = useState(0);
    const [lives, setLives] = useState(3);
    const [combo, setCombo] = useState(0);
    const [bossHP, setBossHP] = useState(100);
    const [hiddenOptions, setHiddenOptions] = useState([]);
    const [isFrozen, setIsFrozen] = useState(false);
    
    // Timer Refs
    const timerRef = useRef(null);
    const { addXP, updateChallengeProgress, awardBadge, powerups, usePowerup, completeCampaignLevel } = useGamificationStore();

    const activateFreeze = () => {
        if (powerups.freeze > 0 && !isFrozen) {
            usePowerup('freeze');
            setIsFrozen(true);
            clearInterval(timerRef.current);
            setTimeout(() => {
                setIsFrozen(false);
                if (gameState === 'playing') startTimer(timeRemaining);
            }, 5000); 
        }
    };

    const activateFiftyFifty = () => {
        if (powerups.fiftyFifty > 0 && hiddenOptions.length === 0 && questions[currentIndex]) {
            usePowerup('fiftyFifty');
            const currentQ = questions[currentIndex];
            const correct = currentQ.correct_option;
            const allOptions = Object.keys(currentQ.options);
            const wrongOptions = allOptions.filter(o => o !== correct);
            const toHide = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 2);
            setHiddenOptions(toHide);
        }
    };

    const activateRevive = () => {
        if (powerups.revive > 0 && lives < 3) {
            usePowerup('revive');
            setLives(prev => Math.min(prev + 1, 3));
            playSound('correct');
        }
    };

    const playSound = (type) => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (type === 'correct') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(500, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'wrong') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
            }
        } catch (e) {}
    };

    const startGame = async () => {
        setGameState('loading');
        try {
            setSelectedOption(null);
            setIsAnswerCorrect(null);
            setHiddenOptions([]);
            setIsFrozen(false);

            let company = "Generic";
            if (levelConfig?.companyTags?.length > 0) {
                company = levelConfig.companyTags[Math.floor(Math.random() * levelConfig.companyTags.length)];
            }
            const difficulty = levelConfig?.difficulty || "Medium";
            const topic = levelConfig ? levelConfig.topics.join(" and ") : "Rapid Fire Logic";

            const res = await interviewAPI.generateMCQ(company, difficulty, 'Software Developer', topic, QUESTIONS_COUNT);
            if (res.data && res.data.length > 0) {
                const shuffled = [...res.data].sort(() => 0.5 - Math.random()).slice(0, QUESTIONS_COUNT);
                setQuestions(shuffled);
                setScore(0);
                setStreak(0);
                setCombo(0);
                setBossHP(100);
                setMaxStreak(0);
                setEarnedXP(0);
                setLives(3);
                setCurrentIndex(0);
                setGameState('playing');
                startTimer();
            } else {
                throw new Error("No questions returned");
            }
        } catch (err) {
            console.error("Failed to load arena questions:", err);
            setGameState('start');
        }
    };

    const startTimer = (initialTime = null) => {
        setTimeRemaining(initialTime !== null ? initialTime : timeLimit);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleTimeout = () => {
        clearInterval(timerRef.current);
        playSound('wrong');
        setIsAnswerCorrect(false);
        setStreak(0);
        setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
                setTimeout(endGame, 1500);
            } else {
                setTimeout(nextQuestion, 1500);
            }
            return newLives;
        });
    };

    const handleAnswer = (key) => {
        if (selectedOption || gameState !== 'playing') return;
        
        clearInterval(timerRef.current);
        setSelectedOption(key);
        
        const currentQ = questions[currentIndex];
        const isRight = key === currentQ.correct_option;
        setIsAnswerCorrect(isRight);
        
        if (isRight) {
            playSound('correct');
            const newStreak = streak + 1;
            const newCombo = combo + 1;
            setStreak(newStreak);
            setCombo(newCombo);
            if (newStreak > maxStreak) setMaxStreak(newStreak);
            
            const timeBonus = timeRemaining * TIME_BONUS_MULTIPLIER;
            const streakMultiplier = 1 + (Math.floor(newStreak / 3) * 0.5); 
            const comboBonus = Math.min(newCombo * 0.1, 2);
            
            const pointsGained = Math.round((100 + timeBonus) * (streakMultiplier + comboBonus));
            const xpGained = Math.round((baseXP + (timeRemaining * 0.5)) * streakMultiplier);
            
            setScore(prev => prev + pointsGained);
            setEarnedXP(prev => prev + xpGained);

            if (isBoss) {
                const damage = Math.round(10 + (timeRemaining / timeLimit) * 15);
                setBossHP(prev => {
                    const newHP = Math.max(0, prev - damage);
                    if (newHP <= 0) setTimeout(endGame, 1000);
                    return newHP;
                });
            }
            
            setTimeout(nextQuestion, 1500);
        } else {
            playSound('wrong');
            setStreak(0);
            setCombo(0);
            setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) setTimeout(endGame, 2000);
                else setTimeout(nextQuestion, 2000);
                return newLives;
            });
        }
    };

    const nextQuestion = () => {
        setHiddenOptions([]);
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswerCorrect(null);
            startTimer();
        } else endGame();
    };

    const endGame = () => {
        clearInterval(timerRef.current);
        setGameState('results');
    };

    const claimRewards = () => {
        if (earnedXP > 0) {
            const completionBonus = levelConfig?.xpReward || 0;
            addXP(earnedXP + completionBonus, `Campaign: ${levelConfig?.title || 'Arena'} Complete`);
            if (levelConfig?.id) completeCampaignLevel(levelConfig.id);
        }
        updateChallengeProgress(2);
        if (maxStreak >= 5) awardBadge('STREAK_7'); 
        if (score > 5000) awardBadge('DSA_MASTER');
        onExit();
    };

    useEffect(() => {
        return () => clearInterval(timerRef.current);
    }, []);

    if (gameState === 'start') {
        return (
            <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[80vh] animate-fade-in relative">
                <button onClick={onExit} className="absolute top-0 left-0 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-8">
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[3rem] mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/30 rotate-12 hover:rotate-0 transition-all duration-500 cursor-pointer">
                        <Zap className="w-16 h-16 text-white" />
                    </div>
                    <div className="space-y-4">
                        <h1 className={`text-6xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${isBoss ? 'from-red-600 via-rose-600 to-orange-600' : 'from-indigo-600 via-purple-600 to-pink-600'}`}>
                            {levelConfig ? levelConfig.title : 'The Arena'}
                        </h1>
                        <p className={`text-xl font-bold tracking-widest uppercase ${isBoss ? 'text-red-500 animate-pulse' : 'text-gray-500'}`}>
                            {levelConfig ? levelConfig.subtitle : 'Rapid Fire Survival'}
                        </p>
                    </div>
                    <div className="flex justify-center gap-6 text-sm font-bold text-gray-600">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm"><ClockIcon className="w-4 h-4 text-blue-500" /> {timeLimit}s/Q</div>
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm"><HeartIcon className="w-4 h-4 text-red-500" /> 3 Lives</div>
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm"><Flame className="w-4 h-4 text-orange-500" /> Multipliers</div>
                    </div>
                    <button onClick={startGame} className={`mt-12 px-12 py-6 text-white rounded-full text-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all ${isBoss ? 'bg-gradient-to-r from-red-600 to-rose-600 shadow-red-500/30' : 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/30'}`}>
                        START MATCH
                    </button>
                </motion.div>
            </div>
        );
    }

    if (gameState === 'loading') {
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[80vh] space-y-6">
                <Loader className="w-16 h-16 text-indigo-500 animate-spin" />
                <h2 className="text-2xl font-black uppercase tracking-widest text-indigo-600 animate-pulse">Entering Arena...</h2>
            </div>
        );
    }

    if (gameState === 'results') {
        const isWin = lives > 0 || (isBoss && bossHP <= 0);
        return (
            <div className="w-full max-w-4xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[80vh] animate-fade-in relative">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-800 p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 text-center space-y-10 w-full max-w-2xl">
                    <div>
                        <span className="text-6xl mb-4 block">{isWin ? '🏆' : '💀'}</span>
                        <h2 className={`text-4xl font-black uppercase tracking-tight ${isWin ? 'text-indigo-600' : 'text-rose-600'}`}>{isWin ? 'Match Complete!' : 'Game Over'}</h2>
                        <p className="text-gray-500 font-bold mt-2 text-lg">{isWin ? 'You survived the Arena.' : 'You lost all your lives.'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                            <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">Final Score</p>
                            <p className="text-4xl font-black text-gray-900 dark:text-white">{score.toLocaleString()}</p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-6 rounded-3xl border border-orange-100 dark:border-orange-900/30">
                            <p className="text-[10px] uppercase font-black tracking-widest text-orange-400 flex justify-center items-center gap-1 mb-2"><Flame className="w-3 h-3"/> Max Streak</p>
                            <p className="text-4xl font-black text-orange-500">{maxStreak}</p>
                        </div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-8 rounded-3xl text-white shadow-lg shadow-purple-500/20">
                        <p className="text-sm font-bold opacity-80 uppercase tracking-widest mb-1">XP Earned + Level Bonus</p>
                        <p className="text-5xl font-black flex items-center justify-center gap-3">
                            +{(earnedXP + (levelConfig?.xpReward || 0)).toLocaleString()} <Zap className="w-8 h-8 text-yellow-300" />
                        </p>
                    </div>
                    <div className="flex flex-col gap-4">
                        {!isWin && (
                            <button onClick={startGame} className="w-full py-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-full font-black uppercase text-lg tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-500/20">
                                Try Again
                            </button>
                        )}
                        <button onClick={claimRewards} className={`w-full py-6 rounded-full font-black uppercase text-lg tracking-widest hover:scale-105 transition-all shadow-xl ${!isWin ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'}`}>
                            {isWin ? 'Claim Rewards & Exit' : 'Exit Arena'}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const progress = (timeRemaining / timeLimit) * 100;
    let timerColor = "bg-emerald-500";
    if (timeRemaining <= 5) timerColor = "bg-rose-500 animate-pulse";
    else if (timeRemaining <= 10) timerColor = "bg-amber-500";

    return (
        <div className={`w-full max-w-5xl mx-auto p-4 md:p-8 min-h-[85vh] flex flex-col relative animate-fade-in ${isBoss ? 'hue-rotate-[320deg]' : ''}`}>
            <header className="flex items-center justify-between mb-8 bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Score</span>
                        <span className="text-2xl font-black text-indigo-600">{score.toLocaleString()}</span>
                    </div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Streak</span>
                        <span className="text-2xl font-black text-orange-500 flex items-center gap-1"><Flame className={`w-5 h-5 ${streak > 2 ? 'animate-pulse' : ''}`} /> {streak}</span>
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Question {currentIndex + 1}/{QUESTIONS_COUNT}</span>
                    <div className="flex gap-2">
                        {[...Array(QUESTIONS_COUNT)].map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i < currentIndex ? 'bg-indigo-500' : i === currentIndex ? 'bg-indigo-300 animate-ping' : 'bg-gray-200 dark:bg-gray-700'}`} />
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    {[...Array(3)].map((_, i) => (
                        <HeartIcon key={i} className={`w-6 h-6 ${i < lives ? 'text-rose-500 fill-current' : 'text-gray-300 dark:text-gray-600'} transition-all`} />
                    ))}
                </div>
            </header>

            {isBoss && (
                <div className="mb-8 space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-black uppercase tracking-tighter text-red-600 flex items-center gap-2">👹 BOSS HEALTH</span>
                        <span className="text-xs font-black text-red-500">{bossHP}%</span>
                    </div>
                    <div className="h-6 w-full bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border-2 border-red-100 dark:border-red-900/30 p-1">
                        <motion.div className="h-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600 rounded-lg relative" initial={{ width: '100%' }} animate={{ width: `${bossHP}%` }} transition={{ type: 'spring', stiffness: 50 }} />
                    </div>
                </div>
            )}

            <div className={`w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-12 shadow-inner relative ${isFrozen ? 'ring-4 ring-blue-400 ring-offset-2 dark:ring-offset-gray-900' : ''}`}>
                <motion.div className={`h-full ${isFrozen ? 'bg-blue-400' : timerColor} rounded-full`} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: "linear" }} />
            </div>

            <div className="flex-1 flex flex-col justify-center items-center max-w-4xl mx-auto w-full space-y-10">
                <AnimatePresence mode="wait">
                    {questions[currentIndex] && (
                        <motion.div key={currentIndex} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="w-full">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight text-center mb-12 shadow-sm rounded-3xl p-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                {questions[currentIndex].question}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.entries(questions[currentIndex].options || {}).map(([key, text]) => {
                                    const isSelected = selectedOption === key;
                                    const showCorrect = selectedOption !== null && key === questions[currentIndex].correct_option;
                                    const showWrong = selectedOption === key && key !== questions[currentIndex].correct_option;
                                    const isHidden = hiddenOptions.includes(key);
                                    if (isHidden) return <div key={key} className="p-6 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-gray-800 opacity-20" />;

                                    let btnClass = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:shadow-lg text-gray-800 dark:text-gray-100";
                                    if (showCorrect) btnClass = "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/30 scale-105 z-10";
                                    else if (showWrong) btnClass = "bg-rose-500 border-rose-500 text-white shadow-xl shadow-rose-500/30 scale-95 opacity-80";
                                    else if (selectedOption) btnClass = "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-40 grayscale";

                                    return (
                                        <button key={key} onClick={() => handleAnswer(key)} disabled={selectedOption !== null} className={`p-6 rounded-[2rem] border-2 text-left transition-all duration-300 flex items-center gap-6 ${btnClass}`}>
                                            <span className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0 ${showCorrect || showWrong ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>{key}</span>
                                            <span className="font-bold text-lg leading-snug">{text}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="relative">
                                <AnimatePresence>
                                    {selectedOption && (
                                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`mt-10 p-6 rounded-3xl text-center border-2 ${isAnswerCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                                            <h3 className="text-xl font-black uppercase tracking-widest mb-2">{isAnswerCorrect ? '✓ CORRECT!' : '✕ INCORRECT'}</h3>
                                            <p className="font-bold text-sm lg:text-base">{questions[currentIndex].explanation}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-3 rounded-[2.5rem] shadow-2xl border border-white/20 z-50">
                {[
                    { id: 'freeze', icon: <ClockIcon className="w-5 h-5" />, count: powerups.freeze, action: activateFreeze, color: 'blue' },
                    { id: 'fiftyFifty', icon: <CircleIcon className="w-5 h-5" />, count: powerups.fiftyFifty, action: activateFiftyFifty, color: 'purple' },
                    { id: 'revive', icon: <HeartIcon className="w-5 h-5" />, count: powerups.revive, action: activateRevive, color: 'rose' }
                ].map(pw => (
                    <button key={pw.id} disabled={pw.count <= 0 || selectedOption !== null} onClick={pw.action} className={`group relative p-4 rounded-full transition-all ${pw.count > 0 ? `bg-${pw.color}-500 text-white hover:scale-110 shadow-lg shadow-${pw.color}-500/20` : 'bg-gray-200 dark:bg-gray-700 text-gray-400 opacity-40 grayscale cursor-not-allowed'}`}>
                        {pw.icon}
                        <span className="absolute -top-1 -right-1 w-6 h-6 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center text-[10px] font-black text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-800">{pw.count}</span>
                    </button>
                ))}
            </div>
            <button onClick={endGame} className="absolute top-8 right-8 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors">Surrender</button>
        </div>
    );
};

export default ArenaGame;
