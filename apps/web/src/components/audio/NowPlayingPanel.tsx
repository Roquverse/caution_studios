'use client';

import React from 'react';
import Link from 'next/link';
import { useAudio } from './AudioProvider';
import { Waveform } from './Waveform';
import { PlayButton } from './PlayButton';
import { X, Heart, Share2, Disc3, ShieldCheck, Check, ShoppingBag } from 'lucide-react';
import { LICENSE_DEFINITIONS } from '@caution/licenses';
import { formatNaira } from '../../lib/paystack';

export const NowPlayingPanel: React.FC = () => {
  const {
    currentBeat,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
    isNowPlayingPanelOpen,
    setIsNowPlayingPanelOpen,
    addToCart,
    likes,
    toggleLike
  } = useAudio();

  if (!isNowPlayingPanelOpen || !currentBeat) return null;

  const progress = duration > 0 ? currentTime / duration : 0;
  const isLiked = likes.includes(currentBeat.id);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface-2 border-l border-border p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Now Playing
          </span>
          <button
            type="button"
            onClick={() => setIsNowPlayingPanelOpen(false)}
            className="p-1.5 rounded-sm text-text-muted hover:text-text border border-border"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Artwork & Title */}
        <div className="mt-6 space-y-4">
          <div className="relative aspect-square w-full rounded-sm overflow-hidden bg-surface border border-border">
            {currentBeat.cover_url && (
              <img
                src={currentBeat.cover_url}
                alt={currentBeat.title}
                className="w-full h-full object-cover"
              />
            )}
            {currentBeat.status === 'sold' && (
              <div className="absolute inset-0 bg-bg/80 flex items-center justify-center">
                <span className="px-3 py-1 rounded-sm bg-surface border border-border text-sold text-xs font-bold uppercase tracking-wider">
                  Sold Exclusively
                </span>
              </div>
            )}
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-text">{currentBeat.title}</h3>
              <Link
                href={`/producers/${currentBeat.producer?.handle || 'caution'}`}
                className="text-sm text-text-muted hover:text-text mt-0.5 block"
              >
                By {currentBeat.producer?.display_name || 'Caution Studio'}
              </Link>
            </div>
            <button
              type="button"
              onClick={() => toggleLike(currentBeat.id)}
              className={`p-2 rounded-sm border border-border hover:text-text ${
                isLiked ? 'text-accent-live border-accent-live' : 'text-text-muted'
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="px-2.5 py-1 rounded-sm bg-surface border border-border text-xs font-medium text-text">
              {currentBeat.genre}
            </span>
            <span className="px-2.5 py-1 rounded-sm bg-surface border border-border text-xs font-mono text-text">
              {currentBeat.bpm} BPM
            </span>
            {currentBeat.musical_key && (
              <span className="px-2.5 py-1 rounded-sm bg-surface border border-border text-xs font-mono text-text">
                Key: {currentBeat.musical_key}
              </span>
            )}
          </div>
        </div>

        {/* Waveform Player */}
        <div className="mt-6 p-4 rounded-sm bg-surface border border-border space-y-3">
          <div className="flex items-center justify-between">
            <PlayButton
              status={currentBeat.status}
              isPlaying={isPlaying}
              onClick={() => togglePlay(currentBeat)}
              size="sm"
              showLabel
            />
            <span className="text-xs font-mono text-text-muted">
              {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} /{' '}
              {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
            </span>
          </div>

          <Waveform
            peaks={currentBeat.waveform_peaks}
            progress={progress}
            onSeek={seek}
            height={36}
          />
        </div>

        {/* Licensing Options Table */}
        <div className="mt-6 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Available Licenses
          </div>

          <div className="space-y-2">
            {(['basic', 'premium', 'exclusive'] as const).map((tierKey) => {
              const def = LICENSE_DEFINITIONS[tierKey];
              const isSold = currentBeat.status === 'sold' && tierKey === 'exclusive';

              return (
                <div
                  key={tierKey}
                  className="p-3 rounded-sm bg-surface border border-border flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text">{def.name}</div>
                    <div className="text-[11px] text-text-muted truncate">
                      {def.streamCap ? `${def.streamCap.toLocaleString()} streams` : 'Unlimited streams'} · {def.filesDelivered[0]}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-mono font-bold text-text">
                      {formatNaira(def.defaultPriceNgn)}
                    </span>
                    <button
                      type="button"
                      disabled={isSold}
                      onClick={() => addToCart(currentBeat, tierKey)}
                      className="h-8 px-3 rounded-pill bg-accent hover:bg-[#135d56] disabled:bg-surface disabled:text-sold disabled:border-border text-text text-xs font-medium border border-accent flex items-center gap-1"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      <span>{isSold ? 'Sold' : 'Buy'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border text-xs text-text-faint text-center">
        Caution Studio Verified Master · Electronic Signed Agreement Instant Delivery
      </div>
    </div>
  );
};
