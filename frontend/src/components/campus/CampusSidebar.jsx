import React from 'react';

const CampusSidebar = ({ selectedModule, onModuleSelect, sessions = [], activeSessionId = null, onSelectSession, onDeleteSession }) => {
    return (
        <div className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm flex flex-col h-full animate-fade-in overflow-hidden">
            <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {/* Academics History Section */}
                <div className="space-y-2">
                    <p className="px-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">Academics History</p>
                    <div className="space-y-1">
                        {sessions.length === 0 ? (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 italic px-4 py-2">No academics sessions</p>
                        ) : (
                            sessions.map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => onSelectSession?.(session.id)}
                                    className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${session.id === activeSessionId
                                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <span className="text-[11px] font-medium truncate flex-1">{session.title}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteSession?.(session.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </nav>

            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl">
                <div className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.2em] text-center">
                    Academics AI OS
                </div>
            </div>
        </div>
    );
};

export default CampusSidebar;
