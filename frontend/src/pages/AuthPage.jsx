/**
 * AuthPage — login/register page with light theme SaaS styling.
 */
import { useState } from 'react';
import { LoginForm, RegisterForm } from '../components/auth/AuthForms';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 animate-fade-in">
            {/* Subtle background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-100/20 rounded-full blur-[100px]" />
            </div>

            <div className="relative card-standard w-full max-w-md bg-white shadow-xl border border-gray-100">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="text-3xl">🎓</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Campus AI</h1>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">
                        {isLogin ? 'Welcome back' : 'Join the OS'}
                    </p>
                </div>

                {isLogin ? (
                    <LoginForm onSwitch={() => setIsLogin(false)} />
                ) : (
                    <RegisterForm onSwitch={() => setIsLogin(true)} />
                )}
            </div>
        </div>
    );
}
