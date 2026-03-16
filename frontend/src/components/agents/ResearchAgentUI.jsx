import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { researchAPI } from '../../services/api';

// ── Mode Config ───────────────────────────────────────────────────────────────

const MODES = [
    {
        id: 'topic',
        label: 'Topic Research',
        icon: '🔬',
        color: 'emerald',
        placeholder: 'e.g. Explain Retrieval Augmented Generation, What are AI Agents?',
        hint: 'Enter any research topic or question for a structured, in-depth explanation.',
        supportsFile: false,
        inputLabel: 'Research Topic / Question',
    },
    {
        id: 'paper_analysis',
        label: 'Paper Analysis',
        icon: '📄',
        color: 'blue',
        placeholder: 'Optional: Specific aspects to focus on (e.g. methodology, findings)...',
        hint: 'Upload a research paper (PDF or DOCX) for a structured breakdown.',
        supportsFile: true,
        inputLabel: 'Focus Query (optional)',
    },
    {
        id: 'project_ideas',
        label: 'Project Ideas',
        icon: '💡',
        color: 'amber',
        placeholder: 'e.g. AI project ideas for final year students, ML topics in healthcare...',
        hint: 'Describe a field or domain and get 5 innovative project ideas with implementation roadmaps.',
        supportsFile: false,
        inputLabel: 'Field / Domain',
    },
    {
        id: 'writing_assistance',
        label: 'Writing Assistance',
        icon: '✍️',
        color: 'purple',
        placeholder: 'Enter your research topic...',
        hint: 'Get structured academic writing — abstracts, introductions, literature review outlines, and methodologies.',
        supportsFile: false,
        inputLabel: 'Research Topic',
    },
];

const WRITING_TYPES = [
    { value: 'abstract', label: 'Abstract' },
    { value: 'introduction', label: 'Introduction' },
    { value: 'literature_review', label: 'Literature Review Outline' },
    { value: 'methodology', label: 'Research Methodology' },
];

const COLOR_MAP = {
    emerald: {
        tab: 'bg-emerald-500 text-white',
        tabHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400',
        badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50',
        btn: 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25',
        ring: 'focus:ring-emerald-500',
        icon: 'bg-emerald-100 dark:bg-emerald-900/30',
        dot: 'bg-emerald-500',
    },
    blue: {
        tab: 'bg-blue-500 text-white',
        tabHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400',
        badge: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-800/50',
        btn: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25',
        ring: 'focus:ring-blue-500',
        icon: 'bg-blue-100 dark:bg-blue-900/30',
        dot: 'bg-blue-500',
    },
    amber: {
        tab: 'bg-amber-500 text-white',
        tabHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-400',
        badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-800/50',
        btn: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25',
        ring: 'focus:ring-amber-500',
        icon: 'bg-amber-100 dark:bg-amber-900/30',
        dot: 'bg-amber-500',
    },
    purple: {
        tab: 'bg-purple-500 text-white',
        tabHover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-400',
        badge: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-800/50',
        btn: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-500/25',
        ring: 'focus:ring-purple-500',
        icon: 'bg-purple-100 dark:bg-purple-900/30',
        dot: 'bg-purple-500',
    },
};

// ── Confidence Block Parser ───────────────────────────────────────────────────

