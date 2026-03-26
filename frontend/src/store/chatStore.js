/**
 * Chat store — manages sessions, messages, and streaming state.
 */
import { create } from 'zustand';
import { sessionAPI, chatAPI, ragAPI } from '../services/api';

const useChatStore = create((set, get) => ({
    sessionsByModule: {
        chat: [],
        campus: [],
        tools: [],
        agents: [],
    },
    activeSessionId: null,
    messagesBySession: {}, // session_id -> messages[]
    isStreaming: false,
    streamingContent: '',
    currentModule: 'chat', // Track the module for the active view
    ragDocuments: [],
    retrievedChunks: [],
    researchSources: {
        browser: [],
        social: [],
        platform_links: []
    },

    // ── Computed ──────────────────────────────────────
    // Helper to get sessions for current module
    getSessions: () => {
        const { sessionsByModule, currentModule } = get();
        return sessionsByModule[currentModule] || [];
    },

    // Helper to get messages for active session
    getMessages: () => {
        const { messagesBySession, activeSessionId } = get();
        return activeSessionId ? (messagesBySession[activeSessionId] || []) : [];
    },

    // ── Session management ────────────────────────────
    loadSessions: async (module = 'chat') => {
        try {
            set({ currentModule: module });
            const { data } = await sessionAPI.list(module);
            set((state) => ({
                sessionsByModule: {
                    ...state.sessionsByModule,
                    [module]: data.sessions,
                }
            }));
        } catch (err) {
            console.error(`Failed to load ${module} sessions`, err);
        }
    },

    createSession: async (title = 'New Chat', module = 'chat') => {
        try {
            const { data: session } = await sessionAPI.create(title, module);
            set((state) => ({
                sessionsByModule: {
                    ...state.sessionsByModule,
                    [module]: [session, ...(state.sessionsByModule[module] || [])],
                },
                activeSessionId: session.id,
                messagesBySession: {
                    ...state.messagesBySession,
                    [session.id]: [],
                },
            }));
            return session;
        } catch (err) {
            console.error('Failed to create session', err);
        }
    },

    selectSession: async (sessionId) => {
        const { currentModule } = get();
        set({ activeSessionId: sessionId, streamingContent: '' });
        if (!sessionId) return;

        try {
            const { data: messages } = await sessionAPI.getMessages(sessionId, currentModule);
            
            // Reconstruct messages with proper metadata
            const hydratedMessages = messages.map(msg => ({
                ...msg,
                sources: msg.meta_data?.sources || [],
                thoughts: msg.meta_data?.thoughts || [],
                confidence: msg.meta_data?.confidence || (msg.role === 'assistant' ? "85%" : null),
                showSources: false
            }));

            const lastAssistant = hydratedMessages.filter(m => m.role === 'assistant').slice(-1)[0];
            const initialSources = lastAssistant?.sources?.length > 0 ? {
                browser: lastAssistant.sources,
                platform_links: lastAssistant.meta_data?.platform_links || []
            } : { browser: [], social: [], platform_links: [] };

            set((state) => ({
                messagesBySession: {
                    ...state.messagesBySession,
                    [sessionId]: hydratedMessages,
                },
                researchSources: initialSources
            }));
        } catch (err) {
            console.error('Failed to load messages', err);
        }
    },

    deleteSession: async (sessionId) => {
        try {
            const { currentModule, sessionsByModule } = get();
            await sessionAPI.delete(sessionId, currentModule);
            const updatedSessions = sessionsByModule[currentModule].filter(s => s.id !== sessionId);

            set((state) => ({
                sessionsByModule: {
                    ...state.sessionsByModule,
                    [currentModule]: updatedSessions,
                },
                activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
            }));
        } catch (err) {
            console.error('Failed to delete session', err);
        }
    },

    toggleSources: (sessionId, messageId) => {
        set((state) => {
            const sessionMessages = state.messagesBySession[sessionId] || [];
            let newResearchSources = { ...state.researchSources };
            
            const updatedMessages = sessionMessages.map((msg) => {
                if (msg.id === messageId) {
                    const nextShow = !msg.showSources;
                    if (nextShow && msg.sources?.length > 0) {
                        newResearchSources = {
                            ...newResearchSources,
                            browser: msg.sources,
                            platform_links: msg.meta_data?.platform_links || []
                        };
                    }
                    return { ...msg, showSources: nextShow };
                }
                return { ...msg, showSources: false };
            });

            return {
                messagesBySession: {
                    ...state.messagesBySession,
                    [sessionId]: updatedMessages
                },
                researchSources: newResearchSources
            };
        });
    },

    renameSession: async (id, title) => {
        try {
            const { currentModule, sessionsByModule } = get();
            const { data } = await sessionAPI.update(id, title, currentModule);
            const updatedSessions = sessionsByModule[currentModule].map((s) =>
                s.id === id ? { ...s, title: data.title } : s
            );

            set((state) => ({
                sessionsByModule: {
                    ...state.sessionsByModule,
                    [currentModule]: updatedSessions,
                },
            }));
        } catch (err) {
            console.error('Failed to rename session', err);
        }
    },

    editAndResend: async (index, content) => {
        const { activeSessionId, sendMessage, getMessages, currentModule } = get();
        if (!activeSessionId) return;

        try {
            // 1. Truncate backend
            await sessionAPI.truncate(activeSessionId, index, currentModule);

            // 2. Clear local messages from index onwards
            const currentMessages = getMessages();
            set((state) => ({
                messagesBySession: {
                    ...state.messagesBySession,
                    [activeSessionId]: currentMessages.slice(0, index),
                },
            }));

            // 3. Resend the edited message
            await sendMessage(content);
        } catch (err) {
            console.error('Failed to edit and resend message', err);
        }
    },

    // ── Chat ──────────────────────────────────────────
    sendMessage: async (content, metadata = {}) => {
        const { activeSessionId, getMessages } = get();
        if (!activeSessionId) return;

        // Optimistic: add user message
        const userMsg = { role: 'user', content };
        const currentMessages = getMessages();

        set((state) => ({
            messagesBySession: {
                ...state.messagesBySession,
                [activeSessionId]: [...currentMessages, userMsg],
            },
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

                if (status === 'FINAL' && streamMetadata) {
                    set((state) => ({
                        lastStreamMetadata: streamMetadata
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
                const { streamingContent, getMessages, lastStreamMetadata } = get();
                const updatedMessages = [
                    ...getMessages(),
                    { 
                        role: 'assistant', 
                        content: streamingContent,
                        sources: lastStreamMetadata?.sources || [],
                        thoughts: lastStreamMetadata?.thoughts || [],
                        confidence: lastStreamMetadata?.confidence || "85%",
                        showSources: false
                    },
                ];
                set((state) => ({
                    messagesBySession: {
                        ...state.messagesBySession,
                        [activeSessionId]: updatedMessages,
                    },
                    isStreaming: false,
                    streamingContent: '',
                    lastStreamMetadata: null
                }));
                // Refresh session list
                const { currentModule, loadSessions } = get();
                loadSessions(currentModule);
            },
            // onError
            (error) => {
                const { getMessages } = get();
                const updatedMessages = [
                    ...getMessages(),
                    { role: 'assistant', content: `⚠️ Error: ${error}` },
                ];
                set((state) => ({
                    messagesBySession: {
                        ...state.messagesBySession,
                        [activeSessionId]: updatedMessages,
                    },
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
            streamingContent: '',
            researchSources: { browser: [], social: [], platform_links: [] }
        });
    },
}));

export default useChatStore;
