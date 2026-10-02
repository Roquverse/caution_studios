import React from 'react';
import { Button } from './Button';
import { Check } from 'lucide-react';
import { cn } from '../utils/cn';

export interface LicensingGridProps {
  onStartFree?: () => void;
  className?: string;
}

export const LicensingGrid: React.FC<LicensingGridProps> = ({
  onStartFree,
  className
}) => {
  const platforms = [
    'YouTube',
    'TikTok',
    'Twitch',
    'Websites',
    'Applications',
    'Film festivals & cinema',
    'Facebook',
    'Twitter',
    'Commercials',
    'Weddings',
    'Podcasts',
    'Worldwide coverage',
    'Instagram',
    'Vimeo',
    'Broadcast',
    'Games',
    'Presentations',
    'Any future platforms'
  ];

  return (
    <section className={cn('py-20 lg:py-28 bg-white text-center', className)}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight mb-3">
          Music licensing for every video creator
        </h2>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto mb-12">
          From YouTube monetization to commercial use worldwide, we&apos;ve got
          the right plan for you
        </p>

        {/* 6-column / 3-column Grid matching reference layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-4 gap-x-2 text-left mb-12 max-w-4xl mx-auto">
          {platforms.map((platform, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700">
              <Check className="h-4 w-4 text-black stroke-[3] shrink-0" />
              <span className="truncate">{platform}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Button
            variant="primary"
            size="md"
            pill
            onClick={onStartFree}
            className="text-xs font-bold uppercase tracking-wider px-8 py-3 shadow-md shadow-black/20 hover:bg-zinc-800"
          >
            START FREE NOW
          </Button>
        </div>
      </div>
    </section>
  );
};
