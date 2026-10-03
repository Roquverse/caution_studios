'use client';

import React from 'react';
import { Layers, Megaphone, ListMusic, Radio } from 'lucide-react';

export const PillarsSection: React.FC = () => {
  const pillars = [
    {
      icon: <Layers className="h-6 w-6 text-[#04564f]" />,
      title: 'Distribution',
      description: 'Releasing your music on all major platforms'
    },
    {
      icon: <Megaphone className="h-6 w-6 text-[#04564f]" />,
      title: 'Marketing',
      description: 'Grow your fanbase and audience'
    },
    {
      icon: <ListMusic className="h-6 w-6 text-[#04564f]" />,
      title: 'Playlisting',
      description: 'Get your tracks on top playlists'
    },
    {
      icon: <Radio className="h-6 w-6 text-[#04564f]" />,
      title: 'Radio Promotion',
      description: 'Get airplay on top stations'
    }
  ];

  return (
    <section className="bg-white py-14 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {pillars.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center group">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#04564f]/10 text-[#04564f] mb-3 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-950">
                {item.title}
              </h3>
              <p className="mt-1 text-xs text-gray-500 max-w-[200px] leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
