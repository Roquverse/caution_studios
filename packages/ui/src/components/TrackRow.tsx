'use client';

import React from 'react';
import {
  Play,
  Pause,
  Download,
  Heart,
  Star,
  Share2,
  MoreVertical,
  Volume2,
  Lock,
  Clock
} from 'lucide-react';
import { cn } from '../utils/cn';

export interface PlayableTrackItem {
  id: string;
  title: string;
  artist: string;
  genre?: string | string[];
  duration?: number | string;
  durationSeconds?: number;
  formattedDuration?: string;
  coverUrl?: string;
  waveform?: number[];
  audioUrl?: string;
  bpm?: number;
  musicalKey?: string;
  priceNgn?: number;
  exclusivePriceNgn?: number;
  isFree?: boolean;
  playCount?: number;
  date?: string;
  [key: string]: any;
}

const DEFAULT_WAVEFORM = [
  0.2, 0.4, 0.6, 0.75, 0.85, 0.95, 0.8, 0.7, 0.6, 0.75, 0.9, 0.85, 0.95, 1.0,
  0.8, 0.65, 0.5, 0.6, 0.75, 0.9, 0.85, 0.7, 0.8, 0.95, 0.85, 0.65, 0.5, 0.6,
  0.4, 0.3, 0.2, 0.15
];

export interface TrackRowProps<T extends PlayableTrackItem = PlayableTrackItem> {
  track: T;
  isPlaying?: boolean;
  isCurrent?: boolean;
  currentTime?: number;
  isFavorited?: boolean;
  isStarred?: boolean;
  isListenLater?: boolean;
  isDownloading?: boolean;
  isDownloadLocked?: boolean;
  variant?: 'light' | 'dark';
  subtitleOverride?: React.ReactNode;
  badge?: React.ReactNode;
  rightSlot?: React.ReactNode;
  onPlayToggle?: (track: T, e?: React.MouseEvent) => void;
  onSeek?: (ratio: number) => void;
  onDownload?: (track: T, e: React.MouseEvent) => void;
  onLockedDownloadClick?: (track: T, e: React.MouseEvent) => void;
  onFavoriteToggle?: (track: T, e: React.MouseEvent) => void;
  onStarToggle?: (track: T, e: React.MouseEvent) => void;
  onListenLaterToggle?: (track: T, e: React.MouseEvent) => void;
  onShare?: (track: T, e: React.MouseEvent) => void;
  onMoreClick?: (track: T, e: React.MouseEvent) => void;
  className?: string;
}

