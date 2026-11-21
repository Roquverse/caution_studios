'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreatorShell } from '../../components/CreatorShell';
import { supabase } from '../../lib/supabaseClient';
import {
  Music2,
  Plus,
  Search,
  Play,
  Pause,
  Trash2,
  UploadCloud,
  Loader2,
  Image as ImageIcon,
  Crown,
  Upload,
  ArrowUpRight,
  SlidersHorizontal,
  MoreVertical,
  Download
} from 'lucide-react';
import { UpdateArtworkModal } from '../../components/UpdateArtworkModal';

function formatDbBeat(b: any) {
  const licenses = b.licenses || b.beat_licenses || [];
  const basic = licenses.find((l: any) => l.type === 'basic');
  const premium = licenses.find((l: any) => l.type === 'premium');
  const exclusive = licenses.find((l: any) => l.type === 'exclusive');

  const durM = Math.floor((b.duration_seconds || 180) / 60);
  const durS = (b.duration_seconds || 180) % 60;
  const audioKey = b.master_wav_key || b.preview_clean_key || b.preview_tagged_key;
  let audioUrl = '';
  if (audioKey) {
    audioUrl = audioKey.startsWith('http') || audioKey.startsWith('/') ? audioKey : `/api/media/${audioKey}`;
  } else {
    audioUrl = '/api/media/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3';
  }

  const plays = Number(b.play_count || 0);
  const downloads = Number(b.free_commercial_downloads_count || b.downloads_count || b.download_count || 0);
  const combinedActivity = plays + downloads;
  const thresholdPct = Math.min(100, Math.round((combinedActivity / 10000) * 100));

  const hasPaidPremium = Boolean(premium && premium.enabled !== false && Number(premium.price_cents) > 100);
  const hasPaidExclusive = Boolean(exclusive && exclusive.enabled !== false && Number(exclusive.price_cents) > 100);
  const hasPaidBasic = Boolean(basic && basic.enabled !== false && Number(basic.price_cents) > 100);
  const isFree = !hasPaidPremium && !hasPaidExclusive && !hasPaidBasic;

  return {
    id: b.id,
    title: b.title,
    genre: b.genre || 'Afrobeats',
    bpm: b.bpm || 110,
    key: b.musical_key || 'C Minor',
    duration: `${durM}:${durS.toString().padStart(2, '0')}`,
    stemsUploaded: Boolean(b.stems_zip_key),
    isFree,
    priceBasicNgn: hasPaidBasic ? Math.round(basic.price_cents / 100) : null,
    pricePremiumNgn: hasPaidPremium ? Math.round(premium.price_cents / 100) : null,
    priceExclusiveNgn: hasPaidExclusive ? Math.round(exclusive.price_cents / 100) : null,
    streamsCount: plays,
    downloadsCount: downloads,
    combinedActivity,
    thresholdPct,
    salesCount: b.sales_count || (b.status === 'sold' ? 1 : 0),
    status: b.status === 'sold' ? 'sold_exclusive' : (b.status || 'live'),
    coverUrl: b.cover_url || '/images/studio_mixing_console.jpg',
    audioUrl
  };
}

