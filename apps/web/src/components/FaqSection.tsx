'use client';

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: '1',
    question: 'What is Caution Studio?',
    answer:
      'Caution Studio is a premier music beat streaming and licensing platform. Like Spotify for beats, artists and creators can stream studio-grade beats, subscribe monthly for commercial lease credits, buy premium beats with full trackout stems, or purchase 100% exclusive buyouts.'
  },
  {
    id: '2',
    question: 'Are Caution Studio digital assets royalty-free?',
    answer:
      'Yes, all beats and audio assets in our catalog are 100% royalty-free and copyright-cleared according to your selected license tier. Once you license a track, you receive instant legal clearance and keep 100% of your streaming royalties on DSPs (Spotify, Apple Music, YouTube).'
  },
  {
    id: '3',
    question: 'How do the plans work and what do they cover?',
    answer:
      'Caution Studio offers a range of plans, depending on the assets and license you need. We offer Beat Streaming & SFX plans, Trackout Stems and Exclusive Max — an all-in-one subscription giving you unlimited access to Caution Studio. You can get a Pro license that covers every type of video worldwide, including commercial use, or a Social license to cover your social media channels only.'
  },
  {
    id: '4',
    question: 'Can I try Caution Studio for free?',
    answer:
      'Yes! You can stream our catalog with audio previews, search by genre and BPM, and test beats directly in your DAW or video project before subscribing or purchasing a license.'
  },
  {
    id: '5',
    question: 'How many digital assets can you find at Caution Studio?',
    answer:
      'Our catalog features hundreds of studio-engineered Afrobeats, Amapiano, Trap, R&B, and Drill productions, updated weekly with new releases from award-winning producers.'
  }
];

export const FaqSection: React.FC = () => {
  // Question #3 is open by default matching the reference screenshot!
  const [openId, setOpenId] = useState<string | null>('3');

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="bg-white py-20 lg:py-28 border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 tracking-tight">
            Frequently asked questions
          </h2>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-[#04564f]/[0.03] border-[#04564f]/30 shadow-sm'
                    : 'bg-white border-gray-200/80 hover:border-gray-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left font-semibold text-gray-900 transition-colors"
                >
                  <span className={`text-sm sm:text-base font-medium ${isOpen ? 'text-[#04564f] font-bold' : 'text-gray-900'}`}>
                    {item.question}
                  </span>
                  <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center text-gray-500">
                    {isOpen ? (
                      <Minus className="h-4 w-4 text-[#04564f] stroke-[2.5]" />
                    ) : (
                      <Plus className="h-4 w-4 text-gray-400 stroke-[2]" />
                    )}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-[#04564f]/10">
                    <p>{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
