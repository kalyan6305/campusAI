import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
    persist(
        (set) => ({
            theme: 'light', // 'light' or 'dark'
            appearance: 'system', // 'light', 'dark', 'system'
            accentColor: 'blue', // 'blue', 'purple', 'green', 'orange', 'rose'
            
            toggleTheme: () => set((state) => ({ 
                theme: state.theme === 'light' ? 'dark' : 'light' 
            })),
            
            setTheme: (theme) => set({ theme }),
            
            setAppearance: (appearance) => {
                set({ appearance });
                if (appearance === 'system') {
                    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    set({ theme: isDark ? 'dark' : 'light' });
                } else {
                    set({ theme: appearance });
                }
            },
            
            setAccentColor: (accentColor) => set({ accentColor }),
        }),
        {
            name: 'theme-storage',
        }
    )
);

export default useThemeStore;
