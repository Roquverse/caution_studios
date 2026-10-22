'use client';

import React from 'react';
import {
  Clock,
  Headphones,
  CheckCircle2,
  Sparkles,
  X,
  ArrowRight,
  Disc3,
  Flame
} from 'lucide-react';
import { DailyDownloadState } from '../../lib/subscription';

interface DailyDownloadLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  downloadState: DailyDownloadState;
  onContinueBrowsing?: () => void;
}

export const DailyDownloadLimitModal: React.FC<DailyDownloadLimitModalProps> = ({
  isOpen,
  onClose,
  downloadState,
  onContinueBrowsing
}) => {
  if (!isOpen) return null;

  const hours = downloadState.hoursRemaining || 24;
  const minutes = downloadState.minutesRemaining || 0;

  const handleContinue = () => {
    onClose();
    if (onContinueBrowsing) onContinueBrowsing();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0C0F15] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#04564f] via-[#2dd4bf] to-emerald-400" />

        {/* Modal Header */}
        <div className="p-5 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#04564f]/30 border border-[#2dd4bf]/40 flex items-center justify-center text-[#2dd4bf] shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Daily Limit Reached
                </span>
                <span className="text-[11px] font-mono text-gray-400">
                  2 / 2 Beats Today
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-1">
                You’ve Downloaded 2 Beats Today
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 py-4 space-y-4">
          
          {/* 24-Hour Cooldown Alert Box */}
          <div className="p-3.5 rounded-xl bg-[#141822] border border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-semibold text-gray-300">
                Next Download Available After:
              </span>
              <div className="text-lg font-black font-mono text-[#2dd4bf] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#2dd4bf]" />
                <span>
                  {hours > 0 ? `${hours}h ` : ''}{minutes}m (24hrs Cooldown)
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Monthly Quota
              </span>
              <span className="text-xs font-bold text-white">
                62 Beats / Month
              </span>
            </div>
          </div>

          {/* Core Reassurance: Unlimited Beat Preview Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#04564f]/35 via-emerald-950/20 to-[#0A1616] border border-[#2dd4bf]/40 shadow-inner">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#2dd4bf]/20 text-[#2dd4bf] flex items-center justify-center shrink-0 mt-0.5">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">
                    Unlimited Beat Preview Active
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#2dd4bf] animate-ping" />
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  You can stream, preview, and test <strong>unlimited beats</strong> all day long with zero voice tags. Your 2 daily downloads reset automatically after 24 hours.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Breakdown Features */}
          <div className="space-y-2 text-xs text-gray-300 pt-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2dd4bf] shrink-0" />
              <span>Access to <strong>62 beats in a month</strong> (2 downloads every day)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2dd4bf] shrink-0" />
              <span><strong>Unlimited preview streaming</strong> on all genres &amp; tempos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2dd4bf] shrink-0" />
              <span>Full WAV stems &amp; non-exclusive commercial release rights</span>
            </div>
          </div>

        </div>

        {/* Modal Action Buttons */}
        <div className="p-5 pt-3 bg-[#0a0d13] border-t border-white/[0.08] flex items-center gap-3">
          <button
            type="button"
            onClick={handleContinue}
            className="flex-1 py-2.5 px-4 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#04564f]/30 flex items-center justify-center gap-2 border border-[#2dd4bf]/30"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Continue Previewing Beats</span>
          </button>

          <a
            href="/beats"
            onClick={onClose}
            className="py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Explore Beats
          </a>
        </div>

      </div>
    </div>
  );
};
