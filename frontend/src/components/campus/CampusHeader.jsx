import React from 'react';

const CampusHeader = ({ activeModule }) => {
    return (
        <header className="mb-6 flex-shrink-0 animate-fade-in">
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Academics</h1>
                </div>


            </div>
        </header>
    );
};

export default CampusHeader;
