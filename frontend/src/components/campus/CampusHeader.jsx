import React from 'react';

const CampusHeader = ({ activeModule }) => {
    return (
        <header className="mb-6 flex-shrink-0 animate-fade-in">
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Campus AI</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        University Intelligence Mode
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-100/50 dark:border-blue-800/40">
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Active Module</div>
                    <div className="h-4 w-px bg-blue-200 dark:bg-blue-800"></div>
                    <div className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                        <span>📖</span> {activeModule}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default CampusHeader;
