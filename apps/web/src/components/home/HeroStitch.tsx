'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Sparkles } from 'lucide-react';
import { MiniPlayer } from '../audio/MiniPlayer';

export const HeroStitch: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/beats?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/beats');
    }
  };

  const genreChips = ['Afrobeats', 'Amapiano', 'Trap', 'R&B', 'Drill', 'Dancehall'];
  const platforms = ['SPOTIFY', 'APPLE MUSIC', 'YOUTUBE', 'TIKTOK', 'AUDIOMACK'];

  return (
    <section className="relative bg-bg pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Label Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-surface border border-border text-xs text-text-muted mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-live" />
          <span>Over 12,000 beats, new ones every day</span>
        </div>

        {/* Headline (Display Grotesque tracking -0.03em) */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-text tracking-[-0.03em] leading-[1.05]">
          Stream it today. <br />
          License it tonight.
        </h1>

        {/* Subtext */}
        <p className="mt-5 text-sm sm:text-base lg:text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
          Original beats from independent producers. Preview every track, lease it from ₦3,000 or buy it exclusively, and get your files and a signed license the moment you pay.
        </p>

        {/* Search Pill with shadow ONLY under search bar (per spec) */}
        <form
          onSubmit={handleSearch}
          className="mt-8 max-w-2xl mx-auto flex items-center bg-surface border border-border rounded-pill p-1.5 shadow-hero-search"
        >
          <div className="pl-4 text-text-faint pointer-events-none">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by genre, BPM, mood or producer..."
            className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-text placeholder:text-text-faint focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 h-10 px-6 rounded-pill bg-accent hover:bg-[#135d56] text-text font-bold text-xs uppercase tracking-wider border border-accent transition-colors"
          >
            Find beats
          </button>
        </form>

        {/* Genre Chips */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-text-faint mr-1">Popular:</span>
          {genreChips.map((genre) => (
            <Link
              key={genre}
              href={`/beats?genre=${encodeURIComponent(genre)}`}
              className="text-xs text-text-muted hover:text-text hover:border-text-faint px-2.5 py-1 rounded-pill bg-surface border border-border transition-colors"
            >
              {genre}
            </Link>
          ))}
        </div>

        {/* Hero Mini Player Preview Strip */}
        <div className="mt-12 max-w-3xl mx-auto">
          <MiniPlayer variant="hero-strip" />
        </div>

        {/* Platform Strip: text only, not logos (per spec) */}
        <div className="mt-14 pt-8 border-t border-border">
          <div className="text-[11px] font-mono uppercase tracking-widest text-text-faint mb-4">
            Clearance &amp; distribution across major platforms
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12">
            {platforms.map((p) => (
              <span
                key={p}
                className="text-xs sm:text-sm font-black tracking-widest text-text-muted hover:text-text transition-colors select-none"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
