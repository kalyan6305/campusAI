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
    deleteHistory: () => api.delete('/auth/history'),
    requestPasswordReset: (email) => api.post('/auth/forgot-password', { email }),
    confirmPasswordReset: (token, newPassword) => api.post('/auth/reset-password', { token, new_password: newPassword }),
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

// ── Job Apply ─────────────────────────────────────────
export const jobApplyAPI = {
    searchJobs: async (role, location = 'remote') => {
        const token = localStorage.getItem('access_token');
        const formData = new FormData();
        formData.append('role', role);
        formData.append('location', location);

        return fetch(`${API_BASE}/job-apply/search`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });
    },
    process: async (file, jobData) => {
        const token = localStorage.getItem('access_token');
        const formData = new FormData();
        formData.append('resume_file', file);
        formData.append('job_data', JSON.stringify(jobData));

        return fetch(`${API_BASE}/job-apply/process`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });
    }
};

// ── Resume Agent ──────────────────────────────────────
export const resumeAPI = {
    process: async (file, resumeData) => {
        const token = localStorage.getItem('access_token');
        const formData = new FormData();
        formData.append('resume_file', file);
        formData.append('job_description', resumeData.jobDescription);
        formData.append('role', resumeData.role || 'Target Role');

        return fetch(`${API_BASE}/resume/process`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });
    }
};

// ── Interview Agent ──────────────────────────────────
export const interviewAPI = {
    generate: (role, interviewType, excludeQuestions = []) =>
        api.post('/interview/generate', { 
            role, 
            interview_type: interviewType,
            exclude_questions: excludeQuestions 
        }),

    getFeedback: (role, question, userAnswer) =>
        api.post('/interview/feedback', { role, question, user_answer: userAnswer }),

    getSuggestions: (questions) =>
        api.post('/interview/suggestions', questions),

    clarifyDoubt: (role, question, context, userQuery) =>
        api.post('/interview/clarify', { 
            role, 
            question, 
            context, 
            user_query: userQuery 
        }),
};

// ── Research Agent ─────────────────────────────────────────────────────────
export const researchAPI = {
    /**
     * Streaming analysis for the Research Agent.
     * @param {string} mode - 'topic' | 'paper_analysis' | 'project_ideas' | 'writing_assistance'
     * @param {string} query - User's query or topic
     * @param {File|null} file - Optional uploaded document
     * @param {Function} onToken - Called with each streamed token string
     * @param {Function} onDone - Called when streaming completes
     * @param {Function} onError - Called with error message string
     */
    analyze: async (mode, query, file, onToken, onDone, onError) => {
        const token = localStorage.getItem('access_token');
        const formData = new FormData();
        formData.append('mode', mode);
        formData.append('query', query || '');
        if (file) {
            formData.append('file', file);
        }

        try {
            const response = await fetch(`${API_BASE}/research/analyze`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) {
                const errText = await response.text();
                onError?.(`Server error: ${response.status} — ${errText}`);
                return;
            }

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
                        if (data === '[DONE]') { onDone?.(); return; }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.status === 'STREAMING' && parsed.token) {
                                onToken?.(parsed.token);
                            } else if (parsed.status === 'ERROR') {
                                onError?.(parsed.message);
                                return;
                            } else if (parsed.status === 'DONE') {
                                onDone?.();
                                return;
                            }
                        } catch { /* skip malformed */ }
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
