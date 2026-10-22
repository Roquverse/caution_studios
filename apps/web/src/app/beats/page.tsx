'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { BeatStoreTable } from '../../components/marketplace/BeatStoreTable';
import { GetBeatPriceModal } from '../../components/marketplace/GetBeatPriceModal';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import { SEEDED_BEATS } from '../../lib/seedBeats';
import { Beat } from '@caution/types';
import {
  Search,
  ChevronDown,
  Sparkles,
  Music2,
  X,
  SlidersHorizontal,
  Flame,
  ArrowUpDown
} from 'lucide-react';

export default function BeatsPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#07090E]" />}>
      <BeatsContent />
    </React.Suspense>
  );
}

const GENRE_LIST = ['All Genres', 'Afrobeats', 'Amapiano', 'Trap', 'Drill', 'R&B', 'Dancehall'];

function BeatsContent() {
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get('genre') || 'All Genres';
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [selectedBpmRange, setSelectedBpmRange] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'bpm'>('popular');

  // Dropdown open states
  const [bpmDropdownOpen, setBpmDropdownOpen] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Price Tag Pop-Up state (Spec: "once they click get beat the price tag go pop up")
  const [priceModalBeat, setPriceModalBeat] = useState<Beat | null>(null);

  // Visible items limit for "Charger plus"
  const [visibleCount, setVisibleCount] = useState<number>(15);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    SEEDED_BEATS.forEach((b) => b.tags?.forEach((t) => set.add(t)));
    return ['All', ...Array.from(set)];
  }, []);

  // Filter beats
  const filteredBeats = useMemo(() => {
    return SEEDED_BEATS.filter((beat) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = beat.title.toLowerCase().includes(q);
        const matchesProducer = beat.producer?.display_name.toLowerCase().includes(q);
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
  }, [searchQuery, selectedGenre, selectedBpmRange, selectedTag, sortBy]);

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

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col pb-28">
      <TopNav />

      {/* 1. Top Promo Announcement Strip (Matching Reference Image) */}
      <div className="w-full bg-[#E8B896] text-black py-2.5 px-4 text-center font-black tracking-wider text-xs uppercase flex items-center justify-center gap-2 shadow-sm">
        <Flame className="h-4 w-4 fill-black" />
        <span>2 instrus achetées = 1 offerte · 2 beats purchased = 1 free promo active</span>
        <Flame className="h-4 w-4 fill-black" />
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 2. Main Title & Subtitle */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#E8B896] tracking-tight">
            Mes instrus
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed">
            La liste de tous les Type Beats disponibles sur Caution Studio · Organisés par genre, tempo BPM et tags.
          </p>

          {/* 3. Filter Pill Dropdowns (Matching Reference Image) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
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
                    : 'bg-[#E8B896]/90 hover:bg-[#E8B896] text-black'
                }`}
              >
                <span>{selectedBpmRange === 'All' ? 'Tous les BPM' : `${selectedBpmRange} BPM`}</span>
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
                      {range === 'All' ? 'Tous les BPM' : `${range} BPM`}
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
                    : 'bg-[#E8B896]/90 hover:bg-[#E8B896] text-black'
                }`}
              >
                <span>{selectedTag === 'All' ? 'Tous les tags' : selectedTag}</span>
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
                      {t === 'All' ? 'Tous les tags' : t}
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
                className="h-9 px-4 rounded-full bg-[#E8B896]/90 hover:bg-[#E8B896] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>
                  {sortBy === 'popular'
                    ? 'Trier par: Popularité'
                    : sortBy === 'newest'
                    ? 'Trier par: Récents'
                    : 'Trier par: Tempo (BPM)'}
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
                    Popularité
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
                    Date récente
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
                    Tempo BPM (Élevé à Bas)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Full-Width Search Input (Matching Reference Image) */}
        <div className="relative mb-8 max-w-4xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une instru (titre, artiste, BPM, mood)..."
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

        {/* 5. Organization by Genre Tabs (Spec: "All beat has to be organized in there genre") */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar justify-start sm:justify-center">
          {GENRE_LIST.map((genre) => {
            const isSelected = selectedGenre.toLowerCase() === genre.toLowerCase();
            const count =
              genre === 'All Genres'
                ? SEEDED_BEATS.length
                : SEEDED_BEATS.filter((b) => b.genre.toLowerCase() === genre.toLowerCase()).length;

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

        {/* 6. Beats Table Layout - Grouped by Genre or Filtered */}
        {filteredBeats.length === 0 ? (
          <div className="py-20 text-center space-y-3 rounded-2xl bg-[#0F131C] border border-white/10 max-w-lg mx-auto">
            <Music2 className="h-10 w-10 text-gray-600 mx-auto" />
            <h3 className="text-base font-bold text-white">Aucune instru trouvée</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Aucun beat ne correspond à vos filtres actuels. Réinitialisez les filtres pour voir tout le catalogue.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('All Genres');
                setSelectedBpmRange('All');
                setSelectedTag('All');
              }}
              className="mt-2 h-9 px-4 rounded-full bg-[#E8B896] text-black text-xs font-bold"
            >
              Réinitialiser les filtres
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

        {/* 7. "Charger plus" Load More Button (Matching Reference Image) */}
        {filteredBeats.length > visibleCount && selectedGenre !== 'All Genres' && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="px-6 py-2.5 rounded-full bg-[#E8B896] hover:bg-[#d8a886] text-black text-xs font-black transition-transform hover:scale-105 flex items-center gap-1.5 shadow-lg"
            >
              <span>Charger plus</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

      <HomeFooter />
      <CartDrawer />
      <NowPlayingPanel />

      {/* 8. Price Tag Pop-Up Modal (Spec: "once they click get beat the price tag go pop up") */}
      <GetBeatPriceModal
        beat={priceModalBeat}
        isOpen={Boolean(priceModalBeat)}
        onClose={() => setPriceModalBeat(null)}
      />
    </div>
  );
}
