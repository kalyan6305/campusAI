/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f4f7f6',
                    100: '#e9eeed',
                    200: '#cedada',
                    300: '#9ab5ae',
                    400: '#738e8a',
                    500: '#4c6665',
                    600: '#3e5352',
                    700: '#2f403f',
                    800: '#212c2c',
                    900: '#131919',
                    950: '#0a0d0d',
                },
                surface: {
                    50: '#f7f7f6',
                    100: '#dbdad5',
                    200: '#c2c1bd',
                    700: '#00335e',
                    800: '#002646',
                    900: '#00192f',
                    950: '#000c17',
                },
                accent: {
                    brown: '#a26d5d',
                },
            },
            fontFamily: {
                sans: ['Winky Sans', 'system-ui', 'sans-serif'],
                syne: ['Syne', 'sans-serif'],
                'dm-sans': ['DM Sans', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-in-left': 'slideInLeft 0.3s ease-out',
                'orb-breathe': 'orbBreathe 4s ease-in-out infinite',
                'orb-breathe-fast': 'orbBreatheFast 2s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow-pulse': 'glowPulse 2s ease-in-out infinite',
                'wave-ring': 'waveRing 1.5s ease-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInLeft: {
                    '0%': { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                orbBreathe: {
                    '0%, 100%': { transform: 'scale(0.95)' },
                    '50%': { transform: 'scale(1.05)' },
                },
                orbBreatheFast: {
                    '0%, 100%': { transform: 'scale(0.97)' },
                    '50%': { transform: 'scale(1.12)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0) translateX(0)' },
                    '25%': { transform: 'translateY(-12px) translateX(6px)' },
                    '50%': { transform: 'translateY(-4px) translateX(-8px)' },
                    '75%': { transform: 'translateY(8px) translateX(4px)' },
                },
                glowPulse: {
                    '0%, 100%': { opacity: '0.4' },
                    '50%': { opacity: '0.8' },
                },
                waveRing: {
                    '0%': { transform: 'scale(1)', opacity: '0.6' },
                    '100%': { transform: 'scale(2.5)', opacity: '0' },
                },
            },
        },
    },
    plugins: [],
};
