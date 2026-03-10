import React, { useState } from 'react';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import ResearchSidebar from '../components/sidebar/ResearchSidebar';
import useChatStore from '../store/chatStore';

const ToolsPage = () => {
    const {
        sendMessage,
        isStreaming,
        activeSessionId,
        createSession,
        researchSources,
        loadSessions,
        getSessions,
        selectSession,
        deleteSession,
        clearActiveSession
    } = useChatStore();
    const sessions = getSessions();
    const [activeTool, setActiveTool] = useState('browser');

    React.useEffect(() => {
        loadSessions('tools');
        return () => clearActiveSession();
    }, [loadSessions, clearActiveSession]);

    const handleSend = async (content) => {
        if (!activeSessionId) {
            await createSession('Research Session', 'tools');
        }

        await sendMessage(content, { mode: 'tools', module: 'tools' });
    };

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-6 animate-fade-in flex gap-6 h-full overflow-hidden">
            {/* Left Research Sidebar */}
            <div className="w-80 h-full flex-shrink-0">
                <ResearchSidebar
                    activeTool={activeTool}
                    setActiveTool={setActiveTool}
                    results={researchSources}
                    isStreaming={isStreaming}
                    sessions={sessions}
                    activeSessionId={activeSessionId}
                    onSelectSession={selectSession}
                    onDeleteSession={deleteSession}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative border-t-4 border-t-blue-600 dark:border-t-blue-500">
                <header className="p-5 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/20 dark:bg-gray-800/30">
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight uppercase">Research Dashboard</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.15em]">AI Analyst Active</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">Current Focus</span>
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800/40">
                                {activeTool === 'browser' ? 'Web Research' : 'Social Sentiment'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="flex-grow overflow-hidden flex flex-col">
                    <ChatWindow />
                </div>

                <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                    <ChatInput onSend={handleSend} disabled={isStreaming} />
                </div>
            </div>
        </div>
    );
};

export default ToolsPage;
