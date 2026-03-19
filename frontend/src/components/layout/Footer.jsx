import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-gray-100 dark:bg-[#060912] py-8 border-t border-gray-200 dark:border-white/5 mt-auto transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 dark:text-gray-500">
                <h2 className="text-sm font-bold tracking-widest uppercase mb-2">
                    Campus AI Operating System
                </h2>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-60">
                    © {currentYear} Campus AI. All academic rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
