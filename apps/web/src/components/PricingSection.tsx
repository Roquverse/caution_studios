'use client';

import React from 'react';
import { Button } from '@caution/ui';
import { Check, Disc3 } from 'lucide-react';
import { APP_URL } from '../lib/urls';

interface PricingSectionProps {
  onSelectPlan?: (planName: string, price: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const plans = [
    {
      id: 'plus',
      name: 'Caution Plus',
      badge: 'Ad-Supported',
      price: '₦3,000',
      period: '/ month',
      description: 'Ad-supported studio tier with 62 beats per month',
      isRecommended: false,
      features: [
        'Access to 62 beats in a month (2 beats daily)',
        'Up to 2 extra bonus downloads daily via 15s ads',
        'Unlimited beat preview streaming with audio ads',
        'High quality MP3 audio downloads',
        'Non-exclusive commercial release rights',
        'Standard community & curator pitching support'
      ]
    },
    {
      id: 'pro',
      name: 'Caution Pro',
      badge: 'Recommended',
      price: '₦10,000',
      period: '/ month',
      description: 'Unlimited downloads with zero ads & in-browser Studio Suite enabled',
      isRecommended: true,
      features: [
        'Unlimited Beat Downloads (100% Ad-Free)',
        'In-Browser Studio Recording Suite enabled (/studio)',
        'Full Master WAV audio downloads included',
        '100% Royalty keeping on your releases',
        'Radio airplay, TV, cinema & music video sync',
        'Automated Content ID clearance',
        'Priority A&R playlist pitching & VIP Studio support'
      ]
    },
    {
      id: 'trackout',
      name: 'Trackout Beat Plan',
      badge: 'Stems License',
      price: '₦30,000+',
      period: '/ beat',
      description: 'Individual multitrack stems & master WAV for custom mixing',
      isRecommended: false,
      features: [
        'Full 24-bit/48kHz Master WAV audio file',
        'Complete separated trackout stems (.ZIP)',
        'Commercial streaming rights up to 500k plays',
        'Music video, YouTube & TV broadcast rights',
        'Full mixing, vocal tracking & arrangement freedom',
        'Instant signed PDF synchronization agreement'
      ]
    },
    {
      id: 'exclusive',
      name: 'Exclusive Rights Plan',
      badge: 'Sole Buyout',
      price: '₦100,000+',
      period: '/ buyout',
      description: 'Full master ownership & unlimited commercial reach',
      isRecommended: false,
      features: [
        '100% Sole Exclusive Ownership & Master Buyout',
        'Unlimited Streams, Sales, Radio & Cinema Sync',
        'Full Master WAV + complete individual trackout stems (.ZIP)',
        'Beat permanently removed from store',
        'TV, Film, Cinema, Game & Sync rights included',
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
            <Disc3 className="h-6 w-6 text-[#e53935]" />
          </div>
        </div>

        {/* 4 Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 sm:p-7 transition-all duration-300 relative flex flex-col justify-between ${
                plan.isRecommended
                  ? 'border-2 border-[#e53935] shadow-2xl shadow-[#e53935]/15 bg-white ring-1 ring-[#e53935]/20'
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
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${
                      plan.isRecommended
                        ? 'bg-[#e53935] text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
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
                  <span className="text-3xl font-black text-gray-950">
                    {plan.price.replace('+', '')}
                  </span>
                  {plan.price.endsWith('+') && (
                    <span className="text-xl font-black text-[#e53935]">+</span>
                  )}
                  <span className="text-xs text-gray-400 font-medium">
                    {plan.period}
                  </span>
                </div>

                {/* Features List */}
                <div className="mt-6 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                    What&apos;s Included:
                  </span>
                  {plan.features.map((feat, idx) => {
                    const isOptional = feat.includes('(optional)');
                    const label = feat.replace(' (optional)', '');
                    return (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                        <Check
                          className={`h-4 w-4 shrink-0 stroke-[2.5] mt-0.5 ${
                            plan.isRecommended ? 'text-[#e53935]' : 'text-gray-900'
                          }`}
                        />
                        <span className={`leading-snug ${isOptional ? 'text-gray-400 italic' : ''}`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-4">
                <Button
                  variant={plan.isRecommended ? 'primary' : 'outline'}
                  size="md"
                  pill
                  onClick={() => {
                    if (onSelectPlan) {
                      onSelectPlan(plan.name, plan.price);
                    } else {
                      window.location.href = APP_URL;
                    }
                  }}
                  className={`w-full text-xs font-bold uppercase tracking-wider py-3 ${
                    plan.isRecommended
                      ? 'bg-[#e53935] hover:bg-[#d32f2f] text-white shadow-md'
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
