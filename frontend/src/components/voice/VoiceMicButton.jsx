import React from 'react';
import { motion } from 'framer-motion';
import { Square, Loader2, Volume2, Mic } from 'lucide-react';

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
                    <Square className="w-7 h-7 fill-current" />
                ) : isProcessing ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                ) : isSpeaking ? (
                    <Volume2 className="w-7 h-7" />
                ) : (
                    <Mic className="w-7 h-7" />
                )}
            </motion.button>
        </div>
    );
};

export default VoiceMicButton;
