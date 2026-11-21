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
  Play,
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
  plays: number;
  downloads: number;
  combinedActivity: number;
  progressPct: number;
  earnedNgn: number;
}

export default function StreamingRoyaltiesPage() {
  const [loading, setLoading] = useState(true);
  const [totalPlaysCount, setTotalPlaysCount] = useState(0);
  const [totalDownloadsCount, setTotalDownloadsCount] = useState(0);
  const [rewardAmountNgn, setRewardAmountNgn] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [downloadTracks, setDownloadTracks] = useState<DownloadTrackRow[]>([]);

  const downloadThreshold = 10000;
  const combinedActivityCount = Math.max(
    totalPlaysCount,
    totalDownloadsCount,
    totalPlaysCount + totalDownloadsCount
  );
  const downloadProgressPct = Math.min(
    100,
    Math.round((combinedActivityCount / downloadThreshold) * 100)
  );
  const remainingActivity = Math.max(0, downloadThreshold - combinedActivityCount);

  useEffect(() => {
    let isMounted = true;
    async function loadDownloadsData() {
      try {
        setLoading(true);
        let { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          const match = document.cookie.match(/(?:^|;\s*)sb-token=([^;]+)/);
          const matchRefresh = document.cookie.match(/(?:^|;\s*)sb-refresh=([^;]+)/);
          if (match && matchRefresh) {
            const { data } = await supabase.auth.setSession({
              access_token: decodeURIComponent(match[1]),
              refresh_token: decodeURIComponent(matchRefresh[1])
            });
            session = data.session;
          }
        }

        const userId = session?.user?.id;
        const accessToken = session?.access_token;

        const res = await fetch(
          `/api/creator/telemetry${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`,
          {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            cache: 'no-store'
          }
        );

        if (res.ok) {
          const payload = await res.json();
          if (isMounted) {
            if (payload.profile) {
              setIsVerified(Boolean(payload.profile.is_verified));
            }
            const totalPlays = Number(payload.totalPlaysCount || 0);
            const totalDownloads = Number(payload.totalDownloadsCount || 0);
            setTotalPlaysCount(totalPlays);
            setTotalDownloadsCount(totalDownloads);
            setRewardAmountNgn(Number(payload.downloadRewardNgn || 0));

            if (Array.isArray(payload.beats)) {
              const mappedTracks: DownloadTrackRow[] = payload.beats.map((b: any) => {
                const plays = Number(b.play_count || 0);
                const dl = Number(b.free_commercial_downloads_count || b.download_count || 0);
                const combined = plays + dl;
                const progress = Math.min(100, Math.round((combined / 10000) * 100));
                const earned = Math.floor(combined / 10000) * 30000;
                return {
                  id: b.id,
                  title: b.title,
                  genre: b.genre || 'Afrobeats',
                  plays,
                  downloads: dl,
                  combinedActivity: combined,
                  progressPct: progress,
                  earnedNgn: earned
                };
              });
              setDownloadTracks(mappedTracks);
            }
          }
          return;
        }

        if (!userId) {
          if (isMounted) setLoading(false);
          return;
        }

        // Fallback direct query
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_verified')
          .eq('id', userId)
          .maybeSingle();

        if (profile && isMounted) {
          setIsVerified(Boolean(profile.is_verified));
        }

        const { data: userBeats } = await supabase
          .from('beats')
          .select('*')
          .eq('producer_id', userId)
          .order('play_count', { ascending: false });

        if (userBeats && isMounted) {
          const totalPlays = userBeats.reduce((acc, b) => acc + Number(b.play_count || 0), 0);
          const totalDownloads = userBeats.reduce(
            (acc, b) => acc + Number(b.free_commercial_downloads_count || b.download_count || 0),
            0
          );
          setTotalPlaysCount(totalPlays);
          setTotalDownloadsCount(totalDownloads);
          const computedReward = Math.floor((totalPlays + totalDownloads) / 10000) * 30000;
          setRewardAmountNgn(computedReward);

          const mappedTracks: DownloadTrackRow[] = userBeats.map((b) => {
            const plays = Number(b.play_count || 0);
            const dl = Number(b.free_commercial_downloads_count || b.download_count || 0);
            const combined = plays + dl;
            const progress = Math.min(100, Math.round((combined / 10000) * 100));
            const earned = Math.floor(combined / 10000) * 30000;
            return {
              id: b.id,
              title: b.title,
              genre: b.genre || 'Afrobeats',
              plays,
              downloads: dl,
              combinedActivity: combined,
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
            Plays &amp; Download Pay Threshold &amp; Partner Verification
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Track live beat plays and qualifying beat downloads to unlock the ₦30,000 reward per 10k milestone &amp; Verified Producer badge
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold flex items-center gap-1.5">
            <Gift className="h-3.5 w-3.5" />
            <span>₦30,000 / 10k Pay Threshold Active</span>
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-7 w-7 text-[#e53935] animate-spin" />
          <span className="text-xs font-mono text-zinc-400">Loading plays, downloads &amp; pay threshold milestones...</span>
        </div>
      ) : (
        <>
          {/* Main Verification Progress Card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                    Partner Pay Threshold
                  </span>
                  {isVerified ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#e53935]/20 border border-[#e53935]/40 text-xs font-bold text-[#e53935] flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Verified Producer Checkmark Active</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Pay Threshold Progress ({downloadProgressPct}%)</span>
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white mt-1.5">
                  {isVerified ? 'You Are a Caution Verified Producer!' : '10,000 Plays & Downloads Pay Threshold'}
                </h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Earn <strong>₦30,000 in royalties per 10,000 qualifying plays &amp; downloads</strong>. Once you reach the 10,000 threshold, you unlock the ₦30,000 reward, the official <strong>Verified Producer Badge</strong>, priority placement in the beat store, and direct studio messaging with recording artists.
                </p>
              </div>

              <div className="flex items-center gap-6 text-left md:text-right shrink-0">
                <div>
                  <span className="text-xs font-mono text-zinc-400 block">Total Plays</span>
                  <span className="text-2xl font-bold font-mono text-[#e53935] block mt-0.5">
                    {totalPlaysCount.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-zinc-500 block">Live Streams</span>
                </div>
                <div>
                  <span className="text-xs font-mono text-zinc-400 block">Total Downloads</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400 block mt-0.5">
                    {totalDownloadsCount.toLocaleString()}
                  </span>
                  <span className="text-[11px] text-zinc-500 block">
                    Goal: {downloadThreshold.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar & Milestone Status */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-300">
                  {isVerified || combinedActivityCount >= downloadThreshold
                    ? '10,000 Pay Threshold Milestone Reached (100%)'
                    : `${combinedActivityCount.toLocaleString()} / 10,000 (${totalPlaysCount.toLocaleString()} plays · ${totalDownloadsCount.toLocaleString()} downloads) — ${remainingActivity.toLocaleString()} remaining to unlock ₦30,000`}
                </span>
                <span className="text-white font-bold">{downloadProgressPct}%</span>
              </div>

              <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#e53935] to-emerald-400 transition-all duration-700 rounded-full"
                  style={{ width: `${downloadProgressPct}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <div className="flex items-center gap-2 p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
                  <CheckCircle2 className="h-4 w-4 text-[#e53935] shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-zinc-200 block">₦30,000 Cash Reward</span>
                    <span className="text-zinc-500 text-[10px]">Paid on every 10k threshold</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
                  <CheckCircle2 className="h-4 w-4 text-[#e53935] shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-zinc-200 block">Verified Badge</span>
                    <span className="text-zinc-500 text-[10px]">Official checkmark on profile</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-md bg-zinc-950/60 border border-zinc-800/80">
                  <CheckCircle2 className="h-4 w-4 text-[#e53935] shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-zinc-200 block">Direct Artist Chat</span>
                    <span className="text-zinc-500 text-[10px]">Custom production bookings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Telemetry Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Total Beat Plays</span>
                <Play className="h-4 w-4 text-[#e53935]" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-white">{totalPlaysCount.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-[#e53935] mt-1">Across all web &amp; mobile streams</p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Total Beat Downloads</span>
                <Download className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-white">{totalDownloadsCount.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-emerald-400 mt-1">Across all artist beat downloads</p>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Pay Threshold Progress</span>
                <Award className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2">
                <span className="text-2xl font-bold font-mono text-white">{downloadProgressPct}%</span>
              </div>
              <p className="text-[11px] text-amber-300 mt-1">
                {combinedActivityCount.toLocaleString()} / 10,000 threshold
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
              <p className="text-[11px] text-zinc-500 mt-1">Earned: ₦{rewardAmountNgn.toLocaleString()}</p>
            </div>
          </div>

          {/* Plays & Download Incentives by Track */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-0.5">Per-Track Plays &amp; Download Performance</h3>
                <p className="text-xs text-zinc-400">Plays and downloads accumulated towards the 10k pay threshold (₦30,000 reward)</p>
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
                      <th className="py-2.5 px-3 text-center">Plays</th>
                      <th className="py-2.5 px-3 text-center">Downloads</th>
                      <th className="py-2.5 px-3 text-center">Pay Threshold (/ 10,000)</th>
                      <th className="py-2.5 px-3 text-right">Incentive Reward</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono text-[11px]">
                    {downloadTracks.map((row) => (
                      <tr key={row.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 px-3 font-sans font-medium text-white">{row.title}</td>
                        <td className="py-3 px-3 font-sans text-zinc-400">{row.genre}</td>
                        <td className="py-3 px-3 text-center text-[#e53935] font-semibold">
                          {row.plays.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-400 font-semibold">
                          {row.downloads.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-amber-300 font-semibold">
                            {row.combinedActivity.toLocaleString()} / 10,000 ({row.progressPct}%)
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
                  Upload beats to start accumulating plays and downloads toward the ₦30,000 reward and verified status.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </CreatorShell>
  );
}
