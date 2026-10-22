'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Beat } from '@caution/types';
import { SEEDED_PROMOTED_SONGS, PromotedArtistSong } from '../../lib/seedBeats';
import { audioSynth } from '@caution/ui';
import {
  X,
  CheckCircle2,
  Download,
  ExternalLink,
  Music2,
  Sparkles,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck,
  Disc3,
  Clock
} from 'lucide-react';
import { getDailyDownloadState, recordBeatDownload, DailyDownloadState } from '../../lib/subscription';
import { DailyDownloadLimitModal } from './DailyDownloadLimitModal';

interface RewardedDownloadModalProps {
  beat: Beat;
  isOpen: boolean;
  onClose: () => void;
}

export const RewardedDownloadModal: React.FC<RewardedDownloadModalProps> = ({
  beat,
  isOpen,
  onClose
}) => {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songsCompleted, setSongsCompleted] = useState<number[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [listenProgress, setListenProgress] = useState(0);
  const [showDailyLimitModal, setShowDailyLimitModal] = useState(false);

  const songs = SEEDED_PROMOTED_SONGS.slice(0, 2);
  const currentSong: PromotedArtistSong = songs[currentSongIndex] || songs[0];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentSongIndex(0);
      setSongsCompleted([]);
      setIsUnlocked(false);
      setListenProgress(0);
      setIsPlaying(true);
      playSong(songs[0]);
    } else {
      audioSynth.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      audioSynth.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, beat.id]);

  const playSong = (song: PromotedArtistSong) => {
    try {
      audioSynth.stop();
      audioSynth.playTrack(song.id, () => {}, 20);
      setIsPlaying(true);
      setListenProgress(0);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setListenProgress((prev) => {
          if (prev >= 100) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 100;
          }
          return prev + 10;
        });
      }, 1000);
    } catch (e) {
      console.warn('Synth error:', e);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
    } else {
      playSong(currentSong);
    }
  };

  const handleCompleteCurrentSong = () => {
    audioSynth.stop();
    const updated = Array.from(new Set([...songsCompleted, currentSongIndex]));
    setSongsCompleted(updated);

    if (currentSongIndex === 0) {
      // Advance to song 2
      setCurrentSongIndex(1);
      playSong(songs[1]);
    } else {
      // Both finished! Unlock download
      setIsUnlocked(true);
      setIsPlaying(false);
    }
  };

  const handleDownloadBeat = () => {
    const quota = getDailyDownloadState();
    if (!quota.canDownload) {
      setShowDailyLimitModal(true);
      return;
    }

    setDownloading(true);
    const updatedQuota = recordBeatDownload(beat.id, beat.title);

    // Create simulated MP3 file download
    try {
      const dummyContent = `CAUTION_STUDIO_FREE_AD_SUPPORTED_DOWNLOAD\nBeat: ${beat.title}\nProducer: ${beat.producer?.display_name || 'Caution'}\nLicense: Free Starter Stream Supported\nTimestamp: ${new Date().toISOString()}`;
      const blob = new Blob([dummyContent], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${beat.slug}-caution-starter.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download error:', e);
    }

    setTimeout(() => {
      setDownloading(false);
      // If user has now reached the 2 beats limit for today, pop up the daily limit modal to notify them!
      if (!updatedQuota.canDownload) {
        setShowDailyLimitModal(true);
      }
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#0B0E14] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-[#0F131C] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#04564f]/30 border border-[#2dd4bf]/40 text-[#2dd4bf]">
              <Disc3 className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Free Beat Download Option</h3>
              <p className="text-[10px] text-gray-400 font-mono">
                Listen to 2 promoted songs to earn 1 free download of &ldquo;{beat.title}&rdquo;
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioSynth.stop();
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 2-Step Progress Indicator */}
        <div className="px-6 py-3 bg-[#0F131C]/60 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                songsCompleted.includes(0)
                  ? 'bg-emerald-500 text-black'
                  : currentSongIndex === 0
                  ? 'bg-[#04564f] text-white ring-2 ring-[#2dd4bf]'
                  : 'bg-white/10 text-gray-400'
              }`}
            >
              {songsCompleted.includes(0) ? <CheckCircle2 className="h-4 w-4" /> : '1'}
            </div>
            <span className="text-xs text-gray-300 font-medium">Song 1: Teniola Sound</span>
          </div>

          <ArrowRight className="h-3.5 w-3.5 text-gray-600" />

          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                songsCompleted.includes(1)
                  ? 'bg-emerald-500 text-black'
                  : currentSongIndex === 1
                  ? 'bg-[#04564f] text-white ring-2 ring-[#2dd4bf]'
                  : 'bg-white/10 text-gray-400'
              }`}
            >
              {songsCompleted.includes(1) ? <CheckCircle2 className="h-4 w-4" /> : '2'}
            </div>
            <span className="text-xs text-gray-300 font-medium">Song 2: Zino Waves</span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1">
          {!isUnlocked ? (
            <div className="flex flex-col items-center text-center">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-white/10 shadow-xl mb-4 group">
                <img
                  src={currentSong.cover_url}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="w-12 h-12 rounded-full bg-[#04564f] hover:bg-[#135d56] text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </button>
                </div>
              </div>

              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 mb-1">
                Listening to Promoted Track {currentSongIndex + 1} of 2
              </span>
              <h4 className="text-base font-bold text-white">{currentSong.title}</h4>
              <p className="text-xs text-gray-400 mt-0.5">by {currentSong.artist_name}</p>

              {/* Simulated Waveform / Equalizer */}
              <div className="w-full max-w-xs h-6 flex items-center justify-center gap-1 my-3">
                {[40, 75, 55, 90, 60, 80, 45, 95, 70, 50, 85, 65].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-300 ${
                      isPlaying ? 'bg-[#2dd4bf] animate-pulse' : 'bg-gray-600'
                    }`}
                    style={{
                      height: isPlaying ? `${Math.max(20, (h * (i % 2 === 0 ? 0.8 : 1.2)) % 100)}%` : '20%'
                    }}
                  />
                ))}
              </div>

              {/* Streaming DSP links */}
              <div className="w-full mt-2 pt-3 border-t border-white/10">
                <span className="block text-[10px] font-mono text-gray-400 mb-2">
                  Support the artist on external DSPs:
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  <a
                    href={currentSong.streaming_links.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-[#1DB954]/15 hover:bg-[#1DB954]/25 border border-[#1DB954]/40 text-[#1DB954] text-[11px] font-semibold flex items-center gap-1"
                  >
                    <span>Spotify</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                  <a
                    href={currentSong.streaming_links.apple_music}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-[#FC3C44]/15 hover:bg-[#FC3C44]/25 border border-[#FC3C44]/40 text-[#FC3C44] text-[11px] font-semibold flex items-center gap-1"
                  >
                    <span>Apple Music</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                  <a
                    href={currentSong.streaming_links.audiomack}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded bg-[#FFA200]/15 hover:bg-[#FFA200]/25 border border-[#FFA200]/40 text-[#FFA200] text-[11px] font-semibold flex items-center gap-1"
                  >
                    <span>Audiomack</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCompleteCurrentSong}
                className="mt-5 w-full h-11 rounded-lg bg-[#04564f] hover:bg-[#135d56] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-[#2dd4bf]/30"
              >
                <span>
                  {currentSongIndex === 0
                    ? 'I Have Finished Listening → Next Song'
                    : 'I Have Finished Listening → Unlock Beat Download'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            /* UNLOCKED STATE */
            <div className="flex flex-col items-center text-center py-2 animate-scale-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
              </div>

              <h4 className="text-lg font-black text-white">1 Free Beat Download Unlocked!</h4>
              <p className="text-xs text-gray-300 mt-1 max-w-sm leading-relaxed">
                Thank you for streaming emerging artists on Caution Studio. Your free download of <strong>&ldquo;{beat.title}&rdquo;</strong> is now ready.
              </p>

              <div className="my-5 p-3.5 rounded-lg bg-[#151A24] border border-white/10 w-full flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded overflow-hidden bg-black/40 shrink-0">
                  {beat.cover_url && (
                    <img src={beat.cover_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{beat.title}</div>
                  <div className="text-[11px] text-gray-400 font-mono truncate">
                    {beat.producer?.display_name || 'Caution Studio'} · Starter MP3 Lease
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  FREE REWARD
                </span>
              </div>

              <button
                type="button"
                onClick={handleDownloadBeat}
                disabled={downloading}
                className="w-full h-12 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20"
              >
                <Download className="h-4 w-4 stroke-[2.5]" />
                <span>{downloading ? 'Downloading MP3...' : 'Download Beat MP3'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Daily 2-Beat Download Limit & 24hr Cooldown Modal */}
      <DailyDownloadLimitModal
        isOpen={showDailyLimitModal}
        onClose={() => {
          setShowDailyLimitModal(false);
          onClose();
        }}
        downloadState={getDailyDownloadState()}
        onContinueBrowsing={() => {
          setShowDailyLimitModal(false);
          onClose();
        }}
      />
    </div>
  );
};
