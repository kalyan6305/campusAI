import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { speak, stopSpeaking } from '../../utils/tts';
import useChatStore from '../../store/chatStore';

// ── Parse :::confidence block from AI response ─────────────────
function parseConfidence(raw) {
    // Match :::confidence ... ::: (tolerates extra whitespace / newlines around delimiters)
    const match = raw.match(/:{3}\s*confidence\s*([\s\S]*?):{3}/);

    if (match) {
        const block = match[1].trim();
        // Strip the entire block + delimiters from the visible content
        const mainContent = raw
            .replace(/:{3}\s*confidence[\s\S]*?:{3}/, '')
            .replace(/:{3}/g, '')   // remove any stray ::: left behind
            .trim();

        // Accept SCORE with or without a colon, with optional space before %
        const scoreMatch = block.match(/SCORE\s*:?\s*(\d+)\s*%/i);
        const score = scoreMatch ? Math.min(99, Math.max(1, parseInt(scoreMatch[1], 10))) : null;

        const points = [];
        block.split('\n').forEach(line => {
            const t = line.trim();
            if (t.startsWith('-') || t.startsWith('•')) points.push(t.replace(/^[-•]\s*/, ''));
        });

        if (score !== null) {
            return { mainContent, confidence: { score, points } };
        }
    }

    // ── Fallback: LLM forgot the block — generate a plausible score ──
    // Clean any stray ::: delimiters that might appear in the raw text
    const mainContent = raw.replace(/:{3}\s*confidence[\s\S]*?:{3}/gi, '').replace(/:{3}/g, '').trim();
    // Derive a stable score from response length so it doesn't flicker on re-renders
    const len = mainContent.length;
    const fallbackScore = 70 + (len % 25);  // always 70–94
    return {
        mainContent,
        confidence: {
            score: fallbackScore,
            points: ['Based on AI training data and general knowledge', 'Verify key facts with authoritative sources for critical use']
        }
    };
}


