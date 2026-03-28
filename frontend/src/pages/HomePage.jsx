import React from 'react';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import useChatStore from '../store/chatStore';

const HomePage = () => {
    const {
        sendMessage,
        isStreaming,
        activeSessionId,
        createSession,
        loadSessions,
        clearActiveSession
    } = useChatStore();

    React.useEffect(() => {
        // Set module and load sessions on mount
        loadSessions('chat');

        return () => {
            // Clear state on unmount
            clearActiveSession();
        };
    }, [loadSessions, clearActiveSession]);

    const handleSend = async (content) => {
        if (!activeSessionId) {
            await createSession('New Chat', 'chat');
        }
        await sendMessage(content, { mode: 'general', module: 'chat' });
    };

    return (
        <div className="page-container animate-fade-in flex flex-col h-full overflow-hidden pt-2">
            {/* Chat Container - Standardized Card Style */}
            <div className="flex-grow bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col relative">
                <div className="flex-grow overflow-hidden flex flex-col">
                    <ChatWindow />
                </div>

                <ChatInput onSend={handleSend} disabled={isStreaming} />
            </div>
        </div>
    );
};

export default HomePage;
