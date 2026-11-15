'use client';

import React from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import { APP_URL, CREATOR_URL } from '../../lib/urls';
import {
  Sparkles,
  Music2,
  Sliders,
  ShieldCheck,
  Radio,
  ArrowRight,
  Disc3,
  CheckCircle2,
  Headphones,
  Zap,
  Globe,
  Mic2,
  Share2,
  Award,
  Layers
} from 'lucide-react';

export default function ServicesPage() {
  const services = [
    {
      id: 'licensing',
      icon: Disc3,
      tag: 'Core Marketplace',
      color: 'teal',
      title: 'Commercial Beat Licensing & Stems',
      description: 'Stream untagged instrumentals and license high-quality audio files with immediate legal clearance.',
      highlights: [
        'Lossless 24-bit WAV masters + 320kbps MP3s',
        'Separated trackout stems (.ZIP) ready for mixing',
        'Automated Content ID clearance on YouTube, TikTok & DSPs',
        'Signed digital legal license agreements delivered instantly'
      ],
      actionLabel: 'Browse Beat Marketplace',
      actionHref: '/beats'
    },
    {
      id: 'custom-production',
      icon: Sliders,
      tag: 'Bespoke Studio',
      color: 'amber',
      title: 'Custom Production & Arranging',
      description: 'Collaborate 1-on-1 with verified African producers to craft an exclusive, signature sound for your EP or album.',
      highlights: [
        'Direct session with top Nigerian & African beatmakers',
        'Tailored key, BPM, and instrumentation matching your vocal register',
        'Arranged hook, bridge, and dynamic drop orchestration',
        '100% exclusive master transfer upon completion'
      ],
      actionLabel: 'Book a Production Session',
      actionHref: '/contact'
    },
    {
      id: 'mixing-mastering',
      icon: Headphones,
      tag: 'Audio Engineering',
      color: 'teal',
      title: 'Analog Mixing & 96kHz Mastering',
      description: 'Transform rough vocal recordings into polished, radio-ready masters optimized for Apple Music and Spotify.',
      highlights: [
        'Vocal pitch correction, timing alignment & de-essing',
        'Analog summing with rich harmonic saturation',
        'Accurate mastering to -14 LUFS international streaming standards',
        'Free revisions to guarantee sonic satisfaction'
      ],
      actionLabel: 'Request Mastering Quote',
      actionHref: '/contact'
    },
    {
      id: 'audio-ads',
      icon: Radio,
      tag: 'Artist Promotion',
      color: 'purple',
      title: '10s Audio Ads & Track Promotion',
      description: 'Promote your single directly to thousands of active artists and producers while they preview beats in the Caution player.',
      highlights: [
        '10-second unskippable audio snippet before beat playback',
        'Direct click-through links to your Spotify, Apple Music & Audiomack',
        'Real-time impression tracking & click-through analytics',
        'Cost-effective reach with zero algorithm interference'
      ],
      actionLabel: 'Launch an Audio Ad',
      actionHref: `${APP_URL}?tab=ads`
    },
    {
      id: 'sync-clearance',
      icon: ShieldCheck,
      tag: 'Legal & Publishing',
      color: 'teal',
      title: 'Commercial Sync Clearance',
      description: 'Clear royalty-free music for film, TV, cinema, wedding videography, gaming, podcasting, and corporate advertising.',
      highlights: [
        'Global worldwide territory coverage with no expiration date',
        'Pre-cleared masters with zero third-party sample liabilities',
        'Rapid clearance turnaround in under 24 hours',
        'Bespoke synchronization licenses for broadcast networks'
      ],
      actionLabel: 'View Licensing Policies',
      actionHref: '/license-policies'
    },
    {
      id: 'ar-pitching',
      icon: Award,
      tag: 'Artist Development',
      color: 'amber',
      title: 'A&R Scouting & Editorial Pitching',
      description: 'Get your releases noticed by DSP editors, playlist curators, and A&R scouts across the African music ecosystem.',
      highlights: [
        'Direct pitching pipeline to leading African playlist curators',
        'Free studio recording support for standout upcoming artists',
        'Community showcase features across our social networks',
        'Actionable artist assessment diagnostics for career growth'
      ],
      actionLabel: 'Take Artist Assessment',
      actionHref: '/assessment'
    }
  ];

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col selection:bg-[#E8B896] selection:text-black">
      <TopNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-24 pb-16 sm:pb-20 border-b border-white/5">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[400px] bg-gradient-to-tr from-[#04564f]/30 via-teal-500/15 to-transparent blur-3xl opacity-70" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-teal-300 mb-6 backdrop-blur-md">
            <Layers className="h-3.5 w-3.5 text-teal-400" />
            <span className="uppercase tracking-wider">360 Music Services</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Everything You Need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-[#2dd4bf] to-[#E8B896]">
              Create, Clear &amp; Scale.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            From studio beats and stem downloads to 10-second audio ad promotions and commercial sync clearance — we provide the end-to-end infrastructure for independent African music.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={APP_URL}
              className="h-11 px-7 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#04564f]/30 transition-all hover:scale-105 border border-[#2dd4bf]/30"
            >
              <Zap className="h-4 w-4 text-[#2dd4bf]" />
              <span>Launch Studio App</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <Link
              href="/pricing"
              className="h-11 px-6 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              <span>Explore Pricing Plans</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 sm:py-24 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Our Capabilities</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mt-1">
              Built for Recording Artists &amp; Producers
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-400">
              Each service is tailored to maximize your creative output, eliminate copyright roadblocks, and boost your commercial monetization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className="rounded-3xl bg-[#0F131C] border border-white/10 hover:border-[#2dd4bf]/40 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 shadow-xl hover:-translate-y-1 group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-[#2dd4bf] flex items-center justify-center group-hover:bg-[#04564f] group-hover:text-white transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
                        {service.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                      {service.title}
                    </h3>
                    <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                      {service.description}
                    </p>

                    <div className="mt-5 pt-4 border-t border-white/5 space-y-2.5">
                      {service.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5">
                    <Link
                      href={service.actionHref}
                      className="text-xs font-bold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1.5 transition-colors group/link"
                    >
                      <span>{service.actionLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Workflow Process Strip */}
      <section className="py-16 sm:py-20 bg-[#0A0D15]/80 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-[#E8B896]">How It Works</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-12">
            From Beat Preview to Global Distribution
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-[#0F131C] border border-white/10 relative">
              <div className="text-3xl font-black text-teal-400 font-mono mb-2">01</div>
              <h3 className="text-base font-bold text-white mb-1">Discover &amp; Audition</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Browse thousands of African beats by genre (Afrobeats, Amapiano, Trap, R&amp;B) and preview clean, untagged audio.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F131C] border border-white/10 relative">
              <div className="text-3xl font-black text-[#E8B896] font-mono mb-2">02</div>
              <h3 className="text-base font-bold text-white mb-1">Select License &amp; Checkout</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Pay securely with Naira cards or bank transfers via Paystack and instantly receive 24-bit WAVs + trackout stems (.ZIP).
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0F131C] border border-white/10 relative">
              <div className="text-3xl font-black text-emerald-400 font-mono mb-2">03</div>
              <h3 className="text-base font-bold text-white mb-1">Record, Monetize &amp; Promote</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Record your track, distribute worldwide without copyright strikes, and run 10s Caution Audio Ads to build your fanbase.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0F1A1B] via-[#0A1314] to-[#121620] border border-[#2dd4bf]/30 shadow-2xl relative">
            <Sliders className="h-10 w-10 text-teal-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Ready to elevate your music production?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-gray-300 max-w-xl mx-auto">
              Join thousands of creators who trust Caution Studio for beats, stems, and commercial legal protection.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href={APP_URL}
                className="h-11 px-7 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#04564f]/30 transition-transform hover:scale-105 border border-[#2dd4bf]/30"
              >
                <span>Get Started Now</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/contact"
                className="h-11 px-6 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold text-xs sm:text-sm border border-white/10 transition-colors"
              >
                <span>Speak with a Specialist</span>
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

