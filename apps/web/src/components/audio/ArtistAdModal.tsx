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
  const song = promotedSong || SEEDED_PROMOTED_SONGS[0];
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [canSkip, setCanSkip] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(15);
      setCanSkip(false);
      setIsPlaying(true);

      // Play audio snippet via synth
      try {
        audioSynth.playTrack(song.id, () => {}, 15);
      } catch (e) {
        console.warn('Audio ad synth:', e);
      }

      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setCanSkip(true);
            return 0;
          }
          if (prev <= 11) {
            // Can skip after 5 seconds
            setCanSkip(true);
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
  }, [isOpen, song.id]);

  if (!isOpen) return null;

  const handleClose = () => {
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

  const progressPct = ((15 - secondsRemaining) / 15) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#0B0E14] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
        {/* Top Header Tag */}
        <div className="px-4 py-2.5 bg-[#0F131C] border-b border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Caution Artist Spotlight · Sponsored</span>
          </div>

          <div className="flex items-center gap-2">
            {canSkip ? (
              <button
                type="button"
                onClick={handleClose}
                className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
              >
                <span>Skip Ad</span>
                <X className="h-3 w-3" />
              </button>
            ) : (
              <span className="text-[11px] text-gray-400 font-mono">
                Skip in {Math.max(0, secondsRemaining - 10)}s
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
              src={song.cover_url}
              alt={song.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <button
                type="button"
                onClick={toggleAudio}
                className="w-12 h-12 rounded-full bg-[#04564f]/90 hover:bg-[#04564f] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
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
            "{song.tagline}"
          </p>

          {/* Streaming DSP Links */}
          <div className="w-full mt-6 pt-5 border-t border-white/10">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-2.5">
              Stream Full Track on DSPs:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href={song.streaming_links.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-3 rounded-md bg-[#1DB954]/15 hover:bg-[#1DB954]/25 border border-[#1DB954]/40 text-[#1DB954] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Spotify</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={song.streaming_links.apple_music}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-3 rounded-md bg-[#FC3C44]/15 hover:bg-[#FC3C44]/25 border border-[#FC3C44]/40 text-[#FC3C44] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Apple Music</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={song.streaming_links.audiomack}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-3 rounded-md bg-[#FFA200]/15 hover:bg-[#FFA200]/25 border border-[#FFA200]/40 text-[#FFA200] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Audiomack</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <a
                href={song.streaming_links.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 px-3 rounded-md bg-[#FF0000]/15 hover:bg-[#FF0000]/25 border border-[#FF0000]/40 text-[#FF0000] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>YouTube</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0F131C] border-t border-white/10 flex items-center justify-between text-[11px] text-gray-500">
          <span>Plays every 5 free beat streams</span>
          {canSkip && (
            <button
              onClick={handleClose}
              className="text-[#2dd4bf] hover:underline font-semibold"
            >
              Continue to Beat →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
