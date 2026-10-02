'use client';

import React from 'react';
import { Track } from '@caution/types';
import { Play, Pause, Download, Heart, Share2, MoreVertical, Volume2 } from 'lucide-react';
import { WaveformVisualizer } from './WaveformVisualizer';
import { cn } from '../utils/cn';

export interface TrackRowProps {
  track: Track;
  isPlaying?: boolean;
  isCurrent?: boolean;
  currentTime?: number;
  isFavorited?: boolean;
  onPlayToggle?: (track: Track) => void;
  onSeek?: (ratio: number) => void;
  onDownload?: (track: Track) => void;
  onFavoriteToggle?: (track: Track) => void;
  onShare?: (track: Track) => void;
  className?: string;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  isPlaying = false,
  isCurrent = false,
  currentTime = 0,
  isFavorited = false,
  onPlayToggle,
  onSeek,
  onDownload,
  onFavoriteToggle,
  onShare,
  className
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = track.duration > 0 ? Math.min(1, currentTime / track.duration) : 0;

  return (
    <div
      className={cn(
        'group flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-200',
        isCurrent
          ? 'bg-zinc-100 border-zinc-300 shadow-sm'
          : 'bg-white border-gray-100/90 hover:bg-gray-50/70 hover:border-gray-200',
        className
      )}
    >
      {/* Left section: Cover, Play/Pause, Title, Genre */}
      <div className="flex items-center gap-3.5 min-w-[280px] lg:min-w-[340px]">
        {/* Cover Art */}
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-100 shadow-sm">
          <img
            src={track.coverUrl}
            alt={track.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {/* Mobile Play Overlay */}
          <button
            type="button"
            onClick={() => onPlayToggle && onPlayToggle(track)}
            className="md:hidden absolute inset-0 flex items-center justify-center bg-black/40 text-white"
          >
            {isPlaying && isCurrent ? (
              <Pause className="h-5 w-5 fill-white" />
            ) : (
              <Play className="h-5 w-5 fill-white ml-0.5" />
            )}
          </button>
        </div>

        {/* Desktop Play/Pause Button */}
        <button
          type="button"
          onClick={() => onPlayToggle && onPlayToggle(track)}
          aria-label={isPlaying && isCurrent ? `Pause ${track.title}` : `Play ${track.title}`}
          className={cn(
            'hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all focus:outline-none',
            isCurrent && isPlaying
              ? 'bg-black text-white shadow-sm shadow-black/20'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          )}
        >
          {isPlaying && isCurrent ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Track Title and Tags */}
        <div className="flex flex-col min-w-0 pr-2">
          <span
            className={cn(
              'text-sm font-semibold truncate transition-colors',
              isCurrent ? 'text-black font-bold' : 'text-gray-900 group-hover:text-black'
            )}
          >
            {track.title}
          </span>
          <span className="text-xs text-gray-500 truncate">
            {track.genre.join(', ')}
          </span>
        </div>
      </div>

      {/* Middle section: Interactive Waveform / Playback scrub / Time */}
      <div className="flex-1 max-w-xl flex items-center gap-3 px-2">
        {isCurrent ? (
          <div className="w-full flex items-center gap-3">
            <Volume2 className="h-4 w-4 text-black shrink-0 animate-pulse" />
            <div className="flex-1">
              <WaveformVisualizer
                waveform={track.waveform}
                progress={progress}
                isPlaying={isPlaying}
                onSeek={onSeek}
                height={26}
                activeColor="#000000"
                inactiveColor="#CBD5E1"
              />
            </div>
            <span className="text-xs font-medium text-gray-600 shrink-0 font-mono">
              {formatTime(currentTime)} / {track.formattedDuration}
            </span>
          </div>
        ) : (
          <div className="hidden lg:flex w-full items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
            <div className="flex-1">
              <WaveformVisualizer
                waveform={track.waveform}
                progress={0}
                isPlaying={false}
                height={22}
                inactiveColor="#E2E8F0"
              />
            </div>
            <span className="text-xs text-gray-500 shrink-0 font-mono">
              {track.formattedDuration}
            </span>
          </div>
        )}
      </div>

      {/* Right section: Duration fallback on mobile & Action Buttons */}
      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
        {!isCurrent && (
          <span className="text-xs text-gray-500 font-mono lg:hidden">
            {track.formattedDuration}
          </span>
        )}

        <div className="flex items-center gap-1 text-gray-400">
          {/* Download Action */}
          <button
            type="button"
            onClick={() => onDownload && onDownload(track)}
            title="Download track & license"
            aria-label="Download track & license"
            className="p-1.5 rounded-lg hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Download className="h-4 w-4" />
          </button>

          {/* Favorite Action */}
          <button
            type="button"
            onClick={() => onFavoriteToggle && onFavoriteToggle(track)}
            title="Add to favorites"
            aria-label="Add to favorites"
            className={cn(
              'p-1.5 rounded-lg hover:bg-gray-100 transition-colors',
              isFavorited
                ? 'text-rose-500 hover:text-rose-600'
                : 'hover:text-gray-900'
            )}
          >
            <Heart className={cn('h-4 w-4', isFavorited && 'fill-rose-500')} />
          </button>

          {/* Share Action */}
          <button
            type="button"
            onClick={() => onShare && onShare(track)}
            title="Share track"
            aria-label="Share track"
            className="p-1.5 rounded-lg hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>

          {/* More Action */}
          <button
            type="button"
            title="More options"
            aria-label="More options"
            className="p-1.5 rounded-lg hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
