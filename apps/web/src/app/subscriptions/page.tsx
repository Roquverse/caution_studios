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
import { setCachedUserPlan, useDailyDownloadQuota } from '../../lib/subscription';
import { APP_URL } from '../../lib/urls';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';

export default function SubscriptionsPage() {
  const downloadQuota = useDailyDownloadQuota();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'plus' | 'pro'>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchUserPlan() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (data) {
            setProfile(data);
            const p = data.plan === 'pro' ? 'pro' : data.plan === 'plus' ? 'plus' : 'free';
            setCurrentPlan(p);
            setCachedUserPlan(p);
            return;
          }
        }

        // Fallback to primary / demo profile
        const { data: publicProfile } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (publicProfile) {
          setProfile(publicProfile);
          const p = publicProfile.plan === 'pro' ? 'pro' : publicProfile.plan === 'plus' ? 'plus' : 'free';
          setCurrentPlan(p);
          setCachedUserPlan(p);
        } else {
          setProfile({
            id: 'demo-user',
            handle: 'user',
            display_name: 'Arakunrin Cole',
            avatar_url: '/images/artist_studio_mic.jpg',
            plan: 'free',
            bio: 'Producer & Sound Designer'
          });
          setCurrentPlan('free');
          setCachedUserPlan('free');
        }
      } catch (err) {
        console.error('Error fetching plan:', err);
      }
    }

    fetchUserPlan();

    // Verify Paystack payment if redirected with reference
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paystackRef = urlParams.get('reference') || urlParams.get('trxref');
      const orderId = urlParams.get('order_id');

      if (paystackRef) {
        setIsLoading(true);
        fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: paystackRef,
            order_id: orderId,
            plan: orderId?.includes('pro') || paystackRef.includes('pro') ? 'pro' : 'plus'
          })
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.verified || data.status) {
              const targetPlan = data.plan === 'pro' ? 'pro' : 'plus';
              setCurrentPlan(targetPlan);
              setCachedUserPlan(targetPlan);
              setNotification(
                `🎉 Payment verified via Paystack! Caution ${targetPlan === 'pro' ? 'Pro' : 'Plus'} membership is now active.`
              );
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch((e) => console.error('Paystack verification error:', e))
          .finally(() => setIsLoading(false));
      }
    }
  }, []);

  const handleSubscribe = async (tier: 'plus' | 'pro') => {
    setIsLoading(true);
    setNotification(null);

    try {
      const amountNgn = tier === 'pro' ? 30000 : 3000;
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = (profile as any)?.email || session?.user?.email || 'artist@cautionstudio.com';
      const orderId = `sub_${tier}_${Date.now()}`;

      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          amountNgn,
          orderId,
          callbackUrl: `${window.location.origin}/subscriptions`,
          metadata: {
            type: 'subscription',
            plan: tier,
            billing_cycle: tier,
            user_id: profile?.id || session?.user?.id || null
          }
        })
      });

      const data = await res.json();
      const redirectUrl = data.data?.authorization_url || data.authorization_url;
      if (
        redirectUrl &&
        (redirectUrl.startsWith('https://checkout.paystack.com') || redirectUrl.startsWith('http'))
      ) {
        window.location.href = redirectUrl;
        return;
      }

      if (!data.status || data.configured === false || data.error === 'PAYSTACK_NOT_CONFIGURED') {
        throw new Error('Paystack secret key is not configured in Vercel environment variables.');
      } else {
        throw new Error(data.error || 'Failed to initialize Paystack');
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      if (profile?.id && profile.id !== 'demo-user') {
        await supabase.from('profiles').update({ plan: tier }).eq('id', profile.id);
      }
      setCurrentPlan(tier);
      setCachedUserPlan(tier);
      setNotification(`Caution ${tier === 'pro' ? 'Pro' : 'Plus'} (₦${tier === 'pro' ? '30,000' : '3,000'} / month) activated.`);
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsLoading(false);
    }
  };

  const isPlus = currentPlan === 'plus';
  const isPro = currentPlan === 'pro';
  const isSubscribed = isPlus || isPro;

  return (
    <div className="min-h-screen bg-[#08090B] text-white flex flex-col font-sans selection:bg-[#04564f] selection:text-white">
      <TopNav />

      {/* 2. MAIN BODY */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-5 sm:p-8 space-y-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <a href={APP_URL} className="hover:text-white transition-colors">
              Dashboard
            </a>
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
                {isPro
                  ? 'Caution Pro Tier'
                  : isPlus
                  ? 'Caution Plus Tier'
                  : 'Subscription Inactive'}
              </h2>
              {isPro ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/40 flex items-center gap-1 shadow-sm">
                  <Sparkles className="h-3 w-3" /> ACTIVE PRO
                </span>
              ) : isPlus ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#04564f]/60 text-[#2dd4bf] border border-[#2dd4bf]/30">
                  ACTIVE PLUS
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  PAYMENT REQUIRED
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
              {isPro
                ? 'Your Caution Pro plan includes unlimited beat downloads with zero ads, commercial synchronization rights, full WAV trackout stems (.ZIP), and unlocked access to the in-browser recording Studio Suite.'
                : isPlus
                ? 'Your Caution Plus plan includes 62 beats per month (2 daily free downloads + 2 ad bonus downloads) and commercial release rights. Upgrade to Caution Pro to unlock the in-browser Recording Studio and unlimited ad-free downloads.'
                : 'Caution Studio requires an active membership. Choose Caution Plus (₦3,000/mo) or Caution Pro (₦30,000/mo) below to get full access, downloads, and commercial licensing.'}
            </p>

            {/* Daily Download Quota Status Pill */}
            {isPlus && (
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 flex items-center gap-1.5 font-mono text-[11px]">
                  <Download className="w-3.5 h-3.5 text-[#2dd4bf]" />
                  <span>Today’s Downloads: <strong>{downloadQuota.downloadsCount}/2 Beats</strong> (+2 Ad Bonus available)</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-[#04564f]/30 border border-[#2dd4bf]/30 text-[#2dd4bf] font-mono text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-ping" />
                  <span>Unlimited Beat Preview Active</span>
                </span>
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {!isSubscribed ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSubscribe('plus')}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors border border-white/10 cursor-pointer disabled:opacity-50"
                >
                  Get Plus (₦3,000)
                </button>
                <button
                  type="button"
                  onClick={() => handleSubscribe('pro')}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-full bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-[#2dd4bf]/30 transition-colors shadow-lg cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Get Pro (₦30,000)</span>
                </button>
              </div>
            ) : isPlus ? (
              <button
                type="button"
                onClick={() => handleSubscribe('pro')}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-full bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] border border-[#2dd4bf]/40 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Upgrade to Pro (₦30,000)</span>
              </button>
            ) : (
              <div className="px-4 py-2 rounded-full bg-[#04564f]/40 border border-[#2dd4bf]/30 text-xs font-mono font-bold text-[#2dd4bf] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <span>Pro Member Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Plan Cards */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
              Available Membership Plans
            </h3>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">
              Select Caution Plus or Caution Pro. Instant activation via Paystack.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Plan 1: Caution Plus */}
            <div
              className={`p-6 rounded-2xl bg-[#121316] border transition-all flex flex-col justify-between ${
                isPlus
                  ? 'border-[#2dd4bf] shadow-xl ring-1 ring-[#2dd4bf]/40'
                  : 'border-white/[0.08] hover:border-white/20'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#2dd4bf]" />
                    <h4 className="text-lg font-black text-white">Caution Plus</h4>
                  </div>
                  {isPlus ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/30">
                      CURRENT
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white/5 text-gray-400 border border-white/10 uppercase">
                      With Ads
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
                  Ad-supported full catalog access for independent recording artists and creators.
                </p>

                <div className="space-y-2.5 pt-2 text-xs text-gray-300">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span><strong>2 Free Daily Downloads</strong> (resets every 24 hours)</span>
                  </div>
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span><strong>+2 Bonus Downloads daily</strong> via 15s sponsored ads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>Access to <strong>62 beats every month</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>24-bit lossless streaming with audio ads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>Non-exclusive commercial release rights (YouTube, DSPs)</span>
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
                  onClick={() => handleSubscribe('plus')}
                  disabled={isLoading || isPlus}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    isPlus
                      ? 'bg-[#04564f] text-[#2dd4bf] cursor-default border border-[#2dd4bf]/30'
                      : 'bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] border border-[#2dd4bf]/40 shadow-lg'
                  }`}
                >
                  {isPlus ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Active Plan</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{isPro ? 'Switch to Plus (₦3,000)' : 'Subscribe to Plus (₦3,000)'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Plan 2: Caution Pro */}
            <div
              className={`p-6 rounded-2xl bg-[#121316] border relative overflow-hidden transition-all flex flex-col justify-between ${
                isPro
                  ? 'border-[#2dd4bf] shadow-xl ring-1 ring-[#2dd4bf]/40'
                  : 'border-[#04564f]/70 hover:border-[#2dd4bf]/50'
              }`}
            >
              <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-l from-[#04564f] to-[#2dd4bf] text-black text-[10px] font-black uppercase tracking-wider rounded-bl-xl shadow-md">
                RECOMMENDED • UNLIMITED &amp; STUDIO
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#2dd4bf]" />
                    <h4 className="text-lg font-black text-white">Caution Pro</h4>
                  </div>
                  {isPro && (
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
                    <span className="text-xs text-gray-400"> / month</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#2dd4bf]">
                    Unlimited Downloads &bull; Studio Recording Suite
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Ultimate tier for professional artists &amp; producers. Unlimited downloads with no ads and in-browser Studio Suite enabled.
                </p>

                <div className="space-y-2.5 pt-2 text-xs text-gray-300">
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span><strong>Unlimited Downloads &bull; 100% Ad-Free</strong> (Zero limits)</span>
                  </div>
                  <div className="flex items-center gap-2 text-white font-medium">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span><strong>Studio Page Enabled (/studio)</strong> &bull; Record vocals &amp; export masters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>Full WAV Trackout Stems (.ZIP) for every beat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>100% Royalty retention on commercial releases</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>Radio airplay, TV, Cinema &amp; video game sync clearance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>Automated Content ID clearance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span>Priority A&amp;R playlist pitching &amp; VIP Studio support</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => handleSubscribe('pro')}
                  disabled={isLoading || isPro}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    isPro
                      ? 'bg-[#04564f] text-[#2dd4bf] cursor-default border border-[#2dd4bf]/30'
                      : 'bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] border border-[#2dd4bf]/40 shadow-lg'
                  }`}
                >
                  {isPro ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Active Pro Plan</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Subscribe to Caution Pro (₦30,000)</span>
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
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 font-mono text-gray-300">CS-INV-2026-0042</td>
                  <td className="py-3.5 text-gray-400">Oct 01, 2026</td>
                  <td className="py-3.5 font-bold text-white">₦3,000.00</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#04564f]/50 text-[#2dd4bf] border border-[#2dd4bf]/30">
                      PAID
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs text-[#2dd4bf] hover:underline font-semibold"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 font-mono text-gray-300">CS-INV-2026-0021</td>
                  <td className="py-3.5 text-gray-400">Sep 01, 2026</td>
                  <td className="py-3.5 font-bold text-white">₦3,000.00</td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#04564f]/50 text-[#2dd4bf] border border-[#2dd4bf]/30">
                      PAID
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs text-[#2dd4bf] hover:underline font-semibold"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
