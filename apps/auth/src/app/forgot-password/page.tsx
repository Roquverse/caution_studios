'use client';

import React, { useState } from 'react';
import { Button } from '@caution/ui';
import { ArrowLeft, Mail, CheckCircle2, ArrowUpRight, ShieldCheck, KeyRound, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://cautionstudioz.com';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://auth.cautionstudioz.com';
      const redirectTo = `${origin}/reset-password`;

      // Call custom reset API endpoint (sends Caution Studio branded email with 6-digit code & direct link)
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to dispatch reset code. Please try again.');
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Password reset submit error:', err);
      setErrorMessage(err.message || 'An error occurred while requesting password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#07090D] text-white selection:bg-[#04564f] selection:text-white">
      {/* Left Column: Studio Showcase with Images */}
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
              <span className="h-1.5 w-1.5 rounded-full bg-[#2dd4bf]" />
              <span>Account Security</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mt-8 mb-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-[-0.03em] leading-tight max-w-lg">
              Recover your studio access
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed max-w-md">
              Safeguarding your stem downloads, active licensing certificates, and payout balances.
            </p>
          </div>

          {/* Primary Featured Image Showcase */}
          <div className="relative rounded-[8px] overflow-hidden border border-white/10 bg-[#07090D] group max-w-lg">
            <div className="aspect-[16/9] w-full overflow-hidden relative">
              <img
                src="/images/golden_clef.jpg"
                alt="Caution Studio Golden Master"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-black/30 to-black/20" />

              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="font-mono text-[10px] text-white/90 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-[4px] border border-white/10 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-[#2dd4bf]" />
                  Encrypted Vault
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-white bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-[4px] border border-white/10">
                  MASTER CLEARANCE ARCHIVE
                </span>
                <span className="text-[10px] font-mono text-[#2dd4bf] font-bold bg-black/80 px-2 py-1 rounded-[4px] border border-white/10">
                  ● 256-BIT SSL
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Multi-Image Grid */}
          <div className="mt-4 grid grid-cols-2 gap-3 max-w-lg">
            <div className="group relative rounded-[6px] overflow-hidden border border-white/[0.08] bg-[#07090D]">
              <div className="aspect-[16/10] w-full overflow-hidden relative">
                <img
                  src="/images/studio_mixing_console.jpg"
                  alt="Mixing Board"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2">
                  <p className="text-[11px] font-bold text-white truncate">Sound Console</p>
                  <p className="text-[9px] font-mono text-gray-400">96kHz Master Engine</p>
                </div>
              </div>
            </div>

            <div className="group relative rounded-[6px] overflow-hidden border border-white/[0.08] bg-[#07090D]">
              <div className="aspect-[16/10] w-full overflow-hidden relative">
                <img
                  src="/images/artist_studio_mic.jpg"
                  alt="Vocal Booth"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2">
                  <p className="text-[11px] font-bold text-white truncate">Vocal Session</p>
                  <p className="text-[9px] font-mono text-gray-400">Creator Master Suite</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof */}
        <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-gray-500">
          <span>Caution Studio Support</span>
          <a href={WEB_URL} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
            Back to website <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Right Column: Reset Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-16 bg-[#07090D]">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white tracking-[-0.02em]">
              Reset password
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              Enter your email and we&apos;ll send you instructions to recover your account credentials.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-[6px] bg-red-950/40 border border-red-800/60 text-red-200 flex items-center gap-2.5 text-xs animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {submitted ? (
            <div className="p-6 bg-[#0F131C] rounded-[8px] border border-white/[0.1] text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="h-12 w-12 rounded-full bg-[#04564f]/30 border border-[#2dd4bf]/40 flex items-center justify-center text-[#2dd4bf] mx-auto shadow-lg shadow-[#04564f]/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Reset Code Dispatched</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  We&apos;ve sent your 6-digit recovery code and reset link to <strong className="text-white font-mono">{email}</strong>.
                </p>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
                Check your inbox or spam folder for your 6-digit code, then enter it below to set your new password.
              </p>

              <div className="pt-2">
                <a
                  href={`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`}
                  className="w-full h-11 rounded-[6px] bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#2dd4bf]/40 shadow-md"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Enter 6-Digit Code &amp; Change Password &rarr;</span>
                </a>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setErrorMessage(null);
                  }}
                  className="text-xs text-gray-400 hover:text-white underline transition-colors cursor-pointer"
                >
                  Try another email
                </button>
                <span className="hidden sm:inline text-gray-600">•</span>
                <a href="/login" className="text-xs font-semibold text-[#2dd4bf] hover:underline">
                  Return to sign in &rarr;
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="creator@studio.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full h-11 pl-10 pr-3.5 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading || !email}
                  variant="primary"
                  size="lg"
                  className="w-full h-11 rounded-[6px] bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border-0 shadow-none disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </Button>
              </div>

              <div className="text-center pt-3">
                <a href="/login" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
