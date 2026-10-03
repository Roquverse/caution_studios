'use client';

import React from 'react';

interface JoinCreatorsSectionProps {
  onStartFree?: () => void;
}

export const JoinCreatorsSection: React.FC<JoinCreatorsSectionProps> = ({
  onStartFree
}) => {
  return (
    <section className="relative overflow-hidden py-24 lg:py-36 bg-gradient-to-b from-white via-slate-50/60 to-slate-100/40 border-t border-gray-100 text-center">
      {/* Soft Ambient Radial Backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-[#04564f]/[0.03] blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Floating Asset 1: Top-Left Boombox & Red Headphones */}
        <div className="hidden lg:block absolute left-2 xl:left-8 top-2 w-36 xl:w-44 h-36 xl:h-44 rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform -rotate-6 hover:rotate-0 transition-transform duration-500 z-10">
          <img
            src="/images/hero_boombox.jpg"
            alt="Audio tape and headphones"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating Asset 2: Bottom-Left Artist Tile */}
        <div className="hidden xl:block absolute left-24 bottom-2 w-24 h-24 rounded-xl overflow-hidden shadow-xl border-2 border-white transform -rotate-12 transition-transform duration-500 z-10">
          <img
            src="/images/album_sunrise.jpg"
            alt="Sunrise album cover"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating Asset 3: Middle-Left Neon DJ Tile */}
        <div className="hidden lg:block absolute left-48 top-16 w-16 h-16 rounded-lg overflow-hidden shadow-lg border-2 border-white transform rotate-6 transition-transform duration-500 z-10">
          <img
            src="/images/album_neon_dj.jpg"
            alt="Neon music art"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating Asset 4: Right Golden Clef */}
        <div className="hidden lg:block absolute right-2 xl:right-10 top-4 w-40 xl:w-48 h-40 xl:h-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform rotate-6 hover:rotate-0 transition-transform duration-500 z-10">
          <img
            src="/images/golden_clef.jpg"
            alt="Golden treble clef"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating Asset 5: Top-Right Neon Tile */}
        <div className="hidden xl:block absolute right-48 top-2 w-16 h-16 rounded-lg overflow-hidden shadow-md border-2 border-white transform -rotate-6 transition-transform duration-500 z-10">
          <img
            src="/images/album_neon_dj.jpg"
            alt="Electronic art"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating Asset 6: Bottom-Right Neon Performer Tile */}
        <div className="hidden xl:block absolute right-24 bottom-2 w-20 h-20 rounded-xl overflow-hidden shadow-xl border-2 border-white transform rotate-12 transition-transform duration-500 z-10">
          <img
            src="/images/album_neon_dj.jpg"
            alt="Stage lights"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Center Content */}
        <div className="max-w-3xl mx-auto relative z-20 py-4">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 tracking-tight leading-tight mb-8">
            Join 40,000 music website <br className="hidden sm:inline" />
            creators worldwide
          </h2>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={onStartFree ? onStartFree : () => (window.location.href = '/sign-up')}
              className="bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider px-9 py-3.5 rounded-md shadow-lg shadow-[#04564f]/25 transition-all duration-200 active:scale-95"
            >
              START FREE NOW
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
