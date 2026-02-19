'use client';

import { useState } from 'react';

export default function YouTubePage() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ notes: string; transcriptLength: number } | null>(null);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setResult(null);
        setLoading(true);

        try {
            const res = await fetch('/api/youtube', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to process video.');
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
        <div className="p-8 max-w-4xl">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">🎥</span>
                    <h1 className="text-3xl font-bold text-white">YouTube AI Notes</h1>
                </div>
                <p className="text-slate-400">
                    Paste any YouTube URL to generate AI-powered summaries, key points, and study notes.
                </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="mb-8">
                <div className="flex gap-3">
                    <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        required
                        className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                    />
                    <button
                        type="submit"
                        disabled={loading || !url}
                        className="bg-gradient-to-r from-sky-500 to-violet-600 text-white font-semibold px-6 py-3 rounded-xl hover:from-sky-400 hover:to-violet-500 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-lg shadow-sky-500/20"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            'Generate Notes'
                        )}
                    </button>
                </div>
            </form>

            {/* Error */}
            {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-8 text-center">
                    <div className="w-12 h-12 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Extracting transcript and generating AI notes...</p>
                    <p className="text-slate-500 text-sm mt-1">This may take 10-30 seconds</p>
                </div>
            )}

            {/* Results */}
            {result && !loading && (
                <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-slate-700/50 bg-slate-800/50">
                        <h2 className="text-white font-semibold flex items-center gap-2">
                            <span>✨</span> AI-Generated Notes
                        </h2>
                        <span className="text-xs text-slate-500">
                            Transcript: {result.transcriptLength.toLocaleString()} chars
                        </span>
                    </div>
                    <div className="p-6 prose-dark max-h-[70vh] overflow-y-auto">
                        <div
                            className="text-slate-300 space-y-2"
                            dangerouslySetInnerHTML={{
                                __html: result.notes
                                    .replace(/^## (.*)/gm, '<h2 class="text-sky-400 text-xl font-semibold mt-6 mb-3">$1</h2>')
                                    .replace(/^### (.*)/gm, '<h3 class="text-sky-300 text-lg font-semibold mt-4 mb-2">$1</h3>')
                                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                                    .replace(/^- (.*)/gm, '<li class="ml-4 list-disc mb-1">$1</li>')
                                    .replace(/\n\n/g, '<br/><br/>'),
                            }}
                        />
                    </div>
                    <div className="p-4 border-t border-slate-700/50 flex justify-end">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(result.notes);
                            }}
                            className="text-sm text-slate-400 hover:text-white transition flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy to clipboard
                        </button>
                    </div>
                </div>
            )}

            {/* Tips */}
            {!result && !loading && !error && (
                <div className="bg-slate-900/50 border border-slate-700/30 rounded-2xl p-6">
                    <h3 className="text-slate-300 font-medium mb-3">💡 Tips</h3>
                    <ul className="space-y-2 text-sm text-slate-500">
                        <li>• Works best with educational, lecture, or tutorial videos</li>
                        <li>• The video must have captions (auto-generated or manual)</li>
                        <li>• Longer videos may take up to 30 seconds to process</li>
                        <li>• Notes are generated using Groq AI (llama-3.3-70b)</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
