import React from 'react';
import { useLocation } from 'react-router-dom';
import SessionSidebar from '../sidebar/SessionSidebar';
import Navbar from './Navbar';

const ProtectedLayout = ({ children }) => {
    const location = useLocation();
    const showSidebar = location.pathname === '/home';
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
            {/* Top Navigation - Full Width */}
            <Navbar />

            <div className="flex-1 flex min-h-0 relative">
                {/* Side History Sidebar - Only shown on Home page */}
                {showSidebar && (
                    <SessionSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                )}

                {/* Main Content Area */}
                <main className={`flex-1 overflow-hidden p-0 bg-gray-50 dark:bg-gray-900 sidebar-transition ${isSidebarOpen && showSidebar ? '' : 'ml-0'}`}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default ProtectedLayout;
