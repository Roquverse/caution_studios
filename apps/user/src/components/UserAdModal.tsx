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
  Volume2,
  Headphones,
  ShieldCheck
} from 'lucide-react';
import { grantBonusDownload } from '../lib/downloadQuota';

interface UserAdModalProps {
  isOpen: boolean;
  onClose: (unlocked?: boolean) => void;
  onRewardEarned?: (newBonusCount: number) => void;
  pendingDownloadTitle?: string | null;
  adType?: 'listening' | 'download';
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
  delivered_plays?: number;
  target_plays?: number;
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

const DEFAULT_STREAM_AD: ActiveAd = {
  id: 'promo-default-listening',
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

const DEFAULT_DOWNLOAD_AD: ActiveAd = {
  id: 'promo-default-download',
  song_title: 'Lagos Nightdrive',
  artist_name: 'Seyi Blaze',
  campaign_name: 'Sponsored Download: Stream 15s to unlock your free high-definition beat master!',
  genre: 'Afro-Fusion',
  cover_url: '/images/hero_boombox.jpg',
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
  pendingDownloadTitle,
  adType = pendingDownloadTitle ? 'download' : 'listening'
}) => {
  const [activeAd, setActiveAd] = useState<ActiveAd>(adType === 'download' ? DEFAULT_DOWNLOAD_AD : DEFAULT_STREAM_AD);
  const [adListenCount, setAdListenCount] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [canSkip, setCanSkip] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [rewardAwarded, setRewardAwarded] = useState(false);

  // Anti-cheat verification state for sponsored downloads:
  // Requires user to click a sponsor link AND wait for 5 seconds anti-cheat verification
  const [hasClickedDspLink, setHasClickedDspLink] = useState(false);
  const [antiCheatSecondsRemaining, setAntiCheatSecondsRemaining] = useState(5);
  const [isAntiCheatVerified, setIsAntiCheatVerified] = useState(false);
  const linkClickTimestampRef = useRef<number | null>(null);
  const antiCheatTimerRef = useRef<NodeJS.Timeout | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const rewardGrantedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio playback completion: 15-second ad has finished
  const isAudioFinished = canSkip || secondsRemaining <= 0;

  // Real clock anti-cheat check: at least 4900ms have elapsed since link click
  const isRealClockAntiCheatPassed =
    isAntiCheatVerified ||
    (linkClickTimestampRef.current !== null && Date.now() - linkClickTimestampRef.current >= 4900);

  // Download ad strictly requires: 15s audio finished + link clicked + 5s anticheat passed
  // Listening ad only requires: 15s audio finished
  const isUnlocked =
    adType === 'download'
      ? isAudioFinished && hasClickedDspLink && isRealClockAntiCheatPassed
      : isAudioFinished;

  const awardReward = () => {
    if (rewardGrantedRef.current) return;
    // For download ads, must be completely unlocked before granting reward
    if (adType === 'download' && !isUnlocked) return;
    rewardGrantedRef.current = true;
    setRewardAwarded(true);
    // ONLY grant bonus download if this is a download ad!
    if (adType === 'download') {
      const updated = grantBonusDownload(1);
      if (onRewardEarned) {
        onRewardEarned(updated.bonus);
      }
    }
  };

  // Automatically trigger reward grant once all conditions (including 5s anticheat) are fulfilled
  useEffect(() => {
    if (isUnlocked && !rewardAwarded) {
      awardReward();
    }
  }, [isUnlocked, rewardAwarded]);

  // Tab switch / background sync for anti-cheat verification timer
  useEffect(() => {
    const handleSyncAntiCheat = () => {
      if (document.visibilityState === 'visible' && hasClickedDspLink && !isAntiCheatVerified && linkClickTimestampRef.current) {
        const elapsed = Math.floor((Date.now() - linkClickTimestampRef.current) / 1000);
        if (elapsed >= 5) {
          if (antiCheatTimerRef.current) clearInterval(antiCheatTimerRef.current);
          setAntiCheatSecondsRemaining(0);
          setIsAntiCheatVerified(true);
        } else {
          setAntiCheatSecondsRemaining(Math.max(0, 5 - elapsed));
        }
      }
    };
    document.addEventListener('visibilitychange', handleSyncAntiCheat);
    window.addEventListener('focus', handleSyncAntiCheat);
    return () => {
      document.removeEventListener('visibilitychange', handleSyncAntiCheat);
      window.removeEventListener('focus', handleSyncAntiCheat);
    };
  }, [hasClickedDspLink, isAntiCheatVerified]);

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (antiCheatTimerRef.current) clearInterval(antiCheatTimerRef.current);
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
    setHasClickedDspLink(false);
    setAntiCheatSecondsRemaining(5);
    setIsAntiCheatVerified(false);
    linkClickTimestampRef.current = null;
    if (antiCheatTimerRef.current) clearInterval(antiCheatTimerRef.current);
    setActiveAd(adType === 'download' ? DEFAULT_DOWNLOAD_AD : DEFAULT_STREAM_AD);

    // Fetch randomized active ad strictly for the requested placement
    async function loadActiveAd() {
      try {
        const res = await fetch(`/api/ads/active?type=${adType}&_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.ads) && data.ads.length > 0) {
            // True random ad selection
            const randomPick = data.ads[Math.floor(Math.random() * data.ads.length)];
            setActiveAd(randomPick);
            const initialPlays = (randomPick.delivered_plays || 0) + 1;
            setAdListenCount(initialPlays);

            // Track impression and receive updated listen count
            fetch('/api/ads/impression', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ campaignId: randomPick.id, adId: randomPick.id })
            })
              .then((r) => r.json())
              .then((impData) => {
                if (impData?.delivered_plays) {
                  setAdListenCount(impData.delivered_plays);
                }
              })
              .catch(() => {});

            // Stream directly from Cloudflare R2 CDN to align with Vercel Fast limits
            const adAudioSrc = resolveDirectCdnUrl(randomPick.audio_url);
            const audio = new Audio(adAudioSrc);
            audioRef.current = audio;
            audio.volume = 0.85;

            audio.onended = () => {
              setCanSkip(true);
              setSecondsRemaining(0);
              if (adType === 'listening') {
                awardReward();
              }
              setAdListenCount((prev) => Math.max(prev, (randomPick.delivered_plays || 0) + 1));
              fetch('/api/ads/impression', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId: randomPick.id, adId: randomPick.id, completed: true })
              })
                .then((r) => r.json())
                .then((resData) => {
                  if (resData?.delivered_plays) setAdListenCount(resData.delivered_plays);
                })
                .catch(() => {});
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
          if (adType === 'listening') {
            awardReward();
          }
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
          if (adType === 'listening') {
            awardReward();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (antiCheatTimerRef.current) clearInterval(antiCheatTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      audioSynth.stop();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    // Cannot close or download if not unlocked!
    if (!isUnlocked) return;
    awardReward();
    if (timerRef.current) clearInterval(timerRef.current);
    if (antiCheatTimerRef.current) clearInterval(antiCheatTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    audioSynth.stop();
    onClose(true);
  };

  const handleCancelClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (antiCheatTimerRef.current) clearInterval(antiCheatTimerRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    audioSynth.stop();
    onClose(false);
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
    if (activeAd.id) {
      fetch('/api/ads/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: activeAd.id })
      }).catch(() => {});
    }

    if (adType === 'download') {
      // Start 5-second anti-cheat countdown on first sponsor link click
      if (!hasClickedDspLink) {
        setHasClickedDspLink(true);
        linkClickTimestampRef.current = Date.now();
        setAntiCheatSecondsRemaining(5);

        if (antiCheatTimerRef.current) clearInterval(antiCheatTimerRef.current);
        antiCheatTimerRef.current = setInterval(() => {
          if (!linkClickTimestampRef.current) return;
          const elapsed = Math.floor((Date.now() - linkClickTimestampRef.current) / 1000);
          const remaining = Math.max(0, 5 - elapsed);
          setAntiCheatSecondsRemaining(remaining);

          if (remaining <= 0) {
            if (antiCheatTimerRef.current) clearInterval(antiCheatTimerRef.current);
            setIsAntiCheatVerified(true);
          }
        }, 500);
      }
    } else {
      // For listening ad, DSP click is optional
      awardReward();
    }
  };

  const progressPct = ((15 - secondsRemaining) / 15) * 100;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none"
      onClick={(e) => {
        // Prevent dismissal during unskippable window
        if (!isUnlocked) {
          e.stopPropagation();
        }
      }}
    >
      <div
        className="w-full max-w-md bg-[#0B0E14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Tag */}
        <div className="px-4 py-3 bg-[#0F131C] border-b border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#2dd4bf] animate-ping" />
            <span className="font-mono text-[11px] font-bold text-gray-200 uppercase tracking-wider">
              {adType === 'download'
                ? `Unlock Download: ${pendingDownloadTitle ? pendingDownloadTitle.slice(0, 18) : 'Beat'}...`
                : 'Listening Break · Sponsor Spotlight'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked ? (
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1 rounded-full bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#2dd4bf]/20 animate-pulse"
              >
                <span>{adType === 'download' ? 'Start Download' : 'Resume Music'}</span>
                <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
              </button>
            ) : adType === 'download' ? (
              <div className="flex items-center gap-1.5">
                {secondsRemaining > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-300 font-mono font-bold">
                    <Lock className="h-3 w-3 text-amber-400" />
                    <span>0:{secondsRemaining.toString().padStart(2, '0')}</span>
                  </span>
                ) : !hasClickedDspLink ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[11px] text-amber-300 font-bold animate-pulse">
                    <ExternalLink className="h-3 w-3" />
                    <span>Click Link</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/40 text-[11px] text-teal-300 font-mono font-bold animate-pulse">
                    <ShieldCheck className="h-3 w-3" />
                    <span>Verifying {antiCheatSecondsRemaining}s</span>
                  </span>
                )}
              </div>
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

        {/* Top Banner Alert: Listening vs Download */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-teal-500/15 via-emerald-500/15 to-teal-500/15 border-b border-teal-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {adType === 'download' ? (
              <Download className="h-3.5 w-3.5 text-teal-300 shrink-0" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-teal-300 shrink-0" />
            )}
            <p className="text-[11px] text-teal-200 font-medium">
              {adType === 'download' ? (
                isUnlocked ? (
                  <span className="font-bold text-teal-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-teal-400 inline" />
                    +1 Bonus Download Unlocked! Click &ldquo;Start Beat Download&rdquo; below.
                  </span>
                ) : isAudioFinished && !hasClickedDspLink ? (
                  <span className="font-bold text-amber-300 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3 text-amber-400 inline" />
                    Audio complete! Step 2: Click a sponsor link below and wait 5s to unlock.
                  </span>
                ) : isAudioFinished && hasClickedDspLink && !isRealClockAntiCheatPassed ? (
                  <span className="font-bold text-teal-300 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-teal-400 inline animate-pulse" />
                    Anti-cheat verifying sponsor visit ({antiCheatSecondsRemaining}s remaining)...
                  </span>
                ) : hasClickedDspLink && isRealClockAntiCheatPassed ? (
                  <span>
                    ✓ Sponsor visit verified (5s)! Waiting for 15s audio ({secondsRemaining}s left)...
                  </span>
                ) : (
                  <span>
                    {pendingDownloadTitle
                      ? `Stream 15s audio & click sponsor link (5s wait) to download "${pendingDownloadTitle}"`
                      : 'Stream 15s audio & click sponsor link (5s wait) to unlock +1 bonus download'}
                  </span>
                )
              ) : (
                <span>
                  Audio ad break during free beat streaming · Music automatically resumes shortly
                </span>
              )}
            </p>
          </div>
          {adType === 'download' && isUnlocked && (
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
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center pointer-events-none">
              <span className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-xs text-[9px] font-mono text-[#2dd4bf] border border-[#2dd4bf]/30 flex items-center gap-1 shadow-md">
                <Headphones className="h-2.5 w-2.5" />
                <span>{adListenCount > 0 ? adListenCount.toLocaleString() : '1'} listens</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2 flex-wrap justify-center">
            <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-amber-300 uppercase font-semibold">
              {activeAd.genre || 'Afrobeats'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#2dd4bf]/15 border border-[#2dd4bf]/30 text-[10px] font-mono text-[#2dd4bf] font-bold flex items-center gap-1.5 shadow-xs">
              <Headphones className="h-3 w-3" />
              <span>{adListenCount > 0 ? adListenCount.toLocaleString() : '1'} Listens</span>
            </span>
          </div>
          <h3 className="text-lg font-black text-white tracking-tight">{activeAd.song_title}</h3>
          <p className="text-xs text-gray-400 font-medium mt-0.5">by {activeAd.artist_name}</p>
          <p className="text-xs text-gray-300 mt-2 max-w-xs leading-relaxed italic">
            &ldquo;{activeAd.campaign_name || `Stream "${activeAd.song_title}" out now on all major DSPs!`}&rdquo;
          </p>

          {/* Reward Status Banner */}
          {isUnlocked && (
            <div className="w-full mt-4 p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center gap-2 text-teal-300 text-xs font-semibold animate-in fade-in duration-300">
              <Sparkles className="h-4 w-4 text-teal-400" />
              <span>
                {pendingDownloadTitle
                  ? `Download unlocked! Click "Start Beat Download" below for "${pendingDownloadTitle}".`
                  : 'Download quota credited! You can now download your next beat.'}
              </span>
            </div>
          )}

          {/* Streaming DSP Links */}
          <div className="w-full mt-5 pt-4 border-t border-white/10 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-gray-300 font-bold">
                {adType === 'download'
                  ? 'Step 2: Visit Sponsor Link (5s Anti-Cheat):'
                  : 'Stream Full Track on DSPs:'}
              </span>
              {adType === 'download' && (
                isRealClockAntiCheatPassed ? (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Visit Verified
                  </span>
                ) : hasClickedDspLink ? (
                  <span className="text-[10px] font-mono text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1 animate-pulse">
                    <ShieldCheck className="h-2.5 w-2.5" /> Verifying {antiCheatSecondsRemaining}s...
                  </span>
                ) : (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isAudioFinished
                      ? 'bg-amber-400 text-zinc-950 animate-pulse'
                      : 'bg-white/10 text-gray-400 border border-white/10'
                  }`}>
                    Click 1 link to unlock
                  </span>
                )
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={activeAd.spotify_url || 'https://open.spotify.com'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDspClick}
                className={`h-9 px-3 rounded-md bg-[#1DB954]/15 hover:bg-[#1DB954]/25 border text-[#1DB954] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  adType === 'download' && isAudioFinished && !hasClickedDspLink
                    ? 'border-[#1DB954] ring-2 ring-[#1DB954]/30 shadow-md shadow-[#1DB954]/20 animate-pulse'
                    : 'border-[#1DB954]/40'
                }`}
              >
                <span>Spotify</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={activeAd.apple_music_url || 'https://music.apple.com'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDspClick}
                className={`h-9 px-3 rounded-md bg-[#FC3C44]/15 hover:bg-[#FC3C44]/25 border text-[#FC3C44] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  adType === 'download' && isAudioFinished && !hasClickedDspLink
                    ? 'border-[#FC3C44] ring-2 ring-[#FC3C44]/30 shadow-md shadow-[#FC3C44]/20 animate-pulse'
                    : 'border-[#FC3C44]/40'
                }`}
              >
                <span>Apple Music</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={activeAd.audiomack_url || 'https://audiomack.com'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDspClick}
                className={`h-9 px-3 rounded-md bg-[#FFA200]/15 hover:bg-[#FFA200]/25 border text-[#FFA200] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  adType === 'download' && isAudioFinished && !hasClickedDspLink
                    ? 'border-[#FFA200] ring-2 ring-[#FFA200]/30 shadow-md shadow-[#FFA200]/20 animate-pulse'
                    : 'border-[#FFA200]/40'
                }`}
              >
                <span>Audiomack</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={activeAd.youtube_url || 'https://youtube.com'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDspClick}
                className={`h-9 px-3 rounded-md bg-[#FF0000]/15 hover:bg-[#FF0000]/25 border text-[#FF0000] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  adType === 'download' && isAudioFinished && !hasClickedDspLink
                    ? 'border-[#FF0000] ring-2 ring-[#FF0000]/30 shadow-md shadow-[#FF0000]/20 animate-pulse'
                    : 'border-[#FF0000]/40'
                }`}
              >
                <span>YouTube</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {adType === 'download' && (
              <p className="text-[10px] text-gray-400 mt-2 font-mono text-center">
                🛡️ Anticheat: Link click starts a 5-second sponsor visit timer before download unlocks.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 bg-[#0F131C] border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
          <div className="min-w-0 pr-2">
            {isUnlocked ? (
              <span className="font-mono text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Verification Passed (15s Audio + 5s Visit)</span>
              </span>
            ) : adType === 'download' ? (
              <span className="font-mono text-[10px] text-amber-300">
                {secondsRemaining > 0
                  ? `Step 1: 15s audio · 0:${secondsRemaining.toString().padStart(2, '0')} remaining`
                  : !hasClickedDspLink
                  ? 'Step 2: Click a sponsor link above'
                  : `Step 2: Anti-cheat verifying · ${antiCheatSecondsRemaining}s left`}
              </span>
            ) : (
              <span className="font-mono text-[10px]">
                {canSkip ? '✓ Unlocked' : `First 15s unskippable · ${secondsRemaining}s left`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isUnlocked ? (
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#2dd4bf] hover:from-emerald-400 hover:to-[#20b8a4] text-zinc-950 font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#2dd4bf]/25 animate-pulse"
              >
                <Download className="h-4 w-4 stroke-[2.5]" />
                <span>{pendingDownloadTitle ? 'Start Beat Download' : 'Start Download'}</span>
              </button>
            ) : adType === 'download' && isAudioFinished && !hasClickedDspLink ? (
              <span className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Click link above</span>
              </span>
            ) : adType === 'download' && hasClickedDspLink && !isRealClockAntiCheatPassed ? (
              <span className="px-3 py-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-mono font-bold flex items-center gap-1 animate-pulse">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Verifying ({antiCheatSecondsRemaining}s)</span>
              </span>
            ) : (
              <span className="text-[10px] text-zinc-500 font-mono">
                Locked (15s + visit)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
