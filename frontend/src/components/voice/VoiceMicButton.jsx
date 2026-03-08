import React from 'react';
import { motion } from 'framer-motion';

const VoiceMicButton = ({ voiceState = 'idle', onClick, disabled = false }) => {
    const isListening = voiceState === 'listening';
    const isSpeaking = voiceState === 'speaking';
    const isProcessing = voiceState === 'processing';
    const isDisabled = disabled || isSpeaking || isProcessing;

    const bgColor = isListening
        ? 'bg-red-500'
        : 'bg-blue-600';

    const hoverColor = isListening
        ? 'hover:bg-red-600'
        : 'hover:bg-blue-700';

    const shadowStyle = isListening
        ? '0 0 24px 8px rgba(239,68,68,0.3)'
        : '0 0 16px 4px rgba(37,99,235,0.2)';

    return (
        <div className="relative flex items-center justify-center pt-2 pb-4">
            {/* Pulsing ring – listening */}
            {isListening && (
                <>
                    <motion.div
                        className="absolute rounded-full border-2 border-red-400/30"
                        style={{ width: 84, height: 84 }}
                        animate={{ scale: [1, 1.7], opacity: [0.45, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <motion.div
                        className="absolute rounded-full border-2 border-red-400/20"
                        style={{ width: 84, height: 84 }}
                        animate={{ scale: [1, 2.1], opacity: [0.3, 0] }}
                        transition={{ duration: 1.8, delay: 0.4, repeat: Infinity, ease: 'easeOut' }}
                    />
                </>
            )}

            <motion.button
                onClick={onClick}
                disabled={isDisabled}
                className={`relative z-10 w-[68px] h-[68px] rounded-full flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900/40 ${bgColor} ${!isDisabled ? hoverColor : ''} text-white disabled:opacity-40 disabled:cursor-not-allowed`}
                style={{ boxShadow: isDisabled ? 'none' : shadowStyle }}
                whileTap={!isDisabled ? { scale: 0.9 } : {}}
                whileHover={!isDisabled ? { scale: 1.06 } : {}}
            >
                {isListening ? (
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                ) : isProcessing ? (
                    <svg className="w-7 h-7 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                ) : isSpeaking ? (
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5.586V18.414a1 1 0 01-1.707.707L5.586 15z" />
                    </svg>
                ) : (
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 01-14 0v-2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19v4m-4 0h8" />
                    </svg>
                )}
            </motion.button>
        </div>
    );
};

export default VoiceMicButton;
