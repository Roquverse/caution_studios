'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreatorShell } from '../components/CreatorShell';
import { supabase } from '../lib/supabaseClient';
import {
  DollarSign,
  Music,
  Activity,
  ShieldCheck,
  Plus,
  Sparkles,
  TrendingUp,
  Gift,
  ArrowRight,
  Play,
  Pause,
  CreditCard,
  Loader2,
  UploadCloud,
  FileCheck2,
  Download,
  Zap,
  BarChart3,
  Users,
  Headphones,
  Disc3
} from 'lucide-react';

interface RecentSaleItem {
  id: string;
  beat: string;
  buyer: string;
  tier: string;
  amountNgn: number;
  payoutNgn: number;
  date: string;
  status: string;
}

interface TopBeatItem {
  id: string;
  title: string;
  bpm: number;
  genre: string;
  downloads: number;
  earnedNgn: number;
  coverUrl: string;
  audioUrl?: string;
}

interface MonthData {
  month: string;
  value: number;
  height: string;
  isCurrent?: boolean;
}

export default function CreatorDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Producer real metrics
  const [totalEarningsNgn, setTotalEarningsNgn] = useState<number>(0);
  const [downloadRewardNgn, setDownloadRewardNgn] = useState<number>(0);
  const [totalDownloadsCount, setTotalDownloadsCount] = useState<number>(0);
  const [liveBeatsCount, setLiveBeatsCount] = useState<number>(0);
  const [licensesSoldCount, setLicensesSoldCount] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(90);
  const [recentSales, setRecentSales] = useState<RecentSaleItem[]>([]);
  const [topStreamingBeats, setTopStreamingBeats] = useState<TopBeatItem[]>([]);
  const [monthlyChart, setMonthlyChart] = useState<MonthData[]>([]);

  const downloadThreshold = 10000;
  const downloadProgressPct = Math.min(
    100,
    Math.round((totalDownloadsCount / downloadThreshold) * 100)
  );

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        if (!userId) {
          if (isMounted) setLoading(false);
          return;
        }

        // 1. Fetch Producer Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profile && isMounted) {
          setIsVerified(Boolean(profile.is_verified));

          if (profile.trial_ends_at) {
            const ends = new Date(profile.trial_ends_at).getTime();
            const now = Date.now();
            const diffDays = Math.max(0, Math.ceil((ends - now) / (1000 * 60 * 60 * 24)));
            setTrialDaysRemaining(diffDays);
          } else {
            setTrialDaysRemaining(85);
          }
        }

        // 2. Fetch Producer Beats
        const { data: dbBeats } = await supabase
          .from('beats')
          .select('*')
          .eq('producer_id', userId)
          .order('play_count', { ascending: false });

        if (dbBeats && isMounted) {
          const live = dbBeats.filter((b) => b.status === 'live');
          setLiveBeatsCount(live.length);

          const totalDownloads = dbBeats.reduce(
            (acc, b) => acc + (b.free_commercial_downloads_count || b.download_count || 0),
            0
          );
          setTotalDownloadsCount(totalDownloads);
          const computedReward = Math.floor(totalDownloads / 10000) * 30000;
          setDownloadRewardNgn(computedReward);

          // Check if producer has download incentives recorded
          const { data: incentiveRows } = await supabase
            .from('producer_download_incentives')
            .select('reward_amount_ngn, qualifying_downloads')
            .eq('producer_id', userId);

          if (incentiveRows && incentiveRows.length > 0) {
            const incReward = incentiveRows.reduce((acc, r) => acc + Number(r.reward_amount_ngn || 0), 0);
            const incDownloads = incentiveRows.reduce((acc, r) => acc + Number(r.qualifying_downloads || 0), 0);
            if (incReward > computedReward) setDownloadRewardNgn(incReward);
            if (incDownloads > totalDownloads) setTotalDownloadsCount(incDownloads);
          }

          const topBeats: TopBeatItem[] = dbBeats.slice(0, 4).map((b) => {
            const audioKey = b.master_wav_key || b.preview_clean_key || b.preview_tagged_key;
            const dlCount = b.free_commercial_downloads_count || b.download_count || 0;
            return {
              id: b.id,
              title: b.title,
              bpm: b.bpm || 110,
              genre: b.genre || 'Afrobeats',
              downloads: dlCount,
              earnedNgn: Math.floor(dlCount / 10000) * 30000,
              coverUrl: b.cover_url || '/images/studio_mixing_console.jpg',
              audioUrl: audioKey ? `/api/media/${audioKey}` : ''
            };
          });
          setTopStreamingBeats(topBeats);
        }

        // 3. Fetch Producer Sales & Order Items
        const { data: orderItems } = await supabase
          .from('order_items')
          .select(`
            id,
            price_cents,
            producer_amount_cents,
            license,
            order:order_id (
              id,
              status,
              created_at,
              buyer:buyer_id (
                display_name,
                handle
              )
            ),
            beat:beat_id (
              title,
              cover_url
            )
          `)
          .eq('producer_id', userId)
          .order('id', { ascending: false });

        if (orderItems && isMounted) {
          const paidItems = orderItems.filter((item: any) => item.order?.status === 'paid');
          setLicensesSoldCount(paidItems.length);

          const netCents = paidItems.reduce((acc: number, item: any) => acc + (item.producer_amount_cents || 0), 0);
          setTotalEarningsNgn(Math.round(netCents / 100));

          // Format recent sales
          const mappedSales: RecentSaleItem[] = paidItems.slice(0, 5).map((item: any) => {
            const dateStr = item.order?.created_at
              ? new Date(item.order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'Recent';

            return {
              id: item.id,
              beat: item.beat?.title || 'Studio Instrumental',
              buyer: item.order?.buyer?.handle ? `@${item.order.buyer.handle}` : (item.order?.buyer?.display_name || '@artist'),
              tier: `${item.license || 'basic'} License`,
              amountNgn: Math.round((item.price_cents || 0) / 100),
              payoutNgn: Math.round((item.producer_amount_cents || 0) / 100),
              date: dateStr,
              status: 'Paid'
            };
          });
          setRecentSales(mappedSales);

          // Build Monthly Chart from real sales
          const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
          const currentMonthIndex = new Date().getMonth();
          const baseData: MonthData[] = months.map((m, idx) => {
            const isCurrent = idx === months.length - 1;
            const val = isCurrent ? Math.max(netCents / 100, 0) : 0;
            return {
              month: m,
              value: val,
              height: val > 0 ? `${Math.min(95, Math.max(25, (val / 100000) * 100))}%` : '8%',
              isCurrent
            };
          });
          setMonthlyChart(baseData);
        }
      } catch (err) {
        console.error('Error loading creator dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, []);

  const togglePlay = (id: string, audioUrl?: string) => {
    if (playingId === id) {
      if (audioElement) audioElement.pause();
      setPlayingId(null);
    } else {
      if (audioElement) audioElement.pause();
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(() => {});
        audio.onended = () => setPlayingId(null);
        setAudioElement(audio);
        setPlayingId(id);
      } else {
        setPlayingId(id);
      }
    }
  };

  return (
    <CreatorShell>
      {/* Modern Hero Header */}
      <div className="relative mb-8">
        {/* Gradient Background Accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#2dd4bf]/10 via-transparent to-purple-500/5 rounded-2xl blur-3xl -z-10" />
        
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 p-6 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/90 border border-zinc-800/50 backdrop-blur-sm">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Live Studio
                </span>
              </div>
              <div className="text-xs text-zinc-500">•</div>
              <span className="text-xs text-zinc-400">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
            
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-br from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent mb-2">
              Welcome back, Producer
            </h1>
            
            <p className="text-sm text-zinc-400 max-w-2xl">
              Monitor your catalog performance, track streaming metrics, and manage payouts—all in real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/payouts"
              className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700/50 bg-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-600 text-sm font-medium text-zinc-200 transition-all duration-200 hover:shadow-lg hover:shadow-[#2dd4bf]/5"
            >
              <CreditCard className="h-4 w-4 text-[#2dd4bf] transition-transform group-hover:scale-110" />
              <span>View Payouts</span>
            </Link>
            
            <Link
              href="/beats/upload"
              className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2dd4bf] to-[#20b8a4] hover:from-[#20b8a4] hover:to-[#1a9d8a] text-sm font-bold text-zinc-950 transition-all duration-200 shadow-lg shadow-[#2dd4bf]/20 hover:shadow-xl hover:shadow-[#2dd4bf]/30 hover:scale-105"
            >
              <Plus className="h-4 w-4 stroke-[3] transition-transform group-hover:rotate-90" />
              <span>Upload Beat</span>
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
          <div className="relative">
            <Loader2 className="h-10 w-10 text-[#2dd4bf] animate-spin" />
            <div className="absolute inset-0 h-10 w-10 bg-[#2dd4bf]/20 rounded-full animate-ping" />
          </div>
          <span className="text-sm font-medium text-zinc-400">Loading your studio...</span>
        </div>
      ) : (
        <>
          {/* Status Cards - Modern Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Promo Card - Redesigned */}
            <div className="group relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-zinc-900/90 to-zinc-950 p-6 transition-all duration-300 hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/10">
              {/* Animated Background Pattern */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-3xl -z-10 transition-transform group-hover:scale-110" />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                    <Gift className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Producer Launch Promo
                    </h3>
                    <p className="text-xs text-amber-400/90 font-mono mt-0.5">
                      PRODUCER_3MO_FREE
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-xs font-bold text-amber-300 whitespace-nowrap">
                  3 Months Free
                </span>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Enjoy zero subscription fees. Keep 80% on all beat sales and earn full royalties on streams.
              </p>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <span className="text-sm text-zinc-400">Trial ends in</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-amber-400">{trialDaysRemaining}</span>
                  <span className="text-sm text-zinc-400">days</span>
                </div>
              </div>
            </div>

            {/* Verification Card - Redesigned */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-6 transition-all duration-300 hover:border-[#2dd4bf]/30 hover:shadow-xl hover:shadow-[#2dd4bf]/10">
              {/* Animated Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#2dd4bf]/10 to-transparent rounded-full blur-3xl -z-10 transition-transform group-hover:scale-110" />
              
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-white">
                      Verification Status
                    </h3>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
                        <Sparkles className="h-3 w-3" />
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">
                    Reach 10,000 downloads to get verified
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Downloads</span>
                  <span className="font-mono font-bold text-white">
                    {totalDownloadsCount.toLocaleString()} <span className="text-zinc-500 font-normal">/ 10,000</span>
                  </span>
                </div>

                <div className="relative">
                  <div className="w-full h-3 rounded-full bg-zinc-800/50 overflow-hidden border border-zinc-700/50">
                    <div
                      className="h-full bg-gradient-to-r from-[#2dd4bf] via-emerald-400 to-[#2dd4bf] transition-all duration-700 ease-out relative"
                      style={{ width: `${downloadProgressPct}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                  </div>
                  <div className="absolute -top-8 right-0 text-xs font-bold text-[#2dd4bf]">
                    {downloadProgressPct}%
                  </div>
                </div>

                <Link 
                  href="/streaming" 
                  className="inline-flex items-center gap-1.5 text-sm text-[#2dd4bf] hover:text-[#20b8a4] transition-colors group/link"
                >
                  <span>View details</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Modern KPI Cards - Redesigned */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Earnings */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-5 transition-all duration-300 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-full blur-2xl -z-10 transition-transform group-hover:scale-110" />
              
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <TrendingUp className="h-4 w-4 text-emerald-500/50" />
              </div>
              
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Total Earnings</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl lg:text-3xl font-bold text-white">₦{totalEarningsNgn.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5" />
                  Keep 80% on all sales
                </p>
              </div>
            </div>

            {/* Beat Downloads */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-5 transition-all duration-300 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-2xl -z-10 transition-transform group-hover:scale-110" />
              
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <Download className="h-4 w-4 text-blue-500/50" />
              </div>
              
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Total Downloads</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl lg:text-3xl font-bold text-white">{totalDownloadsCount.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-blue-400/80 mt-1">
                  {Math.floor(totalDownloadsCount / 10000)} milestones reached
                </p>
              </div>
            </div>

            {/* Live Beats */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-5 transition-all duration-300 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-2xl -z-10 transition-transform group-hover:scale-110" />
              
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <Disc3 className="h-5 w-5 text-purple-400" />
                </div>
                <Activity className="h-4 w-4 text-purple-500/50" />
              </div>
              
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Live Catalog</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl lg:text-3xl font-bold text-white">{liveBeatsCount}</span>
                  <span className="text-sm text-zinc-500">beats</span>
                </div>
                <p className="text-[10px] text-purple-400/80 mt-1">
                  {liveBeatsCount > 0 ? 'All beats active' : 'No beats live yet'}
                </p>
              </div>
            </div>

            {/* Licenses Sold */}
            <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-gradient-to-br from-zinc-900/90 to-zinc-950 p-5 transition-all duration-300 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-2xl -z-10 transition-transform group-hover:scale-110" />
              
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                </div>
                <Gift className="h-4 w-4 text-amber-500/50" />
              </div>
              
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Licenses Sold</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl lg:text-3xl font-bold text-white">{licensesSoldCount}</span>
                </div>
                <p className="text-[10px] text-amber-400/80 mt-1">
                  {licensesSoldCount > 0 ? 'Commercial clearances' : 'Waiting for first sale'}
                </p>
              </div>
            </div>
          </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">₦{totalEarningsNgn.toLocaleString()}</span>
                {totalEarningsNgn > 0 && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" />
                    <span>80%</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">80% creator take-home pay</p>
            </div>

            {/* Beat Downloads / Download Incentives */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Beat Downloads</span>
                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-300">
                  <Download className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">{totalDownloadsCount.toLocaleString()}</span>
                <span className="text-xs font-mono text-zinc-500">downloads</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                {downloadRewardNgn > 0
                  ? `₦${downloadRewardNgn.toLocaleString()} reward earned (₦30k / 10k)`
                  : `${totalDownloadsCount.toLocaleString()} beat downloads (Goal: 10,000)`}
              </p>
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
                <span className="text-2xl font-bold font-mono text-white">{liveBeatsCount}</span>
                <span className="text-xs text-zinc-400">active</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Ready for purchase & streaming</p>
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
                <span className="text-2xl font-bold font-mono text-white">{licensesSoldCount}</span>
                <span className="text-xs font-semibold text-purple-400">Total</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Paid commercial licenses</p>
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
              {monthlyChart.length > 0 ? (
                <div className="h-48 flex items-end justify-between gap-2 sm:gap-6 px-2">
                  {monthlyChart.map((d) => (
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
              ) : (
                <div className="h-36 flex items-center justify-center text-xs text-zinc-500">
                  No sales recorded yet this quarter
                </div>
              )}
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
                {recentSales.length > 0 ? (
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
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-[#2dd4bf] border border-zinc-700 capitalize">
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
                ) : (
                  <div className="py-12 text-center space-y-2">
                    <FileCheck2 className="h-8 w-8 text-zinc-600 mx-auto" />
                    <p className="text-xs text-zinc-400 font-medium">No sales recorded yet</p>
                    <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                      When artists purchase Starter, Premium, or Exclusive licenses for your beats, sales and instant 80% splits will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Downloaded Beats */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-semibold text-white">Top Downloaded Beats</h3>
                  <p className="text-xs text-zinc-400">Downloads towards ₦30,000 / 10k milestone</p>
                </div>
                <Link href="/streaming" className="text-xs text-[#2dd4bf] hover:underline">
                  Details
                </Link>
              </div>

              {topStreamingBeats.length > 0 ? (
                <div className="mt-3 divide-y divide-zinc-800/60">
                  {topStreamingBeats.map((beat) => (
                    <div key={beat.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => togglePlay(beat.id, beat.audioUrl)}
                          className="h-8 w-8 rounded bg-zinc-800 hover:bg-[#2dd4bf] hover:text-black flex items-center justify-center shrink-0 transition-colors text-zinc-300"
                        >
                          {playingId === beat.id ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          )}
                        </button>
                        <div className="h-9 w-9 rounded-md overflow-hidden shrink-0 border border-zinc-700/80 bg-zinc-950">
                          <img
                            src={beat.coverUrl}
                            alt={beat.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-white block truncate">
                            {beat.title}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">
                            {beat.bpm} BPM · {beat.genre} · {beat.downloads.toLocaleString()} downloads
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <span className="text-xs font-bold text-[#2dd4bf] block">
                          {beat.downloads.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">/ 10,000</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <UploadCloud className="h-8 w-8 text-zinc-600 mx-auto" />
                  <p className="text-xs text-zinc-400 font-medium">No beats uploaded yet</p>
                  <p className="text-[11px] text-zinc-500">
                    Upload your first beat to start receiving streams & royalties!
                  </p>
                </div>
              )}

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
        </>
      )}
    </CreatorShell>
  );
}
