import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { resumeAPI } from '../../services/api';
import { FileText, Settings, TrendingUp, Download, Clipboard, Check, Zap, GraduationCap, Briefcase, Award } from 'lucide-react';

const ResumeAgentUI = () => {
    // Pipeline States
    const [file, setFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [role, setRole] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('');
    const [results, setResults] = useState(null);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
        if (results?.optimized_resume_md) {
            navigator.clipboard.writeText(results.optimized_resume_md);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

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
                            <div className="absolute top-0 right-0 p-6 opacity-20">
                                <TrendingUp className="w-8 h-8 text-rose-500" />
                            </div>
                            <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-6">ATS Match Comparison</h3>
                            
                            <div className="flex items-center justify-between gap-4">
                                <div className="text-center flex-1 p-4 rounded-3xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                                    <span className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Original</span>
                                    <span className="text-2xl font-black text-gray-500">{results.original_score}%</span>
                                </div>
                                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-full">
                                    <div className="w-8 h-8 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="text-center flex-1 p-4 rounded-3xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50">
                                    <span className="block text-[9px] font-black uppercase tracking-widest text-rose-600 mb-1">Optimized</span>
                                    <span className="text-3xl font-black text-rose-600">{results.optimized_score}%</span>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center gap-4">
                                <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden flex">
                                    <div 
                                        className="h-full bg-gray-300 dark:bg-gray-700 transition-all duration-1000"
                                        style={{ width: `${results.original_score}%` }}
                                    />
                                    <div 
                                        className="h-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-1000"
                                        style={{ width: `${results.optimized_score - results.original_score}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-black text-rose-600">+{results.optimized_score - results.original_score}% Gain</span>
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

                        {results.unmatched_items && results.unmatched_items.length > 0 && (
                            <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl animate-fade-in relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Settings className="w-12 h-12 rotate-12 text-gray-400" />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-gray-400 dark:text-gray-500">Pruning Summary</h3>
                                <div className="space-y-4">
                                    {results.unmatched_items.map((item, i) => (
                                        <div key={i} className="group relative flex items-start gap-3 p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100/50 dark:border-gray-800/50 hover:border-gray-200 transition-all">
                                            <div className="mt-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-[11px] font-bold text-gray-600 dark:text-gray-400 line-through decoration-gray-300">{item.name || item}</h4>
                                                {item.reason && (
                                                    <p className="text-[9px] text-gray-400 mt-1 italic leading-tight group-hover:text-gray-500">{item.reason}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                                    <p className="text-[8px] font-black text-rose-500/60 uppercase tracking-widest text-center">Strategically removed for ATS alignment</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Main Content: Optimized Document Preview */}
                    <div className="lg:col-span-2 space-y-8 flex flex-col">
                        <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-2xl">
                                    <FileText className="w-8 h-8 text-rose-500" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Optimized Document Preview</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.1em]">Strategic Full-Text View</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={reset} className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-gray-200">
                                    Reset
                                </button>
                                <button 
                                    onClick={copyToClipboard}
                                    title="Copy Markdown"
                                    className={`p-3 rounded-2xl transition-all shadow-sm ${copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                >
                                    {copied ? <Check className="w-5 h-5" /> : <Clipboard className="w-5 h-5" />}
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

                        <div className="relative group flex-1">
                            <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-orange-500 rounded-[3rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col h-full">
                                <div className="p-6 border-b border-gray-50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">Optimized Preview (A4 Scale)</h3>
                                    <div className="w-16"></div> {/* Spacer */}
                                </div>
                                <div className="p-4 md:p-16 overflow-y-auto custom-scrollbar bg-[#f1f5f9] dark:bg-black/40 min-h-[600px] max-h-[850px]">
                                    {/* The "Paper" sheet */}
                                    <div className="mx-auto bg-white dark:bg-gray-950 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-none min-h-[1100px] w-full max-w-[850px] p-[1.5cm] md:p-[2.5cm] border border-gray-100 dark:border-gray-800 relative">
                                        <div className="resume-preview markdown-content dark:text-gray-100 prose dark:prose-invert max-w-none">
                                            <ReactMarkdown>{results.optimized_resume_md}</ReactMarkdown>
                                        </div>
                                        {/* Subtle Paper Texture/Gradient */}
                                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/50 to-transparent opacity-10"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Dashboard Section Below Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            {results.optimization_insights && (
                                <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <Settings className="w-20 h-20 rotate-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-rose-500">Strategic Insights</h3>
                                    <p className="text-sm font-bold leading-relaxed text-gray-600 dark:text-gray-300">
                                        {results.optimization_insights}
                                    </p>
                                </div>
                            )}

                            {results.score_booster_suggestions && results.score_booster_suggestions.length > 0 && (
                                <div className="p-8 bg-gradient-to-br from-indigo-900 to-blue-800 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-20">
                                        <Zap className="w-16 h-16 rotate-12" />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 text-blue-300">Score Booster Tips</h3>
                                    <ul className="space-y-3">
                                        {results.score_booster_suggestions.map((tip, i) => (
                                            <li key={i} className="flex gap-3 items-start group">
                                                <div className="mt-1 p-1 bg-white/10 rounded-lg group-hover:bg-blue-400/30 transition-colors">
                                                    <Check className="w-2.5 h-2.5" />
                                                </div>
                                                <span className="text-[11px] font-bold leading-tight">{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .resume-preview { 
                    font-family: 'Inter', system-ui, sans-serif;
                    color: #1a202c;
                    line-height: 1.5;
                }
                .dark .resume-preview { color: #e2e8f0; }
                
                .resume-preview h1 { 
                    font-size: 2.25rem; 
                    font-weight: 800; 
                    text-align: center;
                    margin-bottom: 0.5rem; 
                    color: #111827;
                    letter-spacing: -0.025em;
                }
                .dark .resume-preview h1 { color: #f9fafb; }
                
                .resume-preview h2 { 
                    font-size: 1.1rem; 
                    font-weight: 700; 
                    text-transform: uppercase; 
                    letter-spacing: 0.1em; 
                    color: #c53030; 
                    margin-top: 1.75rem; 
                    margin-bottom: 0.75rem; 
                    border-bottom: 2.5px solid #c53030;
                    padding-bottom: 0.15rem;
                    display: block;
                }
                .dark .resume-preview h2 { color: #f87171; border-color: #f87171; }

                .resume-preview hr {
                    border: 0;
                    border-top: 1px solid #e2e8f0;
                    margin: 1.5rem 0;
                }
                .dark .resume-preview hr { border-color: #374151; }
                
                .resume-preview h3 { 
                    font-size: 1.05rem; 
                    font-weight: 700; 
                    margin-top: 1rem; 
                    margin-bottom: 0.15rem; 
                    color: #1f2937; 
                    display: flex;
                    justify-content: space-between;
                }
                .dark .resume-preview h3 { color: #f3f4f6; }
                
                .resume-preview p { 
                    margin-bottom: 0.5rem; 
                    font-size: 0.93rem; 
                    color: #4a5568;
                }
                .dark .resume-preview p { color: #cbd5e0; }
                
                .resume-preview ul { 
                    list-style-type: none; 
                    margin-bottom: 1rem; 
                    padding-left: 0;
                }
                
                .resume-preview li { 
                    margin-bottom: 0.35rem; 
                    font-size: 0.9rem; 
                    padding-left: 1.25rem;
                    position: relative;
                    color: #4a5568;
                }
                .dark .resume-preview li { color: #cbd5e0; }

                .resume-preview li::before {
                    content: "•";
                    position: absolute;
                    left: 0;
                    color: #c53030;
                    font-weight: bold;
                }
                
                .resume-preview strong { 
                    font-weight: 700; 
                    color: #111827; 
                }
                .dark .resume-preview strong { color: white; }

                /* Header centering for name/contact */
                .resume-preview h1 + p {
                    text-align: center;
                    font-size: 0.85rem;
                    color: #718096;
                    margin-bottom: 1.5rem;
                }

                /* Paper printing effect adjustments */
                @media (max-width: 768px) {
                    .resume-preview { padding: 1rem ! from components; }
                }
            `}} />

        </div>
    );
};

export default ResumeAgentUI;
