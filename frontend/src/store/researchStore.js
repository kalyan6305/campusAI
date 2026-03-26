import { create } from 'zustand';

const useResearchStore = create((set, get) => ({
    sources: [],
    socialResults: [],
    currentResponse: '',
    thoughts: [],
    isResearching: false,
    mode: 'fast', // 'fast' or 'deep'
    
    setMode: (mode) => set({ mode }),
    
    startResearch: async (query, sessionId = null) => {
        if (!query) return;
        
        set({ 
            isResearching: true, 
            sources: [], 
            socialResults: [],
            currentResponse: '', 
            thoughts: [] 
        });
        
        try {
            const token = localStorage.getItem('access_token');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            
            const response = await fetch(`${baseUrl}/api/v1/research/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ 
                    query, 
                    mode: get().mode,
                    session_id: sessionId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                
                // Keep the last incomplete chunk in the buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        if (dataStr === '[DONE]') {
                            break;
                        }

                        try {
                            const parsed = JSON.parse(dataStr);
                            
                            if (parsed.type === 'sources' || parsed.type === 'social_results') {
                                set(state => {
                                    const existingUrls = new Set(state.sources.map(s => s.link));
                                    const freshSources = parsed.data.filter(s => !existingUrls.has(s.link));
                                    return { sources: [...state.sources, ...freshSources] };
                                });
                            } else if (parsed.type === 'thought') {
                                set(state => ({
                                    thoughts: [...state.thoughts, parsed.content]
                                }));
                            } else if (parsed.type === 'answer') {
                                set(state => ({
                                    currentResponse: state.currentResponse + parsed.content
                                }));
                            } else if (parsed.type === 'final') {
                                set({
                                    currentResponse: parsed.content,
                                    thoughts: parsed.thoughts || [],
                                    sources: parsed.sources || []
                                });
                            } else if (parsed.type === 'error') {
                                set(state => ({
                                    currentResponse: state.currentResponse + `\n\n**System Error:** ${parsed.content}`
                                }));
                            }
                        } catch (e) {
                            console.error("Failed to parse SSE data block", e, dataStr);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Research Error:', error);
            set(state => ({
                currentResponse: state.currentResponse + `\n\n**Connection Error:** ${error.message}`
            }));
        } finally {
            set({ isResearching: false });
        }
    },
    
    clearResearch: () => set({
        sources: [],
        socialResults: [],
        currentResponse: '',
        thoughts: [],
        isResearching: false
    })
}));

export default useResearchStore;
