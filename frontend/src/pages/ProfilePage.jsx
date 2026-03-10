import React, { useState, useEffect } from 'react';
import useThemeStore from '../store/themeStore';
import useAuthStore from '../store/authStore';
import { authAPI, sessionAPI } from '../services/api';

const ProfilePage = () => {
    const { theme, toggleTheme } = useThemeStore();
    const { user, logout } = useAuthStore();
    const [stats, setStats] = useState(null);
    const [activity, setActivity] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [resetStatus, setResetStatus] = useState({ type: '', message: '' });

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

    useEffect(() => {
        if (user) fetchDashboardData();
    }, [user]);

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
        name: user.full_name || user.email.split('@')[0],
        email: user.email,
        role: user.role || 'Campus Resident',
        avatar: (user.full_name || user.email)[0].toUpperCase(),
        memberSince: new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };

    const statCards = [
        { label: 'Intelligence Sessions', value: stats?.total_sessions || 0, icon: '🧠', color: 'blue' },
        { label: 'Knowledge Interactions', value: stats?.total_messages || 0, icon: '⚡', color: 'purple' },
        { label: 'Days Active', value: 1, icon: '🗓️', color: 'green' },
    ];

    return (
        <div className="min-h-full bg-gray-50 dark:bg-gray-900 font-sans p-6 lg:p-10 space-y-10 overflow-y-auto">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Command Center
                    </h1>
                    <p className="mt-2 text-gray-500 dark:text-gray-400 font-medium text-lg">
                        Operational overview for {userData.name}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        System Active
                    </span>
                </div>
            </header>

            {/* Notification/Status Bar */}
            {resetStatus.message && (
                <div className={`p-4 rounded-2xl border flex items-center gap-4 animate-bounce-subtle ${resetStatus.type === 'loading' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' :
                        resetStatus.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' :
                            'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                    }`}>
                    <span className="text-xl">
                        {resetStatus.type === 'loading' ? '⏳' : resetStatus.type === 'success' ? '✔' : '❌'}
                    </span>
                    <p className="text-sm font-bold tracking-wide">{resetStatus.message}</p>
                </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((card, idx) => (
                    <div key={idx} className="relative group cursor-default">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                        <div className="relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-3xl">{card.icon}</span>
                                <span className={`text-xs font-black uppercase tracking-widest text-${card.color}-500 opacity-60`}>Live Data</span>
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{card.value}</h3>
                            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: User Identity */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-8 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-[0.03] -mr-16 -mt-16 rounded-full"></div>

                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-6">
                                <div className="w-28 h-28 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl rotate-3 transform group-hover:rotate-0 transition duration-500">
                                    {userData.avatar}
                                </div>
                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-lg text-xl">
                                    🚀
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                {userData.name}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm tracking-wide mt-1">
                                {userData.email}
                            </p>

                            <div className="mt-6 flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-800">
                                <span className="text-2xl">🎓</span>
                                <div className="text-left">
                                    <p className="text-[10px] uppercase font-black text-gray-400 dark:text-gray-500 tracking-tighter leading-none mb-1">Rank & Class</p>
                                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase leading-none">{userData.role}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 pt-8 border-t border-gray-50 dark:border-gray-700/50 space-y-4">
                            <div className="flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30 p-3 rounded-xl border border-transparent dark:border-gray-800/50">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Enrolled since</span>
                                <span className="text-sm font-black text-gray-800 dark:text-white">{userData.memberSince}</span>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="w-full mt-10 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all duration-300 active:scale-95 shadow-lg shadow-red-500/5"
                        >
                            Decommission Session
                        </button>
                    </div>
                </div>

                {/* Right: Activity & Controls */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Activity Feed */}
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-8 shadow-sm">
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
                                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center text-xl group-hover:scale-110 transition duration-300">
                                            {session.module === 'chat' ? '💬' : session.module === 'campus' ? '🏫' : '🛠️'}
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="text-sm font-black text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition duration-200">
                                                {session.title}
                                            </h4>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">
                                                Interacted {new Date(session.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1 uppercase">Initialize your first session to begin tracking</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Preferences */}
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-6 shadow-sm">
                            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Neural Theme</h3>
                            <button
                                onClick={toggleTheme}
                                className="w-full flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30 group active:scale-95 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
                                    <span className="text-sm font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest">
                                        {theme === 'dark' ? 'Matrix Dark' : 'Daylight Ops'}
                                    </span>
                                </div>
                                <div className="w-10 h-6 bg-blue-600/20 rounded-full p-1 relative">
                                    <div className={`w-4 h-4 bg-blue-600 rounded-full transition-all duration-300 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                </div>
                            </button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-6 shadow-sm">
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
