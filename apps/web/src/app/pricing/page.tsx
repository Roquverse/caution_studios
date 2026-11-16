'use client';

import React from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import { formatNaira } from '../../lib/paystack';
import { APP_URL } from '../../lib/urls';
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

        {/* Subscription Plans */}
        <div className="mb-20">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-6 text-center">
            Artist &amp; Producer Membership Tiers
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Caution Plus */}
            <div className="p-6 sm:p-8 rounded-2xl bg-surface-2 border border-border flex flex-col justify-between relative shadow-lg">
              <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-text uppercase tracking-wider">
                With Ads
              </div>

              <div>
                <h3 className="text-xl font-bold text-text">Caution Plus</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-text">
                    {formatNaira(3000)}
                  </span>
                  <span className="text-xs text-text-muted">/ month</span>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Ad-supported studio access with 62 beats per month.
                </p>

                <ul className="mt-6 pt-5 border-t border-border space-y-2.5 text-xs text-text-muted">
                  <li className="flex items-center gap-2 text-text font-medium">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>2 Free Daily Downloads (resets after 24 hours)</span>
                  </li>
                  <li className="flex items-center gap-2 text-text font-medium">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>+2 Bonus Downloads daily via 15s sponsored ads</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>Access to 62 beats every month</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>Lossless streaming with audio sponsor breaks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>Non-exclusive commercial release rights (YouTube, DSPs)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/subscriptions"
                  className="w-full h-11 rounded-full bg-white/10 hover:bg-white/15 text-text font-semibold text-xs flex items-center justify-center border border-white/15 shadow-sm uppercase tracking-wider"
                >
                  Subscribe to Plus ({formatNaira(3000)}/mo)
                </Link>
              </div>
            </div>

            {/* Caution Pro */}
            <div className="p-6 sm:p-8 rounded-2xl bg-surface-2 border border-accent-live ring-1 ring-accent-live flex flex-col justify-between relative shadow-2xl">
              <div className="absolute -top-2.5 right-6 px-2.5 py-0.5 rounded-full bg-accent border border-accent text-[10px] font-bold text-text uppercase tracking-wider shadow-sm">
                Recommended &bull; Studio Suite
              </div>

              <div>
                <h3 className="text-xl font-bold text-text">Caution Pro</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black font-mono text-text">
                    {formatNaira(30000)}
                  </span>
                  <span className="text-xs text-text-muted">/ month</span>
                </div>
                <p className="text-xs text-text-muted mt-2">
                  Unlimited downloads with zero ads &amp; in-browser Studio Suite enabled.
                </p>

                <ul className="mt-6 pt-5 border-t border-border space-y-2.5 text-xs text-text-muted">
                  <li className="flex items-center gap-2 text-text font-medium">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span><strong>Unlimited Downloads &bull; 100% Ad-Free</strong> (Zero limits)</span>
                  </li>
                  <li className="flex items-center gap-2 text-text font-medium">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span><strong>Studio Page Enabled (/studio)</strong> &bull; Vocal recording suite</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>Full WAV Trackout Stems (.ZIP) for every beat</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>100% Royalty keeping on all commercial releases</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>Radio airplay, TV, cinema &amp; video game sync clearance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent-live" />
                    <span>Priority A&amp;R pitching &amp; VIP Studio support</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/subscriptions"
                  className="w-full h-11 rounded-full bg-accent hover:bg-[#135d56] text-text font-semibold text-xs flex items-center justify-center border border-accent shadow-sm uppercase tracking-wider"
                >
                  Subscribe to Pro ({formatNaira(30000)}/mo)
                </Link>
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
                  <a
                    href={APP_URL}
                    className="w-full h-9 rounded-pill bg-surface hover:bg-surface-2 text-text text-xs font-medium border border-border flex items-center justify-center"
                  >
                    Browse beats
                  </a>
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
