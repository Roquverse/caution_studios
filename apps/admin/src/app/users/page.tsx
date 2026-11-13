'use client';

import React, { useState, useEffect } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { supabase } from '../../lib/supabaseClient';
import {
  Users,
  Crown,
  Search,
  RefreshCw,
  Mail,
  Shield,
  CheckCircle2,
  Calendar,
  X,
  Sliders,
  Mic2,
  ShieldCheck,
  ChevronDown,
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  Wand2,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';

export interface UserProfile {
  id: string;
  handle: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  roles: string[];
  primary_role?: string;
  plan: 'free' | 'plus';
  email: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'plus'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'artist' | 'producer' | 'admin'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Password Update Modal State
  const [passwordModalUser, setPasswordModalUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/users', { headers, cache: 'no-store' });
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
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ plan: nextPlan })
      });

      if (res.ok) {
        setUsers(
          users.map((u) => (u.id === user.id ? { ...u, plan: nextPlan } : u))
        );
        showToast(`Subscription plan updated to ${nextPlan.toUpperCase()} for ${user.display_name}`);
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

  const handleUpdateRole = async (user: UserProfile, newRole: 'artist' | 'producer' | 'admin') => {
    try {
      setUpdatingId(user.id);
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        const newRoles =
          newRole === 'admin'
            ? ['admin', 'producer', 'artist']
            : newRole === 'producer'
            ? ['producer', 'artist']
            : ['artist'];

        setUsers(
          users.map((u) =>
            u.id === user.id
              ? {
                  ...u,
                  primary_role: newRole,
                  roles: newRoles
                }
              : u
          )
        );
        showToast(`Role updated to ${newRole.toUpperCase()} for ${user.display_name}`);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update role');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating role');
    } finally {
      setUpdatingId(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenPasswordModal = (user: UserProfile) => {
    setPasswordModalUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setPasswordError(null);
    setPasswordCopied(false);
  };

  const handleClosePasswordModal = () => {
    if (passwordSaving) return;
    setPasswordModalUser(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  };

  const generateStrongPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*';
    let generated = '';
    for (let i = 0; i < 14; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    setPasswordError(null);

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(generated).then(() => {
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 3000);
      });
    }
  };

  const handleCopyPassword = () => {
    if (!newPassword) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(newPassword).then(() => {
        setPasswordCopied(true);
        setTimeout(() => setPasswordCopied(false), 3000);
      });
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;

    const trimmed = newPassword.trim();
    if (trimmed.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (trimmed !== confirmPassword.trim()) {
      setPasswordError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/users/${passwordModalUser.id}/password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ password: trimmed })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user password');
      }

      const userName = passwordModalUser.display_name || passwordModalUser.email;
      showToast(`Password successfully updated for ${userName}!`);
      handleClosePasswordModal();
    } catch (err: any) {
      setPasswordError(err.message || 'An error occurred while saving the password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const getEffectiveRole = (u: UserProfile): 'admin' | 'producer' | 'artist' => {
    if (u.primary_role === 'admin' || (u.roles && u.roles.includes('admin'))) return 'admin';
    if (u.primary_role === 'producer' || (u.roles && u.roles.includes('producer'))) return 'producer';
    return 'artist';
  };

  const filtered = users.filter((u) => {
    const effectiveRole = getEffectiveRole(u);

    const matchesSearch =
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      u.handle.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      effectiveRole.includes(search.toLowerCase());

    const matchesPlan = planFilter === 'all' || u.plan === planFilter;
    const matchesRole = roleFilter === 'all' || effectiveRole === roleFilter;

    return matchesSearch && matchesPlan && matchesRole;
  });

  const plusCount = users.filter((u) => u.plan === 'plus').length;
  const freeCount = users.filter((u) => u.plan === 'free').length;
  const producerCount = users.filter((u) => getEffectiveRole(u) === 'producer').length;
  const artistCount = users.filter((u) => getEffectiveRole(u) === 'artist').length;
  const adminCount = users.filter((u) => getEffectiveRole(u) === 'admin').length;

  return (
    <AdminShell activePath="/users">
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-4 rounded-xl bg-[#04564f]/40 border border-[#2dd4bf]/50 text-white flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-[#2dd4bf] shrink-0" />
              <span className="text-xs font-semibold text-[#2dd4bf]">
                {toastMessage}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Subscribers & Users
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Creator profiles, producers, passwords, membership status, and role assignments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchUsers}
              className="p-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
              title="Refresh User Registry"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xs">
            <span className="text-xs font-medium text-zinc-400 block">Total Accounts</span>
            <span className="text-2xl font-bold text-white tracking-tight mt-1 block">
              {users.length}
            </span>
            <span className="text-xs text-zinc-500 mt-1 block">All registered user profiles</span>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xs">
            <span className="text-xs font-medium text-amber-400 block flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5" /> Music Producers
            </span>
            <span className="text-2xl font-bold text-white tracking-tight mt-1 block">
              {producerCount}
            </span>
            <span className="text-xs text-zinc-500 mt-1 block">Creator Studio access cleared</span>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xs">
            <span className="text-xs font-medium text-sky-400 block flex items-center gap-1.5">
              <Mic2 className="h-3.5 w-3.5" /> Recording Artists
            </span>
            <span className="text-2xl font-bold text-white tracking-tight mt-1 block">
              {artistCount}
            </span>
            <span className="text-xs text-zinc-500 mt-1 block">Commercial buyers & listeners</span>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xs">
            <span className="text-xs font-medium text-[#2dd4bf] block flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Administrators
            </span>
            <span className="text-2xl font-bold text-white tracking-tight mt-1 block">
              {adminCount}
            </span>
            <span className="text-xs text-zinc-500 mt-1 block">Executive dashboard access</span>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
          <div className="relative w-full lg:w-72">
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

          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter Chips */}
            <div className="flex items-center gap-1 border-r border-zinc-800 pr-2 mr-1">
              <span className="text-[10px] uppercase font-mono text-zinc-500 mr-1 hidden sm:inline">Role:</span>
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  roleFilter === 'all'
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('producer')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  roleFilter === 'producer'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Producers ({producerCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('artist')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  roleFilter === 'artist'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Artists ({artistCount})
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  roleFilter === 'admin'
                    ? 'bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/40 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Admins ({adminCount})
              </button>
            </div>

            {/* Plan Filter */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPlanFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  planFilter === 'all'
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All Plans
              </button>
              <button
                type="button"
                onClick={() => setPlanFilter('plus')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
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
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  planFilter === 'free'
                    ? 'bg-zinc-800 text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Free ({freeCount})
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">User Profile</th>
                  <th className="py-3 px-4">Role Management</th>
                  <th className="py-3 px-4">Subscription Plan</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Account Actions</th>
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
                      <p className="font-medium text-zinc-300">No matching users found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const isPlus = u.plan === 'plus';
                    const isUpdating = updatingId === u.id;
                    const effectiveRole = getEffectiveRole(u);

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

                        {/* Interactive Role Assignment */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {effectiveRole === 'admin' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2dd4bf] bg-[#2dd4bf]/10 px-2.5 py-0.5 rounded-md border border-[#2dd4bf]/30">
                                <ShieldCheck className="h-3 w-3" /> Admin
                              </span>
                            ) : effectiveRole === 'producer' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                                <Sliders className="h-3 w-3" /> Producer
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-300 bg-sky-500/10 px-2.5 py-0.5 rounded-md border border-sky-500/30">
                                <Mic2 className="h-3 w-3" /> Artist
                              </span>
                            )}

                            {/* Dropdown to change role */}
                            <div className="relative inline-block">
                              <select
                                disabled={isUpdating}
                                value={effectiveRole}
                                onChange={(e) =>
                                  handleUpdateRole(u, e.target.value as 'artist' | 'producer' | 'admin')
                                }
                                className="bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 text-[11px] rounded px-2 py-0.5 pr-6 cursor-pointer focus:outline-none focus:border-[#2dd4bf] appearance-none disabled:opacity-50"
                                title="Change user role"
                              >
                                <option value="artist">Role: Artist</option>
                                <option value="producer">Role: Producer</option>
                                <option value="admin">Role: Admin</option>
                              </select>
                              <ChevronDown className="h-3 w-3 text-zinc-400 absolute right-1.5 top-1.5 pointer-events-none" />
                            </div>

                            {isUpdating && (
                              <Loader2 className="h-3.5 w-3.5 text-[#2dd4bf] animate-spin shrink-0" />
                            )}
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

                        <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : 'N/A'}
                        </td>

                        {/* Actions: Update Password + Subscription Toggle */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Update Password Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenPasswordModal(u)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-md border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                              title={`Update password for ${u.display_name}`}
                            >
                              <KeyRound className="h-3.5 w-3.5 text-[#2dd4bf]" />
                              <span>Password</span>
                            </button>

                            {/* Plan Toggle Button */}
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleTogglePlan(u)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-md border transition-all cursor-pointer ${
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
                                'Downgrade'
                              ) : (
                                'Upgrade to Plus'
                              )}
                            </button>
                          </div>
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

      {/* ADMIN PASSWORD UPDATE MODAL */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-[#121316] border border-zinc-800 p-6 shadow-2xl text-white space-y-5 animate-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClosePasswordModal}
              disabled={passwordSaving}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-full bg-zinc-800/60 hover:bg-zinc-800 transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#04564f]/40 border border-[#2dd4bf]/40 flex items-center justify-center text-[#2dd4bf] shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 pr-6">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Update Account Password
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">
                  Set a new secure password for <span className="text-white font-medium">{passwordModalUser.display_name}</span>
                </p>
              </div>
            </div>

            {/* User Details Badge */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-xs font-semibold text-white block truncate">
                  {passwordModalUser.email}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono block">
                  @{passwordModalUser.handle}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                getEffectiveRole(passwordModalUser) === 'admin'
                  ? 'bg-[#2dd4bf]/10 text-[#2dd4bf] border border-[#2dd4bf]/30'
                  : getEffectiveRole(passwordModalUser) === 'producer'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                  : 'bg-sky-500/10 text-sky-300 border border-sky-500/30'
              }`}>
                {getEffectiveRole(passwordModalUser)}
              </span>
            </div>

            {/* Error Message */}
            {passwordError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 flex items-center gap-2 text-xs">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Password Form */}
            <form onSubmit={handleSavePassword} className="space-y-4">
              {/* New Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-[11px] text-[#2dd4bf] hover:text-[#20b8a4] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <Wand2 className="h-3 w-3" />
                    <span>Generate Strong</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Enter at least 6 characters"
                    required
                    minLength={6}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2dd4bf] pr-20 font-mono"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    {newPassword && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                        title="Copy password"
                      >
                        {passwordCopied ? (
                          <Check className="h-3.5 w-3.5 text-[#2dd4bf]" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                {passwordCopied && (
                  <span className="text-[10px] text-[#2dd4bf] font-medium mt-1 block">
                    ✓ Password copied to clipboard!
                  </span>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="Re-enter password to confirm"
                  required
                  minLength={6}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2dd4bf] font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed">
                Updating this password takes effect immediately in Supabase Auth. The user/producer can immediately log in with their new credentials.
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleClosePasswordModal}
                  disabled={passwordSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving || !newPassword || newPassword.length < 6}
                  className="px-5 py-2 rounded-xl bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-[#2dd4bf]/40 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {passwordSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-3.5 w-3.5" />
                      <span>Save Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
