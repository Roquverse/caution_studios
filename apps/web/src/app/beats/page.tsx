'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { BeatFilters } from '../../components/marketplace/BeatFilters';
import { BeatRow } from '../../components/marketplace/BeatRow';
import { BeatCard } from '../../components/marketplace/BeatCard';
import { LicenseSelectorModal } from '../../components/marketplace/LicenseSelector';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import { SEEDED_BEATS } from '../../lib/seedBeats';
import { Beat, FilterState } from '@caution/types';
import { LayoutList, LayoutGrid, Music2 } from 'lucide-react';

export default function BeatsPage() {
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get('genre');
  const initialQuery = searchParams.get('q') || '';

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: initialQuery,
    selectedGenres: initialGenre ? [initialGenre] : [],
    selectedMoods: [],
    sortBy: 'popular'
  });

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);

  const filteredBeats = useMemo(() => {
    return SEEDED_BEATS.filter((beat) => {
      // Search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = beat.title.toLowerCase().includes(q);
        const matchesProducer = beat.producer?.display_name.toLowerCase().includes(q);
        const matchesGenre = beat.genre.toLowerCase().includes(q);
        const matchesTags = beat.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesProducer && !matchesGenre && !matchesTags) return false;
      }

      // Genre filter
      if (filters.selectedGenres.length > 0) {
        if (!filters.selectedGenres.includes(beat.genre)) return false;
      }

      // Mood filter
      if (filters.selectedMoods.length > 0) {
        const hasMood = beat.moods.some((m) => filters.selectedMoods.includes(m));
        if (!hasMood) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (filters.sortBy === 'bpm') {
        return (b.bpm || 0) - (a.bpm || 0);
      }
      return b.play_count - a.play_count;
    });
  }, [filters]);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col pb-24">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-accent-live">
              Browse Catalog
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-text tracking-[-0.03em] mt-1">
              All beats
            </h1>
            <p className="text-xs text-text-muted mt-1">
              Showing {filteredBeats.length} original beats available for streaming and instant licensing
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-sm bg-surface border border-border">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-sm ${viewMode === 'list' ? 'bg-surface-2 text-text' : 'text-text-muted hover:text-text'}`}
              aria-label="List view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-sm ${viewMode === 'grid' ? 'bg-surface-2 text-text' : 'text-text-muted hover:text-text'}`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="my-6">
          <BeatFilters filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Beats Content */}
        {filteredBeats.length === 0 ? (
          <div className="py-20 text-center space-y-3 rounded-sm bg-surface border border-border">
            <Music2 className="h-10 w-10 text-text-muted mx-auto" />
            <h3 className="text-base font-bold text-text">No beats match your criteria</h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Try adjusting your search query, clearing mood filters, or exploring all genres.
            </p>
            <button
              type="button"
              onClick={() => setFilters({ searchQuery: '', selectedGenres: [], selectedMoods: [] })}
              className="mt-2 h-8 px-4 rounded-pill bg-accent text-text text-xs font-medium border border-accent"
            >
              Reset filters
            </button>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-2">
            {filteredBeats.map((beat) => (
              <BeatRow
                key={beat.id}
                beat={beat}
                onOpenLicenseSelector={(b) => setSelectedBeat(b)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredBeats.map((beat) => (
              <BeatCard
                key={beat.id}
                beat={beat}
                onOpenLicenseSelector={(b) => setSelectedBeat(b)}
              />
            ))}
          </div>
        )}
      </main>

      <HomeFooter />
      <CartDrawer />
      <NowPlayingPanel />

      <LicenseSelectorModal
        isOpen={!!selectedBeat}
        onClose={() => setSelectedBeat(null)}
        beat={selectedBeat}
      />
    </div>
  );
}
