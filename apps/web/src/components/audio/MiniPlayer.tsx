'use client';

import React from 'react';
import Link from 'next/link';
import { useAudio } from './AudioProvider';
import { Waveform } from './Waveform';
import { PlayButton } from './PlayButton';
import {
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  Maximize2,
  ShoppingBag,
  X
} from 'lucide-react';
import { formatNaira } from '../../lib/paystack';

interface MiniPlayerProps {
  variant?: 'persistent' | 'hero-strip';
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ variant = 'persistent' }) => {
  const {
    currentBeat,
    isPlaying,
    currentTime,
    duration,
    volume,
    setVolume,
    togglePlay,
    seek,
    next,
    prev,
    setIsNowPlayingPanelOpen,
    isNowPlayingPanelOpen,
    likes,
    toggleLike,
    addToCart
  } = useAudio();

  if (!currentBeat) return null;

  const progress = duration > 0 ? currentTime / duration : 0;
  const isLiked = likes.includes(currentBeat.id);

  if (variant === 'hero-strip') {
    return (
      <div className="w-full bg-surface border border-border rounded-sm p-3.5 flex items-center gap-4">
        <PlayButton
          status={currentBeat.status}
          isPlaying={isPlaying}
          onClick={() => togglePlay(currentBeat)}
          size="sm"
        />

        <div className="flex items-center gap-3 min-w-0 w-44">
          <div className="w-9 h-9 rounded-sm overflow-hidden bg-surface-2 border border-border shrink-0">
            {currentBeat.cover_url && (
              <img src={currentBeat.cover_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-text truncate">{currentBeat.title}</div>
            <div className="text-[11px] text-text-muted truncate">
              {currentBeat.producer?.display_name || 'Caution Studio'}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-3">
          <span className="text-[11px] font-mono text-text-muted w-9 text-right shrink-0">
            {formatTime(currentTime)}
          </span>
          <Waveform
            peaks={currentBeat.waveform_peaks}
            progress={progress}
            onSeek={seek}
            height={24}
          />
          <span className="text-[11px] font-mono text-text-muted w-9 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => addToCart(currentBeat, 'basic')}
          className="shrink-0 h-8 px-3 rounded-pill bg-accent hover:bg-[#135d56] text-text text-xs font-medium border border-accent"
        >
          Lease {formatNaira(3000)}
        </button>
      </div>
    );
  }

  // Persistent Bottom Bar
  return (
    <aside
      aria-label="Audio player"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border px-4 py-3 select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Beat info */}
        <div className="flex items-center gap-3 w-full md:w-64 shrink-0">
          <div className="relative w-11 h-11 rounded-sm overflow-hidden bg-surface-2 border border-border shrink-0">
            {currentBeat.cover_url && (
              <img src={currentBeat.cover_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/beats/${currentBeat.slug}`}
              className="text-sm font-semibold text-text truncate hover:text-accent-live block"
            >
              {currentBeat.title}
            </Link>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>{currentBeat.producer?.display_name || 'Producer'}</span>
              <span>·</span>
              <span className="font-mono">{currentBeat.bpm} BPM</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toggleLike(currentBeat.id)}
            className={`p-1.5 rounded-sm hover:text-text transition-colors ${
              isLiked ? 'text-accent-live' : 'text-text-muted'
            }`}
            aria-label="Like beat"
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center: Controls & Waveform */}
        <div className="flex-1 w-full max-w-2xl flex items-center gap-3">
          <button
            type="button"
            onClick={prev}
            className="p-1.5 text-text-muted hover:text-text rounded-sm"
            aria-label="Previous beat"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <PlayButton
            status={currentBeat.status}
            isPlaying={isPlaying}
            onClick={() => togglePlay(currentBeat)}
            size="sm"
          />

          <button
            type="button"
            onClick={next}
            className="p-1.5 text-text-muted hover:text-text rounded-sm"
            aria-label="Next beat"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <span className="text-xs font-mono text-text-muted w-10 text-right shrink-0">
            {formatTime(currentTime)}
          </span>

          <div className="flex-1 min-w-0">
            <Waveform
              peaks={currentBeat.waveform_peaks}
              progress={progress}
              onSeek={seek}
              height={28}
            />
          </div>

          <span className="text-xs font-mono text-text-muted w-10 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {/* Volume */}
          <div className="flex items-center gap-1.5 text-text-muted">
            <button
              type="button"
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              className="p-1 hover:text-text"
              aria-label="Volume toggle"
            >
              {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 h-1 bg-border rounded-lg accent-accent-live cursor-pointer"
            />
          </div>

          {/* Quick License CTA */}
          <button
            type="button"
            onClick={() => addToCart(currentBeat, 'basic')}
            className="h-8 px-3 rounded-pill bg-accent hover:bg-[#135d56] text-text text-xs font-medium border border-accent flex items-center gap-1.5"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Lease {formatNaira(3000)}</span>
          </button>

          {/* Expand panel toggle */}
          <button
            type="button"
            onClick={() => setIsNowPlayingPanelOpen(!isNowPlayingPanelOpen)}
            className="p-1.5 text-text-muted hover:text-text rounded-sm border border-border"
            aria-label="Toggle details panel"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
