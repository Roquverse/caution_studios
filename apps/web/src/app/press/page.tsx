'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import {
  Sparkles,
  Download,
  Mail,
  Newspaper,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Disc3,
  Award,
  Radio,
  CheckCircle2,
  Share2
} from 'lucide-react';

export default function PressPage() {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@cautionstudioz.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const pressReleases = [
    {
      date: 'November 2026',
      outlet: 'Caution Studio Press Desk',
      title: 'Caution Studio Unveils Version 2.4: Democratizing Commercial Beat Licensing for Emerging African Recording Artists',
      summary: 'With instant Paystack integration, lossless 24-bit stem deliveries, and an ad-supported streaming model, Caution Studio sets a new benchmark for accessible African music creation.',
      tag: 'Product Announcement'
    },
    {
      date: 'October 2026',
      outlet: 'Afrobeats Industry Report',
      title: 'How Caution Studio Is Tackling Copyright Strikes & YouTube Content ID for Independent African Creators',
      summary: 'A deep-dive into Caution Studio’s automated digital licensing contracts that guarantee 100% royalty-keeping and frictionless worldwide sync clearance.',
      tag: 'Industry Feature'
    },
    {
      date: 'September 2026',
      outlet: 'Lagos Tech & Media Daily',
      title: 'Producer Royalties Revolution: Caution Studio Crosses ₦15M Paid Out to Local Beatmakers in Q3',
      summary: 'Empowering beatmakers from Lagos, Abuja, and Accra to earn recurring monthly revenue from digital lease purchases and streaming ad allocations.',
      tag: 'Creator Economy'
    }
  ];

  const mediaCoverage = [
    {
      source: 'Pulse Nigeria',
      quote: '“Caution Studio is redefining how independent music is made in Nigeria, offering artists studio-grade beats without crippling financial overhead.”',
      author: 'Entertainment & Culture Desk'
    },
    {
      source: 'NotJustOk',
      quote: '“The missing bridge between top-tier producers and upcoming vocalists. A game changer for Afrobeats and Amapiano artists worldwide.”',
      author: 'A&R Spotlight'
    },
    {
      source: 'Native Mag',
      quote: '“A seamless digital marketplace with instant legal protections, high-grade WAV stems, and authentic African rhythmic identity.”',
      author: 'Music Tech Weekly'
    }
  ];

  const brandAssets = [
    {
      title: 'Caution Studio Master Logo (Dark)',
      format: 'High-Res PNG & Vector SVG',
      size: '2.4 MB',
      preview: '/logo.png'
    },
    {
      title: 'Caution Studio Brand Identity Kit',
      format: 'Color codes, typography & usage rules',
      size: '1.2 MB',
      preview: '/images/golden_clef.jpg'
    },
    {
      title: 'Official Studio Photography Suite',
      format: 'Editorial press photos (Lagos studio, artists & producers)',
      size: '18.5 MB',
      preview: '/images/african_mixing_engineer.jpg'
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
            <Newspaper className="h-3.5 w-3.5 text-teal-400" />
            <span className="uppercase tracking-wider">Press &amp; Media Hub</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Amplifying the Sound of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-[#2dd4bf] to-[#E8B896]">
              Modern African Music.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Everything journalists, curators, and partners need to know about Caution Studio — our mission, press releases, media coverage, and official brand assets.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleCopyEmail}
              className="h-11 px-6 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#04564f]/30 transition-all hover:scale-105 border border-[#2dd4bf]/30"
            >
              <Mail className="h-4 w-4 text-[#2dd4bf]" />
              <span>{copiedEmail ? 'Email Copied (support@cautionstudioz.com)!' : 'Media Inquiry: support@cautionstudioz.com'}</span>
            </button>

            <a
              href="#assets"
              className="h-11 px-6 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              <Download className="h-4 w-4 text-teal-400" />
              <span>Download Brand Kit</span>
            </a>
          </div>
        </div>
      </section>

      {/* Key Numbers / Fast Facts */}
      <section className="py-12 border-b border-white/5 bg-[#0A0D15]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-3xl sm:text-4xl font-black text-white font-mono">10,000+</div>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Curated Beats</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-3xl sm:text-4xl font-black text-[#2dd4bf] font-mono">40,000+</div>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Active Creators</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-3xl sm:text-4xl font-black text-[#E8B896] font-mono">100%</div>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Royalty-Keeping</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">24-Bit</div>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">Studio Stems</p>
            </div>
          </div>
        </div>
      </section>

      {/* Press Releases Section */}
      <section className="py-16 sm:py-20 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Official Statements</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Press Releases</h2>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Media Desk Live</span>
            </div>
          </div>

          <div className="space-y-4">
            {pressReleases.map((pr, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#0F131C] border border-white/10 hover:border-[#2dd4bf]/40 transition-all duration-300 shadow-lg group"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
                    {pr.tag}
                  </span>
                  <span className="text-xs font-mono text-gray-400">{pr.date} • {pr.outlet}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-teal-300 transition-colors leading-snug">
                  {pr.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-gray-300 leading-relaxed font-normal">
                  {pr.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media Quotes & Testimonials */}
      <section className="py-16 sm:py-20 bg-[#0A0D15]/80 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#E8B896]">Industry Recognition</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">What the Media Says</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mediaCoverage.map((m, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[#0F131C] border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="text-sm font-bold text-teal-400 uppercase tracking-wider mb-3">
                    {m.source}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed italic">
                    {m.quote}
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-white/5 text-[11px] font-mono text-gray-400">
                  — {m.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Assets Download Section */}
      <section id="assets" className="py-16 sm:py-20 border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Brand Kit &amp; Media Kit</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">Official Brand Assets</h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2 max-w-xl">
              Approved brand assets for press coverage, interviews, reviews, and editorial mentions. Please do not alter the logo aspect ratio or coloration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {brandAssets.map((asset, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-[#0F131C] border border-white/10 flex flex-col justify-between group hover:border-[#2dd4bf]/40 transition-all">
                <div>
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/60 border border-white/5 mb-4 flex items-center justify-center p-3 relative">
                    <img src={asset.preview} alt={asset.title} className="max-h-full max-w-full object-contain rounded-md" />
                  </div>
                  <h3 className="text-sm font-bold text-white leading-snug">{asset.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{asset.format}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-500">{asset.size}</span>
                  <a
                    href={asset.preview}
                    download
                    className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 font-bold"
                  >
                    <span>Download</span>
                    <Download className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Inquiries CTA */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0F1A1B] via-[#0A1314] to-[#121620] border border-[#2dd4bf]/30 shadow-2xl relative">
            <Mail className="h-10 w-10 text-teal-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Have a press, interview, or partnership inquiry?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-gray-300 max-w-xl mx-auto">
              Our communications team typically responds within 24 hours to verified journalists, podcast hosts, and industry publications.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:support@cautionstudioz.com"
                className="h-11 px-7 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#04564f]/30 transition-transform hover:scale-105 border border-[#2dd4bf]/30"
              >
                <Mail className="h-4 w-4" />
                <span>Email: support@cautionstudioz.com</span>
              </a>
              <Link
                href="/about"
                className="h-11 px-6 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold text-xs sm:text-sm border border-white/10 transition-colors"
              >
                <span>Read Our Mission Story</span>
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

