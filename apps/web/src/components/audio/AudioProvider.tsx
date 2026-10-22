'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Beat, LicenseType, CartItem } from '@caution/types';
import { audioSynth } from '@caution/ui';
import { SEEDED_BEATS } from '../../lib/seedBeats';
import { LICENSE_DEFINITIONS } from '@caution/licenses';
import { useUserSubscription, FREE_PREVIEW_LIMIT_SECONDS } from '../../lib/subscription';
import { ArtistAdModal } from './ArtistAdModal';
import { RewardedDownloadModal } from './RewardedDownloadModal';
import { DailyDownloadLimitModal } from './DailyDownloadLimitModal';
import { GuestSignUpPromptModal } from './GuestSignUpPromptModal';
import {
  useDailyDownloadQuota,
  recordBeatDownload,
  DailyDownloadState,
  DAILY_DOWNLOAD_LIMIT,
  MONTHLY_BEAT_ACCESS_LIMIT
} from '../../lib/subscription';

interface AudioContextValue {
  currentBeat: Beat | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Beat[];
  play: (beat: Beat) => void;
  pause: () => void;
  closePlayer: () => void;
  togglePlay: (beat?: Beat) => void;
  seek: (ratio: number) => void;
  setVolume: (v: number) => void;
  next: () => void;
  prev: () => void;
  isNowPlayingPanelOpen: boolean;
  setIsNowPlayingPanelOpen: (open: boolean) => void;

  // Global Cart
  cart: CartItem[];
  addToCart: (beat: Beat, licenseType: LicenseType) => void;
  removeFromCart: (beatId: string, licenseType: LicenseType) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Likes
  likes: string[];
  toggleLike: (beatId: string) => void;

  // Subscription & Registration state
  isSubscribed: boolean;
  isLoggedIn: boolean;
  previewLimitSeconds: number;
  showUpgradePrompt: boolean;
  setShowUpgradePrompt: (show: boolean) => void;
  isSignUpModalOpen: boolean;
  setIsSignUpModalOpen: (open: boolean) => void;

  // Promoted Audio Ads & Rewarded Downloads
  beatsPlayedCount: number;
  isAdModalOpen: boolean;
  setIsAdModalOpen: (open: boolean) => void;
  openRewardedDownload: (beat: Beat) => void;

  // Daily Download Quota & 24h Cooldown
  downloadState: DailyDownloadState;
  isDownloadLimitModalOpen: boolean;
  setIsDownloadLimitModalOpen: (open: boolean) => void;
  openDownloadLimitModal: () => void;
  triggerBeatDownload: (beat: Beat, onApproved?: () => void) => boolean;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [queue, setQueue] = useState<Beat[]>(SEEDED_BEATS);
  const [isNowPlayingPanelOpen, setIsNowPlayingPanelOpen] = useState<boolean>(false);

  // Cart & Likes
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [likes, setLikes] = useState<string[]>(['beat-1', 'beat-2']);

  const { isSubscribed, isLoggedIn } = useUserSubscription();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState<boolean>(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState<boolean>(false);

  // Promoted Audio Ads & Rewarded Downloads
  const [beatsPlayedCount, setBeatsPlayedCount] = useState<number>(0);
  const [isAdModalOpen, setIsAdModalOpen] = useState<boolean>(false);
  const [rewardedDownloadBeat, setRewardedDownloadBeat] = useState<Beat | null>(null);

  const openRewardedDownload = (beat: Beat) => {
    setRewardedDownloadBeat(beat);
  };

  // Daily Download Quota & 24h Cooldown
  const downloadState = useDailyDownloadQuota();
  const [isDownloadLimitModalOpen, setIsDownloadLimitModalOpen] = useState<boolean>(false);

  const openDownloadLimitModal = () => {
    setIsDownloadLimitModalOpen(true);
  };

  const triggerBeatDownload = (beat: Beat, onApproved?: () => void): boolean => {
    if (!downloadState.canDownload) {
      setIsDownloadLimitModalOpen(true);
      return false;
    }
    recordBeatDownload(beat.id, beat.title);
    if (onApproved) {
      onApproved();
    }
    return true;
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthTimerRef = useRef<NodeJS.Timeout | null>(null);

  const duration = currentBeat?.duration_seconds || 180;

  // Initialize Audio element with preview limit handler
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;

      const handleTimeUpdate = () => {
        if (audioRef.current) {
          const t = audioRef.current.currentTime;
          if (!isSubscribed && t >= FREE_PREVIEW_LIMIT_SECONDS) {
            audioRef.current.pause();
            setIsPlaying(false);
            if (!isLoggedIn) {
              setIsSignUpModalOpen(true);
            } else {
              setShowUpgradePrompt(true);
            }
            return;
          }
          setCurrentTime(t);
        }
      };

      const handleEnded = () => {
        next();
      };

      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);

      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, [isSubscribed, isLoggedIn]);

