'use client';

import React from 'react';
import { Button } from '@caution/ui';
import { Check, Disc3 } from 'lucide-react';
import { AUTH_SIGNUP_URL } from '../lib/urls';

interface PricingSectionProps {
  onSelectPlan?: (planName: string, price: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const plans = [
    {
      id: 'starter',
      name: 'Starter Plan',
      price: '₦3,000',
      period: '/ month',
      description: 'Perfect for artists starting playlisting & streaming',
      isRecommended: false,
      features: [
        'Unlimited streaming & beat previewing',
        'High quality MP3 audio downloads',
        'Non-exclusive release rights',
        'Content ID clearance for 1 channel',
        'Community curator pitching support'
      ]
    },
    {
      id: 'premium',
      name: 'Premium Beat Plan',
      badge: 'Recommended',
      price: '₦30,000',
      period: 'one-time',
      description: 'For artists building a serious commercial catalog',
      isRecommended: true,
      features: [
        'High-Quality WAV + 320kbps MP3 Master',
        'Full Trackout Stems included',
        'Up to 500,000 monetized streams',
        'Radio airplay & music video sync',
        '100% Royalty keeping on releases',
        'Automated Content ID clearance'
      ]
    },
    {
      id: 'exclusive',
      name: 'Exclusive Rights Plan',
      price: '₦100,000',
      period: 'one-time',
      description: 'Full master ownership & unlimited commercial reach',
      isRecommended: false,
      features: [
        '100% Sole Exclusive Ownership',
        'Unlimited Streams, Sales & Broadcast',
        'Full Master WAV + Separated Stems',
        'Beat permanently removed from store',
        'TV, Film, Cinema, Game & Sync rights',
        'Custom legal contract & copyright transfer'
      ]
    }
  ];

  return (
    <section id="pricing" className="bg-white py-20 border-t border-gray-100 relative">
      <div id="credits" className="absolute -top-12" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 tracking-tight">
            Plans for Every Artist
          </h2>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-800">
            <Disc3 className="h-6 w-6 text-[#04564f]" />
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-7 sm:p-8 transition-all duration-300 relative flex flex-col justify-between ${
                plan.isRecommended
                  ? 'border-2 border-[#04564f] shadow-2xl shadow-[#04564f]/15 bg-white ring-1 ring-[#04564f]/20'
                  : 'border border-gray-200 bg-white hover:border-gray-300 shadow-sm'
              }`}
            >
              {/* Technical Dot Marker at Top Left */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-gray-300" />
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-200" />
                </div>
                {plan.badge && (
                  <span className="bg-[#04564f] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    {plan.badge}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-950">
                  {plan.name}
                </h3>
                <p className="mt-1.5 text-xs text-gray-500 leading-relaxed min-h-[34px]">
                  {plan.description}
                </p>

                {/* Price Display */}
                <div className="mt-6 flex items-baseline gap-1.5 pb-6 border-b border-gray-100">
                  <span className="text-3xl sm:text-4xl font-black text-gray-950">
                    {plan.price}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {plan.period}
                  </span>
                </div>

                {/* Features List */}
                <div className="mt-6 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                    What&apos;s Included:
                  </span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                      <Check className="h-4 w-4 text-[#04564f] shrink-0 stroke-[2.5] mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4">
                <Button
                  variant={plan.isRecommended ? 'primary' : 'outline'}
                  size="md"
                  pill
                  onClick={() =>
                    onSelectPlan
                      ? onSelectPlan(plan.name, plan.price)
                      : (window.location.href = AUTH_SIGNUP_URL)
                  }
                  className={`w-full text-xs font-bold uppercase tracking-wider py-3 ${
                    plan.isRecommended
                      ? 'bg-[#04564f] hover:bg-[#03453f] text-white shadow-md'
                      : 'border-gray-300 text-gray-800 hover:border-black hover:bg-gray-50'
                  }`}
                >
                  Choose Plan
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
