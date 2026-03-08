/**
 * Auth forms — Login and Register with light-theme professional styling.
 */
import { useState } from 'react';
import useAuthStore from '../../store/authStore';

export function LoginForm({ onSwitch }) {
    const { login, isLoading, error, clearError } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
        } catch {
            // error is set in the store
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                    placeholder="you@campus.edu"
                    required
                />
            </div>
            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                    placeholder="••••••••"
                    required
                />
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-red-600 text-xs font-bold leading-relaxed flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {error}
                </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full btn-primary py-3 shadow-md hover:shadow-blue-500/20">
                {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-[11px] font-medium text-gray-500">
                Don't have an account?{' '}
                <button type="button" onClick={onSwitch} className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                    Sign up
                </button>
            </p>
        </form>
    );
}

export function RegisterForm({ onSwitch }) {
    const { register, isLoading, error, clearError } = useAuthStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            setLocalError('Passwords do not match');
            return;
        }
        if (password.length < 8) {
            setLocalError('Password must be at least 8 characters');
            return;
        }
        setLocalError('');
        try {
            await register(email, password);
        } catch {
            // error is set in the store
        }
    };

    const displayError = localError || error;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); setLocalError(''); }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                    placeholder="you@campus.edu"
                    required
                />
            </div>
            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError(); setLocalError(''); }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                    placeholder="Min 8 characters"
                    required
                />
            </div>
            <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
                <input
                    type="password"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setLocalError(''); }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                    placeholder="••••••••"
                    required
                />
            </div>

            {displayError && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 text-red-600 text-xs font-bold leading-relaxed flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {displayError}
                </div>
            )}

            <button type="submit" disabled={isLoading} className="w-full btn-primary py-3 shadow-md hover:shadow-blue-500/20">
                {isLoading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-[11px] font-medium text-gray-500">
                Already have an account?{' '}
                <button type="button" onClick={onSwitch} className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                    Sign in
                </button>
            </p>
        </form>
    );
}
