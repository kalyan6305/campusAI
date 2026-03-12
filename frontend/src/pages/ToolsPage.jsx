import React, { useState, useCallback } from 'react';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import ResearchSidebar from '../components/sidebar/ResearchSidebar';
import useChatStore from '../store/chatStore';
import useResearchStore from '../store/useResearchStore';
import ReactMarkdown from 'react-markdown';

const ToolsPage = () => {
    const { sendMessage, isStreaming, activeSessionId, createSession, researchSources, loadSessions, sessions, selectSession, deleteSession, renameSession, clearActiveSession, messages } = useChatStore();
    const { startResearch, thoughts, answer, isResearching, researchMode, setResearchMode, clearResearch, sources: researchSourcesList, restoreFromMessages } = useResearchStore();
    const [activeTool, setActiveTool] = useState('browser');

    React.useEffect(() => {
        const module = activeTool === 'research' ? 'research' : 'tools';
        loadSessions(module);
    }, [activeTool, loadSessions]);

    const handleToolChange = (tool) => {
        if (tool !== activeTool) {
            setActiveTool(tool);
            clearActiveSession();
            clearResearch();
        }
    };

    /**
     * Custom session selection handler:
     * 1. Loads messages from the DB via selectSession
     * 2. Parses __SOURCES__ system messages to restore links in sidebar
     * 3. For research mode, restores answer + sources into useResearchStore
     */
    const handleSelectSession = useCallback(async (sessionId) => {
        await selectSession(sessionId);

        // Give Zustand a tick to update messages
        setTimeout(() => {
            const loadedMessages = useChatStore.getState().messages;
            if (!loadedMessages || loadedMessages.length === 0) return;

            // For research mode: restore answer + sources into research store
            if (activeTool === 'research') {
                restoreFromMessages(loadedMessages);
            }

            // Extract __SOURCES__ from loaded messages
            const storedSources = [];
            for (const msg of loadedMessages) {
                if (msg.role === 'system' && msg.content?.startsWith('__SOURCES__:')) {
                    try {
                        const json = msg.content.slice('__SOURCES__:'.length);
                        const parsed = JSON.parse(json);
                        storedSources.push(...parsed);
                    } catch (e) {
                        console.error('Failed to parse stored sources:', e);
                    }
                }
            }
            if (storedSources.length > 0) {
                // Restore into research store for sidebar rendering (all tabs)
                useResearchStore.setState(() => ({ sources: storedSources }));
                // Also restore into chatStore researchSources for browser/social tab sidebar
                useChatStore.setState(() => ({
                    researchSources: { browser: storedSources, social: [] }
                }));
            } else {
                // Clear sources if the historical session didn't have any saved
                useResearchStore.setState(() => ({ sources: [] }));
                useChatStore.setState(() => ({
                    researchSources: { browser: [], social: [] }
                }));
            }
        }, 100);
    }, [activeTool, selectSession, restoreFromMessages]);

    const handleSend = async (content) => {
        if (activeTool === 'research') {
            let sid = activeSessionId;
            if (!sid) sid = await createSession('Deep Research Session', 'research');
            await startResearch(content, sid);
            return;
        }

        if (!activeSessionId) {
            await createSession('Research Session', 'tools');
        }

        await sendMessage(content, { mode: 'tools' });
    };

    // Filter visible messages (hide __SOURCES__ system messages from the UI)
    const visibleMessages = messages.filter(
        m => !(m.role === 'system' && m.content?.startsWith('__SOURCES__:'))
    );

    // For research tab: determine if we're viewing a historical session
    const hasLoadedResearchHistory = activeTool === 'research' && !isResearching && !answer && visibleMessages.length > 0;
    // that already has an answer loaded. (We hide input if historical answer exists)
    const showInput = activeTool !== 'research' || !answer;

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-6 animate-fade-in flex gap-6 h-full overflow-hidden">
            {/* Left Research Sidebar */}
            <div className="w-80 h-full flex-shrink-0">
                <ResearchSidebar
                    activeTool={activeTool}
                    setActiveTool={handleToolChange}
                    results={researchSources}
                    isStreaming={isStreaming || isResearching}
                    researchSourcesList={researchSourcesList}
                    clearResearch={clearResearch}
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    onSelectSession={handleSelectSession}
                    onDeleteSession={deleteSession}
                    onRenameSession={renameSession}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative border-t-4 border-t-blue-600 dark:border-t-blue-500">
                <header className="p-5 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/20 dark:bg-gray-800/30">
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight uppercase">Research Dashboard</h1>
                        <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.15em]">AI Analyst Active</p>
                            </div>
                            {/* Removed Fast/Deep Toggle as Deep Research is the new default standard */}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">Current Focus</span>
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800/40">
                                {activeTool === 'browser' ? 'Web Research' : activeTool === 'social' ? 'Social Sentiment' : 'Deep Research'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="flex-grow overflow-hidden flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {activeTool === 'research' ? (
                        <div className="space-y-6">
                            {/* Live research thoughts */}
                            {thoughts.map((thought, idx) => (
                                <div key={idx} className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 p-4 rounded-xl animate-fade-in">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs">💭</span>
                                        <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Internal Reasoning</p>
                                    </div>
                                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic">{thought}</p>
                                </div>
                            ))}
                            
                            {/* Live or restored research answer */}
                            {answer && (
                                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm animate-fade-in slide-up">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-lg">🎯</span>
                                        <p className="text-[11px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">Synthesized Research</p>
                                    </div>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
                                        <ReactMarkdown>{answer}</ReactMarkdown>
                                    </div>
                                </div>
                            )}

                            {/* Loaded historical messages when no active research/answer */}
                            {hasLoadedResearchHistory && visibleMessages.map((msg, idx) => (
                                <div key={idx} className={`p-4 rounded-xl animate-fade-in ${
                                    msg.role === 'user'
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50'
                                        : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm'
                                }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs">{msg.role === 'user' ? '👤' : '🎯'}</span>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                            {msg.role === 'user' ? 'Your Query' : 'Synthesized Research'}
                                        </p>
                                    </div>
                                    <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}

                            {isResearching && (
                                <div className="flex flex-col items-center py-10 space-y-4">
                                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Sifting through data...</p>
                                </div>
                            )}

                            {/* Empty state */}
                            {!isResearching && !answer && visibleMessages.length === 0 && (
                                <div className="flex flex-col items-center py-16 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-4xl mb-4 opacity-50">🔬</div>
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Deep Research Mode</p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 leading-relaxed max-w-xs">
                                        Enter a query below to start a multi-source deep investigation across web, social platforms, and academic sources.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <ChatWindow />
                    )}
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                    <ChatInput onSend={handleSend} disabled={isStreaming} />
                </div>
            </div>
        </div>
    );
};

export default ToolsPage;

