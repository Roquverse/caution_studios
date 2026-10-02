import React from 'react';
import { Button } from './Button';
import { Play } from 'lucide-react';
import { cn } from '../utils/cn';

export interface HeroSectionProps {
  onStartFree?: () => void;
  onPricing?: () => void;
  onPlaySample?: () => void;
  boomboxImg?: string;
  goldenClefImg?: string;
  neonDjImg?: string;
  sunriseImg?: string;
  className?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartFree,
  onPricing,
  onPlaySample,
  boomboxImg = '/images/hero_boombox.jpg',
  goldenClefImg = '/images/golden_clef.jpg',
  neonDjImg = '/images/album_neon_dj.jpg',
  sunriseImg = '/images/album_sunrise.jpg',
  className
}) => {
  return (
    <section
      className={cn(
        'relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-white',
        className
      )}
    >
      {/* Soft Ambient Monochrome Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-zinc-200/30 via-slate-100/40 to-zinc-200/20 blur-3xl pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-10 left-12 w-72 h-72 bg-gray-200/30 blur-3xl pointer-events-none -z-10 rounded-full" />
      <div className="absolute top-20 right-10 w-80 h-80 bg-zinc-200/25 blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Floating Visual Asset: Top Left Boombox with Headphones */}
        <div className="hidden lg:block absolute -top-8 left-0 xl:-left-6 w-44 xl:w-52 h-44 xl:h-52 rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform -rotate-6 hover:rotate-0 transition-transform duration-500 z-10">
          <img
            src={boomboxImg}
            alt="Vintage boombox"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating Visual Asset: Bottom Left Neon DJ Album */}
        <div className="hidden lg:block absolute top-48 left-6 xl:left-2 w-28 xl:w-32 h-28 xl:h-32 rounded-xl overflow-hidden shadow-xl border-2 border-white transform rotate-6 hover:rotate-0 transition-transform duration-500 z-10">
          <img
            src={neonDjImg}
            alt="Neon DJ artwork"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating Visual Asset: Mid-Left Floating Small Cover */}
        <div className="hidden xl:block absolute top-72 left-28 w-20 h-20 rounded-lg overflow-hidden shadow-lg border border-white transform -rotate-12 hover:rotate-0 transition-transform duration-500 z-10">
          <img
            src={sunriseImg}
            alt="Cinematic score artwork"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating Visual Asset: Top Right Boombox / Tape */}
        <div className="hidden lg:block absolute -top-6 right-2 xl:-right-4 w-40 xl:w-48 h-40 xl:h-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform rotate-6 hover:rotate-0 transition-transform duration-500 z-10">
          <img
            src={boomboxImg}
            alt="Boombox vintage audio"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating Visual Asset: Right Golden Clef 3D */}
        <div className="hidden lg:block absolute top-44 right-6 xl:right-4 w-36 xl:w-44 h-36 xl:h-44 rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform -rotate-3 hover:rotate-0 transition-transform duration-500 z-10">
          <img
            src={goldenClefImg}
            alt="Golden musical clef 3D"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Floating Visual Asset: Small album cover near golden clef */}
        <div className="hidden xl:block absolute top-32 right-36 w-16 h-16 rounded-md overflow-hidden shadow-md border border-white transform rotate-12 transition-transform duration-500 z-10">
          <img
            src={neonDjImg}
            alt="Music art cover"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Hero Center Text Content */}
        <div className="max-w-3xl mx-auto text-center pt-8 pb-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 tracking-tight leading-[1.1] mb-8">
            Get royalty free music <br />
            for your videos
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              pill
              onClick={onStartFree}
              className="text-xs uppercase font-bold tracking-wider px-8 py-3.5 border-zinc-300 text-zinc-900 hover:border-black hover:bg-zinc-100 bg-white shadow-sm"
            >
              START FREE NOW
            </Button>

            <Button
              variant="primary"
              size="lg"
              pill
              onClick={onPricing}
              className="text-xs uppercase font-bold tracking-wider px-10 py-3.5 shadow-lg shadow-black/20 hover:bg-zinc-800"
            >
              PRICING
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
