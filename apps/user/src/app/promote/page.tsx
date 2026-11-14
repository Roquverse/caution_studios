'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Megaphone,
  Sparkles,
  ChevronLeft,
  CheckCircle2,
  Upload,
  Radio,
  ExternalLink,
  ShieldCheck,
  Music2,
  TrendingUp,
  Headphones,
  Play,
  Pause,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { UserProfileData } from '../../components/UserDropdown';
import { UserShell } from '../../components/UserShell';
import { UserAdModal } from '../../components/UserAdModal';

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
    description: '5,000 guaranteed unskippable 15-second audio plays across all active listeners.'
  },
  {
    id: 'pro',
    name: 'Pro Rotation',
    priceNgn: 35000,
    plays: 15000,
    cpm: '₦2,333 / 1k plays',
    badge: 'MOST POPULAR',
    description: '15,000 guaranteed plays + high-priority queue injection in every 3-song cycle.'
  },
  {
    id: 'studio',
    name: 'Studio Blast',
    priceNgn: 75000,
    plays: 40000,
    cpm: '₦1,875 / 1k plays',
    description: '40,000 guaranteed plays + featured artist homepage spotlight.'
  }
];

export default function PromoteMusicPage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [selectedTier, setSelectedTier] = useState<CampaignTier>(TIERS[1]);
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
    }
    loadUser();
  }, []);

  const uploadFileDirectly = async (
    file: File,
    type: 'audio' | 'cover',
    titleStr: string,
    authToken?: string
  ): Promise<string> => {
    let targetContentType = file.type;
    if (!targetContentType || targetContentType === 'application/octet-stream') {
      if (type === 'audio') {
        const ext = file.name.split('.').pop()?.toLowerCase();
        targetContentType = ext === 'wav' ? 'audio/wav' : 'audio/mpeg';
      } else if (type === 'cover') {
        targetContentType = 'image/jpeg';
      }
    }

    const presignRes = await fetch('/api/ads/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: targetContentType,
        type,
        title: titleStr
      })
    });

    const presignText = await presignRes.text();
    let presignJson: any = {};
    try {
      presignJson = JSON.parse(presignText);
    } catch {
      throw new Error(`Storage error (${presignRes.status}): ${presignText.slice(0, 120)}`);
    }

    if (!presignRes.ok || !presignJson.uploadUrl || !presignJson.publicUrl) {
      throw new Error(presignJson.error || `Failed to initiate storage upload for ${file.name}`);
    }

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignJson.uploadUrl, true);
      xhr.setRequestHeader('Content-Type', targetContentType);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Storage upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during file upload to storage. Check connection.'));
      };

      xhr.send(file);
    });

    return presignJson.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim() || !artistName.trim()) {
      setErrorMessage('Please enter your song title and artist name.');
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
      const advertiserEmail = session?.user?.email;

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

      setUploadStep('Launching song promotion campaign...');
      setUploadProgress(100);

      const payload = {
        advertiserId,
        advertiserEmail,
        songTitle: songTitle.trim(),
        artistName: artistName.trim(),
        campaignName: tagline.trim() || `Promote "${songTitle.trim()}"`,
        packageName: selectedTier.id,
        priceNgn: selectedTier.priceNgn,
        targetPlays: selectedTier.plays,
        audioUrl: audioUrl || undefined,
        coverUrl: coverUrl || undefined,
        spotifyUrl: spotifyUrl.trim() || undefined,
        appleMusicUrl: appleMusicUrl.trim() || undefined,
        audiomackUrl: audiomackUrl.trim() || undefined,
        youtubeUrl: youtubeUrl.trim() || undefined
      };

      const res = await fetch('/api/ads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch {
        throw new Error(`Server returned error (${res.status}): ${resText.slice(0, 120)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit promotion campaign.');
      }

      setSuccessMessage(
        `Campaign submitted successfully! Your song "${songTitle}" is now active in the 3-song rotation.`
      );
      if (data.campaign) {
        setMyCampaigns((prev) => [data.campaign, ...prev]);
      }

      // Reset form
      setSongTitle('');
      setTagline('');
      setAudioFile(null);
      setCoverFile(null);
    } catch (err: any) {
      console.error('Promotion submission error:', err);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
      setUploadStep('');
    }
  };

  return (
    <UserShell activePath="/promote">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href="/" className="hover:text-white transition-colors">
              Studio
            </Link>
            <span>/</span>
            <span className="text-[#2dd4bf] font-medium">Song Promotion</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Megaphone className="h-7 w-7 text-[#2dd4bf]" />
                <span>Promote Your Music with Audio Ads</span>
              </h1>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl">
                Get thousands of guaranteed, unskippable 15-second audio plays across all active listeners on Caution Studioz. Every listener is served direct links to stream your full song on Spotify, Apple Music, Audiomack, and YouTube.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 flex items-center gap-2 transition-all shrink-0 self-start sm:self-auto cursor-pointer shadow-sm hover:scale-[1.02]"
            >
              <Radio className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>Preview 15s Audio Ad</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-[#2dd4bf]">
              <Radio className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Unskippable Rotation</span>
            </div>
            <p className="text-xs text-gray-400">
              Plays automatically after every 2+ songs streamed across all listeners. Guaranteed 100% completion.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400">
              <ExternalLink className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Direct DSP Conversions</span>
            </div>
            <p className="text-xs text-gray-400">
              Interactive 1-tap buttons send listeners straight to your Spotify, Apple Music, Audiomack, and YouTube.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Live Impression Tracking</span>
            </div>
            <p className="text-xs text-gray-400">
              Watch real-time verified delivery of plays and direct streaming clicks from the admin ledger.
            </p>
          </div>
        </div>

        {/* TIER SELECTION */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">
            1. Select Your Ad Package Tier
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((tier) => {
              const isSelected = selectedTier.id === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#2dd4bf]/10 border-[#2dd4bf] shadow-lg shadow-[#2dd4bf]/10 ring-1 ring-[#2dd4bf]'
                      : 'bg-[#12141a] border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
                  }`}
                >
                  {tier.badge && (
                    <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#2dd4bf] text-black uppercase">
                      {tier.badge}
                    </span>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white">{tier.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl font-black font-mono text-white">
                        ₦{tier.priceNgn.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{tier.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className="text-[#2dd4bf] font-bold">
                      {tier.plays.toLocaleString()} plays
                    </span>
                    <span className="text-gray-500 text-[10px]">{tier.cpm}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SUBMISSION FORM */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#12141a] border border-white/10 space-y-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">
              2. Song Details & Streaming Links
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Provide your audio snippet, artwork, and streaming destinations.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Song Title *</label>
                <input
                  type="text"
                  required
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="e.g. Lagos City Vibes"
                  className="w-full bg-[#08090B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Artist / Stage Name *</label>
                <input
                  type="text"
                  required
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="e.g. Teniola Sounds"
                  className="w-full bg-[#08090B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">Campaign Tagline / Headline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Stream my new single out now on all major platforms!"
                className="w-full bg-[#08090B] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf]"
              />
            </div>

            {/* Media Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">
                  Audio Snippet (15-30s WAV / MP3)
                </label>
                <div className="border border-dashed border-white/10 rounded-xl p-4 text-center hover:border-white/20 transition-colors bg-[#08090B]">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">If empty, fallback demo audio will be used</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">
                  Cover Artwork (JPG / PNG)
                </label>
                <div className="border border-dashed border-white/10 rounded-xl p-4 text-center hover:border-white/20 transition-colors bg-[#08090B]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">1:1 square recommended</p>
                </div>
              </div>
            </div>

            {/* DSP Links */}
            <div className="space-y-3 pt-2 border-t border-white/5">
              <label className="text-xs font-bold text-gray-300 block">
                Streaming Destinations (Buttons shown to listeners)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-emerald-400 font-medium">Spotify Link</span>
                  <input
                    type="url"
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    placeholder="https://open.spotify.com/track/..."
                    className="w-full bg-[#08090B] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-pink-400 font-medium">Apple Music Link</span>
                  <input
                    type="url"
                    value={appleMusicUrl}
                    onChange={(e) => setAppleMusicUrl(e.target.value)}
                    placeholder="https://music.apple.com/album/..."
                    className="w-full bg-[#08090B] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-amber-400 font-medium">Audiomack Link</span>
                  <input
                    type="url"
                    value={audiomackUrl}
                    onChange={(e) => setAudiomackUrl(e.target.value)}
                    placeholder="https://audiomack.com/song/..."
                    className="w-full bg-[#08090B] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-red-400 font-medium">YouTube Link</span>
                  <input
                    type="url"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-[#08090B] border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Total and Submit */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-gray-400 block">Total Due:</span>
                <span className="text-2xl font-black font-mono text-[#2dd4bf]">
                  ₦{selectedTier.priceNgn.toLocaleString()}
                </span>
                <span className="text-[11px] text-gray-500 block mt-0.5">
                  Includes {selectedTier.plays.toLocaleString()} unskippable plays & email verification to support
                </span>
              </div>

              {isSubmitting && (
                <div className="w-full sm:max-w-xs space-y-1.5 p-3 rounded-xl bg-white/[0.04] border border-[#2dd4bf]/30">
                  <div className="flex items-center justify-between text-xs text-[#2dd4bf] font-medium">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {uploadStep || 'Processing...'}
                    </span>
                    <span className="font-mono">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#2dd4bf] h-1.5 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl bg-[#2dd4bf] hover:bg-[#20b8a4] text-black font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{uploadProgress > 0 ? `Uploading (${uploadProgress}%)...` : 'Submitting Campaign...'}</span>
                  </span>
                ) : (
                  <>
                    <Megaphone className="h-4 w-4" />
                    <span>Launch Campaign (₦{selectedTier.priceNgn.toLocaleString()})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* User Campaign History */}
        {myCampaigns.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">
              My Active Campaigns
            </h2>
            <div className="divide-y divide-white/5 rounded-2xl bg-[#12141a] border border-white/10 overflow-hidden">
              {myCampaigns.map((camp) => {
                const progress = Math.min(100, Math.round(((camp.delivered_plays || 0) / (camp.target_plays || 1)) * 100));
                return (
                  <div key={camp.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-[#2dd4bf] shrink-0 overflow-hidden">
                        {camp.cover_url ? (
                          <img src={camp.cover_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Music2 className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{camp.song_title}</h4>
                        <span className="text-[11px] text-gray-400 block">
                          {camp.package_name?.toUpperCase()} · ₦{(camp.price_ngn || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-[10px] text-gray-400 font-mono mb-1">
                          Plays: {(camp.delivered_plays || 0).toLocaleString()} / {(camp.target_plays || 0).toLocaleString()}
                        </div>
                        <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full bg-[#2dd4bf]" style={{ width: `${progress}%` }} />
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-gray-400 block">DSP Clicks</span>
                        <span className="text-xs font-mono font-bold text-[#2dd4bf]">
                          {camp.clicks_count || 0}
                        </span>
                      </div>

                      <div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            camp.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
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

      <UserAdModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </UserShell>
  );
}

