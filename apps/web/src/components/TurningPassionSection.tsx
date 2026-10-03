'use client';

import React from 'react';
import { Button } from '@caution/ui';
import { Zap } from 'lucide-react';

interface TurningPassionSectionProps {
  onQualify?: () => void;
  onLearnMore?: () => void;
}

export const TurningPassionSection: React.FC<TurningPassionSectionProps> = ({
  onQualify,
  onLearnMore
}) => {
  const stats = [
    { value: '500M+', label: 'Streams Generated' },
    { value: '100k+', label: 'Playlists Secured' },
    { value: '300%', label: 'Average Stream Growth' }
  ];

  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#07090D] rounded-[32px] p-8 sm:p-16 text-center text-white relative overflow-hidden border border-white/10 shadow-2xl">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#04564f]/25 blur-[140px] pointer-events-none rounded-full" />

          {/* Heading with Lightning Emoji */}
          <h2 className="relative z-10 text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            Turning passion <span className="text-amber-400 inline-block align-middle">⚡</span> into milestones
            where every artist&apos;s journey can lead to global recognition.
          </h2>

          {/* 3 Metric Columns */}
          <div className="relative z-10 mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto border-t border-b border-white/10 py-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-3xl sm:text-5xl font-black tracking-tight text-white block">
                  {stat.value}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              pill
              onClick={() => (window.location.href = '/beats')}
              className="text-xs uppercase font-bold tracking-wider px-8 py-3.5 bg-[#04564f] hover:bg-[#03453f] shadow-lg shadow-[#04564f]/30"
            >
              Explore Beat Marketplace
            </Button>
            <Button
              variant="outline"
              size="lg"
              pill
              onClick={onLearnMore}
              className="text-xs uppercase font-bold tracking-wider px-8 py-3.5 border-white/20 text-white hover:bg-white hover:text-black hover:border-white shadow-sm"
            >
              View Pricing Plans
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
