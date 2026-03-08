import React from 'react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-gray-100 py-6 border-t border-gray-200 mt-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
                <h2 className="text-lg font-semibold tracking-wide">
                    Campus AI Operating System
                </h2>
                <p className="mt-1 text-sm font-medium">
                    © {currentYear} Campus AI. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
