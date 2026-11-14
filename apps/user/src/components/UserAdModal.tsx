'use client';

import React, { useState, useEffect, useRef } from 'react';
import { audioSynth } from '@caution/ui';
import {
  Sparkles,
  ExternalLink,
  Play,
  Pause,
  X,
  Lock,
  Download,
  Gift,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { grantBonusDownload } from '../lib/downloadQuota';

interface UserAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardEarned?: (newBonusCount: number) => void;
  pendingDownloadTitle?: string | null;
}

interface ActiveAd {
  id: string;
  song_title: string;
  artist_name: string;
  campaign_name?: string;
  cover_url?: string;
  audio_url?: string;
  genre?: string;
  spotify_url?: string;
  apple_music_url?: string;
  audiomack_url?: string;
  youtube_url?: string;
}

const R2_CDN = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/$/, '') || 'https://media.cautionstudioz.com';

/**
 * Resolves media URLs directly to Cloudflare R2 CDN to strictly align with Vercel Fast limits
 * (guarantees zero Vercel Fast Origin Data Transfer usage for ads).
 */
export function resolveDirectCdnUrl(url?: string | null): string {
  if (!url) return `${R2_CDN}/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3`;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (url.includes('/api/media/')) {
      const key = url.split('/api/media/')[1]?.split('?')[0];
      if (key) return `${R2_CDN}/${key}`;
    }
    return url;
  }
  if (url.startsWith('/api/media/')) {
    const key = url.replace('/api/media/', '').split('?')[0];
    return `${R2_CDN}/${key}`;
  }
  if (url.startsWith('/')) return url;
  return `${R2_CDN}/${url}`;
}

const DEFAULT_AD: ActiveAd = {
  id: 'promo-default-1',
  song_title: 'Midnight Lagos',
  artist_name: 'Teniola Sound',
  campaign_name: 'Stream the new breakout single "Midnight Lagos" out on all DSPs now!',
  genre: 'Afro-Soul',
  cover_url: '/images/artist_studio_mic.jpg',
  audio_url: `${R2_CDN}/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3`,
  spotify_url: 'https://open.spotify.com',
  apple_music_url: 'https://music.apple.com',
  audiomack_url: 'https://audiomack.com',
  youtube_url: 'https://youtube.com'
};

