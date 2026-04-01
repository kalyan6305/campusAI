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
    const token = sessionStorage.getItem('access_token');
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
            sessionStorage.removeItem('access_token');
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
    updateProfile: (data) => api.patch('/auth/me', data),
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
        const token = sessionStorage.getItem('access_token');
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
        const token = sessionStorage.getItem('access_token');
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
    searchJobs: async (role, user_profile, location = 'remote') => {
        const token = sessionStorage.getItem('access_token');
        const payload = { role, user_profile, location };

        return fetch(`${API_BASE}/job-apply/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
    },
    process: async (file, jobData) => {
        const token = sessionStorage.getItem('access_token');
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
        const token = sessionStorage.getItem('access_token');
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
    generate: (role, interviewType, company = 'Generic', roundType = null, difficulty = 'Intermediate', excludeQuestions = [], userType = 'general', experienceYears = 0, numQuestions = 5, selectedTopic = null) =>
        api.post('/interview/generate', { 
            role, 
            company,
            interview_type: interviewType,
            round_type: roundType,
            difficulty,
            exclude_questions: excludeQuestions,
            user_type: userType,
            experience_years: experienceYears,
            num_questions: numQuestions,
            selected_topic: selectedTopic
        }),

    getFeedback: (role, company, question, userAnswer, roundType = null) =>
        api.post('/interview/feedback', { role, company, question, user_answer: userAnswer, round_type: roundType }),

    getSuggestions: (questions) =>
        api.post('/interview/suggestions', questions),

    clarifyDoubt: (role, question, context, userQuery) =>
        api.post('/interview/clarify', { 
            role, 
            question, 
            context, 
            user_query: userQuery 
        }),

    getFinalReport: (role, company, roundResults, overallDimensionAvgs) =>
        api.post('/interview/final-report', { role, company, round_results: roundResults, overall_dimension_avgs: overallDimensionAvgs }),

    getRoundTopics: (company, roundType, role) =>
        api.post('/interview/topics', { company, round_type: roundType, role }),

    generateMCQ: (company, roundType, role, topic = null, n = 5, previousQuestions = []) =>
        api.post('/interview/generate-mcq', { company, round_type: roundType, role, topic, n, previous_questions: previousQuestions }),

    teachTopic: (company, role, roundType, topic) =>
        api.post('/interview/teach', { company, role, round_type: roundType, topic }),

    predictRounds: (company, role) =>
        api.post('/interview/predict-rounds', { company, role }),

    getMockReport: (role, difficulty, questions, answers) =>
        api.post('/interview/mock_report', { role, difficulty, questions, answers }),

    getVideos: (query) =>
        api.get('/interview/videos', { params: { query } }),

    generateDynamicQuestion: (role, company, roundType, difficulty, history, totalQuestions, questionsAsked) =>
        api.post('/interview/dynamic-question', {
            role,
            company: company || 'Generic',
            round_type: roundType || 'Technical',
            difficulty: difficulty || 'Mixed',
            history: history || [],
            total_questions: totalQuestions || 8,
            questions_asked: questionsAsked || 0,
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
        const token = sessionStorage.getItem('access_token');
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

// ── Study Planner Agent ───────────────────────────────────────────────────
export const studyPlannerAPI = {
    generate: (data) => api.post('/study-planner/generate', data),
    listPlans: () => api.get('/study-planner/list-plans'),
    getPlan: (sessionId) => api.get(`/study-planner/get-plan/${sessionId}`),
    saveProgress: (sessionId, progress) => 
        api.post('/study-planner/save-progress', { session_id: sessionId, progress }),
    clearPlan: (sessionId) => api.delete(`/study-planner/clear-plan/${sessionId}`),
    exportExcel: (sessionId) => api.post('/study-planner/export-excel', { session_id: sessionId }, { responseType: 'blob' }),
};

export default api;
