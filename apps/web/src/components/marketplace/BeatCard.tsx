'use client';

import React from 'react';
import Link from 'next/link';
import { Beat } from '@caution/types';
import { useAudio } from '../audio/AudioProvider';
import { PlayButton } from '../audio/PlayButton';
import { PriceTag } from './PriceTag';
import { SoldOverlay } from './SoldOverlay';
import { Heart, ShoppingBag } from 'lucide-react';

interface BeatCardProps {
  beat: Beat;
  onOpenLicenseSelector?: (beat: Beat) => void;
}

export const BeatCard: React.FC<BeatCardProps> = ({ beat, onOpenLicenseSelector }) => {
  const { currentBeat, isPlaying, togglePlay, likes, toggleLike, addToCart } = useAudio();

  const isCurrent = currentBeat?.id === beat.id;
  const isThisPlaying = isCurrent && isPlaying;
  const isSold = beat.status === 'sold';
  const isLiked = likes.includes(beat.id);

  return (
    <div className="group relative flex flex-col p-3 rounded-sm bg-surface border border-border hover:border-text-faint transition-colors duration-150">
      {/* Artwork container */}
      <div className="relative aspect-square w-full rounded-sm overflow-hidden bg-surface-2 border border-border">
        {beat.cover_url && (
          <img
            src={beat.cover_url}
            alt={beat.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}

        {isSold && <SoldOverlay label="Sold Exclusively" />}

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-20">
          <span className="px-2 py-0.5 rounded-sm bg-bg/90 border border-border text-[10px] font-medium text-text uppercase tracking-wider">
            {beat.genre}
          </span>
        </div>

        {/* Like Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(beat.id);
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-sm bg-bg/90 border border-border transition-colors z-20 ${
            isLiked ? 'text-accent-live' : 'text-text-muted hover:text-text'
          }`}
          aria-label="Like"
        >
          <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
        </button>

        {/* Play Overlay Button */}
        <div className="absolute bottom-2 left-2 z-20">
          <PlayButton
            status={beat.status}
            isPlaying={isThisPlaying}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay(beat);
            }}
            size="sm"
          />
        </div>

        {/* BPM tag bottom right */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-sm bg-bg/90 border border-border text-[10px] font-mono text-text-muted z-20">
          {beat.bpm} BPM
        </div>
      </div>

      {/* Meta details */}
      <div className="mt-3 flex-1 flex flex-col justify-between">
        <div>
          <Link
            href={`/beats/${beat.slug}`}
            className="text-sm font-bold text-text truncate hover:text-accent-live block"
          >
            {beat.title}
          </Link>
          <div className="text-xs text-text-muted truncate mt-0.5">
            By {beat.producer?.display_name || 'Caution Studio'}
          </div>
        </div>

        {/* Bottom row: Price & Lease */}
        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
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
            className="h-7 px-2.5 rounded-pill bg-accent hover:bg-[#135d56] disabled:bg-surface disabled:text-sold disabled:border-border text-text text-[11px] font-medium border border-accent flex items-center gap-1 transition-colors"
          >
            <ShoppingBag className="h-3 w-3" />
            <span>{isSold ? 'Sold' : 'Lease'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
