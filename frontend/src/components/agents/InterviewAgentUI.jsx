import React, { useState } from 'react';
import { interviewAPI } from '../../services/api';
import { Target, Flag, BarChart4 } from 'lucide-react';

const InterviewAgentUI = () => {
    // Stage: 'selection' | 'questions' | 'practice' | 'round_summary' | 'results'
    const [stage, setStage] = useState('selection');
    const [role, setRole] = useState('');
    const [company, setCompany] = useState('Generic');
    const [interviewType, setInterviewType] = useState('Mixed Interview (Technical + HR)');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingMore, setIsGeneratingMore] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [userType, setUserType] = useState('campus_student');
    const [experienceYears, setExperienceYears] = useState(0);
    // Multi-Round States
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [allRoundResults, setAllRoundResults] = useState([]);
    const [finalReport, setFinalReport] = useState(null);

    // Learning Suggestions
    const [suggestions, setSuggestions] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    // Doubts State
    const [activeDoubtQuestion, setActiveDoubtQuestion] = useState(null);
    const [doubtQuery, setDoubtQuery] = useState('');
    const [isClarifying, setIsClarifying] = useState(false);
    const [doubtResponse, setDoubtResponse] = useState(null);

    const getRunningAverages = () => {
        return { depth: 75, edge_cases: 75, communication: 75, correctness: 75, overall: 75 };
    };

    const companyRoundPatterns = {
        "Google": ["DSA", "System Design", "Behavioral"],
        "Amazon": ["DSA", "Leadership Principles", "System Design"],
        "Microsoft": ["DSA", "Coding", "HR"],
        "TCS": ["Aptitude", "Basic Coding", "HR"],
        "Infosys": ["Aptitude", "Technical Basics", "HR"],
        "Generic": ["Technical", "HR"]
    };

    const handleGenerate = async (roundIdx = 0, isAppend = false) => {
        if (!role) {
            alert('Please enter or select a job role.');
            return;
        }
        if (isAppend) setIsGeneratingMore(true);
        else setIsGenerating(true);

        try {
            const rounds = companyRoundPatterns[company] || companyRoundPatterns["Generic"];
            const currentRound = rounds[roundIdx];
            const excludeList = isAppend ? questions.map(q => q.question) : [];

            const res = await interviewAPI.generate(
                role,
                interviewType,
                company,
                currentRound,
                'Intermediate',
                excludeList,
                userType,
                experienceYears,
                5
            );

            if (isAppend) {
                setQuestions([...questions, ...res.data.questions]);
            } else {
                setQuestions(res.data.questions);
            }
            setCurrentRoundIndex(roundIdx);
            setStage('questions');
        } catch (error) {
            console.error(error);
            alert('Failed to generate interview questions.');
        } finally {
            setIsGenerating(false);
            setIsGeneratingMore(false);
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

    const handleStudyRound = () => {
        const rounds = companyRoundPatterns[company] || companyRoundPatterns["Generic"];
        const roundName = rounds[currentRoundIndex];

        const roundResult = {
            round: roundName,
            score: 75,
            feedback: `Studied ${questions.length} questions for ${roundName}.`,
            missing_points: [],
            suggestions: ["Focus on structural answer delivery next time"],
            dimension_avgs: { depth: 75, edge_cases: 75, communication: 75, correctness: 75, overall: 75 },
            what_went_well: "Comprehensive review of model answers.",
            main_gap: "Needs application in live practice soon."
        };

        const updatedResults = [...allRoundResults, roundResult];
        setAllRoundResults(updatedResults);

        if (currentRoundIndex < rounds.length - 1) {
            handleGenerate(currentRoundIndex + 1);
        } else {
            handleFinishInterview(updatedResults);
        }
    };

    const handleNextRound = () => {
        const rounds = companyRoundPatterns[company] || companyRoundPatterns["Generic"];
        if (currentRoundIndex < rounds.length - 1) {
            handleGenerate(currentRoundIndex + 1);
        } else {
            handleFinishInterview();
        }
    };

    const handleFinishInterview = async (customResults = null) => {
        const resultsToUse = customResults || allRoundResults;
        setStage('results');
        setIsLoadingSuggestions(true);
        try {
            const allAvgs = resultsToUse.map(r => r.dimension_avgs);
            const overallAverages = {
                depth: Math.round(allAvgs.reduce((a, b) => a + b.depth, 0) / (allAvgs.length || 1)),
                edge_cases: Math.round(allAvgs.reduce((a, b) => a + b.edge_cases, 0) / (allAvgs.length || 1)),
                communication: Math.round(allAvgs.reduce((a, b) => a + b.communication, 0) / (allAvgs.length || 1)),
                correctness: Math.round(allAvgs.reduce((a, b) => a + b.correctness, 0) / (allAvgs.length || 1)),
            };

            const res = await interviewAPI.finalReport(
                role,
                company,
                resultsToUse,
                overallAverages
            );
            setFinalReport(res.data);
            setSuggestions(res.data.learning_plan);
        } catch (error) {
            console.error(error);
            alert('Failed to generate final report.');
        } finally {
            setIsLoadingSuggestions(false);
        }
    };

    const reset = () => {
        setStage('selection');
        setRole('');
        setCompany('Generic');
        setQuestions([]);
        setSuggestions([]);
        setAllRoundResults([]);
        setFinalReport(null);
    };

    const roleOptions = [
        'AI Engineer', 'Data Scientist', 'Software Developer', 'Frontend Developer',
        'Machine Learning Engineer', 'Backend Developer', 'Full Stack Developer', 'Product Manager'
    ];

    const interviewTypes = [
        'Technical Interview', 'HR Interview', 'Mixed Interview (Technical + HR)', 'Aptitude Test'
    ];

    return (
        <div className="flex flex-col h-full space-y-6 p-6 overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-gray-900/10">
            {stage === 'selection' && (
                <div className="max-w-4xl mx-auto w-full space-y-8 animate-slide-up">
                    <header className="text-center">
                        <Target className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Interview Preparation</h2>
                        <p className="text-gray-500 text-lg mt-2">Master your next interview with role-specific questions and expert feedback.</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-6">Step 1: Target Role</h3>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    placeholder="e.g. AI Engineer"
                                    className="w-full p-4 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-bold text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {roleOptions.map((r) => (
                                        <button key={r} onClick={() => setRole(r)} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${role === r ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 hover:border-blue-400'}`}>
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-6">Step 2: Target Company</h3>
                            <div className="space-y-2">
                                {Object.keys(companyRoundPatterns).map((c) => (
                                    <button key={c} onClick={() => setCompany(c)} className={`w-full p-3 rounded-xl text-left text-xs font-bold transition-all border ${company === c ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-indigo-300'}`}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-6">Step 3: Duration</h3>
                            <div className="space-y-3">
                                {interviewTypes.map((t) => (
                                    <button key={t} onClick={() => setInterviewType(t)} className={`w-full p-4 rounded-2xl text-left text-sm font-bold transition-all border ${interviewType === t ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-blue-300'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => handleGenerate(0)}
                        disabled={isGenerating || !role}
                        className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl ${isGenerating || !role ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'}`}
                    >
                        {isGenerating ? 'Configuring Interview Rounds...' : `Start ${company} Interview Simulation`}
                    </button>
                </div>
            )}

            {stage === 'questions' && (
                <div className="max-w-5xl mx-auto w-full space-y-8 animate-slide-up">
                    <header className="flex justify-between items-end">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{company} Interview</h3>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Round {currentRoundIndex + 1}: {(companyRoundPatterns[company] || companyRoundPatterns["Generic"])[currentRoundIndex]}</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => handleGenerate(currentRoundIndex, true)} disabled={isGeneratingMore} className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:border-blue-500 shadow-sm">
                                {isGeneratingMore ? 'Loading...' : 'Load 5 More'}
                            </button>
                            <button onClick={handleStudyRound} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">
                                {currentRoundIndex < (companyRoundPatterns[company] || []).length - 1 ? 'Next Round' : 'Finish & View Report'}
                            </button>
                        </div>
                    </header>

                    <div className="space-y-6">
                        {questions.map((q, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden group">
                                <div className="p-1 w-full bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-50 px-8 py-4 flex items-center justify-between">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Question {idx + 1}</span>
                                    <button onClick={() => { setActiveDoubtQuestion(q); setDoubtResponse(null); setDoubtQuery(''); }} className="text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors flex items-center gap-1">
                                        <span>Ask a Doubt</span>
                                    </button>
                                </div>
                                <div className="p-8 space-y-6">
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed">{q.question}</h4>
                                    {activeDoubtQuestion?.question === q.question && (
                                        <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl space-y-4">
                                            <div className="flex justify-between items-center">
                                                <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Question Clarification</h5>
                                                <button onClick={() => setActiveDoubtQuestion(null)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="text" value={doubtQuery} onChange={(e) => setDoubtQuery(e.target.value)} placeholder="What would you like to clarify?" className="flex-1 p-3 text-xs bg-white dark:bg-gray-900 border border-gray-100 rounded-xl outline-none" />
                                                <button onClick={() => handleAskDoubt(q)} disabled={isClarifying || !doubtQuery.trim()} className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase rounded-xl hover:bg-blue-700 disabled:opacity-50">
                                                    {isClarifying ? 'Asking...' : 'Ask'}
                                                </button>
                                            </div>
                                            {doubtResponse && (
                                                <div className="space-y-3">
                                                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium bg-white/50 p-4 rounded-xl">
                                                        {doubtResponse.answer}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="p-6 bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 rounded-2xl">
                                        <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Expert Model Answer</h5>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium italic">"{q.suggested_answer}"</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {stage === 'round_summary' && allRoundResults.length > 0 && (
                <div className="max-w-4xl mx-auto w-full space-y-8 animate-slide-up">
                    <header className="text-center">
                        <Flag className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Round Completed</h2>
                        <p className="text-gray-500 text-lg mt-2 font-medium">Finished the <span className="text-blue-600 font-black">{allRoundResults[allRoundResults.length - 1].round}</span> round.</p>
                    </header>
                    <div className="p-10 bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 shadow-2xl space-y-10 text-center">
                        <p className="text-gray-600 dark:text-gray-300 font-medium">Round summary completed. Proceed for final results.</p>
                        <button onClick={handleNextRound} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px]">
                            {currentRoundIndex < (companyRoundPatterns[company] || []).length - 1 ? 'Proceed to Next Round' : 'Finish Interview'}
                        </button>
                    </div>
                </div>
            )}

            {stage === 'results' && finalReport && (
                <div className="max-w-6xl mx-auto w-full space-y-10 pb-10 animate-slide-up">
                    <header className="text-center">
                        <BarChart4 className="w-16 h-16 text-indigo-600 mx-auto mb-6" />
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{company} Interview Report</h2>
                    </header>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 shadow-xl">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Overall Score</h3>
                                <div className="text-7xl font-black text-gray-900 dark:text-white">
                                    {finalReport.overall_score}%
                                </div>
                            </div>
                            <button onClick={reset} className="w-full py-5 bg-white text-gray-900 border border-gray-100 rounded-2xl font-black uppercase text-[10px] hover:bg-gray-50">
                                Start New Simulation
                            </button>
                        </div>
                        <div className="lg:col-span-2 space-y-8">
                            <div className="p-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 rounded-[2.5rem]">
                                <h4 className="text-[10px] font-black text-blue-600 uppercase mb-3">Immediate Next Focus</h4>
                                <p className="text-xl font-black text-gray-900 dark:text-white">{finalReport.next_focus || "Keep practicing."}</p>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-black uppercase tracking-widest">Round Breakdown</h4>
                                <div className="space-y-3">
                                    {allRoundResults.map((r, i) => (
                                        <div key={i} className="flex items-center justify-between p-5 bg-white dark:bg-gray-800 border border-gray-100 rounded-2xl">
                                            <p className="text-sm font-black">{r.round}</p>
                                            <span className="text-lg font-black text-blue-600">{r.score}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {stage === 'results' && isLoadingSuggestions && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                    <p className="text-sm font-black text-gray-500 uppercase">Synthesizing Final Report...</p>
                </div>
            )}
        </div>
    );
};

export default InterviewAgentUI;
