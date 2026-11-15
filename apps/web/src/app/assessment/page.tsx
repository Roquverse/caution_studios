'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import { APP_URL } from '../../lib/urls';
import {
  Sparkles,
  Link2,
  CheckCircle2,
  ArrowRight,
  Disc3,
  Sliders,
  ShieldCheck,
  Zap,
  Radio,
  Headphones,
  Award,
  BarChart3,
  Flame,
  Music2
} from 'lucide-react';

export default function AssessmentPage() {
  const [songLink, setSongLink] = useState('');
  const [genre, setGenre] = useState('Afrobeats');
  const [stage, setStage] = useState('independent');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<null | {
    score: number;
    recommendedBpm: string;
    recommendedKey: string;
    headroomScore: string;
    recommendedPlan: string;
    planPrice: string;
    actionItems: string[];
  }>(null);

  const handleRunAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Simulate diagnostic engine
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult({
        score: Math.floor(Math.random() * 15) + 84, // 84-98%
        recommendedBpm: genre === 'Amapiano' ? '112-115 BPM' : genre === 'Trap' ? '138-142 BPM' : '100-106 BPM',
        recommendedKey: 'F# Minor / A Major',
        headroomScore: '-6.2 dB Studio Headroom',
        recommendedPlan: 'Premium Beat Plan (WAV + Stems)',
        planPrice: '₦30,000 one-time',
        actionItems: [
          'Switch from stereo MP3 tracks to separated 24-bit stems (.ZIP) to give vocals frequency pocket.',
          'Secure Content ID clearance prior to release to avoid demonetization on YouTube & TikTok.',
          'Deploy a 10s Caution Audio Ad during release week to drive pre-saves directly into Apple Music.'
        ]
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col selection:bg-[#E8B896] selection:text-black">
      <TopNav />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-16 sm:pt-24 pb-12 sm:pb-16 border-b border-white/5">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[400px] bg-gradient-to-tr from-[#04564f]/30 via-teal-500/15 to-transparent blur-3xl opacity-70" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-teal-300 mb-6 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span className="uppercase tracking-wider">A&amp;R Sound Diagnostic Tool</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.15]">
            Artist Sound &amp; Readiness{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-[#2dd4bf] to-[#E8B896]">
              Assessment.
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Audit your track readiness, evaluate vocal headroom, and get tailored beat recommendations and licensing strategies to maximize your streaming momentum.
          </p>
        </div>
      </section>

      {/* Assessment Form & Results */}
      <section className="py-12 sm:py-16 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Diagnostic Card */}
          <div className="rounded-3xl bg-[#0F131C] border border-white/10 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Music Diagnostic Engine</h2>
                  <p className="text-xs text-gray-400">Instant evaluation based on 10,000+ catalog masters</p>
                </div>
              </div>
              <span className="hidden sm:inline-block text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                ● 100% Free Assessment
              </span>
            </div>

            <form onSubmit={handleRunAnalysis} className="space-y-6">
              {/* Song URL Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Paste Your Latest Track, Demo, or Profile Link (Optional)
                </label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={songLink}
                    onChange={(e) => setSongLink(e.target.value)}
                    placeholder="e.g. Spotify, Apple Music, Audiomack, or YouTube link..."
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-black/50 border border-white/10 focus:border-[#2dd4bf] focus:ring-1 focus:ring-[#2dd4bf] text-sm text-white placeholder-gray-500 transition-colors"
                  />
                </div>
              </div>

              {/* Genre Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                    Primary Musical Genre
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-black/50 border border-white/10 focus:border-[#2dd4bf] text-sm text-white transition-colors"
                  >
                    <option value="Afrobeats">Afrobeats</option>
                    <option value="Amapiano">Amapiano</option>
                    <option value="Afro-Fusion">Afro-Fusion</option>
                    <option value="Afro-Soul">Afro-Soul</option>
                    <option value="Street-Hop">Street-Hop</option>
                    <option value="Trap">Trap / Hip-Hop</option>
                    <option value="R&B">Afro-R&amp;B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                    Current Career Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-black/50 border border-white/10 focus:border-[#2dd4bf] text-sm text-white transition-colors"
                  >
                    <option value="emerging">Emerging Artist (&lt; 10k streams)</option>
                    <option value="independent">Active Independent (10k - 100k streams)</option>
                    <option value="pro">Commercial / Touring Artist (100k+ streams)</option>
                    <option value="label">Label / Management Representative</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isAnalyzing}
                className="w-full h-12 rounded-xl bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#04564f]/30 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] border border-[#2dd4bf]/30 cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="h-4 w-4 text-[#2dd4bf]" />
                <span>{isAnalyzing ? 'Running Sound Diagnostic...' : 'Generate Artist Assessment Report'}</span>
              </button>
            </form>

            {/* Simulated Analysis Result Box */}
            {analysisResult && (
              <div className="mt-8 pt-8 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400">Diagnostic Complete</span>
                    <h3 className="text-xl font-black text-white mt-0.5">Your Sound Blueprint</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#2dd4bf] font-mono">{analysisResult.score}%</span>
                    <p className="text-[10px] font-mono text-gray-400">Readiness Score</p>
                  </div>
                </div>

                {/* Score Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] font-mono text-gray-400 block">Recommended BPM</span>
                    <span className="text-xs font-bold text-white mt-1 block">{analysisResult.recommendedBpm}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-[10px] font-mono text-gray-400 block">Harmonic Scale</span>
                    <span className="text-xs font-bold text-teal-300 mt-1 block">{analysisResult.recommendedKey}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-mono text-gray-400 block">Optimal Headroom</span>
                    <span className="text-xs font-bold text-[#E8B896] mt-1 block">{analysisResult.headroomScore}</span>
                  </div>
                </div>

                {/* Tailored Plan Recommendation */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-950/40 to-black/60 border border-teal-500/30 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Recommended Plan For You</span>
                    <h4 className="text-base font-bold text-white mt-0.5">{analysisResult.recommendedPlan}</h4>
                    <p className="text-xs text-gray-400">{analysisResult.planPrice}</p>
                  </div>
                  <a
                    href={APP_URL}
                    className="h-9 px-5 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0"
                  >
                    <span>Browse Matching Beats</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </div>

                {/* Action Items */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300 block">
                    Your 3-Step Production Growth Plan:
                  </span>
                  {analysisResult.actionItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-300">
                      <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* Additional Assessment Pillars */}
      <section className="py-16 sm:py-20 bg-[#0A0D15]/80 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E8B896]">Why Sound Quality Matters</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">What DSP Curators Look For</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0F131C] border border-white/10">
              <Headphones className="h-8 w-8 text-teal-400 mb-3" />
              <h3 className="text-base font-bold text-white">Lossless Master Stems</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Stereo MP3 files squish frequencies together. Full WAV trackouts allow mixing engineers to balance kick drums, 808 bass, and vocals cleanly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F131C] border border-white/10">
              <ShieldCheck className="h-8 w-8 text-[#E8B896] mb-3" />
              <h3 className="text-base font-bold text-white">Full Commercial Clearance</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Automated legal license documentation ensures your songs never get muted or demonetized by YouTube Content ID, TikTok, or distributor audits.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F131C] border border-white/10">
              <Radio className="h-8 w-8 text-emerald-400 mb-3" />
              <h3 className="text-base font-bold text-white">100% Royalty Ownership</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Keep every Naira and dollar your music generates on streaming platforms, sync licenses, radio rotation, and live performances.
              </p>
            </div>
          </div>
        </div>
      </section>

      <HomeFooter />
      <CartDrawer />
      <NowPlayingPanel />
    </div>
  );
}

