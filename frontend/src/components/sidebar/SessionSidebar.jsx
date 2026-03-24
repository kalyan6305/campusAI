/**
 * SessionSidebar — session list with new chat button and rename functionality.
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import PersonalizationModal from '../layout/PersonalizationModal';
import GeneralSettingsModal from '../layout/GeneralSettingsModal';
import { GraduationCap, Sparkles, User as UserIcon, Settings, HelpCircle, LogOut, ChevronUp } from 'lucide-react';

export default function SessionSidebar({ isOpen, setIsOpen }) {
    const { getSessions, activeSessionId, loadSessions, createSession, selectSession, deleteSession, renameSession } = useChatStore();
    const sessions = getSessions();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const [editingSessionId, setEditingSessionId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const editInputRef = useRef(null);
    const profileMenuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        loadSessions('chat');
    }, [loadSessions]);

    useEffect(() => {
        if (editingSessionId && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingSessionId]);

    const handleNewChat = async () => {
        await createSession('New Chat', 'chat');
        navigate('/home');
    };

    const startEditing = (e, session) => {
        e.stopPropagation();
        setEditingSessionId(session.id);
        setEditTitle(session.title);
    };

    const handleRename = async () => {
        if (editTitle.trim() && editTitle !== sessions.find(s => s.id === editingSessionId)?.title) {
            await renameSession(editingSessionId, editTitle.trim());
        }
        setEditingSessionId(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleRename();
        if (e.key === 'Escape') setEditingSessionId(null);
    };

    return (
        <aside className={`${isOpen ? 'w-64' : 'w-16'} bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col h-full shadow-sm sidebar-transition font-sans relative`}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full flex items-center justify-center shadow-md hover:text-blue-600 dark:hover:text-blue-400 z-50 group transition-all"
            >
                <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>

            {/* Header */}
            <div className={`p-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/20 ${!isOpen && 'flex flex-col items-center'}`}>
                <div className={`flex items-center gap-2 ${isOpen ? 'mb-4' : 'mb-0'}`}>
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0 text-white">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    {isOpen && (
                        <div className="min-w-0">
                            <h1 className="text-xs font-black text-gray-900 dark:text-gray-100 tracking-tight uppercase truncate">Campus AI</h1>
                            <p className="text-[8px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">OS</p>
                        </div>
                    )}
                </div>

                {isOpen ? (
                    <button
                        onClick={handleNewChat}
                        className="w-full btn-primary flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        New Chat
                    </button>
                ) : (
                    <button
                        onClick={handleNewChat}
                        className="w-full p-2 mt-4 text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center justify-center rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-800/50"
                        title="New Chat"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar overflow-x-hidden">
                {isOpen && (
                    <div className="px-2 mb-1">
                        <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sessions</span>
                    </div>
                )}
                {sessions.map((session) => (
                    <div
                        key={session.id}
                        className={`group flex items-center gap-2 ${isOpen ? 'px-2 py-2.5' : 'p-2 justify-center'} rounded-xl cursor-pointer transition-all duration-200 ${activeSessionId === session.id
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/30 shadow-sm font-bold'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent'
                            }`}
                        onClick={() => {
                            selectSession(session.id);
                            navigate('/home');
                        }}
                        title={!isOpen ? session.title : ''}
                    >
                        {session.module === 'voice' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 flex-shrink-0 ${activeSessionId === session.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 flex-shrink-0 ${activeSessionId === session.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                            </svg>
                        )}

                        {isOpen && (
                            <>
                                {editingSessionId === session.id ? (
                                    <input
                                        ref={editInputRef}
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onBlur={handleRename}
                                        onKeyDown={handleKeyDown}
                                        className="flex-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded px-1.5 py-0.5 text-[11px] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none text-gray-900 dark:text-gray-100"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span className="flex-1 text-[11px] truncate leading-tight">{session.title}</span>
                                )}

                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={(e) => startEditing(e, session)}
                                        className="p-1 hover:text-blue-600 dark:hover:text-blue-400"
                                        title="Rename"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteSession(session.id);
                                        }}
                                        className="p-1 hover:text-red-500"
                                        title="Delete"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* User profile */}
            <div className="p-3 border-t border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/10 relative" ref={profileMenuRef}>
                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                    <div className={`absolute bottom-full left-4 mb-2 w-56 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl p-2 z-[60] animate-slide-up backdrop-blur-xl ${!isOpen && 'left-1'}`}>
                        <div className="space-y-1">
                            <button
                                onClick={() => {
                                    setIsPersonalizationOpen(true);
                                    setIsProfileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-200 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Personalization</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Custom AI Logic</p>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    navigate('/profile');
                                    setIsProfileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-200 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Profile</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">My Account</p>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setIsSettingsOpen(true);
                                    setIsProfileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform">
                                    <Settings className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Settings</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">General Preferences</p>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    navigate('/help');
                                    setIsProfileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:scale-110 transition-transform">
                                    <HelpCircle className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Help</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Support & FAQs</p>
                                </div>
                            </button>

                            <div className="h-px bg-gray-50 dark:bg-gray-700 my-1 mx-2" />

                            <button
                                onClick={() => {
                                    logout();
                                    setIsProfileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                    <LogOut className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Logout</p>
                                    <p className="text-[8px] text-red-400/60 font-bold uppercase tracking-widest mt-0.5">Terminate Session</p>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                <div
                    className={`flex items-center gap-2 px-1 py-1 rounded-xl hover:bg-white dark:hover:bg-gray-800 cursor-pointer group/profile transition-all ${!isOpen && 'flex-col'}`}
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[10px] font-black text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/20 uppercase flex-shrink-0 group-hover/profile:scale-110 transition-transform">
                        {(user?.nickname || user?.email || 'U')[0].toUpperCase()}
                    </div>
                    {isOpen && (
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 truncate tracking-tight">{user?.nickname || user?.email?.split('@')[0] || 'User'}</p>
                            <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">My Account</p>
                        </div>
                    )}
                    <div className={`text-gray-400 transition-transform duration-300 ${isProfileMenuOpen ? 'rotate-180' : ''}`}>
                        <ChevronUp className="w-4 h-4" />
                    </div>
                </div>
            </div>

            <PersonalizationModal
                isOpen={isPersonalizationOpen}
                onClose={() => setIsPersonalizationOpen(false)}
            />
            <GeneralSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </aside>
    );
}
