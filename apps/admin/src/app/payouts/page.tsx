'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { supabase } from '../../lib/supabaseClient';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Users,
  Music2,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Building2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  PieChart,
  Megaphone,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface BankDetails {
  hasBank: boolean;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  bankCode: string | null;
}

interface ProducerLedgerItem {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  email: string;
  catalogCount: number;
  totalPlays: number;
  totalDownloads: number;
  monthBeatsSold: number;
  monthGrossRevenueNgn: number;
  monthProducerEarned80PctNgn: number;
  lifetimeBeatsSold: number;
  lifetimeGrossRevenueNgn: number;
  lifetimeProducerEarned80PctNgn: number;
  availableBalanceNgn: number;
  pendingBalanceNgn: number;
  needsPayment: boolean;
  bankDetails: BankDetails;
}

interface PayoutRequest {
  id: string;
  producerId: string;
  producerName: string;
  producerHandle: string;
  producerAvatar: string | null;
  producerEmail: string;
  amountNgn: number;
  feeNgn: number;
  netNgn: number;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  status: 'pending' | 'completed' | 'rejected' | string;
  reference: string;
  createdAt: string;
  completedAt: string | null;
  inSelectedMonth: boolean;
}

interface BalanceSummary {
  monthTotalGrossNgn: number;
  monthPlatformNetGainNgn: number;
  monthProducerBeatShareNgn: number;
  monthPlatformBeatFeeNgn: number;
  monthBeatSalesCount: number;
  monthBeatGrossNgn: number;
  monthSubsCount: number;
  monthSubsGrossNgn: number;
  monthAdsCount: number;
  monthAdsGrossNgn: number;
  lifetimeTotalGrossNgn: number;
  lifetimePlatformNetGainNgn: number;
  lifetimeProducerBeatShareNgn: number;
  lifetimePlatformBeatFeeNgn: number;
  lifetimeBeatSalesCount: number;
  lifetimeBeatGrossNgn: number;
  lifetimeSubsCount: number;
  lifetimeSubsGrossNgn: number;
  lifetimeAdsGrossNgn: number;
  pendingPayoutsCount: number;
  pendingPayoutsAmountNgn: number;
}

