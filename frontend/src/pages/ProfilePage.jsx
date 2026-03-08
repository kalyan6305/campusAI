import React from 'react';
import useThemeStore from '../store/themeStore';

const ProfilePage = () => {
    const { theme, toggleTheme } = useThemeStore();

    // Placeholder user data
    const user = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Student',
        avatar: 'JD'
    };

    return (
        <div className="page-container animate-fade-in font-sans h-full overflow-y-auto">
            {/* Header */}
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">User Profile</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 font-medium">
                    Manage your account, sessions, and preferences.
                </p>
            </header>

            {/* Main Dashboard Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Section 1: User Information Card */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 flex flex-col items-center md:items-start text-center md:text-left transition-all hover:shadow-md">
                    <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-50 dark:border-blue-900/30 shadow-inner">
                            {user.avatar}
                        </div>
                        <div className="flex-grow">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{user.name}</h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{user.email}</p>
                            <div className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-widest">
                                {user.role}
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 w-full space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Account Status</span>
                            <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                Active
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">Member Since</span>
                            <span className="text-gray-900 dark:text-white font-bold">March 2024</span>
                        </div>
                    </div>
                </div>

                {/* Section 2: Account Settings Card */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Account Settings
                    </h2>
                    <div className="space-y-4">
                        <button className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors uppercase tracking-widest text-center">
                            Change Password
                        </button>
                        <button className="w-full bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors uppercase tracking-widest text-center">
                            Clear Chat History
                        </button>
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Preferences</p>
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme Preference</span>
                                <button
                                    onClick={toggleTheme}
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded uppercase tracking-tighter hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                                >
                                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                </button>
                            </div>
                        </div>
                        <button className="w-full mt-4 bg-gray-900 dark:bg-gray-700 text-white rounded-lg px-4 py-2.5 text-sm font-bold hover:bg-black dark:hover:bg-gray-600 transition-colors uppercase tracking-widest text-center">
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Section 3: Recent Chat Sessions (Placeholder) */}
            <div className="mt-8">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 transition-all hover:shadow-md">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Recent Chat Sessions
                    </h2>
                    <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Your recent conversations will appear here.</p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest">No active sessions found</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
