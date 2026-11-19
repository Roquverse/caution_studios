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
  Headphones,
  Wallet,
  Building,
  CheckCircle2,
  X,
  AlertCircle,
  Search,
  ShoppingBag,
  Tag
} from 'lucide-react';

interface RecentSaleItem {
  id: string;
  beat: string;
  coverUrl?: string;
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
  plays: number;
  downloads: number;
  earnedNgn: number;
  coverUrl: string;
  audioUrl?: string;
}

interface BeatCatalogItem {
  id: string;
  title: string;
  bpm: number;
  genre: string;
  key?: string;
  plays: number;
  downloads: number;
  earnedNgn: number;
  coverUrl: string;
  audioUrl?: string;
  status: string;
  isFree: boolean;
  priceBasicNgn?: number;
  pricePremiumNgn?: number;
  priceExclusiveNgn?: number;
  createdAt?: string;
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
  const [availableBalanceNgn, setAvailableBalanceNgn] = useState<number>(0);
  const [downloadRewardNgn, setDownloadRewardNgn] = useState<number>(0);
  const [totalPlaysCount, setTotalPlaysCount] = useState<number>(0);
  const [totalDownloadsCount, setTotalDownloadsCount] = useState<number>(0);
  const [liveBeatsCount, setLiveBeatsCount] = useState<number>(0);
  const [licensesSoldCount, setLicensesSoldCount] = useState<number>(0);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState<number>(90);
  const [recentSales, setRecentSales] = useState<RecentSaleItem[]>([]);
  const [topStreamingBeats, setTopStreamingBeats] = useState<TopBeatItem[]>([]);
  const [allUploadedBeats, setAllUploadedBeats] = useState<BeatCatalogItem[]>([]);
  const [beatSearchQuery, setBeatSearchQuery] = useState('');
  const [beatFilterTab, setBeatFilterTab] = useState<'all' | 'paid' | 'free'>('all');
  const [monthlyChart, setMonthlyChart] = useState<MonthData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Quick Withdrawal Modal State
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  const downloadThreshold = 10000;
  const combinedActivityCount = totalPlaysCount + totalDownloadsCount;
  const downloadProgressPct = Math.min(
    100,
    Number(((combinedActivityCount / downloadThreshold) * 100).toFixed(2))
  );

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        setLoading(true);
        let { data: { session } } = await supabase.auth.getSession();

        if (!session?.user && typeof document !== 'undefined') {
          const matchToken = document.cookie.match(/(?:^|;\s*)sb-token=([^;]*)/);
          const matchRefresh = document.cookie.match(/(?:^|;\s*)sb-refresh=([^;]*)/);
          if (matchToken && matchRefresh) {
            try {
              const { data: restored } = await supabase.auth.setSession({
                access_token: decodeURIComponent(matchToken[1]),
                refresh_token: decodeURIComponent(matchRefresh[1])
              });
              if (restored?.session?.user) session = restored.session;
            } catch (e) {}
          }
        }

        const userId = session?.user?.id;
        if (!userId) {
          if (isMounted) setLoading(false);
          return;
        }
        setCurrentUserId(userId);

        // Primary: Fetch comprehensive producer telemetry via service-role API
        const res = await fetch(`/api/creator/telemetry?userId=${encodeURIComponent(userId)}`, {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
        });

