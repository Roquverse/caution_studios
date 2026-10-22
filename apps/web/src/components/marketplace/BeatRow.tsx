'use client';

import React from 'react';
import Link from 'next/link';
import { Beat } from '@caution/types';
import { useAudio } from '../audio/AudioProvider';
import { PlayButton } from '../audio/PlayButton';
import { Waveform } from '../audio/Waveform';
import { PriceTag } from './PriceTag';
import { SoldOverlay } from './SoldOverlay';
import { Heart, ShoppingBag, MoreHorizontal, Download, Sparkles } from 'lucide-react';
import { formatNaira } from '../../lib/paystack';

interface BeatRowProps {
  beat: Beat;
  onOpenLicenseSelector?: (beat: Beat) => void;
}

export const BeatRow: React.FC<BeatRowProps> = ({ beat, onOpenLicenseSelector }) => {
  const {
    currentBeat,
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    seek,
    likes,
    toggleLike,
    addToCart,
    openRewardedDownload
  } = useAudio();

  const isCurrent = currentBeat?.id === beat.id;
  const isThisPlaying = isCurrent && isPlaying;
  const isSold = beat.status === 'sold';
  const isLiked = likes.includes(beat.id);

  const progress = isCurrent && duration > 0 ? currentTime / duration : 0;

  return (
    <div
      className={`group relative flex items-center justify-between gap-4 p-3 rounded-sm transition-colors border ${
        isThisPlaying
          ? 'bg-surface-2 border-accent-live/40'
          : isCurrent
          ? 'bg-surface border-border'
          : 'bg-surface/50 hover:bg-surface border-border'
      }`}
    >
      {/* 1. Play Button & Artwork & Title */}
      <div className="flex items-center gap-3 min-w-0 w-64 lg:w-72 shrink-0">
        <PlayButton
          status={beat.status}
          isPlaying={isThisPlaying}
          onClick={() => togglePlay(beat)}
          size="sm"
        />

        <div className="relative w-10 h-10 rounded-sm overflow-hidden bg-surface-2 border border-border shrink-0">
          {beat.cover_url && (
            <img src={beat.cover_url} alt="" className="w-full h-full object-cover" />
          )}
          {isSold && <SoldOverlay className="text-[9px] p-0.5" label="Sold" />}
        </div>

        <div className="min-w-0">
          <Link
            href={`/beats/${beat.slug}`}
            className="text-xs sm:text-sm font-semibold text-text truncate hover:text-accent-live block"
          >
            {beat.title}
          </Link>
          <div className="text-[11px] text-text-muted truncate">
            {beat.producer?.display_name || 'Caution Studio'}
          </div>
        </div>
      </div>

      {/* 2. Genre & BPM & Key */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <span className="px-2 py-0.5 rounded-sm bg-surface-2 border border-border text-[11px] text-text">
          {beat.genre}
        </span>
        <span className="text-[11px] font-mono text-text-muted">
          {beat.bpm} BPM
        </span>
        {beat.musical_key && (
          <span className="hidden md:inline-block text-[11px] font-mono text-text-muted">
            · {beat.musical_key}
          </span>
        )}
      </div>

      {/* 3. Waveform preview (visible on md+) */}
      <div className="hidden lg:flex flex-1 max-w-xs items-center px-2">
        <Waveform
          peaks={beat.waveform_peaks}
          progress={progress}
          onSeek={(ratio) => {
            if (!isCurrent) togglePlay(beat);
            seek(ratio);
          }}
          height={24}
        />
      </div>

      {/* 4. Price & Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <PriceTag amountNgn={3000} isSold={isSold} />

        <button
          type="button"
          disabled={isSold}
          onClick={() => {
            if (onOpenLicenseSelector) {
              onOpenLicenseSelector(beat);
            } else {
              addToCart(beat, 'basic');
            }
          }}
          className="h-8 px-3 rounded-pill bg-accent hover:bg-[#135d56] disabled:bg-surface disabled:text-sold disabled:border-border text-text text-xs font-medium border border-accent flex items-center gap-1.5 transition-colors"
        >
          <ShoppingBag className="h-3 w-3" />
          <span className="hidden sm:inline">{isSold ? 'Sold' : 'Lease'}</span>
        </button>

        {/* Ad-supported Free Download Option */}
        {!isSold && (
          <button
            type="button"
            onClick={() => openRewardedDownload(beat)}
            title="Listen to 2 promoted songs to download free"
            className="hidden md:flex h-8 px-2.5 rounded-pill bg-surface hover:bg-surface-2 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-medium items-center gap-1 transition-colors"
          >
            <Download className="h-3 w-3" />
            <span className="text-[10px] font-mono">Free</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => toggleLike(beat.id)}
          className={`p-1.5 rounded-sm hover:text-text transition-colors ${
            isLiked ? 'text-accent-live' : 'text-text-muted'
          }`}
          aria-label="Like beat"
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
};
