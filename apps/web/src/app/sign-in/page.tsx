'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { ArrowRight, AlertCircle, ArrowUpRight, Disc3, Check } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090D] text-white flex flex-col lg:flex-row selection:bg-[#04564f] selection:text-white">
      {/* Left Column: Rich Multi-Image Studio Showcase */}
      <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#0A0D14]">
        <div>
          {/* Top Bar with Brand & Telemetry Badge */}
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-block">
              <img
                src="/logo.png"
                alt="Caution Studio"
                className="h-8 w-auto object-contain brightness-0 invert"
                style={{ width: 140 }}
              />
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-gray-400 uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2dd4bf] animate-pulse" />
              <span>Studio Clearance</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mt-8 mb-6">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-[-0.03em] leading-tight max-w-lg">
              Welcome back to <br />
              your studio catalog.
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed max-w-md">
              Manage your leased tracks, download separated stems, access your licensed releases, and monitor sync performance.
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
                <span className="font-mono text-[10px] text-white bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-[4px] border border-white/10">
                  SOOTHE MY MIND // 24-BIT STEMS
                </span>
                <span className="text-[10px] font-mono text-[#2dd4bf] font-bold bg-black/80 px-2 py-1 rounded-[4px] border border-white/10">
                  ● 84 BPM
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
                  <p className="text-[11px] font-bold text-white truncate">Golden Clef</p>
                  <p className="text-[9px] font-mono text-gray-400">84 BPM • Soul</p>
                </div>
              </div>
            </div>
          </div>

          {/* Specs Bar */}
          <div className="mt-5 grid grid-cols-3 gap-2 max-w-lg pt-4 border-t border-white/[0.06] text-[11px] text-gray-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-[#2dd4bf]" />
              <span>Full Stems (.ZIP)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-[#2dd4bf]" />
              <span>Content ID Safe</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-[#2dd4bf]" />
              <span>Commercial Sync</span>
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Caution Studio Inc.</span>
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            Back to Home <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Right Column: Clean, Flat Login Form (Zero Shadows) */}
      <div className="w-full lg:w-1/2 p-6 sm:p-12 lg:p-16 flex flex-col justify-center bg-[#07090D]">
        <div className="max-w-md w-full mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white tracking-[-0.02em]">
              Sign in to your account
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              New to Caution Studio?{' '}
              <Link href="/sign-up" className="text-[#2dd4bf] font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-6 p-3 rounded-[6px] bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-5">
            {/* Email Address */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="artist@cautionstudio.com"
                className="w-full h-11 px-3.5 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#04564f] transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400">
                  Password
                </label>
                <a href="#" className="text-[11px] text-[#2dd4bf] hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-11 px-3.5 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#04564f] transition-colors"
              />
            </div>

            {/* Flat Submit Button (NO SHADOWS) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-[6px] bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-none border-0"
              >
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
