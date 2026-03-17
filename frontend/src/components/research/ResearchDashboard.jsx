import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import useResearchStore from '../../store/researchStore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        if (logBottomRef.current) {
            logBottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [thoughts, currentResponse]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!query.trim() || isResearching) return;
        startResearch(query.trim());
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
                {(!isResearching && !currentResponse && thoughts.length === 0) ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-center max-w-md w-full opacity-60 m-auto mt-20">
                         <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                            <Search className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">Web Research Agent</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Ask any complex question. The agent will autonomously browse the web, verify sources, and synthesize a cited answer.</p>
                    </div>
                ) : (
                    <div className="w-full max-w-3xl space-y-6 pb-20">
                        {/* Agent Logs (Thoughts) */}
                        {(thoughts.length > 0) && (
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
                                        {thoughts.map((t, i) => <span key={i}>{t}</span>)}
                                        <div ref={logBottomRef} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Final Answer */}
                        <div className="flex flex-col space-y-2 shrink-0">
                            {(currentResponse || (!isResearching && thoughts.length > 0)) && (
                                <div className="bg-[#F3F4F6] dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-none font-serif text-gray-800 dark:text-gray-200">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {currentResponse || (isResearching ? "Synthesizing final answer..." : "No answer produced.")}
                                    </ReactMarkdown>
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
                    className="max-w-3xl mx-auto relative flex items-center"
                >
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
                        className="absolute right-2 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center shrink-0"
                    >
                        {isResearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResearchDashboard;
