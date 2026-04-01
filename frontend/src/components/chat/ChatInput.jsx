import { useState, useRef, useEffect } from 'react';
import { Mic, SendHorizontal, Loader2 } from 'lucide-react';

export default function ChatInput({ onSend, disabled, voiceState, onVoiceToggle, onNewChat }) {
    const [input, setInput] = useState('');
    const [isListeningLocal, setIsListeningLocal] = useState(false);
    const recognitionRef = useRef(null);

    // Determine if we use external voice control or internal
    const hasExternalVoice = typeof onVoiceToggle === 'function';
    const isListening = hasExternalVoice ? voiceState === 'listening' : isListeningLocal;
    const isSpeaking = hasExternalVoice && voiceState === 'speaking';

    useEffect(() => {
        if (hasExternalVoice) return; // External control handles recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
                setIsListeningLocal(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListeningLocal(false);
            };

            recognitionRef.current.onend = () => {
                setIsListeningLocal(false);
            };
        }
    }, [hasExternalVoice]);

    const toggleListening = () => {
        if (hasExternalVoice) {
            onVoiceToggle();
            return;
        }
        if (isListeningLocal) {
            recognitionRef.current?.stop();
        } else {
            setIsListeningLocal(true);
            recognitionRef.current?.start();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setInput('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Determine mic button styling
    const micClassName = isListening
        ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        : isSpeaking
            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : 'text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-800';

    const micTitle = isListening ? 'Listening...' : isSpeaking ? 'AI Speaking...' : 'Voice input';

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-end gap-2 max-w-4xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-2 shadow-md transition-all focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30">
                {/* New Chat Button */}
                <button
                    type="button"
                    onClick={() => {
                        onNewChat?.();
                        setInput('');
                    }}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all rounded-xl hover:bg-white dark:hover:bg-gray-800 group relative"
                    title="New Chat"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    
                    {/* Tooltip */}
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                        New Chat
                    </span>
                </button>

                {/* Text Area */}
                <textarea
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={1}
                    disabled={disabled}
                    className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none py-2 px-1 max-h-60 min-h-[40px] text-sm leading-relaxed overflow-y-auto"
                    style={{ height: input ? 'auto' : '40px' }}
                />

                {/* Mic toggle */}
                <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isSpeaking}
                    className={`p-2 rounded-xl transition-all duration-200 ${micClassName}`}
                    title={micTitle}
                >
                    <Mic className="h-5 w-5" />
                </button>

                {/* Send */}
                <button
                    type="submit"
                    disabled={!input.trim() || disabled}
                    className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center justify-center shadow-sm active:scale-95"
                >
                    <SendHorizontal className="h-5 w-5" />
                </button>
            </div>
        </form>
    );
}
