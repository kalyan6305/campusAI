import React, { useState } from 'react';
import CampusSidebar from '../components/campus/CampusSidebar';
import CampusHeader from '../components/campus/CampusHeader';

import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import useChatStore from '../store/chatStore';
import useRagStore from '../store/ragStore';

const CampusPage = () => {
    const [selectedModule, setSelectedModule] = useState('Academics');
    const {
        sendMessage,
        isStreaming,
        activeSessionId,
        createSession,
        getSessions,
        loadSessions,
        selectSession,
        deleteSession,
        clearActiveSession
    } = useChatStore();
    const sessions = getSessions();
    const { regulation, branch, year, semester, contentType } = useRagStore();

    React.useEffect(() => {
        loadSessions('campus');
        return () => clearActiveSession();
    }, [loadSessions, clearActiveSession]);

    const handleSend = async (content) => {
        const metadata = {
            mode: 'campus',
            module: selectedModule.toLowerCase(),
        };

        if (selectedModule === 'Academics') {
            metadata.regulation = regulation;
            metadata.branch = branch;
            metadata.year = year;
            metadata.semester = semester;
            metadata.content_type = contentType?.toLowerCase();
        }

        if (!activeSessionId) {
            await createSession(`Campus AI - ${selectedModule}`, 'campus');
        }
        await sendMessage(content, metadata);
    };

    const academicPath = [regulation, branch, year ? `Year ${year}` : null, semester, contentType]
        .filter(Boolean)
        .join(' → ');

    return (
        <div className="max-w-[1600px] mx-auto px-6 py-6 animate-fade-in flex gap-6 h-full overflow-hidden">
            {/* Left Sidebar */}
            <CampusSidebar
                selectedModule={selectedModule}
                onModuleSelect={setSelectedModule}
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={selectSession}
                onDeleteSession={deleteSession}
            />

            {/* Main Chat Area */}
            <div className="flex-grow flex flex-col min-w-0">
                <CampusHeader activeModule={selectedModule} />



                <div className="flex-grow bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col relative">
                    {/* Active Path Breadcrumb */}
                    {selectedModule === 'Academics' && academicPath && (
                        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-2 flex items-center justify-between">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                {academicPath}
                            </p>
                        </div>
                    )}

                    <div className="flex-grow overflow-hidden flex flex-col">
                        <ChatWindow />
                    </div>

                    <ChatInput onSend={handleSend} disabled={isStreaming} />
                </div>
            </div>
        </div>
    );
};

export default CampusPage;
