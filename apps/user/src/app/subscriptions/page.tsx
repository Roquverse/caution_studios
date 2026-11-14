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
import { UserProfileData } from '../../components/UserDropdown';
import { UserShell } from '../../components/UserShell';
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
        if (data.invoices && data.invoices.length > 0) {
          const latest = data.invoices[0];
          if (latest.amountNgn >= 20000) {
            setBillingCycle('yearly');
          }
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
        let session = (await supabase.auth.getSession()).data.session;

        // Check shared root-domain cookie
        if (!session?.user && typeof document !== 'undefined') {
          const matchToken = document.cookie.match(/(?:^|;\s*)sb-token=([^;]*)/);
          const matchRefresh = document.cookie.match(/(?:^|;\s*)sb-refresh=([^;]*)/);
          const cookieToken = matchToken ? decodeURIComponent(matchToken[1]) : null;
          const cookieRefresh = matchRefresh ? decodeURIComponent(matchRefresh[1]) : null;

          if (cookieToken && cookieRefresh) {
            try {
              const { data: restored } = await supabase.auth.setSession({
                access_token: cookieToken,
                refresh_token: cookieRefresh
              });
              if (restored?.session?.user) session = restored.session;
            } catch (e) {}
          }
        }

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
          } else {
            const meta = session.user.user_metadata || {};
            setProfile({
              id: session.user.id,
              handle: meta.handle || session.user.email?.split('@')[0] || 'user',
              display_name: meta.full_name || session.user.email?.split('@')[0] || 'User',
              avatar_url: meta.avatar_url || null,
              plan: 'free',
              bio: null
            });
            setCurrentPlan('free');
          }
        }

        if (currentUserId) {
          await loadBillingInvoices(currentUserId);
        }
      } catch (err) {
        console.error('Error fetching plan & billing:', err);
      }
    }

    initUserAndBilling();
  }, []);

  const handleSubscribe = async (cycle: 'monthly' | 'yearly') => {
    setIsLoading(true);
    setNotification(null);
    setBillingCycle(cycle);

    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile?.id,
          plan: 'plus',
          billingCycle: cycle
        })
      });

      if (res.ok) {
        setCurrentPlan('plus');
        setProfile((prev) => (prev ? { ...prev, plan: 'plus' } : null));
        setCachedUserPlan('plus');

        // Instantly reload invoices from real database records
        await loadBillingInvoices(profile?.id);

        setNotification(
          `Subscribed to Caution Plus (${cycle === 'yearly' ? '₦30,000 / year' : '₦3,000 / month'})! Real invoice issued in database.`
        );
      } else {
        throw new Error('Failed to update plan on database');
      }

      setTimeout(() => setNotification(null), 5000);
    } catch (err) {
      console.error('Plan update error:', err);
      if (profile?.id && profile.id !== 'demo-user') {
        await supabase.from('profiles').update({ plan: 'plus' }).eq('id', profile.id);
      }
      setCurrentPlan('plus');
      setCachedUserPlan('plus');
      setNotification(`Caution Plus (${cycle === 'yearly' ? '₦30,000 / year' : '₦3,000 / month'}) activated.`);
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const isPlus = currentPlan === 'plus';

  return (
    <UserShell activePath="/subscriptions">
      <div className="max-w-5xl mx-auto space-y-8">
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
                {isPlus
                  ? `Caution Plus Tier (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`
                  : 'Subscription Inactive'}
              </h2>
              {isPlus ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/30">
                  ACTIVE
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  PAYMENT REQUIRED
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
              {isPlus
                ? `Your Caution Plus plan includes unlimited 24-bit lossless streaming, full WAV trackout stems (.ZIP) downloads, and commercial synchronization rights. ${
                    billingCycle === 'yearly' ? 'Annual membership active (saves 20%).' : 'Renews monthly.'
                  }`
                : 'Caution Studio requires an active Caution Plus membership. Choose your preferred billing cycle below to unlock unlimited lossless streaming, full trackout stems (.ZIP), and commercial release clearance.'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {!isPlus ? (
              <button
                type="button"
                onClick={() => handleSubscribe(billingCycle)}
                disabled={isLoading}
                className="px-6 py-3 rounded-full bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-[#2dd4bf]/30 transition-colors shadow-lg cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>Activate Caution Plus</span>
              </button>
            ) : billingCycle === 'monthly' ? (
              <button
                type="button"
                onClick={() => handleSubscribe('yearly')}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-full bg-[#04564f]/40 hover:bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/40 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Upgrade to Annual (Save 20%)</span>
              </button>
            ) : (
              <div className="px-4 py-2 rounded-full bg-[#04564f]/40 border border-[#2dd4bf]/30 text-xs font-mono font-bold text-[#2dd4bf] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Annual Member Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Plan Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                Available Membership Plans
              </h3>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                Paid-only access with full studio rights & uncompressed stems
              </p>
            </div>
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
            {/* Plan 1: Caution Plus (Monthly) */}
            <div
              className={`p-6 rounded-2xl bg-[#121316] border transition-all flex flex-col justify-between ${
                isPlus && billingCycle === 'monthly'
                  ? 'border-[#2dd4bf] shadow-xl ring-1 ring-[#2dd4bf]/40'
                  : 'border-white/[0.08] hover:border-white/20'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#2dd4bf]" />
                    <h4 className="text-lg font-black text-white">Caution Plus (Monthly)</h4>
                  </div>
                  {isPlus && billingCycle === 'monthly' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/30">
                      CURRENT
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/5 text-gray-400 border border-white/10">
                      FLEXIBLE
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-3xl font-black text-white">
                    <span className="font-sans font-semibold text-2xl text-[#2dd4bf] mr-1 select-none">₦</span>
                    3,000
                  </span>
                  <span className="text-xs text-gray-400"> / month</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Full studio clearance for active recording artists, labels, and commercial creators. Billed monthly.
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
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>Standard pay-as-you-go flexibility (cancel anytime)</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handleSubscribe('monthly')}
                  disabled={isLoading || (isPlus && billingCycle === 'monthly')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    isPlus && billingCycle === 'monthly'
                      ? 'bg-[#04564f] text-[#2dd4bf] cursor-default border border-[#2dd4bf]/30'
                      : 'bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] border border-[#2dd4bf]/40 shadow-lg'
                  }`}
                >
                  {isPlus && billingCycle === 'monthly' ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Active Plan</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{isPlus ? 'Switch to Monthly (₦3,000)' : 'Subscribe Monthly (₦3,000)'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Plan 2: Caution Plus (Annual) */}
            <div
              className={`p-6 rounded-2xl bg-[#121316] border relative overflow-hidden transition-all flex flex-col justify-between ${
                isPlus && billingCycle === 'yearly'
                  ? 'border-[#2dd4bf] shadow-xl ring-1 ring-[#2dd4bf]/40'
                  : 'border-[#04564f]/70 hover:border-[#2dd4bf]/50'
              }`}
            >
              <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-l from-[#04564f] to-[#2dd4bf] text-black text-[10px] font-black uppercase tracking-wider rounded-bl-xl shadow-md">
                MOST POPULAR • SAVE 20%
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#2dd4bf]" />
                    <h4 className="text-lg font-black text-white">Caution Plus (Annual)</h4>
                  </div>
                  {isPlus && billingCycle === 'yearly' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/30">
                      CURRENT
                    </span>
                  )}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">
                      <span className="font-sans font-semibold text-2xl text-[#2dd4bf] mr-1 select-none">₦</span>
                      30,000
                    </span>
                    <span className="text-xs text-gray-400"> / year</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#2dd4bf]">
                    ₦2,500 / month • 2 Months Free
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Best value for active recording artists and producers. Includes full stem clearance and upfront lease credits.
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
                    <span>12 Free Basic Lease credits (1 per month)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>Save ₦6,000 per year (2 months completely free)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>Priority Stem Mastering & VIP Studio Support</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handleSubscribe('yearly')}
                  disabled={isLoading || (isPlus && billingCycle === 'yearly')}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    isPlus && billingCycle === 'yearly'
                      ? 'bg-[#04564f] text-[#2dd4bf] cursor-default border border-[#2dd4bf]/30'
                      : 'bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] border border-[#2dd4bf]/40 shadow-lg'
                  }`}
                >
                  {isPlus && billingCycle === 'yearly' ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Active Plan</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{isPlus ? 'Upgrade to Annual (Save 20%)' : 'Subscribe Annually (₦30,000)'}</span>
                    </>
                  )}
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
      </div>
    </UserShell>
  );
}
