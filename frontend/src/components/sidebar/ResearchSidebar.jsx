import React, { useState } from 'react';

// ── Platform Icons & Colors ──────────────────────────────────────
const PLATFORM_CONFIG = {
    youtube:    { icon: '▶️',  label: 'YouTube',    dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    hackernews: { icon: '🟧',  label: 'HackerNews', dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    reddit:     { icon: '🔴',  label: 'Reddit',     dot: 'bg-orange-600', badge: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    quora:      { icon: '❓',  label: 'Quora',      dot: 'bg-red-600',    badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    wikipedia:  { icon: '📚',  label: 'Wikipedia',  dot: 'bg-gray-500',   badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    arxiv:      { icon: '📄',  label: 'arXiv',      dot: 'bg-green-600',  badge: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    linkedin:   { icon: '💼',  label: 'LinkedIn',   dot: 'bg-blue-700',   badge: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    web:        { icon: '🌐',  label: 'Web',        dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
};

const SOCIAL_PLATFORMS = ['youtube', 'hackernews', 'reddit', 'quora', 'wikipedia', 'arxiv', 'linkedin'];

const DOT_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-yellow-500'];
const DOMAIN_COLORS = ['text-blue-600', 'text-purple-600', 'text-green-600', 'text-orange-600', 'text-pink-600', 'text-teal-600', 'text-indigo-600', 'text-yellow-600'];

const CATEGORY_DOT = { Documentation: 'bg-blue-500', Social: 'bg-purple-500', Research: 'bg-green-500', Multimedia: 'bg-red-500', Web: 'bg-gray-400', News: 'bg-yellow-500', Development: 'bg-blue-500', Scholarly: 'bg-green-500' };
const CATEGORY_BADGE = { Documentation: 'bg-blue-50 text-blue-700', Research: 'bg-green-50 text-green-700', Web: 'bg-gray-100 text-gray-600', News: 'bg-yellow-50 text-yellow-700', Social: 'bg-purple-50 text-purple-700', Development: 'bg-blue-50 text-blue-700', Scholarly: 'bg-green-50 text-green-700' };

// ── URL Safety Guard ─────────────────────────────────────────────
const BLOCKED_URL_PATTERNS = [
    /^https?:\/\/(www\.)?(google|bing|duckduckgo|yahoo|yandex|baidu|ask|aol)\./i,
    /^https?:\/\/(bit\.ly|t\.co|tinyurl\.com|goo\.gl|buff\.ly|ow\.ly|short\.io|rb\.gy)\//i,
    /\/search\?q=/i,
];

function isCleanUrl(url) {
    if (!url || !url.startsWith('https')) return false;
    return !BLOCKED_URL_PATTERNS.some(pattern => pattern.test(url));
}

// ── SocialSourceCard ─────────────────────────────────────────────
function SocialSourceCard({ result, idx }) {
    const platform = result.platform?.toLowerCase() || 'web';
    const config = PLATFORM_CONFIG[platform] || PLATFORM_CONFIG.web;
    const validLink = isCleanUrl(result.url || result.link) ? (result.url || result.link) : null;
    const meta = result.metadata || {};
    const reliability = result.reliability_score || 0;

    return (
        <div className="flex items-start gap-3 px-3 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-200 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 group">
            {/* Platform Icon */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                <span className="text-lg leading-none">{config.icon}</span>
                <div className={`w-2 h-2 rounded-full ${config.dot}`} />
            </div>

            <div className="min-w-0 flex-1">
                {/* Title */}
                {validLink ? (
                    <a href={validLink} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 line-clamp-2 leading-snug hover:underline">
                        {result.title}
                    </a>
                ) : (
                    <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">
                        {result.title}
                    </p>
                )}

                {/* Platform Badge + Metadata Row */}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${config.badge}`}>
                        {config.label}
                    </span>

                    {/* Metadata badges */}
                    {meta.upvotes > 0 && (
                        <span className="text-[7px] font-bold text-orange-500 dark:text-orange-400 flex items-center gap-0.5">
                            ▲ {meta.upvotes.toLocaleString()}
                        </span>
                    )}
                    {meta.comments > 0 && (
                        <span className="text-[7px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                            💬 {meta.comments.toLocaleString()}
                        </span>
                    )}
                    {meta.views > 0 && (
                        <span className="text-[7px] font-bold text-gray-400 dark:text-gray-500 flex items-center gap-0.5">
                            👁 {meta.views.toLocaleString()}
                        </span>
                    )}
                    {meta.channel && (
                        <span className="text-[7px] font-bold text-gray-400 dark:text-gray-500 truncate max-w-[80px]">
                            📺 {meta.channel}
                        </span>
                    )}
                    {meta.author && (
                        <span className="text-[7px] font-bold text-gray-400 dark:text-gray-500 truncate max-w-[80px]">
                            👤 {meta.author}
                        </span>
                    )}

                    {!validLink && (
                        <span className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-50 text-red-400 flex-shrink-0">
                            Link unavailable
                        </span>
                    )}
                </div>

                {/* Snippet */}
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {result.snippet}
                </p>

                {/* Reliability Score Bar */}
                {reliability > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${reliability >= 70 ? 'bg-green-500' : reliability >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${reliability}%` }}
                            />
                        </div>
                        <span className="text-[7px] font-black text-gray-400 dark:text-gray-500 tabular-nums">{reliability}%</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────
export default function ResearchSidebar({ 
    results, isStreaming, activeTool, setActiveTool, 
    sessions = [], activeSessionId, onSelectSession, 
    onDeleteSession, onRenameSession, 
    researchSourcesList = [], clearResearch 
}) {
    const [menuOpenId, setMenuOpenId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');

    React.useEffect(() => {
        if (menuOpenId !== null) {
            const handleOutsideClick = () => setMenuOpenId(null);
            document.addEventListener('click', handleOutsideClick);
            return () => document.removeEventListener('click', handleOutsideClick);
        }
    }, [menuOpenId]);

    const handleRenameSubmit = async (e, id) => {
        e.preventDefault();
        if (editTitle.trim()) {
            await onRenameSession?.(id, editTitle.trim());
        }
        setEditingId(null);
    };

    // ── Source Filtering Logic ────────────────────────────────────
    const allSources = activeTool === 'research'
        ? researchSourcesList
        : [...(results?.browser || []), ...researchSourcesList];

    let displaySources;
    if (activeTool === 'social') {
        // Social Media tab: show only social platform sources
        displaySources = researchSourcesList.filter(s =>
            SOCIAL_PLATFORMS.includes(s.platform?.toLowerCase())
        );
    } else if (activeTool === 'research') {
        // Research tab: show all research sources
        displaySources = researchSourcesList;
    } else {
        // Browser tab: show web search results (non-social)
        displaySources = (results?.browser || []).filter(s =>
            !SOCIAL_PLATFORMS.includes(s.platform?.toLowerCase())
        );
    }

    const tabs = [
        { id: 'browser', label: 'Web Browser', icon: '🌐' },
        { id: 'research', label: 'Deep Research', icon: '🔬' },
    ];

    // Unique platforms or categories among current display sources
    const platforms = [...new Set(displaySources.map(s => s.platform || s.category).filter(Boolean))];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in overflow-hidden font-sans">
            {/* Top Toolbar */}
            <div className="p-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-800/30">
                <div className="flex gap-2 mb-4">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTool(tab.id)}
                            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl transition-all duration-300 text-[9px] font-black uppercase tracking-widest text-center ${activeTool === tab.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'
                                }`}
                        >
                            <span className="text-xl leading-none mb-0.5">{tab.icon}</span>
                            <span className="leading-tight">{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">Active Tool</p>
                        <p className="text-[16px] font-black text-gray-900 dark:text-gray-100 mt-0.5">
                            {activeTool === 'browser' ? 'Browser Mode' : activeTool === 'social' ? 'Social Mode' : 'Research Mode'}
                        </p>
                    </div>
                    <button 
                        onClick={() => {
                            const el = document.getElementById('history-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="p-1.5 rounded-lg bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
                        title="View Research History"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline-block">History</span>
                    </button>
                </div>

                {/* ── Searching indicator ── */}
                {isStreaming && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                        <span className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">{activeTool === 'research' ? 'Researching...' : activeTool === 'social' ? 'Scanning social platforms…' : 'Searching all sources…'}</span>
                    </div>
                )}
            </div>

            {/* ── Scrollable content ───────────────────────── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 space-y-2">

                {/* Platform summary pills */}
                {platforms.length > 0 && !isStreaming && (
                    <div className="flex flex-wrap gap-1.5 pb-2">
                        {platforms.map(plat => {
                            const cfg = PLATFORM_CONFIG[plat?.toLowerCase()] || PLATFORM_CONFIG.web;
                            return (
                                <span key={plat} className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.badge}`}>
                                    <span>{cfg.icon}</span>{cfg.label}
                                </span>
                            );
                        })}
                    </div>
                )}

                <div className="pb-1 mt-2">
                    <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 tracking-[0.18em] uppercase">
                        {activeTool === 'social' ? 'Social Sources' : activeTool === 'research' ? 'Research Sources' : 'Web Sources'}
                    </p>
                </div>

                {/* Source Cards — use SocialSourceCard for social/research, standard card for browser */}
                {displaySources.length > 0 ? (
                    displaySources.map((result, idx) => {
                        // Use SocialSourceCard for sources that have a platform attribute
                        if (result.platform) {
                            return <SocialSourceCard key={idx} result={result} idx={idx} />;
                        }

                        // Standard web card for browser results
                        const validLink = isCleanUrl(result.url || result.link) ? (result.url || result.link) : null;
                        return (
                            <div
                                key={idx}
                                className="flex items-start gap-3 px-3 py-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-200 group"
                            >
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${CATEGORY_DOT[result.category] || DOT_COLORS[idx % DOT_COLORS.length]}`} />
                                <div className="min-w-0 flex-1">
                                    {validLink ? (
                                        <a href={validLink} target="_blank" rel="noopener noreferrer"
                                            className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 line-clamp-2 leading-snug hover:underline">
                                            {result.title}
                                        </a>
                                    ) : (
                                        <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 leading-snug">
                                            {result.title}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className={`text-[9px] font-black uppercase tracking-wider truncate ${DOMAIN_COLORS[idx % DOMAIN_COLORS.length]}`}>
                                            {result.domain || result.source}
                                        </p>
                                        {result.category && (
                                            <span className={`text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${CATEGORY_BADGE[result.category] || 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                                {result.category}
                                            </span>
                                        )}
                                        {!validLink && (
                                            <span className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-red-50 text-red-400 flex-shrink-0">
                                                Link unavailable
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                                        {result.snippet}
                                    </p>
                                </div>
                            </div>
                        );
                    })

                ) : !isStreaming ? (
                    <div className="flex flex-col items-center py-10 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-3xl mb-4 opacity-30 animate-pulse">
                            {activeTool === 'browser' ? '🔍' : activeTool === 'social' ? '📱' : '🔬'}
                        </div>
                        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                            {activeTool === 'social' ? 'Social Discovery Ready' : activeTool === 'research' ? 'Deep Research Ready' : 'Discovery Engine Ready'}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 leading-relaxed">
                            {activeTool === 'social'
                                ? 'Search to find discussions on YouTube, Reddit, HackerNews, Quora, arXiv & LinkedIn.'
                                : 'Type your research query in the chat to search across all sources.'}
                        </p>
                    </div>
                ) : null}

                {/* ── Tools History ───────────────────────────── */}
                <div id="history-section" className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-4">
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
                                    className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 relative ${session.id === activeSessionId
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                                        : 'border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="text-[10px] flex-shrink-0">{activeTool === 'research' ? '🔬' : '🔍'}</span>
                                        {editingId === session.id ? (
                                            <form onSubmit={(e) => handleRenameSubmit(e, session.id)} className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={editTitle}
                                                    onChange={e => setEditTitle(e.target.value)}
                                                    onBlur={(e) => handleRenameSubmit(e, session.id)}
                                                    className="w-full text-[10px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-blue-500 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </form>
                                        ) : (
                                            <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate font-medium">
                                                {session.title}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* 3 dots menu button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuOpenId(menuOpenId === session.id ? null : session.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all p-0.5 rounded"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {menuOpenId === session.id && (
                                        <div 
                                            className="absolute right-2 top-8 z-50 w-28 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-lg py-1 flex flex-col"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => {
                                                    setEditingId(session.id);
                                                    setEditTitle(session.title);
                                                    setMenuOpenId(null);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-[10px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex gap-2 items-center"
                                            >
                                                ✏️ Rename
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteSession?.(session.id);
                                                    setMenuOpenId(null);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-[10px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex gap-2 items-center"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    )}
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
                            {displaySources.length} Source{displaySources.length !== 1 ? 's' : ''} · {platforms.length} Platform{platforms.length !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={() => {
                                if (activeTool === 'research') {
                                    clearResearch?.();
                                } else {
                                    window.location.reload();
                                }
                            }}
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
