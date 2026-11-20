'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { TrackItem } from '../types/tracks';

export const DEFAULT_PLAYER_TRACK: TrackItem = {
  id: 'holy-default-track',
  title: 'Holy',
  artist: 'Olajide Samuel Ojo',
  duration: '3:00',
  durationSeconds: 180,
  coverUrl: '/images/artist_studio_mic.jpg',
  audioUrl: 'https://media.cautionstudioz.com/masters/holy_instrumental.mp3',
  isFree: true,
  genre: 'Afrobeats',
  bpm: 110,
  musicalKey: 'F Minor'
};

interface AudioPlayerContextType {
  currentTrack: TrackItem;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  likedTrackIds: string[];
  playlist: TrackItem[];
  playTrack: (track: TrackItem) => void;
  togglePlay: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleLike: (trackId: string) => void;
  playNext: () => void;
  playPrev: () => void;
  shuffle: () => void;
  repeat: () => void;
  setPlaylist: (tracks: TrackItem[]) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<TrackItem>(DEFAULT_PLAYER_TRACK);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [likedTrackIds, setLikedTrackIds] = useState<string[]>([]);
  const [playlist, setPlaylist] = useState<TrackItem[]>([DEFAULT_PLAYER_TRACK]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Restore favorites & last track from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedLikes = localStorage.getItem('caution_favorites');
      if (storedLikes) {
        setLikedTrackIds(JSON.parse(storedLikes));
      }
      const storedVol = localStorage.getItem('caution_volume');
      if (storedVol) {
        const parsed = parseFloat(storedVol);
        if (!isNaN(parsed)) setVolumeState(parsed);
      }
      const storedTrack = localStorage.getItem('caution_last_track');
      if (storedTrack) {
        const parsed = JSON.parse(storedTrack);
        if (parsed?.id && parsed?.title) {
          setCurrentTrack(parsed);
          setDuration(parsed.durationSeconds || 180);
        }
      }
    } catch (e) {
      console.warn('AudioPlayerProvider storage load error:', e);
    }
  }, []);

  // Update audio volume when volume/mute state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const playTrack = (track: TrackItem) => {
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(track.durationSeconds || 180);

    try {
      localStorage.setItem('caution_last_track', JSON.stringify(track));
    } catch {}

    const targetSrc = track.audioUrl || track.masterUrl || track.previewCleanUrl || '';
    if (audioRef.current) {
      if (targetSrc) {
        audioRef.current.src = targetSrc;
        audioRef.current.load();
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Audio play request failed:', err);
            setIsPlaying(true); // show UI as playing
          });
      } else {
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) {
      setIsPlaying(!isPlaying);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const targetSrc = currentTrack.audioUrl || currentTrack.masterUrl || currentTrack.previewCleanUrl || '';
      if (targetSrc && (!audioRef.current.src || !audioRef.current.src.includes(targetSrc))) {
        audioRef.current.src = targetSrc;
        audioRef.current.load();
      }
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(true));
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const seek = (seconds: number) => {
    const clamped = Math.max(0, Math.min(duration || 180, seconds));
    setCurrentTime(clamped);
    if (audioRef.current) {
      audioRef.current.currentTime = clamped;
    }
  };

  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    setIsMuted(false);
    try {
      localStorage.setItem('caution_volume', clamped.toString());
    } catch {}
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleLike = (trackId: string) => {
    setLikedTrackIds((prev) => {
      const next = prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId];
      try {
        localStorage.setItem('caution_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const playNext = () => {
    if (!playlist.length) return;
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    if (playlist[nextIndex]) {
      playTrack(playlist[nextIndex]);
    }
  };

  const playPrev = () => {
    if (currentTime > 3) {
      seek(0);
      return;
    }
    if (!playlist.length) return;
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    if (playlist[prevIndex]) {
      playTrack(playlist[prevIndex]);
    }
  };

  const shuffle = () => {
    if (!playlist.length) return;
    const randomIndex = Math.floor(Math.random() * playlist.length);
    if (playlist[randomIndex]) {
      playTrack(playlist[randomIndex]);
    }
  };

  const repeat = () => {
    seek(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        likedTrackIds,
        playlist,
        playTrack,
        togglePlay,
        pause,
        seek,
        setVolume,
        toggleMute,
        toggleLike,
        playNext,
        playPrev,
        shuffle,
        repeat,
        setPlaylist
      }}
    >
      {/* Real HTML5 Audio Element mounted once at root, survives page navigation */}
      <audio
        ref={audioRef}
        preload="metadata"
        controlsList="nodownload noplaybackrate"
        onTimeUpdate={(e) => {
          setCurrentTime(Math.floor(e.currentTarget.currentTime));
        }}
        onLoadedMetadata={(e) => {
          if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
            setDuration(Math.floor(e.currentTarget.duration));
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          playNext();
        }}
        onError={() => {
          // Keep state resilient
        }}
      />
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
