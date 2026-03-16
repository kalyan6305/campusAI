import React, { useState } from 'react';
import { interviewAPI } from '../../services/api';

const InterviewAgentUI = () => {
    // Stage: 'selection' | 'questions' | 'practice' | 'results'
    const [stage, setStage] = useState('selection');
    const [role, setRole] = useState('');
    const [interviewType, setInterviewType] = useState('Mixed Interview (Technical + HR)');
    const [isGenerating, setIsGenerating] = useState(false);
    const [questions, setQuestions] = useState([]);
    
    // Practice Mode States
    const [isPracticeMode, setIsPracticeMode] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [sessionFeedback, setSessionFeedback] = useState([]); // Store feedback for all questions

    // Learning Suggestions
    const [suggestions, setSuggestions] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    // Doubts State
    const [activeDoubtQuestion, setActiveDoubtQuestion] = useState(null);
    const [doubtQuery, setDoubtQuery] = useState('');
    const [isClarifying, setIsClarifying] = useState(false);
    const [doubtResponse, setDoubtResponse] = useState(null);

    const handleGenerate = async (isMore = false) => {
        if (!role) {
            alert('Please enter or select a job role.');
            return;
        }
        setIsGenerating(true);
        try {
            const excludeTitles = isMore ? questions.map(q => q.question) : [];
            const res = await interviewAPI.generate(role, interviewType, excludeTitles);
            
            if (isMore) {
                setQuestions([...questions, ...res.data.questions]);
            } else {
                setQuestions(res.data.questions);
            }
            setStage('questions');
        } catch (error) {
            console.error(error);
            alert('Failed to generate interview questions.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAskDoubt = async (questionObj) => {
        if (!doubtQuery.trim()) return;
        setIsClarifying(true);
        try {
            const res = await interviewAPI.clarifyDoubt(
                role, 
                questionObj.question, 
                questionObj.suggested_answer, 
                doubtQuery
            );
            setDoubtResponse(res.data);
        } catch (error) {
            console.error(error);
            alert('Failed to clarify doubt.');
        } finally {
            setIsClarifying(false);
        }
    };

    const handleStartPractice = () => {
        setIsPracticeMode(true);
        setCurrentQuestionIndex(0);
        setSessionFeedback([]);
        setStage('practice');
    };

    const handleAnalyzeAnswer = async () => {
        if (!userAnswer.trim()) return;
        setIsAnalyzing(true);
        try {
            const currentQuestion = questions[currentQuestionIndex].question;
            const res = await interviewAPI.getFeedback(role, currentQuestion, userAnswer);
            setFeedback(res.data);
            setSessionFeedback([...sessionFeedback, { 
                question: currentQuestion, 
                userAnswer, 
                analysis: res.data 
            }]);
        } catch (error) {
            console.error(error);
            alert('Failed to analyze answer.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setUserAnswer('');
            setFeedback(null);
        } else {
            handleFinishInterview();
        }
    };

    const handleFinishInterview = async () => {
        setStage('results');
        setIsLoadingSuggestions(true);
        try {
            const res = await interviewAPI.getSuggestions(questions);
            setSuggestions(res.data.topics);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const reset = () => {
        setStage('selection');
        setRole('');
        setQuestions([]);
        setIsPracticeMode(false);
        setCurrentQuestionIndex(0);
        setUserAnswer('');
        setFeedback(null);
        setSessionFeedback([]);
        setSuggestions([]);
    };

    const roleOptions = [
        'AI Engineer',
        'Data Scientist',
        'Software Developer',
        'Frontend Developer',
        'Machine Learning Engineer',
        'Backend Developer',
        'Full Stack Developer',
        'Product Manager'
    ];

    const interviewTypes = [
        'Technical Interview', 
        'HR Interview', 
        'Mixed Interview (Technical + HR)', 
        'Aptitude Test'
    ];

    return (
        <div className="flex flex-col h-full space-y-6 p-6 overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-gray-900/10">
            {stage === 'selection' && (
                <div className="max-w-4xl mx-auto w-full space-y-8 animate-slide-up">
                    <header className="text-center">
                        <span className="text-5xl block mb-4">🎯</span>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Interview Preparation</h2>
                        <p className="text-gray-500 text-lg mt-2">Master your next interview with role-specific questions and expert feedback.</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Step 1: Role */}
                        <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-6">Step 1: Target Role</h3>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    placeholder="Enter job role (e.g. AI Engineer)"
                                    className="w-full p-4 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-bold text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {roleOptions.map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setRole(r)}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                                role === r 
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25' 
                                                : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 hover:border-blue-400'
                                            }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Type */}
                        <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-6">Step 2: Interview Type</h3>
                            <div className="space-y-3">
                                {interviewTypes.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setInterviewType(t)}
                                        className={`w-full p-4 rounded-2xl text-left text-sm font-bold transition-all border ${
                                            interviewType === t 
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20' 
                                            : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-blue-300'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => handleGenerate(false)}
                        disabled={isGenerating || !role}
                        className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl ${
                            isGenerating || !role
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
                        }`}
                    >
                        {isGenerating ? 'Generating Questions...' : 'Start Preparation Pipeline'}
                    </button>
                </div>
            )}

            {stage === 'questions' && (
                <div className="max-w-5xl mx-auto w-full space-y-8 animate-slide-up">
                    <header className="flex justify-between items-end">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{role} Preparation</h3>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{interviewType} — {questions.length} Questions</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={reset} className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                                New Session
                            </button>
                            <button 
                                onClick={handleStartPractice}
                                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                            >
                                Start Practice Mode
                            </button>
                        </div>
                    </header>

                    <div className="space-y-6">
                        {questions.map((q, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden group">
                                <div className="p-1 w-full bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-50 dark:border-gray-800 px-8 py-4 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Question {idx + 1}</span>
                                    <button 
                                        onClick={() => {
                                            setActiveDoubtQuestion(q);
                                            setDoubtResponse(null);
                                            setDoubtQuery('');
                                        }}
                                        className="text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors flex items-center gap-1"
                                    >
                                        <span>Ask a Doubt</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-8 space-y-6">
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed">{q.question}</h4>
                                    
                                    {activeDoubtQuestion?.question === q.question && (
                                        <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl space-y-4 animate-slide-up">
                                            <div className="flex justify-between items-center">
                                                <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Question Clarification</h5>
                                                <button onClick={() => setActiveDoubtQuestion(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                                            </div>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text"
                                                    value={doubtQuery}
                                                    onChange={(e) => setDoubtQuery(e.target.value)}
                                                    placeholder="What would you like to clarify? (e.g., 'Explain the second point better')"
                                                    className="flex-1 p-3 text-xs bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                                <button 
                                                    onClick={() => handleAskDoubt(q)}
                                                    disabled={isClarifying || !doubtQuery.trim()}
                                                    className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {isClarifying ? 'Asking...' : 'Ask'}
                                                </button>
                                            </div>
                                            {doubtResponse && (
                                                <div className="space-y-3 animate-fade-in">
                                                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-white/50 dark:bg-black/20 p-4 rounded-xl">
                                                        {doubtResponse.answer}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {doubtResponse.suggestions.map((s, i) => (
                                                            <span key={i} className="px-2 py-1 bg-blue-100/50 dark:bg-blue-800/30 text-blue-700 dark:text-blue-400 text-[9px] font-bold rounded-lg border border-blue-200/50 italic">
                                                                Tip: {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="p-6 bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/50 rounded-2xl">
                                        <h5 className="text-[10px] font-black text-emerald-650 dark:text-emerald-400 uppercase tracking-widest mb-3">Expert Model Answer</h5>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium italic">"{q.suggested_answer}"</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={() => handleGenerate(true)}
                        disabled={isGenerating}
                        className="w-full py-6 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all font-black uppercase tracking-[0.2em] text-xs"
                    >
                        {isGenerating ? 'Fetching More...' : '+ Load Next 5 Questions'}
                    </button>
                </div>
            )}

            {stage === 'practice' && (
                <div className="max-w-4xl mx-auto w-full h-full flex flex-col space-y-8 animate-slide-up">
                    <header className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                                <span className="text-2xl">🎙️</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Practice Mode</h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        {questions.map((_, i) => (
                                            <div 
                                                key={i} 
                                                className={`w-4 h-1 rounded-full transition-all ${i === currentQuestionIndex ? 'bg-blue-600 w-8' : i < currentQuestionIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} 
                                            />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase ml-2">{currentQuestionIndex + 1} of {questions.length}</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setStage('questions')} className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors">
                            Exit Practice
                        </button>
                    </header>

                    <div className="flex-1 space-y-6 flex flex-col min-h-0">
                        <div className="p-10 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl">
                            <h4 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-8">
                                {questions[currentQuestionIndex].question}
                            </h4>
                            
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Your response</label>
                                <textarea
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    placeholder="Type your answer here as if you were in a real interview..."
                                    className="w-full h-40 p-6 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-3xl text-sm font-medium text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none shadow-inner"
                                />
                            </div>

                            {!feedback && (
                                <button
                                    onClick={handleAnalyzeAnswer}
                                    disabled={isAnalyzing || !userAnswer.trim()}
                                    className={`mt-6 w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all ${
                                        isAnalyzing || !userAnswer.trim()
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                                    }`}
                                >
                                    {isAnalyzing ? 'Analyzing Response...' : 'Submit Answer for Analysis'}
                                </button>
                            )}
                        </div>

                        {feedback && (
                            <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-2xl animate-slide-up">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-2xl">
                                            <span className="text-2xl">📝</span>
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Analysis Results</h5>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Expert Feedback & Scoring</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Clarity Score</span>
                                        <span className="text-4xl font-black text-blue-600 dark:text-blue-400">{feedback.clarity_score}%</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                    <div className="space-y-4">
                                        <h6 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Missing Points</h6>
                                        <ul className="space-y-3">
                                            {feedback.missing_points.map((pt, i) => (
                                                <li key={i} className="flex gap-3 text-sm font-bold text-gray-600 dark:text-gray-400">
                                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                                    {pt}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h6 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Suggestions for Improvement</h6>
                                        <ul className="space-y-3">
                                            {feedback.suggestions.map((sg, i) => (
                                                <li key={i} className="flex gap-3 text-sm font-bold text-gray-600 dark:text-gray-400">
                                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                    {sg}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl mb-8 border border-gray-100 dark:border-gray-800">
                                    <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Overall Feedback</h6>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">{feedback.feedback}</p>
                                </div>

                                <button
                                    onClick={handleNextQuestion}
                                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-blue-500/25 transition-all"
                                >
                                    {currentQuestionIndex < questions.length - 1 ? 'Move to Next Question' : 'Finish & See Learning Plan'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {stage === 'results' && (
                <div className="max-w-6xl mx-auto w-full space-y-10 pb-10 animate-slide-up">
                    <header className="text-center">
                        <div className="inline-block p-6 bg-green-100 dark:bg-green-900/30 rounded-full mb-6">
                            <span className="text-5xl">🏆</span>
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Preparation Session Complete</h2>
                        <p className="text-gray-500 text-lg mt-2 font-medium">You've successfully completed the practice for <span className="text-blue-600 dark:text-blue-400 font-bold">{role}</span>.</p>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Summary Stats */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl">
                                <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-6">Average Performance</h3>
                                <div className="flex items-end gap-2">
                                    <span className="text-6xl font-black text-gray-900 dark:text-white leading-none">
                                        {Math.round(sessionFeedback.reduce((acc, curr) => acc + curr.analysis.clarity_score, 0) / (sessionFeedback.length || 1))}
                                    </span>
                                    <span className="text-2xl font-black text-blue-500 pb-1">%</span>
                                </div>
                                <div className="mt-8 h-2 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500" 
                                        style={{ width: `${Math.round(sessionFeedback.reduce((acc, curr) => acc + curr.analysis.clarity_score, 0) / (sessionFeedback.length || 1))}%` }}
                                    />
                                </div>
                            </div>

                            <div className="p-8 bg-blue-600 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
                                <div className="relative z-10">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-70">Suggested Next Steps</h3>
                                    <div className="space-y-4">
                                        {isLoadingSuggestions ? (
                                            <div className="flex items-center gap-3 animate-pulse">
                                                <div className="w-2 h-2 rounded-full bg-white/50" />
                                                <div className="h-4 bg-white/20 rounded-lg w-full" />
                                            </div>
                                        ) : (
                                            suggestions.map((s, i) => (
                                                <div key={i} className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/10 hover:bg-white/20 transition-all cursor-default group-hover:translate-x-1 duration-300">
                                                    <span className="text-xs font-black">0{i+1}</span>
                                                    <span className="text-sm font-bold tracking-wide">{s}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 p-8 opacity-10 -rotate-12">
                                    <span className="text-8xl">📚</span>
                                </div>
                            </div>

                            <button onClick={reset} className="w-full py-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm">
                                Start New Session
                            </button>
                        </div>

                        {/* Session Timeline */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-4">Detailed Question Breakdown</h3>
                            {sessionFeedback.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                                    <div className="p-8 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white max-w-xl">{item.question}</h4>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                item.analysis.clarity_score >= 80 ? 'bg-green-50 text-green-600' : 
                                                item.analysis.clarity_score >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                            }`}>
                                                {item.analysis.clarity_score}% Clarity
                                            </span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="p-5 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl">
                                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Your Answer</h5>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium italic">"{item.userAnswer}"</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Gaps Identified</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.analysis.missing_points.map((p, i) => (
                                                            <span key={i} className="px-2 py-1 bg-rose-50/50 dark:bg-rose-900/10 text-rose-600 text-[10px] font-bold rounded-lg border border-rose-100/50">{p}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Growth Areas</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.analysis.suggestions.map((p, i) => (
                                                            <span key={i} className="px-2 py-1 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100/50">{p}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterviewAgentUI;
