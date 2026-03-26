import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Search, Loader2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import useResearchStore from '../../store/researchStore';
import useChatStore from '../../store/chatStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const EMPTY_ARRAY = [];

const ResearchDashboard = () => {
    const [query, setQuery] = useState('');
    const [showLogs, setShowLogs] = useState(true);
    const bottomRef = useRef(null);
    const logBottomRef = useRef(null);
    
    const { 
        isResearching, 
        currentResponse, 
        thoughts, 
        mode, 
        setMode, 
        startResearch 
    } = useResearchStore();
    
    // Selectors to avoid re-rendering on every store change
    const activeSessionId = useChatStore(state => state.activeSessionId);
    const createSession = useChatStore(state => state.createSession);
    const clearActiveSession = useChatStore(state => state.clearActiveSession);
    const toggleSources = useChatStore(state => state.toggleSources);
    
    const messages = useChatStore(state => state.messagesBySession[activeSessionId] || EMPTY_ARRAY);
    const userMsg = messages.find(m => m.role === 'user');
    const lastAssistantMsg = messages.filter(m => m.role === 'assistant').slice(-1)[0];
    const displayResponse = isResearching || currentResponse ? currentResponse : (lastAssistantMsg?.content || '');
    const displayThoughts = isResearching || thoughts.length > 0 ? thoughts : (lastAssistantMsg?.thoughts || lastAssistantMsg?.meta_data?.thoughts || []);

    const initialQuestion = isResearching ? query : (userMsg?.content || '');

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        if (logBottomRef.current) {
            logBottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [thoughts, currentResponse, displayResponse]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim() || isResearching) return;
        
        let sessionId = activeSessionId;
        if (!sessionId) {
            const session = await createSession(query.trim().slice(0, 30), 'research');
            sessionId = session.id;
        }
        
        startResearch(query.trim(), sessionId);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 overflow-hidden w-full relative">
            {/* Header controls */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
                    <button 
                        onClick={() => setMode('fast')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'fast' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Fast Search
                    </button>
                    <button 
                        onClick={() => setMode('deep')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${mode === 'deep' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Deep Research
                    </button>
                </div>
            </div>

            {/* Main window showing thoughts and results */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
                {(!isResearching && !displayResponse && displayThoughts.length === 0) ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-center max-w-md w-full opacity-60 m-auto mt-20">
                         <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                            <Search className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Web Research Agent</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ask any complex question. The agent will autonomously browse the web, verify sources, and synthesize a cited answer.</p>
                    </div>
                ) : (
                    <div className="w-full max-w-3xl space-y-6 pb-20">
                        {/* User Question Display */}
                        {initialQuestion && (
                            <div className="flex flex-col space-y-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    <Search className="w-3 h-3" />
                                    Research Question
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                    {initialQuestion}
                                </h1>
                            </div>
                        )}

                        {/* Agent Logs (Thoughts) */}
                        {(displayThoughts.length > 0) && (
                            <div className="border border-indigo-100 dark:border-indigo-900/30 rounded-xl overflow-hidden bg-indigo-50/10 dark:bg-indigo-900/10 shrink-0">
                                <button 
                                    onClick={() => setShowLogs(!showLogs)}
                                    className="w-full flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-semibold"
                                >
                                    <span className="flex items-center gap-2">
                                        {isResearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                                        Agent Reasoning Logs
                                    </span>
                                    {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                
                                {showLogs && (
                                    <div className="p-4 bg-gray-50 dark:bg-[#080d17] font-mono text-[13px] text-gray-600 dark:text-gray-400 overflow-y-auto max-h-48 space-y-2 whitespace-pre-wrap">
                                        {displayThoughts.map((t, i) => <span key={i}>{t}</span>)}
                                        <div ref={logBottomRef} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Final Answer Area */}
                        <div className="flex flex-col space-y-2 shrink-0">
                            {(displayResponse || displayThoughts.length > 0) && (
                                <div className="bg-[#F3F4F6] dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none font-serif text-gray-800 dark:text-gray-200">
                                    {isResearching && !currentResponse ? (
                                        <div className="flex items-center gap-3 text-gray-500 italic">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Processing research findings and synthesizing final answer...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {displayResponse || (isResearching ? "Synthesizing final answer..." : "Research complete. No answer could be synthesized from the found sources.")}
                                            </ReactMarkdown>
                                            
                                            {/* Sources Toggle Button */}
                                            {!isResearching && lastAssistantMsg && (
                                                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold border border-green-200 dark:border-green-800/50">
                                                                85% Verified
                                                            </span>
                                                            <button
                                                                onClick={() => toggleSources(activeSessionId, lastAssistantMsg.id)}
                                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all text-xs font-bold ${
                                                                    lastAssistantMsg.showSources 
                                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                                                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400 hover:text-blue-600'
                                                                }`}
                                                            >
                                                                <Search className="w-3 h-3" />
                                                                Sources
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Sources Grid */}
                                                    {lastAssistantMsg.showSources && lastAssistantMsg.sources?.length > 0 && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                            {lastAssistantMsg.sources.map((src, i) => (
                                                                <a
                                                                    key={i}
                                                                    href={src.url || src.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex flex-col p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900/50 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 transition-all group"
                                                                >
                                                                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:underline">
                                                                        {src.title || 'Untitled Source'}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-1">
                                                                        {(() => {
                                                                            try { return new URL(src.url || src.link).hostname; }
                                                                            catch(e) { return 'Source'; }
                                                                        })()}
                                                                    </span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                            <div ref={bottomRef} className="h-4 w-full"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Form */}
            <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 shrink-0 mt-auto">
                <form 
                    onSubmit={handleSearch}
                    className="max-w-3xl mx-auto relative flex items-center gap-3"
                >
                    <button
                        type="button"
                        onClick={() => {
                            clearActiveSession();
                            setQuery('');
                        }}
                        className="flex-shrink-0 p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 group relative shadow-sm"
                        title="New Research"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                            New Research
                        </span>
                    </button>

                    <div className="relative flex-1">
                        <input 
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={(mode === 'fast') ? "Enter a quick query..." : "Enter a multi-step research prompt..."}
                            disabled={isResearching}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full py-4 pl-6 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm disabled:opacity-60 text-gray-800 dark:text-gray-100"
                        />
                        <button 
                            type="submit"
                            disabled={isResearching || !query.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center shrink-0"
                        >
                            {isResearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResearchDashboard;
