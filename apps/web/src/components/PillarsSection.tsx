'use client';

import React from 'react';
import { Headphones, Sparkles, Layers, Lock } from 'lucide-react';

export const PillarsSection: React.FC = () => {
  const pillars = [
    {
      icon: <Headphones className="h-6 w-6 text-[#04564f]" />,
      title: 'Beat Streaming',
      description: 'Stream unlimited untagged beats like Spotify'
    },
    {
      icon: <Sparkles className="h-6 w-6 text-[#04564f]" />,
      title: 'Monthly Subscriptions',
      description: '₦3,000/mo for regular commercial lease credits'
    },
    {
      icon: <Layers className="h-6 w-6 text-[#04564f]" />,
      title: 'Master WAV & Stems',
      description: '24-bit studio stems ready for pro mixing & DSPs'
    },
    {
      icon: <Lock className="h-6 w-6 text-[#04564f]" />,
      title: 'Exclusive Buyouts',
      description: 'Sole ownership — beat is permanently retired'
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
