import React from 'react';

const VoiceSidebar = ({
    voiceState = 'idle',
    messagesCount = 0,
    voiceSessions = [],
    activeVoiceSessionId = null,
    onSelectSession,
    onDeleteSession,
    onNewSession,
}) => {
    const stateConfig = {
        idle: { label: 'Idle', dot: 'bg-gray-400', text: 'text-gray-500 dark:text-gray-400' },
        'wake-listening': { label: 'Wake Listening', dot: 'bg-green-500 animate-pulse', text: 'text-green-600 dark:text-green-400' },
        listening: { label: 'Listening', dot: 'bg-red-500 animate-pulse', text: 'text-red-600 dark:text-red-400' },
        speaking: { label: 'Speaking', dot: 'bg-blue-500 animate-pulse', text: 'text-blue-600 dark:text-blue-400' },
        processing: { label: 'Processing', dot: 'bg-yellow-500 animate-pulse', text: 'text-yellow-600 dark:text-yellow-400' },
    };

    const state = stateConfig[voiceState] || stateConfig.idle;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in overflow-hidden font-sans">
            {/* Header */}
            <div className="p-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/30">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">Active Tool</p>
                        <p className="text-[16px] font-black text-gray-900 dark:text-gray-100 mt-0.5">Voice Mode</p>
                    </div>
                    <button
                        onClick={onNewSession}
                        className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        title="New voice session"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                    <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">AI Voice Assistant Active</span>
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-4">
                {/* Mic Status */}
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 tracking-[0.18em] uppercase">Mic Status</p>
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${state.dot}`} />
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${state.text}`}>
                            {state.label}
                        </span>
                    </div>
                </div>

                {/* Voice Activity */}
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 tracking-[0.18em] uppercase">Voice Activity</p>
                    <div className="flex items-end justify-center gap-1 h-10 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
                        {[0, 150, 300, 100, 200].map((delay, i) => (
                            <div
                                key={i}
                                className={`w-1 rounded-full transition-all duration-300 ${
                                    voiceState === 'listening'
                                        ? 'bg-red-400 animate-bounce'
                                        : voiceState === 'speaking'
                                            ? 'bg-blue-400 animate-bounce'
                                            : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                                style={{
                                    height: voiceState === 'idle' || voiceState === 'wake-listening' ? '8px' : `${12 + Math.random() * 14}px`,
                                    animationDelay: `${delay}ms`,
                                    animationDuration: voiceState === 'idle' || voiceState === 'wake-listening' ? '0s' : '0.6s',
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Voice History */}
                <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 tracking-[0.18em] uppercase">Voice History</p>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-1">
                        {voiceSessions.length === 0 ? (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 italic px-2 py-3 text-center">
                                No voice sessions yet
                            </p>
                        ) : (
                            voiceSessions.map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => onSelectSession?.(session.id)}
                                    className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                        session.id === activeVoiceSessionId
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                                            : 'border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="text-[10px] flex-shrink-0">🎙️</span>
                                        <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate font-medium">
                                            {session.title}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteSession?.(session.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5"
                                        title="Delete session"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[9px] font-bold text-green-500 dark:text-green-400 uppercase tracking-widest">
                        Voice Mode
                    </span>
                </div>
                {messagesCount > 0 && (
                    <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        {messagesCount} message{messagesCount !== 1 ? 's' : ''}
                    </span>
                )}
            </div>
        </div>
    );
};

export default VoiceSidebar;
