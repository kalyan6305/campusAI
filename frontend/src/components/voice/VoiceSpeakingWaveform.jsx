import React from 'react';

const VoiceSpeakingWaveform = ({ isActive = false }) => {
    if (!isActive) return null;

    const bars = [
        { delay: '0s', height: '60%' },
        { delay: '0.15s', height: '80%' },
        { delay: '0.3s', height: '100%' },
        { delay: '0.15s', height: '70%' },
        { delay: '0s', height: '90%' },
        { delay: '0.2s', height: '50%' },
        { delay: '0.1s', height: '75%' },
        { delay: '0.25s', height: '85%' },
        { delay: '0.05s', height: '65%' },
    ];

    return (
        <div className="flex items-center justify-center gap-[3px] h-10 px-4 py-2 my-2">
            {bars.map((bar, i) => (
                <div
                    key={i}
                    className="w-[3px] rounded-full bg-gradient-to-t from-blue-500 to-cyan-400"
                    style={{
                        height: bar.height,
                        animation: `waveformBounce 0.6s ease-in-out ${bar.delay} infinite alternate`,
                    }}
                />
            ))}
            <style>{`
                @keyframes waveformBounce {
                    0% {
                        transform: scaleY(0.3);
                        opacity: 0.5;
                    }
                    100% {
                        transform: scaleY(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
};

export default VoiceSpeakingWaveform;
