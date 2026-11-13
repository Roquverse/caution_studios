'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { AUTH_SIGNUP_URL } from '../lib/urls';

interface MusicLicensingSectionProps {
  onStartFree?: () => void;
}

const PLATFORMS_GRID = [
  'YouTube', 'TikTok', 'Twitch', 'Websites', 'Applications', 'Film/festivals & cinema',
  'Facebook', 'Twitter', 'Commercials', 'Weddings', 'Podcasts', 'Worldwide coverage',
  'Instagram', 'Vimeo', 'Broadcast', 'Games', 'Presentations', 'Any future platform'
];

export const MusicLicensingSection: React.FC<MusicLicensingSectionProps> = ({
  onStartFree
}) => {
  return (
    <section className="bg-white py-16 lg:py-24 border-t border-gray-100 text-gray-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 tracking-tight leading-tight">
            Music licensing for every video creator
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            From YouTube monetization to commercial use worldwide, we&apos;ve got the right plan for you
          </p>
        </div>

        {/* 18 Platforms Checklist Grid (3 rows x 6 columns) */}
        <div className="max-w-5xl mx-auto mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-3.5 text-left">
            {PLATFORMS_GRID.map((platform, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-gray-700">
                <Check className="h-4 w-4 text-[#04564f] stroke-[2.5] shrink-0" />
                <span className="truncate">{platform}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onStartFree ? onStartFree : () => (window.location.href = AUTH_SIGNUP_URL)}
            className="bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-md shadow-md shadow-[#04564f]/20 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            START FREE NOW
          </button>
        </div>
      </div>
    </section>
  );
};
