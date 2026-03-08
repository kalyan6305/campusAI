import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PARTICLE_COUNT = 8;

const VoiceOrb = ({ voiceState = 'idle', size = 150 }) => {
    const isListening = voiceState === 'listening';
    const isSpeaking = voiceState === 'speaking';
    const isProcessing = voiceState === 'processing';

    const orbDiameter = size * 0.55;

    // Generate stable particle positions
    const particles = useMemo(() => {
        return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
            const angle = (i / PARTICLE_COUNT) * 360;
            const radius = size * 0.35 + Math.random() * size * 0.1;
            const x = Math.cos((angle * Math.PI) / 180) * radius;
            const y = Math.sin((angle * Math.PI) / 180) * radius;
            const dotSize = 3 + Math.random() * 5;
            const delay = Math.random() * 3;
            const duration = 3 + Math.random() * 3;
            return { id: i, x, y, dotSize, delay, duration };
        });
    }, [size]);

    // State-driven configs
    const orbScale = isListening ? 1.1 : isSpeaking ? 1.05 : isProcessing ? 1.02 : 1;
    const pulseDuration = isListening ? 1.2 : isSpeaking ? 2 : isProcessing ? 1.8 : 4;
    const glowAlpha = isListening ? 0.25 : isSpeaking ? 0.2 : 0.1;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            {/* ── Floating particles ── */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        width: p.dotSize,
                        height: p.dotSize,
                        background: 'radial-gradient(circle, rgba(129,140,248,0.7), rgba(124,58,237,0.2))',
                        boxShadow: `0 0 ${p.dotSize * 1.5}px rgba(99,102,241,0.3)`,
                        left: `calc(50% + ${p.x}px)`,
                        top: `calc(50% + ${p.y}px)`,
                    }}
                    animate={{
                        y: [0, -p.y * 0.12, p.y * 0.06, 0],
                        x: [0, p.x * 0.06, -p.x * 0.1, 0],
                        scale: isListening
                            ? [1, 1.6, 1.2, 1]
                            : isSpeaking
                                ? [1, 1.3, 1]
                                : [1, 1.1, 1],
                        opacity: [0.25, 0.65, 0.4, 0.25],
                    }}
                    transition={{
                        duration: isListening ? p.duration * 0.5 : p.duration,
                        delay: p.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}

            {/* ── Outer ambient glow ── */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: size * 0.85,
                    height: size * 0.85,
                    background: `radial-gradient(circle, rgba(99,102,241,${glowAlpha}), transparent 70%)`,
                }}
                animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.55, 0.3] }}
                transition={{ duration: pulseDuration, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* ── Processing rotation ring ── */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        className="absolute rounded-full border-2 border-transparent"
                        style={{
                            width: orbDiameter + 20,
                            height: orbDiameter + 20,
                            borderTopColor: 'rgba(99,102,241,0.5)',
                            borderRightColor: 'rgba(124,58,237,0.25)',
                        }}
                        initial={{ rotate: 0, opacity: 0 }}
                        animate={{ rotate: 360, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ rotate: { duration: 1.5, repeat: Infinity, ease: 'linear' }, opacity: { duration: 0.3 } }}
                    />
                )}
            </AnimatePresence>

            {/* ── Main Orb ── */}
            <motion.div
                className="voice-orb-gradient rounded-full relative z-10"
                style={{ width: orbDiameter, height: orbDiameter }}
                animate={{
                    scale: [orbScale * 0.95, orbScale * 1.05, orbScale * 0.95],
                }}
                transition={{
                    duration: pulseDuration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            >
                {/* Inner specular highlight */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.18), transparent 55%)',
                    }}
                />
            </motion.div>

            {/* ── Speaking wave rings ── */}
            <AnimatePresence>
                {isSpeaking && (
                    <>
                        {[0, 0.6, 1.2].map((delay) => (
                            <motion.div
                                key={delay}
                                className="absolute rounded-full border border-indigo-400/25"
                                style={{ width: orbDiameter, height: orbDiameter }}
                                initial={{ scale: 1, opacity: 0.35 }}
                                animate={{ scale: 2.2, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                    duration: 2,
                                    delay,
                                    repeat: Infinity,
                                    ease: 'easeOut',
                                }}
                            />
                        ))}
                    </>
                )}
            </AnimatePresence>

            {/* ── State-specific glow halo ── */}
            <motion.div
                className="absolute rounded-full z-0"
                style={{ width: size * 0.65, height: size * 0.65 }}
                animate={{
                    boxShadow: isListening
                        ? [
                            '0 0 25px 8px rgba(239,68,68,0.25)',
                            '0 0 50px 16px rgba(239,68,68,0.35)',
                            '0 0 25px 8px rgba(239,68,68,0.25)',
                        ]
                        : isSpeaking
                            ? [
                                '0 0 30px 10px rgba(99,102,241,0.3)',
                                '0 0 60px 18px rgba(99,102,241,0.4)',
                                '0 0 30px 10px rgba(99,102,241,0.3)',
                            ]
                            : isProcessing
                                ? [
                                    '0 0 20px 6px rgba(234,179,8,0.2)',
                                    '0 0 40px 12px rgba(234,179,8,0.3)',
                                    '0 0 20px 6px rgba(234,179,8,0.2)',
                                ]
                                : [
                                    '0 0 18px 6px rgba(99,102,241,0.12)',
                                    '0 0 35px 10px rgba(124,58,237,0.08)',
                                    '0 0 18px 6px rgba(99,102,241,0.12)',
                                ],
                }}
                transition={{ duration: pulseDuration, repeat: Infinity, ease: 'easeInOut' }}
            />
        </div>
    );
};

export default VoiceOrb;
