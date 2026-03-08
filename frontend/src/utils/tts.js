/**
 * Simple Text-To-Speech utility using Web Speech API.
 */
export const speak = (text, onEnd) => {
    if (!window.speechSynthesis) {
        console.error('Speech synthesis not supported in this browser.');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    if (onEnd) {
        utterance.onend = onEnd;
        utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
    window.speechSynthesis.cancel();
};
