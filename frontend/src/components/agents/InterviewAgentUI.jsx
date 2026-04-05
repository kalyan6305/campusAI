import React, { useState, useRef, useEffect } from 'react';
import { interviewAPI } from '../../services/api';
import { useGamificationStore } from '../../store/gamificationStore';
import { 
    Target, Flag, BarChart4, BookOpen, Terminal, Trophy, 
    Layout, ChevronRight, Clock, Star, ArrowLeft, Zap, Award
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import GamificationDashboard from './GamificationDashboard';
import ArenaGame from './ArenaGame';
import LiveInterviewSession from './LiveInterviewSession';

const isAptitudeRound = (round) => {
    if (!round) return false;
    const r = round.toLowerCase();
    return r.includes('aptitude') || r.includes('oa') || r.includes('online assessment') || r.includes('nqt') || r.includes('test');
};

const mapPredictedToRoundObjects = (roundNames) => {
    if (!roundNames || roundNames.length === 0) return [];
    return roundNames.map((name, index) => {
        const lowerName = name.toLowerCase();
        let type = "technical";
        let difficulty = "Medium";
        let desc = "In-depth technical assessment and problem solving.";

        if (lowerName.includes('aptitude') || lowerName.includes('oa') || lowerName.includes('test') || lowerName.includes('online')) {
            type = "aptitude";
            difficulty = "Easy";
            desc = "Speed and accuracy based initial screening.";
        } else if (lowerName.includes('hr') || lowerName.includes('behavioral') || lowerName.includes('culture') || lowerName.includes('leadership')) {
            type = "hr";
            difficulty = "Behavioural";
            desc = "Assessment of culture fit and leadership qualities.";
        } else if (lowerName.includes('system') || lowerName.includes('design') || lowerName.includes('architecture')) {
            type = "technical";
            difficulty = "Hard";
            desc = "High-level architectural design and scalability.";
        } else if (lowerName.includes('manager') || lowerName.includes('m r')) {
            type = "hr";
            difficulty = "Medium";
            desc = "Discussion with hiring manager on goals and team fit.";
        }

        return {
            id: `ai_round_${index}`,
            num: index + 1,
            name: name,
            desc: desc,
            difficulty: difficulty,
            type: type,
            isAI: true
        };
    });
};

const COMPANY_ROUNDS = {
  amazon: {
    tip: "Every Amazon round tests Leadership Principles in some form. Even technical rounds end with a behavioral question. Prepare LP stories alongside DSA.",
    rounds: [
      { id: "oa", num: 1,
        name: "Online Assessment",
        desc: "DSA problems + work style survey, 90 min time-boxed",
        difficulty: "Medium", type: "aptitude" },
      { id: "phone_screen", num: 2,
        name: "Phone Screen",
        desc: "1 medium DSA problem + quick CS fundamentals",
        difficulty: "Medium", type: "technical" },
      { id: "technical_r1", num: 3,
        name: "Technical Round 1",
        desc: "2 DSA problems, edge cases, complexity analysis",
        difficulty: "Hard", type: "technical" },
      { id: "technical_r2", num: 4,
        name: "Technical Round 2",
        desc: "System design or advanced DSA by role level",
        difficulty: "Hard", type: "technical" },
      { id: "hr_lp", num: 5,
        name: "HR + Leadership Principles",
        desc: "STAR format answers mapped to Amazon 16 LPs",
        difficulty: "Behavioural", type: "hr" }
    ]
  },
  google: {
    tip: "Google values multiple approaches. Always discuss brute force first then optimise. Clean code and clear complexity analysis are non-negotiable.",
    rounds: [
      { id: "oa", num: 1,
        name: "Online Coding Challenge",
        desc: "2-3 algorithmic problems on coding platform",
        difficulty: "Medium", type: "aptitude" },
      { id: "phone_screen", num: 2,
        name: "Technical Phone Screen",
        desc: "Live coding, 1 problem, think aloud required",
        difficulty: "Medium", type: "technical" },
      { id: "onsite_r1", num: 3,
        name: "Onsite: Coding Round 1",
        desc: "Data structures, algorithms, optimal complexity",
        difficulty: "Hard", type: "technical" },
      { id: "onsite_r2", num: 4,
        name: "Onsite: Coding Round 2",
        desc: "Advanced algorithms, graphs, DP, clean code",
        difficulty: "Hard", type: "technical" },
      { id: "system_googleyness", num: 5,
        name: "System Design + Googleyness",
        desc: "Large scale design + culture and collaboration",
        difficulty: "Hard", type: "technical" }
    ]
  },
  microsoft: {
    tip: "Microsoft focuses on OOP and design patterns. They often ask you to extend your solution. Build modular clean code from the start.",
    rounds: [
      { id: "oa", num: 1,
        name: "Online Assessment",
        desc: "Coding problems + cognitive assessment",
        difficulty: "Easy", type: "aptitude" },
      { id: "technical_r1", num: 2,
        name: "Technical Round 1",
        desc: "Data structures, OOP design, problem solving",
        difficulty: "Medium", type: "technical" },
      { id: "technical_r2", num: 3,
        name: "Technical Round 2",
        desc: "System design basics, extensibility focus",
        difficulty: "Hard", type: "technical" },
      { id: "hr", num: 4,
        name: "HR Round",
        desc: "Culture fit, career goals, past project deep dive",
        difficulty: "Behavioural", type: "hr" }
    ]
  },
  tcs: {
    tip: "TCS NQT has a strict syllabus. Verbal and logical reasoning matter as much as coding. The TR round tests CS fundamentals — DBMS, OS, OOP, Networks.",
    rounds: [
      { id: "nqt_cognitive", num: 1,
        name: "NQT — Cognitive Skills",
        desc: "Verbal, reasoning, numerical ability, 65 min",
        difficulty: "Easy", type: "aptitude" },
      { id: "nqt_programming", num: 2,
        name: "NQT — Programming Logic",
        desc: "Coding fundamentals, flowcharts, basic DSA",
        difficulty: "Medium", type: "aptitude" },
      { id: "technical", num: 3,
        name: "Technical Round",
        desc: "DBMS, OS, OOP, Networks, project discussion",
        difficulty: "Medium", type: "technical" },
      { id: "hr", num: 4,
        name: "HR Round",
        desc: "Communication, attitude, relocation, salary",
        difficulty: "Easy", type: "hr" }
    ]
  },
  infosys: {
    tip: "Infosys Springboard aptitude is straightforward if you practise. The TR round is not deep — good fundamentals and a well-explained project are enough.",
    rounds: [
      { id: "springboard", num: 1,
        name: "Springboard — Aptitude",
        desc: "Quantitative, logical, verbal, pseudocode, 95 min",
        difficulty: "Easy", type: "aptitude" },
      { id: "technical", num: 2,
        name: "Technical Round",
        desc: "CS fundamentals, project discussion, basic coding",
        difficulty: "Easy", type: "technical" },
      { id: "hr", num: 3,
        name: "HR Round",
        desc: "Career goals, strengths, team fit, communication",
        difficulty: "Easy", type: "hr" }
    ]
  },
  wipro: {
    tip: "Wipro NLTH tests aptitude and written communication heavily. Technical round focuses on fundamentals. Be ready to write an essay in the written round.",
    rounds: [
      { id: "nlth_aptitude", num: 1,
        name: "NLTH — Aptitude",
        desc: "Quantitative, logical reasoning, verbal, 60 min",
        difficulty: "Easy", type: "aptitude" },
      { id: "nlth_written", num: 2,
        name: "NLTH — Written Communication",
        desc: "Essay writing, email writing, comprehension",
        difficulty: "Easy", type: "hr" },
      { id: "nlth_coding", num: 3,
        name: "NLTH — Coding",
        desc: "2 coding problems, any language, 60 min",
        difficulty: "Medium", type: "aptitude" },
      { id: "technical", num: 4,
        name: "Technical Round",
        desc: "CS fundamentals, coding concepts, project",
        difficulty: "Medium", type: "technical" },
      { id: "hr", num: 5,
        name: "HR Round",
        desc: "Background, expectations, communication check",
        difficulty: "Easy", type: "hr" }
    ]
  },
  flipkart: {
    tip: "Flipkart values practical thinking and scalability. Relate your solutions to real-world e-commerce scale. System design is tested even at SDE-1 level.",
    rounds: [
      { id: "oa", num: 1, name: "Online Assessment", desc: "2-3 DSA problems, medium to hard difficulty", difficulty: "Hard", type: "aptitude" },
      { id: "technical_r1", num: 2, name: "Technical Round 1", desc: "Data structures, algorithms, practical problem", difficulty: "Hard", type: "technical" },
      { id: "technical_r2", num: 3, name: "Technical Round 2", desc: "System design, scalability, past project deep dive", difficulty: "Hard", type: "technical" },
      { id: "hr", num: 4, name: "HR Round", desc: "Culture fit, ownership mindset, career goals", difficulty: "Behavioural", type: "hr" }
    ]
  },
  meta: {
    tip: "Meta focuses on speed and signal. You have exactly 45 minutes for 2 problems. Brute force is rarely enough; aim for optimal time/space immediately.",
    rounds: [
      { id: "screen", num: 1, name: "Technical Screen", desc: "2 DSA problems, 45 minutes, very tight timing", difficulty: "Hard", type: "technical" },
      { id: "onsite_coding", num: 2, name: "Onsite: Coding (x2)", desc: "Two separate coding sessions, focus on optimal patterns", difficulty: "Hard", type: "technical" },
      { id: "onsite_system", num: 3, name: "Onsite: System Design", desc: "Focus on horizontally scalable services and tradeoffs", difficulty: "Hard", type: "technical" },
      { id: "behavioral", num: 4, name: "Behavioral", desc: "Focus on resolving conflict and impact examples", difficulty: "Behavioural", type: "hr" }
    ]
  },
  netflix: {
    tip: "Netflix values their Culture Memo. Read it 5 times. They look for high performance, radical candor, and 'stunning colleagues'.",
    rounds: [
      { id: "screen", num: 1, name: "Initial Screen", desc: "Technical discussion + culture alignment check", difficulty: "Medium", type: "technical" },
      { id: "technical_deep", num: 2, name: "Deep Technical", desc: "Complex domain-specific problems and architecture", difficulty: "Hard", type: "technical" },
      { id: "culture_fit", num: 3, name: "Culture Context", desc: "Deep dive into Netflix values and judgment", difficulty: "Behavioural", type: "hr" },
      { id: "executive", num: 4, name: "Executive/Director Round", desc: "Broader impact, strategy, and team leadership", difficulty: "Hard", type: "hr" }
    ]
  },
  apple: {
    tip: "Apple care about the 'What' and the 'How'. Be ready to discuss the low-level details of your past projects. Performance and privacy are key.",
    rounds: [
      { id: "oa", num: 1, name: "Online Challenge", desc: "LeetCode style problems or specialized domain test", difficulty: "Medium", type: "aptitude" },
      { id: "tech_screen", num: 2, name: "Technical Screen", desc: "Focus on fundamentals (OS, Memory, Language internals)", difficulty: "Medium", type: "technical" },
      { id: "onsite_tech", num: 3, name: "Onsite: Technical (x3)", desc: "Multiple rounds focusing on hardware/software interface", difficulty: "Hard", type: "technical" },
      { id: "manager", num: 4, name: "Manager Round", desc: "Collaboration, focus on quality and detail", difficulty: "Medium", type: "hr" }
    ]
  },
  adobe: {
    tip: "Adobe tests algorithmic efficiency and system basics. They often ask questions related to image processing or PDF structure in specific teams.",
    rounds: [
      { id: "oa", num: 1, name: "Adobe OA", desc: "Aptitude + 2-3 coding problems, 120 minutes", difficulty: "Medium", type: "aptitude" },
      { id: "technical_r1", num: 2, name: "Technical Round 1", desc: "DSA, problem solving, logic puzzles", difficulty: "Medium", type: "technical" },
      { id: "technical_r2", num: 3, name: "Technical Round 2", desc: "Advanced DSA, project deep dive, OOP", difficulty: "Hard", type: "technical" },
      { id: "hr", num: 4, name: "HR Round", desc: "Core values, flexible work, future potential", difficulty: "Easy", type: "hr" }
    ]
  },
  generic: {
    tip: "Select a specific company in Step 2 to see its exact rounds and requirements. Generic mode covers all common interview types.",
    rounds: [
      { id: "aptitude", num: 1,
        name: "Aptitude & Logical Reasoning",
        desc: "Quantitative, verbal, logical, coding MCQs",
        difficulty: "Easy", type: "aptitude" },
      { id: "technical", num: 2,
        name: "Technical Round",
        desc: "Data structures, algorithms, CS fundamentals",
        difficulty: "Medium", type: "technical" },
      { id: "system_design", num: 3,
        name: "System Design",
        desc: "Architecture, scalability, design patterns",
        difficulty: "Hard", type: "technical" },
      { id: "hr", num: 4,
        name: "HR + Behavioural",
        desc: "STAR format, culture fit, career goals",
        difficulty: "Behavioural", type: "hr" }
    ]
  },
  other: {
    tip: "For companies not listed, we cover all standard interview round types so you are prepared for anything.",
    rounds: [
      { id: "aptitude", num: 1,
        name: "Aptitude Round",
        desc: "Quantitative, verbal, logical reasoning",
        difficulty: "Easy", type: "aptitude" },
      { id: "technical", num: 2,
        name: "Technical Round",
        desc: "CS fundamentals, coding, problem solving",
        difficulty: "Medium", type: "technical" },
      { id: "hr", num: 3,
        name: "HR Round",
        desc: "Communication, fit, career discussion",
        difficulty: "Easy", type: "hr" }
    ]
  }
};

const InterviewAgentUI = () => {
    // View: 'home' | 'question_bank' | 'mock_interview' | 'gamification'
    const [activeTab, setActiveTab] = useState('practice');
    const [activeDoubtQuestion, setActiveDoubtQuestion] = useState(null);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [experience, setExperience] = useState('2-5 years');
    const [userType, setUserType] = useState('Student');
    const [allRoundResults, setAllRoundResults] = useState([]);
    const [finalReport, setFinalReport] = useState(null);
    const [isPredictingRounds, setIsPredictingRounds] = useState(false);
    const [arenaLevel, setArenaLevel] = useState(null);
    const [view, setView] = useState('home');
    const [role, setRole] = useState('Software Developer');
    const [company, setCompany] = useState('Generic');
    const { addXP, updateChallengeProgress, streak } = useGamificationStore();

    // --- MOCK INTERVIEW SPECIFIC STATES ---
    const [mockConfig, setMockConfig] = useState({ role: '', difficulty: 'Mixed', duration: 15 });
    const [isMockSessionActive, setIsMockSessionActive] = useState(false);
    const [isMockReportActive, setIsMockReportActive] = useState(false);
    const [mockQuestions, setMockQuestions] = useState([]);
    const [currentMockQuestionIndex, setCurrentMockQuestionIndex] = useState(0);
    const [mockResponses, setMockResponses] = useState({});
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [mockDurationLeft, setMockDurationLeft] = useState(0);
    const mockTimerRef = useRef(null);
    const [isGeneratingMock, setIsGeneratingMock] = useState(false);
    const [isAutoReadEnabled, setIsAutoReadEnabled] = useState(true);
    const [mockReportFeedback, setMockReportFeedback] = useState(null);
    const [isGeneratingMockReport, setIsGeneratingMockReport] = useState(false);

    // --- LIVE INTERVIEW STATE ---
    const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);

    // --- MOCK INTERVIEW VIDEOS STATES ---
    const [mockTab, setMockTab] = useState('setup');
    const [videoQuery, setVideoQuery] = useState('');
    const [videos, setVideos] = useState([]);
    const [isLoadingVideos, setIsLoadingVideos] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState(null);
    const [listeningIdx, setListeningIdx] = useState(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        if (company && role) {
            setVideoQuery(`${company !== 'Generic' ? company : ''} ${role !== 'Other' ? role : ''} mock interview`.trim());
        }
    }, [company, role]);

    const handleFetchVideos = async () => {
        if (!videoQuery.trim()) return;
        setIsLoadingVideos(true);
        try {
            const res = await interviewAPI.getVideos(videoQuery);
            setVideos(res.data.videos || []);
        } catch(e) {
            console.error("Failed to fetch videos", e);
        } finally {
            setIsLoadingVideos(false);
        }
    };

    const speakText = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };
    
    // Stop speaking if component unmounts or flow changes
    React.useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // --- MOCK INTERVIEW AUTO-READ ---
    React.useEffect(() => {
        if (isMockSessionActive && isAutoReadEnabled && mockQuestions[currentMockQuestionIndex]) {
            // Slight delay to allow UI to transition before speaking
            const timeoutId = setTimeout(() => {
                speakText(mockQuestions[currentMockQuestionIndex].question);
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [currentMockQuestionIndex, isMockSessionActive, mockQuestions, isAutoReadEnabled]);

    // --- MOCK TIMER HOOK ---
    React.useEffect(() => {
        if (isMockSessionActive && mockDurationLeft > 0) {
            mockTimerRef.current = setInterval(() => {
                setMockDurationLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(mockTimerRef.current);
                        setIsMockSessionActive(false);
                        setIsMockReportActive(true);
                        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                        if (recognitionRef.current) recognitionRef.current.stop();
                        setListeningIdx(null);
                        setIsSpeaking(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(mockTimerRef.current);
    }, [isMockSessionActive, mockDurationLeft]);

    const toggleSpeechRecognitionMock = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Speech recognition is not supported in this browser.");
            return;
        }
        
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }

        if (listeningIdx === 'mock') {
            recognitionRef.current?.stop();
            setListeningIdx(null);
            return;
        }

        const SpeechRecon = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecon();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setMockResponses(prev => ({
                    ...prev,
                    [currentMockQuestionIndex]: (prev[currentMockQuestionIndex] || '') + finalTranscript + ' '
                }));
            }
        };

        recognitionRef.current.onerror = (event) => {
            console.error(event.error);
            setListeningIdx(null);
        };

        recognitionRef.current.onend = () => {
            if (listeningIdx === 'mock') setListeningIdx(null);
        };

        recognitionRef.current.start();
        setListeningIdx('mock');
    };

    const getRounds = () => {
        if (predictedRounds.length > 0) return predictedRounds;
        const companyKey = company.toLowerCase();
        const pattern = COMPANY_ROUNDS[companyKey] || COMPANY_ROUNDS.other;
        return pattern.rounds.map(r => r.name);
    };

    const handlePredictRounds = async () => {
        if (!customCompany) return;
        setIsPredictingRounds(true);
        try {
            const res = await interviewAPI.predictRounds(customCompany, customRole || role);
            if (res.data && res.data.length > 0) {
                setPredictedRounds(res.data);
                setCompany('Other');
            } else {
                alert("Could not detect specific rounds. Using generic process.");
                setCompany('Generic');
            }
        } catch (e) {
            console.error("Round prediction failed", e);
            setCompany('Generic');
        } finally {
            setIsPredictingRounds(false);
        }
    };

    // Note: Question Bank generation removed safely

    // Note: Question Bank logic (practice, study, load more) removed safely

    const getRunningAverages = () => {
        const dimensions = ['depth', 'edge_cases', 'communication', 'correctness'];
        const avgs = {};
        dimensions.forEach(dim => {
            const scores = questions
                .filter(q => q.isSubmitted && q.feedback?.scores?.[dim])
                .map(q => q.feedback.scores[dim]);
            avgs[dim] = scores.length > 0 
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
                : 0;
        });
        // Default values if no questions submitted yet
        if (Object.values(avgs).every(v => v === 0)) {
            return { depth: 0, edge_cases: 0, communication: 0, correctness: 0 };
        }
        return avgs;
    };

    const toggleListening = (idx) => {
        if (listeningIdx === idx) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setListeningIdx(null);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition isn't supported in your browser. Use Chrome or Edge.");
            return;
        }

        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) {}
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' ';
                }
            }
            if (finalTranscript) {
                setQuestions(prev => prev.map((q, i) => {
                    if (i === idx) {
                        return { ...q, userAnswer: (q.userAnswer || '') + finalTranscript };
                    }
                    return q;
                }));
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setListeningIdx(null);
        };

        recognition.onend = () => {
            setListeningIdx(null);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setListeningIdx(idx);
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
        const rounds = getRounds();
        const roundName = rounds[currentRoundIndex];
        const avgs = getRunningAverages();
        
        const roundResult = {
            round: roundName,
            score: Math.round(Object.values(avgs).reduce((a, b) => a + b, 0) / 4) || 70,
            feedback: `Completed ${questions.length} questions for ${roundName}.`,
            missing_points: [],
            suggestions: ["Focus on structural answer delivery next time"],
            dimension_avgs: avgs,
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
        const rounds = getRounds();
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

            const res = await interviewAPI.getFinalReport(
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

    const handleDrill = (focusTopic) => {
        setSelectedTopic(focusTopic || "All topics");
        setStage('analysis'); // Go through analysis again for fresh questions
        handleGenerate(currentRoundIndex, false);
    };

    const reset = () => {
        setView('home');
        setRole('Software Developer');
        setCompany('Generic');
        setAllRoundResults([]);
        setFinalReport(null);
        setCurrentRoundIndex(0);
        setSessionStreak(0);
        setTopicPerformance({});
    };

    // Launch the fully interactive live interview
    const startLiveInterview = () => {
        if (!mockConfig.role) { alert('Please enter a role first.'); return; }
        setIsLiveSessionActive(true);
        setIsMockSessionActive(false);
        setIsMockReportActive(false);
    };

    // Called when LiveInterviewSession finishes — bridge into existing report flow
    const handleLiveFinish = async (questions, responses) => {
        setIsLiveSessionActive(false);
        setMockQuestions(questions);
        setMockResponses(responses);
        setIsMockReportActive(true);

        // Generate the AI report automatically
        setMockReportFeedback(null);
        setIsGeneratingMockReport(true);
        try {
            const qs = questions.map(q => q.question);
            const ans = questions.map((_, idx) => responses[idx] || 'No answer provided.');
            const res = await interviewAPI.getMockReport(mockConfig.role, mockConfig.difficulty, qs, ans);
            setMockReportFeedback(res.data);
        } catch (e) {
            console.error('Failed to generate mock report:', e);
        } finally {
            setIsGeneratingMockReport(false);
        }
    };

    const startMockInterview = async () => {
        setIsGeneratingMock(true);
        try {
            const numQuestions = Math.max(3, Math.round(mockConfig.duration / 1.5));
            const response = await interviewAPI.generate(
                mockConfig.role || 'Software Developer',
                'Technical Interview',
                company,
                null,
                mockConfig.difficulty,
                [],
                'general',
                2,
                numQuestions,
                null,
                true
            );
            
            let fetchedQs = [];
            if (response.data?.questions) {
                fetchedQs = response.data.questions;
            } else if (Array.isArray(response.data)) {
                fetchedQs = response.data;
            } else {
                fetchedQs = [response.data];
            }

            setMockQuestions(fetchedQs);
            setCurrentMockQuestionIndex(0);
            setMockResponses({});
            setIsMockSessionActive(true);
            setIsMockReportActive(false);
            setMockDurationLeft(mockConfig.duration * 60);
        } catch (error) {
            console.error("Failed to start mock interview:", error);
            alert("Failed to initialize mock interview. Please try again.");
        } finally {
            setIsGeneratingMock(false);
        }
    };

    const finishMockInterview = async () => {
        clearInterval(mockTimerRef.current);
        setIsMockSessionActive(false);
        setIsMockReportActive(true);
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (recognitionRef.current) recognitionRef.current.stop();
        setListeningIdx(null);
        setIsSpeaking(false);

        // Fetch AI Feedback for Mock Report
        setMockReportFeedback(null);
        setIsGeneratingMockReport(true);
        try {
            const qs = mockQuestions.map(q => q.question);
            const ans = mockQuestions.map((_, idx) => mockResponses[idx] || "No answer provided.");
            const response = await interviewAPI.getMockReport(mockConfig.role, mockConfig.difficulty, qs, ans);
            setMockReportFeedback(response.data);
        } catch (error) {
            console.error("Failed to fetch mock report feedback:", error);
        } finally {
            setIsGeneratingMockReport(false);
        }
    };
    
    const submitMockAnswerAndNext = () => {
        if (currentMockQuestionIndex < mockQuestions.length - 1) {
            // Gamification: Update progress
            updateChallengeProgress(1); // Answer 5 questions
            addXP(10, 'Answered mock question');
            
            setCurrentMockQuestionIndex(prev => prev + 1);
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            if (recognitionRef.current) recognitionRef.current.stop();
            setListeningIdx(null);
        } else {
            finishMockInterview();
        }
    };

    const reviewLastMockQuestion = () => {
        if (currentMockQuestionIndex > 0) {
            setCurrentMockQuestionIndex(prev => prev - 1);
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            if (recognitionRef.current) recognitionRef.current.stop();
            setListeningIdx(null);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const renderMockConfig = () => (
        <div className="max-w-4xl mx-auto w-full space-y-12 py-12 animate-slide-up">
            <header className="flex items-center justify-between">
                <button onClick={() => setView('home')} className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div className="text-center">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Mock Interview Setup</h2>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1">Configure your simulation</p>
                </div>
                <div className="w-11 h-11"></div>
            </header>

            <div className="bg-white dark:bg-gray-800 p-12 rounded-[3.5rem] border border-gray-100 dark:border-gray-700 shadow-xl space-y-8">
                <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Target Profile / Role</label>
                    <input
                        type="text"
                        value={mockConfig.role}
                        onChange={(e) => setMockConfig(prev => ({ ...prev, role: e.target.value }))}
                        placeholder="e.g. Software Developer, AI Engineer..."
                        className="w-full p-6 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Difficulty Level</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {['Mixed', 'Basic', 'Intermediate', 'Advanced'].map(diff => (
                            <button
                                key={diff}
                                onClick={() => setMockConfig(prev => ({ ...prev, difficulty: diff }))}
                                className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-wider border-2 transition-all ${mockConfig.difficulty === diff ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-transparent border-gray-100 dark:border-gray-800 text-gray-500 hover:border-indigo-400'}`}
                            >
                                {diff}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Duration (Minutes)</label>
                    <div className="flex items-center gap-4">
                        {[5, 10, 15, 30].map(dur => (
                            <button
                                key={dur}
                                onClick={() => setMockConfig(prev => ({ ...prev, duration: dur }))}
                                className={`w-16 h-16 rounded-full flex items-center justify-center text-sm font-black transition-all ${mockConfig.duration === dur ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-500'}`}
                            >
                                {dur}m
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-8 space-y-4">
                    {/* ── Feature selector ─────────────────────────── */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Live Interview CTA */}
                        <button
                            onClick={startLiveInterview}
                            disabled={!mockConfig.role}
                            className={`group relative overflow-hidden flex flex-col items-center gap-3 py-7 rounded-[1.8rem] font-black transition-all border-2 ${
                                !mockConfig.role
                                    ? 'border-gray-100 dark:border-gray-800 text-gray-300 cursor-not-allowed bg-transparent'
                                    : 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 hover:border-indigo-700 shadow-2xl shadow-indigo-500/30'
                            }`}
                        >
                            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                            <span className="text-2xl">🎥</span>
                            <div className="text-center relative z-10">
                                <p className="text-xs uppercase tracking-[0.2em]">Live Interview</p>
                                <p className="text-[9px] font-medium opacity-70 mt-1 uppercase tracking-widest">Webcam · Voice · Adaptive AI</p>
                            </div>
                        </button>

                        {/* Classic Mode CTA */}
                        <button
                            onClick={startMockInterview}
                            disabled={!mockConfig.role || isGeneratingMock}
                            className={`flex flex-col items-center gap-3 py-7 rounded-[1.8rem] text-xs font-black uppercase tracking-wider border-2 transition-all ${
                                !mockConfig.role || isGeneratingMock
                                    ? 'border-gray-200 dark:border-gray-700 text-gray-300 cursor-not-allowed bg-transparent'
                                    : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-indigo-400 hover:text-indigo-600 bg-transparent'
                            }`}
                        >
                            <span className="text-2xl">📝</span>
                            <div className="text-center">
                                <p className="text-xs uppercase tracking-[0.2em]">Classic Mode</p>
                                <p className="text-[9px] font-medium opacity-70 mt-1 uppercase tracking-widest">{isGeneratingMock ? 'Initializing...' : 'Text-based · Pre-loaded'}</p>
                            </div>
                        </button>
                    </div>

                    <p className="text-center text-[10px] text-gray-400 font-medium">
                        🔥 <strong>Live Interview</strong> simulates a real interview with webcam, adaptive AI questions and voice read-aloud
                    </p>
                </div>
            </div>
        </div>
    );

    const renderMockSession = () => {
        const question = mockQuestions[currentMockQuestionIndex];
        if (!question) return null;

        return (
            <div className="max-w-4xl mx-auto w-full space-y-8 py-8 animate-fade-in">
                <header className="flex items-center justify-between bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Time Remaining</p>
                            <p className="text-xl font-black text-gray-900 dark:text-gray-100">{formatTime(mockDurationLeft)}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Question</p>
                        <p className="text-xl font-black text-indigo-600">{currentMockQuestionIndex + 1} / {mockQuestions.length}</p>
                    </div>
                </header>

                <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl space-y-8">
                    <div className="flex items-start justify-between gap-6">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white leading-relaxed">
                            {question.question}
                        </h3>
                        <div className="flex flex-col items-end gap-2">
                            <button 
                                onClick={() => speakText(question.question)}
                                className={`p-4 rounded-2xl flex-shrink-0 transition-all ${isSpeaking ? 'bg-indigo-600 text-white shadow-lg animate-pulse' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 hover:text-indigo-600'}`}
                                title="Read Question"
                            >
                                🔊
                            </button>
                            <button 
                                onClick={() => setIsAutoReadEnabled(prev => !prev)}
                                className="text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-500 transition-all"
                            >
                                {isAutoReadEnabled ? 'Auto-Read: ON' : 'Auto-Read: OFF'}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <textarea
                            value={mockResponses[currentMockQuestionIndex] || ''}
                            onChange={(e) => setMockResponses(prev => ({ ...prev, [currentMockQuestionIndex]: e.target.value }))}
                            placeholder="Type your answer here, or click 'Start Speaking'..."
                            className="w-full h-48 p-6 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl text-sm leading-relaxed resize-none text-gray-900 dark:text-white focus:border-indigo-500 outline-none transition-all"
                        />
                        <div className="flex items-center justify-between">
                            <button
                                onClick={toggleSpeechRecognitionMock}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${listeningIdx === 'mock' ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse' : 'bg-white dark:bg-gray-800 text-gray-600 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
                            >
                                🎙️ {listeningIdx === 'mock' ? 'Listening...' : 'Start Speaking'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        onClick={reviewLastMockQuestion}
                        disabled={currentMockQuestionIndex === 0}
                        className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${currentMockQuestionIndex === 0 ? 'opacity-50 cursor-not-allowed text-gray-400' : 'bg-white dark:bg-gray-800 text-gray-600 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
                    >
                        ← Previous
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={finishMockInterview}
                            className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-200 hover:bg-red-100 transition-all"
                        >
                            End Early
                        </button>
                        <button
                            onClick={submitMockAnswerAndNext}
                            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
                        >
                            {currentMockQuestionIndex < mockQuestions.length - 1 ? 'Next Question →' : 'Finish Interview'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderMockReport = () => {
        let overallScore = 0;
        if (mockReportFeedback?.question_evaluations) {
            const totalScore = mockReportFeedback.question_evaluations.reduce((acc, curr) => acc + (curr.score || 0), 0);
            overallScore = Math.max(0, Math.round(totalScore / mockQuestions.length));
        }
        const scoreColor = overallScore >= 80 ? 'text-emerald-500' : overallScore >= 50 ? 'text-amber-500' : 'text-rose-500';
        const circumference = 2 * Math.PI * 28;
        const strokeDashoffset = circumference - (overallScore / 100) * circumference;

        return (
            <div className="max-w-4xl mx-auto w-full space-y-12 py-12 animate-slide-up">
                <header className="text-center space-y-4">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Trophy className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Performance Report</h2>
                    <p className="text-gray-500 font-bold text-sm">Mock Interview Completed</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl space-y-6">
                        <div className="flex justify-between items-start">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mt-2">Summary</h3>
                            
                            {mockReportFeedback && mockReportFeedback.question_evaluations && (
                                <div className="relative w-16 h-16 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100 dark:text-gray-700" />
                                        <circle 
                                            cx="32" cy="32" r="28" 
                                            stroke="currentColor" strokeWidth="6" fill="transparent" 
                                            strokeDasharray={circumference} 
                                            strokeDashoffset={strokeDashoffset} 
                                            className={`${scoreColor} transition-all duration-1000 ease-out`} 
                                        />
                                    </svg>
                                    <div className="absolute flex flex-col items-center justify-center">
                                        <span className={`text-sm font-black ${scoreColor}`}>{overallScore}%</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                            <span className="text-xs font-bold text-gray-500 uppercase">Role</span>
                            <span className="text-sm font-black text-slate-800 dark:text-slate-200">{mockConfig.role}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                            <span className="text-xs font-bold text-gray-500 uppercase">Difficulty</span>
                            <span className="text-sm font-black text-slate-800 dark:text-slate-200">{mockConfig.difficulty}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                            <span className="text-xs font-bold text-gray-500 uppercase">Attempted</span>
                            <span className="text-sm font-black text-slate-800 dark:text-slate-200">{Object.keys(mockResponses).filter(k => mockResponses[k].trim().length > 0).length} / {mockQuestions.length}</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                            <span className="text-xs font-bold text-gray-500 uppercase text-rose-500">Unanswered</span>
                            <span className="text-sm font-black text-rose-600">{mockQuestions.length - Object.keys(mockResponses).filter(k => mockResponses[k].trim().length > 0).length}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl space-y-6 relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -right-10 -bottom-10 opacity-10">
                        <Zap className="w-48 h-48" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        {isGeneratingMockReport || !mockReportFeedback ? (
                            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                                <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                <p className="text-sm font-bold text-indigo-200 uppercase tracking-widest text-center">Analyzing Responses...</p>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-4">AI Feedback</h3>
                                <div className="space-y-4 mb-6">
                                    {mockReportFeedback.tips?.length > 0 && (
                                        <div className="bg-white/10 p-4 rounded-2xl">
                                            <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-2">💡 Top Tip</p>
                                            <p className="text-sm font-bold leading-relaxed">{mockReportFeedback.tips[0]}</p>
                                        </div>
                                    )}
                                    {mockReportFeedback.areas_of_improvement?.length > 0 && (
                                        <div className="bg-indigo-900/40 p-4 rounded-2xl">
                                            <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-2">🎯 Focus Area</p>
                                            <p className="text-sm font-bold leading-relaxed">{mockReportFeedback.areas_of_improvement[0]}</p>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => {
                                        setIsMockReportActive(false);
                                        setMockConfig({ role: '', difficulty: 'Mixed', duration: 15 });
                                    }}
                                    className="px-6 py-3 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-lg"
                                >
                                    Start New Interview
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider pl-4">Full Review</h3>
                <div className="space-y-8">
                    {mockQuestions.map((q, idx) => (
                        <div key={idx} className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 flex-shrink-0 bg-gray-100 dark:bg-gray-900 text-gray-500 font-black rounded-lg flex items-center justify-center text-xs mt-1">
                                    Q{idx + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-bold text-gray-900 dark:text-gray-100 mt-1 mb-4">{q.question}</p>
                                    
                                    {mockReportFeedback?.question_evaluations?.[idx] && (
                                        <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl mb-2 w-fit border border-gray-100 dark:border-gray-800">
                                            <div className={`text-2xl font-black ${
                                                mockReportFeedback.question_evaluations[idx].score >= 80 ? 'text-emerald-500' :
                                                mockReportFeedback.question_evaluations[idx].score >= 50 ? 'text-amber-500' : 'text-rose-500'
                                            }`}>
                                                {mockReportFeedback.question_evaluations[idx].score}%
                                            </div>
                                            <div className="text-xs font-bold text-gray-600 dark:text-gray-400 border-l-2 border-gray-200 dark:border-gray-700 pl-4 max-w-sm leading-relaxed">
                                                {mockReportFeedback.question_evaluations[idx].feedback}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="pl-12 space-y-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Your Answer</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl">
                                        {mockResponses[idx] ? mockResponses[idx] : <span className="italic opacity-50">No answer provided.</span>}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Ideal Approach</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                                        {q.suggested_answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <button 
                    onClick={() => {
                        setIsMockReportActive(false);
                        setView('home');
                    }}
                    className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-xl"
                >
                    Close Report & Go Home
                </button>
            </div>
        </div>
        );
    };

    const renderMockVideos = () => (
        <div className="max-w-4xl mx-auto w-full space-y-12 py-12 animate-slide-up">
            <header className="flex items-center justify-between">
                <button onClick={() => setView('home')} className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                    <ArrowLeft className="w-5 h-5 text-gray-400" />
                </button>
                <div className="text-center">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Mock Interview Videos</h2>
                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mt-1">Watch and learn</p>
                </div>
                <div className="w-11 h-11"></div>
            </header>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl space-y-6">
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        value={videoQuery}
                        onChange={(e) => setVideoQuery(e.target.value)}
                        placeholder="Search for mock interviews (e.g. Google Software Engineer mock interview)"
                        className="flex-1 p-5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleFetchVideos()}
                    />
                    <button 
                        onClick={handleFetchVideos}
                        disabled={isLoadingVideos}
                        className={`px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs transition-all ${isLoadingVideos ? 'bg-indigo-400 text-white cursor-wait' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'}`}
                    >
                        {isLoadingVideos ? 'Searching...' : 'Search'}
                    </button>
                </div>

                {videos && videos.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pt-6">
                        {videos.map((vid, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setSelectedVideoId(vid.id)}
                                className="group cursor-pointer bg-gray-50 dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-indigo-500 hover:shadow-xl transition-all"
                            >
                                <div className="relative aspect-video bg-gray-200 dark:bg-gray-800 overflow-hidden">
                                    <img src={vid.thumbnails[0]} alt={vid.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 flex justify-center items-center rounded-lg text-white text-[10px] font-bold">
                                        {vid.duration}
                                    </div>
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all flex items-center justify-center">
                                        <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 space-y-3">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">{vid.title}</h4>
                                    <p className="text-xs font-medium text-gray-500 line-clamp-1">{vid.channel}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedVideoId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm shadow-xl" onClick={() => setSelectedVideoId(null)}>
                    <div className="w-full max-w-5xl aspect-video bg-black rounded-[2rem] overflow-hidden relative border border-gray-800 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setSelectedVideoId(null)}
                            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black text-white rounded-full flex items-center justify-center transition-all"
                        >
                            ✕
                        </button>
                        <iframe 
                            src={`https://www.youtube.com/embed/${selectedVideoId}?autoplay=1`}
                            className="w-full h-full"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}
        </div>
    );

    const renderMockInterview = () => {
        if (isLiveSessionActive) return (
            <LiveInterviewSession
                mockConfig={mockConfig}
                company={company}
                onFinish={handleLiveFinish}
                onCancel={() => setIsLiveSessionActive(false)}
            />
        );
        if (isMockReportActive) return renderMockReport();
        if (isMockSessionActive) return renderMockSession();
        
        return (
            <div className="space-y-4">
                <div className="flex justify-center p-2 bg-gray-100 dark:bg-gray-800 rounded-2xl w-fit mx-auto mt-6">
                    <button 
                        onClick={() => setMockTab('setup')} 
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mockTab === 'setup' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Setup Session
                    </button>
                    <button 
                        onClick={() => setMockTab('videos')} 
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mockTab === 'videos' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Watch Videos
                    </button>
                </div>
                {mockTab === 'setup' ? renderMockConfig() : renderMockVideos()}
            </div>
        );
    };


    const renderHome = () => (
        <div className="max-w-6xl mx-auto w-full space-y-12 py-12 animate-slide-up">
            <header className="text-center space-y-4">
                <h1 className="text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                    Interview <span className="text-blue-600">Mastery</span>
                </h1>
                <p className="text-gray-500 font-bold text-lg uppercase tracking-widest">Select your preparation mode</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Question Bank Card */}
                {/* Question Bank removed as requested */}

                {/* Mock Interview Card */}
                <div 
                    onClick={() => setView('mock_interview')}
                    className="group relative bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl hover:shadow-2xl transition-all cursor-pointer overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Terminal className="w-32 h-32 text-indigo-600" />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                            <Terminal className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase">Mock Interview</h3>
                            <p className="text-gray-500 text-sm mt-2 font-medium">Strict, timed simulation of a real interview process. No hints allowed.</p>
                        </div>
                        <div className="flex items-center text-indigo-600 font-black text-xs uppercase tracking-widest gap-2">
                            <span>Start Simulation</span>
                            <ChevronRight className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                {/* Gamification Card */}
                <div 
                    onClick={() => setView('gamification')}
                    className="group relative p-8 rounded-[3rem] shadow-xl hover:shadow-2xl transition-all cursor-pointer overflow-hidden bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-500 hover:from-purple-500 hover:via-fuchsia-500 hover:to-pink-400"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-15 group-hover:opacity-25 transition-opacity">
                        <Trophy className="w-36 h-36 text-white" />
                    </div>
                    <div className="absolute -bottom-8 -left-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Award className="w-40 h-40 text-white" />
                    </div>
                    <div className="absolute top-12 left-1/2 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <div className="relative z-10 space-y-6">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-2 ring-white/20 group-hover:ring-white/40 transition-all shadow-lg">
                            <span className="text-3xl">🎮</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Gamification</h3>
                            <p className="text-white/80 text-sm mt-2 font-medium">Level up, earn XP, unlock badges & crush daily challenges. Your career journey, gamified.</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center text-white font-black text-xs uppercase tracking-widest gap-2 group-hover:gap-3 transition-all">
                                <span>Play Now</span>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                            <div className="flex -space-x-1">
                                <span className="text-lg">🔥</span>
                                <span className="text-lg">⚡</span>
                                <span className="text-lg">🏆</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-blue-600 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
                <div className="absolute -right-20 -bottom-20 opacity-10">
                    <Zap className="w-96 h-96" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <Star className="w-3 h-3 fill-current" />
                            <span>Daily Goal</span>
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tight">Your Current Streak: {streak} Days</h2>
                        <p className="text-blue-100 font-medium">Prepare consistently to improve your selection probability significantly.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full space-y-6 p-6 overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-gray-900/10">

            {view === 'home' && renderHome()}

            {view === 'question_bank' && (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                    <span className="text-6xl">🛠️</span>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Feature Unavailable</h2>
                    <p className="text-gray-500 font-medium text-center max-w-md">The Question Bank has been removed. Please use the Mock Interview for preparation.</p>
                    <button onClick={() => setView('home')} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition-all">Back to Home</button>
                </div>
            )}

            {view === 'mock_interview' && renderMockInterview()}
            {view === 'gamification' && <GamificationDashboard onBack={() => setView('home')} onPlay={(level) => { setArenaLevel(level); setView('arena'); }} />}
            {view === 'arena' && <ArenaGame levelConfig={arenaLevel} onExit={() => setView('gamification')} />}
        </div>
    );
};

// Helper icon
const MedalIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
    <path d="M11 12 5.12 2.2" />
    <path d="m13 12 5.88-9.8" />
    <path d="M8 7h8" />
    <circle cx="12" cy="17" r="5" />
    <path d="M12 18v-2h-.5" />
  </svg>
);

const Flame = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
);

export default InterviewAgentUI;
