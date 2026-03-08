import React, { useState } from 'react';
import AgentCard from '../components/agents/AgentCard';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import useChatStore from '../store/chatStore';

const AgentsPage = () => {
    const [selectedAgent, setSelectedAgent] = useState('campus');
    const { sendMessage, isStreaming, activeSessionId, createSession } = useChatStore();

    const agents = [
        { id: 'medical', name: 'Medical Advisor', icon: '🏥', description: 'Helps with health-related information.' },
        { id: 'agriculture', name: 'Agriculture Expert', icon: '🌿', description: 'Provides guidance on agriculture and farming.' },
        { id: 'education', name: 'Education Mentor', icon: '📖', description: 'Supports academic and learning questions.' },
        { id: 'career', name: 'Career Guide', icon: '💼', description: 'Provides career advice and opportunities.' },
        { id: 'campus', name: 'Campus Assistant', icon: '🏛️', description: 'Answers questions related to campus life.' },
        { id: 'research', name: 'Research Assistant', icon: '🔍', description: 'Helps with research and complex information.' }
    ];

    const activeAgent = agents.find(a => a.id === selectedAgent);

    const handleSend = async (content) => {
        if (!activeSessionId) {
            await createSession(`Chat with ${activeAgent.name}`);
        }
        await sendMessage(content, { mode: 'agent', agent_type: selectedAgent });
    };

    return (
        <div className="page-container animate-fade-in flex flex-col h-full overflow-hidden">
            <header className="mb-8 flex-shrink-0">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">AI Agents</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 font-medium">
                    Interact with specialized AI agents for domain-specific questions.
                </p>
            </header>

            {/* Agents Selection Grid */}
            <section className="mb-10 grid grid-cols-2 md:grid-cols-3 gap-6 animate-slide-up">
                {agents.map((agent) => (
                    <AgentCard
                        key={agent.id}
                        agent={agent}
                        isActive={selectedAgent === agent.id}
                        onClick={setSelectedAgent}
                    />
                ))}
            </section>

            {/* Chat Section */}
            <div className="flex-grow flex flex-col min-w-0">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-800/40 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-[0.1em]">
                            Active Agent: {activeAgent.name}
                        </p>
                    </div>
                </div>

                <div className="flex-grow bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col relative">
                    <div className="flex-grow overflow-hidden flex flex-col bg-gray-50/30 dark:bg-gray-900/30">
                        <ChatWindow />
                    </div>
                    <ChatInput onSend={handleSend} disabled={isStreaming} />
                </div>
            </div>
        </div>
    );
};

export default AgentsPage;
