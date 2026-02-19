'use client';

import { useState, useEffect } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    approved: boolean;
    createdAt: string;
}

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        setLoading(true);
        const res = await fetch('/api/admin/users');
        if (res.ok) {
            const data = await res.json();
            setUsers(data.users);
        }
        setLoading(false);
    }

    async function handleApproval(userId: string, approved: boolean) {
        setActionLoading(userId);
        const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, approved }),
        });

        if (res.ok) {
            setUsers((prev) =>
                prev.map((u) => (u.id === userId ? { ...u, approved } : u))
            );
        }
        setActionLoading(null);
    }

    const filteredUsers = users.filter((u) => {
        if (filter === 'pending') return !u.approved;
        if (filter === 'approved') return u.approved;
        return true;
    });

    const pendingCount = users.filter((u) => !u.approved).length;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">⚙️</span>
                    <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
                    {pendingCount > 0 && (
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm px-2.5 py-0.5 rounded-full font-medium">
                            {pendingCount} pending
                        </span>
                    )}
                </div>
                <p className="text-slate-400">Manage user accounts and approvals.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total Users', value: users.length, color: 'sky' },
                    { label: 'Approved', value: users.filter((u) => u.approved).length, color: 'emerald' },
                    { label: 'Pending', value: pendingCount, color: 'amber' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
                        <p className="text-slate-400 text-sm">{stat.label}</p>
                        <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-5">
                {(['all', 'pending', 'approved'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${filter === f
                                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                : 'text-slate-400 hover:text-white bg-slate-800 border border-slate-700'
                            }`}
                    >
                        {f === 'all' ? `All (${users.length})` : f === 'pending' ? `Pending (${pendingCount})` : `Approved (${users.filter((u) => u.approved).length})`}
                    </button>
                ))}
                <button
                    onClick={fetchUsers}
                    className="ml-auto px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white bg-slate-800 border border-slate-700 transition flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-slate-500">Loading users...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-slate-500">No users found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50 bg-slate-800/50">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-800/30 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-gradient-to-br from-sky-600 to-violet-600 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                                                    {user.name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium text-sm">{user.name}</p>
                                                    <p className="text-slate-500 text-xs">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs px-2 py-0.5 rounded-md border ${user.role === 'admin'
                                                    ? 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                                                    : 'bg-slate-700 text-slate-400 border-slate-600'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${user.approved
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                <span>{user.approved ? '✓' : '⏳'}</span>
                                                {user.approved ? 'Approved' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleApproval(user.id, !user.approved)}
                                                    disabled={actionLoading === user.id}
                                                    className={`text-sm font-medium px-4 py-1.5 rounded-xl border transition disabled:opacity-50 ${user.approved
                                                            ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                                        }`}
                                                >
                                                    {actionLoading === user.id ? '...' : user.approved ? 'Revoke' : 'Approve'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
