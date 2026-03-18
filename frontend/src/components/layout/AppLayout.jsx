import React, { useState } from 'react';
import SessionSidebar from '../sidebar/SessionSidebar';

export default function AppLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen bg-white dark:bg-gray-950 overflow-hidden">
            <SessionSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
            <main className={`flex-1 flex flex-col min-w-0 bg-gray-50/30 dark:bg-gray-900/10 sidebar-transition ${isSidebarOpen ? '' : 'ml-0'}`}>
                {children}
            </main>
        </div>
    );
}
