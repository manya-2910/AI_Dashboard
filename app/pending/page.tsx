import Link from 'next/link';

export default function PendingPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
            <div className="max-w-md w-full px-4 text-center">
                <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-10 shadow-2xl">
                    <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Approval Pending</h1>
                    <p className="text-slate-400 leading-relaxed mb-2">
                        Your account has been created successfully. An administrator needs to approve your account before you can access the dashboard.
                    </p>
                    <p className="text-slate-500 text-sm mb-8">
                        Please check back later or contact your administrator.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 px-5 rounded-xl transition border border-slate-600"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
