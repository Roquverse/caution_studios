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
  Users,
  Mic2,
  Sliders,
  ArrowRight,
  Disc3,
  CheckCircle2,
  Headphones,
  Flame,
  Award,
  ExternalLink
} from 'lucide-react';

export default function ArtistsPage() {
  const featuredProducers = [
    {
      handle: 'beatmaster-x',
      name: 'BeatMaster X',
      role: 'Afrobeats & Amapiano Specialist',
      location: 'Lagos, Nigeria',
      beatsCount: 48,
      streams: '3.2M',
      avatar: '/images/african_mixing_engineer.jpg',
      badge: 'Verified Master'
    },
    {
      handle: 'afro-vibez',
      name: 'AfroVibez Sound',
      role: 'Afro-Fusion & Melodic Trap',
      location: 'Abuja, Nigeria',
      beatsCount: 36,
      streams: '1.9M',
      avatar: '/images/african_producer_beats.jpg',
      badge: 'Trending Producer'
    },
    {
      handle: 'soul-piano',
      name: 'Soul Piano Keys',
      role: 'Deep Log-Drum Amapiano',
      location: 'Johannesburg / Lagos',
      beatsCount: 52,
      streams: '4.1M',
      avatar: '/images/african_vocal_session.jpg',
      badge: 'Chart Topper'
    }
  ];

  const genres = [
    { name: 'Afrobeats', count: '4,200+ Beats', desc: 'Burna Boy, Wizkid, Asake, Davido style grooves' },
    { name: 'Amapiano', count: '2,800+ Beats', desc: 'Deep log drums, soulful Rhodes pianos & percussion' },
    { name: 'Afro-Soul & R&B', count: '1,500+ Beats', desc: 'Lush guitars, organic basslines & emotional chords' },
    { name: 'Street-Hop & Drill', count: '1,200+ Beats', desc: 'High-energy 808s, street percussion & punchy kicks' }
  ];

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col selection:bg-[#E8B896] selection:text-black">
      <TopNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-24 pb-16 sm:pb-20 border-b border-white/5">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[400px] bg-gradient-to-tr from-[#04564f]/30 via-teal-500/15 to-transparent blur-3xl opacity-70" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-teal-300 mb-6 backdrop-blur-md">
            <Users className="h-3.5 w-3.5 text-teal-400" />
            <span className="uppercase tracking-wider">Artists &amp; Producers Hub</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Where African Artists Meet{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-[#2dd4bf] to-[#E8B896]">
              World-Class Producers.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Discover verified beatmakers, explore top-charting rhythm catalogs, and license commercial audio tracks with instant legal clearance.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/beats"
              className="h-11 px-7 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#04564f]/30 transition-all hover:scale-105 border border-[#2dd4bf]/30"
            >
              <Music2 className="h-4 w-4 text-[#2dd4bf]" />
              <span>Explore All Beats</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href={`${CREATOR_URL}/login`}
              className="h-11 px-6 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              <Sliders className="h-4 w-4 text-teal-400" />
              <span>Join as a Producer</span>
            </a>
          </div>
        </div>
      </section>

      {/* Featured Verified Producers */}
      <section className="py-16 sm:py-20 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Top Beatmakers</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Verified Studio Producers</h2>
            </div>
            <Link
              href="/beats"
              className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 group"
            >
              <span>View All Beats</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProducers.map((prod) => (
              <div
                key={prod.handle}
                className="rounded-2xl bg-[#0F131C] border border-white/10 p-6 flex flex-col justify-between group hover:border-[#2dd4bf]/40 transition-all"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-black border border-[#2dd4bf]/40 shrink-0">
                      <img src={prod.avatar} alt={prod.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block">{prod.badge}</span>
                      <h3 className="text-base font-bold text-white truncate">{prod.name}</h3>
                      <p className="text-xs text-gray-400 truncate">{prod.location}</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed mb-4">{prod.role}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono p-3 rounded-xl bg-black/40 border border-white/5">
                    <div>
                      <span className="text-gray-500 block text-[10px]">CATALOG</span>
                      <span className="font-bold text-white">{prod.beatsCount} Beats</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px]">TOTAL STREAMS</span>
                      <span className="font-bold text-[#2dd4bf]">{prod.streams}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/5">
                  <Link
                    href={`/beats?producer=${encodeURIComponent(prod.name)}`}
                    className="w-full h-9 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-white/10"
                  >
                    <span>Listen to Beats</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Genres Breakdown */}
      <section className="py-16 sm:py-20 bg-[#0A0D15]/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E8B896]">Musical Diversity</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Explore by Signature Sound</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {genres.map((g, idx) => (
              <Link
                key={idx}
                href={`/beats?genre=${encodeURIComponent(g.name)}`}
                className="p-6 rounded-2xl bg-[#0F131C] border border-white/10 hover:border-teal-500/40 transition-all hover:-translate-y-1 group"
              >
                <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 group-hover:bg-[#04564f] group-hover:text-white transition-colors">
                  <Disc3 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                  {g.name}
                </h3>
                <span className="text-xs font-mono text-teal-400 block mt-1">{g.count}</span>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">{g.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Direct CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0F1A1B] via-[#0A1314] to-[#121620] border border-[#2dd4bf]/30 shadow-2xl relative">
            <Headphones className="h-10 w-10 text-teal-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Ready to find the perfect beat for your next release?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-gray-300 max-w-xl mx-auto">
              Audition full-length untagged audio, download lossless 24-bit stems, and get instant commercial sync clearance.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/beats"
                className="h-11 px-7 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#04564f]/30 transition-transform hover:scale-105 border border-[#2dd4bf]/30"
              >
                <span>Browse Beats Store</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={APP_URL}
                className="h-11 px-6 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold text-xs sm:text-sm border border-white/10 transition-colors"
              >
                <span>Open User Dashboard</span>
              </a>
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

