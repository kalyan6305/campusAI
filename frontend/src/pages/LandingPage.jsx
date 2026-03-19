import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

const LandingPage = () => {
    return (
        <div className="dark bg-[#060912] min-h-screen font-landing-body selection:bg-blue-500/30">
            {/* Scoped Typography for Landing Page */}
            <style dangerouslySetInnerHTML={{ __html: `
                .font-landing-body h1, 
                .font-landing-body h2, 
                .font-landing-body h3, 
                .font-landing-body h4 {
                    font-family: 'Syne', sans-serif !important;
                }
            `}} />

            <Navbar hideThemeToggle />
            {/* Hero Section */}
            <section className="relative min-h-[85vh] flex items-center pt-24 pb-16 overflow-hidden bg-[#060912]">
                <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
                    <div className="grid lg:grid-cols-5 gap-12 items-center">
                        <div className="lg:col-span-3 text-left animate-slide-up">
                            <div className="hero-badge group cursor-default">
                                <span className="text-blue-400">✦</span>
                                <span>The Future of Education</span>
                            </div>
                            
                            <h1 className="hero-title mb-6 max-w-2xl">
                                The <span className="hero-gradient-accent">AI Operating System</span> for Our Campus
                            </h1>
                            
                            <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed max-w-lg">
                                A centralized, sophisticated intelligence layer for your university experience. Fits into your workflow, not the other way around.
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4">
                                <Link to="/auth" className="btn-hero-primary">
                                    Get Started Free
                                </Link>
                                <button className="btn-hero-ghost">
                                    Explore Features
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="m9 18 6-6-6-6"/></svg>
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-2 relative hidden lg:block animate-float">
                            <div className="absolute inset-0 bg-blue-500/15 blur-[100px] rounded-full"></div>
                            
                            {/* Branding Overlay for Mockup */}
                            <div className="absolute top-[12%] left-[8%] z-20 px-4 py-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-2 transform -rotate-1 shadow-2xl pulse-soft">
                                <div className="w-5 h-5 bg-blue-500 rounded-md flex items-center justify-center text-[10px] font-bold text-white">C</div>
                                <span className="text-white font-bold text-xs tracking-tight">Campus AI</span>
                            </div>

                            <img 
                                src="/assets/hero_mockup.png" 
                                alt="Campus AI Dashboard" 
                                className="relative z-10 w-full h-auto rounded-2xl border border-white/5 shadow-2xl backdrop-blur-sm scale-110"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section - Restored Image 1 Style */}
            <section id="features" className="py-24 bg-[#060912]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-xs font-bold text-blue-500 uppercase tracking-[0.4em] mb-4">Powerful Features</h2>
                        <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tight">Everything you need in one place</h3>
                    </div>

                    <div className="bento-grid">
                        {/* 1. Academic Intelligence (Large) */}
                        <div className="feature-card feature-card-large group">
                            <div className="flex flex-col md:flex-row h-full">
                                <div className="md:w-3/5 z-10">
                                    <div className="feature-icon-wrapper">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4.5V19m-4-7h8"/><circle cx="12" cy="12" r="10"/></svg>
                                    </div>
                                    <h4 className="text-3xl font-bold text-white mb-4">Academic Intelligence</h4>
                                    <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                        Automated summarization and adaptive study paths tailored to your specific curriculum and learning style.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="feature-tag">AI-Powered</span>
                                        <span className="feature-tag">Personalized</span>
                                    </div>
                                </div>
                                <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-1/2 opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none">
                                    <img src="/assets/academic_globe.png" alt="Globe" className="w-full h-auto object-contain scale-125" />
                                </div>
                            </div>
                        </div>

                        {/* 2. AI Research Tools (Small) */}
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-4">AI Research Tools</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Deep citation analysis, automated paper drafting, and semantic source discovery across global libraries.
                            </p>
                        </div>

                        {/* 3. Multi-Agent Hub (Small) */}
                        <div className="feature-card">
                            <div className="feature-icon-wrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-4">Multi-Agent Hub</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Specialized autonomous agents that handle your scheduling, email synthesis, and deadline tracking seamlessly.
                            </p>
                        </div>

                        {/* 4. Campus Life (Large) */}
                        <div className="feature-card feature-card-large group">
                            <div className="flex flex-col md:flex-row h-full">
                                <div className="md:w-3/5 z-10">
                                    <div className="feature-icon-wrapper">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16.2 7.8 7.8 16.2"/><path d="m7.8 7.8 8.4 8.4"/></svg>
                                    </div>
                                    <h4 className="text-3xl font-bold text-white mb-4">Campus Life</h4>
                                    <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                        Smart social matching based on interests and real-time digital campus navigation to help you find your community.
                                    </p>
                                    <Link to="/campus" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-bold transition-colors group">
                                        Explore Campus Mode
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 transform group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                                    </Link>
                                </div>
                                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-3xl">
                                    <img src="/assets/campus_waves.png" alt="Waves" className="w-full h-full object-cover" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            
            {/* Testimonials */}
            <section className="py-24 bg-[#060912]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-10 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all">
                            <p className="text-xl text-gray-300 italic mb-8">"Campus AI changed how I approach my finals. The summarization tool is a lifesaver for heavy STEM subjects."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-blue-500"></div>
                                <div>
                                    <p className="text-white font-bold">Alex Chen</p>
                                    <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">Stanford University</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-10 rounded-3xl bg-white/5 border border-white/5 hover:border-teal-500/20 transition-all">
                            <p className="text-xl text-gray-300 italic mb-8">"Finally, an operating system that understands the complexity of academic schedules and research citation."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-teal-500"></div>
                                <div>
                                    <p className="text-white font-bold">Sarah Miller</p>
                                    <p className="text-gray-500 text-xs uppercase font-bold tracking-widest">MIT Graduate</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 bg-gradient-to-t from-blue-600/10 to-transparent">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">Focus on Learning, <br />We'll Handle the Rest.</h2>
                    <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">
                        Join thousands of students transforming their academic journey with specialized, ethical AI.
                    </p>
                    <Link to="/auth" className="btn-hero-primary inline-block">
                        Get Started for Free
                    </Link>
                </div>
            </section>
            {/* Footer Section - Always Dark */}
            <footer className="py-12 bg-[#04060b] border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div>
                            <Link to="/" className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                <span className="bg-blue-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-[11px]">C</span>
                                Campus AI
                            </Link>
                            <p className="text-gray-500 text-xs mt-2">The AI Operating System for Our Campus.</p>
                        </div>
                        <div className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} Campus AI. All academic rights reserved.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
