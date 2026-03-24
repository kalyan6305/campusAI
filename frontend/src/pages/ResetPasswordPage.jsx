import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { ShieldCheck, Check, X, ArrowRight } from 'lucide-react';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus({ type: 'error', message: 'Security token is missing. Please request a new link.' });
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 8) {
            setStatus({ type: 'error', message: 'Security protocol requires at least 8 characters.' });
            return;
        }

        if (password !== confirmPassword) {
            setStatus({ type: 'error', message: 'Credentials do not match. Please verify.' });
            return;
        }

        setIsLoading(true);
        setStatus({ type: '', message: '' });

        try {
            await authAPI.confirmPasswordReset(token, password);
            setStatus({ type: 'success', message: 'Credentials updated successfully. System ready.' });
            setTimeout(() => navigate('/auth'), 3000);
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.detail || 'Verification failed. Link may be expired.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 font-sans">
            <div className="w-full max-w-md relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>

                <div className="relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-3xl p-10 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl mb-6 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 shadow-inner">
                            <ShieldCheck className="w-10 h-10" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Reset Password</h1>
                        <p className="mt-3 text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-widest">
                            Authorized Credential Update
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

                    {!token ? (
                        <div className="text-center">
                            <Link
                                to="/forgot-password"
                                className="w-full inline-block py-5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 font-black rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-gray-100 transition-all shadow-inner"
                            >
                                Request New Protocol Link
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">
                                    New Access Key
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Minimum 8 characters"
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600 shadow-inner"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">
                                    Confirm Access Key
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Re-enter password"
                                    className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold placeholder:text-gray-300 dark:placeholder:text-gray-600 shadow-inner"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 group"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Apply New Protocol</span>
                                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-10 text-center">
                        <Link
                            to="/auth"
                            className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                            Return to Perimeter Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
