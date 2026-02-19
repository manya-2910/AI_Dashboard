import { getSession } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

export default async function DashboardHome() {
    const session = await getSession();

    const stats = {
        workspaces: 0,
        documents: 0,
        totalUsers: 0,
    };

    if (session) {
        const [workspaces, documents] = await Promise.all([
            prisma.workspace.count({ where: { userId: session.userId } }),
            prisma.document.count({
                where: { workspace: { userId: session.userId } },
            }),
        ]);

        stats.workspaces = workspaces;
        stats.documents = documents;

        if (session.role === 'admin') {
            stats.totalUsers = await prisma.user.count();
        }
    }

    const tools = [
        {
            title: 'YouTube AI Notes',
            description: 'Paste any YouTube link to get AI-generated summaries, key points, and structured study notes.',
            icon: '🎥',
            href: '/dashboard/youtube',
            gradient: 'from-red-500/20 to-orange-500/20',
            border: 'border-red-500/20',
        },
        {
            title: 'Document AI',
            description: 'Upload PDF or TXT documents and ask questions. Get precise answers with source snippets.',
            icon: '📄',
            href: '/dashboard/documents',
            gradient: 'from-sky-500/20 to-blue-500/20',
            border: 'border-sky-500/20',
        },
        {
            title: 'AI Workspace',
            description: 'Create workspaces, upload multiple documents, and ask questions across all of them with web search.',
            icon: '🗂️',
            href: '/dashboard/workspace',
            gradient: 'from-violet-500/20 to-purple-500/20',
            border: 'border-violet-500/20',
        },
    ];

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">
                    Welcome back! 👋
                </h1>
                <p className="text-slate-400 mt-1">
                    Your AI-powered research and learning workspace
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Workspaces</p>
                            <p className="text-3xl font-bold text-white mt-1">{stats.workspaces}</p>
                        </div>
                        <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center text-2xl">🗂️</div>
                    </div>
                </div>
                <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Documents</p>
                            <p className="text-3xl font-bold text-white mt-1">{stats.documents}</p>
                        </div>
                        <div className="w-12 h-12 bg-sky-500/10 rounded-xl flex items-center justify-center text-2xl">📄</div>
                    </div>
                </div>
                {session?.role === 'admin' && (
                    <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Total Users</p>
                                <p className="text-3xl font-bold text-white mt-1">{stats.totalUsers}</p>
                            </div>
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-2xl">👥</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tools Grid */}
            <h2 className="text-xl font-semibold text-white mb-4">AI Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {tools.map((tool) => (
                    <a
                        key={tool.href}
                        href={tool.href}
                        className={`group block bg-gradient-to-br ${tool.gradient} border ${tool.border} rounded-2xl p-6 hover:scale-[1.02] transition-all duration-200 hover:shadow-lg`}
                    >
                        <div className="text-3xl mb-3">{tool.icon}</div>
                        <h3 className="font-semibold text-white text-lg mb-2">{tool.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{tool.description}</p>
                        <div className="mt-4 flex items-center text-sm text-sky-400 group-hover:text-sky-300 transition">
                            Open tool
                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </a>
                ))}
            </div>

            {/* Getting Started */}
            <div className="mt-10 bg-gradient-to-r from-sky-500/10 to-violet-500/10 border border-sky-500/20 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-2">🚀 Getting Started</h3>
                <ul className="space-y-1.5 text-sm text-slate-400">
                    <li>1. Use <strong className="text-white">YouTube AI Notes</strong> to summarize any video with captions</li>
                    <li>2. Upload a document to <strong className="text-white">Document AI</strong> and ask questions about it</li>
                    <li>3. Create an <strong className="text-white">AI Workspace</strong> for multi-document research with web search</li>
                </ul>
            </div>
        </div>
    );
}