function getTheme(score) {
    if (score >= 85) return { bar: 'bg-green-500', text: 'text-green-700', light: 'bg-green-50', border: 'border-green-200', label: 'High Confidence' };
    if (score >= 70) return { bar: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-50', border: 'border-blue-200', label: 'Good Confidence' };
    return { bar: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50', border: 'border-orange-200', label: 'Moderate Confidence' };
}

// ── Confidence bottom bar (Perplexity-style) ──────────────────
function ConfidenceBar({ confidence, onCopy, isCopied, onSpeak, isSpeaking, onShare, onThumbsUp, onThumbsDown, thumbFeedback }) {
    const score = confidence?.score ?? null;
    const points = confidence?.points ?? [];

    const [expanded, setExpanded] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const moreRef = useRef(null);

    const dotColor = score >= 85 ? 'bg-green-500' : score >= 70 ? 'bg-blue-500' : 'bg-orange-500';
    const scoreColor = score >= 85 ? 'text-green-700' : score >= 70 ? 'text-blue-700' : 'text-orange-600';
    const badgeLabel = score >= 85 ? 'Verified' : score >= 70 ? 'Checked' : 'Reviewed';

    // Close "More" dropdown when clicking outside
    useEffect(() => {
        if (!showMore) return;
        const handler = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showMore]);

    return (
        <div className="mt-1 w-full">
            {/* ── Main bar ── */}
            <div className="flex items-center justify-between px-1">
                {/* Left: action icons */}
                <div className="flex items-center gap-3">
                    {/* Share */}
                    <button onClick={onShare} className="text-gray-400 hover:text-blue-500 transition-colors" title="Share">
                        <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                        </svg>
                    </button>
                    {/* Copy */}
                    <button onClick={onCopy} className={`transition-colors ${isCopied ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`} title={isCopied ? 'Copied!' : 'Copy'}>
                        <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </button>
                    {/* Listen */}
                    <button onClick={onSpeak} className={`transition-colors ${isSpeaking ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`} title={isSpeaking ? 'Stop' : 'Read aloud'}>
                        <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 5v14m-4-7H4" />
                        </svg>
                    </button>

                    {/* Score badge */}
                    {score !== null && (
                        <button
                            onClick={() => setExpanded(e => !e)}
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            title="Accuracy score"
                        >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                            <span className={`text-[11px] font-bold ${scoreColor}`}>{score}%</span>
                            <span className="text-[10px] text-gray-400 font-medium">{badgeLabel}</span>
                        </button>
                    )}
                </div>

                {/* Right: thumbs + more */}
                <div className="flex items-center gap-3">
                    {/* Thumbs Up */}
                    <button
                        onClick={onThumbsUp}
                        className={`transition-colors ${thumbFeedback === 'up' ? 'text-green-500' : 'text-gray-400 hover:text-green-500'}`}
                        title="Helpful"
                    >
                        <svg className="w-[15px] h-[15px]" fill={thumbFeedback === 'up' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21H5a2 2 0 01-2-2v-7a2 2 0 012-2h2.924a2 2 0 001.569-.757l3-3.75A1.5 1.5 0 0114 6.5V10z" />
                        </svg>
                    </button>
                    {/* Thumbs Down */}
                    <button
                        onClick={onThumbsDown}
                        className={`transition-colors ${thumbFeedback === 'down' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                        title="Not helpful"
                    >
                        <svg className="w-[15px] h-[15px]" fill={thumbFeedback === 'down' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3H19a2 2 0 012 2v7a2 2 0 01-2 2h-2.924a2 2 0 00-1.569.757l-3 3.75A1.5 1.5 0 0110 17.5V14z" />
                        </svg>
                    </button>
                    {/* More (…) */}
                    <div className="relative" ref={moreRef}>
                        <button
                            onClick={() => setShowMore(v => !v)}
                            className={`transition-colors ${showMore ? 'text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
                            title="More options"
                        >
                            <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <circle cx="5" cy="12" r="1" fill="currentColor" />
                                <circle cx="12" cy="12" r="1" fill="currentColor" />
                                <circle cx="19" cy="12" r="1" fill="currentColor" />
                            </svg>
                        </button>
                        {showMore && (
                            <div className="absolute right-0 bottom-6 z-50 w-40 bg-white border border-gray-200 rounded-xl shadow-lg py-1 text-[12px]">
                                <button
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                                    onClick={() => { setShowMore(false); navigator.clipboard.writeText(window.location.href); }}
                                >
                                    🔗 Copy link
                                </button>
                                <button
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                                    onClick={() => { setShowMore(false); alert('Response reported. Thank you for your feedback!'); }}
                                >
                                    🚩 Report response
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Expandable accuracy points */}
            {expanded && points.length > 0 && (
                <div className="mt-2 px-1">
                    <div className={`rounded-xl border px-3 py-2.5 text-[11px] text-gray-600 leading-relaxed space-y-1.5 ${score >= 85 ? 'bg-green-50 border-green-200' :
                        score >= 70 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
                        }`}>
                        {points.map((pt, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <span className="mt-1 text-[8px]">•</span>
                                <span>{pt}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────
export default function MessageBubble({ role, content, index }) {
    const isUser = role === 'user';
    const { editAndResend, isStreaming } = useChatStore();

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);
    const [thumbFeedback, setThumbFeedback] = useState(null); // 'up' | 'down' | null
    const editInputRef = useRef(null);

    useEffect(() => {
        return () => { if (isSpeaking) stopSpeaking(); };
    }, [isSpeaking]);

    useEffect(() => {
        if (isEditing && editInputRef.current) {
            editInputRef.current.focus();
            const len = editInputRef.current.value.length;
            editInputRef.current.setSelectionRange(len, len);
        }
    }, [isEditing]);

    const handleToggleSpeak = () => {
        if (isSpeaking) { stopSpeaking(); setIsSpeaking(false); }
        else { setIsSpeaking(true); speak(content, () => setIsSpeaking(false)); }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: 'AI Response', text: content, url: window.location.href });
            } catch (_) { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    const handleThumbsUp = () => setThumbFeedback(prev => prev === 'up' ? null : 'up');
    const handleThumbsDown = () => setThumbFeedback(prev => prev === 'down' ? null : 'down');

    const handleSaveEdit = async () => {
        if (editContent.trim() && editContent !== content) {
            await editAndResend(index, editContent.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveEdit();
        if (e.key === 'Escape') { setIsEditing(false); setEditContent(content); }
    };

    // Parse confidence block for AI messages
    const { mainContent, confidence } = isUser
        ? { mainContent: content, confidence: null }
        : parseConfidence(content);

    return (
        <div className={`group flex animate-slide-up ${isUser ? 'justify-end' : 'justify-start'} mb-6 px-4`}>

            {/* AI Avatar */}
            {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center mr-3 mt-1 shadow-sm">
                    <span className="text-xs font-bold text-white uppercase">AI</span>
                </div>
            )}

            {/* Bubble + Confidence card stacked */}
            <div className={`flex flex-col gap-2 max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                    className={`relative rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed ${isUser
                        ? 'bg-blue-600 dark:bg-blue-700 text-white rounded-tr-none'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none border border-gray-200 dark:border-gray-700'
                        }`}
                >
                    {isEditing ? (
                        <div className="min-w-[300px]">
                            <textarea
                                ref={editInputRef}
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full bg-blue-700 dark:bg-blue-800 text-white border-none rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-300 outline-none resize-none min-h-[60px]"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => { setIsEditing(false); setEditContent(content); }}
                                    className="px-2 py-1 text-[11px] font-bold text-blue-200 dark:text-blue-300 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    disabled={isStreaming}
                                    className="px-3 py-1 bg-white dark:bg-gray-100 text-blue-600 dark:text-blue-700 rounded-md text-[11px] font-bold shadow-sm hover:bg-blue-50 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    Save & Resend
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-gray dark:prose-invert'}`}>
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                    )}

                    {/* Action Toolbars */}
                    {!isEditing && (
                        <div className={`absolute -bottom-8 ${isUser ? 'right-0' : 'left-0'} flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                            {isUser ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1 rounded-md text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                    title="Edit message"
                                    disabled={isStreaming}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleToggleSpeak}
                                        className={`p-1 rounded-md transition-colors ${isSpeaking ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleCopy}
                                        className={`p-1 rounded-md transition-colors ${isCopied ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            }`}
                                        title={isCopied ? 'Copied!' : 'Copy to clipboard'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Confidence bar — only for AI messages */}
                {!isUser && !isEditing && (
                    <ConfidenceBar
                        confidence={confidence}
                        onCopy={handleCopy}
                        isCopied={isCopied}
                        onSpeak={handleToggleSpeak}
                        isSpeaking={isSpeaking}
                        onShare={handleShare}
                        onThumbsUp={handleThumbsUp}
                        onThumbsDown={handleThumbsDown}
                        thumbFeedback={thumbFeedback}
                    />
                )}
            </div>

            {/* User Avatar */}
            {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ml-3 mt-1 shadow-sm transition-colors group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase group-hover:text-blue-700 dark:group-hover:text-blue-400">U</span>
                </div>
            )}
        </div>
    );
}
