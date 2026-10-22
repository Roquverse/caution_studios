'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CreatorShell } from '../components/CreatorShell';
import {
  DollarSign,
  Music,
  Activity,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Download,
  Gift,
  CheckCircle2,
  Clock,
  ArrowRight,
  Play,
  Pause,
  MessageSquare,
  FileCheck,
  CreditCard
} from 'lucide-react';

export default function CreatorDashboardPage() {
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Streaming verification metrics
  const streamingThresholdNgn = 50000;
  const currentStreamingEarningsNgn = 38500;
  const streamingProgressPct = Math.min(100, Math.round((currentStreamingEarningsNgn / streamingThresholdNgn) * 100));
  const isVerified = currentStreamingEarningsNgn >= streamingThresholdNgn;

  const monthlyData = [
    { month: 'May', value: 85000, height: '40%' },
    { month: 'Jun', value: 120000, height: '55%' },
    { month: 'Jul', value: 145000, height: '65%' },
    { month: 'Aug', value: 210000, height: '80%' },
    { month: 'Sep', value: 180000, height: '72%' },
    { month: 'Oct', value: 245000, height: '95%', isCurrent: true }
  ];

  const recentSales = [
    {
      id: 'ord-101',
      beat: 'Lagos Nights (Afrobeats Master)',
      buyer: '@david_soundz',
      tier: 'Exclusive Rights',
      amountNgn: 100000,
      payoutNgn: 80000,
      date: '2 hours ago',
      status: 'Paid'
    },
    {
      id: 'ord-102',
      beat: 'Piano Fever - Amapiano Stems',
      buyer: '@dj_kroma',
      tier: 'Premium Lease',
      amountNgn: 30000,
      payoutNgn: 24000,
      date: 'Yesterday',
      status: 'Paid'
    },
    {
      id: 'ord-103',
      beat: 'Midnight Drift Chill Hop',
      buyer: '@film_vlogs',
      tier: 'Starter Lease',
      amountNgn: 3000,
      payoutNgn: 2400,
      date: '3 days ago',
      status: 'Paid'
    },
    {
      id: 'ord-104',
      beat: 'Neon Overdrive Synthwave',
      buyer: '@tokyo_daze',
      tier: 'Premium Lease',
      amountNgn: 30000,
      payoutNgn: 24000,
      date: '5 days ago',
      status: 'Paid'
    }
  ];

  const topStreamingBeats = [
    {
      id: 'b-1',
      title: 'Lagos Nights (Afrobeats)',
      bpm: 105,
      genre: 'Afrobeats',
      streams: '48,200',
      earnedNgn: 18200,
      coverUrl: '/images/album_neon_dj.jpg'
    },
    {
      id: 'b-2',
      title: 'Piano Fever (Log Drum Mix)',
      bpm: 113,
      genre: 'Amapiano',
      streams: '34,900',
      earnedNgn: 12400,
      coverUrl: '/images/artist_studio_mic.jpg'
    },
    {
      id: 'b-3',
      title: 'Midnight Drift Chill Hop',
      bpm: 88,
      genre: 'Lo-Fi',
      streams: '21,100',
      earnedNgn: 7900,
      coverUrl: '/images/studio_mixing_console.jpg'
    }
  ];

  const togglePlay = (id: string) => {
    setPlayingId(playingId === id ? null : id);
  };

  return (
    <CreatorShell>
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#2dd4bf] animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Producer Portal // Caution Studio
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            Studio Dashboard
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time catalog performance, streaming royalties, and Paystack payout ledger
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/payouts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-xs font-semibold text-zinc-200 transition-colors"
          >
            <CreditCard className="h-3.5 w-3.5 text-[#2dd4bf]" />
            <span>Paystack Payouts</span>
          </Link>
          <Link
            href="/beats/upload"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-semibold transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Upload New Beat</span>
          </Link>
        </div>
      </div>

      {/* Promo & Verification Telemetry Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 3-Month Free Promo Status */}
        <div className="rounded-lg border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-zinc-900/80 to-zinc-950 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-md bg-amber-500/20 text-amber-300">
                <Gift className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  Producer Launch Promo
                </span>
                <span className="text-[10px] text-amber-300/90 font-mono">
                  PROMO: PRODUCER_3MO_FREE
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
              3 Months Free
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
            Zero subscription fees active. You keep 80% on all beat sales and earn royalties on all free streams.
          </p>
          <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-500">Trial Period:</span>
            <span className="text-amber-300 font-semibold">78 Days Remaining</span>
          </div>
        </div>

        {/* Free Beat Streaming Verification Progress */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                  Partner Verification
                </span>
                {isVerified ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#2dd4bf]/20 border border-[#2dd4bf]/40 text-[10px] font-bold text-[#2dd4bf] flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Verified Producer</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Verification In-Progress</span>
                  </span>
                )}
              </div>
              <div className="text-right sm:text-right">
                <span className="text-xs font-mono text-zinc-400">Current Royalties: </span>
                <span className="text-xs font-mono font-bold text-[#2dd4bf]">
                  ₦{currentStreamingEarningsNgn.toLocaleString()} / ₦{streamingThresholdNgn.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              Earn streaming royalties from free beat listening to qualify for the <strong className="text-zinc-200">Verified Producer</strong> checkmark and direct artist recording chat.
            </p>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-400">Milestone Progress</span>
              <span className="text-white font-bold">{streamingProgressPct}% Completed</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#2dd4bf] to-emerald-400 transition-all duration-500 rounded-full"
                style={{ width: `${streamingProgressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
              <span>Goal: ₦50,000 threshold</span>
              <Link href="/streaming" className="text-[#2dd4bf] hover:underline flex items-center gap-1">
                <span>View Stream Telemetry</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Net Earnings</span>
            <div className="p-1.5 rounded-md bg-[#2dd4bf]/10 text-[#2dd4bf]">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">₦730,000</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              <span>+38%</span>
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">80% creator take-home pay</p>
        </div>

        {/* Free Stream Royalties */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Streaming Royalties</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-300">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">₦38,500</span>
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              <span>+14%</span>
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">104,200 listener preview plays</p>
        </div>

        {/* Live Uploads */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Live Catalog Beats</span>
            <div className="p-1.5 rounded-md bg-zinc-800 text-zinc-300">
              <Music className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">18</span>
            <span className="text-xs text-zinc-400">active</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">2 beats sold exclusively</p>
        </div>

        {/* Licenses Sold */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Licenses Sold</span>
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-300">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">43</span>
            <span className="text-xs font-semibold text-purple-400">Total</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">32 Starter · 9 Premium · 2 Exclusive</p>
        </div>
      </div>

      {/* Earnings Graph & Analytics Card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-white">Monthly Sales & Royalty Payouts</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Estimated gross volume and net creator payouts</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-[#2dd4bf]" />
              <span>Net Payout (₦)</span>
            </span>
          </div>
        </div>

        <div className="pt-6">
          <div className="h-48 flex items-end justify-between gap-2 sm:gap-6 px-2">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="text-[10px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  ₦{(d.value / 1000).toFixed(0)}k
                </div>
                <div className="w-full bg-zinc-800/80 rounded-t-sm h-36 flex items-end p-1">
                  <div
                    className={`w-full rounded-t-xs transition-all duration-300 ${
                      d.isCurrent
                        ? 'bg-[#2dd4bf] group-hover:bg-[#20b8a4]'
                        : 'bg-zinc-700/80 group-hover:bg-zinc-600'
                    }`}
                    style={{ height: d.height }}
                  />
                </div>
                <span className={`text-xs font-mono ${d.isCurrent ? 'text-[#2dd4bf] font-bold' : 'text-zinc-500'}`}>
                  {d.month}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Sales & Top Streaming Beats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Beat Sales */}
        <div className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Beat Sales</h3>
              <p className="text-xs text-zinc-400">Orders placed by verified artists and content creators</p>
            </div>
            <Link href="/licenses" className="text-xs text-[#2dd4bf] hover:underline flex items-center gap-1">
              <span>All Licenses</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Beat</th>
                  <th className="py-2.5 px-3">Buyer</th>
                  <th className="py-2.5 px-3">License Tier</th>
                  <th className="py-2.5 px-3 text-right">Sale</th>
                  <th className="py-2.5 px-3 text-right">Your Cut (80%)</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-3 font-medium text-white max-w-[180px] truncate">
                      {sale.beat}
                    </td>
                    <td className="py-3 px-3 text-zinc-400 font-mono">{sale.buyer}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-[#2dd4bf] border border-zinc-700">
                        {sale.tier}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-400">
                      ₦{sale.amountNgn.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      ₦{sale.payoutNgn.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-zinc-500">{sale.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Streaming Beats */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Top Stream Earners</h3>
              <p className="text-xs text-zinc-400">Royalties from free preview listening</p>
            </div>
            <Link href="/streaming" className="text-xs text-[#2dd4bf] hover:underline">
              Details
            </Link>
          </div>

          <div className="mt-3 divide-y divide-zinc-800/60">
            {topStreamingBeats.map((beat) => (
              <div key={beat.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => togglePlay(beat.id)}
                    className="h-8 w-8 rounded bg-zinc-800 hover:bg-[#2dd4bf] hover:text-black flex items-center justify-center shrink-0 transition-colors text-zinc-300"
                  >
                    {playingId === beat.id ? (
                      <Pause className="h-3.5 w-3.5" />
                    ) : (
                      <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <span className="text-xs font-medium text-white block truncate">
                      {beat.title}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      {beat.bpm} BPM · {beat.genre} · {beat.streams} plays
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <span className="text-xs font-bold text-[#2dd4bf] block">
                    ₦{beat.earnedNgn.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">earned</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800">
            <Link
              href="/beats/upload"
              className="w-full py-2 px-3 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80 text-xs font-medium text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Upload Next Beat</span>
            </Link>
          </div>
        </div>
      </div>
    </CreatorShell>
  );
}
