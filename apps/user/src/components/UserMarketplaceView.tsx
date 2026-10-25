'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TrackItem } from '../types/tracks';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Play,
  Pause,
  Heart,
  Clock,
  Download,
  ShoppingBag,
  Sparkles,
  Music2,
  X,
  Layers,
  Crown,
  Zap,
  Headphones,
  ShieldCheck,
  Check,
  ExternalLink,
  Flame,
  CheckCircle2,
  Mic,
  Gift
} from 'lucide-react';

export function isFreeBeat(track: TrackItem): boolean {
  if (track.isFree) return true;
  if (track.priceNgn === 0) return true;
  if (track.category === 'free') return true;
  if (
    Array.isArray(track.tags) &&
    track.tags.some((t) => t.toLowerCase() === 'free' || t.toLowerCase() === 'free download')
  ) {
    return true;
  }
  if (
    track.title &&
    (track.title.toLowerCase().includes('(free)') || track.title.toLowerCase().includes('[free]'))
  ) {
    return true;
  }
  return false;
}

function formatPriceBadge(val: number): string {
  if (val >= 1000000) return `₦${(val / 1000000).toFixed(1)}m`;
  if (val >= 1000) return `₦${Math.round(val / 1000)}k`;
  return `₦${val}`;
}

interface UserMarketplaceViewProps {
  tracks: TrackItem[];
  currentTrack: TrackItem;
  isPlaying: boolean;
  handlePlayToggle: (track: TrackItem) => void;
  likedTrackIds: string[];
  toggleLike: (trackId: string) => void;
  listenLaterIds: string[];
  toggleListenLater: (track: TrackItem) => void;
  handleDownload: (track: TrackItem, e: React.MouseEvent) => void;
  downloadingId?: string | null;
  onOpenSoundstage?: (track: TrackItem) => void;
  onTriggerAd?: () => void;
  bonusDownloads?: number;
  remainingDownloads?: number;
}

const GENRE_LIST = ['All Genres', 'Afrobeats', 'Amapiano', 'Trap', 'Drill', 'R&B', 'Electronic', 'Cinematic'];

