import React, { useState } from 'react';
import AgentCard from '../components/agents/AgentCard';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import useChatStore from '../store/chatStore';

const AgentsPage = () => {
    const [selectedAgent, setSelectedAgent] = useState(null);
    const { sendMessage, isStreaming, activeSessionId, createSession, clearActiveSession } = useChatStore();

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
            await createSession(`Chat with ${activeAgent.name}`);
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

                    {/* Chat Section */}
                    <div className="flex-grow bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col relative">
                        <div className="flex-grow overflow-hidden flex flex-col bg-gray-50/20 dark:bg-gray-900/10">
                            <ChatWindow />
                        </div>
                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700">
                            <ChatInput onSend={handleSend} disabled={isStreaming} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentsPage;