export default function BeatsCatalogPage() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState('all');
  const [beatsList, setBeatsList] = useState<any[]>([]);
  const [totalPlays, setTotalPlays] = useState(0);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [totalEarningsNgn, setTotalEarningsNgn] = useState(0);
  const [availableBalanceNgn, setAvailableBalanceNgn] = useState(0);
  const [totalSalesEarningsNgn, setTotalSalesEarningsNgn] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [artworkModalBeat, setArtworkModalBeat] = useState<{ id: string; title: string; coverUrl?: string } | null>(null);

  // Fetch this producer's real beats + telemetry from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadRealBeats() {
      try {
        setIsLoading(true);
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

        const res = await fetch(
          `/api/creator/telemetry${userId ? `?userId=${encodeURIComponent(userId)}&_t=${Date.now()}` : `?_t=${Date.now()}`}`,
          {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            cache: 'no-store'
          }
        );

        if (res.ok) {
          const payload = await res.json();
          if (isMounted) {
            setTotalPlays(Number(payload.totalPlaysCount || 0));
            setTotalDownloads(Number(payload.totalDownloadsCount || 0));
            setTotalEarningsNgn(Number(payload.totalEarningsNgn || 0));
            setAvailableBalanceNgn(Number(payload.availableBalanceNgn || 0));
            setTotalSalesEarningsNgn(Number(payload.totalSalesEarningsNgn || 0));

            if (Array.isArray(payload.beats) && payload.beats.length > 0) {
              const formatted = payload.beats.map(formatDbBeat);
              setBeatsList(formatted);
              return;
            }
          }
        }

        if (userId) {
          const { data: userBeats, error: userError } = await supabase
            .from('beats')
            .select(`
              *,
              licenses:beat_licenses (
                type,
                price_cents,
                enabled
              )
            `)
            .eq('producer_id', userId)
            .order('created_at', { ascending: false });

          if (!userError && userBeats && userBeats.length > 0 && isMounted) {
            const formatted = userBeats.map(formatDbBeat);
            setBeatsList(formatted);
            setTotalPlays(formatted.reduce((sum, b) => sum + b.streamsCount, 0));
            setTotalDownloads(formatted.reduce((sum, b) => sum + b.downloadsCount, 0));
            return;
          }
        }

        // Fallback: If no beats directly matched or session is generic, load latest catalog beats
        const { data: allBeats, error: allErr } = await supabase
          .from('beats')
          .select(`
            *,
            licenses:beat_licenses (
              type,
              price_cents,
              enabled
            )
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!allErr && allBeats && isMounted) {
          const formatted = allBeats.map(formatDbBeat);
          setBeatsList(formatted);
          setTotalPlays(formatted.reduce((sum, b) => sum + b.streamsCount, 0));
          setTotalDownloads(formatted.reduce((sum, b) => sum + b.downloadsCount, 0));
        }
      } catch (err) {
        console.warn('Failed to load real beats for creator catalog:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRealBeats();
    return () => {
      isMounted = false;
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, []);

  const togglePlay = (id: string, audioUrl?: string) => {
    if (playingId === id) {
      if (audioElement) audioElement.pause();
      setPlayingId(null);
    } else {
      if (audioElement) audioElement.pause();
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(() => {});
        audio.onended = () => setPlayingId(null);
        setAudioElement(audio);
        setPlayingId(id);
      } else {
        setPlayingId(id);
      }
    }
  };

  const handleDeleteBeat = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from your catalog?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('beats')
        .delete()
        .eq('id', id);

      if (!error) {
        setBeatsList((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert('Could not delete beat. Please try again.');
      }
    } catch (e) {
      console.error('Error deleting beat:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBeats = beatsList.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = filterGenre === 'all' || b.genre.toLowerCase() === filterGenre.toLowerCase();
    return matchesSearch && matchesGenre;
  });

  const totalSalesCount = beatsList.reduce((sum, b) => sum + (b.salesCount || 0), 0);
  
  // Real producer generated income in Naira:
  // Derived from telemetry (actual order_items & licenses net split + download incentive rewards)
  // or catalog sold beats (salesCount * 80% producer cut)
  const computedSalesFromBeatsNgn = beatsList.reduce((sum, b) => {
    if (b.isFree) return sum;
    const cut = b.pricePremiumNgn ? Math.round(b.pricePremiumNgn * 0.8) : 0;
    return sum + ((b.salesCount || 0) * cut);
  }, 0);
  const actualGeneratedIncomeNgn = totalEarningsNgn > 0
    ? totalEarningsNgn
    : (totalSalesEarningsNgn > 0 ? totalSalesEarningsNgn : computedSalesFromBeatsNgn);

  const combinedActivity = totalPlays + totalDownloads;
  const thresholdPct = Math.min(100, Math.round((combinedActivity / 10000) * 100));

  return (
    <CreatorShell>
      {/* 1. EDITORIAL STUDIO HERO BANNER */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#16181d] p-6 sm:p-8 min-h-[170px] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        {/* Studio Producer Background Artwork with Red Ambient Lighting */}
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-3/5 pointer-events-none overflow-hidden">
          <img
            src="/images/african_producer_beats.jpg"
            alt="Studio Mixing & Mastering"
            className="w-full h-full object-cover object-right md:object-center opacity-35 md:opacity-45 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#16181d] via-[#16181d]/85 to-transparent" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-[#16181d]" />
          {/* Subtle Ambient Red Glow */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#e53935]/15 blur-3xl pointer-events-none" />
        </div>

        {/* Banner Left Info */}
        <div className="relative z-10 max-w-xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <span>Creator Studio</span>
            <span className="text-gray-600">&gt;</span>
            <span className="text-white font-semibold">Beat Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Beat Catalog Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            Manage your master files, pricing, stem archives, and commercial license availability.
          </p>
        </div>

        {/* Banner Right Action Button */}
        <div className="relative z-10 shrink-0">
          <Link
            href="/beats/upload"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e53935] hover:bg-[#d32f2f] text-white text-xs font-bold transition-all shadow-lg shadow-[#e53935]/30 hover:scale-[1.02] cursor-pointer"
          >
            <Upload className="h-4 w-4 stroke-[2.5]" />
            <span>Upload Beat</span>
          </Link>
        </div>
      </div>

      {/* 2. FOUR PREMIUM KPI CARDS WITH SPARKLINES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Catalog Plays */}
        <div className="relative rounded-2xl border border-white/[0.06] bg-[#13151b] p-5 shadow-lg flex flex-col justify-between overflow-hidden group hover:border-white/[0.12] transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e53935]/15 border border-[#e53935]/30 flex items-center justify-center text-[#e53935] shrink-0">
                <Play className="h-4 w-4 fill-current ml-0.5" />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-medium block">Total Catalog Plays</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black font-mono text-white">
                    {totalPlays.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400 flex items-center">
                    Live Streams
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Smooth Red Sparkline SVG */}
          <div className="mt-4 h-9 w-full flex items-end">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 160 32" fill="none">
              <path
                d="M0 24 C 20 22, 40 28, 60 20 C 80 12, 100 22, 120 10 C 140 6, 150 12, 160 4"
                stroke="#e53935"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Total Catalog Downloads */}
        <div className="relative rounded-2xl border border-white/[0.06] bg-[#13151b] p-5 shadow-lg flex flex-col justify-between overflow-hidden group hover:border-white/[0.12] transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e53935]/15 border border-[#e53935]/30 flex items-center justify-center text-[#e53935] shrink-0">
                <Download className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs text-gray-400 font-medium block">Total Catalog Downloads</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black font-mono text-white">
                    {totalDownloads.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400 flex items-center">
                    Commercial DLs
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Smooth Sparkline Curve SVG */}
          <div className="mt-4 h-9 w-full flex items-end">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 160 32" fill="none">
              <path
                d="M0 26 C 30 25, 60 27, 90 18 C 120 10, 140 14, 160 6"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Total Generated Income (Naira) */}
        <div className="relative rounded-2xl border border-white/[0.06] bg-[#13151b] p-5 shadow-lg flex flex-col justify-between overflow-hidden group hover:border-white/[0.12] transition-colors">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-mono font-black text-lg">
                ₦
              </div>
              <div>
                <span className="text-xs text-gray-400 font-medium block">Total Generated Income</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black font-mono text-white">
                    ₦{actualGeneratedIncomeNgn.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center">
                    80% Cut
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* Sparkline Curve SVG */}
          <div className="mt-4 h-9 w-full flex items-end">
            <svg className="w-full h-8 overflow-visible" viewBox="0 0 160 32" fill="none">
              <path
                d="M0 28 C 30 26, 60 22, 90 14 C 120 6, 140 12, 160 4"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: 10,000 Pay Threshold */}
        <div className="relative rounded-2xl border border-white/[0.06] bg-[#13151b] p-5 shadow-lg flex flex-col justify-between overflow-hidden group hover:border-white/[0.12] transition-colors">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                <Crown className="h-4 w-4 fill-amber-400/20" />
                <span>10,000 Pay Threshold</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-mono">
                {thresholdPct}% to 10k
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono text-white">
                {combinedActivity.toLocaleString()}
              </span>
              <span className="text-xs font-mono text-gray-500">
                / 10,000 plays &amp; dls
              </span>
            </div>
          </div>

          {/* Red Progress Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#e53935] to-amber-400 transition-all duration-500 shadow-sm shadow-[#e53935]/50"
                style={{ width: `${Math.max(thresholdPct, combinedActivity > 0 ? 3 : 0)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
              <span>Pay Threshold Goal</span>
              <span className="text-amber-300 font-semibold">₦30,000 payout</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CATALOG SEARCH & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#13151b] p-3 rounded-2xl border border-white/[0.06]">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181a20] border border-white/[0.06] rounded-xl py-2 pl-10 pr-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#181a20] border border-white/[0.06] rounded-xl px-3 py-1.5">
            <span className="text-xs text-gray-400 font-medium">Genre:</span>
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#181a20]">All Genres</option>
              <option value="afrobeats" className="bg-[#181a20]">Afrobeats</option>
              <option value="amapiano" className="bg-[#181a20]">Amapiano</option>
              <option value="hip-hop" className="bg-[#181a20]">Hip-Hop</option>
              <option value="r&b" className="bg-[#181a20]">R&amp;B</option>
              <option value="trap" className="bg-[#181a20]">Trap</option>
              <option value="electronic" className="bg-[#181a20]">Electronic</option>
            </select>
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#181a20] border border-white/[0.06] text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/[0.04] transition-colors"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* 4. BEATS DATA TABLE CARD */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#13151b] shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-[#e53935] animate-spin" />
            <span className="text-xs font-mono text-gray-400">Loading your beat catalog...</span>
          </div>
        ) : filteredBeats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f1115] border-b border-white/[0.06] text-gray-400 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Track</th>
                  <th className="py-3.5 px-4 font-bold">BPM / Key</th>
                  <th className="py-3.5 px-4 font-bold">License Pricing</th>
                  <th className="py-3.5 px-4 font-bold text-center">Plays</th>
                  <th className="py-3.5 px-4 font-bold text-center">Downloads</th>
                  <th className="py-3.5 px-4 font-bold text-center">
                    <div>Pay Threshold</div>
                    <div className="text-[9px] font-normal text-zinc-400 font-mono tracking-tight">Plays + Downloads</div>
                  </th>
                  <th className="py-3.5 px-4 font-bold text-center">Sales</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredBeats.map((beat) => (
                  <tr key={beat.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Track Info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => togglePlay(beat.id, beat.audioUrl)}
                          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            playingId === beat.id
                              ? 'bg-[#e53935] text-white shadow-md shadow-[#e53935]/30'
                              : 'bg-white/[0.04] hover:bg-[#e53935] text-gray-300 hover:text-white'
                          }`}
                        >
                          {playingId === beat.id ? (
                            <Pause className="h-4 w-4 fill-current" />
                          ) : (
                            <Play className="h-4 w-4 fill-current ml-0.5" />
                          )}
                        </button>

                        {/* Beat Artwork Thumbnail */}
                        <div
                          onClick={() => setArtworkModalBeat(beat)}
                          className="relative h-11 w-11 rounded-xl overflow-hidden shrink-0 border border-white/[0.08] bg-black/60 group cursor-pointer shadow-sm"
                          title="Click to view/change artwork"
                        >
                          <img
                            src={beat.coverUrl}
                            alt={beat.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#e53935]">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <span className="font-bold text-white block truncate max-w-[220px]">
                            {beat.title}
                          </span>
                          <span className="text-[11px] text-gray-400 block pt-0.5">
                            {beat.genre} · {beat.duration}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* BPM & Key */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-xs font-bold text-white">{beat.bpm} BPM</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{beat.key}</div>
                    </td>

                    {/* License Pricing */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {beat.isFree || (!beat.pricePremiumNgn && !beat.priceExclusiveNgn) ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Free Beat</span>
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          {beat.pricePremiumNgn ? (
                            <div className="text-gray-300">
                              Prem: ₦{beat.pricePremiumNgn.toLocaleString()}
                            </div>
                          ) : null}
                          {beat.priceExclusiveNgn ? (
                            <div className="text-[#e53935] font-bold">
                              Excl: ₦{beat.priceExclusiveNgn.toLocaleString()}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </td>

                    {/* Plays */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                      {(beat.streamsCount || 0).toLocaleString()}
                    </td>

                    {/* Downloads */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-300">
                      {(beat.downloadsCount || 0).toLocaleString()}
                    </td>

                    {/* Pay Threshold Progress */}
                    <td className="py-3.5 px-4 text-center font-mono text-[11px]">
                      <div className="text-white font-bold">{(beat.combinedActivity || 0).toLocaleString()} / 10k</div>
                      <div className="text-[10px] text-zinc-400 font-medium mt-0.5 whitespace-nowrap">
                        {beat.streamsCount} plays + {beat.downloadsCount} dls
                      </div>
                      <div className="text-[10px] text-amber-400 font-semibold mt-0.5">{beat.thresholdPct || 0}%</div>
                    </td>

                    {/* Sales */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                      {beat.salesCount}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {beat.status === 'live' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Live</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                          Sold
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setArtworkModalBeat(beat)}
                          title="Change Artwork"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-gray-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-lg transition-colors text-[11px] font-bold border border-white/[0.08]"
                        >
                          <ImageIcon className="h-3.5 w-3.5 text-gray-400" />
                          <span className="hidden sm:inline">Artwork</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBeat(beat.id, beat.title)}
                          disabled={deletingId === beat.id}
                          title="Delete Track"
                          className="p-1.5 text-gray-500 hover:text-[#e53935] hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-24 text-center space-y-3 px-4">
            <UploadCloud className="h-12 w-12 text-gray-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Your Beat Catalog is Empty</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
              You haven&apos;t uploaded any beats yet. Click below to publish your first instrumental to Caution Studio and start earning 80% on every sale and monthly streaming royalties.
            </p>
            <div className="pt-3">
              <Link
                href="/beats/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e53935] hover:bg-[#d32f2f] text-white text-xs font-bold transition-all shadow-md shadow-[#e53935]/25"
              >
                <Upload className="h-4 w-4 stroke-[2.5]" />
                <span>Upload First Beat</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modal for updating beat artwork */}
      <UpdateArtworkModal
        beat={artworkModalBeat}
        isOpen={Boolean(artworkModalBeat)}
        onClose={() => setArtworkModalBeat(null)}
        onSuccess={(beatId, newCoverUrl) => {
          setBeatsList((prev) =>
            prev.map((b) => (b.id === beatId ? { ...b, coverUrl: newCoverUrl } : b))
          );
        }}
      />
    </CreatorShell>
  );
}
