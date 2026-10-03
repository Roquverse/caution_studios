'use client';

import React from 'react';
import { Button } from '@caution/ui';
import { MessageSquare, ArrowRight } from 'lucide-react';

interface GetHeardSectionProps {
  onGetFeatured?: () => void;
}

export const GetHeardSection: React.FC<GetHeardSectionProps> = ({ onGetFeatured }) => {
  const cards = [
    {
      num: '1',
      title: 'Targeted Playlists',
      description:
        'We strategically place your tracks on playlists that match your genre and audience.'
    },
    {
      num: '2',
      title: 'Global Reach',
      description:
        'Our network spans international playlist curators and trending platform tastemakers.'
    },
    {
      num: '3',
      title: 'Fan Growth',
      description:
        'Watch your listener base grow with each month of active playlist circulation.'
    },
    {
      num: '4',
      title: 'Expert Curation',
      description:
        'Our team ensures your sound reaches curators who actually care about your style.'
    }
  ];

  return (
    <section className="bg-slate-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dark Bento Box */}
        <div className="bg-[#090C10] rounded-[32px] p-8 sm:p-14 text-white relative overflow-hidden border border-white/10 shadow-2xl">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#04564f]/20 blur-[120px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-10 w-80 h-80 bg-teal-600/10 blur-[100px] pointer-events-none rounded-full" />

          {/* Section Header */}
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Get Heard Where It <br />
              Matters Most
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-gray-400 leading-relaxed">
              Position your track in front of the right audience. With our expertise in playlisting
              and radio promotion, your music is crafted from initial playlist and editorial,
              reaching listeners who appreciate your sound.
            </p>
          </div>

          {/* 4 Bento Numbered Cards */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className="bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <span className="text-3xl sm:text-4xl font-black text-gray-500 group-hover:text-white transition-colors block mb-4">
                    {card.num}
                  </span>
                  <h3 className="text-base font-bold text-white mb-2">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Callout Ribbon */}
          <div className="mt-8 bg-white text-gray-900 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#04564f] text-white shadow-md">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-950">
                  Want your track on top playlists?
                </h4>
                <p className="text-xs text-gray-500">
                  Our experts can help you secure spots on curated playlists and grow your tracks by target audience.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              pill
              onClick={onGetFeatured}
              className="shrink-0 text-xs font-bold uppercase tracking-wider px-6 py-2.5 bg-black hover:bg-zinc-800 text-white shadow-md"
            >
              Get Featured
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
