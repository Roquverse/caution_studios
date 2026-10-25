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
  CheckCircle2
} from 'lucide-react';
import { grantBonusDownload } from '../lib/downloadQuota';

interface UserAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardEarned?: (newBonusCount: number) => void;
}

export const UserAdModal: React.FC<UserAdModalProps> = ({ isOpen, onClose, onRewardEarned }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [canSkip, setCanSkip] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [rewardAwarded, setRewardAwarded] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const rewardGrantedRef = useRef(false);

  const song = {
    id: 'promo-song-1',
    title: 'Midnight Lagos',
    artist_name: 'Teniola Sound',
    genre: 'Afro-Soul',
    cover_url: '/images/artist_studio_mic.jpg',
    tagline: 'Stream the new breakout single "Midnight Lagos" out on all DSPs now!',
    streaming_links: {
      spotify: 'https://open.spotify.com',
      apple_music: 'https://music.apple.com',
      audiomack: 'https://audiomack.com',
      youtube: 'https://youtube.com'
    }
  };

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
    if (isOpen) {
      setSecondsRemaining(15);
      setCanSkip(false);
      setIsPlaying(true);
      setRewardAwarded(false);
      rewardGrantedRef.current = false;

      try {
        audioSynth.playTrack(song.id, () => {}, 15);
      } catch (e) {
        console.warn('User ad synth:', e);
      }

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
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      audioSynth.stop();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audioSynth.stop();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!canSkip && secondsRemaining > 0) return;
    awardReward();
    if (timerRef.current) clearInterval(timerRef.current);
    audioSynth.stop();
    onClose();
  };

  const toggleAudio = () => {
    if (isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
    } else {
      audioSynth.playTrack(song.id, () => {}, secondsRemaining);
      setIsPlaying(true);
    }
  };

  const handleDspClick = () => {
    awardReward();
  };

  const progressPct = ((15 - secondsRemaining) / 15) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0B0E14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative text-white">
        {/* Top Header Tag */}
        <div className="px-4 py-2.5 bg-[#0F131C] border-b border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
            <Gift className="h-3.5 w-3.5 text-amber-400" />
            <span>Ad Spotlight · Stream & Earn +1 Download</span>
          </div>

          <div className="flex items-center gap-2">
            {canSkip ? (
              <button
                type="button"
                onClick={handleClose}
                className="px-2.5 py-0.5 rounded-full bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <span>Continue</span>
                <X className="h-3 w-3 stroke-[2.5]" />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 font-mono font-bold">
                <Lock className="h-3 w-3" />
                <span>0:{secondsRemaining.toString().padStart(2, '0')}</span>
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-amber-400 via-teal-400 to-[#2dd4bf] transition-all duration-1000 ease-linear"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Bonus Reward Banner Alert */}
        <div className="px-4 py-2 bg-gradient-to-r from-teal-500/15 via-emerald-500/15 to-teal-500/15 border-b border-teal-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-3.5 w-3.5 text-teal-300 shrink-0" />
            <p className="text-[11px] text-teal-200 font-medium">
              {rewardAwarded ? (
                <span className="font-bold text-teal-300 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-teal-400 inline" />
                  Benefit Unlocked: +1 Daily Beat Download added!
                </span>
              ) : (
                <span>Stream artist song to earn <strong>+1 more beat download</strong> for today!</span>
              )}
            </p>
          </div>
          {rewardAwarded && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-400/20 text-teal-300 font-bold border border-teal-400/30">
              +1 Earned
            </span>
          )}
        </div>

        {/* Artwork & Details */}
        <div className="p-6 text-center flex flex-col items-center">
          <div className="relative w-36 h-36 rounded-xl overflow-hidden shadow-2xl border border-white/10 mb-4 group">
            <img
              src={song.cover_url}
              alt={song.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <button
                type="button"
                onClick={toggleAudio}
                className="w-12 h-12 rounded-full bg-[#04564f]/90 hover:bg-[#04564f] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </button>
            </div>
            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-white">
              {secondsRemaining}s
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-amber-300 mb-1.5 uppercase">
            {song.genre}
          </span>
          <h3 className="text-lg font-black text-white tracking-tight">{song.title}</h3>
          <p className="text-xs text-gray-400 font-medium mt-0.5">by {song.artist_name}</p>
          <p className="text-xs text-gray-300 mt-2 max-w-xs leading-relaxed italic">
            &ldquo;{song.tagline}&rdquo;
          </p>

          {/* Reward Status Card */}
          {rewardAwarded && (
            <div className="w-full mt-4 p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center gap-2 text-teal-300 text-xs font-semibold animate-in fade-in duration-300">
              <Sparkles className="h-4 w-4 text-teal-400" />
              <span>You now have an extra download to get your favorite beat today!</span>
            </div>
          )}

          {/* Streaming DSP Links */}
          <div className="w-full mt-5 pt-4 border-t border-white/10">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2.5">
              Stream Full Track on DSPs (+1 Instant Download):
            </span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={song.streaming_links.spotify}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDspClick}
                className="h-9 px-3 rounded-md bg-[#1DB954]/15 hover:bg-[#1DB954]/25 border border-[#1DB954]/40 text-[#1DB954] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Spotify</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={song.streaming_links.apple_music}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDspClick}
                className="h-9 px-3 rounded-md bg-[#FC3C44]/15 hover:bg-[#FC3C44]/25 border border-[#FC3C44]/40 text-[#FC3C44] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Apple Music</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={song.streaming_links.audiomack}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDspClick}
                className="h-9 px-3 rounded-md bg-[#FFA200]/15 hover:bg-[#FFA200]/25 border border-[#FFA200]/40 text-[#FFA200] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Audiomack</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={song.streaming_links.youtube}
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
          <span className="font-mono text-[10px]">Stream artist songs · Earn daily downloads</span>
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
              Complete preview to earn your download
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
