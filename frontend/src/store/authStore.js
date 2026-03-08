/**
 * Auth store — manages user state and JWT token.
 */
import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set) => ({
    user: null,
    token: localStorage.getItem('access_token'),
    isLoading: false,
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const { data } = await authAPI.login(email, password);
            localStorage.setItem('access_token', data.access_token);
            set({ token: data.access_token, isLoading: false });
            // Fetch user profile
            const profile = await authAPI.me();
            set({ user: profile.data });
        } catch (err) {
            const msg = err.response?.data?.detail || 'Login failed';
            set({ error: msg, isLoading: false });
            throw err;
        }
    },

    register: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            await authAPI.register(email, password);
            // Auto-login after register
            const { data } = await authAPI.login(email, password);
            localStorage.setItem('access_token', data.access_token);
            set({ token: data.access_token, isLoading: false });
            const profile = await authAPI.me();
            set({ user: profile.data });
        } catch (err) {
            const msg = err.response?.data?.detail || 'Registration failed';
            set({ error: msg, isLoading: false });
            throw err;
        }
    },

    fetchUser: async () => {
        try {
            const { data } = await authAPI.me();
            set({ user: data });
        } catch {
            set({ user: null, token: null });
            localStorage.removeItem('access_token');
        }
    },

    logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, token: null });
    },

    clearError: () => set({ error: null }),
}));

export default useAuthStore;
