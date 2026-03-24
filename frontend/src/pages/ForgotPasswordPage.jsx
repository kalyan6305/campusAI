import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { KeyRound, Check, X, ArrowRight } from 'lucide-react';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const res = await authAPI.requestPasswordReset(email);
            setStatus({ type: 'success', message: res.data.message });
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.detail || 'Failed to send reset link. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 font-sans">
            <div className="w-full max-w-md relative group">
                {/* Decorative background glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>

                <div className="relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-10 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-6 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 shadow-inner">
                            <KeyRound className="w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Forgot Password</h1>
                        <p className="mt-3 text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-widest">
                            Authorized Access Recovery
                        </p>
                    </div>

                    {status.message && (
                        <div className={`mb-8 p-4 rounded-2xl border text-xs font-black uppercase tracking-wider text-center flex items-center gap-3 justify-center animate-fade-in ${status.type === 'success'
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                            }`}>
                            <span>{status.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}</span>
                            {status.message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">
                                Registered Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600 shadow-inner"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Initialize Recovery</span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <Link
                            to="/auth"
                            className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            Back to Secure Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
