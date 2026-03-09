import React from 'react';

const CampusSidebar = ({ selectedModule, onModuleSelect, sessions = [], activeSessionId = null, onSelectSession, onDeleteSession }) => {
    const modules = [
        { name: 'Academics', icon: '📚' },
        { name: 'Admissions', icon: '🎓' },
        { name: 'Hostel', icon: '🏠' },
        { name: 'Fees', icon: '💰' },
        { name: 'Attendance', icon: '📅' },
        { name: 'Sports', icon: '⚽' },
        { name: 'Transport', icon: '🚌' },
        { name: 'Results', icon: '📝' },
        { name: 'Student Info', icon: '👤' },
    ];

    return (
        <div className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm flex flex-col h-full animate-fade-in overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 rounded-t-xl">
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 uppercase tracking-widest">
                    <span>🏛️</span> Modules
                </h2>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {modules.map((module) => (
                    <button
                        key={module.name}
                        onClick={() => onModuleSelect(module.name)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 uppercase tracking-wider ${selectedModule === module.name
                            ? 'bg-blue-600 dark:bg-blue-700 text-white shadow-md border-blue-700 dark:border-blue-600'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        <span className="text-base">{module.icon}</span>
                        {module.name}
                    </button>
                ))}

                {/* Campus History Section */}
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                    <p className="px-3 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3">Campus History</p>
                    <div className="space-y-1">
                        {sessions.length === 0 ? (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 italic px-4 py-2">No campus sessions</p>
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
                    Campus AI OS
                </div>
            </div>
        </div>
    );
};

export default CampusSidebar;
