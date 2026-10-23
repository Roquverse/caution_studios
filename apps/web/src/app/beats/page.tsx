'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { BeatStoreTable } from '../../components/marketplace/BeatStoreTable';
import { GetBeatPriceModal } from '../../components/marketplace/GetBeatPriceModal';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import { SEEDED_BEATS } from '../../lib/seedBeats';
import { Beat } from '@caution/types';
import { CREATOR_URL, APP_URL, AUTH_LOGIN_URL } from '../../lib/urls';
import { supabase } from '../../lib/supabaseClient';
import {
  Search,
  ChevronDown,
  Sparkles,
  Music2,
  X,
  SlidersHorizontal,
  Flame,
  ArrowUpDown,
  CheckCircle2,
  ShieldCheck,
  Headphones,
  Upload,
  Crown,
  Zap,
  Info,
  Layers,
  Radio,
  Mic,
  ArrowRight,
  ExternalLink,
  LayoutDashboard
} from 'lucide-react';
import { SoundstageModal } from '../../components/studio/SoundstageModal';

export default function BeatsPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#07090E]" />}>
      <BeatsContent />
    </React.Suspense>
  );
}

function BeatsContent() {
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get('genre') || 'All Genres';
  const initialQuery = searchParams.get('q') || '';
  const initialSectionParam = searchParams.get('section');
  const validSection =
    initialSectionParam === 'free' || initialSectionParam === 'premium' || initialSectionParam === 'exclusive'
      ? initialSectionParam
      : 'all';

  const [beatsList, setBeatsList] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<'all' | 'free' | 'premium' | 'exclusive'>(validSection);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedBpmRange, setSelectedBpmRange] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'bpm'>('popular');
  const [isSoundstageOpen, setIsSoundstageOpen] = useState(false);
  const [soundstageBeat, setSoundstageBeat] = useState<Beat | null>(null);

  // If user is logged in, redirect directly to the App Dashboard marketplace
  useEffect(() => {
    async function checkAuthAndRedirect() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const search = typeof window !== 'undefined' ? window.location.search : '';
          const target = `${APP_URL}?tab=marketplace${search ? '&' + search.replace(/^\?/, '') : ''}`;
          window.location.replace(target);
        }
      } catch (e) {
        // Fallback to guest preview
      }
    }
    checkAuthAndRedirect();
  }, []);

  // Fetch real beats from /api/beats
  useEffect(() => {
    let isMounted = true;
    async function fetchRealBeats() {
      try {
        const res = await fetch('/api/beats', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.beats) && data.beats.length > 0 && isMounted) {
            setBeatsList(data.beats);
          } else if (isMounted) {
            setBeatsList(SEEDED_BEATS);
          }
        } else if (isMounted) {
          setBeatsList(SEEDED_BEATS);
        }
      } catch (err) {
        console.warn('Failed to fetch real beats from database:', err);
        if (isMounted) setBeatsList(SEEDED_BEATS);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchRealBeats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dropdown open states
  const [bpmDropdownOpen, setBpmDropdownOpen] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Price Tag Pop-Up state (Spec: "once they click get beat the price tag go pop up")
  const [priceModalBeat, setPriceModalBeat] = useState<Beat | null>(null);

  // Visible items limit for "Load More"
  const [visibleCount, setVisibleCount] = useState<number>(15);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    beatsList.forEach((b) => b.tags?.forEach((t) => set.add(t)));
    return ['All', ...Array.from(set)];
  }, [beatsList]);

  // Extract all unique genres dynamically from loaded beats
  const genreList = useMemo(() => {
    const set = new Set<string>();
    beatsList.forEach((b) => {
      if (b.genre) set.add(b.genre);
    });
    if (set.size === 0) {
      ['Afrobeats', 'Electronic', 'Amapiano', 'Trap', 'Drill', 'R&B'].forEach((g) => set.add(g));
    }
    return ['All Genres', ...Array.from(set)];
  }, [beatsList]);

  // Filter beats
  const filteredBeats = useMemo(() => {
    return beatsList.filter((beat) => {
      // 0. Section Filter (Free vs Premium vs Exclusive vs All)
      if (selectedSection === 'free') {
        const hasBasic = beat.licenses?.some((l) => l.type === 'basic' && l.enabled !== false);
        if (!hasBasic) return false;
      }
      if (selectedSection === 'premium') {
        const hasPremium = beat.licenses?.some((l) => l.type === 'premium' && l.enabled !== false);
        if (!hasPremium) return false;
      }
      if (selectedSection === 'exclusive') {
        const hasExclusive = beat.licenses?.some((l) => l.type === 'exclusive' && l.enabled !== false);
        if (!hasExclusive || beat.status === 'sold') return false;
      }

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = beat.title.toLowerCase().includes(q);
        const matchesProducer = beat.producer?.display_name?.toLowerCase().includes(q);
        const matchesGenre = beat.genre.toLowerCase().includes(q);
        const matchesTags = beat.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesProducer && !matchesGenre && !matchesTags) return false;
      }

      // 2. Genre Filter
      if (selectedGenre !== 'All Genres') {
        if (beat.genre.toLowerCase() !== selectedGenre.toLowerCase()) return false;
      }

      // 3. BPM Range Filter
      if (selectedBpmRange !== 'All') {
        const bpm = beat.bpm || 120;
        if (selectedBpmRange === '< 100' && bpm >= 100) return false;
        if (selectedBpmRange === '100 - 120' && (bpm < 100 || bpm > 120)) return false;
        if (selectedBpmRange === '120 - 140' && (bpm < 120 || bpm > 140)) return false;
        if (selectedBpmRange === '140+' && bpm < 140) return false;
      }

      // 4. Tag Filter
      if (selectedTag !== 'All') {
        if (!beat.tags?.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'bpm') {
        return (b.bpm || 0) - (a.bpm || 0);
      }
      return b.play_count - a.play_count;
    });
  }, [beatsList, selectedSection, searchQuery, selectedGenre, selectedBpmRange, selectedTag, sortBy]);

  // Group beats by genre for organized presentation
  const groupedByGenre = useMemo(() => {
    const groups: Record<string, Beat[]> = {};
    filteredBeats.forEach((beat) => {
      const g = beat.genre || 'Other';
      if (!groups[g]) groups[g] = [];
      groups[g].push(beat);
    });
    return groups;
  }, [filteredBeats]);

  const activeGenreKeys = Object.keys(groupedByGenre);

  // Counts per tier
  const freeCount = beatsList.filter((b) => b.licenses?.some((l) => l.type === 'basic' && l.enabled !== false)).length;
  const premiumCount = beatsList.filter((b) => b.licenses?.some((l) => l.type === 'premium' && l.enabled !== false)).length;
  const exclusiveCount = beatsList.filter((b) => b.licenses?.some((l) => l.type === 'exclusive' && l.enabled !== false && b.status !== 'sold')).length;

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col pb-28">
      <TopNav />

      {/* 1. Top Promo Announcement Strip: Royalties & Free Studio Support */}
      <div className="w-full bg-gradient-to-r from-[#E8B896] via-[#f5d0b5] to-[#E8B896] text-black py-2.5 px-4 text-center font-black tracking-wider text-xs uppercase flex items-center justify-center gap-2 shadow-sm flex-wrap">
        <Flame className="h-4 w-4 fill-black shrink-0 animate-pulse" />
        <span className="font-extrabold tracking-tight sm:tracking-wider">
          PRODUCERS: EARN ₦30,000 ROYALTIES PER 10,000 DOWNLOADS ON EACH BEAT
        </span>
        <span className="hidden md:inline opacity-40">•</span>
        <span className="hidden md:inline font-bold">
          ARTISTS: GET FREE STUDIO SESSIONS &amp; DEVELOPMENT SUPPORT FROM CAUTION STUDIOZ
        </span>
        <span className="hidden lg:inline opacity-40">•</span>
        <span className="hidden lg:inline font-bold text-neutral-900">
          BUY 2 BEATS, GET 1 FREE ACTIVE
        </span>
        <Flame className="h-4 w-4 fill-black shrink-0 animate-pulse" />
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* App Dashboard Migration Notice & CTA */}
        <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#0B1516] via-[#101D1E] to-[#0D161C] border border-[#2dd4bf]/35 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#04564f]/40 border border-[#2dd4bf]/40 flex items-center justify-center text-[#2dd4bf] shrink-0">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2dd4bf]">App Dashboard</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/30">Full Catalog &amp; Licenses</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-1">
                The Beat Store has moved inside your App Dashboard
              </h2>
              <p className="text-xs text-neutral-300 mt-0.5 max-w-xl">
                Open your App Dashboard to stream high-definition tracks, download free beats, purchase stems, and collaborate with producers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <a
              href={`${APP_URL}?tab=marketplace`}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#04564f]/40 border border-[#2dd4bf]/30"
            >
              <span>Open In Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#2dd4bf]" />
            </a>
            <a
              href={`${AUTH_LOGIN_URL}?redirect=${encodeURIComponent(`${APP_URL}?tab=marketplace`)}`}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-semibold transition-colors"
            >
              <span>Sign In</span>
            </a>
          </div>
        </div>

        {/* 2. Main Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 mb-3">
            <Radio className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
            <span>Official Caution Studio Beat Store</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#E8B896] tracking-tight">
            Instrumental Beats Catalog
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed">
            Browse Afrobeats, Amapiano, Trap & Drill instrumentals. Stream free or license studio-grade WAV masters and exclusive rights.
          </p>

          {/* 3. Prominent Category Section Tabs (Free Beats vs Premium vs Exclusive vs All) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-[#0F131C] border border-white/10 max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => setSelectedSection('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedSection === 'all'
                  ? 'bg-[#E8B896] text-black shadow-md shadow-[#E8B896]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All Beats</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedSection === 'all' ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'}`}>
                {beatsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSection('free')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedSection === 'free'
                  ? 'bg-teal-400 text-black shadow-md shadow-teal-400/20'
                  : 'text-teal-400 hover:text-teal-300 hover:bg-teal-400/10'
              }`}
            >
              <Headphones className="h-3.5 w-3.5" />
              <span>Free Beats</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedSection === 'free' ? 'bg-black/20 text-black' : 'bg-teal-400/20 text-teal-300'}`}>
                {freeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSection('premium')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedSection === 'premium'
                  ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Premium (WAV+Stems)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedSection === 'premium' ? 'bg-black/20 text-black' : 'bg-amber-400/20 text-amber-300'}`}>
                {premiumCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSection('exclusive')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedSection === 'exclusive'
                  ? 'bg-purple-400 text-black shadow-md shadow-purple-400/20'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-purple-400/10'
              }`}
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Exclusive (1-of-1)</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${selectedSection === 'exclusive' ? 'bg-black/20 text-black' : 'bg-purple-400/20 text-purple-300'}`}>
                {exclusiveCount}
              </span>
            </button>
          </div>

          {/* 4. Filter Pill Dropdowns (BPM, Tag, Sort) */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {/* BPM Filter Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setBpmDropdownOpen(!bpmDropdownOpen);
                  setTagDropdownOpen(false);
                  setSortDropdownOpen(false);
                }}
                className={`h-9 px-4 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  selectedBpmRange !== 'All'
                    ? 'bg-[#E8B896] text-black'
                    : 'bg-[#151A24] border border-white/10 hover:border-white/20 text-gray-300'
                }`}
              >
                <span>{selectedBpmRange === 'All' ? 'All BPMs' : `${selectedBpmRange} BPM`}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {bpmDropdownOpen && (
                <div className="absolute top-11 left-0 z-40 w-44 rounded-xl bg-[#0F131C] border border-white/10 shadow-2xl p-1.5 text-xs animate-in fade-in">
                  {['All', '< 100', '100 - 120', '120 - 140', '140+'].map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => {
                        setSelectedBpmRange(range);
                        setBpmDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                        selectedBpmRange === range
                          ? 'bg-[#E8B896] text-black font-bold'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {range === 'All' ? 'All BPMs' : `${range} BPM`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tags Filter Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setTagDropdownOpen(!tagDropdownOpen);
                  setBpmDropdownOpen(false);
                  setSortDropdownOpen(false);
                }}
                className={`h-9 px-4 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  selectedTag !== 'All'
                    ? 'bg-[#E8B896] text-black'
                    : 'bg-[#151A24] border border-white/10 hover:border-white/20 text-gray-300'
                }`}
              >
                <span>{selectedTag === 'All' ? 'All Tags' : selectedTag}</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {tagDropdownOpen && (
                <div className="absolute top-11 left-0 z-40 w-48 max-h-60 overflow-y-auto rounded-xl bg-[#0F131C] border border-white/10 shadow-2xl p-1.5 text-xs animate-in fade-in no-scrollbar">
                  {allTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSelectedTag(t);
                        setTagDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors truncate ${
                        selectedTag === t
                          ? 'bg-[#E8B896] text-black font-bold'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {t === 'All' ? 'All Tags' : t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setSortDropdownOpen(!sortDropdownOpen);
                  setBpmDropdownOpen(false);
                  setTagDropdownOpen(false);
                }}
                className="h-9 px-4 rounded-full bg-[#151A24] border border-white/10 hover:border-white/20 text-gray-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>
                  {sortBy === 'popular'
                    ? 'Sort by: Most Popular'
                    : sortBy === 'newest'
                    ? 'Sort by: Newest'
                    : 'Sort by: BPM (High to Low)'}
                </span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {sortDropdownOpen && (
                <div className="absolute top-11 right-0 z-40 w-48 rounded-xl bg-[#0F131C] border border-white/10 shadow-2xl p-1.5 text-xs animate-in fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('popular');
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                      sortBy === 'popular'
                        ? 'bg-[#E8B896] text-black font-bold'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    Most Popular
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('newest');
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                      sortBy === 'newest'
                        ? 'bg-[#E8B896] text-black font-bold'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    Newest Releases
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('bpm');
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                      sortBy === 'bpm'
                        ? 'bg-[#E8B896] text-black font-bold'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    BPM (High to Low)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. Dynamic Section Explanation Banner */}
        {selectedSection === 'free' && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-teal-950/60 via-[#0F131C] to-teal-950/40 border border-teal-500/30 p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[11px] font-bold uppercase tracking-wider">
                  <Headphones className="h-3 w-3" />
                  <span>Free Beat Section · ₦30,000 Royalty Milestone &amp; Free Studio Sponsorship</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Earn ₦30,000 Per 10k Downloads &amp; Get Free Studio Sponsorship
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  <strong className="text-teal-300">For Producers:</strong> Make your beats available for free commercial streaming and downloads. Caution Studio pays an automated <span className="text-teal-300 font-bold">₦30,000 royalty payout per 10,000 qualifying downloads</span> for each beat in this section.
                </p>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  <strong className="text-teal-300">For Upcoming Artists:</strong> Stream any free beat and record your vocal ideas in our in-browser <span className="text-teal-300 font-bold">Caution Soundstage</span>. Export high-quality audio for TikTok and Instagram Reels, and submit your take directly to Caution Studioz. We pick talented artists to receive <span className="text-teal-300 font-bold">Free Full Studio Sessions, Vocal Mixing, and Artist Development Support</span>!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSoundstageBeat(beatsList.find((b) => b.is_free_stream_enabled !== false) || null);
                    setIsSoundstageOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-black text-xs font-black text-center flex items-center justify-center gap-1.5 shadow-lg shadow-teal-400/20 transition-all hover:scale-105"
                >
                  <Mic className="h-4 w-4" />
                  <span>Open Soundstage Recorder</span>
                </button>
                <a
                  href={`${CREATOR_URL}/beats/upload`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 border border-white/10 transition-all"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Free Beat</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'premium' && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-amber-950/60 via-[#0F131C] to-amber-950/40 border border-amber-500/30 p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                  <Zap className="h-3 w-3" />
                  <span>Premium Beat Section · Commercial Licensing (₦30,000)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  WAV Masters & Separated Trackout Stems (.ZIP)
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Non-exclusive commercial licenses designed for recording artists releasing on Spotify, Apple Music, radio, and music videos. Instant download includes uncompressed 24-bit studio WAV and individual instrument stem files for mixing and vocal arrangement.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-gray-400 block">Standard License</span>
                <span className="text-2xl font-black text-amber-400">₦30,000</span>
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'exclusive' && (
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-purple-950/60 via-[#0F131C] to-purple-950/40 border border-purple-500/30 p-5 sm:p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-bold uppercase tracking-wider">
                  <Crown className="h-3 w-3" />
                  <span>Exclusive Beat Section · 100% Sole Ownership Buyout</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  1-of-1 Sole Master Ownership Rights (₦100,000+)
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  When you buy an exclusive beat, you obtain 100% sole master and publishing rights. The beat is immediately marked <span className="text-red-400 font-bold uppercase">Sold</span> and permanently retired from Caution Studio. Nobody else can ever license or purchase it. Includes stamped transfer agreement.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-gray-400 block">Exclusive Buyout</span>
                <span className="text-2xl font-black text-purple-400">₦100,000+</span>
              </div>
            </div>
          </div>
        )}

        {/* 6. Full-Width Search Input */}
        <div className="relative mb-8 max-w-4xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search beats by title, producer, BPM, genre, or mood..."
            className="w-full h-12 pl-5 pr-12 rounded-full bg-[#11141D] border border-white/10 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#E8B896] transition-colors"
          />
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-10 pr-2 flex items-center text-gray-500 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 7. Organization by Genre Tabs */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar justify-start sm:justify-center">
          {genreList.map((genre) => {
            const isSelected = selectedGenre.toLowerCase() === genre.toLowerCase();
            const count =
              genre === 'All Genres'
                ? beatsList.length
                : beatsList.filter((b) => b.genre?.toLowerCase() === genre.toLowerCase()).length;

            return (
              <button
                key={genre}
                type="button"
                onClick={() => setSelectedGenre(genre)}
                className={`h-8 px-4 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#E8B896] text-black shadow-md shadow-[#E8B896]/15'
                    : 'bg-[#151A24] text-gray-400 hover:text-white border border-white/5 hover:border-white/20'
                }`}
              >
                <span>{genre}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 8. Beats Table Layout - Grouped by Genre or Filtered */}
        {isLoading && beatsList.length === 0 ? (
          <div className="space-y-4 animate-pulse max-w-5xl mx-auto py-8">
            <div className="h-6 bg-white/10 rounded w-44 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/5 flex items-center px-4 gap-4">
                  <div className="w-11 h-11 rounded-lg bg-white/10 shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-white/10 rounded w-1/3" />
                    <div className="h-3 bg-white/5 rounded w-1/4" />
                  </div>
                  <div className="h-6 w-24 bg-white/10 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredBeats.length === 0 ? (
          <div className="py-20 text-center space-y-3 rounded-2xl bg-[#0F131C] border border-white/10 max-w-lg mx-auto">
            <Music2 className="h-10 w-10 text-gray-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No beats found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              No beats match your current section or filters. Reset filters to see the full catalog.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedSection('all');
                setSearchQuery('');
                setSelectedGenre('All Genres');
                setSelectedBpmRange('All');
                setSelectedTag('All');
              }}
              className="mt-2 h-9 px-4 rounded-full bg-[#E8B896] text-black text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : selectedGenre === 'All Genres' && !searchQuery ? (
          /* Organized By Genre Sections */
          <div className="space-y-6">
            {activeGenreKeys.map((genreKey) => (
              <BeatStoreTable
                key={genreKey}
                genreTitle={`${genreKey} Beats`}
                beats={groupedByGenre[genreKey]}
                onGetBeat={(beat) => setPriceModalBeat(beat)}
              />
            ))}
          </div>
        ) : (
          /* Filtered Flat Table */
          <BeatStoreTable
            genreTitle={selectedGenre !== 'All Genres' ? `${selectedGenre} Beats` : undefined}
            beats={filteredBeats.slice(0, visibleCount)}
            onGetBeat={(beat) => setPriceModalBeat(beat)}
          />
        )}

        {/* 9. Load More Button */}
        {filteredBeats.length > visibleCount && selectedGenre !== 'All Genres' && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="px-6 py-2.5 rounded-full bg-[#E8B896] hover:bg-[#d8a886] text-black text-xs font-black transition-transform hover:scale-105 flex items-center gap-1.5 shadow-lg"
            >
              <span>Load More Beats</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

      <HomeFooter />
      <CartDrawer />
      <NowPlayingPanel />

      {/* 10. Price Tag Pop-Up Modal (Spec: "once they click get beat the price tag go pop up") */}
      <GetBeatPriceModal
        beat={priceModalBeat}
        isOpen={Boolean(priceModalBeat)}
        onClose={() => setPriceModalBeat(null)}
      />

      {/* 11. Caution Soundstage Studio Modal */}
      <SoundstageModal
        isOpen={isSoundstageOpen}
        onClose={() => setIsSoundstageOpen(false)}
        preselectedBeat={soundstageBeat}
      />
    </div>
  );
}
