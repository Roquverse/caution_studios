'use client';

import React from 'react';
import { Beat } from '@caution/types';
import { AUTH_LOGIN_URL, AUTH_SIGNUP_URL } from '../../lib/urls';
import {
  Sparkles,
  Lock,
  Headphones,
  CheckCircle2,
  ArrowRight,
  X,
  Disc3,
  Layers,
  Music2
} from 'lucide-react';

interface GuestSignUpPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  beat: Beat | null;
}

export const GuestSignUpPromptModal: React.FC<GuestSignUpPromptModalProps> = ({
  isOpen,
  onClose,
  beat
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-[#0C0F17] border border-white/10 shadow-2xl p-6 sm:p-7 overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background effect */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Indicator Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider mb-3">
          <Lock className="h-3 w-3 text-amber-400" />
          <span>15-Second Free Preview Ended</span>
        </div>

        {/* Modal Header */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Sign Up to Keep Listening
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-gray-300 leading-relaxed">
          You've reached the free guest listening limit. Create your free Caution Studio account to enjoy unlimited streaming, download free beats, and access separated audio stems.
        </p>

        {/* Track Snapshot Card */}
        {beat && (
          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black/60 border border-white/15 shrink-0 flex items-center justify-center">
              {beat.cover_url ? (
                <img
                  src={beat.cover_url}
                  alt={beat.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Disc3 className="h-6 w-6 text-gray-400" />
              )}
              <span className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Music2 className="h-4 w-4 text-teal-400 animate-pulse" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-white block truncate">
                {beat.title}
              </span>
              <span className="text-[11px] text-gray-400 block truncate font-mono">
                {beat.producer?.display_name || 'Caution Producer'} · {beat.bpm || 110} BPM · {beat.genre || 'Afrobeats'}
              </span>
            </div>

            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 shrink-0">
              15s Limit
            </span>
          </div>
        )}

        {/* Perks Checklist */}
        <div className="mt-5 space-y-2 text-xs text-gray-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
            <span>Unlimited, uninterrupted full-length streaming on all beats</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
            <span>Free commercial downloads for upcoming artists</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
            <span>Access to separated trackout stems (.ZIP) and WAV studio masters</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
            <span>Personal artist dashboard with favorites & saved playlists</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <a
            href={AUTH_SIGNUP_URL}
            className="w-full py-3 rounded-xl bg-[#E8B896] hover:bg-[#d8a886] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#E8B896]/20 text-center"
          >
            <span>Create Free Account / Sign Up</span>
            <ArrowRight className="h-4 w-4" />
          </a>

          <div className="flex items-center justify-between text-xs pt-1">
            <a
              href={AUTH_LOGIN_URL}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Already registered? <span className="text-teal-400 font-bold underline">Sign In</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
