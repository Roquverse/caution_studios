'use client';

import React, { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '../../../components/layout/TopNav';
import { HomeFooter } from '../../../components/home/HomeFooter';
import { Waveform } from '../../../components/audio/Waveform';
import { PlayButton } from '../../../components/audio/PlayButton';
import { useAudio } from '../../../components/audio/AudioProvider';
import { CartDrawer } from '../../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../../components/audio/NowPlayingPanel';
import { SEEDED_BEATS } from '../../../lib/seedBeats';
import { LICENSE_DEFINITIONS } from '@caution/licenses';
import { formatNaira } from '../../../lib/paystack';
import { LicenseType, Beat } from '@caution/types';
import {
  Heart,
  Share2,
  Check,
  ShieldCheck,
  Disc3,
  Calendar,
  Layers,
  ShoppingBag,
  ArrowLeft,
  Gift,
  Sparkles,
  Download
} from 'lucide-react';

export default function BeatDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [beat, setBeat] = useState<Beat>(() => {
    return SEEDED_BEATS.find((b) => b.slug === slug) || SEEDED_BEATS[0];
  });

  React.useEffect(() => {
    if (!slug) return;
    fetch('/api/beats')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.beats)) {
          const found = data.beats.find((b: Beat) => b.slug === slug || b.id === slug);
          if (found) setBeat(found);
        }
      })
      .catch(() => {});
  }, [slug]);

  const {
    currentBeat,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    addToCart,
    likes,
    toggleLike,
    openRewardedDownload,
    downloadState,
    openDownloadLimitModal
  } = useAudio();

  const [selectedLicense, setSelectedLicense] = useState<LicenseType>('premium');

  const isCurrent = currentBeat?.id === beat.id;
  const isThisPlaying = isCurrent && isPlaying;
  const isSold = beat.status === 'sold';
  const isLiked = likes.includes(beat.id);
  const progress = isCurrent && duration > 0 ? currentTime / duration : 0;

  const activeDef = LICENSE_DEFINITIONS[selectedLicense];

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col pb-24">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Link */}
        <Link
          href="/beats"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to all beats</span>
        </Link>

        {/* Top Hero Banner */}
        <div className="p-6 sm:p-8 rounded-sm bg-surface border border-border">
          <div className="flex flex-col md:flex-row items-start gap-6 sm:gap-8">
            {/* Artwork */}
            <div className="relative w-40 h-40 sm:w-56 sm:h-56 rounded-sm overflow-hidden bg-surface-2 border border-border shrink-0">
              {beat.cover_url && (
                <img src={beat.cover_url} alt={beat.title} className="w-full h-full object-cover" />
              )}
              {isSold && (
                <div className="absolute inset-0 bg-bg/85 flex items-center justify-center p-3 text-center">
                  <span className="px-3 py-1 rounded-sm bg-surface border border-border text-sold text-xs font-bold uppercase tracking-wider">
                    Sold Exclusively
                  </span>
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-sm bg-surface-2 border border-border text-[11px] font-bold uppercase tracking-wider text-accent-live">
                    {beat.genre}
                  </span>
                  <span className="text-xs text-text-muted font-mono">{beat.bpm} BPM</span>
                  {beat.musical_key && (
                    <span className="text-xs text-text-muted font-mono">· Key: {beat.musical_key}</span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-text tracking-[-0.03em]">
                  {beat.title}
                </h1>
                <Link
                  href={`/producers/${beat.producer?.handle || 'caution'}`}
                  className="text-sm text-text-muted hover:text-accent-live mt-1 block"
                >
                  Produced by <strong className="text-text">{beat.producer?.display_name || 'Caution Studio'}</strong>
                </Link>
              </div>

              {beat.description && (
                <p className="text-xs sm:text-sm text-text-muted max-w-xl leading-relaxed">
                  {beat.description}
                </p>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(beat.tags || []).map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-sm bg-surface-2 border border-border text-[11px] text-text-muted"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Play & Like Controls */}
              <div className="flex items-center gap-3 pt-2">
                <PlayButton
                  status={beat.status}
                  isPlaying={isThisPlaying}
                  onClick={() => togglePlay(beat)}
                  size="md"
                  showLabel
                />

                <button
                  type="button"
                  onClick={() => toggleLike(beat.id)}
                  className={`h-10 px-4 rounded-pill border border-border flex items-center gap-2 text-xs font-medium transition-colors ${
                    isLiked ? 'text-accent-live border-accent-live bg-surface-2' : 'text-text-muted hover:text-text bg-surface'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{beat.like_count + (isLiked ? 1 : 0)}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Waveform Strip */}
          <div className="mt-8 pt-6 border-t border-border space-y-2">
            <div className="flex justify-between text-xs font-mono text-text-muted">
              <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
              <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
            </div>
            <Waveform
              peaks={beat.waveform_peaks}
              progress={progress}
              onSeek={(r) => {
                if (!isCurrent) togglePlay(beat);
                seek(r);
              }}
              height={44}
            />
          </div>
        </div>

        {/* License Selector Section */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-text tracking-[-0.03em]">
                Select your license
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                All licenses include signed PDF contract and instant audio file delivery via Paystack
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['basic', 'premium', 'exclusive'] as const).map((tierKey) => {
              const def = LICENSE_DEFINITIONS[tierKey];
              const isSelected = selectedLicense === tierKey;
              const isTierSold = isSold && tierKey === 'exclusive';

              return (
                <div
                  key={tierKey}
                  onClick={() => !isTierSold && setSelectedLicense(tierKey)}
                  className={`p-6 rounded-sm flex flex-col justify-between cursor-pointer transition-colors border ${
                    isTierSold
                      ? 'bg-surface-2 opacity-50 border-border cursor-not-allowed'
                      : isSelected
                      ? 'bg-surface-2 border-accent-live ring-1 ring-accent-live'
                      : 'bg-surface border-border hover:border-text-faint'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-base font-bold text-text">{def.name}</div>
                      {tierKey === 'premium' && (
                        <span className="px-2 py-0.5 rounded-sm bg-accent border border-accent text-[10px] font-bold text-text uppercase tracking-wider">
                          Recommended
                        </span>
                      )}
                    </div>

                    <div className="text-2xl sm:text-3xl font-black font-mono text-text mt-3">
                      {formatNaira(def.defaultPriceNgn)}
                    </div>
                    <div className="text-xs text-text-muted mt-1 leading-relaxed">
                      {def.description}
                    </div>

                    <ul className="mt-6 pt-5 border-t border-border space-y-2.5 text-xs text-text-muted">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-accent-live shrink-0" />
                        <span>
                          {def.streamCap ? `${def.streamCap.toLocaleString()} streams` : 'Unlimited streams'}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-accent-live shrink-0" />
                        <span>{def.filesDelivered[0]}</span>
                      </li>
                      {def.includesStems && (
                        <li className="flex items-center gap-2 text-text font-medium">
                          <Check className="h-4 w-4 text-accent-live shrink-0" />
                          <span>Trackout stems included</span>
                        </li>
                      )}
                      {def.isExclusive && (
                        <li className="flex items-center gap-2 text-accent-live font-semibold">
                          <Check className="h-4 w-4 text-accent-live shrink-0" />
                          <span>Sole exclusive copyright transfer</span>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <button
                      type="button"
                      disabled={isTierSold}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isTierSold) addToCart(beat, tierKey);
                      }}
                      className={`w-full h-10 rounded-pill font-semibold text-xs flex items-center justify-center gap-2 transition-colors border ${
                        isTierSold
                          ? 'bg-surface text-sold border-border cursor-not-allowed'
                          : isSelected
                          ? 'bg-accent hover:bg-[#135d56] text-text border-accent'
                          : 'bg-surface hover:bg-surface-2 text-text border-border'
                      }`}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>{isTierSold ? 'Sold Exclusively' : `Add ${def.name} to Cart`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Free Option: Stream 2 Promoted Songs to Unlock 1 Free Beat */}
          {!isSold && (
            <div className="mt-8 p-6 rounded-sm bg-gradient-to-r from-[#04564f]/20 via-surface to-surface-2 border border-[#2dd4bf]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-sm bg-[#04564f]/30 border border-[#2dd4bf]/40 text-[#2dd4bf] shrink-0">
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                      Free Option // Ad-Supported
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#04564f]/40 text-[#2dd4bf] text-[10px] font-mono font-bold border border-[#2dd4bf]/30">
                      {downloadState.canDownload ? `${downloadState.remaining}/2 Daily Downloads Left` : '24h Cooldown Active'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    Listen to 2 Songs to Download This Beat Free
                  </h3>
                  <p className="text-xs text-text-muted mt-1 max-w-xl leading-relaxed">
                    {downloadState.canDownload
                      ? `Support emerging artists by streaming 2 promoted songs. Once finished, you can download "${beat.title}" free (2 beats/day limit, resets every 24h, 62 beats/mo).`
                      : 'You have downloaded your 2 beats for today. You can download again after 24 hours. Enjoy unlimited beat preview streaming anytime!'}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (!downloadState.canDownload) {
                      openDownloadLimitModal();
                      return;
                    }
                    openRewardedDownload(beat);
                  }}
                  className="h-11 px-5 rounded-pill bg-[#04564f] hover:bg-[#135d56] text-white text-xs font-bold flex items-center gap-2 border border-[#2dd4bf]/40 transition-colors shadow-lg shadow-[#04564f]/25"
                >
                  <Download className="h-4 w-4" />
                  <span>{downloadState.canDownload ? 'Stream 2 Songs & Download Free' : 'Daily Limit (24h Cooldown)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <HomeFooter />
      <CartDrawer />
      <NowPlayingPanel />
    </div>
  );
}
