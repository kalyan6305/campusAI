import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { Settings, Monitor, Moon, Sun, Palette, Globe, Check } from 'lucide-react';

const GeneralSettingsModal = ({ isOpen, onClose }) => {
    const { user, updateProfile } = useAuthStore();
    const { appearance, setAppearance, accentColor, setAccentColor } = useThemeStore();
    const [isSaving, setIsSaving] = useState(false);

    const [settings, setSettings] = useState({
        appearance: appearance,
        accent_color: accentColor,
        language: 'english'
    });

    useEffect(() => {
        if (user) {
            setSettings({
                appearance: user.appearance || appearance,
                accent_color: user.accent_color || accentColor,
                language: user.language || 'english'
            });
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    const languages = [
        { id: 'english', label: 'English' },
        { id: 'telugu', label: 'Telugu (తెలుగు)' },
        { id: 'hindi', label: 'Hindi (हिन्दी)' },
        { id: 'spanish', label: 'Spanish' },
        { id: 'french', label: 'French' },
        { id: 'german', label: 'German' }
    ];

    const accentColors = [
        { id: 'blue', color: 'bg-blue-500' },
        { id: 'purple', color: 'bg-purple-500' },
        { id: 'green', color: 'bg-green-500' },
        { id: 'orange', color: 'bg-orange-500' },
        { id: 'rose', color: 'bg-rose-500' }
    ];

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update local stores first for instant feedback
            setAppearance(settings.appearance);
            setAccentColor(settings.accent_color);

            // Persist to backend
            await updateProfile({
                appearance: settings.appearance,
                accent_color: settings.accent_color,
                language: settings.language
            });
            onClose();
        } catch (err) {
            console.error("Failed to save settings", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>

            <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-slide-up">
                <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                            <Settings className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">General Settings</h2>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Interface & Language Preferences</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Appearance */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Monitor className="w-3 h-3" /> Appearance
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
                                { id: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
                                { id: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' }
                            ].map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => setSettings({ ...settings, appearance: mode.id })}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${settings.appearance === mode.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                            : 'border-gray-50 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 text-gray-500'
                                        }`}
                                >
                                    {mode.icon}
                                    <span className="text-[10px] font-black uppercase">{mode.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Accent Color */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Palette className="w-3 h-3" /> Accent Color
                        </label>
                        <div className="flex items-center gap-3 px-2">
                            {accentColors.map(color => (
                                <button
                                    key={color.id}
                                    onClick={() => setSettings({ ...settings, accent_color: color.id })}
                                    className={`w-8 h-8 rounded-full ${color.color} flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative`}
                                >
                                    {settings.accent_color === color.id && <Check className="w-4 h-4 text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Language */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Globe className="w-3 h-3" /> AI Language Target
                        </label>
                        <select
                            value={settings.language}
                            onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all appearance-none cursor-pointer"
                        >
                            <option value="auto">Auto Detect</option>
                            {languages.map(lang => (
                                <option key={lang.id} value={lang.id}>{lang.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-4">
                        <button onClick={onClose} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600">Cancel</button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save Preferences'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralSettingsModal;
