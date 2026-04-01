/**
 * LiveInterviewSession.jsx
 * 
 * A fully interactive AI-driven mock interview experience:
 * - Live webcam feed (getUserMedia) shown in a Zoom-style layout
 * - AI "avatar" panel with speaking animation
 * - Questions spoken aloud via Web Speech API (TTS)
 * - Adaptive follow-up questions via /interview/dynamic-question
 * - Multi-modal answer capture: voice (STT) + text
 * - Realistic thinking pauses between questions
 * - Handoff to existing MockReport when done
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { interviewAPI } from '../../services/api';
import { useGamificationStore } from '../../store/gamificationStore';
import { Clock, Mic, MicOff, Video, VideoOff, ChevronRight } from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────── */
const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/* ─── AI avatar SVG ──────────────────────────────────── */
const AIAvatar = ({ isSpeaking }) => (
    <div className={`relative flex items-center justify-center w-full h-full rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 overflow-hidden transition-all ${isSpeaking ? 'shadow-[0_0_40px_rgba(99,102,241,0.6)]' : ''}`}>
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
        
        {/* Avatar icon */}
        <div className="relative z-10 flex flex-col items-center gap-3">
            <div className={`w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-4xl transition-transform ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
                🤖
            </div>
            <span className="text-white/80 text-xs font-bold uppercase tracking-widest">AI Interviewer</span>

            {/* Speaking indicator dots */}
            {isSpeaking && (
                <div className="flex items-end gap-1 h-5">
                    {[0.2, 0.5, 0.8, 0.5, 0.2].map((d, i) => (
                        <div
                            key={i}
                            className="w-1.5 bg-white rounded-full animate-bounce"
                            style={{ animationDelay: `${d}s`, height: `${8 + i * 4}px` }}
                        />
                    ))}
                </div>
            )}
        </div>
    </div>
);

/* ─── main component ─────────────────────────────────── */
const LiveInterviewSession = ({
    mockConfig,
    company,
    onFinish,   // (questions, responses) => void
    onCancel,
}) => {
    // ── session state ──────────────────────────────────
    const [phase, setPhase] = useState('thinking'); // thinking | speaking | listening | submitting
    const [history, setHistory] = useState([]);     // [{question, answer}]
    const { addXP, updateChallengeProgress } = useGamificationStore();
    const [currentQ, setCurrentQ] = useState(null); // {question, topic, difficulty, is_follow_up, follow_up_reason}
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [timer, setTimer] = useState((mockConfig.duration || 15) * 60);
    const [isFinishing, setIsFinishing] = useState(false);
    const [cameraError, setCameraError] = useState(null);

    const totalQuestions = Math.max(3, Math.round((mockConfig.duration || 15) / 1.5));

    // ── video refs ─────────────────────────────────────
    const userVideoRef = useRef(null);
    const streamRef = useRef(null);
    const recognitionRef = useRef(null);
    const timerRef = useRef(null);
    const synthRef = useRef(null);
    const [isCamOn, setIsCamOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true); // Now ON by default
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoadingQ, setIsLoadingQ] = useState(false);
    const [micTranscript, setMicTranscript] = useState('');
    const [isDetectingSound, setIsDetectingSound] = useState(false);
    const [micPermissionError, setMicPermissionError] = useState(false);

    /* ─── Timer ─────────────────────────────────────── */
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleFinish();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, []);

    /* ─── Camera/Mic setup ────────────────────────────── */
    useEffect(() => {
        const setupMedia = async () => {
            let stream = null;
            try {
                // Try getting both first
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } catch (err) {
                console.warn("Combined media failed, trying fallback:", err.name);
                try {
                    // Fallback to video only
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    console.log("Fallback to video-only successful");
                } catch (err2) {
                    try {
                        // Fallback to audio only
                        stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                        console.log("Fallback to audio-only successful");
                        setCameraError('No camera found or busy. Audio-only mode enabled.');
                    } catch (err3) {
                        const finalErr = err3.name;
                        console.error("All media attempts failed:", finalErr);
                        
                        if (finalErr === 'NotAllowedError' || finalErr === 'PermissionDeniedError') {
                            setMicPermissionError(true);
                            setCameraError('Permission denied! Please allow Camera/Mic in browser settings.');
                        } else if (finalErr === 'NotFoundError' || finalErr === 'DevicesNotFoundError') {
                            setCameraError('Hardware not found! Plug in a Camera/Mic and refresh.');
                        } else if (finalErr === 'NotReadableError' || finalErr === 'TrackStartError') {
                            setCameraError('Camera/Mic is busy! Check if another app is using them.');
                        } else {
                            setCameraError('Hardware error. Please check your devices and refresh.');
                        }
                        return;
                    }
                }
            }

            if (stream) {
                streamRef.current = stream;
                if (userVideoRef.current) {
                    userVideoRef.current.srcObject = stream;
                }
            }
        };

        setupMedia();
        return () => streamRef.current?.getTracks().forEach(t => t.stop());
    }, []);

    /* ─── TTS helper ─────────────────────────────────── */
    const speak = useCallback((text, onDone) => {
        if (!('speechSynthesis' in window)) { onDone?.(); return; }
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        // Pick a slightly formal voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => /google us|zira|david|alex|daniel/i.test(v.name));
        if (preferred) utt.voice = preferred;
        utt.rate = 0.92;
        utt.pitch = 1.0;
        utt.onstart = () => setIsSpeaking(true);
        utt.onend = () => { setIsSpeaking(false); onDone?.(); };
        utt.onerror = () => { setIsSpeaking(false); onDone?.(); };
        window.speechSynthesis.speak(utt);
        synthRef.current = utt;
    }, []);

    /* ─── STT helpers ────────────────────────────────── */
    const startListening = useCallback(() => {
        if (recognitionRef.current) return;

        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return;
        
        const rec = new SR();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';
        rec.maxAlternatives = 1; // Prioritize the best match
        
        rec.onstart = () => {
            console.log("Speech recognition started");
            setMicPermissionError(false);
        };

        rec.onsoundstart = () => setIsDetectingSound(true);
        rec.onsoundend = () => setIsDetectingSound(false);
        
        rec.onresult = (e) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            // Fixed: Loop from event.resultIndex to only process NEW results
            // This prevents "a", "ab", "abc" type repetitions that occur when looping from 0
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const transcript = e.results[i][0].transcript;
                if (e.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            
            if (finalTranscript) {
                setCurrentAnswer(prev => prev + finalTranscript);
                setMicTranscript(''); // Reset interim displayed text
            } else {
                setMicTranscript(interimTranscript); // Show interim words as they happen
            }
        };
        
        rec.onerror = (err) => {
            console.error("Speech Recognition Error:", err.error);
            if (err.error === 'no-speech' || err.error === 'aborted') return;
            recognitionRef.current = null;
        };
        
        rec.onend = () => {
            console.log("Speech recognition ended");
            recognitionRef.current = null;
            if (isMicOn && phase === 'listening') {
                setTimeout(() => {
                    if (isMicOn && phase === 'listening' && !recognitionRef.current) {
                        try { rec.start(); recognitionRef.current = rec; } catch (e) {}
                    }
                }, 300);
            }
        };

        try {
            rec.start();
            recognitionRef.current = rec;
        } catch (err) {
            console.error("Failed to start speech recognition:", err);
            recognitionRef.current = null;
        }
    }, [isMicOn, phase]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            try { 
                recognitionRef.current.onend = null; // Prevent auto-restart loop
                recognitionRef.current.stop(); 
            } catch (e) {}
            recognitionRef.current = null;
        }
        setMicTranscript('');
        setIsDetectingSound(false);
    }, []);

    // Toggle microphone
    const toggleMic = () => {
        const nextState = !isMicOn;
        setIsMicOn(nextState);
        
        // Directly invoke start/stop to fulfill User Gesture requirements
        if (nextState && phase === 'listening') {
            startListening();
        } else {
            stopListening();
        }
    };

    // Auto-manage recognition based on session phase (e.g. Pause during AI speech)
    useEffect(() => {
        let timeout = null;
        if (isMicOn && phase === 'listening') {
            // Add a slight delay for the browser's audio buffer to reset between questions
            timeout = setTimeout(() => {
                startListening();
            }, 500);
        } else {
            stopListening();
        }
        return () => {
            if (timeout) clearTimeout(timeout);
            stopListening();
        };
    }, [isMicOn, phase, startListening, stopListening]);

    /* ─── Toggle cam ─────────────────────────────────── */
    const toggleCam = () => {
        if (!streamRef.current) return;
        streamRef.current.getVideoTracks().forEach(t => { t.enabled = !isCamOn; });
        setIsCamOn(prev => !prev);
    };

    /* ─── Fetch next question ────────────────────────── */
    const fetchNextQuestion = useCallback(async (hist) => {
        setIsLoadingQ(true);
        setPhase('thinking');
        try {
            const res = await interviewAPI.generateDynamicQuestion(
                mockConfig.role || 'Software Developer',
                company || 'Generic',
                'Technical Interview',
                mockConfig.difficulty || 'Mixed',
                hist,
                totalQuestions,
                hist.length
            );
            const q = res.data;
            setCurrentQ(q);
            setCurrentAnswer('');
            setMicTranscript('');

            // Pause 800ms then speak
            setTimeout(() => {
                setPhase('speaking');
                const prefix = q.is_follow_up && q.follow_up_reason
                    ? `Good attempt. Let me follow up — ${q.question}`
                    : q.question;
                speak(prefix, () => setPhase('listening'));
            }, 800);
        } catch (e) {
            console.error('Failed to fetch question:', e);
            setPhase('listening');
        } finally {
            setIsLoadingQ(false);
        }
    }, [mockConfig, company, totalQuestions, speak]);

    /* ─── Boot: fetch first question ─────────────────── */
    useEffect(() => {
        fetchNextQuestion([]);
    }, []);

    /* ─── Submit answer, fetch next ──────────────────── */
    const submitAnswer = async () => {
        if (!currentQ) return;
        stopListening();
        // Removed: setIsMicOn(false) - Keep it armed for the next question if user wants it ON

        const answer = currentAnswer.trim() || '(No answer provided.)';
        const newHistory = [...history, { question: currentQ.question, answer }];
        setHistory(newHistory);

        // Gamification: Update progress for each question
        updateChallengeProgress(1); // Answer 5 questions
        addXP(20, 'Answered interview question');

        if (newHistory.length >= totalQuestions) {
            handleFinish(newHistory);
            return;
        }
        
        setPhase('thinking');
        await fetchNextQuestion(newHistory);
    };

    /* ─── Finish interview ───────────────────────────── */
    const handleFinish = (hist) => {
        if (isFinishing) return;
        setIsFinishing(true);
        clearInterval(timerRef.current);
        window.speechSynthesis?.cancel();
        stopListening();
        streamRef.current?.getTracks().forEach(t => t.stop());

        const finalHist = hist || history;
        
        // Gamification: Award completion bonus
        updateChallengeProgress(2); // Complete a mock
        addXP(100, 'Mock Interview Completion');
        
        const questions = finalHist.map(h => ({ question: h.question, suggested_answer: '' }));
        const responses = {};
        finalHist.forEach((h, i) => { responses[i] = h.answer; });
        onFinish(questions, responses);
    };

    const qIndex = history.length;
    const progress = (qIndex / totalQuestions) * 100;
    const timerColor = timer < 60 ? 'text-rose-500' : timer < 180 ? 'text-amber-500' : 'text-emerald-500';

    return (
        <div className="fixed inset-0 z-50 bg-gray-950 flex flex-col overflow-hidden">

            {/* ── Top bar ──────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-3 bg-gray-900/80 backdrop-blur border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                    <span className="text-white/70 text-xs font-bold uppercase tracking-widest">Live Interview</span>
                </div>
                <div className="flex items-center gap-6">
                    {/* Progress pill */}
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-1.5 rounded-full">
                        <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Q</span>
                        <span className="text-white text-sm font-black">{Math.min(qIndex + 1, totalQuestions)}</span>
                        <span className="text-white/30 text-xs">/</span>
                        <span className="text-white/50 text-sm font-bold">{totalQuestions}</span>
                    </div>
                    {/* Timer */}
                    <div className={`flex items-center gap-2 font-mono text-lg font-black ${timerColor}`}>
                        <Clock className="w-4 h-4" />
                        {formatTime(timer)}
                    </div>
                </div>
                <button
                    onClick={() => handleFinish()}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                >
                    End Interview
                </button>
            </div>

            {/* ── Progress bar ─────────────────────────── */}
            <div className="h-1 bg-gray-800">
                <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>

            {/* ── Main content area ─────────────────────── */}
            <div className="flex-1 flex gap-4 p-4 min-h-0">

                {/* Left: AI interviewer */}
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    {/* AI Video Panel */}
                    <div className="flex-1 relative rounded-3xl overflow-hidden bg-gray-900 min-h-0">
                        <AIAvatar isSpeaking={isSpeaking} />
                        
                        {/* Overlay info chips */}
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                            {currentQ?.topic && (
                                <span className="bg-indigo-600/80 backdrop-blur text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                    {currentQ.topic}
                                </span>
                            )}
                            {currentQ?.is_follow_up && (
                                <span className="bg-amber-500/80 backdrop-blur text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                    Follow-Up
                                </span>
                            )}
                        </div>

                        {/* Status badge */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                            <div className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-md transition-all ${
                                phase === 'thinking' ? 'bg-gray-800/80 text-white/60' :
                                phase === 'speaking' ? 'bg-indigo-600/90 text-white animate-pulse' :
                                phase === 'listening' ? 'bg-emerald-600/80 text-white' :
                                'bg-gray-700/80 text-white/50'
                            }`}>
                                {phase === 'thinking' ? '⏳ Thinking…' :
                                 phase === 'speaking' ? '🗣 Speaking…' :
                                 phase === 'listening' ? '👂 Your turn' : '⏳'}
                            </div>
                        </div>
                    </div>

                    {/* Question card */}
                    <div className="bg-gray-800/80 backdrop-blur rounded-2xl px-8 py-5 border border-white/5">
                        {isLoadingQ ? (
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin flex-shrink-0" />
                                <span className="text-white/50 text-sm">Generating question…</span>
                            </div>
                        ) : currentQ ? (
                            <p className="text-white text-base font-semibold leading-relaxed">{currentQ.question}</p>
                        ) : (
                            <p className="text-white/30 text-sm">Loading…</p>
                        )}
                    </div>
                </div>

                {/* Right: User camera + answer box */}
                <div className="w-80 flex flex-col gap-4 min-h-0">
                    {/* User video */}
                    <div className="h-52 rounded-3xl overflow-hidden bg-gray-900 border border-white/5 relative flex-shrink-0">
                        {cameraError ? (
                            <div className="flex items-center justify-center h-full text-center p-4">
                                <p className="text-white/40 text-xs">{cameraError}</p>
                            </div>
                        ) : (
                            <video
                                ref={userVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover transition-opacity ${isCamOn ? 'opacity-100' : 'opacity-0'}`}
                            />
                        )}
                        {!isCamOn && !cameraError && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                <VideoOff className="w-8 h-8 text-white/20" />
                            </div>
                        )}
                        <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded-lg text-[9px] text-white/70 font-bold uppercase tracking-widest">
                            You
                        </div>
                    </div>

                    {/* Controls bar */}
                        <div className="flex items-center justify-between gap-3 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={toggleCam}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isCamOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-rose-600 text-white'}`}
                                    title={isCamOn ? 'Turn off camera' : 'Turn on camera'}
                                >
                                    {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={toggleMic}
                                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isMicOn ? 'bg-indigo-600 text-white animate-pulse' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                                    title={isMicOn ? 'Stop listening' : 'Start speaking'}
                                >
                                    {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Sound Activity Indicator */}
                            <div className="flex items-center gap-2 overflow-hidden">
                                {isMicOn && phase === 'listening' && (
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isDetectingSound ? 'bg-emerald-500 scale-125 shadow-[0_0_8px_#10b981]' : 'bg-white/10'}`} />
                                        <span className={`text-[9px] font-black uppercase tracking-widest transition-all ${isDetectingSound ? 'text-emerald-400' : 'text-white/20'}`}>
                                            {isDetectingSound ? 'Hearing you...' : 'Mic Active'}
                                        </span>
                                    </div>
                                )}
                                {!isMicOn && (
                                    <span className="text-white/20 text-[9px] font-bold uppercase tracking-widest">Mic off</span>
                                )}
                            </div>
                        </div>

                        {micPermissionError && (
                            <div className="bg-rose-500/20 border border-rose-500/50 p-3 rounded-xl">
                                <p className="text-rose-400 text-[10px] font-bold leading-tight uppercase tracking-tight">
                                    Microphone access blocked! Please click the camera/lock icon in your address bar to allow.
                                </p>
                            </div>
                        )}

                    {/* Answer textarea */}
                    <div className="flex-1 flex flex-col gap-3 min-h-0">
                        <label className="text-white/40 text-[10px] font-black uppercase tracking-widest">Your Answer</label>
                        <textarea
                            value={currentAnswer + micTranscript}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            placeholder={phase === 'listening' ? 'Type your answer, or click the mic to speak…' : 'Waiting for AI…'}
                            disabled={phase !== 'listening'}
                            className="flex-1 p-4 bg-gray-800 border border-white/5 rounded-2xl text-sm text-white resize-none outline-none focus:border-indigo-500 transition-all placeholder-white/20 min-h-0"
                        />

                        {/* Submit / Next button */}
                        <button
                            onClick={submitAnswer}
                            disabled={phase !== 'listening' || (!currentAnswer.trim() && !micTranscript)}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 ${
                                phase === 'listening' && (currentAnswer.trim() || micTranscript)
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/40'
                                    : 'bg-gray-800 text-white/20 cursor-not-allowed'
                            }`}
                        >
                            {qIndex + 1 >= totalQuestions ? 'Finish Interview' : 'Submit & Next Question'}
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Skip quietly */}
                        {phase === 'listening' && (
                            <button
                                onClick={() => { setCurrentAnswer(''); submitAnswer(); }}
                                className="text-white/20 hover:text-white/40 text-[10px] font-bold uppercase tracking-widest transition-all text-center"
                            >
                                Skip this question →
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveInterviewSession;
