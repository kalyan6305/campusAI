import React, { useState, useEffect } from 'react';
import { studyPlannerAPI } from '../../services/api';
import {
  Calendar, Clock, Layers, ArrowRight,
  CheckCircle, Download, RefreshCw, AlertCircle,
  Layout, List as ListIcon, CheckSquare, Square
} from 'lucide-react';

// const API_BASE = '/api/v1/study-planner';

const StudyPlannerAgentUI = ({ showHistory, setShowHistory }) => {
  const [step, setStep] = useState(1); // 1: Input, 2: Researching, 3: Result, 4: Error
  const [formData, setFormData] = useState({
    subject: '',
    level: 'Intermediate',
    days: 30,
    hours: 2,
    examDate: ''
  });
  const [plan, setPlan] = useState(null);
  const [progress, setProgress] = useState({});
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [history, setHistory] = useState([]);

  const loadingMessages = [
    "Analyzing Subject...",
    "Searching Curriculum...",
    "Mapping Topics...",
    "Optimizing Schedule...",
    "Finalizing Study Plan..."
  ];

  useEffect(() => {
    const savedSession = localStorage.getItem('study_planner_session');
    if (savedSession) {
      setSessionId(savedSession);
      fetchPlan(savedSession);
    }
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const resp = await studyPlannerAPI.listPlans();
      setHistory(resp.data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const fetchPlan = async (sid) => {
    try {
      const resp = await studyPlannerAPI.getPlan(sid);
      const planData = resp.data.plan;
      setPlan(planData);
      setProgress(resp.data.progress || {});

      // Sync form data for re-generation
      setFormData({
        subject: planData.subject || '',
        level: planData.level || 'Intermediate',
        days: planData.total_days || 30,
        hours: planData.hours_per_day || 2,
        examDate: planData.exam_date || ''
      });

      setStep(3);
    } catch (err) {
      console.error("Failed to fetch plan", err);
      localStorage.removeItem('study_planner_session');
      setStep(1);
    }
  };

  const handleGenerate = async () => {
    setStep(2);
    setLoadingStep(0);
    setError(null);

    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
    }, 7000);

    try {
      const resp = await studyPlannerAPI.generate({
        subject: formData.subject,
        level: formData.level,
        days: parseInt(formData.days),
        hours: parseFloat(formData.hours),
        exam_date: formData.examDate || null
      });

      clearInterval(interval);
      setPlan(resp.data.plan);
      setSessionId(resp.data.session_id);
      localStorage.setItem('study_planner_session', resp.data.session_id);
      setStep(3);
      fetchHistory(); // Refresh history
    } catch (err) {
      clearInterval(interval);
      setError(err.response?.data?.detail || "The strategy engine timed out. Please try with fewer days or simplified subject.");
      setStep(4);
    }
  };

  const toggleProgress = async (topicId) => {
    const newProgress = { ...progress, [topicId]: !progress[topicId] };
    setProgress(newProgress);
    // Persist to API
    try {
      await studyPlannerAPI.saveProgress(sessionId, newProgress);
    } catch (err) {
      console.error("Failed to save progress", err);
    }
  };

  const handleNewPlan = () => {
    localStorage.removeItem('study_planner_session');
    setPlan(null);
    setSessionId(null);
    setProgress({});
    setStep(1);
  };

  const handleDeletePlan = async (sid) => {
    if (window.confirm("Permanently delete this study plan?")) {
      try {
        await studyPlannerAPI.clearPlan(sid);
        if (sessionId === sid) {
          handleNewPlan();
        }
        fetchHistory();
      } catch (err) {
        console.error("Failed to delete plan", err);
      }
    }
  };

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);
  };

  const handleExportExcel = async () => {
    try {
      const resp = await studyPlannerAPI.exportExcel(sessionId);
      const blob = resp.data instanceof Blob ? resp.data : new Blob([resp.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      downloadFile(blob, `study_plan_${plan.subject.replace(/\s+/g, '_')}.xlsx`);
    } catch (err) {
      console.error("Export failed", err);
      alert("Excel export failed. Please use CSV or try again.");
    }
  };

  const renderInputForm = () => (
    <div className="max-w-2xl mx-auto p-8 animate-fade-in bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
      <h2 className="text-3xl font-black mb-8 text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
        <Calendar className="text-blue-600" /> Tell us about your study goal
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="col-span-1 md:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject / Course Name</label>
          <input
            type="text"
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-blue-500 transition-all text-lg font-medium text-gray-900 dark:text-gray-100"
            placeholder="e.g. Data Structures, Organic Chemistry"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Your Level</label>
          <select
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-blue-500 transition-all text-lg font-medium text-gray-900 dark:text-gray-100"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Exam / Goal Date (optional)</label>
          <input
            type="date"
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-blue-500 transition-all text-lg font-medium text-gray-900 dark:text-gray-100"
            value={formData.examDate}
            onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Available Days</label>
          <input
            type="number"
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-blue-500 transition-all text-lg font-medium text-gray-900 dark:text-gray-100"
            value={formData.days}
            onChange={(e) => setFormData({ ...formData, days: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Hours per Day</label>
          <input
            type="number"
            step="0.5"
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none focus:ring-2 focus:ring-blue-500 transition-all text-lg font-medium text-gray-900 dark:text-gray-100"
            value={formData.hours}
            onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!formData.subject}
        className="w-full py-5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xl font-black shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-3 group"
      >
        Generate Study Plan <ArrowRight className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  const renderResearching = () => (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in text-center">
      <div className="relative mb-12">
        <div className="w-32 h-32 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Layers className="w-10 h-10 text-blue-500 animate-pulse" />
        </div>
      </div>
      <h2 className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight">Building Your Excellence</h2>
      <p className="text-xl text-gray-500 dark:text-gray-400 font-medium max-w-md mx-auto h-8">
        {loadingMessages[loadingStep]}
      </p>

      <div className="mt-12 flex gap-2">
        {loadingMessages.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i <= loadingStep ? 'bg-blue-500 w-8' : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>
    </div>
  );

  const renderResult = () => {
    if (!plan) return null;

    const totalTopics = plan.all_topics.length;
    const completedTopics = Object.values(progress).filter(Boolean).length;
    const progressPercent = Math.round((completedTopics / totalTopics) * 100);

    return (
      <div className="animate-fade-in flex flex-col h-full">
        <header className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{plan.subject} Mastery Plan</h2>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs font-black px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 uppercase tracking-widest">{plan.level}</span>
                <span className="text-sm font-bold text-gray-400">•</span>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{plan.total_days} Days / {plan.hours_per_day}h daily</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 scroll-hide">
            <div className="flex items-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-1 shadow-sm mr-2">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600' : 'text-gray-400'}`}
              >
                <ListIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'card' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600' : 'text-gray-400'}`}
              >
                <Layout className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={async () => {
                // Generate TSV for easier pasting into Sheets
                const tsv = "Day\tWeek\tTopic\tHours\tDifficulty\tRationale\n" + plan.all_topics.map(t => `${t.day}\t${t.week}\t${t.topic}\t${t.hours}\t${t.difficulty}\t${t.rationale}`).join("\n");

                try {
                  await navigator.clipboard.writeText(tsv);
                  window.open('https://sheets.new', '_blank');
                  alert("Plan copied to clipboard! \n\nWe've opened a new Google Sheet for you. Just click on cell A1 and press Ctrl+V (or Cmd+V) to paste your plan.");
                } catch (err) {
                  // Fallback to CSV download if clipboard fails
                  const blob = new Blob([tsv.replace(/\t/g, ',')], { type: 'text/csv' });
                  downloadFile(blob, `study_plan_${plan.subject.replace(/\s+/g, '_')}.csv`);
                  alert("Failed to copy to clipboard. We've downloaded a CSV instead—you can import this into Google Sheets.");
                }
              }}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl font-black text-xs text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all whitespace-nowrap"
              title="Copy to clipboard and open Google Sheets"
            >
              <Layers className="w-4 h-4 text-emerald-500" /> Export to Google Sheets
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl font-black text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm transition-all whitespace-nowrap"
              title="Download as Excel file"
            >
              <Download className="w-4 h-4" /> Download Plan
            </button>
            <button
              onClick={handleNewPlan}
              className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" /> New Plan
            </button>
          </div>
        </header>

        {/* Progress Overview */}
        <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-800/40 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Live Mastery Tracker</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{progressPercent}% Completed</span>
          </div>
          <div className="w-full h-3 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden relative z-10">
            <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="mt-3 text-[11px] text-blue-500/70 font-bold uppercase tracking-wider relative z-10">{completedTopics} out of {totalTopics} milestones reached</p>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all" />
        </div>

        {viewMode === 'table' ? (
          <div className="flex-grow overflow-auto bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm custom-scrollbar relative">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm z-20">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Done</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Day</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Topic</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Hours</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Difficulty</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">Rationale</th>
                </tr>
              </thead>
              <tbody>
                {plan.weeks.map((week, wIndex) => (
                  <React.Fragment key={wIndex}>
                    <tr className="bg-gray-50/30 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                      <td colSpan="6" className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black text-gray-900 dark:text-gray-100 tracking-tight">Week {week.week_number}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">• {week.week_rationale}</span>
                          <div className="ml-auto w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{
                                width: `${Math.round((week.topics.filter(t => progress[`${t.day}_${t.week}_${t.topic}`]).length / week.topics.length) * 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                    {week.topics.map((topic, tIndex) => {
                      const tId = `${topic.day}_${topic.week}_${topic.topic}`;
                      const isDone = progress[tId];
                      return (
                        <tr
                          key={tIndex}
                          className={`group transition-all hover:bg-gray-50/80 dark:hover:bg-gray-900/30 ${isDone ? 'opacity-40 grayscale-sm' : ''}`}
                        >
                          <td className="px-6 py-5">
                            <button
                              onClick={() => toggleProgress(tId)}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 dark:border-gray-700 dark:bg-gray-900'}`}
                            >
                              {isDone ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-gray-300 dark:text-gray-600" />}
                            </button>
                          </td>
                          <td className="px-6 py-5 font-black text-xs text-gray-400 dark:text-gray-500 tracking-tighter">Day {topic.day}</td>
                          <td className="px-6 py-5">
                            <div className="font-bold text-gray-900 dark:text-gray-100 mb-1">{topic.topic}</div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{topic.detail}</div>
                          </td>
                          <td className="px-6 py-5 font-black text-xs text-gray-600 dark:text-gray-300">{topic.hours}h</td>
                          <td className="px-6 py-5">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${topic.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' :
                                topic.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                                  'bg-rose-100 text-rose-700 dark:bg-rose-900/30'
                              }`}>
                              {topic.difficulty}
                            </span>
                          </td>
                          <td className="px-6 py-5 italic text-[11px] text-gray-400 dark:text-gray-500 max-w-[200px] leading-relaxed">{topic.rationale}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-grow overflow-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 custom-scrollbar pb-6">
            {plan.all_topics.map((topic, idx) => {
              const tId = `${topic.day}_${topic.week}_${topic.topic}`;
              const isDone = progress[tId];
              return (
                <div
                  key={idx}
                  onClick={() => toggleProgress(tId)}
                  className={`p-6 rounded-3xl border transition-all cursor-pointer group ${isDone
                      ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800 opacity-60'
                      : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-500/50 shadow-sm'
                    }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Day {topic.day} • Week {topic.week}</span>
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 dark:border-gray-700'}`}>
                      {isDone ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-gray-200 dark:text-gray-700" />}
                    </div>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-2 tracking-tight">{topic.topic}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4 line-clamp-3">{topic.detail}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs font-black text-gray-600 dark:text-gray-400">{topic.hours}h</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${topic.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' :
                        topic.difficulty === 'Medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                          'bg-rose-50 text-rose-600 dark:bg-rose-900/20'
                      }`}>
                      {topic.difficulty}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
            Google Sheets: Export as <span className="text-blue-600 dark:text-blue-400">CSV</span>, then use the "Import" function in Google Sheets. Live sync is not supported yet.
          </div>
        </div>
      </div>
    );
  };

  const renderError = () => (
    <div className="max-w-md mx-auto py-20 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 text-4xl mx-auto mb-8">
        <AlertCircle className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight">Strategy Engine Stalled</h2>
      <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 font-medium leading-relaxed">{error}</p>
      <button
        onClick={() => setStep(1)}
        className="px-10 py-5 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-black shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto"
      >
        <RefreshCw className="w-5 h-5" /> Try Again
      </button>
    </div>
  );

  const renderHistory = () => (
    <div className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 border-l border-gray-100 dark:border-gray-700 ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Your Plans</h3>
          <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <RefreshCw className="w-5 h-5 rotate-45" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-4 custom-scrollbar pr-2">
          {history.length === 0 ? (
            <div className="text-center py-10">
              <Calendar className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest leading-relaxed">No history yet.<br />Generate your first plan!</p>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.session_id}
                onClick={() => {
                  setSessionId(item.session_id);
                  localStorage.setItem('study_planner_session', item.session_id);
                  fetchPlan(item.session_id);
                  setShowHistory(false);
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all group ${sessionId === item.session_id
                    ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-blue-500/30 shadow-sm'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest">{item.level}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePlan(item.session_id); }}
                      className="p-1 hover:text-red-500 transition-all rounded-md"
                    >
                      <RefreshCw className="w-3 h-3 rotate-45" />
                    </button>
                  </div>
                </div>
                <h4 className="font-black text-gray-900 dark:text-gray-100 mb-1 group-hover:text-blue-600 transition-colors truncate">{item.subject}</h4>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                  <ArrowRight className="w-3 h-3 text-blue-500" /> Continue Mastery
                </div>
              </button>
            ))
          )}
        </div>

        <button
          onClick={handleNewPlan}
          className="mt-6 w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
        >
          Create New Plan
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col p-6 md:p-10 bg-gray-50/50 dark:bg-gray-900/50 custom-scrollbar overflow-y-auto relative">

      {renderHistory()}

      <div className={`transition-all duration-300 ${showHistory ? 'pr-80 blur-sm pointer-events-none lg:blur-0 lg:pointer-events-auto' : ''}`}>
        {step === 1 ? renderInputForm() :
          step === 2 ? renderResearching() :
            step === 3 ? renderResult() :
              renderError()}
      </div>
    </div>
  );
};

export default StudyPlannerAgentUI;
