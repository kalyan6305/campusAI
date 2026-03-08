import { useEffect, useRef } from 'react';
import useChatStore from '../../store/chatStore';
import MessageBubble from './MessageBubble';

export default function ChatWindow() {
    const { messages, isStreaming, streamingContent, activeSessionId } = useChatStore();
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent]);

    if (!activeSessionId) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50/50 dark:bg-gray-800/30">
                <div className="text-center animate-fade-in max-w-sm">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-3xl shadow-sm border border-blue-100 dark:border-blue-900/50">
                        🎓
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 font-sans tracking-tight">Campus AI Assistant</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                        Start a new conversation or select a session from the sidebar to begin.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto pt-8 pb-4 custom-scrollbar">
            <div className="max-w-4xl mx-auto">
                {messages.map((msg, idx) => (
                    <MessageBubble key={idx} index={idx} role={msg.role} content={msg.content} />
                ))}

                {/* Streaming indicator */}
                {isStreaming && (
                    <div className="flex justify-start mb-6 px-4 animate-fade-in">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3 mt-1 shadow-sm">
                            <span className="text-xs font-bold text-white uppercase">AI</span>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm max-w-[85%]">
                            {streamingContent ? (
                                <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">
                                    {streamingContent}<span className="inline-block w-1 h-4 bg-blue-600 dark:bg-blue-500 ml-1 animate-pulse" />
                                </p>
                            ) : (
                                <div className="flex items-center gap-1 py-1.5">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div ref={bottomRef} className="h-4" />
            </div>
        </div>
    );
}
