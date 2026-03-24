import React, { useState, useEffect } from 'react';
import useThemeStore from '../store/themeStore';
import useAuthStore from '../store/authStore';
import { authAPI, sessionAPI } from '../services/api';
import { Loader2, CheckCircle2, XCircle, Rocket, GraduationCap, Flame, MessageSquare, School, Wrench, Moon, Sun, Download, Trash2, ArrowRight } from 'lucide-react';

const ProfilePage = () => {
    const { theme, toggleTheme } = useThemeStore();
    const { user, logout, updateProfile } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [resetStatus, setResetStatus] = useState({ type: '', message: '' });

    const [profileData, setProfileData] = useState({
        nickname: user?.nickname || '',
        occupation: user?.occupation || '',
        about_me: user?.about_me || '',
        custom_instructions: user?.custom_instructions || ''
    });
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const fetchDashboardData = async () => {
        try {
            const [statsRes, activityRes] = await Promise.all([
                authAPI.getStats(),
                sessionAPI.list('chat')
            ]);
            setStats(statsRes.data);
            setActivity(activityRes.data.sessions.slice(0, 5));
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetRequest = async () => {
        setResetStatus({ type: 'loading', message: 'Initiating security protocol...' });
        try {
            await authAPI.requestPasswordReset(user.email);
            setResetStatus({
                type: 'success',
                message: 'Reset link sent to your authorized email. Check your inbox.'
            });
            // Clear message after 8s
            setTimeout(() => setResetStatus({ type: '', message: '' }), 8000);
        } catch (err) {
            setResetStatus({
                type: 'error',
                message: 'Failed to initiate reset. Please try again later.'
            });
        }
    };

    const handleClearHistory = async () => {
        if (!window.confirm("CRITICAL: This will permanently wipe all intelligence sessions and telemetry data from official records. Proceed?")) return;

        setResetStatus({ type: 'loading', message: 'Purging historical records...' });
        try {
            await authAPI.deleteHistory();
            setResetStatus({ type: 'success', message: 'Data purged. System state reset.' });
            // Refresh stats and activity
            fetchDashboardData();
        } catch (err) {
            setResetStatus({ type: 'error', message: 'Purge failed. Protocol error.' });
        }
    };

    const handleDownloadLogs = () => {
        const data = {
            user_profile: userData,
            usage_metrics: stats,
            telemetry: activity,
            timestamp: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `campus_ai_logs_${user.id}.json`;
        a.click();
    };

    useEffect(() => {
        if (user) {
            fetchDashboardData();
            setProfileData({
                nickname: user.nickname || '',
                occupation: user.occupation || '',
                about_me: user.about_me || '',
                custom_instructions: user.custom_instructions || ''
            });
        }
    }, [user]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            await updateProfile(profileData);
            setResetStatus({ type: 'success', message: 'Personalization settings updated successfully.' });
            setTimeout(() => setResetStatus({ type: '', message: '' }), 5000);
        } catch (err) {
            setResetStatus({ type: 'error', message: 'Failed to update settings.' });
            setTimeout(() => setResetStatus({ type: '', message: '' }), 5000);
        } finally {
            setIsSavingProfile(false);
        }
    };

    if (!user || isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
                <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500/20 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
            </div>
        );
    }

    const userData = {
        name: user.nickname || user.full_name || user.email.split('@')[0],
        email: user.email,
        role: user.occupation || user.role || 'Campus Resident',
        avatar: (user.nickname || user.full_name || user.email)[0].toUpperCase(),
        memberSince: new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };

    const daysActive = user.created_at
        ? Math.max(1, Math.ceil((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24)))
        : 1;

    const loginStreak = stats?.login_streak || 0;

    return (
        <div className="h-full bg-gray-50 dark:bg-gray-900 font-sans p-6 lg:p-10 pb-20 space-y-10 overflow-y-auto">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Command Center for {userData.name}
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                </div>
            </header>

            {/* Notification/Status Bar */}
            {resetStatus.message && (
                <div className={`p-4 rounded-2xl border flex items-center gap-4 animate-bounce-subtle ${resetStatus.type === 'loading' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' :
                    resetStatus.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' :
                        'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                    }`}>
                    <span className="text-xl">
                        {resetStatus.type === 'loading' ? <Loader2 className="w-6 h-6 animate-spin" /> : resetStatus.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    </span>
                    <p className="text-sm font-bold tracking-wide">{resetStatus.message}</p>
                </div>
            )}

            {/* 3-Zone Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.8fr_1.2fr] gap-8">

                {/* LEFT (25%): User Identity Card */}
                <aside className="h-full">
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-8 shadow-sm overflow-hidden relative h-full flex flex-col">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-[0.03] -mr-16 -mt-16 rounded-full"></div>

                        <div className="flex-grow flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="w-28 h-28 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl rotate-3 transform group-hover:rotate-0 transition duration-500">
                                    {userData.avatar}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-lg text-blue-600 dark:text-blue-400">
                                    <Rocket className="w-5 h-5" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                {userData.name}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm tracking-wide mt-1">
                                {userData.email}
                            </p>

                            <div className="mt-6 flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-800 text-blue-600 dark:text-blue-400">
                                <GraduationCap className="w-5 h-5" />
                                <div className="text-left">
                                    <p className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-tighter leading-none mb-1">Rank & Class</p>
                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase leading-none">{userData.role}</p>
                                </div>
                            </div>

                            <div className="w-full mt-auto pt-8 border-t border-gray-50 dark:border-gray-700/50 space-y-4">
                                <div className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30 p-3 rounded-xl border border-transparent dark:border-gray-800/50">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Enrolled since</span>
                                    <span className="text-sm font-black text-gray-800 dark:text-white">{userData.memberSince}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="w-full mt-10 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all duration-300 active:scale-95 shadow-lg shadow-red-500/5"
                        >
                            Decommission Session
                        </button>
                    </div>
                </aside>

                {/* CENTER (45%): Activity & Streak Hero Section */}
                <main className="space-y-8 flex flex-col">
                    {/* Streak Hero Card */}
                    <div className="relative group w-full">
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-red-500 to-yellow-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                        <div className="relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-[2.5rem] p-8 md:p-10 shadow-2xl flex flex-col md:flex-row items-center gap-8 overflow-hidden transform group-hover:scale-[1.01] transition-all duration-500">
                            {/* Background Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 dark:bg-orange-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-5 dark:opacity-10 pointer-events-none select-none overflow-hidden">
                                <span className="text-[12rem] font-black tracking-tighter blur-[1px]">STREAK</span>
                            </div>

                            <div className="relative flex-shrink-0">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <div className="absolute inset-0 border-[6px] border-orange-100 dark:border-orange-900/30 rounded-full"></div>
                                    <div className="absolute inset-0 border-[6px] border-orange-500 rounded-full border-t-transparent animate-spin" style={{ animationDuration: '3s' }}></div>
                                    <Flame className="w-16 h-16 text-orange-500 drop-shadow-xl animate-pulse" />
                                </div>
                            </div>

                            <div className="relative text-center md:text-left space-y-2">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                                    Operational Streak
                                </div>
                                <h2 className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                                    {loginStreak} <span className="text-2xl font-bold text-gray-400 dark:text-gray-500 tracking-tight">DAYS</span>
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 font-bold text-lg max-w-xs">
                                    {loginStreak > 0 ? "Consecutive system interactions maintained." : "Initialize your first session today."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-8 shadow-sm flex-grow">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                                Recent Telemetry
                            </h2>
                        </div>

                        <div className="space-y-4">
                            {activity.length > 0 ? (
                                activity.map((session) => (
                                    <div key={session.id} className="group flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-transparent hover:border-blue-500/30 transition-all duration-300">
                                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition duration-300">
                                            {session.module === 'chat' ? <MessageSquare className="w-5 h-5" /> : session.module === 'campus' ? <School className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="text-sm font-black text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition duration-200">
                                                {session.title}
                                            </h4>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">
                                                Interacted {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition duration-300">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-700/50 rounded-3xl">
                                    <p className="text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest text-sm">No Recent Data Found</p>
                                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1 uppercase">Initialize your first session</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AI Personalization Settings */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-8 shadow-sm flex-grow">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                                AI Personalization Settings
                            </h2>
                        </div>
                        <form onSubmit={handleSaveProfile} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Nickname</label>
                                    <input
                                        type="text"
                                        value={profileData.nickname}
                                        onChange={(e) => setProfileData({ ...profileData, nickname: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        placeholder="What should the AI call you?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Occupation / Role</label>
                                    <input
                                        type="text"
                                        value={profileData.occupation}
                                        onChange={(e) => setProfileData({ ...profileData, occupation: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        placeholder="e.g., Computer Science Student"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">About Me</label>
                                <textarea
                                    value={profileData.about_me}
                                    onChange={(e) => setProfileData({ ...profileData, about_me: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[100px] resize-y"
                                    placeholder="Tell the AI a bit about yourself so it can provide better context..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Custom Instructions</label>
                                <textarea
                                    value={profileData.custom_instructions}
                                    onChange={(e) => setProfileData({ ...profileData, custom_instructions: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[120px] resize-y"
                                    placeholder="How should the AI behave? e.g., 'Always provide concise answers' or 'Respond like a sarcastic tutor'"
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isSavingProfile ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>

                {/* RIGHT (30%): Settings & Controls Panel */}
                <section className="h-full flex flex-col justify-between gap-8">
                    {/* Neural Theme */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-6 shadow-sm">
                        <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Neural Theme</h3>
                        <button
                            onClick={toggleTheme}
                            className="w-full flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 group active:scale-95 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-blue-600 dark:text-blue-400">
                                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                </span>
                                <span className="text-sm font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest">
                                    {theme === 'dark' ? 'Matrix Dark' : 'Daylight Ops'}
                                </span>
                            </div>
                            <div className="w-10 h-6 bg-blue-600/20 rounded-full p-1 relative">
                                <div className={`w-4 h-4 bg-blue-600 rounded-full transition-all duration-300 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                        </button>
                    </div>

                    {/* Security Protocol */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                        <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Security Protocol</h3>
                        <div className="space-y-3">
                            <button
                                onClick={handleResetRequest}
                                disabled={resetStatus.type === 'loading'}
                                className="w-full text-center py-4 bg-blue-600 dark:bg-blue-700 border border-transparent rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] text-white hover:bg-blue-700 dark:hover:bg-blue-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                            >
                                Reset Access Key
                            </button>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center font-bold px-4">
                                Sends a secure reset link to your registered email.
                            </p>
                        </div>
                    </div>

                    {/* Data Management */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-6 shadow-sm">
                        <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Data Management</h3>
                        <div className="space-y-3">
                             <button
                                onClick={handleDownloadLogs}
                                className="w-full py-4 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-gray-100 dark:border-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Download className="w-3 h-3" /> Download Logs
                            </button>
                            <button
                                onClick={handleClearHistory}
                                className="w-full py-4 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-100/50 dark:border-red-900/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-3 h-3" /> Purge Records
                            </button>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default ProfilePage;
