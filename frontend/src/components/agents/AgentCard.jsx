import React from 'react';

const AgentCard = ({ agent, isActive, onClick }) => {
    const colorMap = {
        blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 border-blue-100 dark:border-blue-900',
        indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 border-indigo-100 dark:border-indigo-900',
        purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/40 border-purple-100 dark:border-purple-900',
        emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/40 border-emerald-100 dark:border-emerald-900',
        amber: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/40 border-amber-100 dark:border-amber-900',
        rose: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/40 border-rose-100 dark:border-rose-900',
    };

    const activeColorMap = {
        blue: 'border-blue-500 shadow-blue-500/20 bg-blue-50/50 dark:bg-blue-900/30',
        indigo: 'border-indigo-500 shadow-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-900/30',
        purple: 'border-purple-500 shadow-purple-500/20 bg-purple-50/50 dark:bg-purple-900/30',
        emerald: 'border-emerald-500 shadow-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-900/30',
        amber: 'border-amber-500 shadow-amber-500/20 bg-amber-50/50 dark:bg-amber-900/30',
        rose: 'border-rose-500 shadow-rose-500/20 bg-rose-50/50 dark:bg-rose-900/30',
    };

    const colorClasses = colorMap[agent.color] || colorMap.blue;
    const activeClasses = activeColorMap[agent.color] || activeColorMap.blue;

    return (
        <div
            onClick={() => onClick(agent.id)}
            className={`relative group p-6 rounded-3xl border transition-all duration-500 cursor-pointer overflow-hidden ${isActive
                ? `border-2 ${activeClasses} shadow-2xl scale-[1.02]`
                : 'bg-white dark:bg-gray-800/40 border-gray-100 dark:border-gray-700/50 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-xl hover:scale-[1.03]'
                }`}
        >
            {/* Background Gradient Orbs (Subtle) */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-700 ${isActive ? 'opacity-20' : ''} ${agent.color === 'blue' ? 'bg-blue-400' : 'bg-purple-400'}`} />

            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                {/* Icon container */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 transform group-hover:rotate-6 ${isActive
                    ? 'bg-blue-600 text-white shadow-lg rotate-0'
                    : `bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 group-hover:bg-opacity-100 group-hover:shadow-md`
                    }`}>
                    <span className="text-3xl filter drop-shadow-sm">{agent.icon}</span>
                </div>

                {/* Text content */}
                <div className="space-y-1.5">
                    <h3 className={`text-base font-black tracking-tight transition-colors duration-300 ${isActive
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                        }`}>
                        {agent.name}
                    </h3>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 px-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {agent.description}
                    </p>
                </div>
            </div>

            {/* Selection indicator */}
            <div className={`absolute top-4 right-4 transition-all duration-500 transform ${isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                <div className="bg-blue-600 rounded-full p-1 shadow-lg ring-4 ring-blue-50 dark:ring-blue-900/30">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>

            {/* Hover Active Indicator (Bottom Line) */}
            <div className={`absolute bottom-0 left-0 h-1 bg-blue-600 transition-all duration-500 ${isActive ? 'w-full' : 'w-0 group-hover:w-1/3'}`} />
        </div>
    );
};

export default AgentCard;
