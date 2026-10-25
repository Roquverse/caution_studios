'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreatorShell } from '../../components/CreatorShell';
import { supabase } from '../../lib/supabaseClient';
import {
  ShieldCheck,
  Gift,
  Sparkles,
  Download,
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

interface DownloadTrackRow {
  id: string;
  title: string;
  genre: string;
  downloads: number;
  progressPct: number;
  earnedNgn: number;
}

export default function StreamingRoyaltiesPage() {
  const [loading, setLoading] = useState(true);
  const [totalDownloadsCount, setTotalDownloadsCount] = useState(0);
  const [rewardAmountNgn, setRewardAmountNgn] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [downloadTracks, setDownloadTracks] = useState<DownloadTrackRow[]>([]);

  const downloadThreshold = 10000;
  const downloadProgressPct = Math.min(
    100,
    Math.round((totalDownloadsCount / downloadThreshold) * 100)
  );
  const remainingDownloads = Math.max(0, downloadThreshold - totalDownloadsCount);

  useEffect(() => {
    let isMounted = true;
    async function loadDownloadsData() {
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
          .select('is_verified')
          .eq('id', userId)
          .maybeSingle();

        if (profile && isMounted) {
          setIsVerified(Boolean(profile.is_verified));
        }

        // 2. Fetch Beats for this Producer
        const { data: userBeats } = await supabase
          .from('beats')
          .select('*')
          .eq('producer_id', userId)
          .order('play_count', { ascending: false });

        if (userBeats && isMounted) {
          const totalDownloads = userBeats.reduce(
            (acc, b) => acc + (b.free_commercial_downloads_count || b.download_count || 0),
            0
          );
          setTotalDownloadsCount(totalDownloads);
          const computedReward = Math.floor(totalDownloads / 10000) * 30000;
          setRewardAmountNgn(computedReward);

          // Check producer download incentives table
          const { data: incentiveRows } = await supabase
            .from('producer_download_incentives')
            .select('reward_amount_ngn, qualifying_downloads')
            .eq('producer_id', userId);

          if (incentiveRows && incentiveRows.length > 0) {
            const incReward = incentiveRows.reduce((acc, r) => acc + Number(r.reward_amount_ngn || 0), 0);
            const incDownloads = incentiveRows.reduce((acc, r) => acc + Number(r.qualifying_downloads || 0), 0);
            if (incReward > computedReward) setRewardAmountNgn(incReward);
            if (incDownloads > totalDownloads) setTotalDownloadsCount(incDownloads);
          }

          const mappedTracks: DownloadTrackRow[] = userBeats.map((b) => {
            const dl = b.free_commercial_downloads_count || b.download_count || 0;
            const progress = Math.min(100, Math.round((dl / 10000) * 100));
            const earned = Math.floor(dl / 10000) * 30000;
            return {
              id: b.id,
              title: b.title,
              genre: b.genre || 'Afrobeats',
              downloads: dl,
              progressPct: progress,
              earnedNgn: earned
            };
          });

          setDownloadTracks(mappedTracks);
        }
      } catch (err) {
        console.error('Error loading downloads telemetry:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDownloadsData();
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
            Beat Download Incentives &amp; Partner Verification
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Track qualifying beat downloads and unlock the ₦30,000 reward per 10k downloads &amp; Verified Producer badge
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5" />
            <span>₦30,000 / 10k Downloads Active</span>
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-7 w-7 text-[#2dd4bf] animate-spin" />
          <span className="text-xs font-mono text-zinc-400">Loading download telemetry &amp; milestones...</span>
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
                      <span>Verification Target in Reach ({downloadProgressPct}%)</span>
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white mt-1.5">
                  {isVerified ? 'You Are a Caution Verified Producer!' : '10,000 Downloads Verification Threshold'}
                </h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Earn <strong>₦30,000 in royalties per 10,000 qualifying beat downloads</strong>. Once you reach 10,000 downloads, you unlock the ₦30,000 reward, the official <strong>Verified Producer Badge</strong>, priority placement in the beat store, and direct studio messaging with recording artists.
                </p>
              </div>

              <div className="text-left md:text-right shrink-0">
                <span className="text-xs font-mono text-zinc-400 block">Total Beat Downloads</span>
                <span className="text-2xl font-bold font-mono text-[#2dd4bf] block mt-0.5">
                  {totalDownloadsCount.toLocaleString()}
                </span>
                <span className="text-[11px] text-zinc-500 block">
                  Goal: {downloadThreshold.toLocaleString()} downloads
                </span>
              </div>
            </div>

            {/* Progress Bar & Milestone Status */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-300">
                  {isVerified || totalDownloadsCount >= downloadThreshold
                    ? '10,000 Downloads Milestone Reached (100%)'
                    : `${remainingDownloads.toLocaleString()} downloads remaining to unlock ₦30,000 reward & Verified Badge`}
                </span>
                <span className="text-white font-bold">{downloadProgressPct}%</span>
              </div>

              <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#2dd4bf] to-emerald-400 transition-all duration-700 rounded-full"
                  style={{ width: `${downloadProgressPct}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
                  <CheckCircle2 className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-zinc-200 block">₦30,000 Cash Reward</span>
                    <span className="text-zinc-500 text-[10px]">Paid on every 10k downloads</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
                  <CheckCircle2 className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-zinc-200 block">Verified Badge</span>
                    <span className="text-zinc-500 text-[10px]">Official checkmark on profile</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
                  <CheckCircle2 className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-zinc-200 block">Direct Artist Chat</span>
                    <span className="text-zinc-500 text-[10px]">Custom production bookings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Telemetry Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Total Beat Downloads</span>
                <Download className="h-4 w-4 text-[#2dd4bf]" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-white">{totalDownloadsCount.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Across all web &amp; mobile audition downloads</p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Milestone Progress</span>
                <Award className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-white">{downloadProgressPct}%</span>
              </div>
              <p className="text-[11px] text-emerald-400 mt-1">
                {totalDownloadsCount.toLocaleString()} / 10,000 threshold
              </p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Incentive Reward Rate</span>
                <Zap className="h-4 w-4 text-amber-300" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-white">₦30,000 / 10k</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Caution Studio Producer Incentive Program</p>
            </div>
          </div>

          {/* Download Incentives by Track */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-0.5">Per-Track Download Performance</h3>
                <p className="text-xs text-zinc-400">Downloads accumulated towards 10k milestone rewards</p>
              </div>
              <Link
                href="/beats/upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Track</span>
              </Link>
            </div>

            {downloadTracks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Track Title</th>
                      <th className="py-2.5 px-3">Genre</th>
                      <th className="py-2.5 px-3 text-center">Downloads</th>
                      <th className="py-2.5 px-3 text-center">Progress to 10k</th>
                      <th className="py-2.5 px-3 text-right">Incentive Reward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                    {downloadTracks.map((row) => (
                      <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-3 font-sans font-medium text-white">{row.title}</td>
                        <td className="py-3 px-3 font-sans text-zinc-400">{row.genre}</td>
                        <td className="py-3 px-3 text-center text-zinc-300">
                          {row.downloads.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-[#2dd4bf] font-semibold">
                            {row.downloads.toLocaleString()} / 10,000 ({row.progressPct}%)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-emerald-400">
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
                  Upload beats and enable free downloads to start accumulating downloads toward the ₦30,000 reward and verified status.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </CreatorShell>
  );
}