function ConfidenceBlock({ score, points }) {
    const numScore = parseInt(score, 10);
    const color = numScore >= 85 ? 'emerald' : numScore >= 70 ? 'blue' : 'amber';
    const colorMap = {
        emerald: { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/40' },
        blue: { bar: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800/40' },
        amber: { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800/40' },
    }[color];

    return (
        <div className={`mt-6 p-5 rounded-2xl border ${colorMap.bg} ${colorMap.border}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">AI Confidence</span>
                <span className={`text-2xl font-black ${colorMap.text}`}>{score}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-4">
                <div className={`h-full ${colorMap.bar} transition-all duration-1000`} style={{ width: score }} />
            </div>
            <ul className="space-y-1">
                {points.map((p, i) => (
                    <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-2">
                        <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${colorMap.bar} flex-shrink-0`} />
                        {p}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function parseConfidenceBlock(text) {
    const match = text.match(/:::confidence\n([\s\S]*?):::/);
    if (!match) return { mainText: text, confidence: null };

    const block = match[1];
    const scoreMatch = block.match(/SCORE:\s*(\d+%)/);
    const score = scoreMatch ? scoreMatch[1] : null;
    const points = block.split('\n')
        .filter(l => l.trim().startsWith('-'))
        .map(l => l.replace(/^[-\s]+/, '').trim());

    const mainText = text.replace(/:::confidence\n[\s\S]*?:::/, '').trim();
    return { mainText, confidence: score ? { score, points } : null };
}

// ── Main Component ────────────────────────────────────────────────────────────

const ResearchAgentUI = () => {
    const [activeMode, setActiveMode] = useState('topic');
    const [query, setQuery] = useState('');
    const [file, setFile] = useState(null);
    const [writingType, setWritingType] = useState('abstract');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [streamedText, setStreamedText] = useState('');
    const [isDone, setIsDone] = useState(false);
    const [error, setError] = useState('');
    const outputRef = useRef(null);
    const fileInputRef = useRef(null);

    const mode = MODES.find(m => m.id === activeMode);
    const colors = COLOR_MAP[mode.color];

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [streamedText]);

    const handleModeSwitch = (id) => {
        if (isAnalyzing) return;
        setActiveMode(id);
        setQuery('');
        setFile(null);
        setStreamedText('');
        setIsDone(false);
        setError('');
    };

    const handleAnalyze = async () => {
        const effectiveQuery = activeMode === 'writing_assistance'
            ? `Writing type: ${writingType}\nTopic: ${query}`
            : query;

        if (!effectiveQuery.trim() && !file) return;

        setIsAnalyzing(true);
        setStreamedText('');
        setIsDone(false);
        setError('');

        try {
            await researchAPI.analyze(
                activeMode,
                effectiveQuery,
                file,
                (token) => setStreamedText(prev => prev + token),
                () => { setIsDone(true); setIsAnalyzing(false); },
                (err) => { setError(err); setIsAnalyzing(false); }
            );
        } catch (e) {
            setError(e.message);
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        setStreamedText('');
        setIsDone(false);
        setError('');
        setQuery('');
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const canSubmit = activeMode === 'paper_analysis'
        ? (file !== null)
        : query.trim().length > 0;

    const { mainText, confidence } = isDone ? parseConfidenceBlock(streamedText) : { mainText: streamedText, confidence: null };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Mode Tabs */}
            <div className="px-6 pt-5 pb-0 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                    {MODES.map((m) => {
                        const mc = COLOR_MAP[m.color];
                        const isActive = activeMode === m.id;
                        return (
                            <button
                                key={m.id}
                                onClick={() => handleModeSwitch(m.id)}
                                disabled={isAnalyzing}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                                    isActive
                                        ? `${mc.tab} border-transparent shadow-md`
                                        : `text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 ${mc.tabHover}`
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                <span>{m.icon}</span>
                                <span>{m.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex gap-0 overflow-hidden">
                {/* Input Panel */}
                <div className={`w-80 flex-shrink-0 flex flex-col gap-4 p-5 border-r border-gray-100 dark:border-gray-700 overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-gray-900/20 ${(isAnalyzing || streamedText) ? 'hidden lg:flex' : 'flex'}`}>

                    {/* Mode Hint */}
                    <div className={`p-4 rounded-2xl border ${colors.badge} border-opacity-60`}>
                        <div className="flex items-start gap-3">
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${colors.icon}`}>{mode.icon}</span>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">{mode.label}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{mode.hint}</p>
                            </div>
                        </div>
                    </div>

                    {/* Writing Type Selector */}
                    {activeMode === 'writing_assistance' && (
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 block">Writing Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {WRITING_TYPES.map(t => (
                                    <button
                                        key={t.value}
                                        onClick={() => setWritingType(t.value)}
                                        className={`px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                                            writingType === t.value
                                                ? `${colors.tab} border-transparent`
                                                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* File Upload */}
                    {mode.supportsFile && (
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 block">Upload Paper</label>
                            <div className="relative group cursor-pointer">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.docx,.txt"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={`p-5 border-2 border-dashed rounded-2xl text-center transition-all ${
                                    file
                                        ? 'border-blue-400 bg-blue-50/30 dark:bg-blue-900/10'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 group-hover:border-blue-300'
                                }`}>
                                    <p className="text-lg mb-1">{file ? '📎' : '📂'}</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                        {file ? file.name : 'Click to upload PDF or DOCX'}
                                    </p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase font-bold tracking-widest">
                                        {file ? 'File selected' : 'PDF · DOCX · TXT'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Query Input — hidden for Paper Analysis (file only) */}
                    {activeMode !== 'paper_analysis' && (
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 block">
                                {mode.inputLabel}
                            </label>
                            <textarea
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={mode.placeholder}
                                rows={mode.supportsFile ? 3 : 5}
                                className={`w-full p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 ${colors.ring} resize-none placeholder-gray-400 dark:placeholder-gray-600 leading-relaxed`}
                            />
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !canSubmit}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.15em] text-xs transition-all shadow-xl text-white ${
                            isAnalyzing || !canSubmit
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 shadow-none'
                                : `${colors.btn} shadow-lg`
                        }`}
                    >
                        {isAnalyzing ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Analyzing...
                            </span>
                        ) : `Analyze →`}
                    </button>

                    {(streamedText || isDone) && (
                        <button
                            onClick={handleReset}
                            className="w-full py-3 rounded-2xl font-black uppercase tracking-widest text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all"
                        >
                            New Analysis
                        </button>
                    )}
                </div>

                {/* Output Panel */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {!streamedText && !isAnalyzing && !error ? (
                        /* Welcome Screen */
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className={`w-20 h-20 rounded-3xl ${colors.icon} flex items-center justify-center text-4xl mb-6 shadow-lg`}>
                                {mode.icon}
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3 uppercase tracking-tight">
                                {mode.label}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm leading-relaxed text-sm">{mode.hint}</p>
                            <div className={`mt-8 flex flex-wrap justify-center gap-2`}>
                                {activeMode === 'topic' && ['Retrieval Augmented Generation', 'Transformer Architecture', 'Diffusion Models'].map(s => (
                                    <button key={s} onClick={() => setQuery(s)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border ${colors.badge} transition-all hover:opacity-80`}>
                                        {s}
                                    </button>
                                ))}
                                {activeMode === 'project_ideas' && ['Final Year AI Projects', 'ML in Healthcare', 'Generative AI Topics'].map(s => (
                                    <button key={s} onClick={() => setQuery(s)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border ${colors.badge} transition-all hover:opacity-80`}>
                                        {s}
                                    </button>
                                ))}
                                {activeMode === 'writing_assistance' && ['Deep Learning', 'Natural Language Processing', 'Computer Vision'].map(s => (
                                    <button key={s} onClick={() => setQuery(s)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border ${colors.badge} transition-all hover:opacity-80`}>
                                        {s}
                                    </button>
                                ))}
                                {activeMode === 'paper_analysis' && (
                                    <p className="text-xs text-gray-400 italic mt-2">Upload a PDF or DOCX paper using the panel on the left.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Output Area */
                        <div ref={outputRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                            {/* Header bar */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isAnalyzing ? `${colors.dot} animate-pulse` : colors.dot}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                        {isAnalyzing ? 'Analyzing...' : isDone ? 'Analysis Complete' : 'Ready'}
                                    </span>
                                </div>
                                {(streamedText || isDone) && !isAnalyzing && (
                                    <button onClick={handleReset}
                                        className="text-[10px] font-black uppercase tracking-wider text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                                        ← New Analysis
                                    </button>
                                )}
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-2xl text-sm text-red-600 dark:text-red-400 font-medium">
                                    ⚠️ {error}
                                </div>
                            )}

                            {/* Streaming or final markdown */}
                            {mainText && (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                                    <div className="research-output prose dark:prose-invert max-w-none text-sm leading-relaxed">
                                        <ReactMarkdown>{mainText}</ReactMarkdown>
                                    </div>
                                    {isAnalyzing && (
                                        <span className={`inline-block w-0.5 h-4 ml-0.5 mt-1 ${colors.dot} animate-pulse rounded`} />
                                    )}
                                </div>
                            )}

                            {/* Confidence Block */}
                            {confidence && <ConfidenceBlock score={confidence.score} points={confidence.points} />}
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .research-output h1 { font-size: 1.5rem; font-weight: 900; margin-bottom: 1rem; color: #111827; }
                .dark .research-output h1 { color: #f9fafb; }
                .research-output h2 { font-size: 1.1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #059669; margin-top: 1.5rem; margin-bottom: 0.75rem; padding-bottom: 0.5rem; border-bottom: 2px solid #d1fae5; }
                .dark .research-output h2 { color: #34d399; border-color: #064e3b; }
                .research-output h3 { font-size: 1rem; font-weight: 700; color: #1e293b; margin-top: 1.25rem; margin-bottom: 0.5rem; }
                .dark .research-output h3 { color: #e2e8f0; }
                .research-output p { line-height: 1.75; color: #374151; margin-bottom: 0.75rem; }
                .dark .research-output p { color: #9ca3af; }
                .research-output ul { list-style: none; padding-left: 0; }
                .research-output li { padding-left: 1.5rem; position: relative; margin-bottom: 0.5rem; color: #374151; line-height: 1.7; }
                .dark .research-output li { color: #9ca3af; }
                .research-output li::before { content: "▸"; position: absolute; left: 0; color: #059669; font-weight: 900; }
                .research-output strong { color: #111827; font-weight: 800; }
                .dark .research-output strong { color: #f3f4f6; }
                .research-output code { background: #f1f5f9; color: #0f172a; padding: 0.15rem 0.4rem; border-radius: 0.375rem; font-size: 0.85em; }
                .dark .research-output code { background: #1e293b; color: #e2e8f0; }
                .research-output hr { border-color: #e2e8f0; margin: 1.5rem 0; }
                .dark .research-output hr { border-color: #374151; }
            `}} />
        </div>
    );
};

export default ResearchAgentUI;
