'use client';

import React from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import { CREATOR_URL } from '../../lib/urls';
import {
  Sparkles,
  Music2,
  Mic2,
  Sliders,
  ShieldCheck,
  Zap,
  ArrowRight,
  Headphones,
  Crown,
  HeartHandshake,
  CheckCircle2,
  Globe2,
  Flame,
  Radio
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col selection:bg-[#E8B896] selection:text-black">
      <TopNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-24 pb-16 sm:pb-20 border-b border-white/5">
        {/* Ambient Gradient Glows */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-[#E8B896]/15 via-teal-500/10 to-transparent blur-3xl opacity-60" />
        <div className="pointer-events-none absolute top-1/2 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#E8B896] mb-6 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#E8B896]" />
            <span className="uppercase tracking-wider">About Caution Studio</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Empowering Artists.{' '}
            <span className="text-[#E8B896] block sm:inline">Supporting Producers.</span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-400 to-[#E8B896]">
              Making Music Accessible.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-normal">
            At Caution Studio, we believe that every talented artist deserves the opportunity to bring their musical vision to life, regardless of their budget or level of experience.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/beats"
              className="h-11 px-6 rounded-full bg-[#E8B896] hover:bg-[#d8a886] text-black font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#E8B896]/20 transition-all hover:scale-105"
            >
              <Music2 className="h-4 w-4" />
              <span>Explore Beats Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/beats?section=free"
              className="h-11 px-6 rounded-full bg-[#11141D] hover:bg-white/10 text-teal-300 border border-teal-500/30 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all hover:border-teal-400"
            >
              <Headphones className="h-4 w-4 text-teal-400" />
              <span>Free Beat Section</span>
            </Link>

            <a
              href={CREATOR_URL}
              target="_blank"
              rel="noreferrer"
              className="h-11 px-6 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              <Sliders className="h-4 w-4 text-[#E8B896]" />
              <span>Join as a Producer</span>
            </a>
          </div>
        </div>
      </section>

      {/* Main Narrative & Philosophy */}
      <section className="py-16 sm:py-24 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left Story Card */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400">
                <Mic2 className="h-4 w-4" />
                <span>Our Core Purpose</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
                Removing the barriers that hold back emerging talent.
              </h2>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                We are passionate about supporting upcoming artists by providing affordable, accessible, royalty-free beats that make the music production journey easier, smoother, and more affordable.
              </p>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Our goal is to remove the barriers that often prevent emerging talents from creating quality music, giving them the freedom to focus on their creativity, develop their sound, and share their stories with the world.
              </p>

              <div className="pt-2 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/10">
                  <div className="text-2xl font-black text-[#E8B896]">12,000+</div>
                  <div className="text-xs text-gray-400 mt-1">Curated Instrumentals</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#0F131C] border border-white/10">
                  <div className="text-2xl font-black text-teal-400">100% Free</div>
                  <div className="text-xs text-gray-400 mt-1">Ad-Supported Streaming</div>
                </div>
              </div>
            </div>

            {/* Right Interactive Highlight Box */}
            <div className="rounded-3xl bg-gradient-to-b from-[#131826] to-[#0A0D14] border border-white/10 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Flame className="h-48 w-48 text-[#E8B896]" />
              </div>

              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#E8B896]/20 text-[#E8B896] flex items-center justify-center font-bold">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">For Music Producers</h3>
                    <p className="text-xs text-gray-400">A sustainable platform to scale your catalog</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  Our mission goes beyond supporting artists. Caution Studio also provides a platform for music producers to showcase their creativity, promote their instrumentals, and sell their beats to artists looking for their next hit.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-2.5 text-xs text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Earn monthly royalties</strong> while supporting upcoming artists through our ad & subscription pool.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Instant Paystack withdrawals</strong> straight to Nigerian and African bank accounts.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-gray-300">
                    <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                    <span><strong>Verified Producer badge</strong> when reaching ₦50,000 monthly streaming threshold.</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-gray-400">Ready to post your beats?</span>
                  <a
                    href={`${CREATOR_URL}/login`}
                    className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 group"
                  >
                    <span>Open Creator Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Caution Community Promise */}
      <section className="py-16 sm:py-24 bg-[#0A0D15]/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E8B896] mb-2">
              <HeartHandshake className="h-4 w-4" />
              <span>Our Community Promise</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Where creativity can thrive without unnecessary financial barriers.
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-gray-400 leading-relaxed">
              We are building a community where artists can find their sound, producers can grow their businesses, and creativity can thrive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Free Beats */}
            <div className="rounded-2xl bg-[#0F131C] border border-white/10 hover:border-teal-500/40 p-6 space-y-4 transition-all hover:-translate-y-1 group">
              <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-black transition-colors">
                <Headphones className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                Free Beat Streaming
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Stream hundreds of full-length instrumentals for free. Rehearse, write lyrics, and audition vibes without spending a dime. Supported by non-intrusive short audio ads every 3 songs.
              </p>
              <div className="pt-2">
                <Link
                  href="/beats?section=free"
                  className="text-xs font-bold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1.5"
                >
                  <span>Browse Free Beats</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Card 2: Premium Licenses */}
            <div className="rounded-2xl bg-[#0F131C] border border-white/10 hover:border-amber-500/40 p-6 space-y-4 transition-all hover:-translate-y-1 group">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                Premium Commercial Leases
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Standard non-exclusive commercial licenses at ₦30,000. Get uncompressed 24-bit studio WAVs and separated trackout stems (.ZIP) ready for mixing, mastering, and DSP distribution.
              </p>
              <div className="pt-2">
                <Link
                  href="/beats?section=premium"
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1.5"
                >
                  <span>View Premium Beats</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Card 3: Exclusive Buyouts */}
            <div className="rounded-2xl bg-[#0F131C] border border-white/10 hover:border-purple-500/40 p-6 space-y-4 transition-all hover:-translate-y-1 group">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-black transition-colors">
                <Crown className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                100% Exclusive Buyouts
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Sole master ownership rights (₦100,000+). Once purchased, the beat is permanently retired from our store and cannot be licensed to any other artist. Complete copyright transfer agreement included.
              </p>
              <div className="pt-2">
                <Link
                  href="/beats?section=exclusive"
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 inline-flex items-center gap-1.5"
                >
                  <span>View Exclusive Beats</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Banner CTA */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#141B26] via-[#111622] to-[#1A1826] border border-white/10 shadow-2xl relative">
            <Radio className="h-10 w-10 text-[#E8B896] mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              We make beats accessible, opportunities possible, and the journey to making great music easier for everyone.
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
              Join thousands of recording artists and producers building their careers on Caution Studio today.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/beats"
                className="h-11 px-7 rounded-full bg-[#E8B896] hover:bg-[#d8a886] text-black font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
              >
                <span>Start Listening</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="h-11 px-6 rounded-full bg-white/5 hover:bg-white/10 text-white font-semibold text-xs sm:text-sm border border-white/10 transition-colors"
              >
                <span>Contact Our Team</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HomeFooter />
      <CartDrawer />
      <NowPlayingPanel />
    </div>
  );
}