export function UserMarketplaceView({
  tracks,
  currentTrack,
  isPlaying,
  handlePlayToggle,
  likedTrackIds,
  toggleLike,
  listenLaterIds,
  toggleListenLater,
  handleDownload,
  downloadingId,
  onOpenSoundstage,
  onTriggerAd,
  bonusDownloads = 0,
  remainingDownloads
}: UserMarketplaceViewProps) {
  const [selectedSection, setSelectedSection] = useState<'all' | 'free' | 'premium' | 'exclusive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [selectedBpmRange, setSelectedBpmRange] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'bpm'>('popular');

  // License dropdown selection per beat: 'standard' vs 'exclusive'
  const [selectedTiers, setSelectedTiers] = useState<Record<string, 'standard' | 'exclusive'>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Read URL query params on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      const filter = params.get('filter') || params.get('section');
      const genre = params.get('genre');
      if (q) setSearchQuery(q);
      if (filter && ['free', 'premium', 'exclusive', 'all'].includes(filter.toLowerCase())) {
        setSelectedSection(filter.toLowerCase() as any);
      }
      if (genre) setSelectedGenre(genre);
    }
  }, []);

  // License Modal State
  const [licenseModalTrack, setLicenseModalTrack] = useState<TrackItem | null>(null);
  const [selectedTier, setSelectedTier] = useState<'basic' | 'premium' | 'exclusive'>('basic');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  // Close open dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenDropdownId(null);
    };
    if (openDropdownId) {
      window.addEventListener('click', handleOutsideClick);
      return () => window.removeEventListener('click', handleOutsideClick);
    }
  }, [openDropdownId]);

  // Filter beats
  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      const isFree = isFreeBeat(track);

      // 0. Section Filter
      if (selectedSection === 'free') {
        if (!isFree) return false;
      }
      if (selectedSection === 'exclusive') {
        if (isFree) return false;
      }
      if (selectedSection === 'premium') {
        if (isFree) return false;
      }

      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = track.title.toLowerCase().includes(q);
        const matchesArtist = track.artist.toLowerCase().includes(q);
        const matchesGenre = (track.genre || '').toLowerCase().includes(q);
        const matchesTags = (track.tags || []).some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesArtist && !matchesGenre && !matchesTags) return false;
      }

      // 2. Genre Filter
      if (selectedGenre !== 'All Genres') {
        if ((track.genre || '').toLowerCase() !== selectedGenre.toLowerCase()) return false;
      }

      // 3. BPM Range Filter
      if (selectedBpmRange !== 'All') {
        const bpm = track.bpm || 120;
        if (selectedBpmRange === '< 100' && bpm >= 100) return false;
        if (selectedBpmRange === '100 - 120' && (bpm < 100 || bpm > 120)) return false;
        if (selectedBpmRange === '120 - 140' && (bpm < 120 || bpm > 140)) return false;
        if (selectedBpmRange === '140+' && bpm < 140) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return (b.id > a.id ? 1 : -1);
      }
      if (sortBy === 'bpm') {
        return (b.bpm || 0) - (a.bpm || 0);
      }
      return (b.playCount || 0) - (a.playCount || 0);
    });
  }, [tracks, selectedSection, searchQuery, selectedGenre, selectedBpmRange, sortBy]);

  const handleCheckout = () => {
    setPurchaseSuccess(true);
    setTimeout(() => {
      setPurchaseSuccess(false);
      setLicenseModalTrack(null);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-[#1A1325] via-[#10121A] to-[#0A0D14] border border-white/10 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-80 h-80 bg-[#E8B896]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#E8B896]">
            <Sparkles className="h-3.5 w-3.5 text-[#E8B896]" />
            <span>Caution Marketplace · Direct License Store</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Discover & License World-Class Beats
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Free streamable beats, commercial standard leases, and sole exclusive buyouts.
            Stream artist spotlight songs through ads to unlock bonus daily downloads.
          </p>
        </div>
      </div>

      {/* 2. Daily Download Quota & Ad Reward Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-teal-500/15 via-[#0F131C] to-amber-500/10 border border-teal-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0 text-teal-300 shadow-sm">
            <Gift className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 font-bold text-white">
              <span>Daily Beat Downloads</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30">
                {remainingDownloads !== undefined ? `${remainingDownloads} remaining today` : '2 available today'}
              </span>
              {bonusDownloads > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" />
                  +{bonusDownloads} bonus from ads
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Stream artist songs through ads to earn <strong>+1 bonus beat download</strong> for the day whenever you want more beats!
            </p>
          </div>
        </div>

        {onTriggerAd && (
          <button
            type="button"
            onClick={onTriggerAd}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 transition-transform hover:scale-105 shadow-md shadow-[#2dd4bf]/20 shrink-0 cursor-pointer"
          >
            <Headphones className="h-3.5 w-3.5" />
            <span>Stream Artist Song (+1 Download)</span>
          </button>
        )}
      </div>

      {/* 3. Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-white/[0.08]">
        <button
          type="button"
          onClick={() => setSelectedSection('all')}
          className={`h-9 px-4 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            selectedSection === 'all'
              ? 'bg-white/10 text-white border-b-2 border-[#E8B896]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Music2 className="h-3.5 w-3.5" />
          <span>All Beats</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSection('free')}
          className={`h-9 px-4 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            selectedSection === 'free'
              ? 'bg-emerald-500/10 text-emerald-300 border-b-2 border-emerald-400'
              : 'text-emerald-400/70 hover:text-emerald-300'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Free Beats</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
            FREE
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSection('premium')}
          className={`h-9 px-4 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            selectedSection === 'premium'
              ? 'bg-amber-500/10 text-amber-300 border-b-2 border-amber-400'
              : 'text-amber-400/70 hover:text-amber-300'
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>Standard / Leases</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedSection('exclusive')}
          className={`h-9 px-4 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            selectedSection === 'exclusive'
              ? 'bg-purple-500/10 text-purple-300 border-b-2 border-purple-400'
              : 'text-purple-400/70 hover:text-purple-300'
          }`}
        >
          <Crown className="h-3.5 w-3.5" />
          <span>Exclusive Buyouts</span>
        </button>
      </div>

      {/* 4. Search and Filters */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search beats by title, producer, genre, or mood..."
            className="w-full h-10 pl-10 pr-9 rounded-xl bg-[#141518] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#E8B896] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* BPM Filter */}
        <select
          value={selectedBpmRange}
          onChange={(e) => setSelectedBpmRange(e.target.value)}
          aria-label="Filter beats by BPM tempo"
          className="h-10 px-3 rounded-xl bg-[#141518] border border-white/[0.08] text-xs text-gray-300 focus:outline-none focus:border-[#E8B896] w-full md:w-36"
        >
          <option value="All">All BPMs</option>
          <option value="< 100">&lt; 100 BPM</option>
          <option value="100 - 120">100 - 120 BPM</option>
          <option value="120 - 140">120 - 140 BPM</option>
          <option value="140+">140+ BPM</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          aria-label="Sort beats catalog"
          className="h-10 px-3 rounded-xl bg-[#141518] border border-white/[0.08] text-xs text-gray-300 focus:outline-none focus:border-[#E8B896] w-full md:w-36"
        >
          <option value="popular">Most Popular</option>
          <option value="newest">Newest First</option>
          <option value="bpm">BPM Tempo</option>
        </select>
      </div>

      {/* 5. Genre Horizontal Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {GENRE_LIST.map((genre) => {
          const isSelected = selectedGenre.toLowerCase() === genre.toLowerCase();
          return (
            <button
              key={genre}
              type="button"
              onClick={() => setSelectedGenre(genre)}
              className={`h-8 px-3.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                isSelected
                  ? 'bg-[#E8B896] text-black font-bold shadow-md shadow-[#E8B896]/15'
                  : 'bg-[#141518] text-gray-400 hover:text-white border border-white/[0.06]'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>

      {/* 6. Beats Table Layout */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-3">
        <div className="hidden sm:flex items-center justify-between px-3 text-[11px] font-mono uppercase tracking-wider text-gray-500 pb-1 border-b border-white/[0.04]">
          <div className="w-72">Track / Producer</div>
          <div className="w-28 text-left">BPM / Key</div>
          <div className="w-24 text-left">Genre</div>
          <div className="w-44 text-left">License Tiers</div>
          <div className="w-48 text-right">Get Beat & Options</div>
        </div>

        {filteredTracks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Music2 className="h-10 w-10 text-gray-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No beats found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Try adjusting your search query, BPM range, or genre filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedSection('all');
                setSearchQuery('');
                setSelectedGenre('All Genres');
                setSelectedBpmRange('All');
              }}
              className="px-4 py-2 rounded-lg bg-[#E8B896] text-black text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTracks.map((row) => {
              const isThisPlaying = isPlaying && currentTrack.id === row.id;
              const isLiked = likedTrackIds.includes(row.id);
              const isLater = listenLaterIds.includes(row.id);
              const isFree = isFreeBeat(row);

              // License tier choice for priced beat
              const activeTier = selectedTiers[row.id] || 'standard';
              const standardPrice = row.priceNgn && row.priceNgn > 0 ? row.priceNgn : 3000;
              const exclusivePrice = row.exclusivePriceNgn && row.exclusivePriceNgn > 0 ? row.exclusivePriceNgn : 50000;
              const isDropdownOpen = openDropdownId === row.id;

              return (
                <div
                  key={'marketplace-' + row.id}
                  onClick={() => handlePlayToggle(row)}
                  className={`relative flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-all cursor-pointer group ${
                    isDropdownOpen ? 'z-30 border-white/20 bg-white/[0.04]' : 'z-10'
                  }`}
                >
                  {/* Track & Producer */}
                  <div className="flex items-center gap-3.5 min-w-0 w-72">
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                      <img
                        src={row.coverUrl}
                        alt={row.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className={`absolute inset-0 flex items-center justify-center transition-colors ${
                        isThisPlaying ? 'bg-black/60' : 'bg-black/30 group-hover:bg-black/50'
                      }`}>
                        {isThisPlaying ? (
                          <Pause className="h-4 w-4 text-[#2dd4bf] fill-current" />
                        ) : (
                          <Play className="h-4 w-4 text-white fill-current ml-0.5 opacity-80 group-hover:opacity-100" />
                        )}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isThisPlaying ? 'text-[#E8B896]' : 'text-white'}`}>
                        {row.title}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
                        <span>{row.artist}</span>
                        <ShieldCheck className="h-3 w-3 text-teal-400 inline shrink-0" />
                      </p>
                    </div>
                  </div>

                  {/* BPM / Key */}
                  <div className="hidden sm:block text-xs font-mono text-gray-300 w-28 truncate">
                    <div>{row.bpm || 110} BPM</div>
                    <div className="text-[10px] text-gray-500">{row.musicalKey || 'C Minor'}</div>
                  </div>

                  {/* Genre */}
                  <div className="hidden sm:block text-xs text-gray-300 w-24 truncate">
                    <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono">
                      {row.genre || 'Afrobeats'}
                    </span>
                  </div>

                  {/* License Tiers Column */}
                  <div className="hidden sm:flex items-center w-44">
                    {isFree ? (
                      /* Free Beat: Displays ONLY Free Badge */
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Free</span>
                      </span>
                    ) : (
                      /* Beat with Price Tag: Dropdown selector between Standard and Exclusive */
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(isDropdownOpen ? null : row.id);
                          }}
                          title="Select License: Standard or Exclusive"
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center justify-between gap-1.5 transition-all shadow-sm cursor-pointer min-w-[135px] max-w-[155px] ${
                            activeTier === 'exclusive'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {activeTier === 'exclusive' ? (
                              <Crown className="h-3 w-3 text-purple-400 shrink-0" />
                            ) : (
                              <ShieldCheck className="h-3 w-3 text-amber-400 shrink-0" />
                            )}
                            <span className="truncate">
                              {activeTier === 'exclusive' ? 'Exclusive' : 'Standard'}
                            </span>
                            <span className="text-[10px] opacity-80 font-mono">
                              · {formatPriceBadge(activeTier === 'exclusive' ? exclusivePrice : standardPrice)}
                            </span>
                          </div>
                          <ChevronDown
                            className={`h-3 w-3 shrink-0 text-gray-400 transition-transform duration-200 ${
                              isDropdownOpen ? 'rotate-180 text-white' : ''
                            }`}
                          />
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                          <div
                            className="absolute top-full left-0 mt-1.5 w-60 p-1.5 rounded-xl bg-[#0F131C] border border-white/10 shadow-2xl z-50 text-white animate-in fade-in zoom-in-95 duration-150"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-gray-400 border-b border-white/5 mb-1">
                              Choose License Tier
                            </div>

                            {/* Standard Option */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTiers((prev) => ({ ...prev, [row.id]: 'standard' }));
                                setOpenDropdownId(null);
                              }}
                              className={`w-full p-2 rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                                activeTier === 'standard'
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : 'hover:bg-white/5 text-gray-300'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                                  <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                  <span>Standard Lease</span>
                                  {activeTier === 'standard' && (
                                    <Check className="h-3 w-3 text-amber-400 ml-auto" />
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                                  Commercial MP3/WAV Master
                                </div>
                              </div>
                              <span className="text-xs font-black text-amber-300 font-mono shrink-0">
                                ₦{standardPrice.toLocaleString()}
                              </span>
                            </button>

                            {/* Exclusive Option */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTiers((prev) => ({ ...prev, [row.id]: 'exclusive' }));
                                setOpenDropdownId(null);
                              }}
                              className={`w-full p-2 mt-1 rounded-lg text-left transition-colors flex items-center justify-between cursor-pointer ${
                                activeTier === 'exclusive'
                                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                  : 'hover:bg-white/5 text-gray-300'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                                  <Crown className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                                  <span>Exclusive (1-of-1)</span>
                                  {activeTier === 'exclusive' && (
                                    <Check className="h-3 w-3 text-purple-400 ml-auto" />
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                                  Sole Ownership · Retired from Store
                                </div>
                              </div>
                              <span className="text-xs font-black text-purple-300 font-mono shrink-0">
                                ₦{exclusivePrice.toLocaleString()}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions & "Get Beat" */}
                  <div className="flex items-center gap-2 shrink-0 w-48 justify-end">
                    {/* Favorite */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(row.id);
                      }}
                      title="Add to Favourites"
                      className={`p-1.5 rounded-full transition-colors ${
                        isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-red-500' : ''}`} />
                    </button>

                    {/* Listen Later */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleListenLater(row);
                      }}
                      title="Listen Later"
                      className={`p-1.5 rounded-full transition-colors ${
                        isLater ? 'text-[#2dd4bf]' : 'text-gray-500 hover:text-[#2dd4bf]'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                    </button>

                    {/* Download button */}
                    <button
                      type="button"
                      onClick={(e) => handleDownload(row, e)}
                      title="Download Track"
                      className={`p-1.5 rounded-full transition-colors ${
                        downloadingId === row.id ? 'text-[#2dd4bf] bg-[#2dd4bf]/10 animate-pulse' : 'text-gray-500 hover:text-white'
                      }`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>

                    {/* Record Vocal / Soundstage */}
                    {onOpenSoundstage && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSoundstage(row);
                        }}
                        title="Record your vocals directly over this beat"
                        className="px-2.5 py-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Mic className="h-3 w-3 text-teal-400" />
                        <span className="hidden sm:inline">Record</span>
                      </button>
                    )}

                    {/* Action Button: Free Download vs "Get Beat" with Selected Tier */}
                    {isFree ? (
                      <button
                        type="button"
                        onClick={(e) => handleDownload(row, e)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-transform hover:scale-105 shadow-sm cursor-pointer"
                      >
                        <Download className="h-3 w-3 stroke-[2.5]" />
                        <span>Free Beat</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTier(activeTier === 'exclusive' ? 'exclusive' : 'basic');
                          setLicenseModalTrack(row);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-transform hover:scale-105 shadow-sm cursor-pointer ${
                          activeTier === 'exclusive'
                            ? 'bg-purple-500 hover:bg-purple-400 text-white'
                            : 'bg-[#E8B896] hover:bg-[#d8a886] text-black'
                        }`}
                      >
                        <ShoppingBag className="h-3 w-3 stroke-[2.5]" />
                        <span>Get Beat</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. "Get Beat" Price Tag Pop-Up Modal */}
      {licenseModalTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-7 shadow-2xl overflow-hidden text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              type="button"
              onClick={() => setLicenseModalTrack(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Title */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#E8B896]" />
              <span className="text-[11px] font-mono font-bold text-[#E8B896] uppercase tracking-wider">
                Select License & Rights
              </span>
            </div>

            <h2 className="text-xl font-black text-white truncate">
              {licenseModalTrack.title}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Produced by {licenseModalTrack.artist} · {licenseModalTrack.bpm || 110} BPM · {licenseModalTrack.genre}
            </p>

            {/* License Tier Selector */}
            <div className="mt-5 space-y-2.5">
              {/* Basic License */}
              <div
                onClick={() => setSelectedTier('basic')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedTier === 'basic'
                    ? 'border-teal-400 bg-teal-400/10'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-white block">Standard Commercial Lease</span>
                    <span className="text-[11px] text-gray-400">MP3 & WAV Master · 50,000 Streams · 1 Commercial Music Video</span>
                  </div>
                  <span className="text-sm font-black text-teal-400">
                    ₦{(licenseModalTrack.priceNgn || 3000).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Premium License */}
              <div
                onClick={() => setSelectedTier('premium')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedTier === 'premium'
                    ? 'border-amber-400 bg-amber-400/10'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">Premium WAV + Stems</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold uppercase">
                        Most Popular
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">24-Bit WAV Master + Trackout ZIP Stems · 500,000 Streams</span>
                  </div>
                  <span className="text-sm font-black text-amber-400">
                    ₦{Math.max(15000, (licenseModalTrack.priceNgn || 3000) * 3).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Exclusive Buyout */}
              <div
                onClick={() => setSelectedTier('exclusive')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  selectedTier === 'exclusive'
                    ? 'border-purple-400 bg-purple-400/10'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-white">100% Exclusive Ownership</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-400/20 text-purple-300 font-bold uppercase">
                        Sole Buyout
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">Unlimited Streams · Sole Master Rights · Retired from Store</span>
                  </div>
                  <span className="text-sm font-black text-purple-400">
                    ₦{(licenseModalTrack.exclusivePriceNgn || 50000).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-teal-400 shrink-0 stroke-[3]" />
                <span>Instant digital delivery of audio master & stems archive</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-teal-400 shrink-0 stroke-[3]" />
                <span>Stamped Caution Studio Royalty-Free Commercial License PDF</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-teal-400 shrink-0 stroke-[3]" />
                <span>Worldwide distribution clearance across Spotify, Apple & Audiomack</span>
              </div>
            </div>

            {/* Submit Action */}
            <div className="mt-5">
              {purchaseSuccess ? (
                <div className="w-full py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>License Initialized! Producer notified & files ready.</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full py-3 rounded-xl bg-[#E8B896] hover:bg-[#d8a886] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] shadow-lg shadow-[#E8B896]/20 cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>
                    Confirm & License {selectedTier === 'basic' ? `₦${(licenseModalTrack.priceNgn || 3000).toLocaleString()}` : selectedTier === 'premium' ? `₦${Math.max(15000, (licenseModalTrack.priceNgn || 3000) * 3).toLocaleString()}` : `₦${(licenseModalTrack.exclusivePriceNgn || 50000).toLocaleString()}`}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default UserMarketplaceView;
