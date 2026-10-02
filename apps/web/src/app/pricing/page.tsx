'use client';

import React, { useState } from 'react';
import { Navbar, Footer, Button, Card, Badge, MOCK_PLANS } from '@caution/ui';
import { Check, ShieldCheck, Zap } from 'lucide-react';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'yearly' | 'monthly'>('yearly');

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Navbar
        brandName="Music Website"
        currentPath="/pricing"
        onStartFree={() => (window.location.href = 'http://localhost:3001/register')}
        onSignIn={() => (window.location.href = 'http://localhost:3001/login')}
        userPortalUrl="http://localhost:3002"
        adminPortalUrl="http://localhost:3003"
        onNavigate={(href) => (window.location.href = href)}
      />

      <main className="flex-1 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="brand" size="md" className="mb-4">
            Transparent Music Licensing
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-950 tracking-tight">
            Simple plans for creators of all sizes
          </h1>
          <p className="mt-4 text-base text-gray-500 max-w-2xl mx-auto">
            Unlimited downloads. Direct Content ID clearance. All tracks cleared for commercial monetization worldwide.
          </p>

          {/* Billing Switcher */}
          <div className="mt-10 flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold ${billingPeriod === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
              Monthly billing
            </span>
            <button
              type="button"
              onClick={() => setBillingPeriod(billingPeriod === 'yearly' ? 'monthly' : 'yearly')}
              className="relative inline-flex h-7 w-12 items-center rounded-full bg-blue-600 transition-colors focus:outline-none"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  billingPeriod === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-semibold flex items-center gap-1.5 ${billingPeriod === 'yearly' ? 'text-gray-900' : 'text-gray-400'}`}>
              Annual billing <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Save 35%</span>
            </span>
          </div>

          {/* Pricing Cards */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {MOCK_PLANS.map((plan) => {
              const price = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;
              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-8 border transition-all duration-300 relative flex flex-col justify-between ${
                    plan.popular
                      ? 'border-[#1E50FF] shadow-2xl shadow-[#1E50FF]/15 bg-white ring-2 ring-[#1E50FF]'
                      : 'border-gray-200 bg-white hover:border-gray-300 shadow-sm'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-[#1E50FF] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-bold text-gray-950">{plan.name}</h3>
                    <p className="mt-2 text-xs text-gray-500 leading-relaxed min-h-[36px]">
                      {plan.description}
                    </p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-gray-950">${price}</span>
                      <span className="text-xs text-gray-400 font-medium">/ month billed {billingPeriod}</span>
                    </div>

                    <div className="mt-8 space-y-3 border-t border-gray-100 pt-6">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                        Included Features:
                      </span>
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700">
                          <Check className="h-4 w-4 text-[#1E50FF] shrink-0 stroke-[3] mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-4">
                    <Button
                      variant={plan.popular ? 'primary' : 'secondary'}
                      size="md"
                      pill
                      className="w-full text-xs font-bold uppercase tracking-wider py-3"
                      onClick={() => (window.location.href = `http://localhost:3001/register?plan=${plan.slug}`)}
                    >
                      Subscribe to {plan.name}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer brandName="Music Website" />
    </div>
  );
}
