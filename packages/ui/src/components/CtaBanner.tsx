import React from 'react';
import { Button } from './Button';
import { cn } from '../utils/cn';

export interface CtaBannerProps {
  onStartFree?: () => void;
  boomboxImg?: string;
  goldenClefImg?: string;
  neonDjImg?: string;
  className?: string;
}

export const CtaBanner: React.FC<CtaBannerProps> = ({
  onStartFree,
  boomboxImg = '/images/hero_boombox.jpg',
  goldenClefImg = '/images/golden_clef.jpg',
  neonDjImg = '/images/album_neon_dj.jpg',
  className
}) => {
  return (
    <section
      className={cn(
        'relative overflow-hidden py-24 lg:py-32 bg-white text-center border-t border-gray-100',
        className
      )}
    >
      {/* Soft Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-gradient-to-r from-zinc-200/50 via-gray-100/50 to-zinc-200/40 blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Floating Boombox on the Left */}
        <div className="hidden lg:block absolute left-4 xl:left-8 bottom-4 w-40 xl:w-48 h-40 xl:h-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform -rotate-6 hover:rotate-0 transition-transform duration-500 z-10">
          <img
            src={boomboxImg}
            alt="Boombox"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Small floating DJ artwork */}
        <div className="hidden xl:block absolute left-48 bottom-12 w-20 h-20 rounded-xl overflow-hidden shadow-lg border-2 border-white transform rotate-12 transition-transform duration-500 z-10">
          <img
            src={neonDjImg}
            alt="Album cover"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating Golden Clef on the Right */}
        <div className="hidden lg:block absolute right-4 xl:right-8 bottom-2 w-44 xl:w-52 h-44 xl:h-52 rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform rotate-6 hover:rotate-0 transition-transform duration-500 z-10">
          <img
            src={goldenClefImg}
            alt="Golden treble clef"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Small floating artwork near right */}
        <div className="hidden xl:block absolute right-48 top-4 w-16 h-16 rounded-lg overflow-hidden shadow-md border border-white transform -rotate-12 transition-transform duration-500 z-10">
          <img
            src={neonDjImg}
            alt="Album cover"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Center Content */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 tracking-tight leading-tight mb-8">
            Join 40,000 music website <br className="hidden sm:inline" />
            creators worldwide
          </h2>

          <div className="flex justify-center">
            <Button
              variant="primary"
              size="lg"
              pill
              onClick={onStartFree}
              className="text-xs uppercase font-bold tracking-wider px-10 py-3.5 shadow-lg shadow-[#04564f]/25 hover:bg-[#03453f]"
            >
              START FREE NOW
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
