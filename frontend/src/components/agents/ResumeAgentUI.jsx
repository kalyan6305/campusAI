import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { resumeAPI } from '../../services/api';
import { FileText, Settings, TrendingUp, Download } from 'lucide-react';

const ResumeAgentUI = () => {
    // Pipeline States
    const [file, setFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [role, setRole] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('');
    const [results, setResults] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleProcess = async () => {
        if (!file || !jobDescription) {
            alert('Please upload a resume and provide a job description.');
            return;
        }

        setIsProcessing(true);
        setStatus('Initializing Resume Agent...');
        setResults(null);

        try {
            const response = await resumeAPI.process(file, { jobDescription, role });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Optimization failed');
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
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') continue;

                        try {
                            const data = JSON.parse(dataStr);
                            if (data.status) {
                                setStatus(data.message || data.status);
                            }
                            if (data.status === 'COMPLETED' && data.data) {
                                setResults(data.data);
                                setIsProcessing(false);
                            }
                            if (data.status === 'ERROR') {
                                alert(`Error: ${data.message}`);
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
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setResults(null);
        setFile(null);
        setJobDescription('');
        setRole('');
        setStatus('');
    };

    return (
        <div className="flex flex-col h-full space-y-6 p-6 overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-gray-900/10">
            {!results && !isProcessing && (
                <div className="max-w-4xl mx-auto w-full space-y-8 animate-slide-up">
                    <header className="text-center">
                        <FileText className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Resume Optimization</h2>
                        <p className="text-gray-500 text-lg mt-2">Tailor your resume for maximum impact and ATS alignment.</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left: Inputs */}
                        <div className="space-y-6">
                            <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">Step 1: Upload Resume</h3>
                                <div className="relative group cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".pdf,.docx,.txt"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className={`p-8 border-2 border-dashed rounded-2xl text-center transition-all ${file ? 'border-green-400 bg-green-50/30 dark:bg-green-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 group-hover:border-blue-400'}`}>
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            {file ? file.name : 'Click to upload PDF or DOCX'}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-widest">{file ? 'File selected' : 'PDF, DOCX accepted'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">Step 2: Role Details</h3>
                                <input
                                    type="text"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    placeholder="Target Role (e.g. Senior AI Engineer)"
                                    className="w-full p-4 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-bold text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Right: Job Description */}
                        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">Step 3: Job Description</h3>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the target job description here..."
                                className="flex-1 w-full p-4 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-medium text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[250px]"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleProcess}
                        disabled={!file || !jobDescription}
                        className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl ${!file || !jobDescription
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-rose-500/25'
                            }`}
                    >
                        Start Optimization Pipeline
                    </button>
                </div>
            )}

            {isProcessing && (
                <div className="flex-grow flex flex-col items-center justify-center space-y-8 animate-pulse">
                    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center animate-bounce">
                        <Settings className="w-10 h-10 text-rose-500" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{status}</h3>
                        <p className="text-gray-500 font-bold mt-2 uppercase tracking-widest text-xs">Our AI is re-engineering your profile...</p>
                    </div>
                </div>
            )}

            {results && (
                <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10 animate-slide-up">
                    {/* Sidebar: Stats & Keywords */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-6">
                                <TrendingUp className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                            </div>
                            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6">ATS Match Score</h3>
                            <div className="flex items-end gap-2">
                                <span className="text-6xl font-black text-gray-900 dark:text-white leading-none">{results.match_score}</span>
                                <span className="text-2xl font-black text-rose-500 pb-1">%</span>
                            </div>
                            <div className="mt-8 h-2 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400 transition-all duration-1000"
                                    style={{ width: `${results.match_score}%` }}
                                />
                            </div>
                        </div>

                        <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl">
                            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Matched Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {results.matched_skills.map((skill, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-green-100 dark:border-green-800/50">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl">
                            <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Missing Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {results.missing_skills.map((skill, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-rose-100 dark:border-rose-800/50">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Document Preview */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-2xl">
                                    <FileText className="w-8 h-8 text-rose-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Optimized Resume</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.1em]">Ready for Download</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={reset} className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                                    Reset
                                </button>
                                <a
                                    href={`http://127.0.0.1:8000${results.pdf_url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2"
                                >
                                    <span>Download PDF</span>
                                    <Download className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col min-h-[600px]">
                            <div className="p-6 border-b border-gray-50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-center">
                                <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">Document Preview</h3>
                            </div>
                            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="resume-preview markdown-content dark:text-gray-200 prose dark:prose-invert max-w-none">
                                    <ReactMarkdown>{results.optimized_resume_md}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .resume-preview { font-family: 'Inter', sans-serif; }
                .resume-preview h1 { font-size: 2.5rem; font-weight: 900; margin-bottom: 2rem; border-bottom: 4px solid #f43f5e; display: inline-block; padding-bottom: 0.5rem; }
                .resume-preview h2 { font-size: 1.25rem; font-weight: 800; text-transform: uppercase; tracking: 0.1em; color: #f43f5e; margin-top: 2rem; margin-bottom: 1rem; }
                .resume-preview h3 { font-size: 1.1rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #1e293b; }
                .dark .resume-preview h3 { color: #f1f5f9; }
                .resume-preview p { line-height: 1.7; color: #475569; margin-bottom: 0.75rem; }
                .dark .resume-preview p { color: #94a3b8; }
                .resume-preview ul { list-style-type: none; padding-left: 0; }
                .resume-preview li { margin-bottom: 0.5rem; position: relative; padding-left: 1.5rem; color: #475569; }
                .dark .resume-preview li { color: #94a3b8; }
                .resume-preview li::before { content: "→"; position: absolute; left: 0; color: #f43f5e; font-weight: 900; }
            `}} />
        </div>
    );
};

export default ResumeAgentUI;
