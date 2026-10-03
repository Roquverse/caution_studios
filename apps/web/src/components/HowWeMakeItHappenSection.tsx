'use client';

import React from 'react';
import {
  Globe,
  CheckCircle2,
  TrendingUp,
  Headphones,
  Music2,
  Sparkles,
  Play,
  Heart,
  Radio,
  Sliders
} from 'lucide-react';

export const HowWeMakeItHappenSection: React.FC = () => {
  return (
    <section id="process" className="bg-white py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Dark Bento Container */}
        <div className="relative overflow-hidden rounded-[32px] sm:rounded-[44px] bg-[#07090D] border border-white/10 p-6 sm:p-12 lg:p-16 text-white shadow-2xl">
          {/* Subtle atmospheric glow effects */}
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#04564f]/15 blur-[140px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-1/4 w-[450px] h-[450px] bg-emerald-500/10 blur-[130px] pointer-events-none rounded-full" />

          {/* Section Header */}
          <div className="relative z-10 flex items-center justify-between pb-10 sm:pb-14 border-b border-white/10">
            <div>
              <span className="text-xs font-bold tracking-widest uppercase text-[#2dd4bf] mb-2 block">
                Seamless Workflow
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                How We Make It Happen?
              </h2>
            </div>
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white shadow-inner">
              <Globe className="h-6 w-6 text-[#2dd4bf] animate-spin-slow" />
            </div>
          </div>

          {/* Stepped Timeline & Visual Mockups */}
          <div className="relative z-10 mt-12 sm:mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Column: Timeline Steps */}
            <div className="lg:col-span-5 relative space-y-16 sm:space-y-24">
              {/* Vertical connecting line */}
              <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-[#04564f] via-[#2dd4bf] to-emerald-400/40 hidden sm:block" />

              {/* Step 01 */}
              <div className="relative flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0d131a] border border-white/15 text-white font-mono font-bold text-sm shadow-md group-hover:border-[#2dd4bf] transition-colors">
                    01
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
                    Submit Your Track for Review
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    Share your track with our A&R team for review. We evaluate its structure, mix balance, and genre fit to ensure an edge for streaming opportunities. The approval process is swift, taking just 3–5 business days.
                  </p>
                </div>
              </div>

              {/* Step 02 */}
              <div className="relative flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0d131a] border border-white/15 text-white font-mono font-bold text-sm shadow-md group-hover:border-[#2dd4bf] transition-colors">
                    02
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
                    Precision Playlisting
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    Next, we expertly pitch your music to handpicked, verified playlists that guarantee real human listeners, longer streaming sessions, and high repeat rates. Watch your traction climb in real-time.
                  </p>
                </div>
              </div>

              {/* Step 03 */}
              <div className="relative flex gap-6 group">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0d131a] border border-white/15 text-white font-mono font-bold text-sm shadow-md group-hover:border-[#2dd4bf] transition-colors">
                    03
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-3">
                    Watch the Growth Unfold
                  </h3>
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    Experience steady, algorithmic streaming velocity as your sound reaches global listeners, driving catalog saves, radio rotation, and opening doors to major sync licensing deals.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: 3 High-Fidelity UI Mockup Cards */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              {/* Card 1: A&R Feedback & Submission Chat UI */}
              <div className="rounded-3xl bg-[#0E131B]/90 border border-white/10 p-6 sm:p-7 shadow-xl hover:border-white/20 transition-all backdrop-blur-md">
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#04564f] to-[#2dd4bf] flex items-center justify-center font-bold text-white text-sm">
                        AR
                      </div>
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#0E131B]" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        Caution Studio A&R
                        <span className="text-[10px] bg-[#04564f]/40 text-[#2dd4bf] px-2 py-0.5 rounded-full font-medium border border-[#2dd4bf]/30">
                          Senior Curator
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">Response time: ~2 hrs</div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-gray-500">Step 01 Review</span>
                </div>

                {/* Message Bubble */}
                <div className="bg-[#141B26] border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3">
                  <p className="text-sm text-gray-200 leading-relaxed">
                    “Hey! We just finished the technical acoustic review of your track. The chorus energy and percussion punch are top-tier. <span className="text-[#2dd4bf] font-medium">Approved for Spotify editorial & algorithmic pitching!</span>”
                  </p>
                  
                  {/* Waveform preview pill */}
                  <div className="flex items-center justify-between bg-black/40 rounded-xl px-4 py-2.5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-[#04564f] flex items-center justify-center text-white">
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      </div>
                      <span className="text-xs font-medium text-gray-300">Master_Vocal_Final.wav</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="h-3 w-1 bg-[#2dd4bf] rounded-full animate-pulse" />
                      <span className="h-5 w-1 bg-[#2dd4bf] rounded-full" />
                      <span className="h-4 w-1 bg-[#04564f] rounded-full" />
                      <span className="h-6 w-1 bg-[#2dd4bf] rounded-full" />
                      <span className="h-3 w-1 bg-gray-600 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Ready for Playlists
                  </span>
                  <span className="text-gray-400">Score: 98.4 / 100</span>
                </div>
              </div>

              {/* Card 2: Precision Playlisting Placement Preview */}
              <div className="rounded-3xl bg-[#0E131B]/90 border border-white/10 p-6 sm:p-7 shadow-xl hover:border-white/20 transition-all backdrop-blur-md">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#04564f]/30 border border-[#04564f] flex items-center justify-center text-[#2dd4bf]">
                      <Radio className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Targeted Curator Network</h4>
                      <p className="text-xs text-gray-400">Active placement tier</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-[#2dd4bf] bg-[#04564f]/30 px-2.5 py-1 rounded-full border border-[#04564f]/40">
                    Position #1
                  </span>
                </div>

                {/* Playlist placement row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-[#141B26] p-3.5 rounded-2xl border border-white/5 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                      AFRO
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Afro Fusion Top 50</div>
                      <div className="text-[11px] text-gray-400">84,200 monthly saves</div>
                      <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">● Added to Top 5</div>
                    </div>
                  </div>

                  <div className="bg-[#141B26] p-3.5 rounded-2xl border border-white/5 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                      HEAT
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Global Urban Pulse</div>
                      <div className="text-[11px] text-gray-400">120,500 active listeners</div>
                      <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">● Heavy Rotation</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Growth Velocity Analytics */}
              <div className="rounded-3xl bg-[#0E131B]/90 border border-white/10 p-6 sm:p-7 shadow-xl hover:border-white/20 transition-all backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#2dd4bf]" />
                    <span className="text-sm font-bold text-white">Live Stream Trajectory</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    +340% 30-Day Growth
                  </span>
                </div>

                {/* Growth Chart Simulation */}
                <div className="bg-[#141B26] rounded-2xl p-4 border border-white/5">
                  <div className="flex items-baseline justify-between mb-3">
                    <div>
                      <span className="text-2xl font-black text-white">524,800</span>
                      <span className="text-xs text-gray-400 ml-2">Total Monthly Streams</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-rose-400">
                      <Heart className="h-3.5 w-3.5 fill-current" />
                      <span>28.4k Saves</span>
                    </div>
                  </div>

                  {/* SVG Line Curve */}
                  <div className="h-20 w-full">
                    <svg viewBox="0 0 400 80" className="h-full w-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#04564f" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,70 Q60,65 120,50 T240,30 T320,15 T400,5"
                        fill="none"
                        stroke="#2dd4bf"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M0,70 Q60,65 120,50 T240,30 T320,15 T400,5 L400,80 L0,80 Z"
                        fill="url(#chartGradient)"
                      />
                      {/* Dots on peak */}
                      <circle cx="400" cy="5" r="4.5" fill="#2dd4bf" className="animate-ping" />
                      <circle cx="400" cy="5" r="4.5" fill="#2dd4bf" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
