'use client';

import { useState, useRef } from 'react';

interface QAResult {
    answer: string;
    snippets: string[];
    filename: string;
    totalChunks: number;
}

export default function DocumentsPage() {
    const [file, setFile] = useState<File | null>(null);
    const [question, setQuestion] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<QAResult | null>(null);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] || null;
        setFile(f);
        setResult(null);
        setError('');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!file || !question) return;

        setError('');
        setResult(null);
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('question', question);

            const res = await fetch('/api/document-qa', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to process document.');
                return;
            }

            setResult(data);
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    const fileSize = file ? (file.size / 1024 / 1024).toFixed(2) : null;

    return (
        <div className="p-8 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">📄</span>
                    <h1 className="text-3xl font-bold text-white">Document AI</h1>
                </div>
                <p className="text-slate-400">
                    Upload a PDF or TXT document, ask questions, and get precise AI-powered answers with source snippets.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* File Upload */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition ${file
                            ? 'border-sky-500/50 bg-sky-500/5'
                            : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    {file ? (
                        <div>
                            <div className="text-3xl mb-2">{file.name.endsWith('.pdf') ? '📕' : '📝'}</div>
                            <p className="text-white font-medium">{file.name}</p>
                            <p className="text-slate-500 text-sm mt-1">{fileSize} MB</p>
                            <p className="text-sky-400 text-sm mt-2">Click to change file</p>
                        </div>
                    ) : (
                        <div>
                            <div className="text-4xl mb-3">📂</div>
                            <p className="text-slate-300 font-medium">Drop your document here or click to browse</p>
                            <p className="text-slate-500 text-sm mt-1">PDF or TXT · Max 10MB</p>
                        </div>
                    )}
                </div>

                {/* Question Input */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Your Question
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="What is this document about? Who are the main authors?"
                            className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                        />
                        <button
                            type="submit"
                            disabled={loading || !file || !question}
                            className="bg-gradient-to-r from-sky-500 to-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-sky-400 hover:to-violet-500 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20 whitespace-nowrap"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Analyzing...
                                </span>
                            ) : (
                                'Ask AI'
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Error */}
            {error && (
                <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="mt-8 bg-slate-900 border border-slate-700/50 rounded-2xl p-8 text-center">
                    <div className="w-12 h-12 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Analyzing your document...</p>
                    <p className="text-slate-500 text-sm mt-1">Extracting text, finding relevant sections, and generating answer</p>
                </div>
            )}

            {/* Results */}
            {result && !loading && (
                <div className="mt-8 space-y-5">
                    {/* Answer */}
                    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
                        <div className="flex items-center gap-2 p-5 border-b border-slate-700/50 bg-slate-800/50">
                            <span>🤖</span>
                            <h2 className="text-white font-semibold">AI Answer</h2>
                            <span className="ml-auto text-xs text-slate-500">{result.totalChunks} chunks analyzed</span>
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

                    {/* Source Snippets */}
                    {result.snippets && result.snippets.length > 0 && (
                        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
                            <div className="flex items-center gap-2 p-5 border-b border-slate-700/50 bg-slate-800/50">
                                <span>📌</span>
                                <h2 className="text-white font-semibold">Relevant Document Snippets</h2>
                            </div>
                            <div className="p-5 space-y-3">
                                {result.snippets.map((snippet, i) => (
                                    <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
                                        <p className="text-xs text-slate-500 mb-2 font-medium">Snippet {i + 1} · {result.filename}</p>
                                        <p className="text-slate-300 text-sm leading-relaxed">{snippet}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
