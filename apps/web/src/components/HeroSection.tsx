'use client';

import React, { useState } from 'react';
import { Button } from '@caution/ui';
import { ArrowRight, Sparkles, Disc3, Search, Play, Radio, Volume2 } from 'lucide-react';

interface HeroSectionProps {
  onAnalyze: (link: string) => void;
  onBookCall: () => void;
  onSignIn?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onAnalyze,
  onBookCall,
  onSignIn
}) => {
  const [profileLink, setProfileLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileLink.trim()) {
      onAnalyze(profileLink.trim());
    }
  };

  const partnerLogos = [
    { name: 'Vevo', label: 'VEVO' },
    { name: 'Genius', label: 'GENIUS' },
    { name: 'Smidi', label: 'smidi' },
    { name: 'FC', label: 'fc' },
    { name: 'Anthem', label: 'anthem' },
    { name: 'iHeart', label: 'iHeart' },
    { name: 'RCA', label: 'RCA' },
    { name: 'Spotify', label: 'Spotify' }
  ];

  return (
    <section className="relative overflow-hidden bg-[#07090D] text-white">
      {/* Background with Ambient Concert/City Billboard Glow */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Deep ambient gradients simulating billboard atmosphere */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[580px] bg-gradient-to-b from-[#04564f]/30 via-emerald-950/20 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[400px] bg-teal-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/3 left-0 w-[450px] h-[350px] bg-[#04564f]/15 blur-[120px] rounded-full" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
            backgroundSize: '36px 36px'
          }}
        />
        {/* Top to bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#07090D]" />
      </div>

      {/* Top Navbar Header inside Hero */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-10 sm:h-12 w-auto object-contain brightness-0 invert"
              style={{ width: 150 }}
            />
          </a>

          {/* Right Action */}
          <div className="flex items-center gap-3">
            {onSignIn && (
              <button
                type="button"
                onClick={onSignIn}
                className="hidden sm:inline-flex text-xs font-semibold text-gray-300 hover:text-white px-3 py-1.5 transition-colors"
              >
                Sign In
              </button>
            )}
            <Button
              variant="outline"
              size="sm"
              pill
              onClick={onBookCall}
              className="text-xs font-bold uppercase tracking-wider px-5 py-2 border-white/20 text-white hover:bg-white hover:text-black hover:border-white transition-all shadow-sm"
            >
              Book a Call
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-20 sm:pt-16 sm:pb-24 text-center">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white">
          Get your music in <br />
          front of billions.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-base text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Industry-promising A&amp;R team to the stars. Through expert distribution,
          marketing, playlisting and radio promotion, we amplify your sound and
          connect you with the right audience. Join us to make your mark in the
          industry.
        </p>

        {/* Artist Assessment Pill Badge */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-gray-200">
            <Disc3 className="h-3.5 w-3.5 text-[#2dd4bf] animate-spin" />
            <span>Start your Artist Assessment</span>
          </div>
        </div>

        {/* Spotify / Profile Link Input Pill */}
        <form
          onSubmit={handleSubmit}
          className="mt-5 max-w-xl mx-auto relative flex items-center bg-white rounded-full p-1.5 shadow-2xl shadow-black/60 border border-white/20"
        >
          <div className="pl-4 text-gray-400 pointer-events-none">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={profileLink}
            onChange={(e) => setProfileLink(e.target.value)}
            placeholder="Enter your Spotify profile link..."
            className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            pill
            className="shrink-0 text-xs uppercase font-bold tracking-wider px-6 py-2.5 bg-[#04564f] hover:bg-[#03453f] shadow-md text-white"
          >
            Analyze My Stats
          </Button>
        </form>

        {/* Partner Logos Bar */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 opacity-70">
            {partnerLogos.map((partner, idx) => (
              <span
                key={idx}
                className="text-xs sm:text-sm font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors select-none"
              >
                {partner.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
