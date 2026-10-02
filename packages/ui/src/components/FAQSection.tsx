import React from 'react';
import { FAQItem } from '@caution/types';
import { Accordion } from './Accordion';
import { cn } from '../utils/cn';

export interface FAQSectionProps {
  items?: FAQItem[];
  className?: string;
}

const DEFAULT_FAQ_ITEMS: FAQItem[] = [
  {
    id: '1',
    question: 'What is Artlist?',
    answer:
      'Artlist is a leading creative platform providing high-quality, royalty-free music, sound effects, stock footage, and templates for filmmakers, YouTubers, commercial agencies, and content creators worldwide.'
  },
  {
    id: '2',
    question: 'Are Artist digital assets royalty-free?',
    answer:
      'Yes, all musical tracks and audio assets in our catalog are 100% royalty-free. Once you download a track with an active subscription, you hold a perpetual license to use that music in your video project forever.'
  },
  {
    id: '3',
    question: 'How do the plans work and what do they cover?',
    answer:
      'Artlist offers a range of plans, depending on the assets and license you need. We offer Music & SFX plans, Footage & Templates plans and Artlist Max — an all-in-one subscription giving you unlimited access to Artlist. You can get a Pro license that covers every type of video worldwide, including commercial use, or a Social License to cover your social media channels only.'
  },
  {
    id: '4',
    question: 'Can I try Artlist for free?',
    answer:
      'Yes! You can browse the entire catalog, listen to full-length tracks with interactive waveforms, and create custom playlists completely free before subscribing to a download plan.'
  },
  {
    id: '5',
    question: 'How many digital assets can you find at artlist?',
    answer:
      'Our library features tens of thousands of exclusive songs, sound effects, and stems produced by Grammy-winning artists, indie composers, and world-class sound designers, updated daily.'
  }
];

export const FAQSection: React.FC<FAQSectionProps> = ({
  items = DEFAULT_FAQ_ITEMS,
  className
}) => {
  const accordionData = items.map((item) => ({
    id: item.id,
    title: item.question,
    content: <p className="leading-relaxed text-gray-600">{item.answer}</p>
  }));

  return (
    <section className={cn('py-20 lg:py-28 bg-[#FAFAFC]', className)}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
            Frequently asked questions
          </h2>
        </div>

        {/* Accordion */}
        <Accordion
          items={accordionData}
          defaultOpenId="3" // matches the expanded item #3 in screenshot!
        />
      </div>
    </section>
  );
};
