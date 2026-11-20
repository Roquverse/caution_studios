'use client';

import React, { useState, useEffect } from 'react';
import { CreatorShell } from '../../components/CreatorShell';
import { supabase } from '../../lib/supabaseClient';
import {
  Megaphone,
  Radio,
  ExternalLink,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Music2,
  Sparkles,
  ShoppingBag,
  Play,
  Pause
} from 'lucide-react';

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

export default function ProducerPromotePage() {
  const [pricing, setPricing] = useState<AdPricingConfig>(DEFAULT_PRICING);
  const [producerBeats, setProducerBeats] = useState<any[]>([]);
  const [selectedBeatId, setSelectedBeatId] = useState<string>('');

  const [songTitle, setSongTitle] = useState('');
  const [producerName, setProducerName] = useState('');
  const [tagline, setTagline] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [appleMusicUrl, setAppleMusicUrl] = useState('');
  const [audiomackUrl, setAudiomackUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [adType, setAdType] = useState<'listening' | 'download' | 'all'>('listening');

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
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
    async function loadProducerData() {
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

      try {
        const res = await fetch(
          `/api/creator/telemetry${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`,
          {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            cache: 'no-store'
          }
        );
        if (res.ok) {
          const payload = await res.json();
          if (payload.profile?.display_name) {
            setProducerName(payload.profile.display_name);
          }
          if (Array.isArray(payload.beats) && payload.beats.length > 0) {
            setProducerBeats(payload.beats);
          }
        }
      } catch (e) {
        console.warn('Promote telemetry fetch fallback:', e);
      }

      if (!userId) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.display_name) {
        setProducerName(profile.display_name);
      }

      // Load producer beats if not already loaded
      const { data: beats } = await supabase
        .from('beats')
        .select('*')
        .eq('producer_id', userId)
        .order('created_at', { ascending: false });

      if (beats && beats.length > 0) {
        setProducerBeats(beats);
      }

      // Load producer campaigns
      const { data: camps } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('advertiser_id', userId)
        .order('created_at', { ascending: false });

      if (camps) setMyCampaigns(camps);

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

    loadProducerData();
  }, []);

  // When a producer picks an existing beat from their catalog
  const handleSelectCatalogBeat = (beatId: string) => {
    setSelectedBeatId(beatId);
    const beat = producerBeats.find((b) => b.id === beatId);
    if (beat) {
      setSongTitle(beat.title);
      setTagline(`License "${beat.title}" on Caution Beat Store now!`);
      if (beat.cover_url) setCoverUrl(beat.cover_url);
      if (beat.preview_clean_key || beat.master_wav_key) {
        const key = beat.preview_clean_key || beat.master_wav_key;
        setAudioUrl(`https://media.cautionstudioz.com/${key.replace(/^\//, '')}`);
      }
      setAudiomackUrl(`https://cautionstudioz.com/store?beat=${beat.slug || beat.id}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim() || !producerName.trim()) {
      setErrorMessage('Please enter your beat title and producer name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('songTitle', songTitle.trim());
      formData.append('artistName', producerName.trim());
      formData.append('campaignName', tagline.trim() || `Promote Beat "${songTitle.trim()}"`);
      formData.append('packageName', adType);
      formData.append('priceNgn', currentPriceNgn.toString());
      formData.append('targetPlays', currentPlays.toString());
      formData.append('adType', adType);
      if (audioUrl) formData.append('audioUrl', audioUrl);
      if (coverUrl) formData.append('coverUrl', coverUrl);
      if (spotifyUrl) formData.append('spotifyUrl', spotifyUrl);
      if (appleMusicUrl) formData.append('appleMusicUrl', appleMusicUrl);
      if (audiomackUrl) formData.append('audiomackUrl', audiomackUrl);
      if (youtubeUrl) formData.append('youtubeUrl', youtubeUrl);
      if (audioFile) formData.append('audio', audioFile);
      if (coverFile) formData.append('cover', coverFile);

      const res = await fetch('/api/ads/create', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit promotion campaign.');
      }

      setSuccessMessage(
        `Beat promotion campaign launched successfully! "${songTitle}" is now active in rotation across all active listeners.`
      );
      if (data.campaign) {
        setMyCampaigns((prev) => [data.campaign, ...prev]);
      }

      // Reset
      setSongTitle('');
      setTagline('');
      setSelectedBeatId('');
      setAudioFile(null);
      setCoverFile(null);
    } catch (err: any) {
      console.error('Producer ad error:', err);
      setErrorMessage(err.message || 'Failed to submit promotion campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CreatorShell activePath="/promote">
      <div className="space-y-8 max-w-5xl">
        {/* Header */}
        <div className="pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#e53935] animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Commercial Engine // Beat Promotion
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-[#e53935]" />
            <span>Promote Your Beats with Audio Ads</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Put your beats directly in front of thousands of recording artists streaming music and recording vocals on Caution Studioz. Every free user hears an unskippable 15-second audio commercial of your track after every 3 songs, with 1-click links to buy and license your beat.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-2 text-[#e53935]">
              <Radio className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Targeted Artists</span>
            </div>
            <p className="text-xs text-zinc-400">
              Heard by vocalists, rappers, and artists actively searching for fresh production.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Direct Store Conversions</span>
            </div>
            <p className="text-xs text-zinc-400">
              Listeners can immediately click through to license basic, premium, or exclusive rights.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Guaranteed Reach</span>
            </div>
            <p className="text-xs text-zinc-400">
              100% full unskippable 15-second plays verified by the Caution ad telemetry engine.
            </p>
          </div>
        </div>

        {/* 1. SELECT AD PLACEMENT */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
              1. Select Your Ad Placement
            </h2>
            <span className="text-xs text-[#e53935] font-medium font-mono">
              Live Platform Rates
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stream Audio Ad */}
            <div
              onClick={() => setAdType('listening')}
              className={`p-5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                adType === 'listening'
                  ? 'bg-[#e53935]/10 border-[#e53935] shadow-md shadow-[#e53935]/10 ring-1 ring-[#e53935]'
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Radio className="h-4 w-4 text-[#e53935]" />
                  <h3 className="text-sm font-bold text-white">Stream Audio Ad</h3>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black font-mono text-white">
                    ₦{pricing.stream_ad_price_ngn.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  15-second audio break playing every 3 free streamed songs across all active artists & listeners.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span className="text-[#e53935] font-bold">
                  ~{pricing.stream_ad_plays.toLocaleString()} plays
                </span>
                <span className="text-zinc-500 text-[10px]">Guaranteed</span>
              </div>
            </div>

            {/* Download Unlock Ad */}
            <div
              onClick={() => setAdType('download')}
              className={`p-5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                adType === 'download'
                  ? 'bg-[#e53935]/10 border-[#e53935] shadow-md shadow-[#e53935]/10 ring-1 ring-[#e53935]'
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Download Unlock Ad</h3>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black font-mono text-white">
                    ₦{pricing.download_ad_price_ngn.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  Rewarded audio/video ad displayed when artists reach their 2-free download limit to unlock free files.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span className="text-[#e53935] font-bold">
                  ~{pricing.download_ad_plays.toLocaleString()} plays
                </span>
                <span className="text-zinc-500 text-[10px]">Guaranteed</span>
              </div>
            </div>

            {/* Both Placements */}
            <div
              onClick={() => setAdType('all')}
              className={`p-5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                adType === 'all'
                  ? 'bg-[#e53935]/10 border-[#e53935] shadow-md shadow-[#e53935]/10 ring-1 ring-[#e53935]'
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#e53935] text-black uppercase">
                BUNDLE DEAL
              </span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone className="h-4 w-4 text-[#e53935]" />
                  <h3 className="text-sm font-bold text-white">Both Placements</h3>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black font-mono text-[#e53935]">
                    ₦{pricing.both_placements_price_ngn.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  Maximum promotional coverage across both streaming audio pauses and download unlock moments.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
                <span className="text-[#e53935] font-bold">
                  ~{pricing.both_placements_plays.toLocaleString()} plays
                </span>
                <span className="text-emerald-400 text-[10px] font-bold">Save ₦5,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. FORM & 1-CLICK SELECTOR */}
        <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                2. Select From Your Catalog Or Upload New
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pick any beat from your published catalog to prefill audio and cover in 1 click.
              </p>
            </div>

            {producerBeats.length > 0 && (
              <div className="w-full sm:w-64">
                <select
                  value={selectedBeatId}
                  onChange={(e) => handleSelectCatalogBeat(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-[#e53935] font-medium focus:outline-none"
                >
                  <option value="">⚡ Pick Beat from Catalog...</option>
                  {producerBeats.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({Number(b.play_count || 0).toLocaleString()} plays · {Number(b.free_commercial_downloads_count || 0).toLocaleString()} downloads)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Beat / Track Title *</label>
                <input
                  type="text"
                  required
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="e.g. Afrobeats Sunset (Prod. by Caution)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e53935]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Producer / Creator Name *</label>
                <input
                  type="text"
                  required
                  value={producerName}
                  onChange={(e) => setProducerName(e.target.value)}
                  placeholder="e.g. Zino Waves"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e53935]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Call to Action Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. License this hit beat today on Caution Studio Beat Store!"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#e53935]"
              />
            </div>

            {/* Uploads (if not using existing catalog beat) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Audio Snippet (15-30s WAV / MP3) {audioUrl && <span className="text-[#e53935]">(Loaded from Catalog)</span>}
                </label>
                <div className="border border-dashed border-zinc-800 rounded-lg p-3 bg-zinc-950">
                  <input
                    type="file"
                    accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/x-m4a,audio/flac,audio/ogg,audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg"
                    onChange={(e) => {
                      setAudioFile(e.target.files?.[0] || null);
                      setAudioUrl('');
                    }}
                    className="w-full text-xs text-zinc-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer"
                  />
                  {audioFile && (
                    <p className="text-[10px] text-[#e53935] font-mono mt-1 truncate">
                      ✓ Selected: {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                  {audioUrl && !audioFile && (
                    <p className="text-[10px] text-[#e53935] font-mono mt-1 truncate">
                      Catalog Audio: {audioUrl}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Cover Artwork {coverUrl && <span className="text-[#e53935]">(Loaded from Catalog)</span>}
                </label>
                <div className="border border-dashed border-zinc-800 rounded-lg p-3 bg-zinc-950">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,image/*,.jpg,.jpeg,.png,.webp,.heic"
                    onChange={(e) => {
                      setCoverFile(e.target.files?.[0] || null);
                      setCoverUrl('');
                    }}
                    className="w-full text-xs text-zinc-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer"
                  />
                  {coverFile && (
                    <p className="text-[10px] text-[#e53935] font-mono mt-1 truncate">
                      ✓ Selected: {coverFile.name}
                    </p>
                  )}
                  {coverUrl && !coverFile && (
                    <p className="text-[10px] text-[#e53935] font-mono mt-1 truncate">
                      Catalog Artwork: {coverUrl}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Destination Links */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs font-semibold text-zinc-300 block">
                Destination & DSP Links (Shown to listeners on the commercial banner)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-amber-400 font-medium">Beat Store / Audiomack Link</span>
                  <input
                    type="url"
                    value={audiomackUrl}
                    onChange={(e) => setAudiomackUrl(e.target.value)}
                    placeholder="https://cautionstudioz.com/store?beat=..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-emerald-400 font-medium">Spotify Link (Optional)</span>
                  <input
                    type="url"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    placeholder="https://open.spotify.com/..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-pink-400 font-medium">Apple Music Link (Optional)</span>
                  <input
                    type="url"
                    value={appleMusicUrl}
                    onChange={(e) => setAppleMusicUrl(e.target.value)}
                    placeholder="https://music.apple.com/..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-red-400 font-medium">YouTube Link (Optional)</span>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Total and Submit */}
            <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-zinc-400 block">Total Due:</span>
                <span className="text-2xl font-black font-mono text-[#e53935]">
                  ₦{currentPriceNgn.toLocaleString()}
                </span>
                <span className="text-[11px] text-zinc-500 block mt-0.5">
                  Includes ~{currentPlays.toLocaleString()} unskippable plays & email confirmation to support
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-lg bg-[#e53935] hover:bg-[#d32f2f] text-black font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Injecting Campaign...</span>
                ) : (
                  <>
                    <Megaphone className="h-4 w-4" />
                    <span>Launch Beat Campaign (₦{currentPriceNgn.toLocaleString()})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Producer Campaign History */}
        {myCampaigns.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
              My Active Beat Campaigns
            </h2>
            <div className="divide-y divide-zinc-800 rounded-xl bg-zinc-900/50 border border-zinc-800 overflow-hidden">
              {myCampaigns.map((camp) => {
                const progress = Math.min(100, Math.round(((camp.delivered_plays || 0) / (camp.target_plays || 1)) * 100));
                return (
                  <div key={camp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-zinc-800 flex items-center justify-center text-[#e53935] shrink-0 overflow-hidden">
                        {camp.cover_url ? (
                          <img src={camp.cover_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Music2 className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{camp.song_title}</h4>
                        <span className="text-[10px] text-zinc-400 font-mono block">
                          {camp.package_name?.toUpperCase()} · ₦{(camp.price_ngn || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-[10px] text-zinc-400 font-mono mb-1">
                          {(camp.delivered_plays || 0).toLocaleString()} / {(camp.target_plays || 0).toLocaleString()} plays
                        </div>
                        <div className="w-32 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                          <div className="h-full bg-[#e53935]" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-zinc-500 block">Clicks</span>
                        <span className="text-xs font-mono font-bold text-[#e53935]">
                          {camp.clicks_count || 0}
                        </span>
                      </div>

                      <div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            camp.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400'
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
    </CreatorShell>
  );
}

