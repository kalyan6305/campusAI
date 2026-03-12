import { create } from 'zustand';
import useAuthStore from './authStore';

const useResearchStore = create((set, get) => ({
    thoughts: [],
    sources: [],
    answer: '',
    isResearching: false,
    researchMode: 'deep', // Default to deep research mode now that the UI toggle is removed

    setResearchMode: (mode) => set({ researchMode: mode }),

    clearResearch: () => set({ thoughts: [], sources: [], answer: '', isResearching: false }),

    restoreFromMessages: (messages) => {
        const sources = [];

        for (const msg of messages) {
            // We NO LONGER set answer from messages here. ToolsPage handles history rendering 
            // directly via visibleMessages so it can display BOTH the user query and the answer.
            if (msg.role === 'system' && msg.content?.startsWith('__SOURCES__:')) {
                try {
                    const json = msg.content.slice('__SOURCES__:'.length);
                    const parsed = JSON.parse(json);
                    sources.push(...parsed);
                } catch (e) {
                    console.error('Failed to parse stored sources:', e);
                }
            }
        }

        set({ thoughts: [], sources, answer: '', isResearching: false });
    },

    startResearch: async (query, sessionId) => {
        const { researchMode } = get();
        const { token } = useAuthStore.getState();

        set({ thoughts: [], sources: [], answer: '', isResearching: true });

        try {
            const response = await fetch('http://localhost:8000/api/v1/research/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ query, mode: researchMode, session_id: sessionId })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === '[DONE]') break;

                        try {
                            const data = JSON.parse(dataStr);
                            if (data.type === 'thought') {
                                set((state) => ({ thoughts: [...state.thoughts, data.content] }));
                            } else if (data.type === 'sources') {
                                set((state) => ({ sources: [...state.sources, ...data.data] }));
                            } else if (data.type === 'answer') {
                                set({ answer: data.content });
                            } else if (data.type === 'error') {
                                console.error('Research error:', data.content);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE chunk:', e);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Research request failed:', err);
        } finally {
            set({ isResearching: false });
        }
    }
}));

export default useResearchStore;
