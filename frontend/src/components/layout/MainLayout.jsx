import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100">
            <Navbar />
            <main className="flex-grow w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
