'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Beat } from '@caution/types';
import { useAudio } from '../audio/AudioProvider';
import { PlayButton } from '../audio/PlayButton';
import {
  Download,
  Share2,
  ShoppingBag,
  Check,
  Music2,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface BeatStoreTableProps {
  beats: Beat[];
  onGetBeat: (beat: Beat) => void;
  genreTitle?: string;
}

function formatDuration(seconds?: number | null): string {
  if (!seconds) return '3:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'Oct 21, 2026';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Oct 21, 2026';
  }
}

export const BeatStoreTable: React.FC<BeatStoreTableProps> = ({
  beats,
  onGetBeat,
  genreTitle
}) => {
  const { currentBeat, isPlaying, togglePlay, openRewardedDownload } = useAudio();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleShare = (beat: Beat, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? `${window.location.origin}/beats/${beat.slug}` : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(beat.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (beats.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-10">
      {/* Optional Genre Section Header */}
      {genreTitle && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E8B896]" />
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
              {genreTitle}
            </h3>
            <span className="text-[11px] font-mono text-gray-500">
              ({beats.length} {beats.length === 1 ? 'beat' : 'beats'})
            </span>
          </div>
        </div>
      )}

      {/* Table Structure */}
      <div className="w-full overflow-x-auto select-none no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          {/* Table Headers */}
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-mono uppercase tracking-wider text-gray-400">
              <th className="py-3 px-4 font-semibold w-[36%]">Track Title</th>
              <th className="py-3 px-3 font-semibold text-center w-[8%]">Duration</th>
              <th className="py-3 px-3 font-semibold text-center w-[10%]">BPM / Key</th>
              <th className="py-3 px-3 font-semibold w-[22%]">Available Tiers</th>
              <th className="py-3 px-3 font-semibold w-[14%]">Tags</th>
              <th className="py-3 px-4 font-semibold text-right w-[10%]">License</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-white/[0.04]">
            {beats.map((beat) => {
              const isCurrent = currentBeat?.id === beat.id;
              const isThisPlaying = isCurrent && isPlaying;
              const isSold = beat.status === 'sold';

              const basicLic = beat.licenses?.find((l) => l.type === 'basic');
              const premiumLic = beat.licenses?.find((l) => l.type === 'premium');
              const exclusiveLic = beat.licenses?.find((l) => l.type === 'exclusive');

              return (
                <tr
                  key={beat.id}
                  onClick={() => togglePlay(beat)}
                  className={`group transition-colors cursor-pointer ${
                    isThisPlaying
                      ? 'bg-white/[0.06]'
                      : isCurrent
                      ? 'bg-white/[0.03]'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {/* 1. Track (Artwork + Play button + Title + Producer) */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3.5">
                      {/* Artwork thumbnail with play button overlay */}
                      <div className="relative w-11 h-11 rounded-[6px] overflow-hidden bg-[#151A24] border border-white/10 shrink-0">
                        {beat.cover_url && (
                          <img
                            src={beat.cover_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div
                          className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                            isThisPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <PlayButton
                            status={beat.status}
                            isPlaying={isThisPlaying}
                            onClick={() => togglePlay(beat)}
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Title & Type Beat Subtitle */}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/beats/${beat.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`text-sm font-bold tracking-tight truncate block transition-colors ${
                            isThisPlaying ? 'text-[#E8B896]' : 'text-white group-hover:text-[#E8B896]'
                          }`}
                        >
                          {beat.title}
                        </Link>
                        <div className="text-[11px] text-gray-400 truncate mt-0.5">
                          {beat.producer?.display_name || 'Caution Studio'}
                          {beat.tags && beat.tags.length > 0 && ` · ${beat.tags[0]} Type Beat`}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Duration */}
                  <td className="py-3.5 px-3 text-center text-xs font-mono text-gray-400">
                    {formatDuration(beat.duration_seconds)}
                  </td>

                  {/* 3. BPM / Key */}
                  <td className="py-3.5 px-3 text-center text-xs font-mono text-gray-300">
                    <div className="font-bold">{beat.bpm || 120} BPM</div>
                    <div className="text-[10px] text-gray-500">{beat.musical_key || 'C Minor'}</div>
                  </td>

                  {/* 4. Available Tiers Badges (Free, Premium, Exclusive) */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Free Stream Badge */}
                      <span className="px-2 py-0.5 rounded-[4px] bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-400 font-semibold font-mono flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>Free Stream</span>
                      </span>

                      {/* Premium Lease Badge */}
                      {premiumLic?.enabled !== false && (
                        <span className="px-2 py-0.5 rounded-[4px] bg-amber-500/15 border border-amber-500/30 text-[10px] text-amber-300 font-semibold font-mono">
                          Premium (WAV+Stems)
                        </span>
                      )}

                      {/* Exclusive Buyout Badge */}
                      {exclusiveLic?.enabled !== false && !isSold && (
                        <span className="px-2 py-0.5 rounded-[4px] bg-purple-500/15 border border-purple-500/30 text-[10px] text-purple-300 font-semibold font-mono">
                          100% Exclusive
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 5. Tags */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap items-center gap-1 max-w-[160px]">
                      {beat.tags?.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded-[4px] bg-white/[0.05] border border-white/[0.08] text-[10px] text-gray-400 font-mono lowercase truncate"
                        >
                          {tag.replace(/\s+/g, '-')}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* 5. DATE */}
                  <td className="py-3.5 px-3 text-xs font-mono text-gray-400 whitespace-nowrap">
                    {formatDate(beat.published_at || beat.created_at)}
                  </td>

                  {/* 6. ACTIONS (Download, Share, Get Beat) */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Rewarded Free Download Button */}
                      {!isSold && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRewardedDownload(beat);
                          }}
                          title="Stream 2 songs to download free"
                          className="p-2 rounded-[6px] text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          aria-label="Free Download Option"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}

                      {/* Share Button */}
                      <button
                        type="button"
                        onClick={(e) => handleShare(beat, e)}
                        title={copiedId === beat.id ? 'Copied link!' : 'Share beat'}
                        className="p-2 rounded-[6px] text-gray-400 hover:text-white hover:bg-white/10 transition-colors relative"
                        aria-label="Share beat"
                      >
                        {copiedId === beat.id ? (
                          <Check className="h-4 w-4 text-[#2dd4bf]" />
                        ) : (
                          <Share2 className="h-4 w-4" />
                        )}
                      </button>

                      {/* Get Beat Button (With Price Tag Pop-Up Trigger!) */}
                      <button
                        type="button"
                        disabled={isSold}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSold) onGetBeat(beat);
                        }}
                        className={`h-8 px-3 rounded-[6px] text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                          isSold
                            ? 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
                            : 'bg-[#E8B896] hover:bg-[#d8a886] text-black border border-[#E8B896] hover:scale-[1.02]'
                        }`}
                      >
                        <ShoppingBag className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>{isSold ? 'Sold' : 'Get Beat'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
