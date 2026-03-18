import React, { useState, useEffect, useRef, useCallback } from 'react';
import MessageBubble from '../components/chat/MessageBubble';
import VoiceSidebar from '../components/voice/VoiceSidebar';
import VoiceOrb from '../components/voice/VoiceOrb';
import VoiceMicButton from '../components/voice/VoiceMicButton';
import VoiceStatusIndicator from '../components/voice/VoiceStatusIndicator';
import VoiceActivityBars from '../components/voice/VoiceActivityBars';
import VoiceSparkRing from '../components/voice/VoiceSparkRing';
import useVoiceStore from '../store/voiceStore';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const WAKE_WORDS = ['hey campus', 'campus ai', 'campus a i'];
const STOP_PHRASES = ['stop', 'stop talking', 'campus stop'];

const VoicePage = () => {
    const {
        sendVoiceMessage,
        isStreaming,
        streamingContent,
        createVoiceSession,
        voiceMessages,
        loadVoiceSessions,
        voiceSessions,
        activeVoiceSessionId,
        selectVoiceSession,
        deleteVoiceSession,
        clearActiveVoiceSession,
    } = useVoiceStore();

    const [voiceState, setVoiceState] = useState('idle');
    const [revealedText, setRevealedText] = useState('');
    const [showCursor, setShowCursor] = useState(false);
    const synthRef = useRef(window.speechSynthesis);
    const wasStreamingRef = useRef(false);
    const bottomRef = useRef(null);
    const finalTranscriptRef = useRef('');
    const hasSentRef = useRef(false);
    const activeRecognitionRef = useRef(null);
    const wakeRecognitionRef = useRef(null);
    const voiceSessionRef = useRef(null);
    const wordTimerRef = useRef(null);
    const fullTextRef = useRef('');

    // ── Ref-based function storage to break circular dependencies ──
    const startWakeWordListenerRef = useRef(null);
    const startActiveListeningRef = useRef(null);

    // ── Helper: stop word-by-word animation ──
    const stopWordAnimation = useCallback((showFull = true) => {
        if (wordTimerRef.current) {
            clearInterval(wordTimerRef.current);
            wordTimerRef.current = null;
        }
        setShowCursor(false);
        if (showFull && fullTextRef.current) {
            setRevealedText(fullTextRef.current);
        }
    }, []);

    // Sync voiceSessionRef with store
    useEffect(() => {
        voiceSessionRef.current = activeVoiceSessionId;
    }, [activeVoiceSessionId]);

    // ── Strip markdown for clean TTS output ──
    const stripMarkdown = (md) => {
        return md
            .replace(/^#{1,6}\s+/gm, '')
            .replace(/[=]{3,}/g, '')
            .replace(/[-]{3,}/g, '')
            .replace(/\*{3,}/g, '')
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/__(.+?)__/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            .replace(/_(.+?)_/g, '$1')
            .replace(/~~(.+?)~~/g, '$1')
            .replace(/`{1,3}[^`]*`{1,3}/g, (m) => m.replace(/`/g, ''))
            .replace(/!\[.*?\]\(.*?\)/g, '')
            .replace(/\[(.+?)\]\(.*?\)/g, '$1')
            .replace(/^\s*[-*+]\s+/gm, '')
            .replace(/^\s*\d+\.\s+/gm, '')
            .replace(/>\s?/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    };

    // ── 1. stopWakeWordListener (no dependencies) ──
    const stopWakeWordListener = useCallback(() => {
        if (wakeRecognitionRef.current) {
            console.log('[Voice] Stopping wake word listener');
            const ref = wakeRecognitionRef.current;
            wakeRecognitionRef.current = null;
            try { ref.abort(); } catch { /* ignore */ }
        }
    }, []);

    // ── 2. dispatchTranscript (depends on store functions only) ──
    const dispatchTranscript = useCallback(
        async (transcript) => {
            if (!transcript.trim()) return;

            if (!voiceSessionRef.current) {
                const title = transcript.trim().slice(0, 80);
                const newId = await createVoiceSession(title);
                voiceSessionRef.current = newId;
            }

            setVoiceState('processing');
            await sendVoiceMessage(transcript.trim(), { mode: 'voice' });
        },
        [createVoiceSession, sendVoiceMessage]
    );

    // ── 3. startActiveListening (uses refs to call startWakeWordListener) ──
    const startActiveListening = useCallback(() => {
        if (!SpeechRecognition) return;

        // If AI is speaking, interrupt it
        if (synthRef.current.speaking) {
            console.log('[Voice] Interrupting AI speech');
            synthRef.current.cancel();
        }

        stopWakeWordListener();
        setVoiceState('listening');
        console.log('[Voice] Active listening started — speak your question');

        finalTranscriptRef.current = '';
        hasSentRef.current = false;

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;    // Only final for actual query
        recognition.maxAlternatives = 1;
        recognition.continuous = false;         // Stop after one utterance

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('[Voice] Captured speech:', transcript);
            finalTranscriptRef.current = transcript;
        };

        recognition.onerror = (event) => {
            console.error('[Voice] Active listening error:', event.error);
            finalTranscriptRef.current = '';
            setVoiceState('idle');
            startWakeWordListenerRef.current?.();
        };

        recognition.onend = () => {
            const transcript = finalTranscriptRef.current;
            finalTranscriptRef.current = '';
            console.log('[Voice] Active listening ended, transcript:', transcript);

            if (transcript.trim() && !hasSentRef.current) {
                // Check for stop command
                const isStop = STOP_PHRASES.some((p) =>
                    transcript.toLowerCase().trim().includes(p)
                );
                if (isStop) {
                    console.log('[Voice] Stop command in active listening');
                    synthRef.current.cancel();
                    setVoiceState('idle');
                    startWakeWordListenerRef.current?.();
                    return;
                }

                hasSentRef.current = true;
                dispatchTranscript(transcript);
            } else {
                setVoiceState('idle');
                startWakeWordListenerRef.current?.();
            }
        };

        activeRecognitionRef.current = recognition;
        recognition.start();
    }, [stopWakeWordListener, dispatchTranscript]);

    // ── 4. startWakeWordListener (uses refs to call startActiveListening) ──
    const startWakeWordListener = useCallback(() => {
        if (!SpeechRecognition) {
            console.warn('[Voice] SpeechRecognition not supported');
            return;
        }

        stopWakeWordListener();
        console.log('[Voice] Starting wake word listener...');

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;     // Detect keywords in real-time
        recognition.continuous = true;          // Keep listening continuously
        recognition.maxAlternatives = 1;

        recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript.toLowerCase().trim();
                console.log('[Voice] Detected speech:', transcript, event.results[i].isFinal ? '(final)' : '(interim)');

                // Check for stop command while AI is speaking
                if (synthRef.current.speaking) {
                    const isStop = STOP_PHRASES.some((p) => transcript.includes(p));
                    if (isStop) {
                        console.log('[Voice] Stop command detected — cancelling TTS');
                        synthRef.current.cancel();
                        setVoiceState('wake-listening');
                        return;
                    }
                }

                // Check for wake word (only on final results to avoid false triggers)
                if (event.results[i].isFinal) {
                    const isWake = WAKE_WORDS.some((w) => transcript.includes(w));
                    if (isWake) {
                        console.log('[Voice] Wake word detected! Activating...');
                        stopWakeWordListener();
                        startActiveListeningRef.current?.();
                        return;
                    }
                }
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'no-speech' || event.error === 'aborted') return;
            console.error('[Voice] Wake word error:', event.error);
        };

        recognition.onend = () => {
            console.log('[Voice] Wake listener ended, auto-restarting...');
            setTimeout(() => {
                if (wakeRecognitionRef.current === recognition) {
                    try {
                        recognition.start();
                        console.log('[Voice] Wake listener restarted');
                    } catch (e) {
                        console.warn('[Voice] Could not restart wake listener:', e.message);
                    }
                }
            }, 300);
        };

        wakeRecognitionRef.current = recognition;
        try {
            recognition.start();
            setVoiceState('wake-listening');
            console.log('[Voice] Wake word listener active');
        } catch (e) {
            console.error('[Voice] Failed to start wake listener:', e.message);
        }
    }, [stopWakeWordListener]);

    // ── Keep refs in sync with latest function versions ──
    useEffect(() => {
        startWakeWordListenerRef.current = startWakeWordListener;
    }, [startWakeWordListener]);

    useEffect(() => {
        startActiveListeningRef.current = startActiveListening;
    }, [startActiveListening]);

    // ── 5. speakText (calls startWakeWordListener via direct reference — defined after it) ──
    const speakText = useCallback((text) => {
        const synth = synthRef.current;
        synth.cancel();
        stopWordAnimation(false);

        // Start wake listener BEFORE TTS so it can catch "stop" during speech
        startWakeWordListener();

        // Store the original markdown text for reveal
        fullTextRef.current = text;
        setRevealedText('');
        setShowCursor(true);

        // Build word arrays for mapping cleanText position → original text words
        const originalWords = text.split(/\s+/);
        const cleanText = stripMarkdown(text);

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Sync text reveal with actual speech position
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                // Count how many words have been spoken so far in the clean text
                const spokenPortion = cleanText.substring(0, event.charIndex + (event.charLength || 1));
                const spokenWordCount = spokenPortion.split(/\s+/).filter(Boolean).length;
                // Reveal the same number of words from the original markdown text
                const revealed = originalWords.slice(0, spokenWordCount).join(' ');
                setRevealedText(revealed);
            }
        };

        utterance.onstart = () => {
            console.log('[Voice] TTS started speaking — text synced via onboundary');
            setVoiceState('speaking');
            setShowCursor(true);
        };

        utterance.onend = () => {
            console.log('[Voice] TTS finished speaking');
            stopWordAnimation(true);
            setVoiceState('wake-listening');
        };

        utterance.onerror = () => {
            console.log('[Voice] TTS error or cancelled');
            // On stop command: preserve what's been shown, remove cursor
            setShowCursor(false);
            if (!revealedText) {
                setRevealedText(fullTextRef.current);
            }
            setVoiceState('wake-listening');
        };

        synth.speak(utterance);
    }, [startWakeWordListener, stopWordAnimation]);

    // ── Auto-scroll ──
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [voiceMessages, streamingContent, revealedText]);

    // ── Load sessions on mount ──
    useEffect(() => {
        loadVoiceSessions();
    }, [loadVoiceSessions]);

    // ── Speak AI response when streaming finishes ──
    useEffect(() => {
        if (wasStreamingRef.current && !isStreaming) {
            const lastMsg = voiceMessages[voiceMessages.length - 1];
            if (lastMsg && lastMsg.role === 'assistant') {
                speakText(lastMsg.content);
            }
        }
        wasStreamingRef.current = isStreaming;
        if (isStreaming) setVoiceState('processing');
    }, [isStreaming, voiceMessages, speakText]);

    // ── Cleanup ──
    useEffect(() => {
        return () => {
            stopWakeWordListener();
            stopWordAnimation(false);
            if (activeRecognitionRef.current) activeRecognitionRef.current.abort();
            synthRef.current.cancel();
        };
    }, [stopWakeWordListener, stopWordAnimation]);

    // ── Start wake word listener on mount ──
    useEffect(() => {
        startWakeWordListener();
    }, [startWakeWordListener]);

    // ── Mic button click (manual override) ──
    const handleMicClick = useCallback(() => {
        if (voiceState === 'listening') {
            activeRecognitionRef.current?.stop();
            return;
        }
        if (voiceState === 'speaking') {
            synthRef.current.cancel();
            setVoiceState('idle');
            startWakeWordListener();
            return;
        }
        startActiveListening();
    }, [voiceState, startActiveListening, startWakeWordListener]);

    // ── New session handler ──
    const handleNewSession = useCallback(() => {
        voiceSessionRef.current = null;
        clearActiveVoiceSession();
    }, [clearActiveVoiceSession]);

    // ── Select session handler ──
    const handleSelectSession = useCallback((id) => {
        voiceSessionRef.current = id;
        selectVoiceSession(id);
    }, [selectVoiceSession]);

    const hasMessages = voiceMessages.length > 0;

    // ── Mode indicator config ──
    const modeConfig = {
        idle: { label: 'Idle', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400', dot: 'bg-gray-400' },
        'wake-listening': { label: 'Wake Listening', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', dot: 'bg-green-500 animate-pulse' },
        listening: { label: 'Listening', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', dot: 'bg-red-500 animate-pulse' },
        processing: { label: 'Processing', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-500 animate-pulse' },
        speaking: { label: 'AI Speaking', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', dot: 'bg-blue-500 animate-pulse' },
    };
    const currentMode = modeConfig[voiceState] || modeConfig.idle;

    // ── Voice interaction controls ──
    const voiceControls = (
        <div className="flex flex-col items-center">
            {/* Mode Indicator Badge */}
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 border ${currentMode.bg} border-opacity-50`}>
                <span className={`w-2 h-2 rounded-full ${currentMode.dot}`} />
                <span className={`text-[11px] font-bold uppercase tracking-wider ${currentMode.text}`}>
                    {currentMode.label}
                </span>
            </div>

            {/* Orb + Spark Ring container */}
            <div className="relative flex items-center justify-center" style={{ width: hasMessages ? 240 : 320, height: hasMessages ? 240 : 320 }}>
                <VoiceSparkRing voiceState={voiceState === 'wake-listening' ? 'idle' : voiceState} orbSize={hasMessages ? 120 : 160} />
                <VoiceOrb voiceState={voiceState === 'wake-listening' ? 'idle' : voiceState} size={hasMessages ? 120 : 160} />
            </div>

            <VoiceActivityBars voiceState={voiceState === 'wake-listening' ? 'idle' : voiceState} />
            <VoiceStatusIndicator voiceState={voiceState} />
            <VoiceMicButton voiceState={voiceState === 'wake-listening' ? 'idle' : voiceState} onClick={handleMicClick} />
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-50/30 dark:bg-gray-900/30 gap-3 p-3 animate-fade-in">
            {/* Sidebar */}
            <div className="w-72 flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                <VoiceSidebar
                    voiceState={voiceState}
                    messagesCount={voiceMessages.length}
                    voiceSessions={voiceSessions}
                    activeVoiceSessionId={activeVoiceSessionId}
                    onSelectSession={handleSelectSession}
                    onDeleteSession={deleteVoiceSession}
                    onNewSession={handleNewSession}
                />
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50">
                    <div>
                        <h2 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-wider">Voice Dashboard</h2>
                        <div className="flex items-center gap-1.5 mt-0.5">
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Current Mode</span>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800">
                            Voice Conversation
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {!hasMessages ? (
                        <div className="flex items-center justify-center h-full">
                            {voiceControls}
                        </div>
                    ) : (
                        <div className="px-6 py-4 space-y-4">
                            {voiceMessages.map((msg, i) => {
                                // For the last assistant message during speaking, show synced revealed text
                                const isLastAssistant = msg.role === 'assistant' && i === voiceMessages.length - 1;
                                const isSpeaking = voiceState === 'speaking';
                                let displayContent = msg.content;

                                if (isLastAssistant && isSpeaking && revealedText) {
                                    // Append cursor inline with the text
                                    displayContent = revealedText + (showCursor ? ' ▌' : '');
                                }

                                return (
                                    <MessageBubble
                                        key={i}
                                        role={msg.role}
                                        content={displayContent}
                                        isUser={msg.role === 'user'}
                                    />
                                );
                            })}
                            {isStreaming && streamingContent && (
                                <MessageBubble
                                    role="assistant"
                                    content={streamingContent}
                                    isUser={false}
                                />
                            )}
                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>

                {/* Bottom controls (shown when messages exist) */}
                {hasMessages && (
                    <div className="border-t border-gray-100 dark:border-gray-700 py-4 bg-gray-50/30 dark:bg-gray-800/50">
                        {voiceControls}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoicePage;
