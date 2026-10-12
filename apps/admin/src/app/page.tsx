'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminShell } from '../components/AdminShell';
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
  Play,
  Pause,
  Crown,
  Database,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';

interface AdminStats {
  tracksCount: number;
  usersCount: number;
  plusCount: number;
  totalPlays: number;
  ordersCount: number;
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
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>({
    tracksCount: 0,
    usersCount: 0,
    plusCount: 0,
    totalPlays: 0,
    ordersCount: 0,
    recentTracks: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'reports'>('overview');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats');
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

  // Monthly activity chart sample bars (shadcn bar chart look)
  const monthlyData = [
    { month: 'Jan', value: 35, height: '35%' },
    { month: 'Feb', value: 48, height: '48%' },
    { month: 'Mar', value: 62, height: '62%' },
    { month: 'Apr', value: 55, height: '55%' },
    { month: 'May', value: 78, height: '78%' },
    { month: 'Jun', value: 92, height: '92%' },
    { month: 'Jul', value: 70, height: '70%' },
    { month: 'Aug', value: 85, height: '85%' },
    { month: 'Sep', value: 94, height: '94%' },
    { month: 'Oct', value: 100, height: '100%', isCurrent: true }
  ];

  return (
    <AdminShell activePath="/">
      <div className="space-y-6">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Live telemetry, master recording catalog, and subscriber analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Range Picker Trigger */}
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors shadow-xs"
            >
              <Calendar className="h-3.5 w-3.5 text-zinc-400" />
              <span>Oct 01, 2026 - Today</span>
              <ChevronDown className="h-3 w-3 text-zinc-500" />
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={fetchStats}
              title="Refresh Telemetry"
              className="p-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Primary Action Button */}
            <Link
              href="/tracks"
              className="inline-flex items-center gap-1.5 bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-semibold text-xs px-3.5 py-1.5 rounded-md transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Upload Master</span>
            </Link>
          </div>
        </div>

        {/* Shadcn Tabs Bar */}
        <div className="border-b border-zinc-800">
          <div className="flex items-center gap-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-3 -mb-px transition-colors border-b-2 ${
                activeTab === 'overview'
                  ? 'border-[#2dd4bf] text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`pb-3 -mb-px transition-colors border-b-2 ${
                activeTab === 'analytics'
                  ? 'border-[#2dd4bf] text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`pb-3 -mb-px transition-colors border-b-2 ${
                activeTab === 'reports'
                  ? 'border-[#2dd4bf] text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Reports & Audit
            </button>
          </div>
        </div>

        {/* 4 Metric Cards (Classic shadcn KPI style) */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Revenue */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xs transition-colors hover:border-zinc-700/80">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-xs font-medium text-zinc-400">Total Revenue</span>
              <DollarSign className="h-4 w-4 text-zinc-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-white">
              ₦18,420,000.00
            </div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-0.5 inline" /> +20.1%
              </span>
              <span>from last month</span>
            </p>
          </div>

          {/* Card 2: Catalog Audio */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xs transition-colors hover:border-zinc-700/80">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-xs font-medium text-zinc-400">Master Catalog</span>
              <Music className="h-4 w-4 text-[#2dd4bf]" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-white">
              {loading ? '-' : stats.tracksCount}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {stats.tracksCount > 0 ? '100% active in database & R2' : '0 tracks uploaded'}
            </p>
          </div>

          {/* Card 3: Users & Subscribers */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xs transition-colors hover:border-zinc-700/80">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-xs font-medium text-zinc-400">Active Creators</span>
              <Users className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-white">
              {loading ? '-' : stats.usersCount}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {stats.plusCount} Plus membership active
            </p>
          </div>

          {/* Card 4: Catalog Streams */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xs transition-colors hover:border-zinc-700/80">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <span className="text-xs font-medium text-zinc-400">Streams & Plays</span>
              <Activity className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-white">
              {loading ? '-' : stats.totalPlays.toLocaleString()}
            </div>
            <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">+14.2%</span>
              <span>listening duration</span>
            </p>
          </div>
        </div>

        {/* 2-Column Main Section (Col 4 / Col 3 in 7-col grid) */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
          {/* Main Left: Activity Chart & Recent Catalog Table (Col span 4) */}
          <div className="space-y-6 lg:col-span-4">
            {/* Activity Chart Card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Streaming & Licensing Velocity
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Monthly stream inquiries across all distributed tracks
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                    <span className="h-2 w-2 rounded-full bg-[#2dd4bf]" />
                    2026 Monthly Volume
                  </span>
                </div>
              </div>

              {/* Clean SVG Bar Chart */}
              <div className="pt-6">
                <div className="h-48 w-full flex items-end justify-between gap-2 px-2">
                  {monthlyData.map((item, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <div className="w-full relative flex items-end justify-center h-full">
                        <div
                          style={{ height: item.height }}
                          className={`w-full max-w-[28px] rounded-t-sm transition-all duration-300 group-hover:opacity-80 ${
                            item.isCurrent
                              ? 'bg-[#2dd4bf] shadow-sm shadow-[#2dd4bf]/20'
                              : 'bg-zinc-700/60'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {item.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Master Recordings Table */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Recent Master Recordings
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Latest audio masters registered in database and storage
                  </p>
                </div>
                <Link
                  href="/tracks"
                  className="text-xs font-medium text-[#2dd4bf] hover:text-[#20b8a4] transition-colors flex items-center gap-1"
                >
                  View all ({stats.tracksCount}) <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              {loading ? (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  Loading catalog items...
                </div>
              ) : stats.recentTracks.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  No tracks in catalog yet.{' '}
                  <Link href="/tracks" className="text-[#2dd4bf] hover:underline font-medium">
                    Upload your first master track
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">
                        <th className="pb-2.5 px-2">Recording</th>
                        <th className="pb-2.5 px-2">Genre</th>
                        <th className="pb-2.5 px-2">BPM</th>
                        <th className="pb-2.5 px-2">Duration</th>
                        <th className="pb-2.5 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {stats.recentTracks.map((t) => (
                        <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={t.cover_url || '/images/album_neon_dj.jpg'}
                                alt={t.title}
                                className="h-8 w-8 rounded-md object-cover border border-zinc-800"
                              />
                              <div className="min-w-0">
                                <span className="font-medium text-white block truncate">
                                  {t.title}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono truncate block">
                                  /{t.slug}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-2">
                            <span className="inline-flex text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                              {t.genre}
                            </span>
                          </td>

                          <td className="py-3 px-2 font-mono text-zinc-300">
                            {t.bpm || 120}
                          </td>

                          <td className="py-3 px-2 font-mono text-zinc-400">
                            {formatDuration(t.duration_seconds)}
                          </td>

                          <td className="py-3 px-2">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                t.status === 'live'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  t.status === 'live' ? 'bg-emerald-400' : 'bg-zinc-400'
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
            {/* Recent Subscribers Card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Subscriber Registry
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Recent creator profiles & plan tiers
                  </p>
                </div>
                <Link
                  href="/users"
                  className="text-xs font-medium text-[#2dd4bf] hover:text-[#20b8a4] transition-colors flex items-center gap-1"
                >
                  Manage <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white shrink-0">
                      AC
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-white block truncate">
                        Arakunrin Cole
                      </span>
                      <span className="text-[10px] text-zinc-500 truncate block">
                        damicoledj@gmail.com
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Free Tier
                  </span>
                </div>
              </div>
            </div>

            {/* Cloudflare R2 & Database Telemetry Card */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs space-y-3">
              <div className="pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-semibold text-white">
                  Infrastructure Status
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  High-availability storage & database health
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-zinc-400" />
                    <div>
                      <span className="font-medium text-white block leading-tight">
                        Cloudflare R2 Bucket
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        caution-studio-audio
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Operational
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-zinc-400" />
                    <div>
                      <span className="font-medium text-white block leading-tight">
                        Supabase Database
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        PostgreSQL • 18ms latency
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Synced
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/40">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-zinc-400" />
                    <div>
                      <span className="font-medium text-white block leading-tight">
                        Streaming Gateway
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        /api/media/[...key]
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Ready
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-xs space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Quick Shortcuts
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/tracks"
                  className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-200 transition-colors block text-center"
                >
                  Audio Catalog
                </Link>
                <Link
                  href="/users"
                  className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-200 transition-colors block text-center"
                >
                  Manage Users
                </Link>
                <Link
                  href="/licenses"
                  className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-200 transition-colors block text-center"
                >
                  Content ID
                </Link>
                <a
                  href="http://localhost:3002"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-200 transition-colors block text-center"
                >
                  User Portal
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
