'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  CreditCard,
  Check,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  Download,
  Shield,
  Zap,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { UserDropdown, UserProfileData } from '../../components/UserDropdown';
import { setCachedUserPlan } from '../../lib/subscription';

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  rawDate: string;
  amountNgn: number;
  formattedAmount: string;
  status: string;
  items?: any[];
  pdfUrl?: string;
}

export default function SubscriptionsPage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'plus'>('free');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  async function loadBillingInvoices(userId?: string) {
    try {
      setLoadingInvoices(true);
      const url = userId ? `/api/billing?userId=${encodeURIComponent(userId)}` : '/api/billing';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.invoices) {
          setInvoices(data.invoices);
        }
        if (data.profile) {
          setProfile(data.profile);
          setCurrentPlan(data.profile.plan === 'plus' ? 'plus' : 'free');
          setCachedUserPlan(data.profile.plan === 'plus' ? 'plus' : 'free');
        }
      }
    } catch (err) {
      console.warn('Could not load billing invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  }

  useEffect(() => {
    async function initUserAndBilling() {
      try {
        let currentUserId: string | undefined;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          currentUserId = session.user.id;
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (data) {
            setProfile(data);
            setCurrentPlan(data.plan === 'plus' ? 'plus' : 'free');
          }
        }

        if (!currentUserId) {
          const { data: publicProfile } = await supabase
            .from('profiles')
            .select('*')
            .limit(1)
            .maybeSingle();

          if (publicProfile) {
            currentUserId = publicProfile.id;
            setProfile(publicProfile);
            setCurrentPlan(publicProfile.plan === 'plus' ? 'plus' : 'free');
          } else {
            setProfile({
              id: 'demo-user',
              handle: 'arakunrincole',
              display_name: 'Arakunrin Cole',
              avatar_url: '/images/artist_studio_mic.jpg',
              plan: 'free',
              bio: 'Producer & Sound Designer'
            });
            setCurrentPlan('free');
          }
        }

        await loadBillingInvoices(currentUserId);
      } catch (err) {
        console.error('Error fetching plan & billing:', err);
      }
    }

    initUserAndBilling();
  }, []);

  const handlePlanChange = async (targetPlan: 'free' | 'plus') => {
    if (targetPlan === currentPlan) return;
    setIsLoading(true);
    setNotification(null);

    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile?.id,
          plan: targetPlan,
          billingCycle
        })
      });

      if (res.ok) {
        setCurrentPlan(targetPlan);
        setProfile((prev) => (prev ? { ...prev, plan: targetPlan } : null));
        setCachedUserPlan(targetPlan);

        // Instantly reload invoices from real database records
        await loadBillingInvoices(profile?.id);

        if (targetPlan === 'plus') {
          setNotification(`Upgraded to Caution Plus (${billingCycle === 'yearly' ? '₦30,000 / year' : '₦3,000 / month'})! Real invoice issued in database.`);
        } else {
          setNotification('Subscription updated to Free Tier.');
        }
      } else {
        throw new Error('Failed to update plan on database');
      }

      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error('Plan update error:', err);
      if (profile?.id && profile.id !== 'demo-user') {
        await supabase.from('profiles').update({ plan: targetPlan }).eq('id', profile.id);
      }
      setCurrentPlan(targetPlan);
      setCachedUserPlan(targetPlan);
      setNotification('Plan preference updated.');
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const isPlus = currentPlan === 'plus';

  return (
    <div className="min-h-screen bg-[#08090B] text-white flex flex-col font-sans selection:bg-[#04564f] selection:text-white pb-20">
      {/* 1. TOP HEADER */}
      <header className="h-16 border-b border-white/[0.06] bg-[#0A0B0E] px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center shrink-0">
          <Link href="/" className="inline-flex items-center">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-7 sm:h-8 w-auto object-contain brightness-0 invert max-w-[130px] sm:max-w-[190px]"
            />
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="relative flex items-center w-full">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plans & subscriptions..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#141518] border border-white/[0.06] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 text-xs font-semibold text-white/90 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-gray-400" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          <UserDropdown />
        </div>
      </header>

      {/* 2. MAIN BODY */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-5 sm:p-8 space-y-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href="/" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#2dd4bf] font-medium">Subscriptions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Subscription & Membership
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Manage your plan tier, stem downloads, commercial synchronization clearance, and billing receipts.
          </p>
        </div>

        {notification && (
          <div className="p-4 rounded-xl bg-[#04564f]/40 border border-[#2dd4bf]/50 text-white flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-5 w-5 text-[#2dd4bf] shrink-0" />
            <span className="text-xs font-semibold text-[#2dd4bf]">{notification}</span>
          </div>
        )}

        {/* Current Active Plan Status Banner */}
        <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
              CURRENT SUBSCRIPTION
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {isPlus ? 'Caution Plus Tier' : 'Free Creator Plan'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
              {isPlus
                ? 'Your plan includes unlimited 24-bit lossless streaming, stems (.ZIP) downloads, and 1 monthly lease credit. Renews on Nov 15, 2026.'
                : 'You are on the free tier with 128kbps tagged previews. Upgrade to Caution Plus for lossless streaming and WAV stems.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {!isPlus ? (
              <button
                type="button"
                onClick={() => handlePlanChange('plus')}
                disabled={isLoading}
                className="px-6 py-3 rounded-full bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-[#2dd4bf]/30 transition-colors shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>Upgrade to Plus</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handlePlanChange('free')}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-full border border-white/20 hover:border-white/40 text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                Switch to Free Plan
              </button>
            )}
          </div>
        </div>

        {/* Pricing Plan Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
              Available Plans
            </h3>
            {/* Billing cycle pill toggle */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-[#121316] border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-[#04564f] text-[#2dd4bf]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                  billingCycle === 'yearly'
                    ? 'bg-[#04564f] text-[#2dd4bf]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Plan 1: Free */}
            <div
              className={`p-6 rounded-2xl bg-[#121316] border transition-all flex flex-col justify-between ${
                !isPlus ? 'border-[#2dd4bf]/60 shadow-lg' : 'border-white/[0.06]'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-white">Free Creator</h4>
                  {!isPlus && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-gray-300">
                      CURRENT
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-3xl font-black text-white">
                    <span className="font-sans font-semibold text-2xl text-[#2dd4bf] mr-1 select-none">₦</span>0
                  </span>
                  <span className="text-xs text-gray-400"> / forever</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Basic access for listening, searching producers, and buying standard single-track leases.
                </p>

                <div className="space-y-2.5 pt-2 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>128kbps tagged streaming previews</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>Browse unlimited producers & catalogs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>Single beat standard checkout</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handlePlanChange('free')}
                  disabled={!isPlus || isLoading}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    !isPlus
                      ? 'bg-white/10 text-gray-400 cursor-default'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {!isPlus ? 'Current Plan' : 'Downgrade to Free'}
                </button>
              </div>
            </div>

            {/* Plan 2: Plus */}
            <div
              className={`p-6 rounded-2xl bg-[#121316] border relative overflow-hidden transition-all flex flex-col justify-between ${
                isPlus
                  ? 'border-[#2dd4bf] shadow-xl ring-1 ring-[#2dd4bf]/40'
                  : 'border-[#04564f]/50 hover:border-[#2dd4bf]/40'
              }`}
            >
              <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-l from-[#04564f] to-[#2dd4bf] text-black text-[10px] font-black uppercase tracking-wider rounded-bl-xl">
                MOST POPULAR
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#2dd4bf]" />
                    <h4 className="text-lg font-black text-white">Caution Plus</h4>
                  </div>
                  {isPlus && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/30">
                      CURRENT
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-3xl font-black text-white">
                    <span className="font-sans font-semibold text-2xl text-[#2dd4bf] mr-1 select-none">₦</span>
                    {billingCycle === 'monthly' ? '3,000' : '30,000'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {billingCycle === 'monthly' ? ' / month' : ' / year'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Full studio clearance for active recording artists, labels, and commercial creators.
                </p>

                <div className="space-y-2.5 pt-2 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>Unlimited 24-bit lossless FLAC streaming</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>Full WAV trackout stems (.ZIP) download rights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>Commercial synchronization rights (YouTube, DSPs)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>1 Free Basic Lease credit every month</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handlePlanChange('plus')}
                  disabled={isPlus || isLoading}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    isPlus
                      ? 'bg-[#04564f] text-[#2dd4bf] cursor-default border border-[#2dd4bf]/30'
                      : 'bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] border border-[#2dd4bf]/40 shadow-lg'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isPlus ? 'Active Plan' : 'Upgrade to Plus'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Billing History & Invoices */}
        <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
              Billing History & Tax Receipts
            </h3>
            <span className="text-xs text-gray-500 font-mono">Currency: NGN (₦)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-gray-400 font-mono uppercase tracking-wider">
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loadingInvoices ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 font-mono">
                      Loading billing history from database...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 font-mono">
                      No billing transactions found in database.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 font-mono text-gray-300 font-medium">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 text-gray-400">{inv.date}</td>
                      <td className="py-3.5 font-bold text-white font-mono">{inv.formattedAmount}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          inv.status === 'PAID'
                            ? 'bg-[#04564f]/50 text-[#2dd4bf] border-[#2dd4bf]/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <a
                          href={inv.pdfUrl || `/api/billing/receipt?id=${inv.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#2dd4bf] hover:text-[#5eead4] hover:underline font-semibold cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>PDF</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
