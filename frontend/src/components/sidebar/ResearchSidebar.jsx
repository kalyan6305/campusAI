import React, { useState } from 'react';

// ── Platform config ─────────────────────────────────────────────
const DOT_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-yellow-500'];
const DOMAIN_COLORS = ['text-blue-600', 'text-purple-600', 'text-green-600', 'text-orange-600', 'text-pink-600', 'text-teal-600', 'text-indigo-600', 'text-yellow-600'];

const CATEGORY_DOT = { Development: 'bg-blue-500', Social: 'bg-purple-500', Scholarly: 'bg-green-500', Multimedia: 'bg-red-500', Web: 'bg-gray-400', News: 'bg-yellow-500' };
const CATEGORY_BADGE = { Development: 'bg-blue-50 text-blue-700', Scholarly: 'bg-green-50 text-green-700', Web: 'bg-gray-100 text-gray-600', News: 'bg-yellow-50 text-yellow-700', Social: 'bg-purple-50 text-purple-700' };

// ── Component ────────────────────────────────────────────────────
// ── Component ────────────────────────────────────────────────────
export default function ResearchSidebar({ results, isStreaming, activeTool, setActiveTool, sessions = [], activeSessionId, onSelectSession, onDeleteSession }) {

    const sources = results?.browser || [];

    const displaySources = sources.filter(s => s.browser?.toLowerCase() !== 'social');

    const tabs = [
        { id: 'browser', label: 'Web Browser', icon: '🌐' },
        { id: 'deep_research', label: 'Deep Research', icon: '🔬' },
    ];

    // Unique categories among current display sources
    const categories = [...new Set(displaySources.map(s => s.category).filter(Boolean))];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in overflow-hidden font-sans">
            {/* Top Toolbar */}
            <div className="p-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/30">
                <div className="flex gap-2 mb-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTool(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl transition-all duration-300 text-[11px] font-bold tracking-wide ${activeTool === tab.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-transparent'
                                }`}
                        >
                            <span className="text-base leading-none">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Active Tool</p>
                    <p className="text-[16px] font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                        {activeTool === 'browser' ? 'Browser Mode' : 'Deep Research Mode'}
                    </p>
                </div>

                {/* ── Searching indicator ── */}
                {isStreaming && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                        <span className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Searching all sources…</span>
                    </div>
                )}
            </div>

            {/* ── Scrollable content ───────────────────────── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-2">

                {/* Category summary pills */}
                {categories.length > 0 && !isStreaming && (
                    <div className="flex flex-wrap gap-1.5 pb-2">
                        {categories.map(cat => (
                            <span key={cat} className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${CATEGORY_BADGE[cat] || 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                {cat}
                            </span>
                        ))}
                    </div>
                )}

                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase pb-1">Research Sources</p>

                {/* Web source result cards */}
                {displaySources.length > 0 ? (
                    displaySources.map((result, idx) => (
                        <a
                            key={idx}
                            href={result.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-3 px-3 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all duration-200 group cursor-pointer"
                        >
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${CATEGORY_DOT[result.category] || DOT_COLORS[idx % DOT_COLORS.length]}`} />
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                                    {result.index && <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-bold px-1.5 py-0.5 rounded text-[10px] mr-1.5">[{result.index}]</span>}
                                    {result.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className={`text-[9px] font-black uppercase tracking-wider truncate ${DOMAIN_COLORS[idx % DOMAIN_COLORS.length]}`}>
                                        {result.source}
                                    </p>
                                    {result.category && (
                                        <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${CATEGORY_BADGE[result.category] || 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                            {result.category}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                                    {result.snippet}
                                </p>
                            </div>
                        </a>
                    ))
                ) : !isStreaming ? (
                    <div className="flex flex-col items-center py-10 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-3xl mb-4 opacity-30 animate-pulse">
                            {activeTool === 'browser' ? '🔍' : '💬'}
                        </div>
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Discovery Engine Ready</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
                            Type your research query in the chat to search across all sources.
                        </p>
                    </div>
                ) : null}

                {/* ── Tools History ───────────────────────────── */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-4">
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 tracking-[0.18em] uppercase pb-2 px-1">Research History</p>
                    <div className="space-y-1">
                        {sessions.length === 0 ? (
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 italic px-2 py-3 text-center">
                                No previous research sessions
                            </p>
                        ) : (
                            sessions.map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => onSelectSession?.(session.id)}
                                    className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${session.id === activeSessionId
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                                        : 'border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="text-[10px] flex-shrink-0">🔍</span>
                                        <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate font-medium">
                                            {session.title}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteSession?.(session.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5"
                                        title="Delete session"
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
            </div>

            {/* ── Footer ───────────────────────────────────── */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
                {displaySources.length > 0 ? (
                    <>
                        <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                            {displaySources.length} Source{displaySources.length !== 1 ? 's' : ''} · {categories.length} Categor{categories.length !== 1 ? 'ies' : 'y'}
                        </span>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-[9px] font-black text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 uppercase tracking-widest transition-colors"
                        >
                            Reset
                        </button>
                    </>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[9px] font-bold text-green-500 dark:text-green-400 uppercase tracking-widest">
                            {isStreaming ? 'Searching…' : 'Notebook Mode'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
