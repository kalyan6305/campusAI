import { useState, useRef, useEffect } from 'react';

export default function ChatInput({ onSend, disabled, voiceState, onVoiceToggle }) {
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
            <div className="flex items-end gap-2 max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-2 transition-all focus-within:border-blue-400 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30 focus-within:bg-white dark:focus-within:bg-gray-800">
                {/* Upload Placeholder */}
                <button
                    type="button"
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-xl hover:bg-white dark:hover:bg-gray-800"
                    title="Image upload (coming soon)"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                </button>

                {/* Text Area */}
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={1}
                    disabled={disabled}
                    className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none outline-none py-2 px-1 max-h-36 min-h-[40px] text-sm leading-relaxed"
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
                    </svg>
                </button>

                {/* Send */}
                <button
                    type="submit"
                    disabled={!input.trim() || disabled}
                    className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all flex items-center justify-center shadow-sm active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                </button>
            </div>
        </form>
    );
}
