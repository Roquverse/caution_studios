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
  const [beatsPlayedSinceLastAd, setBeatsPlayedSinceLastAd] = useState<number>(0);
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

  const pendingDownloadBeatRef = useRef<Beat | null>(null);
  const nextAdTriggerRef = useRef<number>(Math.floor(Math.random() * 3) + 2); // Random Spotify threshold: 2, 3, or 4 beats

  const triggerBeatDownload = (beat: Beat, onApproved?: () => void): boolean => {
    if (!downloadState.canDownload) {
      pendingDownloadBeatRef.current = beat;
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
  const pendingBeatRef = useRef<Beat | null>(null);

  const duration = currentBeat?.duration_seconds || 180;

  // Initialize Audio element (full-length playback)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;

      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
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

  const executePlayBeat = (beat: Beat) => {
    const isDifferentBeat = !currentBeat || currentBeat.id !== beat.id;
    setCurrentBeat(beat);
    setIsPlaying(true);
    if (isDifferentBeat) {
      setCurrentTime(0);
    }

    // Stop synthesizer or previous audio
    if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    audioSynth.stop();

    const limit = beat.duration_seconds || 180;

    // Determine audio URL from storage or beat properties (prioritize preview keys over heavy master WAV)
    const audioKey = beat.preview_clean_key || beat.preview_tagged_key || beat.audio_url || beat.master_wav_key;
    const r2Cdn = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, '') || 'https://media.cautionstudioz.com';
    const resolvedUrl = audioKey ? (audioKey.startsWith('/') || audioKey.startsWith('http') ? audioKey : `${r2Cdn}/${audioKey}`) : null;

    if (resolvedUrl && audioRef.current) {
      if (audioRef.current.src !== resolvedUrl && !audioRef.current.src.endsWith(resolvedUrl)) {
        audioRef.current.src = resolvedUrl;
        audioRef.current.load();
      }
      audioRef.current.volume = volume;
      audioRef.current.play().catch((err) => {
        console.warn('Audio playback error, falling back to synth:', err);
        // Fallback to synth if browser blocks autoplay or format error
        audioSynth.playTrack(beat.id, () => {
          setCurrentTime((prev) => {
            if (prev >= limit) {
              audioSynth.stop();
              setIsPlaying(false);
              return limit;
            }
            return prev + 0.25;
          });
        });
      });
    } else {
      // Play with synthetic Web Audio engine if no audio key exists
      audioSynth.playTrack(beat.id, () => {
        setCurrentTime((prev) => {
          if (prev >= limit) {
            audioSynth.stop();
            setIsPlaying(false);
            return limit;
          }
          return prev + 0.25;
        });
      });
    }
  };

  const play = (beat: Beat) => {
    if (beat.status === 'sold') return; // Cannot stream exclusive sold beat if locked

    // Spotify-like audio ad: first 15 seconds unskippable, random trigger after playing 2 or more beats
    if (!isSubscribed) {
      const nextPlayed = beatsPlayedSinceLastAd + 1;
      setBeatsPlayedSinceLastAd(nextPlayed);
      setBeatsPlayedCount((prev) => prev + 1);

      if (nextPlayed >= 2 && nextPlayed >= nextAdTriggerRef.current) {
        // Reset and re-roll next ad trigger threshold (between 2 and 4 beats)
        setBeatsPlayedSinceLastAd(0);
        nextAdTriggerRef.current = Math.floor(Math.random() * 3) + 2;

        pause();
        pendingBeatRef.current = beat;
        setIsAdModalOpen(true);
        return; // DO NOT PLAY THE INTENDED BEAT! THE AD PLAYS INSTEAD!
      }
    }

    executePlayBeat(beat);
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

    if (currentBeat?.id === target.id) {
      if (isPlaying) {
        pause();
      } else {
        setIsPlaying(true);
        if (audioRef.current && audioRef.current.src) {
          audioRef.current.play().catch(() => play(target));
        } else {
          play(target);
        }
      }
    } else {
      play(target);
    }
  };

  const seek = (ratio: number) => {
    const rawTarget = Math.max(0, Math.min(1, ratio)) * duration;
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

      {/* Promoted Artist Audio Ad Modal (Spotify 15s unskippable ad mode) */}
      <ArtistAdModal
        isOpen={isAdModalOpen}
        pendingDownloadTitle={pendingDownloadBeatRef.current?.title || null}
        onClose={() => {
          setIsAdModalOpen(false);
          // 1. If ad was listened to in order to unlock a beat download:
          if (pendingDownloadBeatRef.current) {
            const beatToDownload = pendingDownloadBeatRef.current;
            pendingDownloadBeatRef.current = null;
            recordBeatDownload(beatToDownload.id, beatToDownload.title);

            // Initiate browser file download directly from Cloudflare R2 CDN (aligns with Vercel Fast limits)
            const r2Cdn = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, '') || 'https://media.cautionstudioz.com';
            const audioKey = beatToDownload.preview_clean_key || beatToDownload.audio_url || beatToDownload.master_wav_key || `masters/${beatToDownload.id}.wav`;
            const downloadUrl = audioKey.startsWith('http') ? audioKey : `${r2Cdn}/${audioKey}`;
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${beatToDownload.title || 'beat'} - Caution Studio.wav`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
          // 2. If ad was triggered by playing music:
          else if (pendingBeatRef.current) {
            const beatToResume = pendingBeatRef.current;
            pendingBeatRef.current = null;
            executePlayBeat(beatToResume);
          }
        }}
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
        pendingBeatTitle={pendingDownloadBeatRef.current?.title}
        onWatchAd={() => {
          setIsDownloadLimitModalOpen(false);
          setIsAdModalOpen(true);
        }}
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
