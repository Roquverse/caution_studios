'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is the difference between leasing and buying exclusively?',
      a: 'Leasing gives you non-exclusive rights to record and stream your song up to a specific stream cap (100k for Starter, 500k for Premium). Exclusive ownership transfers 100% sole copyright to you, and the beat is permanently removed from Caution Studio so no other artist can ever buy it.'
    },
    {
      q: 'How does Paystack payment work for Nigerian and international artists?',
      a: 'Paystack supports direct debit cards (Mastercard, Visa, Verve), bank transfers, USSD, and Apple Pay. Transactions are processed securely in seconds and your master audio files and license PDF become available immediately.'
    },
    {
      q: 'What files do I get when I purchase stems?',
      a: 'Stem files are delivered as a compressed .ZIP containing individual 24-bit WAV tracks (isolated kicks, snares, 808 bass, melody synths, guitars, vocal chops, and percussions) so your audio engineer can execute a professional final mix and master.'
    },
    {
      q: 'Can I upload my song to Spotify, Apple Music, and YouTube?',
      a: 'Yes! All license tiers include commercial digital distribution rights. You retain 100% of your artist streaming royalties on your distributed releases.'
    },
    {
      q: 'How do I start selling beats as a producer?',
      a: 'Click "For producers" or go to /studio. Create your producer profile, configure your Paystack payout bank account, upload your WAV master, and set your own license prices. Producers receive 80% of every sale directly.'
    }
  ];

  return (
    <section id="faq" className="bg-bg py-16 sm:py-24 border-b border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-live">
            Clear Answers
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-text tracking-[-0.03em] mt-1">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-sm bg-surface border border-border overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-text hover:text-accent-live transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-text-muted shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-accent-live' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-text-muted leading-relaxed border-t border-border pt-3">
                    {faq.a}
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
