'use client';

import React from 'react';
import { CreatorShell } from '../../components/CreatorShell';
import {
  Activity,
  ShieldCheck,
  Gift,
  Sparkles,
  TrendingUp,
  Headphones,
  CheckCircle2,
  Clock,
  MessageSquare,
  Award,
  Zap,
  Info
} from 'lucide-react';

export default function StreamingRoyaltiesPage() {
  const streamingThresholdNgn = 50000;
  const currentStreamingEarningsNgn = 38500;
  const streamingProgressPct = Math.min(100, Math.round((currentStreamingEarningsNgn / streamingThresholdNgn) * 100));
  const remainingNgn = streamingThresholdNgn - currentStreamingEarningsNgn;
  const isVerified = currentStreamingEarningsNgn >= streamingThresholdNgn;

  const streamTracks = [
    {
      id: 'st-1',
      title: 'Lagos Nights (Afrobeats Master)',
      genre: 'Afrobeats',
      totalPlays: 48200,
      completionRate: '88%',
      earnedNgn: 18200,
      rpmNgn: 377
    },
    {
      id: 'st-2',
      title: 'Piano Fever - Amapiano Stems',
      genre: 'Amapiano',
      totalPlays: 34900,
      completionRate: '82%',
      earnedNgn: 12400,
      rpmNgn: 355
    },
    {
      id: 'st-3',
      title: 'Midnight Drift Chill Hop',
      genre: 'Lo-Fi',
      totalPlays: 21100,
      completionRate: '79%',
      earnedNgn: 7900,
      rpmNgn: 374
    }
  ];

  return (
    <CreatorShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Streaming Royalties & Partner Verification
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Track free beat stream earnings and unlock the Verified Producer badge
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5" />
            <span>3-Month Promo Active</span>
          </span>
        </div>
      </div>

      {/* Main Verification Progress Card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Partner Milestone
              </span>
              {isVerified ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#2dd4bf]/20 border border-[#2dd4bf]/40 text-xs font-bold text-[#2dd4bf] flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Verified Producer Checkmark Active</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Verification Target in Reach ({streamingProgressPct}%)</span>
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mt-1.5">
              {isVerified ? 'You Are a Caution Verified Producer!' : 'Streaming Royalties Verification Threshold'}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Caution Studio verifies beatmakers who actively generate streaming engagement. Once your beats accumulate ₦50,000 in free stream royalties, your profile automatically receives the Verified Producer badge and opens direct artist collaboration chats.
            </p>
          </div>

          <div className="shrink-0 p-4 rounded-lg bg-zinc-950 border border-zinc-800 text-right md:text-left min-w-[180px]">
            <span className="text-[11px] font-mono text-zinc-400 block">Current Stream Royalties</span>
            <span className="text-2xl font-black font-mono text-[#2dd4bf] block mt-0.5">
              ₦{currentStreamingEarningsNgn.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-500 block font-mono">
              Goal: ₦{streamingThresholdNgn.toLocaleString()} (₦{remainingNgn.toLocaleString()} to go)
            </span>
          </div>
        </div>

        {/* Progress Bar & Badges */}
        <div className="mt-5 space-y-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-zinc-400">Milestone Progress</span>
            <span className="text-white font-bold">{streamingProgressPct}% Completed</span>
          </div>

          <div className="w-full h-3 rounded-full bg-zinc-950 overflow-hidden border border-zinc-800">
            <div
              className="h-full bg-gradient-to-r from-[#2dd4bf] via-emerald-400 to-teal-300 transition-all duration-500 rounded-full"
              style={{ width: `${streamingProgressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            <div className="p-3 rounded-md bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#2dd4bf] shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-zinc-200 block">Free Stream Royalty</span>
                <span className="text-zinc-500 text-[10px]">Earn from listener ad plays</span>
              </div>
            </div>

            <div className="p-3 rounded-md bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2.5">
              <Award className="h-4 w-4 text-[#2dd4bf] shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-zinc-200 block">Verified Badge</span>
                <span className="text-zinc-500 text-[10px]">Distinguishes from casual sellers</span>
              </div>
            </div>

            <div className="p-3 rounded-md bg-zinc-950/60 border border-zinc-800/80 flex items-center gap-2.5">
              <MessageSquare className="h-4 w-4 text-[#2dd4bf] shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-zinc-200 block">Direct Artist Chat</span>
                <span className="text-zinc-500 text-[10px]">Unlock custom studio bookings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Telemetry Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Stream Plays</span>
            <Headphones className="h-4 w-4 text-[#2dd4bf]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-white">104,200</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Across all web & mobile preview players</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Average Completion Rate</span>
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-white">83.4%</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">High listener retention rate</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Avg Royalty per 1k Streams</span>
            <Zap className="h-4 w-4 text-amber-300" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-white">₦369</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Pooled from listener subscriptions & ads</p>
        </div>
      </div>

      {/* Streaming Royalties by Track */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-1">Per-Track Stream Performance</h3>
        <p className="text-xs text-zinc-400 mb-4">Plays converted into naira royalties</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Track Title</th>
                <th className="py-2.5 px-3">Genre</th>
                <th className="py-2.5 px-3 text-center">Total Plays</th>
                <th className="py-2.5 px-3 text-center">Completion Rate</th>
                <th className="py-2.5 px-3 text-right">RPM (1k Plays)</th>
                <th className="py-2.5 px-3 text-right">Royalties Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
              {streamTracks.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-3 font-sans font-medium text-white">{row.title}</td>
                  <td className="py-3 px-3 font-sans text-zinc-400">{row.genre}</td>
                  <td className="py-3 px-3 text-center text-zinc-300">
                    {row.totalPlays.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-semibold">
                    {row.completionRate}
                  </td>
                  <td className="py-3 px-3 text-right text-zinc-400">
                    ₦{row.rpmNgn}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-[#2dd4bf]">
                    ₦{row.earnedNgn.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CreatorShell>
  );
}
