'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Beat, LicenseType, CartItem } from '@caution/types';
import { audioSynth } from '@caution/ui';
import { SEEDED_BEATS } from '../../lib/seedBeats';
import { LICENSE_DEFINITIONS } from '@caution/licenses';

interface AudioContextValue {
  currentBeat: Beat | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Beat[];
  play: (beat: Beat) => void;
  pause: () => void;
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
}

const AudioContext = createContext<AudioContextValue | null>(null);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(SEEDED_BEATS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.8);
  const [queue, setQueue] = useState<Beat[]>(SEEDED_BEATS);
  const [isNowPlayingPanelOpen, setIsNowPlayingPanelOpen] = useState<boolean>(false);

  // Cart & Likes
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [likes, setLikes] = useState<string[]>(['beat-1', 'beat-2']);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthTimerRef = useRef<NodeJS.Timeout | null>(null);

  const duration = currentBeat?.duration_seconds || 180;

  // Initialize Audio element
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
  }, []);

  const play = (beat: Beat) => {
    if (beat.status === 'sold') return; // Cannot stream exclusive sold beat if locked

    setCurrentBeat(beat);
    setIsPlaying(true);
    setCurrentTime(0);

    // Stop synthesizer or previous audio
    if (synthTimerRef.current) clearInterval(synthTimerRef.current);
    audioSynth.stop();

    // Play with synthetic Web Audio engine or audio element
    audioSynth.playTrack(beat.id, () => {
      setCurrentTime((prev) => {
        if (prev >= (beat.duration_seconds || 180)) {
          audioSynth.stop();
          setIsPlaying(false);
          return 0;
        }
        return prev + 0.25;
      });
    });
  };

  const pause = () => {
    setIsPlaying(false);
    audioSynth.stop();
    if (audioRef.current) {
      audioRef.current.pause();
    }
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
    const targetTime = Math.max(0, Math.min(1, ratio)) * duration;
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
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
        toggleLike
      }}
    >
      {children}
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
