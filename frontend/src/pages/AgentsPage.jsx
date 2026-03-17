import React, { useState } from 'react';
import AgentCard from '../components/agents/AgentCard';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import useChatStore from '../store/chatStore';
import JobApplyAgentUI from '../components/agents/JobApplyAgentUI';
import ResumeAgentUI from '../components/agents/ResumeAgentUI';
import InterviewAgentUI from '../components/agents/InterviewAgentUI';
import CodingAgentUI from '../components/agents/CodingAgentUI';

const AgentsPage = () => {
    const [selectedAgent, setSelectedAgent] = useState(null);
    const [showHistory, setShowHistory] = useState(true);
    const { sendMessage, isStreaming, activeSessionId, createSession, clearActiveSession, loadSessions, getSessions, selectSession, deleteSession } = useChatStore();
    const sessions = getSessions();

    React.useEffect(() => {
        loadSessions('agents');
        return () => clearActiveSession();
    }, [loadSessions, clearActiveSession]);

    const agents = [
        { id: 'job-apply', name: 'Job Assistant Agent', icon: '🚀', description: 'Find relevant jobs for seekers & graduates. Search by role, filter by location, and get direct application links.', color: 'blue' },
        { id: 'academic', name: 'Academics Agent', icon: '📖', description: 'Syllabus-based expert tutoring.', color: 'purple' },
        { id: 'coding', name: 'Coding Agent', icon: '💻', description: 'Generate code, debug programs, and practice coding with an AI-powered coding workspace.', color: 'amber' },
        { id: 'interview', name: 'Interview Prep Agent', icon: '🎯', description: 'Practice role-specific interview questions and get expert feedback to ace your next job.', color: 'blue' },
        { id: 'resume', name: 'Resume Agent', icon: '📄', description: 'Optimize your resume for a specific job role by comparing it with a job description and generating a tailored version.', color: 'rose' },
        // { id: 'analysis', name: 'Analysis Agent', icon: '📊', description: 'Data trends and insight generation.', color: 'amber' },
        // { id: 'current_affairs', name: 'Current Affairs Agent', icon: '📰', description: 'Real-time global news & developments.', color: 'rose' }
    ];

    const activeAgent = agents.find(a => a.id === selectedAgent);

    const handleSend = async (content) => {
        if (!activeAgent) return;
        if (!activeSessionId) {
            await createSession(`Chat with ${activeAgent.name}`, 'agents');
        }
        await sendMessage(content, { mode: selectedAgent, module: 'agents' });
    };

    const handleSelectAgent = (agentId) => {
        clearActiveSession();
        setSelectedAgent(agentId);
    };

    const handleBack = () => {
        clearActiveSession();
        setSelectedAgent(null);
        setShowHistory(true);
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

                            {/* History toggle — only show if sidebar is applicable */}
                            {(selectedAgent !== 'resume' && selectedAgent !== 'interview') && (
                                <button
                                    onClick={() => setShowHistory(prev => !prev)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-100 dark:hover:border-blue-800 shadow-sm transition-all text-[10px] font-bold uppercase tracking-wider"
                                    title={showHistory ? 'Hide History' : 'Show History'}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {showHistory
                                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        }
                                    </svg>
                                    {showHistory ? 'Hide History' : 'Show History'}
                                </button>
                            )}
                        </div>
                    </header>

                    <div className="flex-grow flex gap-6 min-w-0 h-full overflow-hidden">
                        {/* Agent-Specific History Sidebar */}
                        {showHistory && (selectedAgent !== 'resume' && selectedAgent !== 'interview' && selectedAgent !== 'coding') && (
                            <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col transition-all duration-300">
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
                        )}

                        {/* Chat Section */}
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col relative">
                            {selectedAgent === 'job-apply' ? (
                                <JobApplyAgentUI />
                            ) : selectedAgent === 'resume' ? (
                                <ResumeAgentUI />
                            ) : selectedAgent === 'interview' ? (
                                <InterviewAgentUI />
                            ) : selectedAgent === 'coding' ? (
                                <CodingAgentUI />
                            ) : (
                                <>
                                    <div className="flex-grow overflow-hidden flex flex-col bg-gray-50/20 dark:bg-gray-900/10">
                                        <ChatWindow />
                                    </div>
                                    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700">
                                        <ChatInput onSend={handleSend} disabled={isStreaming} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentsPage;
