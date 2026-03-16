import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import useChatStore from '../../store/chatStore';
import ChatWindow from '../chat/ChatWindow';
import ChatInput from '../chat/ChatInput';

const LANG_OPTIONS = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'sql', label: 'SQL' }
];

const CodingAgentUI = () => {
    const { sendMessage, isStreaming, activeSessionId, createSession } = useChatStore();
    const [language, setLanguage] = useState('python');
    const [code, setCode] = useState('print("Hello, CampusAI!")');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatePrompt, setGeneratePrompt] = useState('');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const editorRef = useRef(null);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
    };

    const handleSendChat = async (content) => {
        if (!activeSessionId) {
            await createSession(`Coding Chat`, 'agents');
        }
        await sendMessage(content, { mode: 'coding', module: 'agents' });
    };

    const runActionOnCode = async (actionType) => {
        const editor = editorRef.current;
        if (!editor) return;

        let selectedText = editor.getModel().getValueInRange(editor.getSelection());
        let codeContext = selectedText || editor.getValue();

        if (!codeContext.trim()) {
            alert("Editor is empty. Please enter or select some code first.");
            return;
        }

        let prompt = '';
        if (actionType === 'explain') {
            prompt = `Please explain the following ${language} code:\n\n\`\`\`${language}\n${codeContext}\n\`\`\``;
        } else if (actionType === 'debug') {
            prompt = `Please debug the following ${language} code, identify any errors, and provide a corrected version:\n\n\`\`\`${language}\n${codeContext}\n\`\`\``;
        } else if (actionType === 'optimize') {
            prompt = `Please optimize the following ${language} code for better performance and readability:\n\n\`\`\`${language}\n${codeContext}\n\`\`\``;
        }

        await handleSendChat(prompt);
    };

    const handleRunCode = async () => {
        if (!code.trim()) {
            setOutput('No code to run. Write some code first.');
            return;
        }
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
                body: JSON.stringify({ code, language })
            });
            if (response.ok) {
                const data = await response.json();
                let outputText = '';
                if (data.stdout && data.stdout.trim()) {
                    outputText += data.stdout;
                }
                if (data.stderr && data.stderr.trim()) {
                    outputText += (outputText ? '\n\n stderr:\n' : '') + data.stderr;
                }
                setOutput(outputText || '✅ Executed successfully with no output.');
            } else if (response.status === 401) {
                setOutput('⚠️ Authentication required. Please make sure you are logged in.');
            } else {
                setOutput(`❌ Execution failed. Status: ${response.status}`);
            }
        } catch (error) {
            console.error(error);
            setOutput(`❌ Network error: ${error.message}`);
        }
        setIsRunning(false);
    };

    const handleGenerateCode = async () => {
        if (!generatePrompt.trim()) return;
        
        setIsGenerating(true);
        try {
            // For Level 2, we can simply ask the LLM through the standard chat 
            // and maybe parse the result, OR we just let the chat handle it normally 
            // and the user can copy-paste. However, the requirement says "the agent generates code inside the editor".
            // To do this properly without building a complex parser, let's call the backend explicitly
            // or just use the chat and instruct the LLM. 
            // Since we need it INSIDE the editor, let's fetch directly from a specific backend endpoint or parse the chat.
            // But wait! We can just use the standard fetch to the agent and extract the code block.
            
            const response = await fetch('http://localhost:8000/api/v1/coding/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // simple assumption, might need auth from store
                },
                body: JSON.stringify({ 
                    prompt: generatePrompt, 
                    language: language 
                })
            });

            if (response.ok) {
                const data = await response.json();
                const newCode = data.code || '';
                
                // Insert code at cursor or replace
                if (editorRef.current) {
                    const editor = editorRef.current;
                    const selection = editor.getSelection();
                    editor.executeEdits("coding-agent", [{
                        range: selection,
                        text: newCode,
                        forceMoveMarkers: true
                    }]);
                } else {
                    setCode(newCode);
                }
            } else {
                // Feature not ready in backend, let's fallback to chat
                await handleSendChat(`Generate ${language} code for: ${generatePrompt}`);
            }
        } catch (e) {
            console.error(e);
            await handleSendChat(`Generate ${language} code for: ${generatePrompt}`);
        }
        setIsGenerating(false);
        setGeneratePrompt('');
    };

    return (
        <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-gray-50/50 dark:bg-gray-900/10">
            {/* LEFT PANE: Coding Chat */}
            <div className="w-full lg:w-1/2 flex flex-col h-full border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm relative z-10">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                    <h2 className="text-sm font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        AI Coding Chat
                    </h2>
                </div>
                <div className="flex-grow overflow-hidden flex flex-col">
                    <ChatWindow />
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-50 dark:border-gray-700 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                    <ChatInput onSend={handleSendChat} disabled={isStreaming} />
                </div>
            </div>

            {/* RIGHT PANE: Coding Workspace */}
            <div className="w-full lg:w-1/2 flex flex-col h-full bg-[#1e1e1e] relative">
                {/* Workspace Header & Toolbar */}
                <div className="p-3 bg-[#252526] border-b border-[#333] flex flex-col gap-3 z-20 shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                                Workspace
                            </span>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-[#333] text-gray-200 text-xs font-mono px-3 py-1.5 rounded outline-none border border-[#444] focus:border-amber-500 transition-colors cursor-pointer hover:bg-[#3a3a3a]"
                            >
                                {LANG_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button onClick={() => runActionOnCode('explain')} disabled={isStreaming} className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider rounded border border-blue-500/20 transition-all disabled:opacity-50">Explain</button>
                            <button onClick={() => runActionOnCode('debug')} disabled={isStreaming} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider rounded border border-rose-500/20 transition-all disabled:opacity-50">Debug</button>
                            <button onClick={() => runActionOnCode('optimize')} disabled={isStreaming} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded border border-emerald-500/20 transition-all disabled:opacity-50">Optimize</button>
                        </div>
                    </div>
                    
                    {/* Generate Code Bar */}
                    <div className="flex items-center gap-2 bg-[#1e1e1e] p-1.5 rounded border border-[#333] focus-within:border-amber-500/50 transition-colors">
                        <input 
                            type="text"
                            value={generatePrompt}
                            onChange={(e) => setGeneratePrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerateCode()}
                            placeholder="Prompt to generate code in editor..."
                            className="flex-grow bg-transparent text-gray-300 text-xs px-2 outline-none font-sans"
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

                {/* Monaco Editor */}
                <div className="flex-grow relative">
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
                            cursorBlinking: "smooth",
                            cursorSmoothCaretAnimation: "on",
                            formatOnPaste: true,
                            lineHeight: 24,
                        }}
                        loading={
                            <div className="flex items-center justify-center h-full w-full text-gray-500 text-sm font-mono animate-pulse">
                                Loading Coding Environment...
                            </div>
                        }
                    />
                </div>

                {/* Output Terminal */}
                <div className="h-48 flex-shrink-0 bg-[#1e1e1e] border-t border-[#333] flex flex-col z-20">
                    <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M4 15V9a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2z" /></svg>
                            Output Terminal
                        </span>
                        <div className="flex items-center gap-3">
                            <button onClick={handleRunCode} disabled={isRunning} className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all disabled:opacity-50 flex items-center gap-2">
                                {isRunning ? (
                                    <>
                                        <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                                        Running Code...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                        Run Code →
                                    </>
                                )}
                            </button>
                            <div className="w-px h-4 bg-[#444]"></div>
                            <button onClick={() => setOutput('')} className="text-gray-500 hover:text-gray-300 text-[10px] font-bold uppercase tracking-wider transition-colors pt-0.5">Clear Output</button>
                        </div>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto font-mono text-xs text-gray-300 whitespace-pre-wrap custom-scrollbar">
                        {output || 'Ready for execution...'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodingAgentUI;
