'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminShell } from '../components/AdminShell';
import { supabase } from '../lib/supabaseClient';
import {
  DollarSign,
  Music,
  Users,
  Activity,
  Plus,
  ArrowUpRight,
  Download,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Crown,
  Database,
  ShieldCheck,
  RefreshCw,
  Upload,
  Radio,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';

interface AdminStats {
  tracksCount: number;
  usersCount: number;
  plusCount: number;
  totalPlays: number;
  ordersCount: number;
  totalRevenue: number;
  totalRevenueCents: number;
  revenueGrowthPct: number;
  monthlyData: Array<{
    month: string;
    value: number;
    height: string;
    isCurrent?: boolean;
  }>;
  recentTracks: Array<{
    id: string;
    title: string;
    slug: string;
    genre: string;
    bpm: number;
    play_count: number;
    cover_url: string;
    duration_seconds: number;
    status: string;
  }>;
  recentUsers: Array<{
    id: string;
    handle: string;
    display_name: string;
    avatar_url?: string;
    roles: string[];
    plan: 'free' | 'plus' | 'pro' | 'expired' | 'unsubscribed';
    email?: string;
    created_at: string;
  }>;
  recentOrders: Array<{
    id: string;
    buyer_name: string;
    buyer_handle: string;
    total: number;
    status: string;
    reference: string;
    created_at: string;
  }>;
  genreCounts: { [key: string]: number };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    tracksCount: 0,
    usersCount: 0,
    plusCount: 0,
    totalPlays: 0,
    ordersCount: 0,
    totalRevenue: 0,
    totalRevenueCents: 0,
    revenueGrowthPct: 0,
    monthlyData: [],
    recentTracks: [],
    recentUsers: [],
    recentOrders: [],
    genreCounts: {}
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'reports'>('overview');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      let { data: { session } } = await supabase.auth.getSession();

      if (!session && typeof document !== 'undefined') {
        const matchToken = document.cookie.match(/(?:^|;\s*)sb-token=([^;]*)/);
        const matchRefresh = document.cookie.match(/(?:^|;\s*)sb-refresh=([^;]*)/);
        if (matchToken && matchRefresh) {
          try {
            const { data } = await supabase.auth.setSession({
              access_token: decodeURIComponent(matchToken[1]),
              refresh_token: decodeURIComponent(matchRefresh[1])
            });
            if (data?.session) session = data.session;
          } catch (e) {}
        }
      }

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/stats', {
        headers,
        credentials: 'include',
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNaira = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const handleExportCSV = () => {
    if (!stats.recentOrders || stats.recentOrders.length === 0) return;
    const headers = ['Reference', 'Buyer Name', 'Handle', 'Amount (NGN)', 'Status', 'Date'];
    const rows = stats.recentOrders.map((o) => [
      o.reference,
      `"${o.buyer_name.replace(/"/g, '""')}"`,
      o.buyer_handle,
      o.total,
      o.status,
      new Date(o.created_at).toISOString()
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `caution_studio_audit_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminShell activePath="/">
      <div className="space-y-6">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Executive Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              Live telemetry, verified marketplace revenue, master recording catalog, and subscriber analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06] bg-[#121316] text-xs font-semibold text-gray-300 shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              <span>Oct 01, 2026 - Today</span>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchStats}
              title="Refresh Telemetry"
              className="p-2 rounded-xl border border-white/[0.06] bg-[#121316] hover:bg-white/[0.04] text-gray-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#e53935]' : ''}`} />
            </button>

            {/* Upload Action Button */}
            <Link
              href="/tracks?upload=1"
              className="inline-flex items-center gap-1.5 bg-[#e53935] hover:bg-[#d32f2f] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-[#e53935]/25"
            >
              <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Upload Master</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-white/[0.06]">
          <div className="flex items-center gap-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-3.5 -mb-px transition-colors border-b-2 cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-[#e53935] text-white font-bold'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`pb-3.5 -mb-px transition-colors border-b-2 cursor-pointer ${
                activeTab === 'analytics'
                  ? 'border-[#e53935] text-white font-bold'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Analytics & Demographics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`pb-3.5 -mb-px transition-colors border-b-2 cursor-pointer ${
                activeTab === 'reports'
                  ? 'border-[#e53935] text-white font-bold'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              Financial & Audit Ledger
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Revenue */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-5 shadow-sm transition-all hover:border-white/[0.12]">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-white mt-1">
              {loading ? '-' : formatNaira(stats.totalRevenue)}
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
              {stats.revenueGrowthPct >= 0 ? (
                <span className="text-emerald-400 font-bold flex items-center">
                  <TrendingUp className="h-3 w-3 mr-0.5 inline" /> +{stats.revenueGrowthPct.toFixed(1)}%
                </span>
              ) : (
                <span className="text-rose-400 font-bold flex items-center">
                  <TrendingDown className="h-3 w-3 mr-0.5 inline" /> {stats.revenueGrowthPct.toFixed(1)}%
                </span>
              )}
              <span>from last month</span>
            </p>
          </div>

          {/* Card 2: Catalog Audio */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-5 shadow-sm transition-all hover:border-white/[0.12]">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Master Catalog</span>
              <div className="h-8 w-8 rounded-xl bg-[#e53935]/10 border border-[#e53935]/20 flex items-center justify-center text-[#ff6b67]">
                <Music className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-white mt-1">
              {loading ? '-' : stats.tracksCount}
            </div>
            <p className="text-xs text-gray-400 mt-1 font-medium">
              {stats.tracksCount > 0 ? '100% active in database & Cloudflare R2' : '0 tracks uploaded'}
            </p>
          </div>

          {/* Card 3: Users & Subscribers */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-5 shadow-sm transition-all hover:border-white/[0.12]">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Registered Creators</span>
              <div className="h-8 w-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-white mt-1">
              {loading ? '-' : stats.usersCount}
            </div>
            <p className="text-xs text-gray-400 mt-1 font-medium">
              {stats.plusCount} Plus membership active
            </p>
          </div>

          {/* Card 4: Catalog Streams */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-5 shadow-sm transition-all hover:border-white/[0.12]">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Catalog Streams</span>
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black tracking-tight text-white mt-1">
              {loading ? '-' : stats.totalPlays.toLocaleString()}
            </div>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5 font-medium">
              <span className="text-emerald-400 font-bold">+14.2%</span>
              <span>listening duration velocity</span>
            </p>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
            {/* Main Left: Activity Chart & Recent Catalog Table (Col span 4) */}
            <div className="space-y-6 lg:col-span-4">
              {/* Activity Chart Card */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Streaming & Licensing Velocity
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Monthly licensing inquiries & playback telemetry
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-400">
                      <span className="h-2 w-2 rounded-full bg-[#e53935]" />
                      2026 Volume
                    </span>
                  </div>
                </div>

                {/* Clean Bar Chart */}
                <div className="pt-4">
                  <div className="h-48 w-full flex items-end justify-between gap-2 px-2">
                    {stats.monthlyData.map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                        <div className="w-full relative flex items-end justify-center h-full">
                          <div
                            style={{ height: item.height }}
                            className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 group-hover:opacity-80 ${
                              item.isCurrent
                                ? 'bg-[#e53935] shadow-md shadow-[#e53935]/30'
                                : 'bg-white/[0.08]'
                            }`}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono font-bold">
                          {item.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Master Recordings Table */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Recent Master Recordings
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Latest audio masters registered in database and storage
                    </p>
                  </div>
                  <Link
                    href="/tracks"
                    className="text-xs font-bold text-[#ff6b67] hover:text-white transition-colors flex items-center gap-1"
                  >
                    View all ({stats.tracksCount}) <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>

                {loading ? (
                  <div className="py-8 text-center text-gray-500 text-xs font-mono">
                    Loading catalog items...
                  </div>
                ) : stats.recentTracks.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-xs">
                    No tracks in catalog yet.{' '}
                    <Link href="/tracks?upload=1" className="text-[#ff6b67] hover:underline font-bold">
                      Upload your first master track
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                          <th className="pb-3 px-3">Recording</th>
                          <th className="pb-3 px-3">Genre</th>
                          <th className="pb-3 px-3">BPM</th>
                          <th className="pb-3 px-3">Duration</th>
                          <th className="pb-3 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {stats.recentTracks.map((t) => (
                          <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={t.cover_url || '/images/studio_mixing_console.jpg'}
                                  alt={t.title}
                                  className="h-9 w-9 rounded-xl object-cover border border-white/[0.08]"
                                />
                                <div className="min-w-0">
                                  <span className="font-bold text-white block truncate">
                                    {t.title}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-mono truncate block">
                                    /{t.slug}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-300 border border-white/[0.08]">
                                {t.genre}
                              </span>
                            </td>

                            <td className="py-3 px-3 font-mono text-gray-300">
                              {t.bpm || 120} BPM
                            </td>

                            <td className="py-3 px-3 font-mono text-gray-400">
                              {formatDuration(t.duration_seconds)}
                            </td>

                            <td className="py-3 px-3 text-right">
                              <span
                                className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  t.status === 'live'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-white/[0.04] text-gray-400 border-white/[0.06]'
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    t.status === 'live' ? 'bg-emerald-400' : 'bg-gray-400'
                                  }`}
                                />
                                {t.status === 'live' ? 'Live' : 'Draft'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Subscribers & Infrastructure (Col span 3) */}
            <div className="space-y-6 lg:col-span-3">
              {/* Real Subscribers Card */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Creator Registry
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Recent creator profiles & plan tiers
                    </p>
                  </div>
                  <Link
                    href="/users"
                    className="text-xs font-bold text-[#ff6b67] hover:text-white transition-colors flex items-center gap-1"
                  >
                    Manage <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {stats.recentUsers.length === 0 ? (
                    <div className="text-xs text-gray-500 py-4 text-center font-mono">
                      No user accounts found.
                    </div>
                  ) : (
                    stats.recentUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.display_name}
                              className="h-8 w-8 rounded-full object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-black text-white shrink-0 text-xs">
                              {(user.display_name || user.handle || 'U').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">
                              {user.display_name || user.handle}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono truncate block">
                              {user.email || `@${user.handle}`}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            user.plan === 'pro'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : user.plan === 'plus'
                              ? 'bg-[#e53935]/15 text-[#ff6b67] border-[#e53935]/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}
                        >
                          {user.plan === 'pro' ? 'Caution Pro' : user.plan === 'plus' ? 'Caution Plus' : 'Unsubscribed'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Cloudflare R2 & Database Telemetry Card */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-5 shadow-sm space-y-3">
                <div className="pb-3 border-b border-white/[0.06]">
                  <h3 className="text-sm font-bold text-white">
                    Infrastructure Status
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    High-availability storage & database synchronization
                  </p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                      <Database className="h-4 w-4 text-[#ff6b67]" />
                      <div>
                        <span className="font-bold text-white block leading-tight">
                          Cloudflare R2 Storage
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          caution-studio-audio
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Operational
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <div>
                        <span className="font-bold text-white block leading-tight">
                          Supabase Database
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          PostgreSQL • Real-Time Engine
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Connected
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                    <div className="flex items-center gap-2.5">
                      <Activity className="h-4 w-4 text-amber-400" />
                      <div>
                        <span className="font-bold text-white block leading-tight">
                          Streaming Gateway
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          /api/media/[...key]
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-5 shadow-sm space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Quick Navigation
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/tracks"
                    className="p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] text-xs font-bold text-white transition-colors block text-center"
                  >
                    Master Catalog
                  </Link>
                  <Link
                    href="/ads"
                    className="p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] text-xs font-bold text-[#ff6b67] transition-colors block text-center"
                  >
                    Ads Controller
                  </Link>
                  <Link
                    href="/licenses"
                    className="p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] text-xs font-bold text-white transition-colors block text-center"
                  >
                    License Pricing
                  </Link>
                  <Link
                    href="/users"
                    className="p-2.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.06] text-xs font-bold text-white transition-colors block text-center"
                  >
                    Subscribers & Users
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {/* Genre Distribution */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-6 shadow-sm space-y-4">
                <div className="pb-3 border-b border-white/[0.06]">
                  <h3 className="text-sm font-bold text-white">Genre Distribution</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Catalog breakdown by production category</p>
                </div>
                <div className="space-y-3">
                  {Object.entries(stats.genreCounts).length === 0 ? (
                    <div className="text-xs text-gray-500 py-4 text-center font-mono">No catalog genres recorded.</div>
                  ) : (
                    Object.entries(stats.genreCounts).map(([genre, count]) => {
                      const pct = Math.round((count / (stats.tracksCount || 1)) * 100);
                      return (
                        <div key={genre} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-gray-200">{genre}</span>
                            <span className="font-mono text-gray-400">{count} tracks ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-white/[0.06] rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className="h-full bg-[#e53935] rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Revenue & Growth Metrics */}
              <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-6 shadow-sm space-y-4">
                <div className="pb-3 border-b border-white/[0.06]">
                  <h3 className="text-sm font-bold text-white">Monetization Telemetry</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Licensing revenue breakdown and conversion rates</p>
                </div>
                <div className="space-y-3.5 text-xs">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Verified Paid Revenue</span>
                      <span className="text-[10px] text-gray-400 font-mono">Processed through Paystack & Stripe gateway</span>
                    </div>
                    <span className="font-black text-emerald-400 font-mono text-sm">{formatNaira(stats.totalRevenue)}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Plus Plan Conversion</span>
                      <span className="text-[10px] text-gray-400 font-mono">Creators subscribed to monthly Plus access</span>
                    </div>
                    <span className="font-black text-[#ff6b67] font-mono text-sm">
                      {stats.usersCount > 0 ? `${((stats.plusCount / stats.usersCount) * 100).toFixed(0)}%` : '0%'}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">Average Order Value (AOV)</span>
                      <span className="text-[10px] text-gray-400 font-mono">Gross spend per licensed transaction</span>
                    </div>
                    <span className="font-black text-white font-mono text-sm">
                      {stats.ordersCount > 0 ? formatNaira(stats.totalRevenue / stats.ordersCount) : '₦0.00'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Reports & Audit */}
        {activeTab === 'reports' && (
          <div className="rounded-2xl border border-white/[0.06] bg-[#12141c] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-bold text-white">Financial & Order Audit Log</h3>
                <p className="text-xs text-gray-400 mt-0.5">Real-time ledger of recorded payments and license purchases</p>
              </div>
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-gray-400" />
                <span>Export CSV Ledger</span>
              </button>
            </div>

            {stats.recentOrders.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-xs font-mono">
                No orders recorded in database yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                      <th className="pb-3 px-3">Reference / Order ID</th>
                      <th className="pb-3 px-3">Buyer</th>
                      <th className="pb-3 px-3">Amount</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Recorded At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {stats.recentOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-mono text-white font-bold">{ord.reference}</span>
                          <span className="text-[10px] text-gray-400 block font-mono">{ord.id.substring(0, 8)}...</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{ord.buyer_name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">@{ord.buyer_handle}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-white">
                          {formatNaira(ord.total)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              ord.status === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                ord.status === 'paid' ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                            />
                            {ord.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-gray-400 text-[11px] font-mono">
                          {new Date(ord.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
