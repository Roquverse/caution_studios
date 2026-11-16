'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRecordStudioModal } from '../../components/UserRecordStudioModal';
import { TrackItem, ProducerItem } from '../../types/tracks';
import { supabase } from '../../lib/supabaseClient';
import { setCachedUserPlan } from '../../lib/subscription';
import {
  Mic,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Disc3,
  ShieldCheck,
  Zap,
  ArrowLeft,
  Loader2
} from 'lucide-react';

interface StudioPageClientProps {
  initialBeats: TrackItem[];
  initialProducers: ProducerItem[];
  beatIdParam?: string;
}

export default function StudioPageClient({
  initialBeats,
  initialProducers,
  beatIdParam
}: StudioPageClientProps) {
  const router = useRouter();
  const [userPlan, setUserPlan] = useState<string>('loading');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check user authentication & subscription plan
  useEffect(() => {
    async function checkProAccess() {
      try {
        let session = (await supabase.auth.getSession()).data.session;

        // Check shared root cookie if session not active in memory
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
          setUserId(session.user.id);
          setUserEmail(session.user.email || '');

          const { data } = await supabase
            .from('profiles')
            .select('plan, role')
            .eq('id', session.user.id)
            .maybeSingle();

          const plan = data?.plan || 'free';
          setUserPlan(plan);
          setCachedUserPlan(plan);
        } else {
          setUserPlan('free');
        }
      } catch (err) {
        console.warn('Could not verify studio access:', err);
        setUserPlan('free');
      }
    }

    checkProAccess();

    // Verify Paystack payment if arriving with reference
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paystackRef = urlParams.get('reference') || urlParams.get('trxref');
      const orderId = urlParams.get('order_id');

      if (paystackRef) {
        fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: paystackRef,
            order_id: orderId,
            plan: 'pro'
          })
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.verified || data.status) {
              setUserPlan('pro');
              setCachedUserPlan('pro');
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch((e) => console.error('Studio Paystack verification error:', e));
      }
    }
  }, []);

  // Handle Paystack upgrade to Caution Pro (30k)
  const handleUpgradeToPro = async () => {
    try {
      setIsUpgrading(true);
      setErrorMessage(null);

      const email = userEmail || 'artist@cautionstudio.com';
      const orderId = `sub_pro_${Date.now()}`;

      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amountNgn: 30000,
          orderId,
          callbackUrl: `${window.location.origin}/studio`,
          metadata: {
            type: 'subscription',
            plan: 'pro',
            billing_cycle: 'pro',
            user_id: userId
          }
        })
      });

      const data = await res.json();
      if (
        data.data?.authorization_url &&
        (data.data.authorization_url.startsWith('https://checkout.paystack.com') ||
          data.data.authorization_url.startsWith('http'))
      ) {
        window.location.href = data.data.authorization_url;
        return;
      }

      if (!data.status || data.configured === false || data.error === 'PAYSTACK_NOT_CONFIGURED') {
        // Activate in test mode so user can test the studio immediately
        const ref = `demo_ref_sub_pro_${Date.now()}`;
        const verifyRes = await fetch('/api/paystack/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: ref,
            order_id: orderId,
            plan: 'pro',
            userId
          })
        });
        const verifyData = await verifyRes.json();
        if (verifyData.verified || verifyData.status) {
          setUserPlan('pro');
          setCachedUserPlan('pro');
          setIsUpgrading(false);
          return;
        }
      }

      throw new Error(data.error || 'Failed to initialize Paystack checkout');
    } catch (err: any) {
      console.error('Pro upgrade error:', err);
      setErrorMessage(err.message || 'Payment initialization failed. Please try again.');
      setIsUpgrading(false);
    }
  };

  // Find preselected beat matching URL param, or null if entering Studio fresh
  const preselectedTrack = React.useMemo(() => {
    if (beatIdParam) {
      const match = initialBeats.find((b) => b.id === beatIdParam);
      if (match) return match;
    }
    return null;
  }, [initialBeats, beatIdParam]);

  const handleExitStudio = () => {
    router.push('/');
  };

  const isPro = userPlan === 'pro';

  // 1. Loading State
  if (userPlan === 'loading') {
    return (
      <main className="w-full min-h-screen bg-[#07090E] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-[#2dd4bf] animate-spin" />
          <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">
            Verifying Studio Credentials...
          </span>
        </div>
      </main>
    );
  }

  // 2. Pro Gated Lock Screen: Displayed if not Caution Pro
  if (!isPro) {
    return (
      <main className="w-full min-h-screen bg-[#07090E] text-white flex flex-col justify-between selection:bg-[#04564f] selection:text-white relative overflow-hidden">
        {/* Ambient Studio Lighting Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#04564f]/15 rounded-full blur-[140px] pointer-events-none" />

        {/* Top Header Bar */}
        <header className="w-full p-6 sm:p-8 flex items-center justify-between border-b border-white/[0.08] relative z-10">
          <button
            type="button"
            onClick={handleExitStudio}
            className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#04564f]/30 border border-[#2dd4bf]/30 text-[11px] font-mono text-[#2dd4bf] uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            <span>Caution Pro Studio Suite</span>
          </div>
        </header>

        {/* Center Pro Upgrade Showcase */}
        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="max-w-2xl w-full p-8 sm:p-12 rounded-3xl bg-[#0C0F17]/90 border border-[#2dd4bf]/30 shadow-2xl backdrop-blur-xl text-center space-y-6">
            
            <div className="w-16 h-16 rounded-2xl bg-[#04564f]/30 border border-[#2dd4bf]/40 text-[#2dd4bf] flex items-center justify-center mx-auto shadow-lg shadow-[#04564f]/30">
              <Mic className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/30 uppercase tracking-widest inline-block">
                Exclusive Pro Feature
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Unlock Caution Recording Studio
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto leading-relaxed">
                The in-browser Studio Suite is enabled exclusively for <strong>Caution Pro</strong> members (₦30,000 / month). Record vocal tracks over beats, apply real-time DSP effects, mix stems, and export uncompressed masters directly from your browser.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Feature Perks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-[#2dd4bf] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Multi-Track Vocal Recording</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Record vocals, punch in, and layer takes directly over store beats.</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-[#2dd4bf] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Live DSP Effects &amp; EQ</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Real-time studio reverb, compression, auto-pitch guide, and mastering limiter.</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-[#2dd4bf] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Unlimited Downloads &bull; No Ads</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Never hit a daily download limit or sit through audio ad interruptions.</p>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-[#2dd4bf] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Full WAV Trackout Stems</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">Download full stem archive (.ZIP) for every beat in the catalog.</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleUpgradeToPro}
                disabled={isUpgrading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-[#2dd4bf]/40 transition-all shadow-xl shadow-[#04564f]/30 hover:scale-[1.02] cursor-pointer disabled:opacity-50"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connecting Paystack...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Unlock Studio Page with Caution Pro (₦30,000)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/subscriptions')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
              >
                Compare Plans
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full p-6 text-center text-xs text-gray-500 border-t border-white/[0.08] relative z-10 font-mono">
          Caution Studio &bull; Next-Gen Music Licensing, Beat Store &amp; Recording Cloud
        </footer>
      </main>
    );
  }

  // 3. Pro Active: Unlocked Full Recording Studio Suite
  return (
    <main className="w-full min-h-screen bg-[#07090E] text-white">
      <UserRecordStudioModal
        isOpen={true}
        isStandalonePage={true}
        onClose={handleExitStudio}
        preselectedTrack={preselectedTrack}
        availableTracks={initialBeats}
      />
    </main>
  );
}

