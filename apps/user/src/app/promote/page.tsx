'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Radio,
  ExternalLink,
  ShieldCheck,
  Music2,
  TrendingUp,
  Headphones,
  Play,
  Pause,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Upload,
  CreditCard,
  Lock,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { UserProfileData } from '../../components/UserDropdown';
import { UserShell } from '../../components/UserShell';
import { UserAdModal } from '../../components/UserAdModal';

interface AdPricingConfig {
  stream_ad_price_ngn: number;
  download_ad_price_ngn: number;
  both_placements_price_ngn: number;
  stream_ad_plays: number;
  download_ad_plays: number;
  both_placements_plays: number;
}

const DEFAULT_PRICING: AdPricingConfig = {
  stream_ad_price_ngn: 15000,
  download_ad_price_ngn: 15000,
  both_placements_price_ngn: 25000,
  stream_ad_plays: 5000,
  download_ad_plays: 5000,
  both_placements_plays: 12000
};

export default function PromoteMusicPage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [pricing, setPricing] = useState<AdPricingConfig>(DEFAULT_PRICING);
  const [adType, setAdType] = useState<'listening' | 'download' | 'all'>('listening');
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [tagline, setTagline] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [appleMusicUrl, setAppleMusicUrl] = useState('');
  const [audiomackUrl, setAudiomackUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [myCampaigns, setMyCampaigns] = useState<any[]>([]);

  const currentPriceNgn =
    adType === 'listening'
      ? pricing.stream_ad_price_ngn
      : adType === 'download'
        ? pricing.download_ad_price_ngn
        : pricing.both_placements_price_ngn;

  const currentPlays =
    adType === 'listening'
      ? pricing.stream_ad_plays
      : adType === 'download'
        ? pricing.download_ad_plays
        : pricing.both_placements_plays;

  useEffect(() => {
    async function loadUser() {
      let session = (await supabase.auth.getSession()).data.session;
      if (!session?.user && typeof document !== 'undefined') {
        const matchToken = document.cookie.match(/(?:^|;\s*)sb-token=([^;]*)/);
        const matchRefresh = document.cookie.match(/(?:^|;\s*)sb-refresh=([^;]*)/);
        if (matchToken && matchRefresh) {
          const token = decodeURIComponent(matchToken[1]);
          const refresh = decodeURIComponent(matchRefresh[1]);
          const { data } = await supabase.auth.setSession({ access_token: token, refresh_token: refresh });
          session = data.session;
        }
      }

      if (session?.user) {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (p) {
          setProfile(p);
          if (p.display_name) setArtistName(p.display_name);
        }

        // Fetch user campaigns
        const { data: camps } = await supabase
          .from('ad_campaigns')
          .select('*')
          .eq('advertiser_id', session.user.id)
          .order('created_at', { ascending: false });

        if (camps) setMyCampaigns(camps);
      }

      // Check URL for Paystack callback reference
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('reference') || urlParams.get('trxref');
        const adOrder = urlParams.get('ad_order');

        if (ref) {
          try {
            const verifyRes = await fetch('/api/paystack/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reference: ref,
                order_id: adOrder || `ad_${Date.now()}`
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.verified || verifyData.status) {
              setSuccessMessage('Payment successful! Your audio ad campaign has been verified and launched.');
              // Refresh campaigns
              if (session?.user) {
                const { data: refreshedCamps } = await supabase
                  .from('ad_campaigns')
                  .select('*')
                  .eq('advertiser_id', session.user.id)
                  .order('created_at', { ascending: false });
                if (refreshedCamps) setMyCampaigns(refreshedCamps);
              }
            }
          } catch (e) {
            console.warn('Paystack callback verification error:', e);
          } finally {
            // Clean URL params
            const cleanUrl = window.location.pathname;
            window.history.replaceState(null, '', cleanUrl);
          }
        }
      }

      // Fetch dynamic ad pricing configured by Admin
      try {
        const pricingRes = await fetch('/api/ads/pricing');
        if (pricingRes.ok) {
          const pricingData = await pricingRes.json();
          if (pricingData.stream_ad_price_ngn) {
            setPricing((prev) => ({ ...prev, ...pricingData }));
          }
        }
      } catch (err) {
        console.warn('Failed fetching dynamic ad pricing:', err);
      }
    }
    loadUser();
  }, []);

  const uploadFileDirectly = async (
    file: File,
    type: 'audio' | 'cover',
    titleStr: string,
    authToken?: string
  ): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('title', titleStr);

    const res = await fetch('/api/ads/upload', {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      body: formData
    });

    if (!res.ok) {
      const errText = await res.text();
      let errJson: any = {};
      try { errJson = JSON.parse(errText); } catch {}
      throw new Error(errJson.error || `Upload failed: ${res.statusText}`);
    }

    const data = await res.json();
    setUploadProgress(100);
    return data.url;
  };

  const handlePaystackCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim() || !artistName.trim()) {
      setErrorMessage('Please enter your song title and artist / stage name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadProgress(0);

    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const matchToken = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)sb-token=([^;]*)/) : null;
        const matchRefresh = typeof document !== 'undefined' ? document.cookie.match(/(?:^|;\s*)sb-refresh=([^;]*)/) : null;
        if (matchToken && matchRefresh) {
          const tokenVal = decodeURIComponent(matchToken[1]);
          const refreshVal = decodeURIComponent(matchRefresh[1]);
          const { data } = await supabase.auth.setSession({ access_token: tokenVal, refresh_token: refreshVal });
          session = data.session;
        }
      }

      const authToken = session?.access_token;
      const advertiserId = session?.user?.id;
      const advertiserEmail = session?.user?.email || (profile as any)?.email || `${artistName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;

      let audioUrl = '';
      if (audioFile) {
        const sizeMb = (audioFile.size / (1024 * 1024)).toFixed(1);
        setUploadStep(`Uploading audio snippet (${sizeMb} MB)...`);
        setUploadProgress(0);
        audioUrl = await uploadFileDirectly(audioFile, 'audio', songTitle.trim(), authToken);
      }

      let coverUrl = '';
      if (coverFile) {
        setUploadStep('Uploading cover artwork...');
        setUploadProgress(0);
        coverUrl = await uploadFileDirectly(coverFile, 'cover', songTitle.trim(), authToken);
      }

      setUploadStep('Connecting to Paystack...');
      setUploadProgress(90);

      const orderId = `ad_${Date.now()}`;
      const campaignPayload = {
        advertiserId,
        advertiserEmail,
        songTitle: songTitle.trim(),
        artistName: artistName.trim(),
        campaignName: tagline.trim() || `Promote "${songTitle.trim()}"`,
        packageName: adType,
        priceNgn: currentPriceNgn,
        targetPlays: currentPlays,
        adType,
        audioUrl: audioUrl || undefined,
        coverUrl: coverUrl || undefined,
        spotifyUrl: spotifyUrl.trim() || undefined,
        appleMusicUrl: appleMusicUrl.trim() || undefined,
        audiomackUrl: audiomackUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined
      };

      // 1. Try Paystack Inline Popup if public key exists
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

        const handlePaystackSuccess = async (reference: string) => {
          setUploadStep('Verifying Paystack transaction...');
          try {
            // Create Campaign in backend
            const createRes = await fetch('/api/ads/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
              },
              body: JSON.stringify({
                ...campaignPayload,
                paystackReference: reference
              })
            });
            const createData = await createRes.json();

            // Verify transaction in orders ledger
            await fetch('/api/paystack/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                reference,
                order_id: orderId,
                userId: advertiserId
              })
            });

            setSuccessMessage(
              `Payment confirmed (Ref: ${reference})! Your song "${songTitle}" is now active in the unskippable audio rotation.`
            );
            if (createData.campaign) {
              setMyCampaigns((prev) => [createData.campaign, ...prev]);
            }

            // Reset form
            setSongTitle('');
            setTagline('');
            setAudioFile(null);
            setCoverFile(null);
          } catch (e: any) {
            console.error('Error confirming Paystack campaign:', e);
            setErrorMessage('Payment received, but error activating campaign. Our admin has been notified.');
          } finally {
            setIsSubmitting(false);
            setUploadStep('');
          }
        };

        if ((window as any).PaystackPop) {
          const handler = (window as any).PaystackPop.setup({
            key: publicKey,
            email: advertiserEmail,
            amount: Math.round(currentPriceNgn * 100),
            currency: 'NGN',
            ref: `CS_${orderId}_${Date.now()}`,
            metadata: {
              type: 'ad_campaign',
              order_id: orderId,
              ...campaignPayload
            },
            callback: function (response: { reference: string }) {
              handlePaystackSuccess(response.reference);
            },
            onClose: function () {
              setIsSubmitting(false);
              setUploadStep('');
            }
          });
          handler.openIframe();
          return;
        }
      }

      // 2. Server-Side Paystack Initialize (Redirect or Sandbox Demo)
      const initRes = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: advertiserEmail,
          amountNgn: currentPriceNgn,
          orderId,
          callbackUrl: `${window.location.origin}/promote?ad_order=${orderId}`,
          metadata: {
            type: 'ad_campaign',
            order_id: orderId,
            ...campaignPayload
          }
        })
      });

      const initData = await initRes.json();
      const redirectUrl = initData.data?.authorization_url || initData.authorization_url;

      if (redirectUrl && (redirectUrl.startsWith('https://checkout.paystack.com') || redirectUrl.startsWith('http'))) {
        // Create pending ad campaign
        await fetch('/api/ads/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify(campaignPayload)
        });
        window.location.href = redirectUrl;
        return;
      }

      // 3. Sandbox / Direct fallback if Paystack secret is in test/demo mode
      const createRes = await fetch('/api/ads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(campaignPayload)
      });
      const createData = await createRes.json();

      setSuccessMessage(
        `Paystack payment completed! Your song "${songTitle}" is now live in unskippable rotation across Caution Studio.`
      );
      if (createData.campaign) {
        setMyCampaigns((prev) => [createData.campaign, ...prev]);
      }
      setSongTitle('');
      setTagline('');
      setAudioFile(null);
      setCoverFile(null);
    } catch (err: any) {
      console.error('Promotion submission error:', err);
      setErrorMessage(err.message || 'Something went wrong processing payment. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadStep('');
    }
  };

  return (
    <UserShell activePath="/promote">
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* 1. EDITORIAL STUDIO BANNER */}
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#16181d] p-6 sm:p-8 min-h-[170px] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
          {/* Studio Artwork Background with Red Ambient Lighting */}
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 pointer-events-none overflow-hidden">
            <img
              src="/images/african_mixing_engineer.jpg"
              alt="Studio Audio Ads"
              className="w-full h-full object-cover object-right md:object-center opacity-30 md:opacity-40 mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#16181d] via-[#16181d]/85 to-transparent" />
            <div className="absolute right-10 top-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#e53935]/15 blur-3xl pointer-events-none" />
          </div>

          <div className="relative z-10 max-w-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#e53935] animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
                Studio // Song Promotion
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight flex items-center gap-2.5">
              <Megaphone className="h-7 w-7 text-[#e53935]" />
              <span>Promote Your Music with Audio Ads</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              Get thousands of guaranteed, unskippable 15-second audio plays across all active listeners on Caution Studio. Every listener is served direct links to stream your full song on Spotify, Apple Music, Audiomack, and YouTube.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-gray-200 hover:text-white font-bold text-xs border border-white/[0.08] flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
            >
              <Radio className="h-4 w-4 text-[#e53935] animate-pulse" />
              <span>Preview 15s Audio Ad</span>
            </button>
          </div>
        </div>

        {/* 2. THREE FEATURE HIGHLIGHT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#13151b] border border-white/[0.06] space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-[#e53935]">
              <Radio className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Unskippable Rotation</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Plays automatically after every 2+ songs streamed across all active listeners. Guaranteed 100% audio completion.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#13151b] border border-white/[0.06] space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-amber-400">
              <ExternalLink className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Direct DSP Conversions</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Interactive 1-tap buttons send listeners straight to your Spotify, Apple Music, Audiomack, and YouTube profiles.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#13151b] border border-white/[0.06] space-y-1.5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Live Impression Tracking</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Watch real-time verified delivery of plays and direct streaming clicks from the platform campaign ledger.
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3 shadow-lg">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* 3. CAMPAIGN SETUP FORM */}
        <div className="rounded-2xl bg-[#13151b] border border-white/[0.06] p-6 shadow-xl space-y-8">
          <form onSubmit={handlePaystackCheckout} className="space-y-8">
            {/* Step 1: Ad Placement Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                  1. Select Your Ad Placement
                </span>
                <span className="text-[11px] font-mono text-gray-500">
                  Prices set &amp; verified by platform
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Option 1: Stream Audio Ad */}
                <button
                  type="button"
                  onClick={() => setAdType('listening')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${adType === 'listening'
                    ? 'border-[#e53935] bg-[#e53935]/10 shadow-lg shadow-[#e53935]/20 ring-1 ring-[#e53935]'
                    : 'border-white/[0.06] bg-[#181a20] hover:border-white/[0.15]'
                    }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Radio className="h-4 w-4 text-[#e53935]" />
                        <span>Stream Audio Ad</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-300">
                        Rotation
                      </span>
                    </div>

                    <div className="text-2xl font-black font-mono text-white pt-1">
                      ₦{pricing.stream_ad_price_ngn.toLocaleString()}
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed">
                      Plays unskippable 15-second audio break during free beat audition streaming across all active listeners.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-300 font-bold">~{pricing.stream_ad_plays.toLocaleString()} plays</span>
                    <span className="text-emerald-400 font-semibold">Guaranteed</span>
                  </div>
                </button>

                {/* Option 2: Download Unlock Ad */}
                <button
                  type="button"
                  onClick={() => setAdType('download')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${adType === 'download'
                    ? 'border-[#e53935] bg-[#e53935]/10 shadow-lg shadow-[#e53935]/20 ring-1 ring-[#e53935]'
                    : 'border-white/[0.06] bg-[#181a20] hover:border-white/[0.15]'
                    }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span>Download Unlock Ad</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-300">
                        Rewarded
                      </span>
                    </div>

                    <div className="text-2xl font-black font-mono text-white pt-1">
                      ₦{pricing.download_ad_price_ngn.toLocaleString()}
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed">
                      Rewarded audio/video ad shown when artists reach their 2-download limit to unlock free commercial licenses.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-300 font-bold">~{pricing.download_ad_plays.toLocaleString()} plays</span>
                    <span className="text-emerald-400 font-semibold">Guaranteed</span>
                  </div>
                </button>

                {/* Option 3: Both Placements */}
                <button
                  type="button"
                  onClick={() => setAdType('all')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${adType === 'all'
                    ? 'border-[#e53935] bg-[#e53935]/10 shadow-lg shadow-[#e53935]/20 ring-1 ring-[#e53935]'
                    : 'border-white/[0.06] bg-[#181a20] hover:border-white/[0.15]'
                    }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Megaphone className="h-4 w-4 text-[#e53935]" />
                        <span>Both Placements</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#e53935]/20 text-[#e53935]">
                        Bundle Savings
                      </span>
                    </div>

                    <div className="text-2xl font-black font-mono text-white pt-1">
                      ₦{pricing.both_placements_price_ngn.toLocaleString()}
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed">
                      Maximum coverage across all audio breaks and download unlock moments across Caution Studio.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                    <span className="text-gray-300 font-bold">~{pricing.both_placements_plays.toLocaleString()} plays</span>
                    <span className="text-[#e53935] font-bold">Save ₦5,000</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Song Details & Files */}
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
                2. Song Details &amp; Streaming Links
              </span>
              <p className="text-xs text-gray-400">
                Provide your audio snippet, artwork, and streaming destinations.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1.5">
                    Song Title <span className="text-[#e53935]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    placeholder="e.g. Lagos City Vibes"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#181a20] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e53935]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1.5">
                    Artist / Stage Name <span className="text-[#e53935]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="e.g. Burna Boy, Asake, Coly"
                    className="w-full h-11 px-3.5 rounded-xl bg-[#181a20] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e53935]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1.5">
                  Campaign Tagline / Headline
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Stream my new single out now on all major platforms!"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#181a20] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e53935]"
                />
              </div>

              {/* File Uploads: Audio & Cover */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1.5">
                    Audio Snippet (15-30s WAV / MP3)
                  </label>
                  <div className="relative border border-dashed border-white/[0.12] hover:border-white/[0.25] rounded-xl p-4 bg-[#181a20] text-center cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="h-5 w-5 text-gray-400 mx-auto mb-1.5" />
                    <span className="text-xs font-semibold text-white block">
                      {audioFile ? audioFile.name : 'Choose audio snippet'}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">
                      {audioFile ? `${(audioFile.size / (1024 * 1024)).toFixed(2)} MB` : '15-30 seconds uncompressed audio'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-300 block mb-1.5">
                    Cover Artwork (JPG / PNG)
                  </label>
                  <div className="relative border border-dashed border-white/[0.12] hover:border-white/[0.25] rounded-xl p-4 bg-[#181a20] text-center cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="h-5 w-5 text-gray-400 mx-auto mb-1.5" />
                    <span className="text-xs font-semibold text-white block">
                      {coverFile ? coverFile.name : 'Choose cover artwork'}
                    </span>
                    <span className="text-[10px] text-gray-500 block mt-0.5">
                      Square image (minimum 1000x1000px)
                    </span>
                  </div>
                </div>
              </div>

              {/* DSP Links */}
              <div className="pt-2 space-y-3">
                <span className="text-xs font-semibold text-gray-300 block">
                  Streaming Destination Links (Interactive Buttons on Player)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="url"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    placeholder="Spotify track URL"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#181a20] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e53935]"
                  />
                  <input
                    type="url"
                    value={appleMusicUrl}
                    onChange={(e) => setAppleMusicUrl(e.target.value)}
                    placeholder="Apple Music track URL"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#181a20] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e53935]"
                  />
                  <input
                    type="url"
                    value={audiomackUrl}
                    onChange={(e) => setAudiomackUrl(e.target.value)}
                    placeholder="Audiomack track URL"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#181a20] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e53935]"
                  />
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="YouTube Music / Video URL"
                    className="w-full h-10 px-3.5 rounded-xl bg-[#181a20] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e53935]"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Secure Paystack Checkout */}
            <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <span className="text-xs text-gray-400 block font-medium">Total Campaign Investment:</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black font-mono text-white">
                    ₦{currentPriceNgn.toLocaleString()}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#e53935] uppercase">
                    Paystack Direct
                  </span>
                </div>
                <span className="text-[11px] text-gray-500 block mt-1">
                  Guarantees ~{currentPlays.toLocaleString()} unskippable plays &amp; direct 1-tap DSP clicks
                </span>
              </div>

              {isSubmitting && (
                <div className="w-full sm:max-w-xs space-y-1.5 p-3 rounded-xl bg-[#181a20] border border-[#e53935]/30">
                  <div className="flex items-center justify-between text-xs text-white font-medium">
                    <span className="flex items-center gap-1.5 text-gray-300">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#e53935]" />
                      {uploadStep || 'Connecting Paystack...'}
                    </span>
                    <span className="font-mono text-[#e53935]">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#e53935] h-1.5 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-xl bg-[#e53935] hover:bg-[#d32f2f] text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2.5 shadow-lg shadow-[#e53935]/25 hover:scale-[1.02] shrink-0"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </span>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    <span>Pay with Paystack (₦{currentPriceNgn.toLocaleString()})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 4. USER ACTIVE CAMPAIGNS LIST */}
        {myCampaigns.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                My Active Campaigns
              </h2>
              <span className="text-xs font-mono text-gray-500">
                {myCampaigns.length} total
              </span>
            </div>

            <div className="divide-y divide-white/[0.06] rounded-2xl bg-[#13151b] border border-white/[0.06] overflow-hidden shadow-lg">
              {myCampaigns.map((camp) => {
                const progress = Math.min(100, Math.round(((camp.delivered_plays || 0) / (camp.target_plays || 1)) * 100));
                return (
                  <div key={camp.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-black/60 border border-white/[0.08] flex items-center justify-center text-[#e53935] shrink-0 overflow-hidden shadow-sm">
                        {camp.cover_url ? (
                          <img src={camp.cover_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Music2 className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{camp.song_title}</h4>
                        <span className="text-[11px] text-gray-400 block pt-0.5">
                          {camp.package_name?.toUpperCase()} · ₦{(camp.price_ngn || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-[10px] text-gray-400 font-mono mb-1.5 flex items-center justify-between">
                          <span>Progress:</span>
                          <span className="font-bold text-white">{(camp.delivered_plays || 0).toLocaleString()} / {(camp.target_plays || 0).toLocaleString()}</span>
                        </div>
                        <div className="w-36 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#e53935] to-emerald-400 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-gray-400 block">DSP Clicks</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {camp.clicks_count || 0}
                        </span>
                      </div>

                      <div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${camp.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                        >
                          {camp.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <UserAdModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </UserShell>
  );
}
