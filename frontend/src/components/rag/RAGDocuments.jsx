import React, { useState } from 'react';
import {
    DocumentIcon,
    MagnifyingGlassIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';

const DocumentCard = ({ filename, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${active
                ? 'bg-blue-500/20 border-blue-500/40 ring-1 ring-blue-500/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
    >
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${active ? 'bg-blue-500/20' : 'bg-white/5'}`}>
                <DocumentIcon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-gray-500'}`} />
            </div>
            <span className="text-xs font-medium truncate max-w-[150px]">{filename}</span>
        </div>
        <ChevronRightIcon className={`w-3 h-3 transition-transform ${active ? 'rotate-90 text-blue-400' : 'text-gray-600'}`} />
    </button>
);

const RAGDocuments = ({ documents, chunks, onSearch }) => {
    const [selectedDoc, setSelectedDoc] = useState(null);

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-widest flex items-center gap-2">
                    <MagnifyingGlassIcon className="w-3 h-3" />
                    Neural Retrieval Transparency
                </h3>
                <span className="text-[9px] text-yellow-500/60 font-mono uppercase">Verified Sources</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                {/* Document List */}
                <div className="lg:col-span-1 space-y-2 overflow-y-auto custom-scrollbar pr-2">
                    {documents && documents.length > 0 ? (
                        documents.map((doc, i) => (
                            <DocumentCard
                                key={i}
                                filename={doc.filename}
                                active={selectedDoc === doc.filename}
                                onClick={() => {
                                    setSelectedDoc(doc.filename);
                                    onSearch(doc.filename);
                                }}
                            />
                        ))
                    ) : (
                        <div className="py-8 text-center border border-dashed border-white/10 rounded-xl opacity-40">
                            <p className="text-[10px] text-gray-500 italic">No documents indexed...</p>
                        </div>
                    )}
                </div>

                {/* Chunks Viewer */}
                <div className="lg:col-span-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                    <div className="px-4 py-2 border-b border-white/10 bg-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Retrieved Context Chunks</span>
                        {selectedDoc && (
                            <span className="text-[10px] text-blue-400 font-mono tracking-tight">{selectedDoc}</span>
                        )}
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                        {chunks && chunks.length > 0 ? (
                            chunks.map((c, i) => (
                                <div key={i} className="animate-in fade-in slide-in-from-left-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="bg-yellow-400/5 border-l-2 border-yellow-400/30 p-3 rounded-r-lg">
                                        <p className="text-xs text-gray-300 leading-relaxed font-mono">
                                            <span className="text-yellow-500 font-bold mr-2">CONTEXT_{i + 1}</span>
                                            {c.chunk}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-40 space-y-3">
                                <MagnifyingGlassIcon className="w-8 h-8" />
                                <p className="text-[10px] italic">Select a document to inspect retrieval pathways</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RAGDocuments;
