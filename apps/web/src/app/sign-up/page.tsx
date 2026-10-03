'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Check, ArrowRight, AlertCircle, ArrowUpRight } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<string[]>(['artist']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toggleRole = (r: string) => {
    if (roles.includes(r)) {
      if (roles.length > 1) setRoles(roles.filter((x) => x !== r));
    } else {
      setRoles([...roles, r]);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName,
            handle: handle.toLowerCase(),
            roles
          }
        }
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090D] text-white flex flex-col lg:flex-row selection:bg-[#04564f] selection:text-white">
      {/* Left Column: Brand, Editorial, and Ecosystem Context */}
      <div className="w-full lg:w-5/12 xl:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#0A0D14]">
        <div>
          {/* Brand Logo */}
          <Link href="/" className="inline-block">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-8 w-auto object-contain brightness-0 invert"
              style={{ width: 140 }}
            />
          </Link>

          {/* Telemetry pill */}
          <div className="mt-12 mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-gray-400 uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2dd4bf]" />
            <span>Artist & Producer Portal</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-[-0.03em] leading-tight max-w-lg">
            Stream beats like Spotify. <br />
            License masters like a pro.
          </h1>

          <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-md">
            Join hundreds of recording artists and producers licensing studio-grade beats, separated trackout stems, and atomic exclusive buyouts.
          </p>

          {/* Value Checklist */}
          <div className="mt-10 space-y-3.5 max-w-md">
            {[
              '24-Bit master WAVs + separated stems (.ZIP)',
              'Automated Content ID clearance for YouTube, TikTok & DSPs',
              'Atomic 100% exclusive buyouts with signed legal contracts',
              'Instant NGN settlement powered by Paystack'
            ].map((feat, i) => (
              <div key={i} className="flex items-start gap-3 text-xs text-gray-300">
                <span className="font-mono text-[#2dd4bf] text-[11px] font-bold shrink-0 mt-0.5">
                  0{i + 1}
                </span>
                <span className="leading-snug">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Editorial Quote */}
        <div className="mt-12 pt-8 border-t border-white/[0.08] flex items-center justify-between text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Caution Studio Inc.</span>
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
            Back to Home <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Right Column: Clean, Flat, Human Onboarding Form */}
      <div className="w-full lg:w-7/12 xl:w-1/2 p-6 sm:p-12 lg:p-16 flex flex-col justify-center bg-[#07090D]">
        <div className="max-w-md w-full mx-auto">
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-white tracking-[-0.02em]">
              Create an account
            </h2>
            <p className="mt-1 text-xs text-gray-400">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-[#2dd4bf] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-3 rounded-[6px] bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            {/* Flat Role Segmented Selector */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-2">
                Select Role
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0F131C] border border-white/[0.08] rounded-[6px]">
                <button
                  type="button"
                  onClick={() => toggleRole('artist')}
                  className={`py-2 px-3 text-xs font-semibold rounded-[4px] transition-all flex items-center justify-center gap-1.5 ${
                    roles.includes('artist')
                      ? 'bg-[#04564f] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  {roles.includes('artist') && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                  <span>Recording Artist</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleRole('producer')}
                  className={`py-2 px-3 text-xs font-semibold rounded-[4px] transition-all flex items-center justify-center gap-1.5 ${
                    roles.includes('producer')
                      ? 'bg-[#04564f] text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  {roles.includes('producer') && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                  <span>Beat Producer</span>
                </button>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                Display Name / Stage Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Samuel Rivers"
                className="w-full h-11 px-3.5 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#04564f] transition-colors"
              />
            </div>

            {/* Handle */}
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                Username Handle
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs text-gray-500 font-mono">@</span>
                <input
                  type="text"
                  required
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="samuel_sound"
                  className="w-full h-11 pl-8 pr-3.5 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-[#04564f] transition-colors"
                />
              </div>
            </div>

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
              <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                Password
              </label>
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
                className="w-full h-11 rounded-[6px] bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Creating account...' : 'Create Account'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

          {/* Terms */}
          <p className="mt-6 text-[11px] text-gray-500 text-center leading-relaxed">
            By creating an account, you agree to Caution Studio&apos;s{' '}
            <span className="text-gray-400">Terms of Service</span> and{' '}
            <span className="text-gray-400">Master License Agreement</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
