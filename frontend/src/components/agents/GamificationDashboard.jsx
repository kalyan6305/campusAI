import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamificationStore, LEVELS, BADGES } from '../../store/gamificationStore';
import { Trophy, Star, Target, Zap, Award, ChevronRight, Calendar, CheckCircle2, Circle as CircleIcon, Clock as ClockIcon, Heart as HeartIcon, TrendingUp, ArrowLeft, Sparkles, Lock, Play } from 'lucide-react';

const CAMPAIGN_LEVELS = [
  {
    id: 1,
    title: "Fresher",
    subtitle: "Computer Science Fundamentals",
    difficulty: "Easy",
    topics: ["Data Structures", "Algorithms", "OS", "DBMS"],
    timeLimit: 20,
    xpReward: 100,
    icon: "🌱",
    color: "from-emerald-400 to-teal-500",
    shadow: "shadow-emerald-500/30",
    levelsRequired: 1,
    isBoss: false
  },
  {
    id: 2,
    title: "Intern",
    subtitle: "Logic & Aptitude",
    difficulty: "Medium",
    topics: ["Quantitative", "Logical Reasoning", "Verbal"],
    timeLimit: 15,
    xpReward: 250,
    icon: "🚀",
    color: "from-blue-400 to-indigo-500",
    shadow: "shadow-blue-500/30",
    companyTags: ["TCS", "Infosys", "Wipro"],
    levelsRequired: 3,
    isBoss: false
  },
  {
    id: 3,
    title: "Developer",
    subtitle: "Advanced Tech & Scenarios",
    difficulty: "Hard",
    topics: ["AI/ML", "Cybersecurity", "IoT", "Advanced DSA"],
    timeLimit: 15,
    xpReward: 500,
    icon: "💻",
    color: "from-purple-500 to-fuchsia-500",
    shadow: "shadow-purple-500/30",
    companyTags: ["Amazon", "Microsoft"],
    levelsRequired: 5,
    isBoss: false
  },
  {
    id: 4,
    title: "Expert",
    subtitle: "The Ultimate Boss Battle",
    difficulty: "Expert",
    topics: ["System Design", "Scalability", "Complex Logic"],
    timeLimit: 10,
    xpReward: 1500,
    icon: "💀",
    color: "from-red-500 to-rose-600",
    shadow: "shadow-red-500/40",
    companyTags: ["Google", "Meta"],
    levelsRequired: 8,
    isBoss: true
  }
];

