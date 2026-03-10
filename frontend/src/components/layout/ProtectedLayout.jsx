import React from 'react';
import { useLocation } from 'react-router-dom';
import SessionSidebar from '../sidebar/SessionSidebar';
import Navbar from './Navbar';

const ProtectedLayout = ({ children }) => {
    const location = useLocation();
    const hideGlobalSidebar = ['/campus', '/tools', '/agents', '/voice', '/profile'].includes(location.pathname);

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
            {/* Top Navigation - Full Width */}
            <Navbar />

            <div className="flex-1 flex min-h-0">
                {/* Side History Sidebar - Hidden on specialized pages */}
                {!hideGlobalSidebar && <SessionSidebar />}

                {/* Main Content Area */}
                <main className="flex-1 overflow-hidden p-0 bg-gray-50 dark:bg-gray-900">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default ProtectedLayout;
