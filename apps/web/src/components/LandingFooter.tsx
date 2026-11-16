'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles, Disc3, ShieldCheck } from 'lucide-react';

interface LandingFooterProps {
  onOpenAssessment?: () => void;
  onBookCall?: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onOpenAssessment,
  onBookCall
}) => {
  return (
    <footer className="bg-[#07090D] text-white pt-16 pb-12 border-t border-white/10 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#04564f]/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-14 pb-14 border-b border-white/10">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <a href="/" className="inline-block">
              <img
                src="/logo.png"
                alt="Caution Studio"
                className="h-10 sm:h-12 w-auto object-contain brightness-0 invert"
                style={{ width: 150 }}
              />
            </a>
            <p className="text-gray-400 text-sm sm:text-base max-w-sm leading-relaxed">
              Pioneering 360 music to the mass. We amplify your sound and connect you with global audiences and curators.
            </p>
            <p className="text-xs text-gray-500 font-mono">
              Your music deserves you making it.
            </p>
          </div>

          {/* Links Column 1: Explore */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">About</Link>
              </li>
              <li>
                <Link href="/artists" className="hover:text-white transition-colors">Artists &amp; Beats</Link>
              </li>
              <li>
                <Link href="/press" className="hover:text-white transition-colors">Press &amp; Media</Link>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Insights */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Insights
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li>
                <Link href="/services" className="hover:text-white transition-colors">Services</Link>
              </li>
              <li>
                <Link href="/case-studies" className="hover:text-white transition-colors">Case Studies</Link>
              </li>
              <li>
                <Link
                  href="/assessment"
                  className="flex items-center gap-1.5 text-[#2dd4bf] hover:text-white font-medium transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Artist Assessment
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">Pricing Plans</Link>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Follow */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Follow
            </h4>
            <ul className="space-y-2.5 text-sm text-gray-300">
              <li>
                <a href="https://x.com/cautionstudioz" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                  Twitter (X) <ArrowUpRight className="h-3 w-3 text-gray-500" />
                </a>
              </li>
              <li>
                <a href="https://instagram.com/cautionstudioz" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                  Instagram <ArrowUpRight className="h-3 w-3 text-gray-500" />
                </a>
              </li>
              <li>
                <a href="https://facebook.com/cautionstudioz" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                  Facebook <ArrowUpRight className="h-3 w-3 text-gray-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom System Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-gray-400">● LIVE SYSTEM // CAUTION STUDIO V2.4</span>
          </div>
          <div>
            © {new Date().getFullYear()} Caution Studio Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