export default function PayoutsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [monthName, setMonthName] = useState<string>('');
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [producers, setProducers] = useState<ProducerLedgerItem[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'producers' | 'requests' | 'matrix'>('producers');
  
  // Producer filter & search
  const [producerSearch, setProducerSearch] = useState('');
  const [producerFilter, setProducerFilter] = useState<'all' | 'needs_payment' | 'has_bank' | 'settled'>('all');

  // Payout requests filter
  const [requestFilter, setRequestFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [requestsMonthOnly, setRequestsMonthOnly] = useState(true);

  // Modals state
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<ProducerLedgerItem | null>(null);
  const [isDirectPayoutOpen, setIsDirectPayoutOpen] = useState(false);
  const [directPayoutAmount, setDirectPayoutAmount] = useState<string>('');
  const [transferRef, setTransferRef] = useState<string>('');
  const [modalLoading, setModalLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Month options (past 12 months)
  const monthOptions = useMemo(() => {
    const options: { label: string; value: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const lbl = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ label: lbl, value: val });
    }
    return options;
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchData = async (month: string) => {
    try {
      setRefreshing(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(`/api/payouts?month=${month}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        throw new Error(`Failed to load payouts data: ${res.statusText}`);
      }

      const data = await res.json();
      setSummary(data.balanceSummary);
      setProducers(data.producerLedger || []);
      setPayouts(data.payoutRequests || []);
      setMonthName(data.monthName || '');
    } catch (err: any) {
      console.error('Error fetching payouts ledger:', err);
      showToast('error', err.message || 'Error loading financial ledger');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(selectedMonth);
  }, [selectedMonth]);

  // Handle Approve Payout Request
  const handleApprove = async () => {
    if (!selectedPayout) return;
    try {
      setModalLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'approve',
          payoutId: selectedPayout.id,
          transferReference: transferRef || undefined
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to approve payout');

      showToast('success', `Payout to ${selectedPayout.producerName} marked as completed.`);
      setIsApproveOpen(false);
      setSelectedPayout(null);
      setTransferRef('');
      fetchData(selectedMonth);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to approve payout');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Reject Payout Request
  const handleReject = async () => {
    if (!selectedPayout) return;
    try {
      setModalLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'reject',
          payoutId: selectedPayout.id
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to reject payout');

      showToast('success', `Payout rejected. ₦${selectedPayout.amountNgn.toLocaleString()} refunded to producer.`);
      setIsRejectOpen(false);
      setSelectedPayout(null);
      fetchData(selectedMonth);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to reject payout');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle Direct Payout Settlement for a Producer
  const handleDirectPayout = async () => {
    if (!selectedProducer) return;
    const amount = Number(directPayoutAmount);
    if (!amount || amount <= 0) {
      showToast('error', 'Please enter a valid payout amount');
      return;
    }

    try {
      setModalLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          action: 'direct_payout',
          producerId: selectedProducer.id,
          amountNgn: amount,
          transferReference: transferRef || undefined
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to process payout');

      showToast('success', `Direct settlement of ₦${amount.toLocaleString()} recorded for ${selectedProducer.name}.`);
      setIsDirectPayoutOpen(false);
      setSelectedProducer(null);
      setDirectPayoutAmount('');
      setTransferRef('');
      fetchData(selectedMonth);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to record direct payout');
    } finally {
      setModalLoading(false);
    }
  };

  // Filtered Producers
  const filteredProducers = useMemo(() => {
    return producers.filter((p) => {
      const q = producerSearch.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.handle.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (producerFilter === 'needs_payment') return p.needsPayment;
      if (producerFilter === 'has_bank') return p.bankDetails.hasBank;
      if (producerFilter === 'settled') return !p.needsPayment && p.availableBalanceNgn === 0;

      return true;
    });
  }, [producers, producerSearch, producerFilter]);

  // Filtered Payout Requests
  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      if (requestsMonthOnly && !p.inSelectedMonth) return false;
      if (requestFilter !== 'all' && p.status !== requestFilter) return false;
      return true;
    });
  }, [payouts, requestsMonthOnly, requestFilter]);

  const totalOwedProducers = useMemo(() => {
    return producers.reduce((acc, curr) => acc + curr.availableBalanceNgn, 0);
  }, [producers]);

  const producersNeedingPaymentCount = useMemo(() => {
    return producers.filter((p) => p.needsPayment).length;
  }, [producers]);

  const formatNaira = (amount: number) => {
    return `₦${Math.round(amount).toLocaleString()}`;
  };

  return (
    <AdminShell activePath="/payouts">
      <div className="space-y-8 pb-16 max-w-7xl mx-auto">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-red-950/90 border-red-500/50 text-red-200'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            )}
            <span className="text-xs font-bold">{toastMessage.text}</span>
          </div>
        )}

        {/* Page Header with Scope Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#e53935]/20 text-[#ff6b67] border border-[#e53935]/30">
                Financial Telemetry
              </span>
              <span className="text-xs text-gray-400 font-mono">
                80% Producer / 20% Platform Royalties
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Payouts & Revenue Ledger</span>
            </h1>
            <p className="text-xs md:text-sm text-gray-400 mt-1 max-w-3xl">
              Real-time audit of monthly products sold, subscriptions gained, net royalties earned by producers, available settlement balances, and creator payout requests.
            </p>
          </div>

          {/* Month Selector & Refresh Button */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-[#12141c] border border-white/[0.12] hover:border-white/20 text-white text-xs font-bold px-4 py-2.5 pr-9 rounded-xl focus:outline-none focus:border-[#e53935] transition-colors cursor-pointer"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Calendar className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={() => fetchData(selectedMonth)}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-white/[0.12] bg-[#12141c] hover:bg-white/[0.06] text-gray-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              title="Refresh ledger"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-[#ff6b67]' : ''}`} />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TOP SUMMARY: PRODUCTS SOLD & PERCENTAGES GAINED (MONTHLY SCOPE) */}
        {/* ============================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-[#ff6b67]" />
              <span>Monthly Balance & Revenue Distribution ({monthName || 'Current Month'})</span>
            </h2>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              Active Verified Ledger
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: Total Gross Revenue */}
            <div className="p-4 rounded-2xl bg-[#12141c] border border-white/[0.08] relative overflow-hidden group hover:border-white/20 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span className="font-bold">Total Gross Revenue</span>
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="text-xl md:text-2xl font-black text-white font-mono">
                {summary ? formatNaira(summary.monthTotalGrossNgn) : '₦0'}
              </div>
              <div className="mt-2 text-[11px] text-gray-400 flex items-center justify-between">
                <span>Net Platform Gain:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {summary ? formatNaira(summary.monthPlatformNetGainNgn) : '₦0'}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                Lifetime: {summary ? formatNaira(summary.lifetimeTotalGrossNgn) : '₦0'}
              </div>
            </div>

            {/* Card 2: Beat Licenses (80% Producer / 20% Platform) */}
            <div className="p-4 rounded-2xl bg-[#12141c] border border-white/[0.08] relative overflow-hidden group hover:border-[#e53935]/40 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span className="font-bold">Beats Sold (80/20)</span>
                <Music2 className="h-4 w-4 text-[#ff6b67]" />
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-xl md:text-2xl font-black text-white font-mono">
                  {summary?.monthBeatSalesCount || 0} <span className="text-xs font-normal text-gray-400">beats</span>
                </div>
                <span className="text-xs font-bold text-gray-300 font-mono">
                  {summary ? formatNaira(summary.monthBeatGrossNgn) : '₦0'}
                </span>
              </div>
              
              {/* Visual Split Bar: 80% Producer / 20% Platform */}
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden flex">
                  <div className="bg-amber-400 h-full w-[80%]" title="80% Producer Royalties" />
                  <div className="bg-[#e53935] h-full w-[20%]" title="20% Platform Fee" />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-amber-400">80% Prod: {summary ? formatNaira(summary.monthProducerBeatShareNgn) : '₦0'}</span>
                  <span className="text-[#ff6b67]">20% Fee: {summary ? formatNaira(summary.monthPlatformBeatFeeNgn) : '₦0'}</span>
                </div>
              </div>
            </div>

            {/* Card 3: Subscriptions (100% Platform Gain) */}
            <div className="p-4 rounded-2xl bg-[#12141c] border border-white/[0.08] relative overflow-hidden group hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span className="font-bold">Subscriptions (100%)</span>
                <CreditCard className="h-4 w-4 text-purple-400" />
              </div>
              <div className="text-xl md:text-2xl font-black text-white font-mono">
                {summary ? formatNaira(summary.monthSubsGrossNgn) : '₦0'}
              </div>
              <div className="mt-2 text-[11px] text-gray-400 flex items-center justify-between">
                <span>Active Plans:</span>
                <span className="font-bold text-purple-300 font-mono">
                  {summary?.monthSubsCount || 0} subscriptions
                </span>
              </div>
              <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                100% Platform Revenue (Plus & Pro)
              </div>
            </div>

            {/* Card 4: Sponsored Audio Ads (100% Platform Gain) */}
            <div className="p-4 rounded-2xl bg-[#12141c] border border-white/[0.08] relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span className="font-bold">Sponsored Ads (100%)</span>
                <Megaphone className="h-4 w-4 text-blue-400" />
              </div>
              <div className="text-xl md:text-2xl font-black text-white font-mono">
                {summary ? formatNaira(summary.monthAdsGrossNgn) : '₦0'}
              </div>
              <div className="mt-2 text-[11px] text-gray-400 flex items-center justify-between">
                <span>Active Campaigns:</span>
                <span className="font-bold text-blue-300 font-mono">
                  {summary?.monthAdsCount || 0} ads
                </span>
              </div>
              <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                100% Platform Revenue
              </div>
            </div>

            {/* Card 5: Producer Balances & Payout Pipeline */}
            <div className="p-4 rounded-2xl bg-[#12141c] border border-white/[0.08] relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span className="font-bold">Available Balances</span>
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
              <div className="text-xl md:text-2xl font-black text-amber-400 font-mono">
                {formatNaira(totalOwedProducers)}
              </div>
              <div className="mt-2 text-[11px] text-gray-400 flex items-center justify-between">
                <span>Needs Payment:</span>
                <span className="font-bold text-amber-300 font-mono">
                  {producersNeedingPaymentCount} producers
                </span>
              </div>
              <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                Pending Requests: {summary?.pendingPayoutsCount || 0} ({summary ? formatNaira(summary.pendingPayoutsAmountNgn) : '₦0'})
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* NAVIGATION TABS */}
        {/* ============================================================== */}
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1">
          <button
            onClick={() => setActiveTab('producers')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'producers'
                ? 'bg-[#e53935] text-white shadow-lg shadow-[#e53935]/20'
                : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Producer Balances & Royalties</span>
            {producersNeedingPaymentCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-[#e53935] font-black">
                {producersNeedingPaymentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#e53935] text-white shadow-lg shadow-[#e53935]/20'
                : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Monthly Payout Requests</span>
            {(summary?.pendingPayoutsCount || 0) > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-black font-black">
                {summary?.pendingPayoutsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-[#e53935] text-white shadow-lg shadow-[#e53935]/20'
                : 'bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Revenue Splits & Percentages</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: PRODUCER REVENUE & BALANCE LEDGER */}
        {/* ============================================================== */}
        {activeTab === 'producers' && (
          <div className="space-y-4">
            {/* Control Bar: Search & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#12141c] border border-white/[0.08]">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search producer by name, handle, or email..."
                  value={producerSearch}
                  onChange={(e) => setProducerSearch(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-[#e53935] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setProducerFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    producerFilter === 'all'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All ({producers.length})
                </button>
                <button
                  onClick={() => setProducerFilter('needs_payment')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    producerFilter === 'needs_payment'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-gray-400 hover:text-amber-400'
                  }`}
                >
                  <span>Needs Payment</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-amber-300 font-mono">
                    {producersNeedingPaymentCount}
                  </span>
                </button>
                <button
                  onClick={() => setProducerFilter('has_bank')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    producerFilter === 'has_bank'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-gray-400 hover:text-emerald-400'
                  }`}
                >
                  Bank Configured
                </button>
                <button
                  onClick={() => setProducerFilter('settled')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    producerFilter === 'settled'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Settled (₦0)
                </button>
              </div>
            </div>

            {/* Producer Table */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#12141c] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/[0.08] text-gray-400 font-mono uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Producer</th>
                      <th className="py-3 px-3">Catalog Activity</th>
                      <th className="py-3 px-3 text-center">Month Beats Sold</th>
                      <th className="py-3 px-3 text-right">80% Royalties Earned</th>
                      <th className="py-3 px-3 text-right">Available Balance</th>
                      <th className="py-3 px-4">Payout Account</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 border-2 border-[#e53935] border-t-transparent rounded-full animate-spin" />
                            <span className="font-mono text-xs">Loading producer financial ledger...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredProducers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-500 font-mono">
                          No producers match the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredProducers.map((producer) => (
                        <tr
                          key={producer.id}
                          className="hover:bg-white/[0.02] transition-colors group"
                        >
                          {/* Producer Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {producer.avatar_url ? (
                                <img
                                  src={producer.avatar_url}
                                  alt={producer.name}
                                  className="h-9 w-9 rounded-full object-cover border border-white/10 shrink-0"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-white shrink-0 text-xs">
                                  {producer.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 max-w-[180px]">
                                <span className="font-bold text-white block truncate">
                                  {producer.name}
                                </span>
                                <span className="text-[11px] text-gray-400 font-mono block truncate">
                                  @{producer.handle}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono block truncate">
                                  {producer.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Catalog Activity */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-0.5">
                              <span className="font-bold text-gray-200 block">
                                {producer.catalogCount} tracks
                              </span>
                              <span className="text-[11px] text-gray-400 font-mono block">
                                {producer.totalPlays.toLocaleString()} plays • {producer.totalDownloads.toLocaleString()} dls
                              </span>
                            </div>
                          </td>

                          {/* Beats Sold This Month & Lifetime */}
                          <td className="py-3.5 px-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] font-mono font-bold text-white">
                              {producer.monthBeatsSold}
                            </span>
                            <span className="block text-[10px] text-gray-500 font-mono mt-0.5">
                              Lifetime: {producer.lifetimeBeatsSold}
                            </span>
                          </td>

                          {/* 80% Royalties Earned */}
                          <td className="py-3.5 px-3 text-right">
                            <span className="font-black font-mono text-emerald-400 text-sm block">
                              {formatNaira(producer.monthProducerEarned80PctNgn)}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono block">
                              Gross: {formatNaira(producer.monthGrossRevenueNgn)}
                            </span>
                          </td>

                          {/* Available Balance */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="space-y-0.5">
                              <span
                                className={`font-black font-mono text-sm block ${
                                  producer.availableBalanceNgn > 0
                                    ? 'text-amber-400 font-bold'
                                    : 'text-gray-400'
                                }`}
                              >
                                {formatNaira(producer.availableBalanceNgn)}
                              </span>
                              {producer.pendingBalanceNgn > 0 && (
                                <span className="text-[10px] text-purple-400 font-mono block">
                                  Pending: {formatNaira(producer.pendingBalanceNgn)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Bank Details */}
                          <td className="py-3.5 px-4">
                            {producer.bankDetails.hasBank ? (
                              <div className="space-y-0.5 min-w-0 max-w-[170px]">
                                <span className="font-bold text-white block truncate text-[11px]">
                                  {producer.bankDetails.bankName}
                                </span>
                                <span className="text-[11px] text-gray-300 font-mono block tracking-wider">
                                  •••• {producer.bankDetails.accountNumber?.slice(-4)}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono block truncate">
                                  {producer.bankDetails.accountName}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-500 bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.05]">
                                <AlertTriangle className="h-3 w-3 text-amber-500" />
                                No bank added
                              </span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-3 text-center">
                            {producer.needsPayment ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                                <Clock className="h-3 w-3" />
                                Needs Payment
                              </span>
                            ) : producer.pendingBalanceNgn > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                                Pending Trf
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/[0.05] text-gray-400 border border-white/[0.08] whitespace-nowrap">
                                <Check className="h-3 w-3 text-emerald-400" />
                                Settled
                              </span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedProducer(producer);
                                setDirectPayoutAmount(String(producer.availableBalanceNgn));
                                setIsDirectPayoutOpen(true);
                              }}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1 cursor-pointer ${
                                producer.availableBalanceNgn > 0
                                  ? 'bg-[#e53935] hover:bg-[#d32f2f] text-white shadow-sm shadow-[#e53935]/30'
                                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-300'
                              }`}
                            >
                              <span>{producer.availableBalanceNgn > 0 ? 'Settle & Pay' : 'Manual Payout'}</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PRODUCER PAYMENT REQUESTS (WITHDRAWALS) */}
        {/* ============================================================== */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#12141c] border border-white/[0.08]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRequestsMonthOnly(!requestsMonthOnly)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border cursor-pointer ${
                    requestsMonthOnly
                      ? 'bg-[#e53935]/20 text-[#ff6b67] border-[#e53935]/40'
                      : 'bg-white/[0.04] text-gray-400 border-white/[0.08] hover:text-white'
                  }`}
                >
                  {requestsMonthOnly ? `Only ${monthName || 'Selected Month'}` : 'All Months (Lifetime)'}
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setRequestFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    requestFilter === 'all'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  All Requests
                </button>
                <button
                  onClick={() => setRequestFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    requestFilter === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-gray-400 hover:text-amber-400'
                  }`}
                >
                  Pending Review ({payouts.filter((p) => p.status === 'pending').length})
                </button>
                <button
                  onClick={() => setRequestFilter('completed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    requestFilter === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-gray-400 hover:text-emerald-400'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setRequestFilter('rejected')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    requestFilter === 'rejected'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'text-gray-400 hover:text-red-400'
                  }`}
                >
                  Rejected
                </button>
              </div>
            </div>

            {/* Requests Table */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#12141c] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/[0.08] text-gray-400 font-mono uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Date & Ref</th>
                      <th className="py-3 px-4">Producer</th>
                      <th className="py-3 px-3 text-right">Requested (₦)</th>
                      <th className="py-3 px-3 text-right">Net Payout</th>
                      <th className="py-3 px-4">Beneficiary Bank Account</th>
                      <th className="py-3 px-3 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-6 w-6 border-2 border-[#e53935] border-t-transparent rounded-full animate-spin" />
                            <span className="font-mono text-xs">Loading withdrawal requests...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredPayouts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-gray-500 font-mono">
                          No payout requests recorded for this period.
                        </td>
                      </tr>
                    ) : (
                      filteredPayouts.map((payout) => (
                        <tr
                          key={payout.id}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          {/* Date & Ref */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-white block">
                                {new Date(payout.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono block">
                                {new Date(payout.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono block">
                                {payout.reference}
                              </span>
                            </div>
                          </td>

                          {/* Producer */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {payout.producerAvatar ? (
                                <img
                                  src={payout.producerAvatar}
                                  alt={payout.producerName}
                                  className="h-8 w-8 rounded-full object-cover border border-white/10 shrink-0"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-white shrink-0 text-xs">
                                  {payout.producerName.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 max-w-[160px]">
                                <span className="font-bold text-white block truncate">
                                  {payout.producerName}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono block truncate">
                                  @{payout.producerHandle}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Requested Amount */}
                          <td className="py-3.5 px-3 text-right">
                            <span className="font-bold font-mono text-white text-sm block">
                              {formatNaira(payout.amountNgn)}
                            </span>
                            {payout.feeNgn > 0 && (
                              <span className="text-[10px] text-gray-500 font-mono block">
                                Fee: {formatNaira(payout.feeNgn)}
                              </span>
                            )}
                          </td>

                          {/* Net Payout */}
                          <td className="py-3.5 px-3 text-right">
                            <span className="font-black font-mono text-emerald-400 text-sm block">
                              {formatNaira(payout.netNgn || payout.amountNgn)}
                            </span>
                          </td>

                          {/* Bank Account */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5 min-w-0 max-w-[200px]">
                              <span className="font-bold text-white block truncate text-[11px]">
                                {payout.bankName || 'Nigerian Bank'}
                              </span>
                              <span className="text-[11px] text-amber-300 font-mono block tracking-wider">
                                {payout.accountNumber}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono block truncate">
                                {payout.accountName}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3 text-center">
                            {payout.status === 'completed' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="h-3 w-3" />
                                Completed
                              </span>
                            ) : payout.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
                                <X className="h-3 w-3" />
                                Rejected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                                <Clock className="h-3 w-3" />
                                Awaiting Transfer
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            {payout.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedPayout(payout);
                                    setTransferRef(`trf_${Date.now()}`);
                                    setIsApproveOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approve & Paid</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedPayout(payout);
                                    setIsRejectOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs transition-colors border border-red-500/20 cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-500 font-mono">
                                {payout.completedAt
                                  ? `Settled ${new Date(payout.completedAt).toLocaleDateString()}`
                                  : 'Processed'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: REVENUE SPLITS & PERCENTAGES MATRIX */}
        {/* ============================================================== */}
        {activeTab === 'matrix' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Split Card 1: Beat Commercial Licensing */}
            <div className="p-6 rounded-2xl bg-[#12141c] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Music2 className="h-5 w-5 text-[#ff6b67]" />
                  <h3 className="font-bold text-white text-sm">Beat Commercial Licenses</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#e53935]/20 text-[#ff6b67] border border-[#e53935]/30">
                  80 / 20 Split
                </span>
              </div>

              <div className="space-y-3 text-xs text-gray-300">
                <p>
                  Every time a creator or artist purchases a beat commercial lease (Trackout ₦30k+, Exclusive ₦100k+, or standard license):
                </p>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-1 font-mono">
                  <div className="flex justify-between font-bold">
                    <span>Producer Royalties:</span>
                    <span>80%</span>
                  </div>
                  <p className="text-[11px] text-amber-300/80 font-sans">
                    Automatically credited to the beat author's available balance.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#e53935]/10 border border-[#e53935]/20 text-[#ff6b67] space-y-1 font-mono">
                  <div className="flex justify-between font-bold">
                    <span>Caution Studio Fee:</span>
                    <span>20%</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-sans">
                    Retained by the platform to cover hosting, payment gateway fees, and infrastructure.
                  </p>
                </div>
              </div>
            </div>

            {/* Split Card 2: Artist Subscriptions */}
            <div className="p-6 rounded-2xl bg-[#12141c] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-400" />
                  <h3 className="font-bold text-white text-sm">Platform Subscriptions</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  100% Platform
                </span>
              </div>

              <div className="space-y-3 text-xs text-gray-300">
                <p>
                  Artists subscribe monthly to unlock downloads, in-browser studio recording, and ad-free streaming:
                </p>
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 space-y-1 font-mono">
                  <div className="flex justify-between font-bold">
                    <span>Caution Plus:</span>
                    <span>₦3,000 / month</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-purple-500/20">
                    <span>Caution Pro:</span>
                    <span>₦10,000 / month</span>
                  </div>
                  <p className="text-[11px] text-purple-300/80 font-sans pt-1">
                    100% platform gain allocated to bandwidth, Cloudflare R2 audio streaming, and platform maintenance.
                  </p>
                </div>
              </div>
            </div>

            {/* Split Card 3: Sponsored Music Audio Ads */}
            <div className="p-6 rounded-2xl bg-[#12141c] border border-white/[0.08] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-white text-sm">Sponsored Music Ads</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  100% Platform
                </span>
              </div>

              <div className="space-y-3 text-xs text-gray-300">
                <p>
                  Producers and record labels pay to sponsor audio ads inserted during free streams:
                </p>
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 space-y-1 font-mono">
                  <div className="flex justify-between font-bold">
                    <span>Audio Ad Slots:</span>
                    <span>₦5,000 - ₦50,000</span>
                  </div>
                  <p className="text-[11px] text-blue-300/80 font-sans pt-1">
                    100% platform revenue directly funding listener rewards and platform operations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: DIRECT PAYOUT / SETTLE PRODUCER */}
        {/* ============================================================== */}
        {isDirectPayoutOpen && selectedProducer && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#12141c] border border-white/[0.12] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-sm font-bold text-white">Record Producer Payout</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Direct settlement & bank payout</p>
                </div>
                <button
                  onClick={() => setIsDirectPayoutOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.05]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Beneficiary Details */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Producer:</span>
                  <span className="font-bold text-white">{selectedProducer.name} (@{selectedProducer.handle})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Available Balance:</span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatNaira(selectedProducer.availableBalanceNgn)}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/[0.06] space-y-1">
                  <span className="text-[11px] text-gray-400 block">Bank Account:</span>
                  {selectedProducer.bankDetails.hasBank ? (
                    <div className="font-mono text-white text-xs">
                      <span className="font-bold">{selectedProducer.bankDetails.bankName}</span> • {selectedProducer.bankDetails.accountNumber} ({selectedProducer.bankDetails.accountName})
                    </div>
                  ) : (
                    <span className="text-amber-400 font-mono text-[11px]">
                      No bank details registered on producer profile.
                    </span>
                  )}
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Payout Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={directPayoutAmount}
                    onChange={(e) => setDirectPayoutAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#e53935]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Transfer Reference / Receipt (Optional)
                  </label>
                  <input
                    type="text"
                    value={transferRef}
                    onChange={(e) => setTransferRef(e.target.value)}
                    placeholder="e.g. trf_pstk_91829 or bank session ID"
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#e53935]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsDirectPayoutOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDirectPayout}
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#e53935] hover:bg-[#d32f2f] text-white shadow-lg shadow-[#e53935]/25 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {modalLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>Confirm Settlement</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: APPROVE PAYOUT REQUEST */}
        {/* ============================================================== */}
        {isApproveOpen && selectedPayout && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#12141c] border border-white/[0.12] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-sm font-bold text-white">Approve & Mark Paid</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Producer withdrawal confirmation</p>
                </div>
                <button
                  onClick={() => setIsApproveOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Beneficiary:</span>
                  <span className="font-bold text-white">{selectedPayout.producerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Bank:</span>
                  <span className="font-bold text-white">{selectedPayout.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Account Number:</span>
                  <span className="font-mono font-bold text-amber-300">{selectedPayout.accountNumber}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-emerald-500/20">
                  <span className="text-gray-400">Net Transfer:</span>
                  <span className="font-mono font-black text-emerald-300 text-sm">
                    {formatNaira(selectedPayout.netNgn || selectedPayout.amountNgn)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Bank Transfer Reference / Session ID
                </label>
                <input
                  type="text"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  placeholder="e.g. trf_1732389102"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
                <button
                  onClick={() => setIsApproveOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {modalLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>Confirm Payout Sent</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODAL: REJECT PAYOUT REQUEST */}
        {/* ============================================================== */}
        {isRejectOpen && selectedPayout && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#12141c] border border-white/[0.12] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-sm font-bold text-white">Reject Withdrawal</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Refund back to producer's balance</p>
                </div>
                <button
                  onClick={() => setIsRejectOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-gray-300">
                Are you sure you want to reject this withdrawal request of{' '}
                <strong className="text-white font-mono">{formatNaira(selectedPayout.amountNgn)}</strong>{' '}
                for <strong className="text-white">{selectedPayout.producerName}</strong>? The funds will be restored immediately to their available balance.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.08]">
                <button
                  onClick={() => setIsRejectOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {modalLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  <span>Confirm Rejection</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
