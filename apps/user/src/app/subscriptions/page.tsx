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
  ArrowRight,
  AlertTriangle,
  Copy,
  ExternalLink,
  X,
  Loader2
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
  const [currentPlan, setCurrentPlan] = useState<'free' | 'plus' | 'pro'>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // Paystack configuration modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [pendingTier, setPendingTier] = useState<'plus' | 'pro'>('pro');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

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
          const p = data.profile.plan === 'pro' ? 'pro' : data.profile.plan === 'plus' ? 'plus' : 'free';
          setCurrentPlan(p);
          setCachedUserPlan(p);
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
            const p = data.plan === 'pro' ? 'pro' : data.plan === 'plus' ? 'plus' : 'free';
            setCurrentPlan(p);
            setCachedUserPlan(p);
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
            setCachedUserPlan('free');
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
          .then(async (data) => {
            if (data.verified || data.status) {
              const targetPlan = data.plan === 'pro' ? 'pro' : 'plus';
              setCurrentPlan(targetPlan);
              setCachedUserPlan(targetPlan);
              const { data: { session } } = await supabase.auth.getSession();
              await loadBillingInvoices(session?.user?.id || profile?.id);
              setNotification(
                `🎉 Payment verified via Paystack! Caution ${targetPlan === 'pro' ? 'Pro' : 'Plus'} membership is active.`
              );
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch((e) => console.error('Paystack verification error:', e))
          .finally(() => setIsLoading(false));
      }
    }
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = profile?.id || session?.user?.id;
      const ref = `demo_ref_sub_${pendingTier}_${Date.now()}`;

      const res = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: ref,
          order_id: `sub_${pendingTier}_${Date.now()}`,
          plan: pendingTier,
          userId,
          email: session?.user?.email || (profile as any)?.email
        })
      });

      const data = await res.json();
      if (data.verified || data.status) {
        setCurrentPlan(pendingTier);
        setCachedUserPlan(pendingTier);
        await loadBillingInvoices(userId || undefined);
        setNotification(`🎉 Caution ${pendingTier === 'pro' ? 'Pro' : 'Plus'} membership activated! (Test simulation verified)`);
        setShowConfigModal(false);
      }
    } catch (e: any) {
      console.error('Simulation error:', e);
    } finally {
      setIsSimulating(false);
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (tier: 'plus' | 'pro') => {
    setIsLoading(true);
    setNotification(null);
    setPendingTier(tier);

    try {
      const amountNgn = tier === 'pro' ? 30000 : 3000;
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || (profile as any)?.email || 'artist@cautionstudio.com';
      const userId = profile?.id || session?.user?.id || null;
      const orderId = `sub_${tier}_${Date.now()}`;

      // 1. If Paystack public key is configured on client, try seamless Paystack popup
      const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
      if (publicKey && publicKey.startsWith('pk_')) {
        if (!(window as any).PaystackPop) {
          await new Promise<void>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.body.appendChild(script);
          });
        }

        if ((window as any).PaystackPop) {
          const handler = (window as any).PaystackPop.setup({
            key: publicKey,
            email: userEmail,
            amount: Math.round(amountNgn * 100),
            currency: 'NGN',
            ref: `CS_${orderId}_${Date.now()}`,
            metadata: {
              type: 'subscription',
              plan: tier,
              billing_cycle: tier,
              user_id: userId
            },
            callback: function (response: { reference: string }) {
              setIsLoading(true);
              fetch('/api/paystack/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  reference: response.reference,
                  order_id: orderId,
                  plan: tier,
                  userId
                })
              })
                .then((r) => r.json())
                .then(async (verifyData) => {
                  if (verifyData.verified || verifyData.status) {
                    setCurrentPlan(tier);
                    setCachedUserPlan(tier);
                    await loadBillingInvoices(userId || undefined);
                    setNotification(`🎉 Payment verified via Paystack! Caution ${tier === 'pro' ? 'Pro' : 'Plus'} membership is active.`);
                  }
                })
                .catch((err) => {
                  console.error('Paystack popup verify error:', err);
                })
                .finally(() => {
                  setIsLoading(false);
                });
            },
            onClose: function () {
              setIsLoading(false);
            }
          });
          handler.openIframe();
          return;
        }
      }

      // 2. Initialize Paystack on server for standard checkout redirect
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
            user_id: userId
          }
        })
      });

      const data = await res.json();

      // If real Paystack authorization URL is returned
      if (
        data.data?.authorization_url &&
        (data.data.authorization_url.startsWith('https://checkout.paystack.com') ||
          data.data.authorization_url.startsWith('http'))
      ) {
        window.location.href = data.data.authorization_url;
        return;
      }

      // If server does not have PAYSTACK_SECRET_KEY configured
      if (!data.status || data.configured === false || data.error === 'PAYSTACK_NOT_CONFIGURED') {
        setShowConfigModal(true);
        setIsLoading(false);
        return;
      }

      throw new Error(data.message || data.error || 'Failed to initialize Paystack checkout');
    } catch (err: any) {
      console.error('Subscription checkout error:', err);
      setShowConfigModal(true);
      setIsLoading(false);
    }
  };

  const isPlus = currentPlan === 'plus';
  const isPro = currentPlan === 'pro';
  const isSubscribed = isPlus || isPro;

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
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                    <span><strong>2 Free Daily Downloads</strong> (resets every 24 hours)</span>
                  </div>
                  <div className="flex items-center gap-2">
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

      {/* Paystack Setup & Test Simulator Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg bg-[#0E1015] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 text-left">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Paystack Gateway Setup Required
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    Live payments require Paystack keys in Vercel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
              <span className="font-semibold text-amber-300">Why didn&apos;t Paystack open?</span> To process live debit cards and bank transfers, you must add your Paystack API keys to your project environment variables.
            </div>

            {/* Keys instructions */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-gray-300">
                1. Add these 2 Environment Variables in Vercel:
              </div>

              {/* Secret Key */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-gray-400">Key 1 (Server Secret)</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('PAYSTACK_SECRET_KEY', 'secret')}
                    className="inline-flex items-center gap-1 text-[10px] text-[#2dd4bf] hover:underline cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedKey === 'secret' ? 'Copied!' : 'Copy Name'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-white select-all">
                  PAYSTACK_SECRET_KEY
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  Value: sk_live_... (or sk_test_... from Paystack Settings &rarr; API Keys)
                </div>
              </div>

              {/* Public Key */}
              <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-gray-400">Key 2 (Client Public)</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY', 'public')}
                    className="inline-flex items-center gap-1 text-[10px] text-[#2dd4bf] hover:underline cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedKey === 'public' ? 'Copied!' : 'Copy Name'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-white select-all">
                  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                  Value: pk_live_... (or pk_test_... from Paystack Settings &rarr; API Keys)
                </div>
              </div>

              <div className="text-[11px] text-gray-400 font-mono leading-relaxed pl-1">
                &bull; In Vercel: Project &rarr; <strong>Settings</strong> &rarr; <strong>Environment Variables</strong> &rarr; Add &amp; Save &rarr; Redeploy.
              </div>
            </div>

            {/* Test Simulation Button */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="text-xs font-semibold text-gray-300">
                2. Or test Caution {pendingTier === 'pro' ? 'Pro' : 'Plus'} right now:
              </div>
              <p className="text-[11px] text-gray-400">
                You can activate Caution {pendingTier === 'pro' ? 'Pro (₦30,000)' : 'Plus (₦3,000)'} in test mode to verify all features and unlock the Studio immediately:
              </p>
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="w-full py-3 rounded-xl bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] border border-[#2dd4bf]/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-[1.01] cursor-pointer disabled:opacity-50"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Activating in Test Mode...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Simulate Payment &amp; Activate Caution {pendingTier === 'pro' ? 'Pro' : 'Plus'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserShell>
  );
}
