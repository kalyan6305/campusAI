/**
 * AuthPage — login/register page with light theme SaaS styling.
 */
import { useState } from 'react';
import { LoginForm, RegisterForm } from '../components/auth/AuthForms';
import { GraduationCap } from 'lucide-react';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="min-h-[calc(100vh-3.5rem)] bg-gray-50 dark:bg-[#060912] flex items-center justify-center p-6 animate-fade-in transition-colors duration-500">
            {/* Subtle background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-100/20 dark:bg-blue-900/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative card-standard w-full max-w-md bg-white dark:bg-[#0d1117] shadow-xl border border-gray-100 dark:border-white/5 p-8 rounded-3xl">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                        <GraduationCap className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Campus AI</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
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
