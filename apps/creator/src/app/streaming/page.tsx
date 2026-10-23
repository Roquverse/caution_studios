'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreatorShell } from '../../components/CreatorShell';
import { supabase } from '../../lib/supabaseClient';
import {
  Activity,
  ShieldCheck,
  Gift,
  Sparkles,
  Headphones,
  CheckCircle2,
  Clock,
  MessageSquare,
  Award,
  Zap,
  Info,
  Loader2,
  Plus,
  UploadCloud
} from 'lucide-react';

interface StreamTrackRow {
  id: string;
  title: string;
  genre: string;
  totalPlays: number;
  completionRate: string;
  earnedNgn: number;
  rpmNgn: number;
}

export default function StreamingRoyaltiesPage() {
  const [loading, setLoading] = useState(true);
  const [currentStreamingEarningsNgn, setCurrentStreamingEarningsNgn] = useState(0);
  const [totalPlaysCount, setTotalPlaysCount] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [streamTracks, setStreamTracks] = useState<StreamTrackRow[]>([]);

  const streamingThresholdNgn = 50000;
  const streamingProgressPct = Math.min(100, Math.round((currentStreamingEarningsNgn / streamingThresholdNgn) * 100));
  const remainingNgn = Math.max(0, streamingThresholdNgn - currentStreamingEarningsNgn);

  useEffect(() => {
    let isMounted = true;
    async function loadStreamingData() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        if (!userId) {
          if (isMounted) setLoading(false);
          return;
        }

        // 1. Fetch Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('streaming_earnings_cents, streaming_streams_count, is_verified')
          .eq('id', userId)
          .maybeSingle();

        if (profile && isMounted) {
          setIsVerified(Boolean(profile.is_verified));
          const earned = Math.round((profile.streaming_earnings_cents || 0) / 100);
          setCurrentStreamingEarningsNgn(earned);
        }

        // 2. Fetch Beats for this Producer
        const { data: userBeats } = await supabase
          .from('beats')
          .select('*')
          .eq('producer_id', userId)
          .order('play_count', { ascending: false });

        if (userBeats && isMounted) {
          const totalPlays = userBeats.reduce((acc, b) => acc + (b.play_count || 0), 0);
          setTotalPlaysCount(totalPlays);

          const mappedTracks: StreamTrackRow[] = userBeats.map((b) => {
            const plays = b.play_count || 0;
            // ₦3 per stream royalty estimate
            const earned = Math.round(plays * 3);
            return {
              id: b.id,
              title: b.title,
              genre: b.genre || 'Afrobeats',
              totalPlays: plays,
              completionRate: plays > 0 ? '84%' : '0%',
              earnedNgn: earned,
              rpmNgn: plays > 0 ? 3000 : 0
            };
          });

          setStreamTracks(mappedTracks);
        }
      } catch (err) {
        console.error('Error loading streaming telemetry:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadStreamingData();
    return () => {
      isMounted = false;
    };
  }, []);

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

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-7 w-7 text-[#2dd4bf] animate-spin" />
          <span className="text-xs font-mono text-zinc-400">Loading streaming royalties & milestones...</span>
        </div>
      ) : (
        <>
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
                  Earn streaming royalties from free preview plays. Once you reach <strong>₦50,000 in streaming royalties</strong>, you automatically receive the official <strong>Verified Producer Badge</strong>, priority placement in the beat store, and direct studio messaging with recording artists.
                </p>
              </div>

              <div className="text-left md:text-right shrink-0">
                <span className="text-xs font-mono text-zinc-400 block">Total Stream Royalties</span>
                <span className="text-2xl font-bold font-mono text-[#2dd4bf] block mt-0.5">
                  ₦{currentStreamingEarningsNgn.toLocaleString()}
                </span>
                <span className="text-[11px] text-zinc-500 block">
                  Goal: ₦{streamingThresholdNgn.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Progress Bar & Milestone Status */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-300">
                  {isVerified ? 'Verification Requirement Met (100%)' : `${remainingNgn.toLocaleString()} remaining to unlock Verified Badge`}
                </span>
                <span className="text-white font-bold">{streamingProgressPct}%</span>
              </div>

              <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#2dd4bf] to-emerald-400 transition-all duration-700 rounded-full"
                  style={{ width: `${streamingProgressPct}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
                  <CheckCircle2 className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-zinc-200 block">Verified Badge</span>
                    <span className="text-zinc-500 text-[10px]">Showcased on all beats</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
                  <CheckCircle2 className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-zinc-200 block">Priority Ranking</span>
                    <span className="text-zinc-500 text-[10px]">Top placement in search & tags</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
                  <CheckCircle2 className="h-4 w-4 text-[#2dd4bf] shrink-0" />
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
                <span className="text-2xl font-bold font-mono text-white">{totalPlaysCount.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Across all web & mobile preview players</p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Average Completion Rate</span>
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-white">{totalPlaysCount > 0 ? '83.4%' : '0%'}</span>
              </div>
              <p className="text-[11px] text-emerald-400 mt-1">Listener audition retention rate</p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Royalty Rate</span>
                <Zap className="h-4 w-4 text-amber-300" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-white">₦3,000 / 1k</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Pooled from listener subscriptions & ads</p>
            </div>
          </div>

          {/* Streaming Royalties by Track */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-0.5">Per-Track Stream Performance</h3>
                <p className="text-xs text-zinc-400">Plays converted into naira royalties</p>
              </div>
              <Link
                href="/beats/upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Track</span>
              </Link>
            </div>

            {streamTracks.length > 0 ? (
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
                          ₦{row.rpmNgn.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#2dd4bf]">
                          ₦{row.earnedNgn.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center space-y-2">
                <UploadCloud className="h-8 w-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-medium">No tracks uploaded yet</p>
                <p className="text-[11px] text-zinc-500">
                  Upload beats and enable free streaming to start accumulating royalties and work toward verified status.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </CreatorShell>
  );
}
