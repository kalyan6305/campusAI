import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BAR_COUNT = 5;

const VoiceActivityBars = ({ voiceState = 'idle' }) => {
    const isListening = voiceState === 'listening';
    const isSpeaking = voiceState === 'speaking';
    const isProcessing = voiceState === 'processing';
    const isActive = isListening || isSpeaking;

    // Heights and delays per bar (center bar tallest)
    const barConfigs = [
        { minH: 6, maxH: 14, delay: 0.0 },
        { minH: 8, maxH: 22, delay: 0.1 },
        { minH: 10, maxH: 28, delay: 0.2 },
        { minH: 8, maxH: 22, delay: 0.15 },
        { minH: 6, maxH: 14, delay: 0.05 },
    ];

    const barColor = isListening
        ? 'bg-red-400'
        : isSpeaking
            ? 'bg-blue-400'
            : 'bg-gray-300 dark:bg-gray-600';

    const duration = isListening ? 0.4 : isSpeaking ? 0.6 : 1.2;

    return (
        <div className="flex items-end justify-center gap-1 h-8 py-1">
            {barConfigs.map((cfg, i) => (
                <motion.div
                    key={i}
                    className={`w-1 rounded-full ${barColor}`}
                    animate={
                        isActive
                            ? {
                                height: [cfg.minH, cfg.maxH, cfg.minH],
                            }
                            : isProcessing
                                ? {
                                    height: [cfg.minH, cfg.minH + 4, cfg.minH],
                                    opacity: [0.4, 0.7, 0.4],
                                }
                                : { height: cfg.minH }
                    }
                    transition={{
                        duration,
                        delay: cfg.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    style={{ height: cfg.minH }}
                />
            ))}
        </div>
    );
};

export default VoiceActivityBars;
