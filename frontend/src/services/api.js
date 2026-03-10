/**
 * API service layer — Axios instance with JWT interceptor.
 */
import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ── Response interceptor: handle 401 ─────────────────
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/auth';
        }
        return Promise.reject(err);
    }
);

// ── Auth ─────────────────────────────────────────────
export const authAPI = {
    register: (email, password) =>
        api.post('/auth/register', { email, password }),

    login: (email, password) =>
        api.post('/auth/login', { email, password }),

    me: () => api.get('/auth/me'),
    getStats: () => api.get('/auth/stats'),
    requestPasswordReset: (email) => api.post('/auth/password-reset-request', { email }),
    confirmPasswordReset: (token, newPassword) => api.post('/auth/password-reset-confirm', { token, new_password: newPassword }),
};

// ── Sessions ─────────────────────────────────────────
export const sessionAPI = {
    list: (module = null) => api.get('/sessions', { params: { module } }),
    create: (title = 'New Chat', module = 'chat') => api.post('/sessions', { title, module }),
    getMessages: (id, module = 'chat') => api.get(`/sessions/${id}/messages`, { params: { module } }),
    update: (id, title, module = 'chat') => api.patch(`/sessions/${id}`, { title }, { params: { module } }),
    delete: (id, module = 'chat') => api.delete(`/sessions/${id}`, { params: { module } }),
    truncate: (id, index, module = 'chat') => api.delete(`/sessions/${id}/truncate/${index}`, { params: { module } }),
};

// ── Chat ─────────────────────────────────────────────
export const chatAPI = {
    send: (sessionId, message) =>
        api.post('/chat', { session_id: sessionId, message }),

    /**
     * Stream chat via SSE.
     * @returns {EventSource-like} readable stream
     */
    stream: async (sessionId, message, onToken, onDone, onError, metadata = {}) => {
        const token = localStorage.getItem('access_token');
        const payload = { session_id: sessionId, message, metadata };

        console.log("Campus AI Request:", payload);

        try {
            const response = await fetch(`${API_BASE}/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') {
                            onDone?.();
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.error) {
                                onError?.(parsed.error);
                                return;
                            }
                            onToken?.(parsed);
                        } catch {
                            // skip malformed JSON
                        }
                    }
                }
            }
            onDone?.();
        } catch (err) {
            onError?.(err.message);
        }
    },
};


// ── RAG Transparency ─────────────────────────────────
export const ragAPI = {
    getDocuments: () => api.get('/rag/documents'),
    search: (query) => api.post('/rag/search', { query }),
};

// ── Voice ────────────────────────────────────────────
export const voiceAPI = {
    createSession: (title = 'Voice Chat') => api.post('/voice/sessions', { title }),
    listSessions: () => api.get('/voice/sessions'),
    getMessages: (id) => api.get(`/voice/sessions/${id}/messages`),
    deleteSession: (id) => api.delete(`/voice/sessions/${id}`),

    stream: async (sessionId, message, onToken, onDone, onError, metadata = {}) => {
        const token = localStorage.getItem('access_token');
        const payload = { session_id: sessionId, message, metadata };

        try {
            const response = await fetch(`${API_BASE}/voice/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') {
                            onDone?.();
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.error) {
                                onError?.(parsed.error);
                                return;
                            }
                            onToken?.(parsed);
                        } catch {
                            // skip malformed JSON
                        }
                    }
                }
            }
            onDone?.();
        } catch (err) {
            onError?.(err.message);
        }
    },
};

export default api;
