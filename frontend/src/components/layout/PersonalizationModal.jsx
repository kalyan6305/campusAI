import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { Sparkles, User, Briefcase, Info, MessageSquare, X } from 'lucide-react';

const PersonalizationModal = ({ isOpen, onClose }) => {
    const { user, updateProfile } = useAuthStore();
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const [formData, setFormData] = useState({
        nickname: '',
        occupation: '',
        about_me: '',
        custom_instructions: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                nickname: user.nickname || '',
                occupation: user.occupation || '',
                about_me: user.about_me || '',
                custom_instructions: user.custom_instructions || ''
            });
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setStatus({ type: '', message: '' });
        try {
            await updateProfile(formData);
            setStatus({ type: 'success', message: 'Settings updated!' });
            setTimeout(() => {
                setStatus({ type: '', message: '' });
                onClose();
            }, 1500);
        } catch (err) {
            setStatus({ type: 'error', message: 'Failed to update settings.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">AI Personalization</h2>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Customize your assistant's intelligence</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {status.message && (
                        <div className={`p-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-bounce-subtle ${
                            status.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 border border-green-100 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-100 dark:border-red-800'
                        }`}>
                            {status.message}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <User className="w-3 h-3" /> Assistant Call-sign (Nickname)
                            </label>
                            <input 
                                type="text"
                                value={formData.nickname}
                                onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                                placeholder="What should we call you?"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Briefcase className="w-3 h-3" /> Your Tactical Role (Occupation)
                            </label>
                            <input 
                                type="text"
                                value={formData.occupation}
                                onChange={(e) => setFormData({...formData, occupation: e.target.value})}
                                className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                                placeholder="e.g. Lead Researcher, Student"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Info className="w-3 h-3" /> Intel Briefing (About Me)
                        </label>
                        <textarea 
                            value={formData.about_me}
                            onChange={(e) => setFormData({...formData, about_me: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all min-h-[100px]"
                            placeholder="Share some context to help the assistant understand you better..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" /> Operational Directives (Custom Instructions)
                        </label>
                        <textarea 
                            value={formData.custom_instructions}
                            onChange={(e) => setFormData({...formData, custom_instructions: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-900/50 border border-blue-100 dark:border-blue-900/30 rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all min-h-[120px]"
                            placeholder="How should the AI respond? e.g. 'Use technical language', 'Be extremely concise', 'Respond as a professional mentor'"
                        />
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isSaving}
                            className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? 'Processing...' : 'Apply Intelligence Settings'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PersonalizationModal;
