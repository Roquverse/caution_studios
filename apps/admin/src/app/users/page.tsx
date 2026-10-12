'use client';

import React, { useState, useEffect } from 'react';
import { AdminShell } from '../../components/AdminShell';
import {
  Users,
  Crown,
  Search,
  RefreshCw,
  MoreHorizontal,
  Mail,
  Shield,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';

export interface UserProfile {
  id: string;
  handle: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  roles: string[];
  plan: 'free' | 'plus';
  email: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'plus'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlan = async (user: UserProfile) => {
    const nextPlan = user.plan === 'plus' ? 'free' : 'plus';
    try {
      setUpdatingId(user.id);
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: nextPlan })
      });

      if (res.ok) {
        setUsers(
          users.map((u) => (u.id === user.id ? { ...u, plan: nextPlan } : u))
        );
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update plan');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating plan');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleRole = async (user: UserProfile, role: string) => {
    let nextRoles: string[];
    if (user.roles.includes(role)) {
      nextRoles = user.roles.filter((r) => r !== role);
      if (nextRoles.length === 0) nextRoles = ['artist'];
    } else {
      nextRoles = [...user.roles, role];
    }

    try {
      setUpdatingId(user.id);
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: nextRoles })
      });

      if (res.ok) {
        setUsers(
          users.map((u) => (u.id === user.id ? { ...u, roles: nextRoles } : u))
        );
      }
    } catch (err) {
      console.error('Failed to update roles', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      u.handle.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.roles.some((r) => r.toLowerCase().includes(search.toLowerCase()));

    const matchesPlan = planFilter === 'all' || u.plan === planFilter;

    return matchesSearch && matchesPlan;
  });

  const plusCount = users.filter((u) => u.plan === 'plus').length;
  const freeCount = users.filter((u) => u.plan === 'free').length;

  return (
    <AdminShell activePath="/users">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Subscribers & Users
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Creator profiles, Caution Plus membership status, and role assignments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchUsers}
              className="p-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 transition-colors"
              title="Refresh User Registry"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xs">
            <span className="text-xs font-medium text-zinc-400 block">Total Accounts</span>
            <span className="text-2xl font-bold text-white tracking-tight mt-1 block">
              {users.length}
            </span>
            <span className="text-xs text-zinc-500 mt-1 block">All registered creator profiles</span>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xs">
            <span className="text-xs font-medium text-[#2dd4bf] block flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5" /> Plus Subscribers
            </span>
            <span className="text-2xl font-bold text-white tracking-tight mt-1 block">
              {plusCount}
            </span>
            <span className="text-xs text-zinc-500 mt-1 block">Unrestricted track streaming</span>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xs">
            <span className="text-xs font-medium text-zinc-400 block">Free Tier Users</span>
            <span className="text-2xl font-bold text-white tracking-tight mt-1 block">
              {freeCount}
            </span>
            <span className="text-xs text-zinc-500 mt-1 block">15-sec preview limit</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, handle, email..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-1.5 pl-8 pr-7 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPlanFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                planFilter === 'all'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setPlanFilter('plus')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                planFilter === 'plus'
                  ? 'bg-zinc-800 text-[#2dd4bf] font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Plus ({plusCount})
            </button>
            <button
              type="button"
              onClick={() => setPlanFilter('free')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                planFilter === 'free'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Free ({freeCount})
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User Profile</th>
                  <th className="py-3 px-4">Subscription Plan</th>
                  <th className="py-3 px-4">Roles</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Subscription Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-5 w-5 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-zinc-500">Loading user registry...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500">
                      <Users className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                      <p className="font-medium text-zinc-300">No matching users</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const isPlus = u.plan === 'plus';
                    const isUpdating = updatingId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                              {u.avatar_url ? (
                                <img
                                  src={u.avatar_url}
                                  alt={u.display_name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                u.display_name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-white block truncate">
                                {u.display_name}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono block truncate">
                                @{u.handle} • {u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {isPlus ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2dd4bf] bg-[#2dd4bf]/10 px-2.5 py-0.5 rounded-full border border-[#2dd4bf]/30">
                              <Crown className="h-3 w-3" /> Caution Plus
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-700">
                              Free Tier
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {u.roles.map((r) => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => handleToggleRole(u, r)}
                                className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60 hover:border-zinc-500 transition-colors capitalize"
                                title="Click to toggle role"
                              >
                                {r}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const newRole = u.roles.includes('producer') ? 'artist' : 'producer';
                                handleToggleRole(u, newRole);
                              }}
                              className="text-[10px] text-zinc-500 hover:text-zinc-300 ml-0.5"
                              title="Toggle producer/artist"
                            >
                              + toggle
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : 'N/A'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleTogglePlan(u)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-md border transition-all ${
                              isPlus
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                                : 'bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 border-none shadow-xs'
                            }`}
                          >
                            {isUpdating ? (
                              <div className="flex items-center gap-1.5">
                                <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                <span>Updating...</span>
                              </div>
                            ) : isPlus ? (
                              'Downgrade to Free'
                            ) : (
                              'Upgrade to Plus'
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
