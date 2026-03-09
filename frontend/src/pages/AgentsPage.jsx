import React, { useState } from 'react';
import AgentCard from '../components/agents/AgentCard';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import useChatStore from '../store/chatStore';

const AgentsPage = () => {
    const [selectedAgent, setSelectedAgent] = useState(null);
    const { sendMessage, isStreaming, activeSessionId, createSession, clearActiveSession, loadSessions, sessions, selectSession, deleteSession } = useChatStore();

    React.useEffect(() => {
        loadSessions('agents');
    }, [loadSessions]);

    const agents = [
        { id: 'career', name: 'Career Agent', icon: '💼', description: 'Personalized career advice & profiling.', color: 'blue' },
        { id: 'academic', name: 'Academics Agent', icon: '📖', description: 'Syllabus-based expert tutoring.', color: 'indigo' },
        { id: 'research', name: 'Research Agent', icon: '🔍', description: 'Deep analysis and information retrieval.', color: 'purple' },
        { id: 'coding', name: 'Coding Agent', icon: '💻', description: 'Full-stack software development help.', color: 'emerald' },
        { id: 'analysis', name: 'Analysis Agent', icon: '📊', description: 'Data trends and insight generation.', color: 'amber' },
        { id: 'current_affairs', name: 'Current Affairs Agent', icon: '📰', description: 'Real-time global news & developments.', color: 'rose' }
    ];

    const activeAgent = agents.find(a => a.id === selectedAgent);

    const handleSend = async (content) => {
        if (!activeAgent) return;
        if (!activeSessionId) {
            await createSession(`Chat with ${activeAgent.name}`, 'agents');
        }
        await sendMessage(content, { mode: selectedAgent });
    };

    const handleSelectAgent = (agentId) => {
        clearActiveSession();
        setSelectedAgent(agentId);
    };

    const handleBack = () => {
        clearActiveSession();
        setSelectedAgent(null);
    };

    return (
        <div className="page-container animate-fade-in flex flex-col h-full overflow-hidden max-w-[1400px] mx-auto px-4 md:px-8 py-6">
            {!selectedAgent ? (
                <>
                    <header className="mb-10 text-center md:text-left">
                        <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
                            <span className="text-blue-600 dark:text-blue-400">AI</span> Agents
                        </h1>
                        <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 font-medium">
                            Interact with specialized AI agents for domain-specific questions.
                        </p>
                    </header>

                    {/* Agents Selection Grid */}
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up pb-10 flex-grow overflow-y-auto custom-scrollbar">
                        {agents.map((agent) => (
                            <AgentCard
                                key={agent.id}
                                agent={agent}
                                isActive={selectedAgent === agent.id}
                                onClick={handleSelectAgent}
                            />
                        ))}
                    </section>
                </>
            ) : (
                <div className="flex-grow flex flex-col min-w-0 h-full">
                    <header className="mb-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleBack}
                                className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-100 dark:hover:border-blue-800 shadow-sm transition-all group"
                                title="Back to Agents"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
                                    {activeAgent.icon} {activeAgent.name}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.15em]">Agent Activated & Ready</p>
                                </div>
                            </div>
                        </div>

                        <div className="hidden sm:flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">Active Mode</span>
                                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-800/40 uppercase tracking-wider">
                                    {activeAgent.id}
                                </span>
                            </div>
                        </div>
                    </header>

                    <div className="flex-grow flex gap-6 min-w-0 h-full overflow-hidden">
                        {/* Agent-Specific History Sidebar */}
                        <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-50 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30">
                                <h2 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Agent History</h2>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                                {sessions.length === 0 ? (
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 italic px-3 py-4 text-center">No agent sessions yet</p>
                                ) : (
                                    sessions.map((session) => (
                                        <div
                                            key={session.id}
                                            onClick={() => selectSession(session.id)}
                                            className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${session.id === activeSessionId
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800 shadow-sm font-bold'
                                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                                                }`}
                                        >
                                            <span className="text-[11px] truncate flex-1">{session.title}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSession(session.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all rounded-md hover:bg-white dark:hover:bg-gray-800"
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </aside>

                        {/* Chat Section */}
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col relative">
                            <div className="flex-grow overflow-hidden flex flex-col bg-gray-50/20 dark:bg-gray-900/10">
                                <ChatWindow />
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700">
                                <ChatInput onSend={handleSend} disabled={isStreaming} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentsPage;
