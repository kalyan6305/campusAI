import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import useThemeStore from '../../store/themeStore';
import useAuthStore from '../../store/authStore';
import { Home, GraduationCap, Wrench, Bot, Mic, User, Sun, Moon, LogOut, Menu } from 'lucide-react';

const Navbar = ({ hideThemeToggle = false }) => {
    const { theme, toggleTheme } = useThemeStore();
    const { logout, user } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isAuthenticated = !!user;
    const isMarketingPage = location.pathname === '/' || location.pathname === '/auth' || location.pathname === '/forgot-password' || location.pathname === '/reset-password';

    const navLinks = [
        {
            name: 'Home',
            path: '/home',
            icon: <Home className="h-4 w-4" />
        },
        {
            name: 'Academics',
            path: '/academics',
            icon: <GraduationCap className="h-4 w-4" />
        },
        {
            name: 'Tools',
            path: '/tools',
            icon: <Wrench className="h-4 w-4" />
        },
        {
            name: 'Agents',
            path: '/agents',
            icon: <Bot className="h-4 w-4" />
        },
        {
            name: 'Voice AI',
            path: '/voice',
            icon: <Mic className="h-4 w-4" />
        },
        {
            name: 'Profile',
            path: '/profile',
            icon: <User className="h-4 w-4" />
        },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full bg-white dark:bg-[#060912] border-b border-gray-100 dark:border-white/5 shadow-sm transition-all duration-300">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="text-xl font-black text-blue-600 dark:text-blue-500 tracking-tight hover:opacity-90 transition-opacity flex items-center gap-2">
                            <GraduationCap className="h-6 w-6" />
                            Campus AI
                        </Link>
                    </div>

                    {/* Navigation Buttons - Hidden on Marketing/Auth Pages */}
                    {!isMarketingPage && (
                        <div className="hidden md:flex items-center space-x-1">
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.name}
                                    to={link.path}
                                    className={({ isActive }) =>
                                        `px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all duration-200 flex items-center gap-2 ${isActive
                                            ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                        }`
                                    }
                                >
                                    <span className="scale-100">{link.icon}</span>
                                    <span>{link.name}</span>
                                </NavLink>
                            ))}
                        </div>
                    )}

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-4">
                        {/* Marketing Page Action Buttons */}
                        {isMarketingPage ? (
                            <>
                                {isAuthenticated ? (
                                    <Link
                                        to="/home"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        Go to Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link to="/auth" className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold transition-colors">
                                            Login
                                        </Link>
                                        <Link
                                            to="/auth"
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20"
                                        >
                                            Get Started
                                        </Link>
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Theme Toggle (Internal Pages) */}
                                {!hideThemeToggle && (
                                    <button
                                        onClick={toggleTheme}
                                        className="p-2.5 text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-400 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none"
                                        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                                    >
                                        {theme === 'dark' ? (
                                            <Sun className="h-5 w-5" />
                                        ) : (
                                            <Moon className="h-5 w-5" />
                                        )}
                                    </button>
                                )}

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/50 flex items-center gap-2"
                                    title="Sign Out"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Sign Out</span>
                                </button>
                            </>
                        )}

                        {/* Mobile menu button */}
                        {!isMarketingPage && (
                            <div className="md:hidden flex items-center">
                                <button
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className={`text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400' : ''
                                        }`}
                                >
                                    <Menu className="h-6 w-6" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Menu */}
            {!isMarketingPage && isMenuOpen && (
                <div className="md:hidden border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#060912] animate-slide-down">
                    <div className="px-4 py-4 space-y-1">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={({ isActive }) =>
                                    `px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-3 ${isActive
                                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`
                                }
                            >
                                <span className={location.pathname === link.path ? 'text-blue-600 dark:text-blue-400' : ''}>
                                    {link.icon}
                                </span>
                                <span>{link.name}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
