'use client';

import React, { useState } from 'react';
import { Beat, LicenseType } from '@caution/types';
import { LICENSE_DEFINITIONS } from '@caution/licenses';
import { formatNaira } from '../../lib/paystack';
import {
  X,
  Check,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Music2,
  Gift,
  ArrowRight
} from 'lucide-react';
import { useAudio } from '../audio/AudioProvider';

interface GetBeatPriceModalProps {
  beat: Beat | null;
  isOpen: boolean;
  onClose: () => void;
}

export const GetBeatPriceModal: React.FC<GetBeatPriceModalProps> = ({
  beat,
  isOpen,
  onClose
}) => {
  const { addToCart, openRewardedDownload, downloadState, openDownloadLimitModal } = useAudio();
  const [selectedType, setSelectedType] = useState<LicenseType>('premium');

  if (!isOpen || !beat) return null;

  const tiers: LicenseType[] = ['basic', 'premium', 'exclusive'];
  const isExclusiveSold = beat.status === 'sold';

  const handleSelectTier = (type: LicenseType) => {
    addToCart(beat, type);
    onClose();
  };

  const handleFreeOption = () => {
    if (!downloadState.canDownload) {
      onClose();
      openDownloadLimitModal();
      return;
    }
    onClose();
    openRewardedDownload(beat);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-[#0B0E14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-5 bg-[#0F131C] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0">
              {beat.cover_url && (
                <img src={beat.cover_url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#E8B896] bg-[#E8B896]/10 px-2 py-0.5 rounded-full border border-[#E8B896]/20 font-bold">
                  Price Tag & Licensing
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {beat.bpm} BPM · {Math.floor((beat.duration_seconds || 180) / 60)}:
                  {((beat.duration_seconds || 180) % 60).toString().padStart(2, '0')}
                </span>
              </div>
              <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                {beat.title}
              </h3>
              <p className="text-xs text-gray-400">
                Produced by {beat.producer?.display_name || 'Caution Studio'} · Instant Untagged Download
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 3 License Pricing Cards */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {tiers.map((tierKey) => {
              const def = LICENSE_DEFINITIONS[tierKey];
              const isSelected = selectedType === tierKey;
              const isSold = isExclusiveSold && tierKey === 'exclusive';

              return (
                <div
                  key={tierKey}
                  onClick={() => !isSold && setSelectedType(tierKey)}
                  className={`relative p-4 rounded-xl flex flex-col justify-between cursor-pointer transition-all border ${
                    isSold
                      ? 'bg-white/[0.02] opacity-40 border-white/5 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#E8B896]/10 border-[#E8B896] ring-1 ring-[#E8B896]'
                      : 'bg-[#12151E] border-white/10 hover:border-white/20'
                  }`}
                >
                  {tierKey === 'premium' && (
                    <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-[#E8B896] text-black text-[9px] font-bold uppercase tracking-wider shadow">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wide">
                        {def.name}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-[#E8B896] text-black flex items-center justify-center">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {/* Price Tag Display */}
                    <div className="mt-2 text-2xl font-black font-mono text-[#E8B896]">
                      {isSold ? 'Sold' : formatNaira(def.defaultPriceNgn)}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 leading-snug line-clamp-2">
                      {def.description}
                    </p>

                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1.5 text-[10px] text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-[#E8B896] shrink-0" />
                        <span>
                          {def.streamCap
                            ? `${def.streamCap.toLocaleString()} Streams`
                            : 'Unlimited Streams'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="h-3 w-3 text-[#E8B896] shrink-0" />
                        <span>{def.filesDelivered[0]}</span>
                      </div>
                      {def.includesStems && (
                        <div className="flex items-center gap-1.5 text-white font-medium">
                          <Check className="h-3 w-3 text-[#E8B896] shrink-0" />
                          <span>Trackout stems included</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      disabled={isSold}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSold) handleSelectTier(tierKey);
                      }}
                      className={`w-full h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        isSold
                          ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#E8B896] hover:bg-[#d8a886] text-black'
                          : 'bg-white/10 hover:bg-white/15 text-white'
                      }`}
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>{isSold ? 'Sold' : `Select ${def.name}`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Free Option Banner (Listen to 2 songs) */}
          {!isExclusiveSold && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-[#04564f]/15 to-transparent border border-emerald-500/25 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 shrink-0">
                  <Gift className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Want this beat for free?
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 border border-emerald-500/30">
                      {downloadState.canDownload
                        ? `${downloadState.remaining}/2 Daily Downloads Left`
                        : `24h Cooldown Active`}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {downloadState.canDownload
                      ? 'Listen to 2 promoted songs to unlock 1 free MP3 download (up to 2 beats/day, 62 beats/mo).'
                      : 'You have used your 2 downloads for today. You can download again after 24 hours, but enjoy unlimited beat previews!'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFreeOption}
                className="shrink-0 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
              >
                <span>{downloadState.canDownload ? 'Free Download' : 'Daily Limit Reached'}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