const GamificationDashboard = ({ onBack, onPlay }) => {
  const { xp, level, streak, badges, dailyChallenges, updateStreak, campaignProgress, powerups, purchasePowerup } = useGamificationStore();
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showPowerupShop, setShowPowerupShop] = useState(false);

  useEffect(() => {
    updateStreak();
  }, [updateStreak]);

  const currentIndex = LEVELS.findIndex(l => l.name === level.name);
  const nextLevel = currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;
  const xpForCurrentLevel = level.threshold;
  const xpForNextLevel = nextLevel ? nextLevel.threshold : xp;
  const maxLevel = !nextLevel;

  const progressPercentage = maxLevel 
      ? 100 
      : ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  const IconMap = {
      Flag: Award,
      Flame: FlameIcon,
      Target: Target,
      Trophy: Trophy,
      Code: Zap,
      Users: Star
  };

  const totalBadges = Object.keys(BADGES).length;
  const unlockedBadges = badges.length;
  const completedChallenges = dailyChallenges.filter(c => c.completed).length;
  const totalChallenges = dailyChallenges.length;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-2">
        <div className="flex items-center gap-5">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
          <div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
              <span className="text-3xl">🎮</span>
              Gamification Hub
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Level up your skills, complete challenges, and earn epic rewards.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          {onBack && (
            <button 
              onClick={onBack}
              className="hidden md:flex items-center gap-2 px-5 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm font-bold text-gray-700 dark:text-gray-300"
            >
              Main Menu
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0 }}
          className="p-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-500/20"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-purple-100 mb-1">Total XP</p>
          <p className="text-3xl font-black">{xp}</p>
        </motion.div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
          className="p-5 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl text-white shadow-lg shadow-orange-500/20"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-100 mb-1">Streak</p>
          <p className="text-3xl font-black flex items-center gap-2">🔥 {streak}</p>
        </motion.div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="p-5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl text-white shadow-lg shadow-emerald-500/20"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-1">Badges</p>
          <p className="text-3xl font-black">{unlockedBadges}<span className="text-lg text-emerald-100">/{totalBadges}</span></p>
        </motion.div>
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
          className="p-5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl text-white shadow-lg shadow-blue-500/20"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 mb-1">Today's Quests</p>
          <p className="text-3xl font-black">{completedChallenges}<span className="text-lg text-blue-100">/{totalChallenges}</span></p>
        </motion.div>
      </div>

      {/* Arena Campaign Map */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <span className="text-2xl">🗺️</span>
              The Arena Campaign
            </h3>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-1">Progress through career stages to unlock harder challenges</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CAMPAIGN_LEVELS.map((camp, idx) => {
            const isUnlocked = campaignProgress.includes(camp.id);
            const isCompleted = campaignProgress.includes(camp.id + 1);
            return (
              <motion.div 
                key={camp.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * idx }}
                className={`relative p-6 rounded-[2rem] border-2 transition-all overflow-hidden flex flex-col justify-between min-h-[320px] ${
                  isUnlocked 
                    ? `border-transparent bg-gradient-to-br ${camp.color} text-white shadow-xl ${camp.shadow} hover:-translate-y-2` 
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 grayscale opacity-80'
                }`}
              >
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-center p-6">
                    <Lock className="w-10 h-10 text-gray-600 dark:text-gray-300 mb-3" />
                    <p className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-wider">Locked</p>
                    <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400 mt-1 italic">
                      Master level {camp.id - 1} to unlock
                    </p>
                  </div>
                )}

                {isCompleted && (
                  <div className="absolute top-2 right-2 z-20">
                    <div className="bg-emerald-400 text-white p-1 rounded-full shadow-lg border-2 border-white">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                )}

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-4xl bg-white/20 p-3 rounded-2xl shadow-inner backdrop-blur-sm">{camp.icon}</span>
                    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg bg-white/20 backdrop-blur-sm ${camp.isBoss ? 'animate-pulse text-red-100' : 'text-white'}`}>
                      {camp.difficulty}
                    </span>
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-black uppercase tracking-tight mb-1">{camp.title}</h4>
                    <p className="text-xs font-bold opacity-90 leading-tight mb-4">{camp.subtitle}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-4">
                      {camp.topics.slice(0,2).map(t => (
                        <span key={t} className="text-[8px] font-black uppercase tracking-wider bg-black/20 px-2 py-1 rounded-md">{t}</span>
                      ))}
                      {camp.topics.length > 2 && <span className="text-[8px] font-black uppercase tracking-wider bg-black/20 px-2 py-1 rounded-md">+{camp.topics.length - 2} more</span>}
                    </div>

                    {camp.companyTags && (
                      <div className="flex gap-2 mb-4">
                        {camp.companyTags.map(tag => (
                          <span key={tag} className="text-[9px] font-bold px-2 py-0.5 border border-white/30 rounded-full flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/20">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold opacity-80">Reward: {camp.xpReward} XP</span>
                      <span className="text-[10px] font-bold opacity-80 flex items-center gap-1"><Zap className="w-3 h-3" /> {camp.timeLimit}s/Q</span>
                    </div>

                    <button 
                      disabled={!isUnlocked}
                      onClick={() => onPlay && onPlay(camp)}
                      className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${
                        isCompleted ? 'bg-white/30 text-white' : 
                        camp.isBoss 
                          ? 'bg-black text-rose-500 hover:bg-gray-900 hover:shadow-lg shadow-black/50' 
                          : 'bg-white text-gray-900 hover:bg-gray-50 hover:shadow-lg shadow-white/20'
                      }`}
                    >
                      {isCompleted ? <Trophy className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                      {isCompleted ? 'Mastered' : camp.isBoss ? 'Fight Boss' : 'Enter Arena'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        
        {/* Left Column: XP + Level + Badges */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Level Card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-[2.5rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-10 opacity-[0.04]">
              <Trophy className="w-40 h-40" />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              {/* Level Badge */}
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="relative"
              >
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-purple-500/30 ring-4 ring-purple-100 dark:ring-gray-700">
                  <div className="text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">Level</p>
                    <p className="text-3xl font-black">{currentIndex + 1}</p>
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg text-sm">⚡</div>
              </motion.div>

              <div className="flex-1 w-full">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{level.name}</h3>
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {xp} / {maxLevel ? 'MAX' : xpForNextLevel} XP
                    </p>
                  </div>
                  {!maxLevel && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Next: <span className="font-bold text-gray-900 dark:text-white">{nextLevel.name}</span></p>
                      <p className="text-xs font-black text-purple-600 dark:text-purple-400">{xpForNextLevel - xp} XP to go</p>
                    </div>
                  )}
                </div>

                {/* XP Progress Bar */}
                <div className="h-5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)' , backgroundSize: '1rem 1rem'}}></div>
                    <motion.div 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-sm"
                    />
                  </motion.div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-bold text-gray-400">{Math.round(progressPercentage)}% Complete</span>
                  {!maxLevel && <span className="text-[10px] font-bold text-gray-400">{maxLevel ? 'MAX LEVEL' : `${xpForNextLevel - xp} XP remaining`}</span>}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Power-up Shop */}
          <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.25 }}
             className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-100 dark:border-indigo-800/30 shadow-sm overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Zap className="w-32 h-32 text-indigo-500" />
            </div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-3">
                <span className="text-2xl">🧪</span>
                Power-up Lab
              </h3>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-indigo-100 dark:border-indigo-700">
                  <Zap className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{xp} XP</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
              {[
                { id: 'freeze', name: 'Time Freeze', desc: 'Stops clock for 5s', icon: <ClockIcon className="w-5 h-5" />, cost: 200, color: 'blue' },
                { id: 'fiftyFifty', name: '50:50', desc: 'Removes 2 options', icon: <CircleIcon className="w-5 h-5" />, cost: 300, color: 'purple' },
                { id: 'revive', name: 'Revive Heart', desc: 'Get +1 life', icon: <HeartIcon className="w-5 h-5" />, cost: 500, color: 'rose' }
              ].map(pw => (
                <div key={pw.name} className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-3 rounded-2xl bg-${pw.color}-50 dark:bg-${pw.color}-900/20 text-${pw.color}-500`}>
                      {pw.icon}
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-gray-400">Inventory</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">{powerups[pw.id] || 0}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase mb-1">{pw.name}</h4>
                    <p className="text-[10px] text-gray-500 mb-4">{pw.desc}</p>
                    <button 
                      onClick={() => purchasePowerup(pw.id)}
                      className={`w-full py-2.5 rounded-xl bg-gray-900 dark:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 ${xp < pw.cost ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                      Buy for {pw.cost} XP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Badges Section - Gaming Grid */}
          <motion.div 
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="p-8 rounded-[2.5rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-3">
                <span className="text-2xl">🏅</span>
                Trophy Case
              </h3>
              <span className="text-xs font-black px-4 py-1.5 bg-gradient-to-r from-purple-100 to-fuchsia-100 dark:from-purple-900/30 dark:to-fuchsia-900/30 rounded-full text-purple-700 dark:text-purple-300">
                {unlockedBadges} / {totalBadges} Unlocked
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Object.values(BADGES).map(badge => {
                const isUnlocked = badges.some(b => b.id === badge.id);
                const IconComponent = IconMap[badge.icon] || Trophy;

                return (
                  <motion.div 
                    key={badge.id}
                    whileHover={isUnlocked ? { scale: 1.05, y: -4 } : { scale: 1.02 }}
                    onClick={() => isUnlocked && setSelectedBadge(selectedBadge?.id === badge.id ? null : badge)}
                    className={`relative p-5 rounded-2xl border-2 flex flex-col items-center text-center gap-3 transition-all cursor-pointer ${
                      isUnlocked 
                        ? 'border-yellow-300 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/15 dark:to-amber-900/15 shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20' 
                        : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-50 grayscale'
                    }`}
                  >
                    <motion.div 
                      animate={isUnlocked ? { rotate: [0, 5, -5, 0] } : {}}
                      transition={{ repeat: Infinity, duration: 4, delay: Math.random() * 2 }}
                      className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                        isUnlocked ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      }`}
                    >
                      <IconComponent className="w-7 h-7" />
                    </motion.div>
                    <div>
                      <h4 className={`text-xs font-black uppercase tracking-wide ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{badge.name}</h4>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">{badge.description}</p>
                    </div>
                    {isUnlocked && (
                      <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-lg"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Selected Badge Detail */}
            <AnimatePresence>
              {selectedBadge && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-6 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🏆</span>
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white uppercase text-sm">{selectedBadge.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{selectedBadge.description}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Right Column: Streak & Daily Quests */}
        <div className="space-y-6">
          {/* Daily Streak Card */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="p-6 rounded-[2.5rem] bg-gradient-to-br from-orange-400 via-red-500 to-rose-600 text-white shadow-xl shadow-red-500/20 overflow-hidden relative"
          >
            <div className="absolute -top-10 -right-10 opacity-15">
              <FlameIcon className="w-48 h-48" />
            </div>
            <div className="absolute bottom-4 left-4 opacity-10 text-6xl">🔥</div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3 font-bold text-orange-100">
                <Calendar className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Current Streak</span>
              </div>
              <div className="flex items-baseline gap-3 mb-4">
                <motion.span 
                  key={streak}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-black"
                >{streak}</motion.span>
                <span className="text-xl font-bold text-orange-100">Days</span>
              </div>
              <div className="flex gap-1.5 mb-4">
                {[...Array(7)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-2 flex-1 rounded-full transition-all ${i < streak % 7 ? 'bg-white shadow-sm' : 'bg-white/20'}`}
                  />
                ))}
              </div>
              <p className="text-sm text-orange-100 opacity-90 leading-relaxed">
                {streak === 0 ? 'Start your streak today! Practice daily to earn bonus XP.' :
                 streak < 3 ? 'Keep it up! 3-day streak unlocks a badge.' :
                 streak < 7 ? `${7 - streak} more days for the Unstoppable badge!` :
                 '🎉 You\'re unstoppable! Keep the momentum going!'}
              </p>
            </div>
          </motion.div>

          {/* Daily Quests */}
          <motion.div 
             initial={{ x: 20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.35 }}
             className="p-6 rounded-[2.5rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚔️</span>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">Daily Quests</h3>
              </div>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                {completedChallenges}/{totalChallenges} Done
              </span>
            </div>
            
            <div className="space-y-3">
              {dailyChallenges.map((challenge, idx) => (
                <motion.div 
                  key={challenge.id}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    challenge.completed 
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10' 
                      : 'border-gray-100 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {challenge.completed ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                        </motion.div>
                      ) : (
                        <CircleIcon className="w-5 h-5 text-gray-300 dark:text-gray-600 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${challenge.completed ? 'text-emerald-800 dark:text-emerald-200 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                          {challenge.text}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            +{challenge.xpReward} XP
                          </span>
                          <span className="text-[10px] font-bold text-gray-500">
                            {challenge.progress}/{challenge.target}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Quest Progress Bar */}
                  {!challenge.completed && (
                    <div className="mt-3 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Motivational Card */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-[2.5rem] bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden shadow-xl"
          >
            <div className="absolute -top-6 -right-6 opacity-10">
              <Sparkles className="w-32 h-32" />
            </div>
            <div className="relative z-10 space-y-3">
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">💡 Pro Tip</p>
              <p className="text-sm font-medium text-gray-300 leading-relaxed">
                {streak >= 7 ? 'You\'re in the top tier of dedicated learners. Your consistency will pay off!' :
                 streak >= 3 ? 'Great streak! Try completing all daily quests for maximum XP gains.' :
                 'Complete daily quests and maintain your streak to level up faster. Every practice session counts!'}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Helper icons
const FlameIcon = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
);

export default GamificationDashboard;
