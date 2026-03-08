import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { speak, stopSpeaking } from '../../utils/tts';
import useChatStore from '../../store/chatStore';

export default function MessageBubble({ role, content, index }) {
    const isUser = role === 'user';
    const { editAndResend, isStreaming } = useChatStore();

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);
    const editInputRef = useRef(null);

    // Stop speaking if component unmounts
    useEffect(() => {
        return () => {
            if (isSpeaking) stopSpeaking();
        };
    }, [isSpeaking]);

    useEffect(() => {
        if (isEditing && editInputRef.current) {
            editInputRef.current.focus();
            // Move cursor to end
            const length = editInputRef.current.value.length;
            editInputRef.current.setSelectionRange(length, length);
        }
    }, [isEditing]);

    const handleToggleSpeak = () => {
        if (isSpeaking) {
            stopSpeaking();
            setIsSpeaking(false);
        } else {
            setIsSpeaking(true);
            speak(content, () => setIsSpeaking(false));
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleSaveEdit = async () => {
        if (editContent.trim() && editContent !== content) {
            await editAndResend(index, editContent.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSaveEdit();
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
            setEditContent(content);
        }
    };

    return (
        <div className={`group flex animate-slide-up ${isUser ? 'justify-end' : 'justify-start'} mb-6 px-4`}>
            {/* AI Avatar */}
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3 mt-1 shadow-sm">
                    <span className="text-xs font-bold text-white uppercase">AI</span>
                </div>
            )}

            {/* Bubble Container */}
            <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`relative rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed ${isUser
                        ? 'bg-blue-600 dark:bg-blue-700 text-white rounded-tr-none'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-700'
                        }`}
                >
                    {isEditing ? (
                        <div className="min-w-[300px]">
                            <textarea
                                ref={editInputRef}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-blue-700 dark:bg-blue-800 text-white border-none rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-300 outline-none resize-none min-h-[60px]"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => { setIsEditing(false); setEditContent(content); }}
                                    className="px-2 py-1 text-[11px] font-bold text-blue-200 dark:text-blue-300 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={isStreaming}
                                    className="px-3 py-1 bg-white dark:bg-gray-100 text-blue-600 dark:text-blue-700 rounded-md text-[11px] font-bold shadow-sm hover:bg-blue-50 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Save & Resend
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-gray dark:prose-invert'}`}>
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                    )}

                    {/* Action Toolbars */}
                    {!isEditing && (
                        <div className={`absolute -bottom-8 ${isUser ? 'right-0' : 'left-0'} flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                            {isUser ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1 rounded-md text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                    title="Edit message"
                                    disabled={isStreaming}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleToggleSpeak}
                                        className={`p-1 rounded-md transition-colors ${isSpeaking ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleCopy}
                                        className={`p-1 rounded-md transition-colors ${isCopied ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        title={isCopied ? 'Copied!' : 'Copy to clipboard'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* User Avatar */}
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ml-3 mt-1 shadow-sm transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase group-hover:text-blue-700 dark:group-hover:text-blue-400">U</span>
                </div>
            )}
        </div>
    );
}
