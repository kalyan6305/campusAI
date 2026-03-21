import React, { useState, useRef } from 'react';
import { interviewAPI } from '../../services/api';

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
    // Stage: 'selection' | 'analysis' | 'topics' | 'questions' | 'results' | 'round_summary'
    const [stage, setStage] = useState('selection');
    const [role, setRole] = useState('Software Developer');
    const [company, setCompany] = useState('Generic');
    const [questions, setQuestions] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [listeningIdx, setListeningIdx] = useState(null);
    const recognitionRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratingMore, setIsGeneratingMore] = useState(false);
    const [doubtQuery, setDoubtQuery] = useState('');
    const [doubtResponse, setDoubtResponse] = useState(null);
    const [studyQAs, setStudyQAs] = useState([]);
    const [isGeneratingStudy, setIsGeneratingStudy] = useState(false);
    const [isClarifying, setIsClarifying] = useState(false);
    const [activeTab, setActiveTab] = useState('practice');
    const [activeDoubtQuestion, setActiveDoubtQuestion] = useState(null);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const [experience, setExperience] = useState('2-5 years');
    const [userType, setUserType] = useState('Student');
    const [allRoundResults, setAllRoundResults] = useState([]);
    const [finalReport, setFinalReport] = useState(null);
    const [isPredictingRounds, setIsPredictingRounds] = useState(false);
    const [predictedRounds, setPredictedRounds] = useState([]);
    const [customCompany, setCustomCompany] = useState('');
    const [customRole, setCustomRole] = useState('');
    const [customExperience, setCustomExperience] = useState('');
    const [experienceYears, setExperienceYears] = useState(2);
    const [experienceLevel, setExperienceLevel] = useState('Intermediate');
    const [selectedRound, setSelectedRound] = useState(null);
    const [practiseAllRounds, setPractiseAllRounds] = useState(false);
    
    // NEW STATES for the improved flow
    const [selectedTopic, setSelectedTopic] = useState("All topics");
    const [roundTopics, setRoundTopics] = useState([]);
    const [analysisStep, setAnalysisStep] = useState(0);
    const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
    const [isMCQMode, setIsMCQMode] = useState(false);
    const [sessionStreak, setSessionStreak] = useState(0);
    const [topicPerformance, setTopicPerformance] = useState({});
    const [mcqResults, setMcqResults] = useState([]);
    const [teachMeCache, setTeachMeCache] = useState({});

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

    const handleGenerate = async (roundIdx = 0, isAppend = false) => {
        const rounds = getRounds();
        const rName = rounds[roundIdx];
        const isAptitude = isAptitudeRound(rName);
        setIsMCQMode(isAptitude);

        // Transition to Analysis Screen
        setStage('analysis');
        setAnalysisStep(0);
        
        // Parallel work: Fetch topics while animating steps
        const stepTimer = setInterval(() => {
            setAnalysisStep(prev => prev < 4 ? prev + 1 : prev);
        }, 750);

        try {
            const res = await interviewAPI.getRoundTopics(company, rName, role);
            setRoundTopics(res.data?.topics || res.data || []);
            
            clearInterval(stepTimer);
            setAnalysisStep(4);
            setTimeout(() => {
                setStage('topics');
                setCurrentRoundIndex(roundIdx);
            }, 500);
        } catch (e) {
            console.error("Failed to fetch topics", e);
            setRoundTopics(["General", "Core Concepts", "Implementation"]);
            clearInterval(stepTimer);
            setAnalysisStep(4);
            setTimeout(() => setStage('topics'), 500);
        }
    };

    const startPractice = async (topic = "All topics") => {
        setSelectedTopic(topic);
        setIsGenerating(true);
        setQuestions([]);
        setStage('questions');
        setActiveTab('practice');

        const rounds = getRounds();
        const rName = rounds[currentRoundIndex];
        const companyData = (COMPANY_ROUNDS[company.toLowerCase()] || COMPANY_ROUNDS.other);
        const actualRound = companyData.rounds.find(r => r.name === rName) || companyData.rounds[0];

        try {
            let res;
            if (isMCQMode) {
                res = await interviewAPI.generateMCQ(company, rName, role, topic === "All topics" ? null : topic, 10);
                setQuestions(res.data || []);
            } else {
                res = await interviewAPI.generate(
                    role, 
                    actualRound.id || 'tech', 
                    company, 
                    rName, 
                    experienceLevel, 
                    [], 
                    userType, 
                    experienceYears, 
                    10, 
                    topic === "All topics" ? null : topic
                );
                // Ensure questions is an array
                const qList = res.data.questions || res.data || [];
                setQuestions(qList.map(q => ({ ...q, isSubmitted: false, userAnswer: "", feedback: null })));
            }
        } catch (e) {
            console.error("Generation failed", e);
            alert("Failed to generate questions. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const loadMoreQuestions = async () => {
        setIsGeneratingMore(true);
        const rounds = getRounds();
        const rName = rounds[currentRoundIndex];
        const companyData = (COMPANY_ROUNDS[company.toLowerCase()] || COMPANY_ROUNDS.other);
        const actualRound = companyData.rounds.find(r => r.name === rName) || companyData.rounds[0];

        try {
            let res;
            if (isMCQMode) {
                res = await interviewAPI.generateMCQ(company, rName, role, selectedTopic === "All topics" ? null : selectedTopic, 10);
                setQuestions(prev => [...prev, ...(res.data || [])]);
            } else {
                res = await interviewAPI.generate(
                    role, 
                    actualRound.id || 'tech', 
                    company, 
                    rName, 
                    experienceLevel, 
                    questions.map(q => q.question),
                    userType, 
                    experienceYears, 
                    10, 
                    selectedTopic === "All topics" ? null : selectedTopic
                );
                const qList = res.data.questions || res.data || [];
                setQuestions(prev => [...prev, ...qList.map(q => ({ ...q, isSubmitted: false, userAnswer: "", feedback: null }))]);
            }
        } catch (e) {
            console.error("Failed to load more questions", e);
            alert("Failed to load more questions. Please try again.");
        } finally {
            setIsGeneratingMore(false);
        }
    };

    const generateStudyMaterial = async () => {
        setIsGeneratingStudy(true);
        const rounds = getRounds();
        const rName = rounds[currentRoundIndex];
        const companyData = (COMPANY_ROUNDS[company.toLowerCase()] || COMPANY_ROUNDS.other);
        const actualRound = companyData.rounds.find(r => r.name === rName) || companyData.rounds[0];

        try {
            let res;
            if (isMCQMode) {
                res = await interviewAPI.generateMCQ(company, rName, role, selectedTopic === "All topics" ? null : selectedTopic, 10);
                setStudyQAs(res.data || []);
            } else {
                res = await interviewAPI.generate(
                    role, 
                    actualRound.id || 'tech', 
                    company, 
                    rName, 
                    experienceLevel, 
                    [], 
                    userType, 
                    experienceYears, 
                    10, 
                    selectedTopic === "All topics" ? null : selectedTopic
                );
                const qList = res.data.questions || res.data || [];
                setStudyQAs(qList);
            }
        } catch (e) {
            console.error("Study generation failed", e);
            alert("Failed to generate study Q&As. Please try again.");
        } finally {
            setIsGeneratingStudy(false);
        }
    };

    const loadMoreStudyQuestions = async () => {
        setIsGeneratingStudy(true);
        const rounds = getRounds();
        const rName = rounds[currentRoundIndex];
        const companyData = (COMPANY_ROUNDS[company.toLowerCase()] || COMPANY_ROUNDS.other);
        const actualRound = companyData.rounds.find(r => r.name === rName) || companyData.rounds[0];

        try {
            let res;
            if (isMCQMode) {
                res = await interviewAPI.generateMCQ(company, rName, role, selectedTopic === "All topics" ? null : selectedTopic, 10, studyQAs.map(q => q.question));
                setStudyQAs(prev => [...prev, ...(res.data || [])]);
            } else {
                res = await interviewAPI.generate(
                    role, 
                    actualRound.id || 'tech', 
                    company, 
                    rName, 
                    experienceLevel, 
                    studyQAs.map(q => q.question),
                    userType, 
                    experienceYears, 
                    10, 
                    selectedTopic === "All topics" ? null : selectedTopic
                );
                const qList = res.data.questions || res.data || [];
                setStudyQAs(prev => [...prev, ...qList]);
            }
        } catch (e) {
            console.error("Failed to load more study questions", e);
            alert("Failed to load more questions. Please try again.");
        } finally {
            setIsGeneratingStudy(false);
        }
    };

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
        setStage('selection');
        setRole('Software Developer');
        setCompany('Generic');
        setQuestions([]);
        setSuggestions([]);
        setAllRoundResults([]);
        setFinalReport(null);
        setCurrentRoundIndex(0);
        setSessionStreak(0);
        setTopicPerformance({});
        setMcqResults([]);
    };

    return (
        <div className="flex flex-col h-full space-y-6 p-6 overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-gray-900/10">
            {stage === 'analysis' && (
                <div className="max-w-4xl mx-auto w-full py-20 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 p-12 rounded-[4rem] border border-gray-100 dark:border-gray-700 shadow-2xl text-center space-y-12">
                        <div className="relative w-32 h-32 mx-auto">
                            <div className="absolute inset-0 border-8 border-blue-50 dark:border-blue-900/30 rounded-full"></div>
                            <div className={`absolute inset-0 border-8 border-blue-600 rounded-full border-t-transparent animate-spin`}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-3xl">
                                {analysisStep === 0 && "🔍"}
                                {analysisStep === 1 && "📋"}
                                {analysisStep === 2 && "💻"}
                                {analysisStep === 3 && "🚀"}
                                {analysisStep === 4 && "✅"}
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Synthesizing Your Interview</h3>
                            <div className="flex flex-col gap-3 max-w-sm mx-auto">
                                {[
                                    { id: 1, text: "Analyzing job requirements" },
                                    { id: 2, text: `Researching ${company}'s culture` },
                                    { id: 3, text: "Curating industry-standard questions" },
                                    { id: 4, text: "Preparing technical assessment" }
                                ].map(step => (
                                    <div key={step.id} className={`flex items-center gap-4 text-left transition-all duration-500 ${analysisStep >= step.id ? 'opacity-100 translate-x-0' : 'opacity-20 translate-x-4'}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${analysisStep >= step.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            {analysisStep >= step.id ? "✓" : step.id}
                                        </div>
                                        <span className={`text-sm font-bold ${analysisStep >= step.id ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                            {step.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {stage === 'topics' && (
                <div className="max-w-4xl mx-auto w-full space-y-10 animate-slide-up py-10">
                    <div className="flex bg-white dark:bg-gray-800 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl items-center justify-between mb-8">
                        <div className="flex items-center gap-6">
                            <button onClick={reset} className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white transition-all">
                                <span className="text-xl">←</span>
                            </button>
                            <div className="text-left">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{company} {getRounds()[currentRoundIndex]}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{role} • Preparation</p>
                            </div>
                        </div>
                        <div className="text-right">
                           <div className="inline-block px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em]">Strategy Finalized</div>
                        </div>
                    </div>

                    <header className="text-center space-y-4">
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Pick Your Focus Area</h2>
                        <p className="text-gray-500 font-bold text-sm">Select a topic to start practicing specific questions</p>
                    </header>

                    <div className="bg-white dark:bg-gray-800 p-12 rounded-[4rem] border border-gray-100 dark:border-gray-700 shadow-2xl space-y-10">
                        <div className="flex flex-wrap gap-4 justify-center">
                            {["All topics", ...roundTopics].map(topic => (
                                <button
                                    key={topic}
                                    onClick={() => setSelectedTopic(topic)}
                                    className={`px-8 py-4 rounded-3xl text-sm font-black uppercase tracking-wider transition-all border-2 ${
                                        selectedTopic === topic 
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/30 scale-105' 
                                        : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 hover:border-blue-400'
                                    }`}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                        
                        <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                            <button 
                                onClick={() => startPractice(selectedTopic)}
                                className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:shadow-2xl transition-all"
                            >
                                Start Training Session
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {stage === 'selection' && (
                <div className="max-w-4xl mx-auto w-full space-y-8 animate-slide-up">
                    <header className="text-center">
                        <div className="max-w-6xl mx-auto w-full space-y-12 pb-20">
                            <div className="text-center space-y-6 py-12">
                                <div className="inline-block p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full animate-bounce-slow">
                                    <span className="text-4xl text-indigo-600">🎯</span>
                                </div>
                                <h2 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Interview Preparation</h2>
                                <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">Master your next interview with role-specific questions and expert feedback.</p>
                            </div>
                        </div>
                    </header>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-6">Step 1: Target Role</h3>
                            <div className="space-y-4">
                                {role === 'Other' ? (
                                    <input
                                        type="text"
                                        value={customRole}
                                        onChange={(e) => setCustomRole(e.target.value)}
                                        placeholder="Type your role (e.g. ASIC Designer)"
                                        className="w-full p-4 bg-blue-50/50 dark:bg-blue-900/10 border-2 border-blue-500 rounded-2xl text-sm font-black text-gray-900 dark:text-gray-100 outline-none transition-all"
                                    />
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {['Data Scientist', 'AI Engineer', 'Software Developer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Machine Learning Engineer', 'Product Manager'].map((r) => (
                                            <button key={r} onClick={() => setRole(r)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${role === r ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 hover:border-blue-400'}`}>
                                                {r}
                                            </button>
                                        ))}
                                        <button onClick={() => setRole('Other')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${role === 'Other' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-500 hover:border-blue-400'}`}>Other</button>
                                    </div>
                                )}
                                {role === 'Other' && <button onClick={() => setRole('')} className="text-[10px] font-black text-gray-400 uppercase">← Select from list</button>}
                            </div>
                        </div>

                        <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-6">Step 2: Target Company</h3>
                            <div className="space-y-3">
                                {company === 'Other' ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={customCompany}
                                            onChange={(e) => setCustomCompany(e.target.value)}
                                            placeholder="Type company (e.g. Accenture)"
                                            className="w-full p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-2 border-indigo-500 rounded-2xl text-sm font-black text-gray-900 dark:text-gray-100 outline-none transition-all"
                                        />
                                        <button 
                                            onClick={handlePredictRounds}
                                            disabled={isPredictingRounds || !customCompany}
                                            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                        >
                                            {isPredictingRounds ? 'Detecting Rounds...' : 'Detect Process'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Google', 'Amazon', 'Microsoft', 'TCS', 'Infosys', 'Generic'].map((c) => (
                                            <button key={c} onClick={() => setCompany(c)} className={`p-3 rounded-xl text-center text-[10px] font-black uppercase transition-all border ${company === c ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-indigo-300'}`}>
                                                {c}
                                            </button>
                                        ))}
                                        <button onClick={() => setCompany('Other')} className={`p-3 rounded-xl text-center text-[10px] font-black uppercase transition-all border ${company === 'Other' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-indigo-300'}`}>Other</button>
                                    </div>
                                )}
                                {company === 'Other' && <button onClick={() => setCompany('Generic')} className="text-[10px] font-black text-gray-400 uppercase">← Select from list</button>}
                            </div>
                        </div>

                        <div className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                                        {company ? `Step 3: ${company} rounds` : "Step 3: Select a company first"}
                                        {predictedRounds.length > 0 && <span className="ml-2 text-emerald-500 lowercase font-bold tracking-normal italic">(AI Generated)</span>}
                                    </h3>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2">Select the round you want to practise</p>
                                </div>
                                {company && (
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase">
                                            {getRounds().length} Rounds
                                        </span>
                                        {predictedRounds.length > 0 && (
                                            <button 
                                                onClick={() => { setPredictedRounds([]); setSelectedRound(null); }}
                                                className="text-[8px] font-black text-rose-500 uppercase hover:underline"
                                            >
                                                Reset to Default
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 mb-8">
                                {(predictedRounds.length > 0 ? mapPredictedToRoundObjects(predictedRounds) : (COMPANY_ROUNDS[company.toLowerCase()] || COMPANY_ROUNDS.other).rounds).map((r, idx) => (
                                    <button
                                        key={r.id}
                                        onClick={() => { setSelectedRound(r); setPractiseAllRounds(false); setCurrentRoundIndex(idx); }}
                                        className={`w-full p-4 rounded-2xl text-left transition-all border flex items-center gap-4 ${
                                            selectedRound?.id === r.id 
                                            ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-500 ring-1 ring-blue-500' 
                                            : 'bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700 hover:border-blue-300'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                            selectedRound?.id === r.id ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'
                                        }`}>
                                            {r.num}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-black text-gray-900 dark:text-white leading-none mb-2">{r.name}</div>
                                            <div className="text-[11px] font-bold text-gray-500 leading-relaxed whitespace-normal">{r.desc}</div>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[8px] font-black uppercase ${
                                            r.difficulty === 'Hard' ? 'bg-rose-100 text-rose-600' : 
                                            r.difficulty === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                                        }`}>
                                            {r.difficulty}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button 
                                    onClick={() => { setPractiseAllRounds(true); setSelectedRound(null); setCurrentRoundIndex(0); }}
                                    className={`p-4 rounded-2xl border text-[9px] font-black uppercase tracking-[0.15em] transition-all ${practiseAllRounds ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-blue-400'}`}
                                >
                                    Practise all rounds in sequence
                                </button>
                                <button 
                                    onClick={() => { 
                                        setPractiseAllRounds(false); 
                                        const rds = (predictedRounds.length > 0 ? mapPredictedToRoundObjects(predictedRounds) : (COMPANY_ROUNDS[company.toLowerCase()] || COMPANY_ROUNDS.other).rounds);
                                        const techIdx = rds.findIndex(round => round.type === 'technical');
                                        if (techIdx !== -1) {
                                            setSelectedRound(rds[techIdx]);
                                            setCurrentRoundIndex(techIdx);
                                        }
                                    }}
                                    className="p-4 rounded-2xl border bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-blue-400 text-[9px] font-black uppercase tracking-[0.15em]"
                                >
                                    Start from my weakest area
                                </button>
                            </div>

                            {(COMPANY_ROUNDS[company.toLowerCase()]?.tip || predictedRounds.length > 0) && (
                                <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl mb-8">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-xl">💡</span>
                                        <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Company Strategy Tip</h4>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium leading-relaxed italic">
                                        {predictedRounds.length > 0 
                                            ? `Focusing on ${role} specific challenges as predicted by AI based on latest industry trends.`
                                            : COMPANY_ROUNDS[company.toLowerCase()]?.tip
                                        }
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={() => handleGenerate(currentRoundIndex)}
                                disabled={isGenerating || !role}
                                className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl ${isGenerating || !role ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'}`}
                            >
                                {isGenerating ? 'Configuring Interview Rounds...' : `Start ${company} Interview Simulation`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {stage === 'questions' && !isMCQMode && (
                <div className="max-w-6xl mx-auto w-full space-y-8 animate-slide-up pb-20">
                    <div className="flex bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-fit mx-auto sticky top-4 z-40">
                        {['practice', 'study', 'teach', 'progress', 'doubt'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                    : 'text-gray-400 hover:text-blue-600'
                                }`}
                            >
                                {tab === 'teach' ? 'Teach Me' : tab}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'practice' && (
                        <div className="space-y-8">
                            <header className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{company} Interview</h3>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Round {currentRoundIndex + 1}: {getRounds()[currentRoundIndex]} • {selectedTopic}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setStage('topics')} className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-500 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                                        Back to Topics
                                    </button>
                                    <button onClick={() => startPractice(selectedTopic)} disabled={isGenerating} className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:border-blue-500 shadow-sm">
                                        {isGenerating ? 'Loading...' : 'Refresh Questions'}
                                    </button>
                                    <button onClick={handleStudyRound} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20">
                                        {currentRoundIndex < getRounds().length - 1 ? 'Next Round' : 'Finish & View Report'}
                                    </button>
                                </div>
                            </header>

                            <div className="space-y-6">
                                {questions.map((q, idx) => (
                                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden group">
                                        <div className="p-1 w-full bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-50 px-8 py-4 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Question {idx + 1}</span>
                                            <button onClick={() => { setActiveTab('doubt'); setActiveDoubtQuestion(q); setDoubtResponse(null); setDoubtQuery(''); }} className="text-[10px] font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors flex items-center gap-1">
                                                <span>Ask a Doubt</span>
                                            </button>
                                        </div>
                                        <div className="p-8 space-y-6">
                                            <h4 className="text-xl font-bold text-gray-900 dark:text-white leading-relaxed">{q.question}</h4>
                                            
                                            {!q.isSubmitted ? (
                                                <div className="space-y-4">
                                                    <div className="relative">
                                                        <textarea 
                                                            className="w-full p-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 pb-14"
                                                            placeholder="Type or dictate your answer here..."
                                                            rows={4}
                                                            value={q.userAnswer || ''}
                                                            onChange={(e) => {
                                                                const newQs = [...questions];
                                                                newQs[idx].userAnswer = e.target.value;
                                                                setQuestions(newQs);
                                                            }}
                                                        />
                                                        <button 
                                                            onClick={() => toggleListening(idx)}
                                                            className={`absolute bottom-4 right-4 p-3 rounded-xl transition-all shadow-md ${listeningIdx === idx ? 'bg-red-500 text-white animate-pulse' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-blue-600 hover:border-blue-300'}`}
                                                            title={listeningIdx === idx ? "Stop Dictation" : "Start Dictation"}
                                                        >
                                                            {listeningIdx === idx ? '🛑 Recording...' : '🎤 Dictate Answer'}
                                                        </button>
                                                    </div>
                                                    <button 
                                                        onClick={async () => {
                                                            const newQs = [...questions];
                                                            newQs[idx].isSubmitting = true;
                                                            setQuestions(newQs);
                                                            
                                                            try {
                                                                const res = await interviewAPI.analyzeAnswer(role, q.question, q.userAnswer || '');
                                                                const updatedQs = [...questions];
                                                                updatedQs[idx].feedback = res.data;
                                                                updatedQs[idx].isSubmitted = true;
                                                                updatedQs[idx].isSubmitting = false;
                                                                setQuestions(updatedQs);

                                                                // Progress Tracking
                                                                const score = res.data.scores?.overall || 0;
                                                                if (score >= 60) setSessionStreak(s => s + 1);
                                                                else setSessionStreak(0);
                                                                
                                                                setTopicPerformance(prev => {
                                                                    const t = q.topic || selectedTopic || 'General';
                                                                    return {
                                                                        ...prev,
                                                                        [t]: {
                                                                            attempted: (prev[t]?.attempted || 0) + 1,
                                                                            correct: (prev[t]?.correct || 0) + (score >= 60 ? 1 : 0)
                                                                        }
                                                                    };
                                                                });
                                                            } catch (e) {
                                                                console.error("Analysis failed", e);
                                                            }
                                                        }}
                                                        disabled={!q.userAnswer?.trim() || q.isSubmitting}
                                                        className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                                                    >
                                                        {q.isSubmitting ? 'Evaluating...' : 'Submit Answer'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-6 animate-fade-in">
                                                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                                                        <h5 className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-2">Interviewer Feedback • {q.feedback?.scores?.overall}%</h5>
                                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">"{q.feedback?.interviewer_reaction}"</p>
                                                    </div>
                                                    
                                                    <div className="p-6 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                                                        <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">Expert Model Answer</h5>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium italic">"{q.suggested_answer}"</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex justify-center pt-4">
                                <button 
                                    onClick={loadMoreQuestions} 
                                    disabled={isGeneratingMore}
                                    className="px-8 py-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400 font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] transition-all border border-blue-100 dark:border-blue-900/30 w-full max-w-sm"
                                >
                                    {isGeneratingMore ? 'Loading Additional Questions...' : 'Load 10 More Questions'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'study' && (
                        <div className="space-y-8">
                            <header className="flex justify-between items-end">
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Top Q&A Study Material</h3>
                                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Review expert answers to master {selectedTopic}</p>
                                </div>
                                <button 
                                    onClick={generateStudyMaterial} 
                                    disabled={isGeneratingStudy}
                                    className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:border-blue-500 shadow-sm"
                                >
                                    {isGeneratingStudy ? 'Loading Q&As...' : (studyQAs.length === 0 ? 'Generate Study Material' : 'Refresh Q&As')}
                                </button>
                            </header>

                            {studyQAs.length === 0 && !isGeneratingStudy && (
                                <div className="p-12 text-center bg-gray-50/50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem]">
                                    <span className="text-4xl block mb-4">📚</span>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Ready to Study?</h4>
                                    <p className="text-gray-500 text-sm">Click the button above to generate top interview questions and their expert answers for this topic.</p>
                                </div>
                            )}

                            <div className="space-y-6">
                                {studyQAs.map((qa, idx) => (
                                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden group p-8 space-y-6">
                                        <div className="flex gap-4">
                                            <span className="w-8 h-8 shrink-0 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">Q{idx + 1}</span>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-relaxed pt-1">{qa.question}</h4>
                                        </div>
                                        <div className="pl-12 space-y-4">
                                            <div className="p-5 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                                                <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">Expert Model Answer</h5>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium italic">"{qa.suggested_answer}"</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {studyQAs.length > 0 && (
                                <div className="flex justify-center pt-4">
                                    <button 
                                        onClick={loadMoreStudyQuestions} 
                                        disabled={isGeneratingStudy}
                                        className="px-8 py-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400 font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] transition-all border border-blue-100 dark:border-blue-900/30 w-full max-w-sm"
                                    >
                                        {isGeneratingStudy ? 'Loading Additional Q&As...' : 'Load 10 More Questions'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'teach' && (
                        <div className="space-y-10">
                            <header className="text-center space-y-2">
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Learn before you practise</h3>
                                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Master each topic the way {company} tests it</p>
                            </header>

                            <div className="grid grid-cols-1 gap-6">
                                {roundTopics.map((topic, idx) => {
                                    const lesson = teachMeCache[topic];
                                    return (
                                        <div key={idx} className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
                                            <div className="flex items-center justify-between p-8 bg-gray-50/30 dark:bg-gray-900/10">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl">L</div>
                                                    <div>
                                                        <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">{topic}</h4>
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-black uppercase">{getRounds()[currentRoundIndex]}</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={async () => {
                                                        if (lesson) return;
                                                        setTeachMeCache({ ...teachMeCache, [topic]: { loading: true } });
                                                        try {
                                                            const res = await interviewAPI.teachTopic(company, role, getRounds()[currentRoundIndex], topic);
                                                            setTeachMeCache(prev => ({ ...prev, [topic]: res.data }));
                                                        } catch (e) {
                                                            setTeachMeCache(prev => ({ ...prev, [topic]: { error: true } }));
                                                        }
                                                    }}
                                                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        lesson ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700'
                                                    }`}
                                                >
                                                    {lesson?.loading ? 'Preparing lesson...' : lesson ? 'Topic Learned' : 'Learn this topic'}
                                                </button>
                                            </div>

                                            {lesson && !lesson.loading && !lesson.error && (
                                                <div className="p-10 space-y-10 animate-fade-in border-t border-gray-50 dark:border-gray-700">
                                                    <div className="space-y-4">
                                                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300 leading-relaxed">{lesson.what_it_is}</p>
                                                        <div className="p-6 bg-amber-50/50 border border-amber-100 rounded-2xl">
                                                            <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Why {company} values this</h5>
                                                            <p className="text-sm text-gray-800 font-bold">{lesson.why_it_matters_at_company}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                                        {lesson.core_concepts?.map((c, i) => (
                                                            <div key={i} className="p-6 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                                                                <h6 className="text-sm font-black text-blue-600 uppercase">{c.concept}</h6>
                                                                <p className="text-xs text-gray-600 leading-normal">{c.explanation}</p>
                                                                <p className="text-xs font-bold text-gray-400 italic">Example: {c.example}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                        <div className="space-y-4">
                                                            <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Shortcuts & Patterns</h5>
                                                            <ul className="space-y-2">
                                                                {lesson.patterns_and_tricks?.map((t, i) => <li key={i} className="text-xs font-bold flex gap-3 text-gray-700"><span className="text-emerald-500">⚡</span> {t}</li>)}
                                                            </ul>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <h5 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Watch out for</h5>
                                                            <ul className="space-y-2">
                                                                {lesson.common_mistakes?.map((m, i) => <li key={i} className="text-xs font-bold flex gap-3 text-gray-700"><span className="text-rose-500">⚠</span> {m}</li>)}
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    <div className="p-8 bg-gray-900 rounded-[2rem] text-left">
                                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Example question at {company}</h5>
                                                        <p className="text-lg font-black text-white italic">"{lesson.sample_question}"</p>
                                                    </div>

                                                    <div className="flex flex-col items-center gap-6 pt-6">
                                                        <div className="text-center px-10 py-6 border-2 border-dashed border-gray-100 rounded-3xl">
                                                            <p className="text-xl font-serif italic text-gray-600">"{lesson.one_liner_to_remember}"</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => { setSelectedTopic(topic); setActiveTab('practice'); }}
                                                            className="px-12 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl"
                                                        >
                                                            Practise this topic now
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'progress' && (
                        <div className="space-y-12 animate-fade-in">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: "Questions Answered", val: questions.length + (isMCQMode ? mcqResults.length : 0), icon: "📝" },
                                    { label: "Overall Accuracy", val: `${Math.round((mcqResults.filter(r => r.correct).length / (mcqResults.length || 1)) * 100)}%`, icon: "🎯" },
                                    { label: "Current Streak", val: `🔥 ${sessionStreak}`, icon: "⚡" },
                                    { label: "Rounds Finished", val: allRoundResults.length, icon: "🏁" }
                                ].map((m, i) => (
                                    <div key={i} className="p-8 bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm text-center space-y-2">
                                        <span className="text-3xl block">{m.icon}</span>
                                        <span className="text-2xl font-black text-gray-900 dark:text-white">{m.val}</span>
                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{m.label}</h5>
                                    </div>
                                ))}
                            </div>

                            <div className="p-10 bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl space-y-10">
                                <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Your strengths & gaps</h4>
                                <div className="space-y-6">
                                    {Object.entries(getRunningAverages()).map(([dim, score]) => (
                                        <div key={dim} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{dim.replace('_', ' ')}</span>
                                                <span className="text-sm font-black text-gray-900 dark:text-white">{score}%</span>
                                            </div>
                                            <div className="h-4 bg-gray-50 dark:bg-gray-900 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${score >= 70 ? 'bg-emerald-500 shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)]' : score >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                                    style={{ width: `${score}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {Object.keys(topicPerformance).length > 1 && (
                                <div className="p-10 bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl space-y-8">
                                    <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight text-left">Topic breakdown</h4>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-gray-50 dark:border-gray-700">
                                                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Topic</th>
                                                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Questions</th>
                                                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Accuracy</th>
                                                    <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                                {Object.entries(topicPerformance)
                                                    .sort((a, b) => (a[1].correct / a[1].attempted) - (b[1].correct / b[1].attempted))
                                                    .map(([topic, stats]) => (
                                                        <tr key={topic}>
                                                            <td className="py-5 font-bold text-sm">{topic}</td>
                                                            <td className="py-5 text-center font-black text-gray-400 text-xs">{stats.attempted}</td>
                                                            <td className="py-5 text-center">
                                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black ${
                                                                    (stats.correct / stats.attempted) >= 0.7 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                                }`}>
                                                                    {Math.round((stats.correct / stats.attempted) * 100)}%
                                                                </span>
                                                            </td>
                                                            <td className="py-5 text-right">
                                                                <button 
                                                                    onClick={() => handleDrill(topic)}
                                                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"
                                                                >
                                                                    Drill Topic
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {allRoundResults.length > 0 && (
                                <div className="p-10 bg-white dark:bg-gray-800 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl space-y-6">
                                    <h4 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight text-left">Round history</h4>
                                    <div className="space-y-4">
                                        {allRoundResults.map((r, i) => (
                                            <div key={i} className="flex items-center justify-between p-6 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 rounded-[2rem]">
                                                <div>
                                                    <h5 className="font-black text-gray-900 dark:text-white">{r.round}</h5>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score: {r.score}%</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[8px] font-black uppercase">Strong: Depth</div>
                                                    <div className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-[8px] font-black uppercase">Weak: Edge Cases</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'doubt' && (
                        <div className="max-w-4xl mx-auto w-full space-y-10 animate-fade-in">
                            <header className="text-center space-y-2">
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Ask Doubt</h3>
                                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest italic">Clarify your queries with our expert mentor</p>
                            </header>

                            <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-xl space-y-10">
                                {activeDoubtQuestion ? (
                                    <div className="space-y-8">
                                        <div className="p-8 bg-gray-50/50 dark:bg-gray-900 border-l-8 border-blue-600 rounded-3xl">
                                            <h5 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">Context Question</h5>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white leading-relaxed">{activeDoubtQuestion.question}</p>
                                        </div>

                                        <div className="space-y-4">
                                            <textarea
                                                value={doubtQuery}
                                                onChange={(e) => setDoubtQuery(e.target.value)}
                                                placeholder="What specifics would you like to understand about this topic or answer?"
                                                rows={5}
                                                className="w-full p-8 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium text-gray-900 dark:text-white"
                                            />
                                            <button 
                                                onClick={() => handleAskDoubt(activeDoubtQuestion)}
                                                disabled={isClarifying || !doubtQuery.trim()}
                                                className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl disabled:opacity-50"
                                            >
                                                {isClarifying ? 'Consulting Expert...' : 'Send Query to Mentor'}
                                            </button>
                                        </div>

                                        {doubtResponse && (
                                            <div className="p-10 bg-emerald-50/30 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-[3rem] animate-slide-up">
                                                <h5 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-6">Expert Response</h5>
                                                <p className="text-lg font-medium text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{doubtResponse.answer}</p>
                                                {doubtResponse.suggestions?.length > 0 && (
                                                    <div className="mt-8 pt-6 border-t border-emerald-100 space-y-3 text-left">
                                                        <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recommended Readings</h6>
                                                        <div className="flex flex-wrap gap-2">
                                                            {doubtResponse.suggestions.map((s, i) => <span key={i} className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-emerald-700 shadow-sm"># {s}</span>)}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center gap-6 opacity-40">
                                        <span className="text-6xl">💬</span>
                                        <p className="text-sm font-black uppercase tracking-widest text-center">Select any question from the practice tab<br/>to ask a doubt about it.</p>
                                        <button onClick={() => setActiveTab('practice')} className="text-blue-600 font-black text-xs uppercase border-b-2 border-blue-600">Go to Practice</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {stage === 'questions' && isMCQMode && (
                <div className="max-w-5xl mx-auto w-full space-y-8 animate-slide-up pb-20">
                    <header className="flex justify-between items-end">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{company} {getRounds()[currentRoundIndex]}</h3>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Step {currentRoundIndex + 1}: Assessment Round</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Questions Remaining: {questions.length - mcqResults.length}</span>
                        </div>
                    </header>

                    <div className="space-y-8">
                        {questions.map((q, idx) => {
                            const result = mcqResults.find(r => r.questionId === q.id);
                            return (
                                <div key={q.id || idx} className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-xl overflow-hidden">
                                    <div className="px-10 py-6 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-50 flex items-center gap-4">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-[9px] font-black uppercase tracking-widest">Question {idx + 1}</span>
                                        <span className="text-[10px] font-black text-gray-400 border-l border-gray-200 pl-4 uppercase tracking-[0.2em]">{q.topic || 'General Aptitude'}</span>
                                    </div>
                                    <div className="p-10 space-y-8">
                                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white leading-relaxed">{q.question}</h4>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {Object.entries(q.options || {}).map(([key, text]) => {
                                                const isSelected = result?.userOption === key;
                                                const isCorrect = q.correct_option === key;
                                                let buttonClass = "bg-gray-50/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 text-gray-700 hover:border-blue-400";
                                                
                                                if (result) {
                                                    if (isCorrect) buttonClass = "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20";
                                                    else if (isSelected) buttonClass = "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20";
                                                    else buttonClass = "opacity-40 grayscale pointer-events-none bg-gray-50 dark:bg-gray-900 border-gray-100";
                                                }

                                                return (
                                                    <button 
                                                        key={key}
                                                        disabled={!!result}
                                                        onClick={() => {
                                                            const isRight = key === q.correct_option;
                                                            setMcqResults([...mcqResults, { questionId: q.id, userOption: key, correct: isRight, topic: q.topic }]);
                                                            if (isRight) {
                                                                setSessionStreak(s => s + 1);
                                                                setTopicPerformance(prev => ({
                                                                    ...prev,
                                                                    [q.topic || 'General']: { 
                                                                        attempted: (prev[q.topic || 'General']?.attempted || 0) + 1,
                                                                        correct: (prev[q.topic || 'General']?.correct || 0) + 1
                                                                    }
                                                                }));
                                                            } else {
                                                                setSessionStreak(0);
                                                                setTopicPerformance(prev => ({
                                                                    ...prev,
                                                                    [q.topic || 'General']: { 
                                                                        attempted: (prev[q.topic || 'General']?.attempted || 0) + 1,
                                                                        correct: (prev[q.topic || 'General']?.correct || 0)
                                                                    }
                                                                }));
                                                            }
                                                        }}
                                                        className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 flex items-center gap-4 ${buttonClass}`}
                                                    >
                                                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${result ? 'bg-white/20' : 'bg-white dark:bg-gray-800 shadow-sm'}`}>{key}</span>
                                                        <span className="font-bold text-sm">{text}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {result && (
                                            <div className="animate-fade-in space-y-6">
                                                <div className={`p-6 rounded-[2rem] border ${result.correct ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                                    <h5 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${result.correct ? 'text-emerald-600' : 'text-rose-600'}`}>{result.correct ? '✓ Correct!' : '✕ Incorrect'}</h5>
                                                    <p className="text-sm font-medium text-gray-700 leading-relaxed">{q.explanation}</p>
                                                </div>
                                                <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem]">
                                                    <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-3">Quick Shortcut Trick</h5>
                                                    <p className="text-sm font-bold text-gray-900 leading-relaxed italic">{q.shortcut_trick || "Identify the pattern quickly to save time."}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="flex justify-center pb-24 pt-4">
                        <button 
                            onClick={loadMoreQuestions} 
                            disabled={isGeneratingMore}
                            className="px-8 py-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 text-blue-600 dark:text-blue-400 font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] transition-all border border-blue-100 dark:border-blue-900/30 w-full max-w-sm"
                        >
                            {isGeneratingMore ? 'Loading Additional Questions...' : 'Load 10 More Questions'}
                        </button>
                    </div>
                    
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 px-8 py-4 rounded-full shadow-2xl flex items-center gap-10">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center">Current Streak</span>
                            <span className="text-2xl font-black text-white text-center">🔥 {sessionStreak}</span>
                        </div>
                        <div className="w-[1px] h-10 bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest text-center">Accuracy</span>
                            <span className="text-2xl font-black text-blue-400 text-center">{Math.round((mcqResults.filter(r => r.correct).length / (mcqResults.length || 1)) * 100)}%</span>
                        </div>
                        <button 
                            onClick={handleStudyRound}
                            className="px-10 py-3 bg-white text-gray-900 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-gray-100 transition-all shadow-xl"
                        >
                            Complete Round
                        </button>
                    </div>
                </div>
            )}

            {stage === 'round_summary' && allRoundResults.length > 0 && (
                <div className="max-w-4xl mx-auto w-full space-y-10 animate-slide-up pb-20">
                    <header className="text-center space-y-4">
                        <span className="text-6xl block">🏁</span>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Round {currentRoundIndex + 1} Assessment</h2>
                        <p className="text-gray-500 text-lg font-medium italic">Finished the <span className="text-blue-600 font-black">{getRounds()[currentRoundIndex]}</span> round.</p>
                    </header>

                    <div className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-700 shadow-2xl space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                            <div className="p-8 bg-emerald-50/50 border border-emerald-100 rounded-[2rem] space-y-4">
                                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><span>💪</span> What went well</h4>
                                <p className="text-sm font-bold text-gray-800 leading-relaxed italic">"{allRoundResults[allRoundResults.length-1].what_went_well}"</p>
                            </div>
                            <div className="p-8 bg-indigo-50/50 border border-indigo-100 rounded-[2rem] space-y-4">
                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><span>🎯</span> Key Next Step</h4>
                                <p className="text-sm font-bold text-gray-800 leading-relaxed italic">"{allRoundResults[allRoundResults.length-1].main_gap}"</p>
                            </div>
                        </div>

                        {allRoundResults[allRoundResults.length-1].score < 60 && (
                            <div className="pt-10 border-t border-gray-50 dark:border-gray-700 space-y-6">
                                <div className="text-center">
                                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">We detected some weak areas</h4>
                                    <p className="text-sm font-medium text-gray-500 italic">Would you like a focused drill to master these before proceeding?</p>
                                </div>
                                <div className="flex flex-wrap gap-4 justify-center">
                                    {Object.entries(allRoundResults[allRoundResults.length-1].dimension_avgs)
                                        .filter(([_, score]) => score < 60)
                                        .map(([dim, _]) => (
                                            <button 
                                                key={dim}
                                                onClick={() => handleDrill(dim === 'edge_cases' ? 'Edge Cases & Optimization' : dim === 'communication' ? 'Behavioral & Leadership' : 'Foundational Topics')}
                                                className="px-8 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-rose-500/20"
                                            >
                                                Practise {dim.replace('_', ' ')} questions
                                            </button>
                                        ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-10 border-t border-gray-50 dark:border-gray-700 flex flex-col md:flex-row gap-4">
                            <button onClick={() => setActiveTab('teach')} className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black uppercase text-[10px] transition-all">Review Lessons</button>
                            <button onClick={handleNextRound} className="flex-2 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-blue-500/20 transition-all">
                                {currentRoundIndex < getRounds().length - 1 ? 'Proceed to Next Round' : 'Finish Simulation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {stage === 'results' && finalReport && (
                <div className="max-w-6xl mx-auto w-full space-y-10 pb-10 animate-slide-up">
                    <header className="text-center">
                        <span className="text-5xl block mb-6">📊</span>
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
