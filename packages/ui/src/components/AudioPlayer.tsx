'use client';

import React, { useState } from 'react';
import { Track } from '@caution/types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Heart,
  Repeat,
  Shuffle,
  X
} from 'lucide-react';
import { WaveformVisualizer } from './WaveformVisualizer';
import { cn } from '../utils/cn';

export interface AudioPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  onPlayToggle: () => void;
  onSeek: (ratio: number) => void;
  onNext?: () => void;
  onPrev?: () => void;
  onClose?: () => void;
  onDownload?: (track: Track) => void;
  onFavoriteToggle?: (track: Track) => void;
  isFavorited?: boolean;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  onPlayToggle,
  onSeek,
  onNext,
  onPrev,
  onClose,
  onDownload,
  onFavoriteToggle,
  isFavorited = false,
  className
}) => {
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);

  if (!currentTrack) return null;

  const progress = currentTrack.duration > 0 ? Math.min(1, currentTime / currentTrack.duration) : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/80 bg-white/95 backdrop-blur-md px-4 py-3 shadow-2xl transition-all duration-300',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Track Information */}
        <div className="flex items-center gap-3 w-full md:w-1/4 min-w-0">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 shadow-sm border border-gray-200/50">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-gray-900 truncate">
              {currentTrack.title}
            </span>
            <span className="text-xs text-gray-500 truncate">
              {currentTrack.artist} • {currentTrack.genre[0]}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onFavoriteToggle && onFavoriteToggle(currentTrack)}
            aria-label="Add to favorites"
            className={cn(
              'ml-1 p-1.5 rounded-full hover:bg-gray-100 transition-colors',
              isFavorited ? 'text-rose-500' : 'text-gray-400 hover:text-gray-700'
            )}
          >
            <Heart className={cn('h-4 w-4', isFavorited && 'fill-rose-500')} />
          </button>
        </div>

        {/* Center: Controls & Waveform scrubber */}
        <div className="flex flex-col items-center gap-1.5 w-full md:w-2/4 max-w-xl">
          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsShuffle(!isShuffle)}
              aria-label="Shuffle"
              className={cn(
                'text-xs p-1.5 rounded-full hover:bg-gray-100 transition-colors',
                isShuffle ? 'text-black font-bold' : 'text-gray-400'
              )}
            >
              <Shuffle className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous track"
              className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
            >
              <SkipBack className="h-4 w-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={onPlayToggle}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#04564f] text-white shadow-md hover:bg-[#03453f] hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-white" />
              ) : (
                <Play className="h-5 w-5 fill-white ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              aria-label="Next track"
              className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
            >
              <SkipForward className="h-4 w-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={() => setIsRepeat(!isRepeat)}
              aria-label="Repeat"
              className={cn(
                'text-xs p-1.5 rounded-full hover:bg-gray-100 transition-colors',
                isRepeat ? 'text-black font-bold' : 'text-gray-400'
              )}
            >
              <Repeat className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Scrubber + Time */}
          <div className="w-full flex items-center gap-2.5">
            <span className="text-[11px] font-mono text-gray-500 w-9 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1">
              <WaveformVisualizer
                waveform={currentTrack.waveform}
                progress={progress}
                isPlaying={isPlaying}
                onSeek={onSeek}
                height={20}
              />
            </div>
            <span className="text-[11px] font-mono text-gray-500 w-9">
              {currentTrack.formattedDuration}
            </span>
          </div>
        </div>

        {/* Right: Volume & Action */}
        <div className="flex items-center justify-end gap-3 w-full md:w-1/4">
          {/* Volume slider */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="text-gray-500 hover:text-gray-800"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="h-1.5 w-16 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#04564f]"
            />
          </div>

          {/* Download button */}
          <button
            type="button"
            onClick={() => onDownload && onDownload(currentTrack)}
            title="Download track"
            aria-label="Download track"
            className="flex items-center gap-1.5 bg-[#04564f] hover:bg-[#03453f] text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>

          {/* Close player */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close audio player"
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