export const TrackRow = <T extends PlayableTrackItem = PlayableTrackItem>({
  track,
  isPlaying = false,
  isCurrent = false,
  currentTime = 0,
  isFavorited = false,
  isStarred = false,
  isListenLater = false,
  isDownloading = false,
  isDownloadLocked = false,
  variant = 'light',
  subtitleOverride,
  badge,
  rightSlot,
  onPlayToggle,
  onSeek,
  onDownload,
  onLockedDownloadClick,
  onFavoriteToggle,
  onStarToggle,
  onListenLaterToggle,
  onShare,
  onMoreClick,
  className
}: TrackRowProps<T>) => {
  const formatTime = (secs: number) => {
    const safeSecs = Math.max(0, Math.floor(secs || 0));
    const m = Math.floor(safeSecs / 60);
    const s = Math.floor(safeSecs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalDurationSec =
    typeof track.durationSeconds === 'number'
      ? track.durationSeconds
      : typeof track.duration === 'number'
      ? track.duration
      : 180;

  const formattedTotalDuration =
    track.formattedDuration ||
    (typeof track.duration === 'string' ? track.duration : formatTime(totalDurationSec));

  const progressRatio =
    isCurrent && totalDurationSec > 0 ? Math.min(1, currentTime / totalDurationSec) : 0;

  const waveformBars =
    Array.isArray(track.waveform) && track.waveform.length > 0
      ? track.waveform
      : DEFAULT_WAVEFORM;

  const genreDisplay = Array.isArray(track.genre)
    ? track.genre.join(', ')
    : track.genre || 'Afrobeats';

  const isTrackPlaying = isCurrent && isPlaying;
  const isDark = variant === 'dark';

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio);
  };

  return (
    <div
      onClick={(e) => onPlayToggle && onPlayToggle(track, e)}
      className={cn(
        'group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer select-none',
        isDark
          ? isCurrent
            ? 'bg-white/[0.06] border-white/15 shadow-sm'
            : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05] hover:border-white/10'
          : isCurrent
          ? 'bg-gray-50/90 border-gray-200 shadow-sm'
          : 'bg-white border-transparent hover:bg-gray-50/60 hover:border-gray-150',
        className
      )}
    >
      {/* Left: Artwork, Play button, Title, Artist • Genre */}
      <div className="flex items-center gap-3 min-w-[190px] sm:min-w-[270px] max-w-[340px]">
        {/* Thumbnail Cover */}
        <div
          className={cn(
            'relative h-10 w-10 shrink-0 rounded-lg overflow-hidden shadow-sm border',
            isDark ? 'bg-black/40 border-white/10' : 'bg-gray-100 border-gray-200/60'
          )}
        >
          {track.coverUrl ? (
            <img
              src={track.coverUrl}
              alt={track.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Volume2 className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onPlayToggle) onPlayToggle(track, e);
          }}
          aria-label={isTrackPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          className={cn(
            'h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer',
            isDark
              ? isTrackPlaying
                ? 'text-[#2dd4bf] bg-[#04564f]/40'
                : 'text-gray-400 group-hover:text-white hover:bg-white/10'
              : isTrackPlaying
              ? 'text-[#04564f]'
              : 'text-gray-500 group-hover:text-black'
          )}
        >
          {isTrackPlaying ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Title & Artist • Genre */}
        <div className="flex flex-col min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'text-xs sm:text-sm font-bold truncate',
                isDark
                  ? isCurrent
                    ? 'text-[#2dd4bf]'
                    : 'text-white'
                  : 'text-gray-900'
              )}
            >
              {track.title}
            </span>
            {badge}
          </div>
          <span
            className={cn(
              'text-[11px] truncate',
              isDark ? 'text-gray-400' : 'text-gray-400'
            )}
          >
            {subtitleOverride ?? `${track.artist} • ${genreDisplay}`}
          </span>
        </div>
      </div>

      {/* Middle: Live Waveform + Time or Duration */}
      <div className="flex-1 max-w-md hidden sm:flex items-center gap-3 px-2">
        {isCurrent ? (
          <div className="w-full flex items-center gap-3">
            <Volume2
              className={cn(
                'h-3.5 w-3.5 shrink-0',
                isDark ? 'text-[#2dd4bf]' : 'text-[#04564f]',
                isTrackPlaying && 'animate-pulse'
              )}
            />
            <div
              onClick={handleWaveformClick}
              className="flex-1 flex items-center gap-[2.5px] h-6 cursor-pointer"
              title="Click to seek"
            >
              {waveformBars.map((bar, bIdx) => {
                const barRatio = bIdx / waveformBars.length;
                const isFilled = barRatio <= progressRatio;
                return (
                  <div
                    key={bIdx}
                    style={{ height: `${Math.max(15, bar * 100)}%` }}
                    className={cn(
                      'w-[2.5px] rounded-full transition-colors',
                      isFilled
                        ? isDark
                          ? 'bg-[#2dd4bf]'
                          : 'bg-[#04564f]'
                        : isDark
                        ? 'bg-white/20 hover:bg-white/35'
                        : 'bg-gray-200 hover:bg-gray-300'
                    )}
                  />
                );
              })}
            </div>
            <span
              className={cn(
                'text-[11px] font-mono font-medium shrink-0 tabular-nums',
                isDark ? 'text-gray-300' : 'text-gray-600'
              )}
            >
              {formatTime(currentTime)} / {formattedTotalDuration}
            </span>
          </div>
        ) : (
          <div className="w-full flex items-center justify-end">
            <span
              className={cn(
                'text-xs font-mono tabular-nums',
                isDark ? 'text-gray-400' : 'text-gray-400'
              )}
            >
              {formattedTotalDuration}
            </span>
          </div>
        )}
      </div>

      {/* Right: Optional custom slot + Actions (Download, Heart, Star/Clock, More) */}
      <div
        className={cn(
          'flex items-center gap-1.5 sm:gap-2 shrink-0',
          isDark ? 'text-gray-400' : 'text-gray-400'
        )}
      >
        {/* Mobile duration indicator */}
        <span className="text-xs font-mono text-gray-400 sm:hidden">
          {formattedTotalDuration}
        </span>

        {rightSlot}

        {/* Download or Locked Download */}
        {isDownloadLocked ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onLockedDownloadClick) onLockedDownloadClick(track, e);
            }}
            title="Download Locked · License Required"
            className={cn(
              'p-1.5 rounded transition-colors cursor-pointer',
              isDark
                ? 'text-gray-500 hover:text-amber-400 hover:bg-amber-400/10'
                : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
            )}
          >
            <Lock className="h-3.5 w-3.5" />
          </button>
        ) : (
          onDownload && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(track, e);
              }}
              title="Download Track"
              className={cn(
                'p-1.5 rounded transition-colors cursor-pointer',
                isDownloading
                  ? 'text-[#2dd4bf] bg-[#2dd4bf]/10 animate-pulse'
                  : isDark
                  ? 'hover:text-white hover:bg-white/10'
                  : 'hover:text-black hover:bg-gray-100'
              )}
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )
        )}

        {/* Heart (Favorite) */}
        {onFavoriteToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(track, e);
            }}
            title={isFavorited ? 'Remove from Favourites' : 'Add to Favourites'}
            className={cn(
              'p-1.5 rounded transition-colors cursor-pointer',
              isFavorited
                ? 'text-red-500 fill-red-500 hover:text-red-600'
                : isDark
                ? 'hover:text-white hover:bg-white/10'
                : 'hover:text-black hover:bg-gray-100'
            )}
          >
            <Heart className={cn('h-3.5 w-3.5', isFavorited && 'fill-current')} />
          </button>
        )}

        {/* Star / Save or Listen Later */}
        {onStarToggle ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStarToggle(track, e);
            }}
            title={isStarred ? 'Saved' : 'Save track'}
            className={cn(
              'p-1.5 rounded transition-colors cursor-pointer',
              isStarred
                ? 'text-amber-400 fill-amber-400 hover:text-amber-500'
                : isDark
                ? 'hover:text-white hover:bg-white/10'
                : 'hover:text-black hover:bg-gray-100'
            )}
          >
            <Star className={cn('h-3.5 w-3.5', isStarred && 'fill-current')} />
          </button>
        ) : onListenLaterToggle ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onListenLaterToggle(track, e);
            }}
            title={isListenLater ? 'Remove from Listen Later' : 'Save to Listen Later'}
            className={cn(
              'p-1.5 rounded transition-colors cursor-pointer',
              isListenLater
                ? isDark
                  ? 'text-[#2dd4bf] bg-[#2dd4bf]/10'
                  : 'text-[#04564f] bg-[#04564f]/10'
                : isDark
                ? 'hover:text-white hover:bg-white/10'
                : 'hover:text-black hover:bg-gray-100'
            )}
          >
            <Clock className="h-3.5 w-3.5" />
          </button>
        ) : null}

        {/* Share (optional) */}
        {onShare && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare(track, e);
            }}
            title="Share track"
            className={cn(
              'p-1.5 rounded transition-colors cursor-pointer',
              isDark ? 'hover:text-white hover:bg-white/10' : 'hover:text-black hover:bg-gray-100'
            )}
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        )}

        {/* More options */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onMoreClick) onMoreClick(track, e);
          }}
          title="More options"
          className={cn(
            'p-1.5 rounded transition-colors cursor-pointer',
            isDark ? 'hover:text-white hover:bg-white/10' : 'hover:text-black hover:bg-gray-100'
          )}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
export const MusicPlayerRow = TrackRow;
