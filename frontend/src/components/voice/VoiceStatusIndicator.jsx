import React from 'react';
import { motion } from 'framer-motion';

const VoiceStatusIndicator = ({ voiceState = 'idle' }) => {
    const config = {
        idle: {
            text: 'Tap the mic to start speaking',
            dotColor: 'bg-green-400',
        },
        'wake-listening': {
            text: 'Say "Hey Campus" to start',
            dotColor: 'bg-green-400',
        },
        listening: {
            text: 'Listening...',
            dotColor: 'bg-red-400',
        },
        processing: {
            text: 'Processing your request...',
            dotColor: 'bg-yellow-400',
        },
        speaking: {
            text: 'AI speaking...',
            dotColor: 'bg-blue-400',
        },
    };

    const state = config[voiceState] || config.idle;

    return (
        <motion.div
            className="flex items-center justify-center gap-2.5 py-1"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            key={voiceState}
            transition={{ duration: 0.25 }}
        >
            <span className={`w-2 h-2 rounded-full ${state.dotColor} ${voiceState !== 'idle' ? 'animate-pulse' : ''}`} />
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500 tracking-wide">
                {state.text}
            </p>
        </motion.div>
    );
};

export default VoiceStatusIndicator;