  const play = (beat: Beat) => {
    if (beat.status === 'sold') return; // Cannot stream exclusive sold beat if locked

    // Check 3-song unskippable audio ad threshold (Audiomack / Spotify model: after listening to 3 songs an ad comes in and can't be skipped)
    const nextPlayed = beatsPlayedCount + 1;
    setBeatsPlayedCount(nextPlayed);

    if (!isSubscribed && nextPlayed > 0 && nextPlayed % 3 === 0) {
      setIsAdModalOpen(true);
    }

    setCurrentBeat(beat);
    setIsPlaying(true);
    setCurrentTime(0);

    // Stop synthesizer or previous audio
    if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    audioSynth.stop();

    const limit = isSubscribed ? (beat.duration_seconds || 180) : Math.min(FREE_PREVIEW_LIMIT_SECONDS, beat.duration_seconds || 180);

    if (!isSubscribed && currentTime >= FREE_PREVIEW_LIMIT_SECONDS) {
      setCurrentTime(0);
    }

    // Play with synthetic Web Audio engine or audio element
    audioSynth.playTrack(beat.id, () => {
      setCurrentTime((prev) => {
        if (prev >= limit) {
          audioSynth.stop();
          setIsPlaying(false);
          if (!isLoggedIn) {
            setIsSignUpModalOpen(true);
          } else if (!isSubscribed) {
            setShowUpgradePrompt(true);
          }
          return limit;
        }
        return prev + 0.25;
      });
    }, isSubscribed ? undefined : FREE_PREVIEW_LIMIT_SECONDS);
  };

  const pause = () => {
    setIsPlaying(false);
    audioSynth.stop();
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const closePlayer = () => {
    pause();
    setCurrentBeat(null);
    setCurrentTime(0);
    setIsNowPlayingPanelOpen(false);
  };

  const togglePlay = (beat?: Beat) => {
    const target = beat || currentBeat;
    if (!target) return;

    if (currentBeat?.id === target.id && isPlaying) {
      pause();
    } else {
      play(target);
    }
  };

  const seek = (ratio: number) => {
    const rawTarget = Math.max(0, Math.min(1, ratio)) * duration;
    if (!isSubscribed && rawTarget > FREE_PREVIEW_LIMIT_SECONDS) {
      setCurrentTime(FREE_PREVIEW_LIMIT_SECONDS);
      if (audioRef.current) {
        audioRef.current.currentTime = FREE_PREVIEW_LIMIT_SECONDS;
      }
      audioSynth.stop();
      setIsPlaying(false);
      if (!isLoggedIn) {
        setIsSignUpModalOpen(true);
      } else {
        setShowUpgradePrompt(true);
      }
      return;
    }
    setCurrentTime(rawTarget);
    if (audioRef.current) {
      audioRef.current.currentTime = rawTarget;
    }
  };

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  };

  const next = () => {
    if (!currentBeat || queue.length === 0) return;
    const currentIndex = queue.findIndex((b) => b.id === currentBeat.id);
    const nextIndex = (currentIndex + 1) % queue.length;
    play(queue[nextIndex]);
  };

  const prev = () => {
    if (!currentBeat || queue.length === 0) return;
    const currentIndex = queue.findIndex((b) => b.id === currentBeat.id);
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    play(queue[prevIndex]);
  };

  const addToCart = (beat: Beat, licenseType: LicenseType) => {
    const terms = LICENSE_DEFINITIONS[licenseType];
    const priceCents = terms.defaultPriceNgn; // Stored in Naira for Paystack

    setCart((prev) => {
      const exists = prev.some((item) => item.beat.id === beat.id && item.licenseType === licenseType);
      if (exists) return prev;
      return [...prev, { beat, licenseType, priceCents }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (beatId: string, licenseType: LicenseType) => {
    setCart((prev) => prev.filter((item) => !(item.beat.id === beatId && item.licenseType === licenseType)));
  };

  const clearCart = () => setCart([]);

  const toggleLike = (beatId: string) => {
    setLikes((prev) =>
      prev.includes(beatId) ? prev.filter((id) => id !== beatId) : [...prev, beatId]
    );
  };

  return (
    <AudioContext.Provider
      value={{
        currentBeat,
        isPlaying,
        currentTime,
        duration,
        volume,
        queue,
        play,
        pause,
        closePlayer,
        togglePlay,
        seek,
        setVolume,
        next,
        prev,
        isNowPlayingPanelOpen,
        setIsNowPlayingPanelOpen,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        likes,
        toggleLike,
        isSubscribed,
        isLoggedIn,
        previewLimitSeconds: FREE_PREVIEW_LIMIT_SECONDS,
        showUpgradePrompt,
        setShowUpgradePrompt,
        isSignUpModalOpen,
        setIsSignUpModalOpen,
        beatsPlayedCount,
        isAdModalOpen,
        setIsAdModalOpen,
        openRewardedDownload,
        downloadState,
        isDownloadLimitModalOpen,
        setIsDownloadLimitModalOpen,
        openDownloadLimitModal,
        triggerBeatDownload
      }}
    >
      {children}

      {/* 15-Second Limit Sign Up Modal for Unregistered Guests */}
      <GuestSignUpPromptModal
        isOpen={isSignUpModalOpen}
        onClose={() => setIsSignUpModalOpen(false)}
        beat={currentBeat}
      />

      {/* Promoted Artist Audio Ad Modal (Pops up every 5 beats) */}
      <ArtistAdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
      />

      {/* Rewarded Ad-Supported Beat Download Modal (Stream 2 songs to download 1 beat) */}
      {rewardedDownloadBeat && (
        <RewardedDownloadModal
          beat={rewardedDownloadBeat}
          isOpen={Boolean(rewardedDownloadBeat)}
          onClose={() => setRewardedDownloadBeat(null)}
        />
      )}

      {/* Daily 2-Beat Download Limit & 24hr Cooldown Modal */}
      <DailyDownloadLimitModal
        isOpen={isDownloadLimitModalOpen}
        onClose={() => setIsDownloadLimitModalOpen(false)}
        downloadState={downloadState}
      />
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextValue => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
