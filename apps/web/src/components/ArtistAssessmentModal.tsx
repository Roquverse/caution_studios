'use client';

import React, { useState } from 'react';
import { Modal, Button } from '@caution/ui';
import { CheckCircle2, Sparkles, TrendingUp, Music2, Disc3, ShieldCheck, ArrowRight } from 'lucide-react';

interface ArtistAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  spotifyLink: string;
  onSelectPlan?: (planName: string, price: string) => void;
}

export const ArtistAssessmentModal: React.FC<ArtistAssessmentModalProps> = ({
  isOpen,
  onClose,
  spotifyLink,
  onSelectPlan
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown'>('overview');

  const artistHandle = spotifyLink
    ? spotifyLink.replace(/https?:\/\/(open\.)?spotify\.com\/(artist\/)?/, '').split('?')[0] || 'Artist Profile'
    : 'Your Artist Profile';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Artist Assessment Diagnostic"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Profile Header Card */}
        <div className="rounded-2xl bg-gradient-to-br from-[#07090D] via-[#0E1520] to-[#04564f]/40 p-5 sm:p-6 text-white border border-white/10 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-[#04564f] border border-[#2dd4bf]/40 flex items-center justify-center text-white font-black text-lg shadow-inner">
                <Disc3 className="h-6 w-6 text-[#2dd4bf] animate-spin-slow" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#2dd4bf]">
                  Verified Analysis
                </span>
                <h3 className="text-lg font-black text-white truncate max-w-[280px]">
                  {artistHandle}
                </h3>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
              <CheckCircle2 className="h-4 w-4" /> Ready for Playlisting
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10 text-center">
            <div className="bg-white/5 rounded-xl p-2.5">
              <div className="text-xl sm:text-2xl font-black text-[#2dd4bf]">94/100</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Readiness Score</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5">
              <div className="text-xl sm:text-2xl font-black text-white">+300%</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Growth Ceiling</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5">
              <div className="text-xl sm:text-2xl font-black text-amber-400">Tier A</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">A&R Priority</div>
            </div>
          </div>
        </div>

        {/* Diagnostic Insights */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Acoustic & Reach Diagnostic
          </h4>
          
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#04564f]/10 text-[#04564f] flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-gray-900 block">Strong Algorithmic Velocity Potential</span>
                <span className="text-gray-600">
                  Your current frequency response and rhythm pattern aligns with Spotify’s editorial and Discover Weekly criteria.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-gray-200/60">
              <div className="h-8 w-8 rounded-lg bg-teal-50 text-[#04564f] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-bold text-gray-900 block">Recommended Strategy: ₦30,000 Premium Beat Plan</span>
                <span className="text-gray-600">
                  Unlock high-quality WAV masters, commercial release stems, and verified curator pitching to reach up to 500k streams.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-xs font-semibold text-gray-600"
          >
            Close
          </Button>
          <Button
            variant="primary"
            pill
            onClick={() => {
              onClose();
              if (onSelectPlan) {
                onSelectPlan('Premium Beat Plan', '₦30,000');
              }
            }}
            className="bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs px-6 py-2.5 shadow-md flex items-center justify-center gap-1.5"
          >
            Select Premium Beat (₦30,000)
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Modal>
  );
};
