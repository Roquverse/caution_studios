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

interface CampaignTier {
  id: 'starter' | 'pro' | 'studio';
  name: string;
  priceNgn: number;
  plays: number;
  cpm: string;
  badge?: string;
  description: string;
}

const TIERS: CampaignTier[] = [
  {
    id: 'starter',
    name: 'Starter Spotlight',
    priceNgn: 15000,
    plays: 5000,
    cpm: '₦3,000 / 1k plays',
    description: '5,000 guaranteed unskippable 15s audio plays across free artists & listeners.'
  },
  {
    id: 'pro',
    name: 'Pro Rotation',
    priceNgn: 35000,
    plays: 15000,
    cpm: '₦2,333 / 1k plays',
    badge: 'RECOMMENDED',
    description: '15,000 guaranteed plays + priority queue injection in 3-song cycles.'
  },
  {
    id: 'studio',
    name: 'Studio Blast',
    priceNgn: 75000,
    plays: 40000,
    cpm: '₦1,875 / 1k plays',
    description: '40,000 guaranteed plays + featured homepage & beat store banner.'
  }
];

export default function ProducerPromotePage() {
  const [selectedTier, setSelectedTier] = useState<CampaignTier>(TIERS[1]);
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

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [myCampaigns, setMyCampaigns] = useState<any[]>([]);

  useEffect(() => {
    async function loadProducerData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile?.display_name) {
        setProducerName(profile.display_name);
      }

      // Load producer beats
      const { data: beats } = await supabase
        .from('beats')
        .select('*')
        .eq('producer_id', session.user.id)
        .order('created_at', { ascending: false });

      if (beats && beats.length > 0) {
        setProducerBeats(beats);
      }

      // Load producer campaigns
      const { data: camps } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('advertiser_id', session.user.id)
        .order('created_at', { ascending: false });

      if (camps) setMyCampaigns(camps);
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
      formData.append('packageName', selectedTier.id);
      formData.append('priceNgn', selectedTier.priceNgn.toString());
      formData.append('targetPlays', selectedTier.plays.toString());
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
        `Beat promotion campaign launched successfully! "${songTitle}" is now active in the 3-song rotation across free listeners.`
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
            <span className="h-2 w-2 rounded-full bg-[#2dd4bf] animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Commercial Engine // Beat Promotion
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-[#2dd4bf]" />
            <span>Promote Your Beats with Audio Ads</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Put your beats directly in front of thousands of recording artists streaming music and recording vocals on Caution Studioz. Every free user hears an unskippable 15-second audio commercial of your track after every 3 songs, with 1-click links to buy and license your beat.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
            <div className="flex items-center gap-2 text-[#2dd4bf]">
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

        {/* 1. SELECT TIER */}
        <div className="space-y-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
            1. Select Campaign Ad Tier
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((tier) => {
              const isSelected = selectedTier.id === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier)}
                  className={`p-5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#2dd4bf]/10 border-[#2dd4bf] shadow-md shadow-[#2dd4bf]/10 ring-1 ring-[#2dd4bf]'
                      : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  {tier.badge && (
                    <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#2dd4bf] text-black uppercase">
                      {tier.badge}
                    </span>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white">{tier.name}</h3>
                    <div className="mt-2">
                      <span className="text-2xl font-black font-mono text-white">
                        ₦{tier.priceNgn.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">{tier.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-[#2dd4bf] font-bold">
                      {tier.plays.toLocaleString()} plays
                    </span>
                    <span className="text-zinc-500 text-[10px]">{tier.cpm}</span>
                  </div>
                </div>
              );
            })}
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-[#2dd4bf] font-medium focus:outline-none"
                >
                  <option value="">⚡ Pick Beat from Catalog...</option>
                  {producerBeats.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.genre || 'Beat'})
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2dd4bf]"
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2dd4bf]"
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2dd4bf]"
              />
            </div>

            {/* Uploads (if not using existing catalog beat) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Audio Snippet (15-30s WAV / MP3) {audioUrl && <span className="text-[#2dd4bf]">(Loaded from Catalog)</span>}
                </label>
                <div className="border border-dashed border-zinc-800 rounded-lg p-3 bg-zinc-950">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      setAudioFile(e.target.files?.[0] || null);
                      setAudioUrl('');
                    }}
                    className="text-xs text-zinc-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer"
                  />
                  {audioUrl && (
                    <p className="text-[10px] text-[#2dd4bf] font-mono mt-1 truncate">
                      Catalog Audio: {audioUrl}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">
                  Cover Artwork {coverUrl && <span className="text-[#2dd4bf]">(Loaded from Catalog)</span>}
                </label>
                <div className="border border-dashed border-zinc-800 rounded-lg p-3 bg-zinc-950">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setCoverFile(e.target.files?.[0] || null);
                      setCoverUrl('');
                    }}
                    className="text-xs text-zinc-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer"
                  />
                  {coverUrl && (
                    <p className="text-[10px] text-[#2dd4bf] font-mono mt-1 truncate">
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
                <span className="text-2xl font-black font-mono text-[#2dd4bf]">
                  ₦{selectedTier.priceNgn.toLocaleString()}
                </span>
                <span className="text-[11px] text-zinc-500 block mt-0.5">
                  Includes {selectedTier.plays.toLocaleString()} unskippable plays & email confirmation to support
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-lg bg-[#2dd4bf] hover:bg-[#20b8a4] text-black font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Injecting Campaign...</span>
                ) : (
                  <>
                    <Megaphone className="h-4 w-4" />
                    <span>Launch Beat Campaign (₦{selectedTier.priceNgn.toLocaleString()})</span>
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
                      <div className="h-10 w-10 rounded bg-zinc-800 flex items-center justify-center text-[#2dd4bf] shrink-0 overflow-hidden">
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
                          <div className="h-full bg-[#2dd4bf]" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-zinc-500 block">Clicks</span>
                        <span className="text-xs font-mono font-bold text-[#2dd4bf]">
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

