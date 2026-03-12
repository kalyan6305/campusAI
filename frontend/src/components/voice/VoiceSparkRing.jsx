import React, { useRef, useEffect, useMemo } from 'react';

/**
 * VoiceSparkRing – canvas-based radial spark particles around the voice orb.
 *
 * Props:
 *   voiceState  : 'idle' | 'listening' | 'processing' | 'speaking'
 *   orbSize     : diameter of the center orb (px)
 */
const PARTICLE_COUNT = 90;
const TAU = Math.PI * 2;

function makeParticles(count, ringRadius) {
    return Array.from({ length: count }, (_, i) => ({
        angle: (TAU / count) * i + Math.random() * 0.3,
        radius: ringRadius + (Math.random() - 0.5) * 18,
        baseRadius: ringRadius,
        speed: 0.002 + Math.random() * 0.004,        // radians per frame
        size: 1.5 + Math.random() * 2.5,
        baseSize: 1.5 + Math.random() * 2.5,
        // blue → purple gradient
        hue: 220 + Math.random() * 60,                // 220 = blue, 280 = purple
        saturation: 70 + Math.random() * 30,
        lightness: 55 + Math.random() * 25,
        opacity: 0.3 + Math.random() * 0.5,
        baseOpacity: 0.3 + Math.random() * 0.5,
        phase: Math.random() * TAU,                   // for per-particle shimmer
    }));
}

const VoiceSparkRing = ({ voiceState = 'idle', orbSize = 160 }) => {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const frameRef = useRef(0);

    const canvasSize = orbSize * 2.4;
    const ringRadius = orbSize * 0.52;

    const particles = useMemo(() => makeParticles(PARTICLE_COUNT, ringRadius), [ringRadius]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasSize * dpr;
        canvas.height = canvasSize * dpr;
        ctx.scale(dpr, dpr);

        const cx = canvasSize / 2;
        const cy = canvasSize / 2;

        const draw = () => {
            frameRef.current++;
            const f = frameRef.current;
            ctx.clearRect(0, 0, canvasSize, canvasSize);

            // State-driven parameters
            let speedMul, sizeMul, opacityMul, glowAlpha;
            switch (voiceState) {
                case 'speaking':
                    speedMul = 3.0;
                    sizeMul = 1.8;
                    opacityMul = 1.0;
                    glowAlpha = 0.25;
                    break;
                case 'listening':
                    speedMul = 1.5;
                    sizeMul = 1.3;
                    opacityMul = 0.8;
                    glowAlpha = 0.15;
                    break;
                case 'processing':
                    speedMul = 2.0;
                    sizeMul = 1.4;
                    opacityMul = 0.9;
                    glowAlpha = 0.2;
                    break;
                default: // idle
                    speedMul = 0.4;
                    sizeMul = 0.7;
                    opacityMul = 0.35;
                    glowAlpha = 0.05;
            }

            // Center glow
            if (glowAlpha > 0.02) {
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, ringRadius * 1.2);
                grad.addColorStop(0, `rgba(99, 102, 241, ${glowAlpha})`);
                grad.addColorStop(0.5, `rgba(139, 92, 246, ${glowAlpha * 0.5})`);
                grad.addColorStop(1, 'rgba(139, 92, 246, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, ringRadius * 1.2, 0, TAU);
                ctx.fill();
            }

            // Draw particles
            for (const p of particles) {
                // Advance angle
                p.angle += p.speed * speedMul;

                // Shimmer: oscillate radius, size, opacity
                const shimmer = Math.sin(f * 0.04 + p.phase);
                const r = p.baseRadius + shimmer * 8 * sizeMul;
                const sz = p.baseSize * sizeMul * (0.8 + shimmer * 0.3);
                const op = Math.min(1, p.baseOpacity * opacityMul * (0.7 + shimmer * 0.3));

                const x = cx + Math.cos(p.angle) * r;
                const y = cy + Math.sin(p.angle) * r;

                // Spark glow
                if (voiceState === 'speaking' && sz > 2.5) {
                    ctx.beginPath();
                    ctx.arc(x, y, sz * 2.5, 0, TAU);
                    ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${op * 0.15})`;
                    ctx.fill();
                }

                // Core dot
                ctx.beginPath();
                ctx.arc(x, y, sz, 0, TAU);
                ctx.fillStyle = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${op})`;
                ctx.fill();
            }

            animRef.current = requestAnimationFrame(draw);
        };

        animRef.current = requestAnimationFrame(draw);

        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [voiceState, canvasSize, particles]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute pointer-events-none"
            style={{
                width: canvasSize,
                height: canvasSize,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            }}
        />
    );
};

export default VoiceSparkRing;
