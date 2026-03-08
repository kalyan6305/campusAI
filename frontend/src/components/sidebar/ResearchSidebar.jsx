import React from 'react';

export default function ResearchSidebar({ activeTool, setActiveTool, results }) {
    const tools = [
        { id: 'browser', name: 'Web Browser', icon: '🌐', color: 'blue', label: 'Browser Mode' },
        { id: 'social', name: 'Social Media', icon: '📱', color: 'purple', label: 'Social Mode' },
    ];

    const currentToolObj = tools.find(t => t.id === activeTool);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in overflow-hidden font-sans">
            {/* Top Toolbar */}
            <div className="p-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/30">
                <div className="flex items-center gap-3 mb-4">
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTool(tool.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${activeTool === tool.id
                                ? `bg-${tool.color}-600 text-white shadow-md shadow-${tool.color}-500/20 ring-2 ring-${tool.color}-100 dark:ring-${tool.color}-900`
                                : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                }`}
                        >
                            <span className="text-lg">{tool.icon}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">{tool.name}</span>
                        </button>
                    ))}
                </div>

                {/* Dynamic Title */}
                <div className="px-1 animate-slide-up">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Active Tool</p>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                        {currentToolObj?.label}
                    </h2>
                </div>
            </div>

            {/* Results Panel */}
            <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-800">
                    <h2 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Research Sources</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {results && results[activeTool]?.length > 0 ? (
                        results[activeTool].map((result, idx) => (
                            <div key={idx} className="group p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all cursor-pointer shadow-sm hover:shadow-md">
                                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-1.5 truncate">{result.source}</p>
                                <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-relaxed group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{result.title}</h3>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2.5 line-clamp-2 leading-relaxed">{result.snippet}</p>
                                <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Read More →</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-3xl mb-4 grayscale opacity-40 animate-pulse">
                                {activeTool === 'browser' ? '🔍' : '💬'}
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Discovery Engine Ready</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
                                Type your research query in the chat to populate {activeTool} sources.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Status */}
                <div className="p-4 border-t border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800/50">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">Notebook Mode</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