export const UserAdModal: React.FC<UserAdModalProps> = ({
  isOpen,
  onClose,
  onRewardEarned,
  pendingDownloadTitle
}) => {
  const [activeAd, setActiveAd] = useState<ActiveAd>(DEFAULT_AD);
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [canSkip, setCanSkip] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [rewardAwarded, setRewardAwarded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const rewardGrantedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const awardReward = () => {
    if (rewardGrantedRef.current) return;
    rewardGrantedRef.current = true;
    setRewardAwarded(true);
    const updated = grantBonusDownload(1);
    if (onRewardEarned) {
      onRewardEarned(updated.bonus);
    }
  };

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
    setRewardAwarded(false);
    rewardGrantedRef.current = false;

    // Fetch randomized active ad
    async function loadActiveAd() {
      try {
        const res = await fetch('/api/ads/active');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.ads) && data.ads.length > 0) {
            // True random ad selection
            const randomPick = data.ads[Math.floor(Math.random() * data.ads.length)];
            setActiveAd(randomPick);

            // Track impression
            fetch('/api/ads/impression', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ campaignId: randomPick.id })
            }).catch(() => {});

            // Stream directly from Cloudflare R2 CDN to align with Vercel Fast limits
            const adAudioSrc = resolveDirectCdnUrl(randomPick.audio_url);
            const audio = new Audio(adAudioSrc);
            audioRef.current = audio;
            audio.volume = 0.85;

            audio.onended = () => {
              setCanSkip(true);
              setSecondsRemaining(0);
              awardReward();
            };

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
        console.warn('Could not load dynamic active ad:', err);
      }

      // Fallback commercial audio hosted on CDN
      try {
        const fallbackAudio = new Audio(resolveDirectCdnUrl(null));
        audioRef.current = fallbackAudio;
        fallbackAudio.volume = 0.85;
        fallbackAudio.onended = () => {
          setCanSkip(true);
          setSecondsRemaining(0);
          awardReward();
        };
        fallbackAudio.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            setIsPlaying(false);
          });
      } catch (e) {
        console.warn('Fallback user ad audio failed:', e);
      }
    }

    loadActiveAd();

    // 15-second Spotify-style unskippable countdown
    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setCanSkip(true);
          awardReward();
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
    // Spotify rule: first 15 seconds are completely unskippable
    if (!canSkip && secondsRemaining > 0) return;
    awardReward();
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
        const fallbackAudio = new Audio(resolveDirectCdnUrl(activeAd.audio_url));
        audioRef.current = fallbackAudio;
        fallbackAudio.volume = 0.85;
        fallbackAudio.play().catch(() => {});
      }
      setIsPlaying(true);
    }
  };

  const handleDspClick = () => {
    awardReward();
    if (activeAd.id) {
      fetch('/api/ads/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: activeAd.id })
      }).catch(() => {});
    }
  };

  const progressPct = ((15 - secondsRemaining) / 15) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none"
      onClick={(e) => {
        // Prevent dismissal during unskippable 15s window
        if (!canSkip && secondsRemaining > 0) {
          e.stopPropagation();
        }
      }}
    >
      <div
        className="w-full max-w-md bg-[#0B0E14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Tag - Spotify Style Unskippable Notice */}
        <div className="px-4 py-3 bg-[#0F131C] border-b border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#2dd4bf] animate-ping" />
            <span className="font-mono text-[11px] font-bold text-gray-200 uppercase tracking-wider">
              {pendingDownloadTitle
                ? `Unlock Download: ${pendingDownloadTitle.slice(0, 18)}...`
                : 'Spotify Ad Mode · Sponsor Spotlight'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canSkip ? (
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1 rounded-full bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#2dd4bf]/20 animate-pulse"
              >
                <span>{pendingDownloadTitle ? 'Start Download' : 'Skip Ad'}</span>
                <X className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-300 font-mono font-bold shadow-xs">
                <Lock className="h-3 w-3 text-amber-400" />
                <span>Unskippable: 0:{secondsRemaining.toString().padStart(2, '0')}</span>
              </span>
            )}
          </div>
        </div>

        {/* 15-Second Linear Progress Bar */}
        <div className="w-full h-1.5 bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-teal-400 to-[#2dd4bf] transition-all duration-1000 ease-linear"
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
        </div>

        {/* Rewarded Download Banner Alert */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-teal-500/15 via-emerald-500/15 to-teal-500/15 border-b border-teal-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-3.5 w-3.5 text-teal-300 shrink-0" />
            <p className="text-[11px] text-teal-200 font-medium">
              {rewardAwarded ? (
                <span className="font-bold text-teal-300 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-teal-400 inline" />
                  +1 Bonus Download Unlocked! Download starts on skip.
                </span>
              ) : (
                <span>
                  {pendingDownloadTitle
                    ? 'Listen to 15s ad to download your selected beat!'
                    : 'Listen to 15s to earn +1 bonus beat download for today!'}
                </span>
              )}
            </p>
          </div>
          {rewardAwarded && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-400/20 text-teal-300 font-bold border border-teal-400/30">
              +1 Earned
            </span>
          )}
        </div>

        {/* Artwork & Campaign Details */}
        <div className="p-6 text-center flex flex-col items-center">
          <div className="relative w-36 h-36 rounded-xl overflow-hidden shadow-2xl border border-white/10 mb-4 group">
            <img
              src={resolveDirectCdnUrl(activeAd.cover_url || '/images/hero_boombox.jpg')}
              alt={activeAd.song_title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer ${
                  isPlaying
                    ? 'bg-[#04564f]/95 hover:bg-[#04564f] text-white ring-2 ring-[#2dd4bf]/40'
                    : 'bg-amber-400 text-black ring-4 ring-amber-400/40 animate-pulse'
                }`}
                aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5 fill-current" />}
              </button>
              {!isPlaying && (
                <span className="text-[10px] font-bold text-amber-300 bg-black/85 px-2.5 py-0.5 rounded-full border border-amber-400/40 shadow">
                  Tap to Unmute Ad
                </span>
              )}
            </div>
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white flex items-center gap-1">
              <Volume2 className="h-2.5 w-2.5 text-[#2dd4bf]" />
              <span>{secondsRemaining}s</span>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-amber-300 mb-1.5 uppercase font-semibold">
            {activeAd.genre || 'Afrobeats'}
          </span>
          <h3 className="text-lg font-black text-white tracking-tight">{activeAd.song_title}</h3>
          <p className="text-xs text-gray-400 font-medium mt-0.5">by {activeAd.artist_name}</p>
          <p className="text-xs text-gray-300 mt-2 max-w-xs leading-relaxed italic">
            &ldquo;{activeAd.campaign_name || `Stream "${activeAd.song_title}" out now on all major DSPs!`}&rdquo;
          </p>

          {/* Reward Status Banner */}
          {rewardAwarded && (
            <div className="w-full mt-4 p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center gap-2 text-teal-300 text-xs font-semibold animate-in fade-in duration-300">
              <Sparkles className="h-4 w-4 text-teal-400" />
              <span>
                {pendingDownloadTitle
                  ? `Download unlocked! Click below to start downloading "${pendingDownloadTitle}".`
                  : 'Download quota credited! You can now download your next beat.'}
              </span>
            </div>
          )}

          {/* Streaming DSP Links */}
          <div className="w-full mt-5 pt-4 border-t border-white/10">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2.5">
              Stream Full Track on DSPs (+1 Instant Download):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={activeAd.spotify_url || 'https://open.spotify.com'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDspClick}
                className="h-9 px-3 rounded-md bg-[#1DB954]/15 hover:bg-[#1DB954]/25 border border-[#1DB954]/40 text-[#1DB954] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Spotify</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={activeAd.apple_music_url || 'https://music.apple.com'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDspClick}
                className="h-9 px-3 rounded-md bg-[#FC3C44]/15 hover:bg-[#FC3C44]/25 border border-[#FC3C44]/40 text-[#FC3C44] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Apple Music</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={activeAd.audiomack_url || 'https://audiomack.com'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDspClick}
                className="h-9 px-3 rounded-md bg-[#FFA200]/15 hover:bg-[#FFA200]/25 border border-[#FFA200]/40 text-[#FFA200] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Audiomack</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={activeAd.youtube_url || 'https://youtube.com'}
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

        {/* Footer Actions */}
        <div className="p-3.5 bg-[#0F131C] border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
          <span className="font-mono text-[10px]">
            {canSkip ? '✓ Unlocked' : `First 15s unskippable · ${secondsRemaining}s left`}
          </span>
          {canSkip ? (
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 rounded-lg bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-black text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{pendingDownloadTitle ? 'Start Beat Download →' : 'Resume Music →'}</span>
            </button>
          ) : (
            <span className="text-[10px] text-zinc-500 font-mono">
              Reward unlocks after 15s
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
