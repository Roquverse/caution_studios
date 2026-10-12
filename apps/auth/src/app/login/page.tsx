'use client';

import React, { useState } from 'react';
import { Button } from '@caution/ui';
import { ArrowRight, Lock, Mail, ArrowUpRight, Play, Disc3, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const USER_PORTAL_URL = process.env.NEXT_PUBLIC_USER_URL || 'https://app.cautionstudioz.com';
const ADMIN_PORTAL_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.cautionstudioz.com';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://cautionstudioz.com';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      const targetUrl = email.toLowerCase().includes('admin')
        ? ADMIN_PORTAL_URL
        : USER_PORTAL_URL;

      window.location.href = targetUrl;
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#07090D] text-white selection:bg-[#04564f] selection:text-white">
      {/* Left Column: Rich Multi-Image Studio Showcase */}
      <div className="w-full lg:w-1/2 bg-[#0A0D14] p-6 sm:p-10 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.08]">
        <div>
          {/* Top Bar with Brand & Telemetry Badge */}
          <div className="flex items-center justify-between">
            <a href={WEB_URL} className="inline-block">
              <img
                src="/logo.png"
                alt="Caution Studio"
                className="h-8 w-auto object-contain brightness-0 invert"
                style={{ width: 140 }}
              />
            </a>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-gray-400 uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2dd4bf] animate-pulse" />
              <span>Studio Clearance</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mt-8 mb-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-[-0.03em] leading-tight max-w-lg">
              Royalty-free music for world-class storytellers
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed max-w-md">
              Unlimited downloads, multi-track stems, and instant copyright clearance for YouTube, TikTok, commercials, and DSP releases.
            </p>
          </div>

          {/* Primary Featured Image Showcase (Hero Mixing Console) */}
          <div className="relative rounded-[8px] overflow-hidden border border-white/10 bg-[#07090D] group max-w-lg">
            <div className="aspect-[16/9] w-full overflow-hidden relative">
              <img
                src="/images/studio_mixing_console.jpg"
                alt="Caution Studio Analog Mixing Board"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-black/30 to-black/20" />

              {/* Top Tag */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="font-mono text-[10px] text-white/90 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-[4px] border border-white/10 uppercase tracking-wider flex items-center gap-1.5">
                  <Disc3 className="h-3 w-3 text-[#2dd4bf]" />
                  96kHz Analog Console
                </span>
              </div>

              {/* Bottom Telemetry HUD */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-white bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-[4px] border border-white/10">
                    MASTER TRACK // 24-BIT LOSSLESS
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#2dd4bf] font-bold bg-black/80 px-2 py-1 rounded-[4px] border border-white/10">
                  ● 124 BPM
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Multi-Image Grid (Curated Releases) */}
          <div className="mt-4 grid grid-cols-3 gap-3 max-w-lg">
            {/* Image 1 */}
            <div className="group relative rounded-[6px] overflow-hidden border border-white/[0.08] bg-[#07090D]">
              <div className="aspect-square w-full overflow-hidden relative">
                <img
                  src="/images/album_neon_dj.jpg"
                  alt="Cyber Dreams Beat"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2">
                  <p className="text-[11px] font-bold text-white truncate">Beat Blitz</p>
                  <p className="text-[9px] font-mono text-gray-400">124 BPM • Afro</p>
                </div>
              </div>
            </div>

            {/* Image 2 */}
            <div className="group relative rounded-[6px] overflow-hidden border border-white/[0.08] bg-[#07090D]">
              <div className="aspect-square w-full overflow-hidden relative">
                <img
                  src="/images/artist_studio_mic.jpg"
                  alt="Vocal Session Master"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2">
                  <p className="text-[11px] font-bold text-white truncate">Vocal Booth</p>
                  <p className="text-[9px] font-mono text-gray-400">92 BPM • R&B</p>
                </div>
              </div>
            </div>

            {/* Image 3 */}
            <div className="group relative rounded-[6px] overflow-hidden border border-white/[0.08] bg-[#07090D]">
              <div className="aspect-square w-full overflow-hidden relative">
                <img
                  src="/images/golden_clef.jpg"
                  alt="Golden Clef Symphony"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2">
                  <p className="text-[11px] font-bold text-white truncate">Soothe Mind</p>
                  <p className="text-[9px] font-mono text-gray-400">84 BPM • Soul</p>
                </div>
              </div>
            </div>
          </div>

          {/* Studio Specs Indicator Strip */}
          <div className="mt-5 grid grid-cols-3 gap-2 max-w-lg pt-4 border-t border-white/[0.06] text-[11px] text-gray-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-[#2dd4bf]" />
              <span>Full Stems (.ZIP)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-[#2dd4bf]" />
              <span>Content ID Cleared</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-[#2dd4bf]" />
              <span>Commercial License</span>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof */}
        <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-gray-500">
          <span>Used by 40,000+ creators worldwide</span>
          <a href={WEB_URL} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
            Back to website <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Right Column: Clean Flat Form (Zero Shadows) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-16 bg-[#07090D]">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white tracking-[-0.02em]">
              Welcome back
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              Sign in to manage your licenses, audio stems, and streaming credits.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-[6px] bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="creator@studio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#04564f] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400">
                  Password
                </label>
                <a href="/forgot-password" className="text-[11px] text-[#2dd4bf] hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#04564f] transition-colors"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full h-11 rounded-[6px] bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer border-0 shadow-none"
              >
                Sign In to Account
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-gray-500">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-[#2dd4bf] font-semibold hover:underline">
              Start Free Now
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
