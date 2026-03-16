import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { jobApplyAPI } from '../../services/api';

const JobApplyAgentUI = () => {
    // Step 1: Search State
    const [role, setRole] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    
    // Step 2 & 3: Selection & Upload State
    const [selectedJob, setSelectedJob] = useState(null);
    const [file, setFile] = useState(null);
    
    // Step 4: Processing State
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('');
    const [result, setResult] = useState('');

    const handleSearchJobs = async () => {
        if (!role) return;
        setIsSearching(true);
        setJobs([]);
        try {
            const res = await jobApplyAPI.searchJobs(role, "");
            const data = await res.json();
            setHasSearched(true);
            if (data.status === 'SUCCESS' && data.jobs && data.jobs.length > 0) {
                setJobs(data.jobs);
            } else {
                setJobs([]);
            }
        } catch (error) {
            console.error(error);
            alert('Search failed.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleProcess = async () => {
        if (!file || !selectedJob) {
            alert('Please upload a resume and select a job.');
            return;
        }

        setIsProcessing(true);
        setStatus('Initializing Job Assistant...');
        setResult('');

        try {
            const response = await jobApplyAPI.process(file, selectedJob);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Process failed');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '');
                        if (dataStr === '[DONE]') continue;

                        try {
                            const data = JSON.parse(dataStr);
                            if (data.status) {
                                setStatus(data.message || data.status);
                            }
                            if (data.content) {
                                setResult(data.content);
                            }
                            if (data.error) {
                                alert(`Error: ${data.error}`);
                                setIsProcessing(false);
                                return;
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Process failed', error);
            alert(`An error occurred: ${error.message}`);
        } finally {
            setIsProcessing(false);
            setStatus('');
        }
    };

    const resetProcess = () => {
        setSelectedJob(null);
        setFile(null);
        setResult('');
        setStatus('');
        setJobs([]);
        setRole('');
        setHasSearched(false);
    };

    return (
        <div className="flex flex-col h-full space-y-6 p-6 overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-gray-900/10">
            {!selectedJob && !result && (
                <div className="max-w-4xl mx-auto w-full space-y-8">
                    {/* Search Job Section */}
                    <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 animate-slide-up">
                        <div className="mb-6 text-center">
                            <span className="text-4xl block mb-4">🎯</span>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Job Assistant</h2>
                            <p className="text-gray-500 text-sm mt-2 font-medium">Empowering job seekers and graduates to find relevant opportunities.</p>
                            
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                                <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/50">
                                    <span className="text-lg block mb-1">🔍</span>
                                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Search by Role</span>
                                </div>
                                <div className="p-3 bg-purple-50/50 dark:bg-purple-900/20 rounded-2xl border border-purple-100/50 dark:border-purple-800/50">
                                    <span className="text-lg block mb-1">🔗</span>
                                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">Direct Links</span>
                                </div>
                                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100/50 dark:border-emerald-800/50">
                                    <span className="text-lg block mb-1">⭐️</span>
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Best Matches</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 mb-8">
                            <div className="flex flex-col md:flex-row gap-4">
                                <input
                                    type="text"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    placeholder="e.g. AI Engineer, Product Manager"
                                    className="flex-1 p-4 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                />
                                <button
                                    onClick={handleSearchJobs}
                                    disabled={isSearching || !role}
                                    className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                                        isSearching || !role
                                        ? 'bg-gray-100 text-gray-400' 
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20'
                                    }`}
                                >
                                    {isSearching ? 'Searching...' : 'Find Jobs'}
                                </button>
                            </div>
                            {isSearching && (
                                <p className="text-[10px] text-gray-400 font-medium px-1 animate-pulse">
                                    Scanning LinkedIn, Indeed, Glassdoor & MNC portals...
                                </p>
                            )}
                        </div>

                        {/* Job Results List */}
                        {jobs.length > 0 ? (
                            <div className="space-y-4 animate-fade-in">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Select a Job target</h3>
                                <div className="grid gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {jobs.map((job, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => setSelectedJob(job)}
                                            className="p-6 border border-gray-100 dark:border-gray-700 rounded-2xl hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer transition-all bg-white dark:bg-gray-800 hover:shadow-lg dark:hover:shadow-blue-900/10 group relative"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-black text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors pr-2 uppercase tracking-tight">{job.title}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">{job.company}</span>
                                                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                            </svg>
                                                            {job.location}
                                                        </span>
                                                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 px-2 py-0.5 rounded-md uppercase tracking-widest">{job.source || 'Web Search'}</span>
                                                    </div>
                                                </div>
                                                {job.link && (
                                                    <a 
                                                        href={job.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-blue-500/10"
                                                        title="Visit Job Posting"
                                                    >
                                                        <span>View Link</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                                        </svg>
                                                    </a>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{job.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : hasSearched && !isSearching && (
                            <div className="p-10 text-center animate-fade-in bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                                <span className="text-5xl block mb-4">🤷‍♂️</span>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">No Jobs Found</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                                    We couldn't find any official listings for "{role}". Try a different role!
                                </p>
                                <button 
                                    onClick={handleSearchJobs}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {selectedJob && !result && (
                <div className="max-w-2xl mx-auto w-full animate-slide-up space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => setSelectedJob(null)} className="text-xs font-bold text-gray-500 hover:text-blue-600 uppercase tracking-widest">
                            ← Back to Jobs
                        </button>
                    </div>
                    
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-3xl">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">Target Role</h3>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedJob.title} @ <span className="opacity-70">{selectedJob.company}</span></p>
                    </div>

                    <div className="p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 text-center">
                            Upload your current resume
                        </label>
                        <div className="relative group">
                            <input
                                type="file"
                                accept=".pdf,.txt"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="p-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl text-center group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-all bg-gray-50/50 dark:bg-gray-900/30">
                                <span className="text-4xl mb-4 block">📄</span>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                    {file ? file.name : 'Click or drop PDF/TXT file here'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleProcess}
                        disabled={isProcessing || !file}
                        className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl ${
                            isProcessing || !file
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 shadow-none'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
                        }`}
                    >
                        {isProcessing ? status : 'Analyze & Tailor Resume'}
                    </button>
                </div>
            )}

            {/* Output Pane */}
            {result && (
                <div className="flex-1 w-full max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
                    <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                <span className="text-xl">✅</span>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">Job Package Ready</h3>
                                <p className="text-[10px] text-gray-500 font-bold tracking-wider">{selectedJob?.title} @ {selectedJob?.company}</p>
                            </div>
                        </div>
                        <button onClick={resetProcess} className="px-6 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-all">
                            Start New Search
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="markdown-results text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none">
                            <ReactMarkdown
                                components={{
                                    a: ({ node, ...props }) => {
                                        if (props.href && props.href.startsWith('/static/')) {
                                            return (
                                                <a 
                                                    href={`http://127.0.0.1:8000${props.href}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                >
                                                    {props.children}
                                                </a>
                                            );
                                        }
                                        return <a {...props} target="_blank" rel="noopener noreferrer" />;
                                    }
                                }}
                            >
                                {result}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .markdown-results h1 { font-size: 1.8rem; font-weight: 900; margin: 2rem 0 1rem; color: #1e293b; }
                .dark .markdown-results h1 { color: #f8fafc; }
                .markdown-results h2 { font-size: 1.4rem; font-weight: 800; margin: 1.5rem 0 1rem; color: #3b82f6; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;}
                .dark .markdown-results h2 { border-color: #334155; }
                .markdown-results ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
                .markdown-results li { margin-bottom: 0.5rem; }
                .markdown-results a { color: #3b82f6; text-decoration: underline; font-weight: bold; padding: 0.5rem 1rem; background: #eff6ff; border-radius: 0.5rem; display: inline-block; margin-top: 0.5rem;}
                .dark .markdown-results a { background: #1e3a8a; color: #93c5fd; }
                .markdown-results p { margin-bottom: 1rem; line-height: 1.6; }
                .markdown-results code { font-family: monospace; background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-size: 0.9em; }
                .dark .markdown-results code { background: #1e293b; }
                .markdown-results pre code { background: transparent; padding: 0; }
                .markdown-results pre { background: #f8fafc; padding: 1rem; border-radius: 1rem; overflow-x: auto; margin-bottom: 1rem; border: 1px solid #e2e8f0; }
                .dark .markdown-results pre { background: #0f172a; border-color: #334155; }
            `}} />
        </div>
    );
};

export default JobApplyAgentUI;