        if (res.ok) {
          const data = await res.json();
          if (!isMounted) return;

          if (data.profile) {
            setIsVerified(Boolean(data.profile.is_verified));
            setBankName(data.profile.paystack_bank_name || '');
            setAccountNumber(data.profile.paystack_account_number || '');
            setAccountName(data.profile.paystack_account_name || '');
            if (data.profile.trial_ends_at) {
              const ends = new Date(data.profile.trial_ends_at).getTime();
              const diffDays = Math.max(0, Math.ceil((ends - Date.now()) / (1000 * 60 * 60 * 24)));
              setTrialDaysRemaining(diffDays);
            } else {
              setTrialDaysRemaining(85);
            }
          }

          setAvailableBalanceNgn(Number(data.availableBalanceNgn) || 0);

          const dbBeats = data.beats || [];
          const live = dbBeats.filter((b: any) => b.status === 'live');
          setLiveBeatsCount(live.length);

          setTotalPlaysCount(Number(data.totalPlaysCount) || 0);
          setTotalDownloadsCount(Number(data.totalDownloadsCount) || 0);
          setDownloadRewardNgn(Number(data.downloadRewardNgn) || 0);

          const topBeats: TopBeatItem[] = dbBeats.slice(0, 6).map((b: any) => {
            const audioKey = b.master_wav_key || b.preview_clean_key || b.preview_tagged_key;
            const playsCount = Number(b.play_count) || 0;
            const dlCount = Number(b.downloads_count || b.free_commercial_downloads_count || b.download_count) || 0;
            return {
              id: b.id,
              title: b.title,
              bpm: b.bpm || 110,
              genre: b.genre || 'Afrobeats',
              plays: playsCount,
              downloads: dlCount,
              earnedNgn: Math.floor((playsCount + dlCount) / 10000) * 30000,
              coverUrl: b.cover_url || '/images/studio_mixing_console.jpg',
              audioUrl: audioKey ? (audioKey.startsWith('http') || audioKey.startsWith('/') ? audioKey : `/api/media/${audioKey}`) : ''
            };
          });
          setTopStreamingBeats(topBeats);

          const mappedAllBeats: BeatCatalogItem[] = dbBeats.map((b: any) => {
            const audioKey = b.master_wav_key || b.preview_clean_key || b.preview_tagged_key;
            const playsCount = Number(b.play_count) || 0;
            const dlCount = Number(b.downloads_count || b.free_commercial_downloads_count || b.download_count) || 0;
            const licenses = b.licenses || b.beat_licenses || [];
            const basicLic = licenses.find((l: any) => l.type === 'basic');
            const premiumLic = licenses.find((l: any) => l.type === 'premium');
            const exclusiveLic = licenses.find((l: any) => l.type === 'exclusive');
            const isFree = b.is_free_stream_enabled === true || (basicLic?.price_cents !== undefined && basicLic.price_cents <= 100);

            return {
              id: b.id,
              title: b.title,
              bpm: b.bpm || 110,
              genre: b.genre || 'Afrobeats',
              key: b.musical_key || 'C Minor',
              plays: playsCount,
              downloads: dlCount,
              earnedNgn: Math.floor((playsCount + dlCount) / 10000) * 30000,
              coverUrl: b.cover_url || '/images/studio_mixing_console.jpg',
              audioUrl: audioKey ? (audioKey.startsWith('http') || audioKey.startsWith('/') ? audioKey : `/api/media/${audioKey}`) : '',
              status: b.status || 'live',
              isFree,
              priceBasicNgn: basicLic ? Math.round(basicLic.price_cents / 100) : 3000,
              pricePremiumNgn: premiumLic ? Math.round(premiumLic.price_cents / 100) : 50000,
              priceExclusiveNgn: exclusiveLic ? Math.round(exclusiveLic.price_cents / 100) : 200000,
              createdAt: b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'
            };
          });
          setAllUploadedBeats(mappedAllBeats);

          const paidItems = data.orderItems || [];
          setLicensesSoldCount(paidItems.length);
          const salesNetNgn = Number(data.totalSalesEarningsNgn) || 0;
          setTotalEarningsNgn(salesNetNgn + (Number(data.downloadRewardNgn) || 0));

          const mappedSales: RecentSaleItem[] = paidItems.map((item: any) => {
            const orderObj = Array.isArray(item.order) ? item.order[0] : item.order;
            const buyerObj = Array.isArray(orderObj?.buyer) ? orderObj.buyer[0] : orderObj?.buyer;
            const beatObj = Array.isArray(item.beat) ? item.beat[0] : item.beat;
            const dateStr = orderObj?.created_at
              ? new Date(orderObj.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recent';

            return {
              id: item.id,
              beat: beatObj?.title || 'Studio Instrumental',
              coverUrl: beatObj?.cover_url || '',
              buyer: buyerObj?.handle ? `@${buyerObj.handle}` : (buyerObj?.display_name || '@artist'),
              tier: `${item.license || 'premium'} License`,
              amountNgn: Math.round((item.price_cents || 0) / 100),
              payoutNgn: Math.round((item.producer_amount_cents || (item.price_cents ? item.price_cents * 0.8 : 0)) / 100),
              date: dateStr,
              status: 'Paid'
            };
          });
          setRecentSales(mappedSales);

          const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
          const baseData: MonthData[] = months.map((m, idx) => {
            const isCurrent = idx === months.length - 1;
            const val = isCurrent ? Math.max(salesNetNgn, 0) : 0;
            return {
              month: m,
              value: val,
              height: val > 0 ? `${Math.min(95, Math.max(25, (val / 100000) * 100))}%` : '10%',
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

  const handleOpenWithdraw = (customAmount?: number) => {
    const targetAmount = customAmount !== undefined ? customAmount : availableBalanceNgn;
    setWithdrawAmount(targetAmount > 0 ? String(targetAmount) : '');
    setWithdrawError('');
    setWithdrawSuccess(false);
    setIsWithdrawModalOpen(true);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(withdrawAmount);

    if (isNaN(parsedAmount) || parsedAmount < 1000) {
      setWithdrawError('Minimum withdrawal amount is ₦1,000.');
      return;
    }

    if (parsedAmount > availableBalanceNgn) {
      setWithdrawError(`Amount exceeds your available balance of ₦${availableBalanceNgn.toLocaleString()}.`);
      return;
    }

    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      setWithdrawError('Please enter valid Nigerian bank account details.');
      return;
    }

    setWithdrawing(true);
    setWithdrawError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || currentUserId;
      if (!userId) throw new Error('You must be signed in.');

      const fee = 100;
      const net = parsedAmount - fee;

      // 1. Insert payout row
      const { error: payoutErr } = await supabase.from('payouts').insert({
        producer_id: userId,
        amount_ngn: parsedAmount,
        fee_ngn: fee,
        net_ngn: net,
        bank_name: bankName.trim(),
        bank_code: '058',
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
        status: 'pending'
      });

      if (payoutErr) throw payoutErr;

      // 2. Save bank details to profile
      await supabase
        .from('profiles')
        .update({
          paystack_bank_name: bankName.trim(),
          paystack_account_number: accountNumber.trim(),
          paystack_account_name: accountName.trim()
        })
        .eq('id', userId);

      // 3. Notify Admin Support
      try {
        const adminId = 'c855e1b8-b34c-4b1d-986b-373e70ec423f';
        await supabase.from('chats').insert({
          sender_id: userId,
          recipient_id: adminId,
          content: `💳 PAYOUT WITHDRAWAL REQUEST: ₦${parsedAmount.toLocaleString()} to ${bankName.trim()} (${accountNumber.trim()} - ${accountName.trim()}). Net transfer: ₦${net.toLocaleString()}.`,
          is_encrypted: false,
          has_contact_info: false
        });
      } catch (e) {}

      setAvailableBalanceNgn((prev) => Math.max(0, prev - parsedAmount));
      setWithdrawSuccess(true);
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawSuccess(false);
      }, 2500);
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setWithdrawError(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setWithdrawing(false);
    }
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
            Real-time catalog performance, plays &amp; downloads pay threshold, and Paystack payout ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenWithdraw()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Wallet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Withdraw Funds ({availableBalanceNgn > 0 ? `₦${availableBalanceNgn.toLocaleString()}` : '₦0'})</span>
          </button>
          <Link
            href="/payouts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-xs font-semibold text-zinc-200 transition-colors"
          >
            <CreditCard className="h-3.5 w-3.5 text-[#2dd4bf]" />
            <span>Paystack Ledger</span>
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

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3">
          <Loader2 className="h-7 w-7 text-[#2dd4bf] animate-spin" />
          <span className="text-xs font-mono text-zinc-400">Loading catalog telemetry, plays &amp; downloads...</span>
        </div>
      ) : (
        <>
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
                Zero subscription fees active. You keep 80% on all beat sales and earn ₦30,000 per 10,000 plays &amp; downloads.
              </p>
              <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-500">Trial Period:</span>
                <span className="text-amber-300 font-semibold">{trialDaysRemaining} Days Remaining</span>
              </div>
            </div>

            {/* Plays & Downloads Pay Threshold Progress */}
            <div className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                      Pay Threshold &amp; Partner Verification
                    </span>
                    {isVerified ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#2dd4bf]/20 border border-[#2dd4bf]/40 text-[10px] font-bold text-[#2dd4bf] flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Verified Producer</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        <span>Threshold Tracking Active</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                    <span className="text-zinc-300">
                      Plays: <strong className="text-[#2dd4bf]">{totalPlaysCount.toLocaleString()}</strong>
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-300">
                      Downloads: <strong className="text-amber-300">{totalDownloadsCount.toLocaleString()}</strong>
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-400">
                      Total: <strong className="text-white">{combinedActivityCount.toLocaleString()} / {downloadThreshold.toLocaleString()}</strong>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Every play and download across your catalog counts towards your <strong className="text-zinc-200">10,000 Pay Threshold (₦30,000 royalty payout)</strong>, the <strong className="text-zinc-200">Verified Producer</strong> checkmark, and direct artist recording chat.
                </p>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">
                    Pay Threshold Progress ({combinedActivityCount.toLocaleString()} / 10,000)
                  </span>
                  <span className="text-white font-bold">{downloadProgressPct}% Completed</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2dd4bf] to-emerald-400 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.max(downloadProgressPct, combinedActivityCount > 0 ? 2 : 0)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                  <span>Goal: 10,000 plays &amp; downloads threshold (₦30,000 payout)</span>
                  <Link href="/streaming" className="text-[#2dd4bf] hover:underline flex items-center gap-1">
                    <span>View Full Plays &amp; Downloads Telemetry</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 5 Metric KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Total Earnings & Withdrawal */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">Total Net Earnings</span>
                  <div className="p-1.5 rounded-md bg-[#2dd4bf]/10 text-[#2dd4bf]">
                    <DollarSign className="h-4 w-4" />
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
              </div>
              <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 block uppercase font-mono">Available</span>
                  <span className="text-xs font-bold font-mono text-emerald-400">₦{availableBalanceNgn.toLocaleString()}</span>
                </div>
                {availableBalanceNgn >= 1000 ? (
                  <button
                    type="button"
                    onClick={() => handleOpenWithdraw()}
                    className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Wallet className="h-3 w-3" />
                    <span>Withdraw</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-zinc-500 font-mono">Min ₦1k</span>
                )}
              </div>
            </div>

            {/* 2. Total Plays / Streams */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Total Beat Plays</span>
                <div className="p-1.5 rounded-md bg-[#2dd4bf]/10 text-[#2dd4bf]">
                  <Headphones className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-[#2dd4bf]">{totalPlaysCount.toLocaleString()}</span>
                <span className="text-xs font-mono text-zinc-500">plays</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Live streams across all beats
              </p>
            </div>

            {/* 3. Beat Downloads */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Beat Downloads</span>
                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-300">
                  <Download className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-amber-300">{totalDownloadsCount.toLocaleString()}</span>
                <span className="text-xs font-mono text-zinc-500">downloads</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                {downloadRewardNgn > 0
                  ? `₦${downloadRewardNgn.toLocaleString()} reward earned`
                  : `${combinedActivityCount.toLocaleString()} / 10k pay threshold`}
              </p>
            </div>

            {/* 4. Live Uploads */}
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
              <p className="text-[11px] text-zinc-500 mt-1">Ready for purchase &amp; streaming</p>
            </div>

            {/* 5. Licenses Sold */}
            <div className="col-span-2 lg:col-span-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
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
                <h3 className="text-sm font-semibold text-white">Monthly Sales &amp; Royalty Payouts</h3>
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

          {/* Two Column Layout: Recent Sales & Top Streaming / Downloaded Beats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Beat Sales */}
            <div className="lg:col-span-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Sold Beats &amp; Commercial Licenses</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#2dd4bf]/15 text-[#2dd4bf] text-[10px] font-bold font-mono">
                      {recentSales.length} Sold
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">Purchases by verified artists &amp; content creators (80% net credited)</p>
                </div>
                <div className="flex items-center gap-2">
                  {availableBalanceNgn >= 1000 && (
                    <button
                      type="button"
                      onClick={() => handleOpenWithdraw()}
                      className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      <span>Withdraw ₦{availableBalanceNgn.toLocaleString()}</span>
                    </button>
                  )}
                  <Link href="/licenses" className="text-xs text-[#2dd4bf] hover:underline flex items-center gap-1">
                    <span>All Licenses</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="mt-3 overflow-x-auto">
                {recentSales.length > 0 ? (
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Beat Title</th>
                        <th className="py-2.5 px-3">Buyer</th>
                        <th className="py-2.5 px-3">License Tier</th>
                        <th className="py-2.5 px-3 text-right">Sale Price</th>
                        <th className="py-2.5 px-3 text-right">Your Cut (80%)</th>
                        <th className="py-2.5 px-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {recentSales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-3 font-medium text-white max-w-[220px]">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="h-8 w-8 rounded overflow-hidden shrink-0 bg-zinc-950 border border-zinc-700/80">
                                {sale.coverUrl ? (
                                  <img src={sale.coverUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                                    <Music className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <span className="truncate block font-semibold">{sale.beat}</span>
                            </div>
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
                    <p className="text-xs text-zinc-400 font-medium">No beat sales recorded yet</p>
                    <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
                      When artists purchase Starter, Premium, or Exclusive licenses for your beats, sales and instant 80% splits will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Played & Downloaded Beats */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-sm font-semibold text-white">Top Played &amp; Downloaded Beats</h3>
                  <p className="text-xs text-zinc-400">Plays &amp; downloads towards ₦30,000 / 10k threshold</p>
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
                          <span className="text-[10px] text-zinc-400 block font-mono">
                            <span className="text-[#2dd4bf]">{beat.plays.toLocaleString()} plays</span>
                            {' · '}
                            <span className="text-amber-300">{beat.downloads.toLocaleString()} dl</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <span className="text-xs font-bold text-[#2dd4bf] block">
                          {(beat.plays + beat.downloads).toLocaleString()}
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
                    Upload your first beat to start receiving streams &amp; royalties!
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

          {/* 6. ALL UPLOADED & CREATED BEATS SECTION */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-semibold text-white">All Uploaded &amp; Created Beats</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/30">
                    {allUploadedBeats.length} {allUploadedBeats.length === 1 ? 'Beat' : 'Beats'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Every beat created or uploaded to your catalog, with live license pricing and streaming activity.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/beats/upload"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-semibold transition-colors shadow-xs"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                  <span>Upload Beat</span>
                </Link>
                <Link
                  href="/beats"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                >
                  <span>Catalog View</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800 w-fit">
                <button
                  type="button"
                  onClick={() => setBeatFilterTab('all')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    beatFilterTab === 'all'
                      ? 'bg-zinc-800 text-white font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All ({allUploadedBeats.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBeatFilterTab('paid')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    beatFilterTab === 'paid'
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                      : 'text-zinc-400 hover:text-amber-300'
                  }`}
                >
                  Paid Beats ({allUploadedBeats.filter((b) => !b.isFree).length})
                </button>
                <button
                  type="button"
                  onClick={() => setBeatFilterTab('free')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    beatFilterTab === 'free'
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-emerald-300'
                  }`}
                >
                  Free Beats ({allUploadedBeats.filter((b) => b.isFree).length})
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={beatSearchQuery}
                  onChange={(e) => setBeatSearchQuery(e.target.value)}
                  placeholder="Search beats by title..."
                  className="w-full h-8 pl-8 pr-3 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>

            {/* Table */}
            {allUploadedBeats.filter((b) => {
              if (beatFilterTab === 'paid' && b.isFree) return false;
              if (beatFilterTab === 'free' && !b.isFree) return false;
              if (!beatSearchQuery.trim()) return true;
              const q = beatSearchQuery.toLowerCase();
              return b.title.toLowerCase().includes(q) || b.genre.toLowerCase().includes(q);
            }).length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-zinc-800/80">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 font-mono text-[11px] border-b border-zinc-800">
                    <tr>
                      <th className="py-2.5 px-3">Beat</th>
                      <th className="py-2.5 px-3">Genre / BPM</th>
                      <th className="py-2.5 px-3">Pricing Added</th>
                      <th className="py-2.5 px-3">Activity</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {allUploadedBeats.filter((b) => {
                      if (beatFilterTab === 'paid' && b.isFree) return false;
                      if (beatFilterTab === 'free' && !b.isFree) return false;
                      if (!beatSearchQuery.trim()) return true;
                      const q = beatSearchQuery.toLowerCase();
                      return b.title.toLowerCase().includes(q) || b.genre.toLowerCase().includes(q);
                    }).map((beat) => (
                      <tr key={'all-beat-' + beat.id} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5 min-w-[200px]">
                            <button
                              type="button"
                              onClick={() => togglePlay(beat.id, beat.audioUrl)}
                              className="h-7 w-7 rounded bg-zinc-800 hover:bg-[#2dd4bf] hover:text-black flex items-center justify-center shrink-0 transition-colors text-zinc-300 cursor-pointer"
                              title="Preview Beat"
                            >
                              {playingId === beat.id ? (
                                <Pause className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3 fill-current ml-0.5" />
                              )}
                            </button>
                            <div className="h-8 w-8 rounded overflow-hidden shrink-0 border border-zinc-800 bg-black">
                              <img src={beat.coverUrl} alt={beat.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-white block truncate">{beat.title}</span>
                              <span className="text-[10px] text-zinc-500 font-mono block">Added {beat.createdAt}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-mono text-zinc-300">
                          <div>{beat.genre}</div>
                          <div className="text-[10px] text-zinc-500">{beat.bpm} BPM · {beat.key}</div>
                        </td>

                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          {beat.isFree ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <Sparkles className="h-2.5 w-2.5" />
                              <span>100% Free Beat</span>
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="text-amber-300 font-semibold">
                                Prem: ₦{(beat.pricePremiumNgn || 50000).toLocaleString()}
                              </div>
                              <div className="text-purple-300 text-[10px]">
                                Excl: ₦{(beat.priceExclusiveNgn || 200000).toLocaleString()}
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          <span className="text-[#2dd4bf] font-bold">{beat.plays.toLocaleString()} plays</span>
                          <span className="text-zinc-500"> · </span>
                          <span className="text-amber-300">{beat.downloads.toLocaleString()} dl</span>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {beat.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href="/beats"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                          >
                            <span>Manage</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center space-y-2 border border-dashed border-zinc-800 rounded-lg">
                <UploadCloud className="h-8 w-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-medium">No beats matching your filter</p>
                <div className="pt-1">
                  <Link
                    href="/beats/upload"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#2dd4bf] text-zinc-950 text-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Upload Beat</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
          {/* Quick Paystack Withdrawal Modal */}
          {isWithdrawModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Withdraw Earnings</h3>
                      <p className="text-xs text-zinc-400">Direct Paystack transfer to Nigerian bank</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {withdrawSuccess ? (
                  <div className="py-8 text-center space-y-3">
                    <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto animate-bounce" />
                    <h4 className="text-base font-bold text-white">Withdrawal Submitted!</h4>
                    <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed">
                      Your payout request for <strong className="text-emerald-400">₦{Number(withdrawAmount).toLocaleString()}</strong> has been submitted. Funds will be deposited to your bank account shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                    {/* Available Balance Pill */}
                    <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex items-center justify-between">
                      <span className="text-xs text-zinc-400 font-mono">Available Balance:</span>
                      <span className="text-sm font-bold font-mono text-emerald-400">
                        ₦{availableBalanceNgn.toLocaleString()}
                      </span>
                    </div>

                    {/* Amount to Withdraw */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="text-zinc-300 font-medium">Withdrawal Amount (₦)</label>
                        <button
                          type="button"
                          onClick={() => setWithdrawAmount(String(availableBalanceNgn))}
                          className="text-[#2dd4bf] hover:underline text-[11px] font-mono cursor-pointer"
                        >
                          Max All
                        </button>
                      </div>
                      <input
                        type="number"
                        min="1000"
                        max={availableBalanceNgn}
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="e.g. 36000"
                        className="w-full h-10 px-3 rounded-lg bg-zinc-950 border border-zinc-700/80 text-white font-mono text-sm placeholder-zinc-500 focus:outline-none focus:border-[#2dd4bf]"
                        required
                      />
                    </div>

                    {/* Bank Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-300 font-medium">Bank Name</label>
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-zinc-950 border border-zinc-700/80 text-white text-xs focus:outline-none focus:border-[#2dd4bf]"
                        required
                      >
                        <option value="">Select Nigerian Bank...</option>
                        <option value="Access Bank">Access Bank</option>
                        <option value="GTBank (Guaranty Trust Bank)">GTBank (Guaranty Trust Bank)</option>
                        <option value="Zenith Bank">Zenith Bank</option>
                        <option value="First Bank of Nigeria">First Bank of Nigeria</option>
                        <option value="United Bank for Africa (UBA)">United Bank for Africa (UBA)</option>
                        <option value="Kuda Bank">Kuda Bank</option>
                        <option value="OPay">OPay</option>
                        <option value="PalmPay">PalmPay</option>
                        <option value="Moniepoint Microfinance Bank">Moniepoint MFB</option>
                        <option value="Stanbic IBTC Bank">Stanbic IBTC Bank</option>
                        <option value="FCMB (First City Monument Bank)">FCMB</option>
                        <option value="Sterling Bank">Sterling Bank</option>
                        <option value="Fidelity Bank">Fidelity Bank</option>
                        <option value="Union Bank of Nigeria">Union Bank</option>
                        <option value="Wema Bank (ALAT)">Wema Bank (ALAT)</option>
                      </select>
                    </div>

                    {/* Account Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-300 font-medium">NUBAN Account Number</label>
                      <input
                        type="text"
                        maxLength={10}
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="10-digit account number"
                        className="w-full h-10 px-3 rounded-lg bg-zinc-950 border border-zinc-700/80 text-white font-mono text-sm placeholder-zinc-500 focus:outline-none focus:border-[#2dd4bf]"
                        required
                      />
                    </div>

                    {/* Account Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-300 font-medium">Account Name (Full Legal Name)</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="As registered on bank account"
                        className="w-full h-10 px-3 rounded-lg bg-zinc-950 border border-zinc-700/80 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-[#2dd4bf]"
                        required
                      />
                    </div>

                    {/* Transfer Fee Preview */}
                    <div className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800 text-[11px] space-y-1 font-mono">
                      <div className="flex justify-between text-zinc-400">
                        <span>Platform fee:</span>
                        <span>₦100</span>
                      </div>
                      <div className="flex justify-between text-white font-bold pt-1 border-t border-zinc-800/80">
                        <span>Net Payout to Bank:</span>
                        <span className="text-emerald-400">
                          ₦{Math.max(0, Number(withdrawAmount || 0) - 100).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {withdrawError && (
                      <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{withdrawError}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsWithdrawModalOpen(false)}
                        className="px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={withdrawing || availableBalanceNgn < 1000}
                        className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                      >
                        {withdrawing ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Wallet className="h-3.5 w-3.5" />
                            <span>Confirm &amp; Withdraw</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </CreatorShell>
  );
}
