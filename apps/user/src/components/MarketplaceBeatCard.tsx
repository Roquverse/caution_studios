'use client';

import React from 'react';
import { Play, Pause, Heart, ShoppingBag, Download, Lock } from 'lucide-react';
import { TrackItem } from '../types/tracks';
import { isFreeBeat } from './UserMarketplaceView';

interface MarketplaceBeatCardProps {
  track: TrackItem;
  isPlaying: boolean;
  isCurrent: boolean;
  isLiked: boolean;
  onPlayToggle: (track: TrackItem) => void;
  onLikeToggle: (trackId: string) => void;
  onLicenseClick: (track: TrackItem) => void;
  onDownloadClick?: (track: TrackItem) => void;
}

export function MarketplaceBeatCard({
  track,
  isPlaying,
  isCurrent,
  isLiked,
  onPlayToggle,
  onLikeToggle,
  onLicenseClick,
  onDownloadClick
}: MarketplaceBeatCardProps) {
  const isPlayingThis = isCurrent && isPlaying;
  const isFree = isFreeBeat(track);

  const formattedPrice = isFree
    ? 'FREE'
    : track.premiumPriceNgn && track.premiumPriceNgn > 0
    ? `₦${track.premiumPriceNgn.toLocaleString()}`
    : track.priceNgn && track.priceNgn > 0
    ? `₦${track.priceNgn.toLocaleString()}`
    : track.exclusivePriceNgn && track.exclusivePriceNgn > 0
    ? `₦${track.exclusivePriceNgn.toLocaleString()}`
    : 'COMMERCIAL';

  return (
    <div
      onClick={() => onPlayToggle(track)}
      className="group relative bg-[#13151b] hover:bg-[#181a22] border border-white/[0.05] hover:border-white/[0.12] rounded-2xl p-3 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-0.5"
    >
      <div>
        {/* Large Artwork with Play Button Overlay */}
        <div className="relative aspect-[16/10] sm:aspect-[16/10] w-full rounded-xl overflow-hidden bg-black/60 mb-3 border border-white/[0.06]">
          <img
            src={track.coverUrl || '/images/album_neon_dj.jpg'}
            alt={track.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

          {/* Centered Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlayToggle(track);
              }}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 shadow-xl pointer-events-auto ${
                isPlayingThis
                  ? 'bg-[#e53935] text-white scale-100 ring-4 ring-[#e53935]/30'
                  : 'bg-white/90 hover:bg-white text-black opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
              }`}
              aria-label={isPlayingThis ? 'Pause' : 'Play'}
            >
              {isPlayingThis ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current translate-x-0.5" />
              )}
            </button>
          </div>

          {/* Badge: Free or Paid indicator */}
          <div className="absolute top-2.5 left-2.5">
            {isFree ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md">
                FREE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#e53935]/20 text-[#ff7975] border border-[#e53935]/40 backdrop-blur-md">
                COMMERCIAL
              </span>
            )}
          </div>
        </div>

        {/* Beat Details */}
        <div className="space-y-1">
          <h3
            className={`text-sm font-bold truncate transition-colors ${
              isPlayingThis ? 'text-[#e53935]' : 'text-white group-hover:text-white'
            }`}
            title={track.title}
          >
            {track.title}
          </h3>

          <p className="text-xs text-gray-400 truncate">
            prod. by <span className="text-gray-300 font-medium">{track.artist}</span>
          </p>

          <p className="text-[11px] text-gray-500 truncate pt-0.5">
            {track.genre || 'Afrobeats'} • {track.bpm || 120} BPM • {track.musicalKey || 'C Minor'}
          </p>
        </div>
      </div>

      {/* Bottom Row: Price + Heart + Quick Action */}
      <div className="mt-3.5 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black text-white font-mono tracking-tight">
            {formattedPrice}
          </span>
          {!isFree && (
            <span className="text-[10px] text-gray-500 uppercase font-mono">lease</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLikeToggle(track.id);
            }}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLiked
                ? 'text-red-500 bg-red-500/10'
                : 'text-gray-400 hover:text-red-400 hover:bg-white/[0.04]'
            }`}
            title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>

          {isFree ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onDownloadClick) onDownloadClick(track);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
              title="Download Free Beat"
            >
              <Download className="h-3 w-3" />
              <span>Get</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLicenseClick(track);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#e53935] hover:bg-[#d32f2f] text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm shadow-red-500/20"
              title="License Beat"
            >
              <ShoppingBag className="h-3 w-3" />
              <span>Buy</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
