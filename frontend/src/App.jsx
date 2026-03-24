/**
 * App.jsx — routing with auth protection.
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import HomePage from './pages/HomePage';
import AcademicsPage from './pages/CampusPage';
import ToolsPage from './pages/ToolsPage';
import AgentsPage from './pages/AgentsPage';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import HelpPage from './pages/HelpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VoicePage from './pages/VoicePage';
import MainLayout from './components/layout/MainLayout';
import ProtectedLayout from './components/layout/ProtectedLayout';

function ProtectedRoute({ children }) {
    const { token } = useAuthStore();
    if (!token) return <Navigate to="/auth" replace />;
    return children;
}

export default function App() {
    const { token, fetchUser, user } = useAuthStore();
    const { theme, accentColor, setAppearance, setAccentColor } = useThemeStore();

    useEffect(() => {
        if (token) fetchUser();
    }, [token, fetchUser]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    // Sync from user profile to store
    useEffect(() => {
        if (user) {
            if (user.appearance) setAppearance(user.appearance);
            if (user.accent_color) setAccentColor(user.accent_color);
        }
    }, [user, setAppearance, setAccentColor]);

    // Apply Accent Color to CSS Variables
    useEffect(() => {
        const root = document.documentElement;
        const colors = {
            blue: { main: '#3b82f6', hover: '#2563eb', light: 'rgba(59, 130, 246, 0.1)' },
            purple: { main: '#a855f7', hover: '#9333ea', light: 'rgba(168, 85, 247, 0.1)' },
            green: { main: '#22c55e', hover: '#16a34a', light: 'rgba(34, 197, 94, 0.1)' },
            orange: { main: '#f97316', hover: '#ea580c', light: 'rgba(249, 115, 22, 0.1)' },
            rose: { main: '#f43f5e', hover: '#e11d48', light: 'rgba(244, 63, 94, 0.1)' }
        };

        const active = colors[accentColor] || colors.blue;
        root.style.setProperty('--accent-primary', active.main);
        root.style.setProperty('--accent-primary-hover', active.hover);
        root.style.setProperty('--accent-primary-light', active.light);
    }, [accentColor]);

    return (
        <BrowserRouter>
            <Routes>
                {/* Public / Landing Routes */}
                <Route
                    path="/"
                    element={<LandingPage />}
                />
                <Route
                    path="/auth"
                    element={
                        token ? (
                            <Navigate to="/home" replace />
                        ) : (
                            <MainLayout>
                                <AuthPage />
                            </MainLayout>
                        )
                    }
                />
                <Route
                    path="/forgot-password"
                    element={
                        <MainLayout>
                            <ForgotPasswordPage />
                        </MainLayout>
                    }
                />
                <Route
                    path="/reset-password"
                    element={
                        <MainLayout>
                            <ResetPasswordPage />
                        </MainLayout>
                    }
                />

                {/* Protected App Routes with History Sidebar */}
                <Route
                    path="/home"
                    element={
                        <ProtectedRoute>
                            <ProtectedLayout>
                                <HomePage />
                            </ProtectedLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/academics"
                    element={
                        <ProtectedRoute>
                            <ProtectedLayout>
                                <AcademicsPage />
                            </ProtectedLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/tools"
                    element={
                        <ProtectedRoute>
                            <ProtectedLayout>
                                <ToolsPage />
                            </ProtectedLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/agents"
                    element={
                        <ProtectedRoute>
                            <ProtectedLayout>
                                <AgentsPage />
                            </ProtectedLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProtectedLayout>
                                <ProfilePage />
                            </ProtectedLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/voice"
                    element={
                        <ProtectedRoute>
                            <ProtectedLayout>
                                <VoicePage />
                            </ProtectedLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/help"
                    element={
                        <ProtectedRoute>
                            <ProtectedLayout>
                                <HelpPage />
                            </ProtectedLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
