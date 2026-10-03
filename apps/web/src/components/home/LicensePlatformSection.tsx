'use client';

import React from 'react';
import Link from 'next/link';
import { formatNaira } from '../../lib/paystack';
import { Check, ShieldCheck, ArrowRight } from 'lucide-react';

export const LicensePlatformSection: React.FC = () => {
  const tiers = [
    {
      name: 'Starter Lease',
      priceNgn: 3000,
      period: 'per month',
      description: 'Perfect for artists starting out on streaming and social platforms.',
      isPopular: false,
      features: [
        'Untagged 320kbps MP3 audio master',
        'Up to 100,000 monetized audio streams',
        '1 monetized music video',
        'Non-exclusive distribution rights',
        'Instant digital agreement delivery'
      ]
    },
    {
      name: 'Premium Beat Plan',
      priceNgn: 30000,
      period: 'one-time purchase',
      description: 'For serious artists building catalog with stems and radio broadcasting.',
      isPopular: true,
      features: [
        'Studio Master 24-bit WAV + 320kbps MP3',
        'Separated trackout stems (.ZIP)',
        'Up to 500,000 monetized streams',
        '2 monetized music videos',
        'Terrestrial and satellite radio rotation',
        'For-profit live performance rights'
      ]
    },
    {
      name: 'Exclusive Rights',
      priceNgn: 100000,
      period: 'sole master ownership',
      description: '100% sole exclusive ownership. The beat is retired from the marketplace.',
      isPopular: false,
      features: [
        'Sole master copyright transfer contract',
        'Unlimited monetized streams & sales',
        'Unlimited music videos & sync licensing',
        'Full WAV master and all stem trackouts',
        'Beat permanently retired from store',
        'Television, film and commercial game clearance'
      ]
    }
  ];

  return (
    <section id="pricing" className="bg-bg py-16 sm:py-24 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-live">
            Transparent Licensing
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-text tracking-[-0.03em] mt-1">
            Simple tiers. No hidden royalties.
          </h2>
          <p className="text-sm sm:text-base text-text-muted mt-2">
            Every license comes with an automated legal agreement signed by the producer and instant download access to your master audio.
          </p>
        </div>

        {/* 3 Tier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`p-6 sm:p-7 rounded-sm flex flex-col justify-between border ${
                tier.isPopular
                  ? 'bg-surface-2 border-accent-live ring-1 ring-accent-live'
                  : 'bg-surface border-border'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-text">{tier.name}</h3>
                  {tier.isPopular && (
                    <span className="px-2 py-0.5 rounded-sm bg-accent border border-accent text-[10px] font-bold text-text uppercase tracking-wider">
                      Popular
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-text">
                    {formatNaira(tier.priceNgn)}
                  </span>
                  <span className="text-xs text-text-muted font-normal">
                    {tier.period}
                  </span>
                </div>

                <p className="text-xs text-text-muted mt-2 leading-relaxed">
                  {tier.description}
                </p>

                <ul className="mt-6 pt-5 border-t border-border space-y-2.5 text-xs text-text-muted">
                  {tier.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-accent-live shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/beats"
                  className={`w-full h-10 rounded-pill font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border ${
                    tier.isPopular
                      ? 'bg-accent hover:bg-[#135d56] text-text border-accent'
                      : 'bg-surface hover:bg-surface-2 text-text border-border'
                  }`}
                >
                  <span>Browse beats for {tier.name}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
