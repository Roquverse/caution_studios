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
import { UserCheck, ShieldCheck, Music2, Share2, MapPin, MessageSquare, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { ProducerChatModal } from '../../../components/chat/ProducerChatModal';

export default function ProducerProfilePage() {
  const params = useParams();
  const handle = params?.handle as string;
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  const producer =
    SEEDED_PRODUCERS.find((p) => p.handle === handle) || SEEDED_PRODUCERS[0];

  const producerBeats = SEEDED_BEATS.filter((b) => b.producer?.handle === producer.handle);
  const isVerified = Boolean((producer as any).is_verified);
  const streamingEarnings = (producer as any).streaming_earnings_cents
    ? (producer as any).streaming_earnings_cents / 100
    : 0;

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
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-text tracking-[-0.03em]">
                {producer.display_name}
              </h1>

              {isVerified ? (
                <span className="px-2.5 py-0.5 rounded-full bg-[#04564f]/30 border border-[#2dd4bf]/40 text-[10px] font-bold uppercase tracking-wider text-[#2dd4bf] flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 stroke-[2.5]" />
                  <span>Verified Producer (Streaming Partner)</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-surface-2 border border-border text-[10px] font-mono text-text-muted flex items-center gap-1">
                  <Music2 className="h-3 w-3" />
                  <span>Beat Seller (Unverified)</span>
                </span>
              )}
            </div>

            <div className="text-xs font-mono text-text-muted">
              @{producer.handle} · Lagos, Nigeria
            </div>

            {producer.bio && (
              <p className="text-xs sm:text-sm text-text-muted max-w-xl leading-relaxed">
                {producer.bio}
              </p>
            )}

            {/* Verification Explainer Notice if unverified */}
            {!isVerified && (
              <div className="p-3 rounded-sm bg-surface-2/60 border border-border text-[11px] text-text-muted flex items-start gap-2 max-w-xl">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Streaming Verification Rule:</strong> Producers must earn payouts from free beat streaming on Caution Studio to get verified and unlock direct studio chat, regardless of total beat sales.
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-6 text-xs font-mono text-text-muted">
                <div>
                  <strong className="text-text font-bold text-sm block">{producerBeats.length}</strong>
                  <span>Catalog beats</span>
                </div>
                <div>
                  <strong className="text-text font-bold text-sm block">
                    {((producer as any).streaming_streams_count || 128400).toLocaleString()}
                  </strong>
                  <span>Total streams</span>
                </div>
                <div>
                  <strong className="text-text font-bold text-sm block">1.8k</strong>
                  <span>Followers</span>
                </div>
              </div>

              {/* Chat Action Button */}
              <div>
                {isVerified ? (
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="h-10 px-5 rounded-pill bg-[#04564f] hover:bg-[#135d56] text-white text-xs font-bold flex items-center gap-2 border border-[#2dd4bf]/40 transition-colors shadow-lg shadow-[#04564f]/20"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Chat for Recording</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-surface-2 border border-border text-[11px] text-text-muted">
                    <Lock className="h-3.5 w-3.5 text-text-faint" />
                    <span>Chat locked (Requires Streaming Verification)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Direct Artist Chat Modal */}
        <ProducerChatModal
          producer={producer as any}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />

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
