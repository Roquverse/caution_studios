'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  X,
  Disc3
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
  const pathname = usePathname();
  const [isDismissed, setIsDismissed] = useState(false);

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
    closePlayer,
    setIsNowPlayingPanelOpen,
    isNowPlayingPanelOpen,
    likes,
    toggleLike,
    addToCart,
    isSubscribed,
    showUpgradePrompt,
    setShowUpgradePrompt
  } = useAudio();

  // Reset dismissal whenever a new beat starts playing
  useEffect(() => {
    if (isPlaying) {
      setIsDismissed(false);
    }
  }, [isPlaying, currentBeat?.id]);

  // 1. Exclude from Auth and Checkout pages
  const isExcludedPage =
    pathname?.startsWith('/sign-in') ||
    pathname?.startsWith('/sign-up') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/forgot-password') ||
    pathname?.startsWith('/checkout');

  if (isExcludedPage) return null;

  // 2. Only show up when music has been selected/played and is not dismissed
  if (!currentBeat || isDismissed) return null;

  const progress = duration > 0 ? currentTime / duration : 0;
  const isLiked = likes.includes(currentBeat.id);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (closePlayer) {
      closePlayer();
    }
  };

  // Hero strip variant (embedded inside landing page hero if invoked)
  if (variant === 'hero-strip') {
    return (
      <div className="w-full bg-[#0F131C] border border-white/10 rounded-[6px] p-3.5 flex items-center gap-4">
        <PlayButton
          status={currentBeat.status}
          isPlaying={isPlaying}
          onClick={() => togglePlay(currentBeat)}
          size="sm"
        />

        <div className="flex items-center gap-3 min-w-0 w-44">
          <div className="w-9 h-9 rounded-[4px] overflow-hidden bg-black/40 border border-white/10 shrink-0">
            {currentBeat.cover_url && (
              <img src={currentBeat.cover_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">{currentBeat.title}</div>
            <div className="text-[11px] text-gray-400 truncate">
              {currentBeat.producer?.display_name || 'Caution Studio'}
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-3">
          <span className="text-[11px] font-mono text-gray-400 w-9 text-right shrink-0">
            {formatTime(currentTime)}
          </span>
          <Waveform
            peaks={currentBeat.waveform_peaks}
            progress={progress}
            onSeek={seek}
            height={24}
          />
          <span className="text-[11px] font-mono text-gray-400 w-9 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => addToCart(currentBeat, 'basic')}
          className="shrink-0 h-8 px-3 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white text-xs font-medium border-0 cursor-pointer transition-colors"
        >
          Lease {formatNaira(3000)}
        </button>
      </div>
    );
  }

  // 3. Floating Navigation Capsule (Spotify / Dynamic Island style dock)
  return (
    <aside
      aria-label="Floating audio navigation player"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl bg-[#0A0D14]/95 backdrop-blur-xl border border-white/[0.12] rounded-full px-4 sm:px-6 py-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] select-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      {/* Floating 15-second preview prompt */}
      {showUpgradePrompt && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#121316] border border-[#2dd4bf]/40 px-3.5 py-1 rounded-full text-[11px] font-medium text-white shadow-xl flex items-center gap-2 whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 z-50">
          <span className="text-amber-300 font-mono">15s preview ended</span>
          <Link href="/subscriptions" className="text-[#2dd4bf] hover:underline font-bold uppercase tracking-wider text-[10px]">
            Upgrade to Plus →
          </Link>
          <button
            type="button"
            onClick={() => setShowUpgradePrompt(false)}
            className="text-gray-400 hover:text-white ml-1 p-0.5 cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Beat Artwork & Info */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink-0">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-black/60 border border-white/20 shrink-0 flex items-center justify-center">
            {currentBeat.cover_url ? (
              <img
                src={currentBeat.cover_url}
                alt=""
                className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_12s_linear_infinite]' : ''}`}
              />
            ) : (
              <Disc3 className="h-5 w-5 text-gray-400" />
            )}
          </div>

          <div className="min-w-0 max-w-[100px] xs:max-w-[130px] sm:max-w-[180px]">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/beats/${currentBeat.slug}`}
                className="text-xs font-bold text-white truncate hover:text-[#2dd4bf] block transition-colors leading-tight"
              >
                {currentBeat.title}
              </Link>
              {!isSubscribed && (
                <Link
                  href="/subscriptions"
                  className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors shrink-0"
                  title="Free preview is limited to 15 seconds"
                >
                  15s
                </Link>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono truncate mt-0.5">
              <span className="truncate">{currentBeat.producer?.display_name || 'Caution'}</span>
              <span>·</span>
              <span className="text-[#2dd4bf] shrink-0">{currentBeat.bpm} BPM</span>
            </div>
          </div>

          {/* Like Heart */}
          <button
            type="button"
            onClick={() => toggleLike(currentBeat.id)}
            className={`p-1 rounded-full hover:text-white transition-colors shrink-0 ${
              isLiked ? 'text-[#2dd4bf]' : 'text-gray-400'
            }`}
            aria-label="Like beat"
          >
            <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center: Playback Controls & Waveform */}
        <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 min-w-0 max-w-xl">
          <button
            type="button"
            onClick={prev}
            className="p-1 text-gray-400 hover:text-white rounded-full transition-colors hidden sm:block shrink-0"
            aria-label="Previous beat"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          {/* Green Circle Play / Pause */}
          <PlayButton
            status={currentBeat.status}
            isPlaying={isPlaying}
            onClick={() => togglePlay(currentBeat)}
            size="sm"
          />

          <button
            type="button"
            onClick={next}
            className="p-1 text-gray-400 hover:text-white rounded-full transition-colors hidden sm:block shrink-0"
            aria-label="Next beat"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          {/* Time Elapsed */}
          <span className="text-[10px] font-mono text-gray-400 w-8 text-right shrink-0 hidden md:block">
            {formatTime(currentTime)}
          </span>

          {/* Interactive Waveform Bar */}
          <div className="flex-1 min-w-[80px] sm:min-w-[120px] max-w-[280px]">
            <Waveform
              peaks={currentBeat.waveform_peaks}
              progress={progress}
              onSeek={seek}
              height={22}
            />
          </div>

          {/* Total Duration */}
          <span className="text-[10px] font-mono text-gray-400 w-8 shrink-0 hidden md:block">
            {!isSubscribed ? '0:15' : formatTime(duration)}
          </span>
        </div>

        {/* Right: Actions, Volume & Close Floating Bar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Volume Slider (Desktop) */}
          <div className="hidden lg:flex items-center gap-1 text-gray-400">
            <button
              type="button"
              onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
              className="p-1 hover:text-white transition-colors"
              aria-label="Volume toggle"
            >
              {volume === 0 ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-14 h-1 bg-white/20 rounded-lg accent-[#2dd4bf] cursor-pointer"
            />
          </div>

          {/* Quick License CTA */}
          <button
            type="button"
            onClick={() => addToCart(currentBeat, 'basic')}
            className="h-7 sm:h-8 px-2.5 sm:px-3.5 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer border-0 shadow-none shrink-0"
          >
            <ShoppingBag className="h-3 w-3" />
            <span className="hidden xs:inline">Lease</span>
            <span>{formatNaira(3000)}</span>
          </button>

          {/* Expand Details Modal */}
          <button
            type="button"
            onClick={() => setIsNowPlayingPanelOpen(!isNowPlayingPanelOpen)}
            className="p-1 sm:p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/[0.06] transition-colors hidden sm:block"
            aria-label="Toggle details panel"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {/* Close Floating Navigation Dock */}
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 sm:p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-white/[0.08] transition-colors ml-0.5"
            aria-label="Close player"
            title="Close floating player"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
