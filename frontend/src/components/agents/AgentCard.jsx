import React from 'react';

const AgentCard = ({ agent, isActive, onClick }) => {
    return (
        <div
            onClick={() => onClick(agent.id)}
            className={`relative group p-5 rounded-2xl border transition-all duration-300 cursor-pointer hover:scale-[1.03] ${isActive
                ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-500 dark:border-blue-400 shadow-md ring-1 ring-blue-500/10 dark:ring-blue-400/20'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg shadow-sm'
                }`}
        >
            <div className="flex flex-col items-center text-center space-y-3">
                {/* Icon container */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${isActive ? 'bg-blue-600 text-white shadow-inner' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                    }`}>
                    <span className="text-2xl">{agent.icon}</span>
                </div>

                {/* Text content */}
                <div>
                    <h3 className={`font-bold text-sm transition-colors duration-300 ${isActive ? 'text-blue-800 dark:text-blue-300' : 'text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}>
                        {agent.name}
                    </h3>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 px-2">
                        {agent.description}
                    </p>
                </div>
            </div>

            {/* Selection indicator */}
            {isActive && (
                <div className="absolute top-4 right-4 animate-fade-in">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
        </div>
    );
};

export default AgentCard;
