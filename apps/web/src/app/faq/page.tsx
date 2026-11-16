'use client';

import React from 'react';
import { TopNav } from '../../components/layout/TopNav';
import { LandingFooter } from '../../components/LandingFooter';
import { FaqSection } from '../../components/FaqSection';
import { Mail, ArrowRight } from 'lucide-react';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col selection:bg-[#04564f] selection:text-white">
      <TopNav />

      <main className="flex-1 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2dd4bf]">
            Knowledge Base
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mt-2">
            Frequently Asked Questions
          </h1>
          <p className="mt-3 text-sm text-neutral-400 max-w-xl mx-auto">
            Everything you need to know about our royalty-free music licensing, YouTube Content ID clearance, and pricing.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
          <FaqSection dark />
        </div>

        <div className="max-w-2xl mx-auto px-4 text-center pb-20">
          <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 space-y-4 backdrop-blur-xl">
            <Mail className="h-8 w-8 text-[#2dd4bf] mx-auto" />
            <h3 className="text-lg font-bold text-white">Still have questions?</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Our licensing support specialists are ready to help clarify custom licenses, multi-channel clearances, or enterprise broadcast contracts.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-6 py-3 bg-[#04564f] hover:bg-[#03453f] text-white rounded-full transition-all shadow-md shadow-[#04564f]/30"
            >
              <span>Contact Support</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#2dd4bf]" />
            </a>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
