'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PromotedArtistSong, SEEDED_PROMOTED_SONGS } from '../../lib/seedBeats';
import { audioSynth } from '@caution/ui';
import {
  X,
  Volume2,
  VolumeX,
  ExternalLink,
  Sparkles,
  Music2,
  Play,
  Pause
} from 'lucide-react';

interface ArtistAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  promotedSong?: PromotedArtistSong;
}

export const ArtistAdModal: React.FC<ArtistAdModalProps> = ({
  isOpen,
  onClose,
  promotedSong
}) => {
  const [currentSong, setCurrentSong] = useState<any>(promotedSong || SEEDED_PROMOTED_SONGS[0]);
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [canSkip, setCanSkip] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      audioSynth.stop();
      return;
    }

    setSecondsRemaining(15);
    setCanSkip(false);
    setIsPlaying(true);

    async function loadDynamicAd() {
      try {
        const res = await fetch('/api/ads/active');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.ads) && data.ads.length > 0) {
            const randomPick = data.ads[Math.floor(Math.random() * data.ads.length)];
            const formatted = {
              id: randomPick.id,
              title: randomPick.song_title,
              artist_name: randomPick.artist_name,
              genre: randomPick.genre || 'Afrobeats',
              cover_url: randomPick.cover_url || '/images/hero_boombox.jpg',
              audio_url: randomPick.audio_url || null,
              tagline: randomPick.campaign_name || `Stream "${randomPick.song_title}" out now on all major DSPs!`,
              streaming_links: {
                spotify: randomPick.spotify_url || 'https://open.spotify.com',
                apple_music: randomPick.apple_music_url || 'https://music.apple.com',
                audiomack: randomPick.audiomack_url || 'https://audiomack.com',
                youtube: randomPick.youtube_url || 'https://youtube.com'
              }
            };
            setCurrentSong(formatted);

            // Send impression telemetry
            fetch('/api/ads/impression', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ campaignId: randomPick.id })
            }).catch(() => {});

            // Always play the actual ad commercial audio (not the user's intended song)
            const adAudioSrc = randomPick.audio_url || 'https://media.cautionstudioz.com/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3';
            const audio = new Audio(adAudioSrc);
            audioRef.current = audio;
            audio.volume = 0.85;
            audio.play()
              .then(() => {
                setIsPlaying(true);
              })
              .catch((e) => {
                console.warn('Ad audio autoplay blocked by browser policy:', e);
                setIsPlaying(false);
              });
            return;
          }
        }
      } catch (err) {
        console.warn('Could not load dynamic ad for web:', err);
      }

      // Fallback commercial audio if dynamic API fails
      try {
        const fallbackAudio = new Audio('https://media.cautionstudioz.com/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3');
        audioRef.current = fallbackAudio;
        fallbackAudio.volume = 0.85;
        fallbackAudio.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            setIsPlaying(false);
          });
      } catch (e) {
        console.warn('Fallback ad audio failed:', e);
      }
    }

    loadDynamicAd();

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      audioSynth.stop();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!canSkip && secondsRemaining > 0) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    audioSynth.stop();
    onClose();
  };

  const toggleAudio = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioSynth.stop();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      } else {
        audioSynth.playTrack(currentSong.id, () => {}, secondsRemaining);
      }
      setIsPlaying(true);
    }
  };

  const handleDspClick = () => {
    if (currentSong?.id) {
      fetch('/api/ads/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: currentSong.id })
      }).catch(() => {});
    }
  };

  const progressPct = ((15 - secondsRemaining) / 15) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0B0E14] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative text-white">
        {/* Top Header Tag */}
        <div className="px-4 py-2.5 bg-[#0F131C] border-b border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Caution Ad Spotlight · 3-Song Interstitial</span>
          </div>

          <div className="flex items-center gap-2">
            {canSkip ? (
              <button
                type="button"
                onClick={handleClose}
                className="px-2.5 py-0.5 rounded-full bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Continue</span>
                <X className="h-3 w-3 stroke-[2.5]" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-mono font-bold">
                <span>Ad: 0:{secondsRemaining.toString().padStart(2, '0')}</span>
                <span className="text-[10px] text-amber-400/80 font-sans">· Cannot skip</span>
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-[#2dd4bf] transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Artwork & Details */}
        <div className="p-6 text-center flex flex-col items-center">
          <div className="relative w-36 h-36 rounded-lg overflow-hidden shadow-2xl border border-white/10 mb-4 group">
            <img
              src={currentSong.cover_url || '/images/hero_boombox.jpg'}
              alt={currentSong.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer ${
                  isPlaying ? 'bg-[#04564f]/95 hover:bg-[#04564f] text-white' : 'bg-amber-400 text-black ring-4 ring-amber-400/30 animate-pulse'
                }`}
                aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5 fill-current" />}
              </button>
              {!isPlaying && (
                <span className="text-[10px] font-bold text-amber-300 bg-black/80 px-2.5 py-0.5 rounded-full border border-amber-400/40 shadow">
                  Tap to Play Audio
                </span>
              )}
            </div>
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-white">
              {secondsRemaining}s
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-amber-300 mb-1.5 uppercase">
            {currentSong.genre || 'Afrobeats'}
          </span>
          <h3 className="text-lg font-black text-white tracking-tight">{currentSong.title}</h3>
          <p className="text-xs text-gray-400 font-medium mt-0.5">by {currentSong.artist_name}</p>
          <p className="text-xs text-gray-300 mt-2 max-w-xs leading-relaxed italic">
            &ldquo;{currentSong.tagline}&rdquo;
          </p>

          {/* Streaming DSP Links */}
          <div className="w-full mt-6 pt-5 border-t border-white/10">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2.5">
              Stream Full Track on DSPs:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={currentSong.streaming_links?.spotify || 'https://open.spotify.com'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDspClick}
                className="h-9 px-3 rounded-md bg-[#1DB954]/15 hover:bg-[#1DB954]/25 border border-[#1DB954]/40 text-[#1DB954] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Spotify</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={currentSong.streaming_links?.apple_music || 'https://music.apple.com'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDspClick}
                className="h-9 px-3 rounded-md bg-[#FC3C44]/15 hover:bg-[#FC3C44]/25 border border-[#FC3C44]/40 text-[#FC3C44] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Apple Music</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={currentSong.streaming_links?.audiomack || 'https://audiomack.com'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDspClick}
                className="h-9 px-3 rounded-md bg-[#FFA200]/15 hover:bg-[#FFA200]/25 border border-[#FFA200]/40 text-[#FFA200] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Audiomack</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={currentSong.streaming_links?.youtube || 'https://youtube.com'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDspClick}
                className="h-9 px-3 rounded-md bg-[#FF0000]/15 hover:bg-[#FF0000]/25 border border-[#FF0000]/40 text-[#FF0000] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>YouTube</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0F131C] border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
          <span className="font-mono text-[10px]">Plays every 3 songs · Cannot be skipped</span>
          {canSkip ? (
            <button
              type="button"
              onClick={handleClose}
              className="text-[#2dd4bf] hover:underline font-bold cursor-pointer"
            >
              Resume Music →
            </button>
          ) : (
            <span className="text-[10px] text-zinc-500">
              Caution Plus users get 100% ad-free
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
