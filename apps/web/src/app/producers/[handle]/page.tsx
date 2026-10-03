'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '../../../components/layout/TopNav';
import { HomeFooter } from '../../../components/home/HomeFooter';
import { BeatRow } from '../../../components/marketplace/BeatRow';
import { CartDrawer } from '../../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../../components/audio/NowPlayingPanel';
import { SEEDED_PRODUCERS, SEEDED_BEATS } from '../../../lib/seedBeats';
import { UserCheck, ShieldCheck, Music2, Share2, MapPin } from 'lucide-react';

export default function ProducerProfilePage() {
  const params = useParams();
  const handle = params?.handle as string;

  const producer =
    SEEDED_PRODUCERS.find((p) => p.handle === handle) || SEEDED_PRODUCERS[0];

  const producerBeats = SEEDED_BEATS.filter((b) => b.producer?.handle === producer.handle);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col pb-24">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Profile Card */}
        <div className="p-6 sm:p-8 rounded-sm bg-surface border border-border flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-sm overflow-hidden bg-surface-2 border border-border shrink-0">
            {producer.avatar_url && (
              <img src={producer.avatar_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-text tracking-[-0.03em]">
                {producer.display_name}
              </h1>
              <span className="px-2 py-0.5 rounded-sm bg-surface-2 border border-border text-[10px] font-bold uppercase tracking-wider text-accent-live flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                <span>Verified Producer</span>
              </span>
            </div>

            <div className="text-xs font-mono text-text-muted">
              @{producer.handle} · Lagos, Nigeria
            </div>

            {producer.bio && (
              <p className="text-xs sm:text-sm text-text-muted max-w-xl leading-relaxed">
                {producer.bio}
              </p>
            )}

            <div className="flex items-center gap-6 pt-2 text-xs font-mono text-text-muted">
              <div>
                <strong className="text-text font-bold text-sm block">{producerBeats.length}</strong>
                <span>Catalog beats</span>
              </div>
              <div>
                <strong className="text-text font-bold text-sm block">128.4k</strong>
                <span>Total streams</span>
              </div>
              <div>
                <strong className="text-text font-bold text-sm block">1.8k</strong>
                <span>Followers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Producer Beats List */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h2 className="text-lg font-bold text-text">
              Beats by {producer.display_name}
            </h2>
            <span className="text-xs text-text-muted font-mono">
              {producerBeats.length} available
            </span>
          </div>

          <div className="space-y-2">
            {producerBeats.map((beat) => (
              <BeatRow key={beat.id} beat={beat} />
            ))}
          </div>
        </div>
      </main>

      <HomeFooter />
      <CartDrawer />
      <NowPlayingPanel />
    </div>
  );
}
