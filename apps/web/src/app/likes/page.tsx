'use client';

import React from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { BeatRow } from '../../components/marketplace/BeatRow';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import { useAudio } from '../../components/audio/AudioProvider';
import { SEEDED_BEATS } from '../../lib/seedBeats';
import { Heart, Music2, ArrowRight } from 'lucide-react';

export default function LikesPage() {
  const { likes } = useAudio();

  const likedBeats = SEEDED_BEATS.filter((b) => likes.includes(b.id));

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col pb-24">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="pb-6 border-b border-border mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-live">
            <Heart className="h-3.5 w-3.5 fill-current" />
            <span>Favorites</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-text tracking-[-0.03em] mt-1">
            Liked beats
          </h1>
          <p className="text-xs text-text-muted mt-1">
            {likedBeats.length} saved beats in your private collection
          </p>
        </div>

        {likedBeats.length === 0 ? (
          <div className="py-20 text-center space-y-3 rounded-sm bg-surface border border-border">
            <Heart className="h-10 w-10 text-text-muted mx-auto" />
            <h3 className="text-base font-bold text-text">No liked beats yet</h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              Click the heart icon on any beat while browsing to save it to your favorites list.
            </p>
            <Link
              href="/beats"
              className="inline-flex items-center gap-1.5 mt-2 h-8 px-4 rounded-pill bg-accent text-text text-xs font-medium border border-accent"
            >
              <span>Explore beats</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {likedBeats.map((beat) => (
              <BeatRow key={beat.id} beat={beat} />
            ))}
          </div>
        )}
      </main>

      <HomeFooter />
      <CartDrawer />
      <NowPlayingPanel />
    </div>
  );
}
