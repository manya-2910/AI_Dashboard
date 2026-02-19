'use client';

import { useState, useEffect, useRef } from 'react';

interface Document {
    id: string;
    filename: string;
    createdAt: string;
}

interface Workspace {
    id: string;
    name: string;
    documents: Document[];
    createdAt: string;
}

interface QAResult {
    answer: string;
    sources: {
        documents: string[];
        web: { url: string; title: string }[];
    };
    documentsSearched: number;
}

export default function WorkspacePage() {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [question, setQuestion] = useState('');
    const [useWebSearch, setUseWebSearch] = useState(true);
    const [loading, setLoading] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [result, setResult] = useState<QAResult | null>(null);
    const [error, setError] = useState('');
    const [creating, setCreating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchWorkspaces();
    }, []);

    async function fetchWorkspaces() {
        const res = await fetch('/api/workspace');
        if (res.ok) {
            const data = await res.json();
            setWorkspaces(data.workspaces);
        }
    }

    async function createWorkspace() {
        if (!newWorkspaceName.trim()) return;
        setCreating(true);
        const res = await fetch('/api/workspace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newWorkspaceName.trim() }),
        });
        if (res.ok) {
            const data = await res.json();
            setWorkspaces((prev) => [data.workspace, ...prev]);
            setNewWorkspaceName('');
        }
        setCreating(false);
    }

    async function uploadDocument(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !selectedWorkspace) return;

        setUploadLoading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`/api/workspace/${selectedWorkspace.id}/documents`, {
            method: 'POST',
            body: formData,
        });

        if (res.ok) {
            const data = await res.json();
            setSelectedWorkspace((prev) =>
                prev
                    ? { ...prev, documents: [data.document, ...prev.documents] }
                    : prev
            );
            setWorkspaces((prev) =>
                prev.map((w) =>
                    w.id === selectedWorkspace.id
                        ? { ...w, documents: [data.document, ...w.documents] }
                        : w
                )
            );
        } else {
            const data = await res.json();
            setError(data.error || 'Upload failed.');
        }

        setUploadLoading(false);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function askQuestion(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedWorkspace || !question) return;

        setError('');
        setResult(null);
        setLoading(true);

        try {
            const res = await fetch(`/api/workspace/${selectedWorkspace.id}/ask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, useWebSearch }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to get answer.');
                return;
            }
            setResult(data);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🗂️</span>
                    <h1 className="text-3xl font-bold text-white">AI Workspace</h1>
                </div>
                <p className="text-slate-400">
                    Create workspaces, upload multiple documents, and ask questions across all of them with deep web search.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Workspace List */}
                <div className="lg:col-span-1 space-y-4">
                    {/* Create Workspace */}
                    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
                        <h2 className="text-white font-semibold mb-3">New Workspace</h2>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newWorkspaceName}
                                onChange={(e) => setNewWorkspaceName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && createWorkspace()}
                                placeholder="Workspace name..."
                                className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                            />
                            <button
                                onClick={createWorkspace}
                                disabled={creating || !newWorkspaceName.trim()}
                                className="bg-sky-500 hover:bg-sky-400 text-white px-3 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
                            >
                                {creating ? '...' : 'Create'}
                            </button>
                        </div>
                    </div>

                    {/* Workspace List */}
                    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-slate-700/50">
                            <h2 className="text-white font-semibold text-sm">Your Workspaces</h2>
                        </div>
                        {workspaces.length === 0 ? (
                            <div className="p-6 text-center text-slate-500 text-sm">
                                No workspaces yet. Create one above.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-700/30">
                                {workspaces.map((ws) => (
                                    <button
                                        key={ws.id}
                                        onClick={() => {
                                            setSelectedWorkspace(ws);
                                            setResult(null);
                                            setError('');
                                        }}
                                        className={`w-full text-left px-4 py-3 hover:bg-slate-800 transition ${selectedWorkspace?.id === ws.id ? 'bg-slate-800 border-l-2 border-sky-500' : ''
                                            }`}
                                    >
                                        <p className="text-white text-sm font-medium truncate">{ws.name}</p>
                                        <p className="text-slate-500 text-xs mt-0.5">
                                            {ws.documents.length} document{ws.documents.length !== 1 ? 's' : ''}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Workspace Content */}
                <div className="lg:col-span-2 space-y-5">
                    {!selectedWorkspace ? (
                        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center">
                            <div className="text-5xl mb-4">🗂️</div>
                            <p className="text-slate-400">Select or create a workspace to get started</p>
                        </div>
                    ) : (
                        <>
                            {/* Workspace Header */}
                            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-white font-semibold text-lg">{selectedWorkspace.name}</h2>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadLoading}
                                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-sm px-3 py-2 rounded-xl transition disabled:opacity-50"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        {uploadLoading ? 'Uploading...' : 'Upload Document'}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.txt"
                                        onChange={uploadDocument}
                                        className="hidden"
                                    />
                                </div>

                                {/* Documents List */}
                                {selectedWorkspace.documents.length === 0 ? (
                                    <p className="text-slate-500 text-sm text-center py-4">
                                        No documents yet. Upload one to get started.
                                    </p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedWorkspace.documents.map((doc) => (
                                            <span
                                                key={doc.id}
                                                className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-300"
                                            >
                                                <span>{doc.filename.endsWith('.pdf') ? '📕' : '📝'}</span>
                                                {doc.filename}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Q&A Form */}
                            {selectedWorkspace.documents.length > 0 && (
                                <form onSubmit={askQuestion} className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
                                    <h3 className="text-white font-semibold mb-3">Ask a Question</h3>
                                    <textarea
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        placeholder={`Ask anything about the documents in "${selectedWorkspace.name}"...`}
                                        rows={3}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition resize-none mb-3"
                                    />
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                                            <div
                                                onClick={() => setUseWebSearch(!useWebSearch)}
                                                className={`relative w-10 h-5 rounded-full transition-colors ${useWebSearch ? 'bg-sky-500' : 'bg-slate-600'
                                                    }`}
                                            >
                                                <div
                                                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${useWebSearch ? 'translate-x-5' : 'translate-x-0.5'
                                                        }`}
                                                />
                                            </div>
                                            🌐 Deep Web Search (Firecrawl)
                                        </label>
                                        <button
                                            type="submit"
                                            disabled={loading || !question.trim()}
                                            className="bg-gradient-to-r from-sky-500 to-violet-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:from-sky-400 hover:to-violet-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20 text-sm"
                                        >
                                            {loading ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Searching...
                                                </span>
                                            ) : (
                                                'Ask AI'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                                    <strong>Error:</strong> {error}
                                </div>
                            )}

                            {/* Loading */}
                            {loading && (
                                <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-8 text-center">
                                    <div className="w-10 h-10 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-3" />
                                    <p className="text-slate-400 text-sm">
                                        Searching {selectedWorkspace.documents.length} document{selectedWorkspace.documents.length > 1 ? 's' : ''}
                                        {useWebSearch ? ' and the web' : ''}...
                                    </p>
                                </div>
                            )}

                            {/* Results */}
                            {result && !loading && (
                                <div className="space-y-4">
                                    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
                                        <div className="flex items-center gap-2 p-5 border-b border-slate-700/50 bg-slate-800/50">
                                            <span>🤖</span>
                                            <h2 className="text-white font-semibold">AI Answer</h2>
                                            <span className="ml-auto text-xs text-slate-500">
                                                {result.documentsSearched} doc{result.documentsSearched > 1 ? 's' : ''} searched
                                            </span>
                                        </div>
                                        <div className="p-6">
                                            <div
                                                className="text-slate-300 leading-relaxed"
                                                dangerouslySetInnerHTML={{
                                                    __html: result.answer
                                                        .replace(/^## (.*)/gm, '<h2 class="text-sky-400 text-xl font-semibold mt-4 mb-2">$1</h2>')
                                                        .replace(/^### (.*)/gm, '<h3 class="text-sky-300 text-lg font-semibold mt-3 mb-1">$1</h3>')
                                                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                                        .replace(/^- (.*)/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
                                                        .replace(/\n\n/g, '<p class="mb-3"></p>'),
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Sources */}
                                    {(result.sources.documents.length > 0 || result.sources.web.length > 0) && (
                                        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
                                            <h3 className="text-white font-semibold mb-3 text-sm">📚 Sources</h3>

                                            {result.sources.documents.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-xs text-slate-500 mb-2 font-medium">Documents</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {result.sources.documents.map((doc, i) => (
                                                            <span
                                                                key={i}
                                                                className="inline-flex items-center gap-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs px-2.5 py-1 rounded-lg"
                                                            >
                                                                📄 {doc}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {result.sources.web.length > 0 && (
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-2 font-medium">Web Sources</p>
                                                    <div className="space-y-1">
                                                        {result.sources.web.map((source, i) => (
                                                            <a
                                                                key={i}
                                                                href={source.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 text-xs text-violet-400 hover:text-violet-300 transition truncate"
                                                            >
                                                                <span>🌐</span>
                                                                <span className="truncate">{source.title || source.url}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
