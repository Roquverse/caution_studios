'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SEEDED_BEATS } from '../../lib/seedBeats';
import { BeatRow } from '../marketplace/BeatRow';
import { BeatCard } from '../marketplace/BeatCard';
import { LicenseSelectorModal } from '../marketplace/LicenseSelector';
import { Beat } from '@caution/types';
import { LayoutList, LayoutGrid, ArrowRight, Disc3 } from 'lucide-react';

export const FeaturedBeatsSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trending' | 'exclusive' | 'new'>('trending');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(null);
  const [allBeats, setAllBeats] = useState<Beat[]>(SEEDED_BEATS);

  React.useEffect(() => {
    fetch('/api/beats')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.beats) && data.beats.length > 0) {
          setAllBeats(data.beats);
        }
      })
      .catch(() => {});
  }, []);

  const beats = allBeats.filter((b) => {
    if (activeTab === 'exclusive') return b.status === 'sold' || b.licenses?.some((l) => l.type === 'exclusive');
    if (activeTab === 'new') return true;
    return true;
  }).slice(0, 8);

  return (
    <section className="bg-bg py-14 sm:py-20 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-live">
              <Disc3 className="h-4 w-4" />
              <span>Catalog Spotlight</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-text tracking-[-0.03em] mt-1">
              Fresh from independent producers
            </h2>
          </div>

          {/* Tab & View Mode Toggles */}
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-pill bg-surface border border-border flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('trending')}
                className={`px-3 py-1 rounded-pill text-xs font-medium transition-colors ${
                  activeTab === 'trending' ? 'bg-surface-2 text-text font-semibold' : 'text-text-muted hover:text-text'
                }`}
              >
                Trending
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className={`px-3 py-1 rounded-pill text-xs font-medium transition-colors ${
                  activeTab === 'new' ? 'bg-surface-2 text-text font-semibold' : 'text-text-muted hover:text-text'
                }`}
              >
                New arrivals
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('exclusive')}
                className={`px-3 py-1 rounded-pill text-xs font-medium transition-colors ${
                  activeTab === 'exclusive' ? 'bg-surface-2 text-text font-semibold' : 'text-text-muted hover:text-text'
                }`}
              >
                Exclusive
              </button>
            </div>

            {/* List / Grid toggle */}
            <div className="hidden sm:flex items-center p-1 rounded-sm bg-surface border border-border">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1 rounded-sm ${viewMode === 'list' ? 'bg-surface-2 text-text' : 'text-text-muted'}`}
                aria-label="List view"
              >
                <LayoutList className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded-sm ${viewMode === 'grid' ? 'bg-surface-2 text-text' : 'text-text-muted'}`}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Beats Content */}
        {viewMode === 'list' ? (
          <div className="space-y-2">
            {beats.map((beat) => (
              <BeatRow
                key={beat.id}
                beat={beat}
                onOpenLicenseSelector={(b) => setSelectedBeat(b)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {beats.map((beat) => (
              <BeatCard
                key={beat.id}
                beat={beat}
                onOpenLicenseSelector={(b) => setSelectedBeat(b)}
              />
            ))}
          </div>
        )}

        {/* View All Beats CTA & Section Links */}
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <Link
            href="/beats"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-pill bg-[#E8B896] hover:bg-[#d8a886] text-black text-xs font-black shadow-lg transition-transform hover:scale-105"
          >
            <span>Explore all 12,000+ beats</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-gray-400 text-[11px]">Quick Jump:</span>
            <Link
              href="/beats?section=free"
              className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 hover:bg-teal-500/20 font-semibold transition-colors"
            >
              🎧 Free Beats (Stream & Earn)
            </Link>
            <Link
              href="/beats?section=premium"
              className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 font-semibold transition-colors"
            >
              ⚡ Premium Beats (WAV+Stems)
            </Link>
            <Link
              href="/beats?section=exclusive"
              className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 font-semibold transition-colors"
            >
              👑 Exclusive (1-of-1 Buyout)
            </Link>
          </div>
        </div>
      </div>

      <LicenseSelectorModal
        isOpen={!!selectedBeat}
        onClose={() => setSelectedBeat(null)}
        beat={selectedBeat}
      />
    </section>
  );
};
