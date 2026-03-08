/**
 * App.jsx — routing with auth protection.
 */
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import HomePage from './pages/HomePage';
import CampusPage from './pages/CampusPage';
import ToolsPage from './pages/ToolsPage';
import AgentsPage from './pages/AgentsPage';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import MainLayout from './components/layout/MainLayout';
import ProtectedLayout from './components/layout/ProtectedLayout';

function ProtectedRoute({ children }) {
    const { token } = useAuthStore();
    if (!token) return <Navigate to="/auth" replace />;
    return children;
}

export default function App() {
    const { token, fetchUser } = useAuthStore();
    const { theme } = useThemeStore();

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

    return (
        <BrowserRouter>
            <Routes>
                {/* Public / Landing Routes */}
                <Route
                    path="/"
                    element={
                        <MainLayout>
                            <LandingPage />
                        </MainLayout>
                    }
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
                    path="/campus"
                    element={
                        <ProtectedRoute>
                            <ProtectedLayout>
                                <CampusPage />
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

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
