import React, { useState } from 'react';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import ResearchSidebar from '../components/sidebar/ResearchSidebar';
import ResearchDashboard from '../components/research/ResearchDashboard';
import useChatStore from '../store/chatStore';
import useResearchStore from '../store/researchStore';

const ToolsPage = () => {
    const {
        sendMessage,
        isStreaming,
        activeSessionId,
        createSession,
        researchSources: chatResearchSources,
        loadSessions,
        getSessions,
        selectSession,
        deleteSession,
        clearActiveSession
    } = useChatStore();
    
    const { sources: browserSources, isResearching } = useResearchStore();
    
    const sessions = getSessions();
    const [activeTool, setActiveTool] = useState('browser');

    React.useEffect(() => {
        loadSessions('tools');
        return () => clearActiveSession();
    }, [loadSessions, clearActiveSession]);

    const activeResults = activeTool === 'browser' ? { browser: chatResearchSources.browser, platform_links: chatResearchSources.platform_links } : { browser: browserSources };
    const activeStreaming = activeTool === 'browser' ? isStreaming : isResearching;

    const handleSend = async (content) => {
        if (!activeSessionId) {
            await createSession('Research Session', 'tools');
        }

        await sendMessage(content, { mode: 'tools', module: 'tools' });
    };

    const handleSelectSession = (id) => {
        setActiveTool('browser');
        selectSession(id);
    };

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-6 animate-fade-in flex gap-6 h-full overflow-hidden">
            {/* Left Research Sidebar */}
            <div className="w-80 h-full flex-shrink-0">
                <ResearchSidebar
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    results={activeResults}
                    isStreaming={activeStreaming}
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    onSelectSession={handleSelectSession}
                    onDeleteSession={deleteSession}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative border-t-4 border-t-blue-600 dark:border-t-blue-500">
                <header className="p-5 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/20 dark:bg-gray-800/30">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-gray-100 tracking-tight">RESEARCH DASHBOARD</h1>
                        <div className="flex items-center gap-2 mt-1">
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">Current Focus</span>
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800/40">
                                {activeTool === 'browser' ? 'Web Research' : 'Deep Research'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="flex-grow overflow-hidden flex flex-col">
                    {activeTool === 'deep_research' ? (
                        <ResearchDashboard />
                    ) : (
                        <>
                            <ChatWindow />
                            <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                                <ChatInput onSend={handleSend} disabled={isStreaming} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ToolsPage;
