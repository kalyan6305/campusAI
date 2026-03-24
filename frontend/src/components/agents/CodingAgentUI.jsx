import React, { useState, useRef, useEffect } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import useChatStore from '../../store/chatStore';
import ChatWindow from '../chat/ChatWindow';
import ChatInput from '../chat/ChatInput';
import { MessageSquare, Plus, Trash2, ChevronLeft, ChevronRight, History, Code2, Terminal, Loader2, Play } from 'lucide-react';

const LANG_OPTIONS = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'sql', label: 'SQL' }
];

const DEFAULT_CODE = {
    python: 'print("Hello, CampusAI!")',
    javascript: 'console.log("Hello, CampusAI!");',
    java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CampusAI!");\n    }\n}',
    cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, CampusAI!" << endl;\n    return 0;\n}',
    sql: 'CREATE TABLE students (id INTEGER PRIMARY KEY, name TEXT);\nINSERT INTO students VALUES (1, \'Alice\');\nINSERT INTO students VALUES (2, \'Bob\');\nSELECT * FROM students;',
};

// ── History Panel ───────────────────────────────────────────────────────────

function HistoryPanel({ sessions, activeSessionId, onSelect, onCreate, onDelete, isStreaming }) {
    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                    Chat History
                </h2>
                <button
                    onClick={onCreate}
                    disabled={isStreaming}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all disabled:opacity-50"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Chat
                </button>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                        <MessageSquare className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" />
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium leading-relaxed">
                            No conversations yet. Start a new chat!
                        </p>
                    </div>
                ) : (
                    sessions.map((session) => {
                        const isActive = session.id === activeSessionId;
                        return (
                            <div
                                key={session.id}
                                onClick={() => onSelect(session.id)}
                                className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${isActive
                                        ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 shadow-sm'
                                        : 'border border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                    }`}
                            >
                                <MessageSquare className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'}`} />
                                <span className={`text-[11px] truncate flex-1 font-medium ${isActive ? 'text-amber-700 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {session.title || 'Coding Chat'}
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 text-gray-300 dark:text-gray-600 transition-all"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-700">
                <p className="text-[9px] text-gray-300 dark:text-gray-600 text-center font-mono uppercase tracking-widest">
                    💻 Coding Agent · Campus AI
                </p>
            </div>
        </div>
    );
}

// ── Main Component ──────────────────────────────────────────────────────────

const CodingAgentUI = () => {
    const {
        sendMessage, isStreaming, activeSessionId,
        createSession, clearActiveSession, loadSessions,
        getSessions, selectSession, deleteSession
    } = useChatStore();

    const [showHistory, setShowHistory] = useState(false);
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState(DEFAULT_CODE['python']);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatePrompt, setGeneratePrompt] = useState('');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);

    // Layout State
    const [viewMode, setViewMode] = useState('both'); // 'both', 'chat', 'workspace'

    // Diff States
    const [isDiffMode, setIsDiffMode] = useState(false);
    const [originalCode, setOriginalCode] = useState('');
    const [modifiedCode, setModifiedCode] = useState('');
    const [isTransforming, setIsTransforming] = useState(false);

    const editorRef = useRef(null);

    const handleLanguageChange = (e) => {
        const lang = e.target.value;
        setLanguage(lang);
        setCode(DEFAULT_CODE[lang] || '');
        setOutput('');
    };

    const sessions = getSessions();

    useEffect(() => {
        loadSessions('agents');
    }, [loadSessions]);

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
    };

    const handleNewChat = async () => {
        clearActiveSession();
    };

    const handleSendChat = async (content) => {
        if (!activeSessionId) {
            await createSession('Coding Chat', 'agents');
        }
        await sendMessage(content, { mode: 'coding', module: 'agents' });
    };

    const runActionOnCode = async (actionType) => {
        const editor = editorRef.current;
        if (!editor) return;

        // For 'explain', use chat as before
        if (actionType === 'explain') {
            const selectedText = editor.getModel().getValueInRange(editor.getSelection());
            const codeContext = selectedText || editor.getValue();
            if (!codeContext.trim()) {
                alert('Editor is empty. Please enter or select some code first.');
                return;
            }
            const prompt = `Please explain the following ${language} code:\n\n\`\`\`${language}\n${codeContext}\n\`\`\``;
            await handleSendChat(prompt);
            return;
        }

        // For 'debug' or 'optimize', use the Diff View flow
        await handleTransformCode(actionType);
    };

    const handleTransformCode = async (action) => {
        const currentCode = editorRef.current ? editorRef.current.getValue() : code;
        if (!currentCode.trim()) return;

        setIsTransforming(true);
        setOriginalCode(currentCode);

        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/v1/coding/transform', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ code: currentCode, language, action })
            });

            if (response.ok) {
                const data = await response.json();
                setModifiedCode(data.modified_code || currentCode);
                setIsDiffMode(true);
            } else {
                console.error('Transform failed');
                setOutput(`❌ ${action === 'debug' ? 'Debug' : 'Optimize'} failed. Please try again.`);
            }
        } catch (error) {
            console.error('Transform error:', error);
        }
        setIsTransforming(false);
    };

    const handleAcceptChanges = () => {
        setCode(modifiedCode);
        setIsDiffMode(false);
    };

    const handleDiscardChanges = () => {
        setIsDiffMode(false);
    };

    const handleRunCode = async () => {
        const currentCode = editorRef.current ? editorRef.current.getValue() : code;
        console.log('--- RUNNING CODE ---');
        console.log('Language:', language);
        console.log('Code Length:', currentCode.length);

        if (!currentCode.trim()) { setOutput('No code to run. Write some code first.'); return; }
        setIsRunning(true);
        setOutput('⏳ Running code...');
        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/v1/coding/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ code: currentCode, language })
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Server Response Data:', data);
                const stdout = (data.stdout || '').trim();
                const stderr = (data.stderr || '').trim();
                if (stdout && stderr) {
                    setOutput(`${stdout}\n\n⚠️ stderr:\n${stderr}`);
                } else if (stdout) {
                    setOutput(stdout);
                } else if (stderr) {
                    // Some programs write normal output to stderr (e.g. compilation info)
                    setOutput(stderr);
                } else {
                    setOutput('✅ Code ran successfully with no output (exit code: 0).');
                }
            } else if (response.status === 401) {
                setOutput('⚠️ Authentication required. Please log in again.');
            } else {
                const errText = await response.text();
                setOutput(`❌ Execution failed (HTTP ${response.status}):\n${errText}`);
            }
        } catch (error) {
            setOutput(`❌ Network error: ${error.message}`);
        }
        setIsRunning(false);
    };

    const handleGenerateCode = async () => {
        if (!generatePrompt.trim()) return;
        setIsGenerating(true);
        console.log('--- GENERATING CODE ---');
        console.log('Prompt:', generatePrompt);
        console.log('Language:', language);

        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('token');
            const response = await fetch('http://localhost:8000/api/v1/coding/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ prompt: generatePrompt, language })
            });

            console.log('Generate Response Status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Generate Response Data:', data);
                const newCode = data.code || '';

                if (editorRef.current) {
                    const editor = editorRef.current;
                    const fullRange = editor.getModel().getFullModelRange();
                    editor.executeEdits('coding-agent', [{
                        range: fullRange,
                        text: newCode,
                        forceMoveMarkers: true
                    }]);
                    // Scroll to top after generating
                    editor.setScrollTop(0);
                    console.log('Code inserted into editor.');
                } else {
                    setCode(newCode);
                }
            } else {
                const errorText = await response.text();
                console.error('Generation API failed:', errorText);
                console.log('Falling back to chat...');
                await handleSendChat(`Generate ${language} code for: ${generatePrompt}`);
            }
        } catch (error) {
            console.error('Generation error:', error);
            console.log('Falling back to chat...');
            await handleSendChat(`Generate ${language} code for: ${generatePrompt}`);
        }
        setIsGenerating(false);
        setGeneratePrompt('');
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-gray-50/50 dark:bg-gray-900/10">

            {/* ── LEFT: History Panel ─────────────────────────────────── */}
            <div
                className={`flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${showHistory ? 'w-64' : 'w-12'
                    }`}
            >
                {/* Toggle Button Row */}
                <div className={`flex items-center border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 ${showHistory ? 'p-3 justify-between' : 'p-2 justify-center'}`}>
                    {showHistory && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                            History
                        </span>
                    )}
                    <button
                        onClick={() => setShowHistory(prev => !prev)}
                        title={showHistory ? 'Hide History' : 'Show History'}
                        className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                    >
                        {showHistory ? (
                            <ChevronLeft className="w-4 h-4" />
                        ) : (
                            <History className="w-4 h-4" />
                        )}
                    </button>
                </div>

                {/* History content - only renders when visible */}
                {showHistory && (
                    <HistoryPanel
                        sessions={sessions}
                        activeSessionId={activeSessionId}
                        onSelect={selectSession}
                        onCreate={handleNewChat}
                        onDelete={deleteSession}
                        isStreaming={isStreaming}
                    />
                )}

                {/* Collapsed state: vertical icons */}
                {!showHistory && (
                    <div className="flex flex-col items-center gap-3 pt-3">
                        <button
                            onClick={handleNewChat}
                            title="New Chat"
                            className="p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                        <div className="w-6 h-px bg-gray-100 dark:bg-gray-700" />
                        {/* Mini session dots */}
                        {sessions.slice(0, 5).map(session => (
                            <button
                                key={session.id}
                                title={session.title || 'Coding Chat'}
                                onClick={() => selectSession(session.id)}
                                className={`w-2 h-2 rounded-full transition-all ${session.id === activeSessionId ? 'bg-amber-500 scale-125' : 'bg-gray-200 dark:bg-gray-600 hover:bg-amber-300'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── MAIN CONTENT AREA (Toggle + Panels) ───────────────── */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-800">

                {/* Top View Mode Toggle Bar (Static, non-overlapping) */}
                <div className="flex-shrink-0 flex items-center justify-center py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/20 z-20">
                    <div className="flex items-center bg-gray-100 dark:bg-[#1e1e1e] rounded-full p-1 border border-gray-200 dark:border-[#333]">
                        <button
                            onClick={() => setViewMode('chat')}
                            className={`px-4 py-1 text-[10px] font-black uppercase tracking-wider rounded-full transition-all ${viewMode === 'chat' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-[#2d2d2d]'}`}
                        >
                            Chat Only
                        </button>
                        <button
                            onClick={() => setViewMode('both')}
                            className={`px-4 py-1 text-[10px] font-black uppercase tracking-wider rounded-full transition-all ${viewMode === 'both' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-[#2d2d2d]'}`}
                        >
                            Split View
                        </button>
                        <button
                            onClick={() => setViewMode('workspace')}
                            className={`px-4 py-1 text-[10px] font-black uppercase tracking-wider rounded-full transition-all ${viewMode === 'workspace' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-[#2d2d2d]'}`}
                        >
                            Workspace Only
                        </button>
                    </div>
                </div>

                {/* Panels Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* ── CENTER: AI Coding Chat ──────────────────────────────── */}
                    {viewMode !== 'workspace' && (
                        <div className={`flex flex-col h-full border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm relative z-10 ${viewMode === 'chat' ? 'flex-1' : ''}`}
                            style={viewMode === 'both' ? { width: '40%', minWidth: 0 } : { minWidth: 0 }}
                        >
                            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                                <h2 className="text-sm font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    AI Coding Chat
                                </h2>
                            </div>
                            <div className="flex-grow overflow-hidden flex flex-col">
                                <ChatWindow />
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700">
                                <ChatInput onSend={handleSendChat} disabled={isStreaming} />
                            </div>
                        </div>
                    )}

                    {/* ── RIGHT: Coding Workspace ─────────────────────────────── */}
                    {viewMode !== 'chat' && (
                        <div className="flex flex-col h-full bg-[#1e1e1e] relative" style={{ flex: 1, minWidth: 0 }}>

                            {/* Toolbar */}
                            <div className="p-3 bg-[#252526] border-b border-[#333] flex flex-col gap-3 z-20 shadow-md">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Code2 className="w-4 h-4 text-amber-500" />
                                            Workspace
                                        </span>
                                        <select
                                            value={language}
                                            onChange={handleLanguageChange}
                                            className="bg-[#333] text-gray-200 text-xs font-mono px-3 py-1.5 rounded outline-none border border-[#444] focus:border-amber-500 transition-colors cursor-pointer hover:bg-[#3a3a3a]"
                                        >
                                            {LANG_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => runActionOnCode('explain')}
                                            disabled={isStreaming || isTransforming}
                                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider rounded border border-blue-500/20 transition-all disabled:opacity-50"
                                        >
                                            Explain
                                        </button>
                                        <button
                                            onClick={() => runActionOnCode('debug')}
                                            disabled={isStreaming || isTransforming}
                                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded border transition-all disabled:opacity-50 ${isTransforming ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                                                }`}
                                        >
                                            {isTransforming ? 'Analyzing...' : 'Debug'}
                                        </button>
                                        <button
                                            onClick={() => runActionOnCode('optimize')}
                                            disabled={isStreaming || isTransforming}
                                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded border border-emerald-500/20 transition-all disabled:opacity-50"
                                        >
                                            Optimize
                                        </button>
                                    </div>
                                </div>

                                {/* Diff Actions Bar */}
                                {isDiffMode && (
                                    <div className="flex items-center justify-between bg-amber-500/10 border-b border-amber-500/30 px-3 py-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                            Review Suggested Changes
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleDiscardChanges}
                                                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] font-bold uppercase tracking-wider transition-all"
                                            >
                                                Discard
                                            </button>
                                            <button
                                                onClick={handleAcceptChanges}
                                                className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20"
                                            >
                                                Accept Changes
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Generate Code Bar */}
                                <div className="flex items-center gap-2 bg-[#1e1e1e] p-1.5 rounded border border-[#333] focus-within:border-amber-500/50 transition-colors">
                                    <input
                                        type="text"
                                        value={generatePrompt}
                                        onChange={(e) => setGeneratePrompt(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateCode()}
                                        placeholder="Prompt to generate code in editor..."
                                        className="flex-grow bg-transparent text-gray-300 text-xs px-2 outline-none font-sans placeholder-gray-600"
                                        disabled={isGenerating}
                                    />
                                    <button
                                        onClick={handleGenerateCode}
                                        disabled={isGenerating || !generatePrompt.trim()}
                                        className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:shadow-none whitespace-nowrap"
                                    >
                                        {isGenerating ? 'Generating...' : 'Generate'}
                                    </button>
                                </div>
                            </div>

                            {/* Monaco Editor / Diff Editor */}
                            <div className="flex-grow relative overflow-hidden">
                                {isDiffMode ? (
                                    <DiffEditor
                                        height="100%"
                                        original={originalCode}
                                        modified={modifiedCode}
                                        language={language}
                                        theme="vs-dark"
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                            renderSideBySide: true,
                                            originalEditable: false,
                                            readOnly: false,
                                            smoothScrolling: true,
                                            padding: { top: 16, bottom: 16 },
                                        }}
                                    />
                                ) : (
                                    <Editor
                                        height="100%"
                                        language={language}
                                        theme="vs-dark"
                                        value={code}
                                        onChange={(value) => setCode(value || '')}
                                        onMount={handleEditorDidMount}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                            padding: { top: 16, bottom: 16 },
                                            smoothScrolling: true,
                                            cursorBlinking: 'smooth',
                                            cursorSmoothCaretAnimation: 'on',
                                            formatOnPaste: true,
                                            lineHeight: 24,
                                        }}
                                        loading={
                                            <div className="flex items-center justify-center h-full w-full text-gray-500 text-sm font-mono animate-pulse">
                                                Loading Coding Environment...
                                            </div>
                                        }
                                    />
                                )}
                            </div>

                            {/* Output Terminal */}
                            <div className="h-48 flex-shrink-0 bg-[#1e1e1e] border-t border-[#333] flex flex-col z-20">
                                <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <Terminal className="w-3 h-3" />
                                        Output Terminal
                                    </span>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleRunCode}
                                            disabled={isRunning}
                                            className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {isRunning ? (
                                                <>
                                                    <Loader2 className="animate-spin w-3 h-3" />
                                                    Running...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-3 h-3" />
                                                    Run Code →
                                                </>
                                            )}
                                        </button>
                                        <div className="w-px h-4 bg-[#444]" />
                                        <button onClick={() => setOutput('')} className="text-gray-500 hover:text-gray-300 text-[10px] font-bold uppercase tracking-wider transition-colors">
                                            Clear
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-grow p-4 overflow-y-auto font-mono text-xs text-gray-300 whitespace-pre-wrap custom-scrollbar">
                                    {output || <span className="text-gray-600">Ready for execution...</span>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CodingAgentUI;
