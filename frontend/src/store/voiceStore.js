/**
 * Voice store — manages voice sessions, messages, and streaming state.
 * Completely independent from chatStore.
 */
import { create } from 'zustand';
import { voiceAPI, sessionAPI } from '../services/api';

const useVoiceStore = create((set, get) => ({
    voiceSessions: [],
    activeVoiceSessionId: null,
    voiceMessages: [],
    isStreaming: false,
    streamingContent: '',

    // ── Session management ────────────────────────────
    loadVoiceSessions: async () => {
        try {
            const { data } = await sessionAPI.list('voice');
            set({ voiceSessions: data.sessions });
        } catch (err) {
            console.error('[voiceStore] Failed to load voice sessions:', err);
        }
    },

    createVoiceSession: async (title) => {
        const { data } = await sessionAPI.create(title, 'voice');
        set((state) => ({
            voiceSessions: [data, ...state.voiceSessions],
            activeVoiceSessionId: data.id,
            voiceMessages: [],
        }));
        return data.id;
    },

    selectVoiceSession: async (id) => {
        set({ activeVoiceSessionId: id, voiceMessages: [], streamingContent: '' });
        try {
            const { data } = await sessionAPI.getMessages(id);
            set({ voiceMessages: data });
        } catch (err) {
            console.error('Failed to load voice messages', err);
        }
    },

    deleteVoiceSession: async (id) => {
        await sessionAPI.delete(id);
        set((state) => {
            const voiceSessions = state.voiceSessions.filter((s) => s.id !== id);
            const activeVoiceSessionId =
                state.activeVoiceSessionId === id ? null : state.activeVoiceSessionId;
            return {
                voiceSessions,
                activeVoiceSessionId,
                voiceMessages: activeVoiceSessionId ? state.voiceMessages : [],
            };
        });
    },

    // ── Voice Chat ────────────────────────────────────
    sendVoiceMessage: async (content, metadata = {}) => {
        const { activeVoiceSessionId } = get();
        if (!activeVoiceSessionId) return;

        // Optimistic: add user message
        const userMsg = { role: 'user', content };
        set((state) => ({
            voiceMessages: [...state.voiceMessages, userMsg],
            isStreaming: true,
            streamingContent: '',
        }));

        await voiceAPI.stream(
            activeVoiceSessionId,
            content,
            // onToken
            (data) => {
                const { token } = data;
                if (token) {
                    set((state) => ({
                        streamingContent: state.streamingContent + token,
                    }));
                }
            },
            // onDone
            () => {
                set((state) => ({
                    voiceMessages: [
                        ...state.voiceMessages,
                        { role: 'assistant', content: state.streamingContent },
                    ],
                    isStreaming: false,
                    streamingContent: '',
                }));
                get().loadVoiceSessions();
            },
            // onError
            (error) => {
                set((state) => ({
                    voiceMessages: [
                        ...state.voiceMessages,
                        { role: 'assistant', content: `⚠️ Error: ${error}` },
                    ],
                    isStreaming: false,
                    streamingContent: '',
                }));
            },
            metadata
        );
    },

    clearActiveVoiceSession: () => {
        set({
            activeVoiceSessionId: null,
            voiceMessages: [],
            streamingContent: '',
        });
    },
}));

export default useVoiceStore;
