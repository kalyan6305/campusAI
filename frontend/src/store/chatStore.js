/**
 * Chat store — manages sessions, messages, and streaming state.
 */
import { create } from 'zustand';
import { sessionAPI, chatAPI, ragAPI } from '../services/api';

const useChatStore = create((set, get) => ({
    sessions: [],
    activeSessionId: null,
    messages: [],
    isStreaming: false,
    ragDocuments: [],
    retrievedChunks: [],
    researchSources: {
        browser: [],
        social: [],
        platform_links: []
    },

    // ── Session management ────────────────────────────
    loadSessions: async () => {
        try {
            const { data } = await sessionAPI.list();
            set({ sessions: data.sessions });
        } catch (err) {
            console.error('Failed to load sessions', err);
        }
    },

    createSession: async (title) => {
        const { data } = await sessionAPI.create(title);
        set((state) => ({
            sessions: [data, ...state.sessions],
            activeSessionId: data.id,
            messages: [],
        }));
        return data.id;
    },

    selectSession: async (id) => {
        set({ activeSessionId: id, messages: [], streamingContent: '' });
        try {
            const { data } = await sessionAPI.getMessages(id);
            set({ messages: data });
        } catch (err) {
            console.error('Failed to load messages', err);
        }
    },

    deleteSession: async (id) => {
        await sessionAPI.delete(id);
        set((state) => {
            const sessions = state.sessions.filter((s) => s.id !== id);
            const activeSessionId =
                state.activeSessionId === id ? null : state.activeSessionId;
            return { sessions, activeSessionId, messages: activeSessionId ? state.messages : [] };
        });
    },

    renameSession: async (id, title) => {
        try {
            const { data } = await sessionAPI.update(id, title);
            set((state) => ({
                sessions: state.sessions.map((s) => (s.id === id ? { ...s, title: data.title } : s)),
            }));
        } catch (err) {
            console.error('Failed to rename session', err);
        }
    },

    editAndResend: async (index, content) => {
        const { activeSessionId, sendMessage } = get();
        if (!activeSessionId) return;

        try {
            // 1. Truncate backend
            await sessionAPI.truncate(activeSessionId, index);

            // 2. Clear local messages from index onwards
            set((state) => ({
                messages: state.messages.slice(0, index),
            }));

            // 3. Resend the edited message
            await sendMessage(content);
        } catch (err) {
            console.error('Failed to edit and resend message', err);
        }
    },

    // ── Chat ──────────────────────────────────────────
    sendMessage: async (content, metadata = {}) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;

        // Optimistic: add user message
        const userMsg = { role: 'user', content };
        set((state) => ({
            messages: [...state.messages, userMsg],
            isStreaming: true,
            streamingContent: '',
            researchSources: { browser: [], social: [], platform_links: [] }
        }));

        await chatAPI.stream(
            activeSessionId,
            content,
            // onToken
            (data) => {
                const { token, status, metadata: streamMetadata, mode: streamMode } = data;

                if (status === 'METADATA' && streamMetadata?.sources) {
                    set((state) => ({
                        researchSources: {
                            ...state.researchSources,
                            [streamMode === 'tools' ? 'browser' : streamMode]: streamMetadata.sources,
                            platform_links: streamMetadata.platform_links || []
                        }
                    }));
                }

                if (token) {
                    set((state) => ({
                        streamingContent: state.streamingContent + token,
                    }));
                }
            },
            // onDone
            () => {
                set((state) => ({
                    messages: [
                        ...state.messages,
                        { role: 'assistant', content: state.streamingContent },
                    ],
                    isStreaming: false,
                    streamingContent: '',
                }));
                // Refresh session list (title may have changed)
                get().loadSessions();
            },
            // onError
            (error) => {
                set((state) => ({
                    messages: [
                        ...state.messages,
                        { role: 'assistant', content: `⚠️ Error: ${error}` },
                    ],
                    isStreaming: false,
                    streamingContent: '',
                }));
            },
            metadata
        );
    },

    loadRagDocuments: async () => {
        try {
            const { data } = await ragAPI.getDocuments();
            set({ ragDocuments: data });
        } catch (err) {
            console.error('Failed to load RAG documents', err);
        }
    },

    searchRagChunks: async (query) => {
        if (!query) return;
        try {
            const { data } = await ragAPI.search(query);
            set({ retrievedChunks: data });
        } catch (err) {
            console.error('Failed to search RAG chunks', err);
        }
    },

    clearActiveSession: () => {
        set({
            activeSessionId: null,
            messages: [],
            streamingContent: '',
            researchSources: { browser: [], social: [], platform_links: [] }
        });
    },
}));

export default useChatStore;
