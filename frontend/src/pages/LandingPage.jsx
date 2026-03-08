import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    const features = [
        {
            title: 'Academic Intelligence',
            description: 'Access regulations, syllabus, and subject data across all branches and semesters.',
            icon: '📚'
        },
        {
            title: 'AI Research Tools',
            description: 'Deep-dive into web and document data with our specialized research assistant.',
            icon: '🔍'
        },
        {
            title: 'Multi-Agent Hub',
            description: 'Interact with specialized agents for Medical, Agriculture, Career, and more.',
            icon: '🤖'
        },
        {
            title: 'Campus Life',
            description: 'Everything from hostels to transport, integrated into a single AI OS.',
            icon: '🏛️'
        }
    ];

    return (
        <div className="bg-white dark:bg-gray-900 min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/40 mb-8 animate-fade-in">
                            <span className="flex h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 mr-2"></span>
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-widest">v2.0 Now Live</span>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6 animate-slide-up">
                            The AI Operating System for <span className="text-blue-600 dark:text-blue-400">Your Campus</span>
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed animate-slide-up">
                            Connect every part of your university experience with powerful AI. From academics to campus services, centralized and specialized for you.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
                            <Link to="/auth" className="btn-primary text-lg py-3 px-8">
                                Get Started Free
                            </Link>
                            <a href="#features" className="btn-secondary text-lg py-3 px-8">
                                Explore Features
                            </a>
                        </div>
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]"></div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">Powerful Features</h2>
                        <h3 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Everything you need in one place</h3>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((feature, idx) => (
                            <div key={idx} className="card-standard dark:bg-gray-800 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-500 transition-all duration-300">
                                <div className="w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-inner">
                                    {feature.icon}
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h4>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-600 dark:bg-blue-800">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to transform your campus experience?</h2>
                    <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
                        Join thousands of students and faculty members using Campus AI to stay ahead.
                    </p>
                    <Link to="/auth" className="inline-block bg-white text-blue-600 font-bold py-4 px-10 rounded-xl hover:bg-gray-50 transition-colors shadow-xl">
                        Go to Marketplace
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
