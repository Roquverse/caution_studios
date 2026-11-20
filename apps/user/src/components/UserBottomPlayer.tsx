'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  Mic,
  Maximize2
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';

export function UserBottomPlayer() {
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    likedTrackIds,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleLike,
    playNext,
    playPrev,
    shuffle,
    repeat
  } = useAudioPlayer();

  const isLiked = likedTrackIds.includes(currentTrack.id) || Boolean(currentTrack.isLiked);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressRatio = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seek(Math.round(ratio * duration));
  };

  const handleOpenStudio = () => {
    router.push('/studio');
  };

  const handleToggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      document.documentElement.requestFullscreen?.();
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-[72px] bg-[#16181c] border-t border-[#2a2d34] px-3 sm:px-4 z-50 flex items-center">
      {/* MOBILE PLAYER (Viewport < md) */}
      <div className="flex md:hidden w-full items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            onClick={togglePlay}
            className="w-11 h-11 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0 cursor-pointer relative group"
          >
            <img
              src={currentTrack.coverUrl || '/images/artist_studio_mic.jpg'}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              {isPlaying ? <Pause className="h-3.5 w-3.5 text-white fill-white" /> : <Play className="h-3.5 w-3.5 text-white fill-white ml-0.5" />}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-white truncate max-w-[140px]" title={currentTrack.title}>
              {currentTrack.title}
            </p>
            <p className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">
              {currentTrack.artist}
            </p>

            <div className="flex items-center gap-1.5 mt-1 w-full">
              <div
                onClick={handleScrubberClick}
                className="flex-1 h-1 bg-white/15 rounded-full overflow-hidden cursor-pointer relative"
              >
                <div
                  className="h-full bg-[#e53935] transition-all"
                  style={{ width: `${progressRatio}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-gray-400 shrink-0 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 pl-1">
          <button
            type="button"
            onClick={playPrev}
            className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Previous track"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#f2f2f2] text-black flex items-center justify-center cursor-pointer shadow-sm"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={playNext}
            className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Next track"
          >
            <SkipForward className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => toggleLike(currentTrack.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            aria-label="Favorite"
          >
            <Heart
              className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* DESKTOP PLAYER (Viewport >= md) */}
      <div className="hidden md:flex w-full items-center justify-between gap-6">
        {/* Left: Artwork + Title + Producer */}
        <div className="flex items-center gap-3 w-64 shrink-0 min-w-0">
          <div
            className="w-12 h-12 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0 relative group cursor-pointer"
            onClick={togglePlay}
          >
            <img
              src={currentTrack.coverUrl || '/images/artist_studio_mic.jpg'}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-white text-white" />
              ) : (
                <Play className="h-4 w-4 fill-white text-white ml-0.5" />
              )}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-white truncate" title={currentTrack.title}>
              {currentTrack.title}
            </p>
            <p className="text-[11px] text-gray-400 truncate mt-0.5">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Center: Controls + Red Waveform / Scrubber */}
        <div className="flex-1 max-w-2xl flex flex-col items-center gap-1.5 min-w-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={shuffle}
              className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={playPrev}
              className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Previous track"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-white hover:bg-[#e0e0e0] text-black flex items-center justify-center transition-transform hover:scale-105 shadow-md shadow-white/20 cursor-pointer"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current" />
              ) : (
                <Play className="h-4 w-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={playNext}
              className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Next track"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={repeat}
              className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Repeat track"
            >
              <Repeat className="h-4 w-4" />
            </button>
          </div>

          {/* Bottom scrubber row */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] font-mono text-gray-400 w-8 text-right shrink-0 tabular-nums">
              {formatTime(currentTime)}
            </span>

            <div
              onClick={handleScrubberClick}
              className="flex-1 h-3 flex items-center cursor-pointer relative group"
            >
              <div className="w-full h-1 bg-[#262833] rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-[#e53935] rounded-full transition-all"
                  style={{ width: `${progressRatio}%` }}
                />
              </div>
            </div>

            <span className="text-[10px] font-mono text-gray-400 w-8 shrink-0 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Volume + Red Slider + Studio + Maximize */}
        <div className="flex items-center gap-3 w-64 justify-end shrink-0">
          <button
            type="button"
            onClick={() => toggleLike(currentTrack.id)}
            className="p-1.5 text-gray-400 hover:text-[#e53935] transition-colors cursor-pointer"
            title="Add to Favorites"
          >
            <Heart
              className={`h-4 w-4 ${isLiked ? 'fill-[#e53935] text-[#e53935]' : ''}`}
            />
          </button>

          <div className="flex items-center gap-2 text-gray-400">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
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
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume slider"
              className="w-20 h-1 bg-white/20 rounded-lg accent-[#e53935] cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenStudio}
            className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Open Record Studio"
          >
            <Mic className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  );
}
