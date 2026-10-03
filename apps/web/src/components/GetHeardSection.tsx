'use client';

import React from 'react';

interface GetHeardSectionProps {
  onGetFeatured?: () => void;
}

export const GetHeardSection: React.FC<GetHeardSectionProps> = () => {
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
        'Get featured on international playlists across top streaming platforms.'
    },
    {
      num: '3',
      title: 'Fan Growth',
      description:
        'Watch your listener base grow as your music reaches new ears daily.'
    },
    {
      num: '4',
      title: 'Expert Curation',
      description:
        'Our team ensures your sound lands in playlists that amplify your unique vibe.'
    }
  ];

  return (
    <section className="bg-slate-50 py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dark Bento Box Container */}
        <div className="bg-[#05070A] rounded-[32px] sm:rounded-[44px] p-8 sm:p-14 lg:p-16 pb-14 sm:pb-20 lg:pb-24 text-white relative overflow-hidden border border-white/10 shadow-2xl">
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute top-0 right-1/4 w-[450px] h-[350px] bg-[#04564f]/10 blur-[140px] pointer-events-none rounded-full" />

          {/* Ambient Spotlight Dome at Bottom Center (Brand Teal / Emerald Matching Original Red Dome) */}
          <div className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[550px] sm:w-[750px] lg:w-[920px] h-[300px] sm:h-[420px] bg-gradient-to-t from-[#2dd4bf]/25 via-[#04564f]/45 to-transparent blur-[110px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[280px] sm:w-[420px] h-[150px] sm:h-[220px] bg-[#04564f] blur-[70px] rounded-full pointer-events-none opacity-80" />

          {/* Film Grain / Subtle Matrix Texture */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />

          {/* Section Header */}
          <div className="max-w-3xl relative z-10">
            <h2 className="text-4xl sm:text-5xl lg:text-[58px] font-black tracking-tight leading-[1.06] text-white">
              Get Heard Where It <br className="hidden sm:inline" />
              Matters Most
            </h2>
            <p className="mt-5 text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed font-normal">
              We position your music in front of the right audience. With our expertise in playlisting
              and radio promotion, your tracks can make it to curated playlists and airwaves,
              reaching listeners who appreciate your sound.
            </p>
          </div>

          {/* 4 Bento Numbered Cards with Hollow Outlined Numbers */}
          <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 relative z-10">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className="bg-[#0A0D14]/85 backdrop-blur-md border border-white/[0.08] hover:border-white/20 rounded-[22px] p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:bg-[#0E131E] group shadow-lg"
              >
                <div>
                  {/* Hollow Outlined Glyph Number */}
                  <span
                    className="text-4xl sm:text-5xl font-black block mb-5 select-none leading-none tracking-tight transition-transform duration-300 group-hover:scale-105"
                    style={{
                      WebkitTextStroke: '1.8px rgba(255, 255, 255, 0.95)',
                      color: 'transparent',
                      WebkitTextFillColor: 'transparent',
                      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                    }}
                  >
                    {card.num}
                  </span>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-2.5 tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed font-normal">
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
