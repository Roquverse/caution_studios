'use client';

import React from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import { formatNaira } from '../../lib/paystack';
import { AUTH_SIGNUP_URL } from '../../lib/urls';
import { Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PricingPage() {
  const licenseTiers = [
    {
      name: 'Starter Lease',
      priceNgn: 3000,
      period: 'per beat',
      features: [
        'Untagged 320kbps MP3 Master',
        'Up to 100,000 monetized streams',
        '1 monetized music video',
        'Non-exclusive commercial distribution',
        'Instant signed PDF license'
      ]
    },
    {
      name: 'Premium Beat Plan',
      priceNgn: 30000,
      period: 'one-time purchase',
      isPopular: true,
      features: [
        'Master 24-bit WAV + 320kbps MP3',
        'Full trackout separated stems (.ZIP)',
        'Up to 500,000 monetized streams',
        '2 monetized music videos',
        'Terrestrial and satellite radio play',
        'For-profit live performance rights'
      ]
    },
    {
      name: 'Exclusive Rights',
      priceNgn: 100000,
      period: 'sole master ownership',
      features: [
        '100% sole exclusive ownership',
        'Unlimited streams, sales & broadcast',
        'Master WAV + all separated stems',
        'Beat permanently retired from store',
        'TV, film, cinema & gaming sync clearance',
        'Full legal copyright transfer assignment'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col pb-24">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-live">
            Plans &amp; Licensing
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-text tracking-[-0.03em] mt-2">
            Built for independent artists
          </h1>
          <p className="text-sm text-text-muted mt-3">
            Choose single beat licenses or subscribe to Plus for monthly lease credits and clean, untagged preview streaming.
          </p>
        </div>

        {/* Free vs Plus Subscription Plans */}
        <div className="mb-20">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4 text-center">
            Artist Membership Tiers
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="p-6 sm:p-8 rounded-sm bg-surface border border-border flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-text">Free Artist</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-text">₦0</span>
                  <span className="text-xs text-text-muted">forever</span>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Browse, search, and preview beats with watermarked audio tags.
                </p>

                <ul className="mt-6 pt-5 border-t border-border space-y-2.5 text-xs text-text-muted">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>Unlimited watermarked preview streaming</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>Standard Paystack checkout</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>Library & license agreement storage</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/beats"
                  className="w-full h-10 rounded-pill bg-surface hover:bg-surface-2 text-text font-semibold text-xs flex items-center justify-center border border-border"
                >
                  Start free
                </Link>
              </div>
            </div>

            {/* Plus */}
            <div className="p-6 sm:p-8 rounded-sm bg-surface-2 border border-accent-live ring-1 ring-accent-live flex flex-col justify-between relative">
              <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded-sm bg-accent border border-accent text-[10px] font-bold text-text uppercase tracking-wider">
                Artist Plus
              </div>

              <div>
                <h3 className="text-lg font-bold text-text">Caution Plus</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-text">
                    {formatNaira(3000)}
                  </span>
                  <span className="text-xs text-text-muted">/ month</span>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Have access to 62 beats in a month with unlimited beat preview.
                </p>

                <ul className="mt-6 pt-5 border-t border-border space-y-2.5 text-xs text-text-muted">
                  <li className="flex items-center gap-2 text-text font-medium">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>Access to 62 beats every month (2 beats daily)</span>
                  </li>
                  <li className="flex items-center gap-2 text-text font-medium">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>Unlimited beat preview streaming (100% clean &amp; untagged)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>Daily 2-beat download quota (resets after 24 hours)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>15% discount on trackout stems and exclusive rights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>Priority A&amp;R playlist pitching recommendation</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <a
                  href={AUTH_SIGNUP_URL}
                  className="w-full h-10 rounded-pill bg-accent hover:bg-[#135d56] text-text font-semibold text-xs flex items-center justify-center border border-accent shadow-sm"
                >
                  Subscribe to Plus for {formatNaira(3000)}/mo
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Per-Beat License Tiers Breakdown */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4 text-center">
            Per-Beat License Tiers
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {licenseTiers.map((tier) => (
              <div
                key={tier.name}
                className={`p-6 rounded-sm bg-surface border ${
                  tier.isPopular ? 'border-accent-live bg-surface-2' : 'border-border'
                } flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-text">{tier.name}</h3>
                    {tier.isPopular && (
                      <span className="px-2 py-0.5 rounded-sm bg-accent text-[10px] font-bold text-text uppercase">
                        Popular
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-text">
                      {formatNaira(tier.priceNgn)}
                    </span>
                    <span className="text-xs text-text-muted">{tier.period}</span>
                  </div>

                  <ul className="mt-5 pt-4 border-t border-border space-y-2 text-xs text-text-muted">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-accent-live shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <Link
                    href="/beats"
                    className="w-full h-9 rounded-pill bg-surface hover:bg-surface-2 text-text text-xs font-medium border border-border flex items-center justify-center"
                  >
                    Browse beats
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <HomeFooter />
      <CartDrawer />
      <NowPlayingPanel />
    </div>
  );
}
