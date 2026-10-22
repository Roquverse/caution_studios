'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@caution/ui';
import { ArrowRight, User, Mail, Lock, Check, ArrowUpRight, Mic2, ShieldCheck, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Gift, Sparkles, Sliders } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const USER_PORTAL_URL = process.env.NEXT_PUBLIC_USER_URL || 'https://app.cautionstudioz.com';
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://cautionstudioz.com';

export default function RegisterPage() {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [primaryRole, setPrimaryRole] = useState<'artist' | 'producer'>('artist');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [channel, setChannel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // OTP State
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    const isProducer = primaryRole === 'producer';
    const trialEndsAt = isProducer
      ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      : null;
    const promoCode = isProducer ? 'producer_3mo_free_launch' : null;
    const initialPlan = isProducer ? 'plus' : 'free';

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            handle: name.toLowerCase().replace(/\s+/g, '_'),
            social_channel: channel,
            primary_role: primaryRole,
            roles: [primaryRole],
            plan: initialPlan,
            trial_ends_at: trialEndsAt,
            promo_applied: promoCode
          }
        }
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data?.session) {
        window.location.href = USER_PORTAL_URL;
        return;
      }

      // Move to OTP step
      setStep('otp');
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, '');

    if (cleanVal.length > 1) {
      const digits = cleanVal.slice(0, 6).split('');
      const newOtp = [...otp];
      for (let i = 0; i < digits.length; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      inputRefs.current[nextFocus]?.focus();

      if (digits.length === 6) {
        handleVerifyOtp(digits.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanVal;
    setOtp(newOtp);

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (cleanVal && index === 5) {
      const fullCode = newOtp.join('');
      if (fullCode.length === 6) {
        handleVerifyOtp(fullCode);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);

    if (pasted.length === 6) {
      handleVerifyOtp(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify || otp.join('')).trim();
    if (code.length !== 6) {
      setErrorMessage('Please enter the full 6-digit code.');
      return;
    }

    setOtpLoading(true);
    setErrorMessage('');

    try {
      let { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup'
      });

      if (error) {
        const fallback = await supabase.auth.verifyOtp({
          email,
          token: code,
          type: 'email'
        });
        if (!fallback.error) {
          data = fallback.data;
          error = null;
        }
      }

      if (error) {
        setErrorMessage(error.message || 'Invalid or expired OTP code.');
        return;
      }

      setStep('success');
      setTimeout(() => {
        window.location.href = USER_PORTAL_URL;
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email
      });

      if (error) {
        const otpFallback = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false }
        });
        if (otpFallback.error) {
          setErrorMessage(otpFallback.error.message);
          return;
        }
      }

      setResendCooldown(60);
      setSuccessMessage('A fresh 6-digit verification code was sent to your email.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#07090D] text-white selection:bg-[#04564f] selection:text-white">
      {/* Left Column: Creative Multi-Image Studio Showcase (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0A0D14] p-6 sm:p-10 lg:p-14 flex-col justify-between border-r border-white/[0.08]">
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
              <span>Creator License</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mt-8 mb-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-[-0.03em] leading-tight max-w-lg">
              Clear music rights in one single click
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed max-w-md">
              Never stress about copyright strikes or demonetized videos again. Enjoy complete creative freedom on YouTube, TikTok, and commercial DSPs.
            </p>
          </div>

          {/* Primary Featured Image Showcase (Vocal Booth Session) */}
          <div className="relative rounded-[8px] overflow-hidden border border-white/10 bg-[#07090D] group max-w-lg">
            <div className="aspect-[16/9] w-full overflow-hidden relative">
              <img
                src="/images/artist_studio_mic.jpg"
                alt="Caution Studio Vocal Recording Booth"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-black/30 to-black/20" />

              {/* Top Tag */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="font-mono text-[10px] text-white/90 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-[4px] border border-white/10 uppercase tracking-wider flex items-center gap-1.5">
                  <Mic2 className="h-3 w-3 text-[#2dd4bf]" />
                  Acoustic Vocal Suite
                </span>
              </div>

              {/* Bottom Telemetry HUD */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-white bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-[4px] border border-white/10">
                  GOLDEN HARMONY // 24-BIT STEMS
                </span>
                <span className="text-[10px] font-mono text-[#2dd4bf] font-bold bg-black/80 px-2 py-1 rounded-[4px] border border-white/10">
                  ● 92 BPM
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
                  src="/images/studio_mixing_console.jpg"
                  alt="Console Mix Master"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2">
                  <p className="text-[11px] font-bold text-white truncate">Heat Check</p>
                  <p className="text-[9px] font-mono text-gray-400">140 BPM • Trap</p>
                </div>
              </div>
            </div>

            {/* Image 2 */}
            <div className="group relative rounded-[6px] overflow-hidden border border-white/[0.08] bg-[#07090D]">
              <div className="aspect-square w-full overflow-hidden relative">
                <img
                  src="/images/album_sunrise.jpg"
                  alt="Horizon Glow Amapiano"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2">
                  <p className="text-[11px] font-bold text-white truncate">Horizon</p>
                  <p className="text-[9px] font-mono text-gray-400">112 BPM • Piano</p>
                </div>
              </div>
            </div>

            {/* Image 3 */}
            <div className="group relative rounded-[6px] overflow-hidden border border-white/[0.08] bg-[#07090D]">
              <div className="aspect-square w-full overflow-hidden relative">
                <img
                  src="/images/hero_boombox.jpg"
                  alt="Retro Analog Vault"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2">
                  <p className="text-[11px] font-bold text-white truncate">Analog Vault</p>
                  <p className="text-[9px] font-mono text-gray-400">88 BPM • Lo-Fi</p>
                </div>
              </div>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="mt-5 space-y-2 max-w-lg pt-4 border-t border-white/[0.06] text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-[#2dd4bf] stroke-[2.5]" />
              <span>Full access to 10,000+ studio beats and multi-track stems</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-[#2dd4bf] stroke-[2.5]" />
              <span>Automated Content ID whitelist for YouTube, TikTok & Instagram</span>
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-gray-500">
          <span>Trusted by 40,000+ creators worldwide</span>
          <a href={WEB_URL} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
            Back to website <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Right Column: Register Form or OTP Screen */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between p-6 sm:p-10 lg:p-16 bg-[#07090D] overflow-y-auto">
        {/* Mobile-Only Top Brand Bar */}
        <div className="lg:hidden flex items-center justify-between mb-8 pt-2">
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
            <span>Creator License</span>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto my-auto">
          {step === 'form' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-black text-white tracking-[-0.02em]">
                  Create your account
                </h1>
                <p className="mt-1 text-xs text-gray-400">
                  Start downloading royalty-free soundtrack audio and whitelist your channels.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3 rounded-[6px] bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Specification & Producer Promo Card */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400">
                      I am signing up as:
                    </label>
                    <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      <span>Producer Promo Active</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPrimaryRole('artist')}
                      className={`p-3 rounded-[6px] text-left transition-all border flex flex-col justify-between ${
                        primaryRole === 'artist'
                          ? 'bg-[#04564f]/25 border-[#2dd4bf] ring-1 ring-[#2dd4bf]'
                          : 'bg-[#0F131C] border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="flex items-center gap-1.5">
                          <Mic2 className={`h-4 w-4 ${primaryRole === 'artist' ? 'text-[#2dd4bf]' : 'text-gray-400'}`} />
                          <span className="text-xs font-bold text-white">Artist</span>
                        </div>
                        {primaryRole === 'artist' && (
                          <span className="h-4 w-4 rounded-full bg-[#2dd4bf] text-black flex items-center justify-center">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 leading-snug">
                        Discover beats, record music & book verified producers.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPrimaryRole('producer')}
                      className={`p-3 rounded-[6px] text-left transition-all border flex flex-col justify-between relative ${
                        primaryRole === 'producer'
                          ? 'bg-[#04564f]/25 border-[#2dd4bf] ring-1 ring-[#2dd4bf]'
                          : 'bg-[#0F131C] border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className="flex items-center gap-1.5">
                          <Sliders className={`h-4 w-4 ${primaryRole === 'producer' ? 'text-amber-400' : 'text-gray-400'}`} />
                          <span className="text-xs font-bold text-white">Producer</span>
                        </div>
                        {primaryRole === 'producer' ? (
                          <span className="h-4 w-4 rounded-full bg-[#2dd4bf] text-black flex items-center justify-center">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                            Free
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 leading-snug">
                        Upload beats, sell licenses & earn streaming royalties.
                      </p>
                    </button>
                  </div>

                  {primaryRole === 'producer' && (
                    <div className="mt-2.5 p-3 rounded-[6px] bg-gradient-to-r from-amber-500/10 via-[#04564f]/20 to-transparent border border-amber-500/30 text-amber-200">
                      <div className="flex items-start gap-2">
                        <Gift className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-[11px] leading-relaxed">
                          <strong className="text-amber-300 font-bold block text-xs mb-0.5">
                            Producer Launch Promo: 3 Months Free Subscription!
                          </strong>
                          Subscription for beat producers is 100% free for your first 3 months. Upload unlimited beats and keep 80% payout.
                          <div className="mt-1 text-[10px] text-gray-400 font-mono">
                            ⚡ Verification note: Qualification requires earning royalties from free beat streaming.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Alex Rivers"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#04564f] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="alex@creator.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#04564f] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#04564f] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                    Primary YouTube or Social Handle
                  </label>
                  <input
                    type="text"
                    placeholder="@alexrivers or youtube.com/@channel"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#04564f] transition-colors font-mono"
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
                    START FREE NOW
                  </Button>
                </div>
              </form>

              <p className="mt-6 text-center text-xs text-gray-500">
                Already have an account?{' '}
                <a href="/login" className="text-[#2dd4bf] font-semibold hover:underline">
                  Sign In
                </a>
              </p>
            </>
          )}

          {step === 'otp' && (
            <div className="animate-in fade-in duration-300">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setErrorMessage('');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors mb-6 cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Edit registration details</span>
              </button>

              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#04564f]/20 border border-[#04564f]/40 text-[11px] font-mono text-[#2dd4bf] uppercase tracking-wider mb-4">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Step 2 of 2: OTP Verification</span>
                </div>

                <h2 className="text-2xl font-black text-white tracking-[-0.02em]">
                  Enter verification code
                </h2>
                <p className="mt-2 text-xs text-gray-400 leading-relaxed">
                  We sent a 6-digit confirmation code to{' '}
                  <span className="text-white font-semibold font-mono">{email}</span>. Enter the code below to activate your account.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3 rounded-[6px] bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-5 p-3 rounded-[6px] bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2dd4bf]" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="my-6">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-3">
                  6-Digit OTP Code
                </label>
                <div className="grid grid-cols-6 gap-2 sm:gap-2.5" onPaste={handlePaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-full aspect-square text-center text-xl sm:text-2xl font-mono font-bold rounded-[6px] bg-[#0F131C] border text-white transition-all focus:outline-none ${
                        digit
                          ? 'border-[#2dd4bf] text-[#2dd4bf]'
                          : 'border-white/[0.12] focus:border-[#2dd4bf]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={otp.join('').length < 6 || otpLoading}
                  className="w-full h-11 rounded-[6px] bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer shadow-none border-0"
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Continue</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>

                <div className="pt-3 text-center text-xs text-gray-400">
                  {resendCooldown > 0 ? (
                    <span className="font-mono text-gray-500">
                      Didn&apos;t receive code? Resend OTP in{' '}
                      <span className="text-gray-300 font-bold">
                        0:{resendCooldown.toString().padStart(2, '0')}
                      </span>
                    </span>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Didn&apos;t receive the code?</span>
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resending}
                        className="text-[#2dd4bf] hover:underline font-semibold font-mono flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
                      >
                        {resending && <RefreshCw className="h-3 w-3 animate-spin" />}
                        <span>Resend OTP</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-10 space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-14 h-14 rounded-full bg-[#04564f]/30 border border-[#2dd4bf]/40 flex items-center justify-center mx-auto text-[#2dd4bf]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black text-white">Email Verified!</h2>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Your creator credentials have been verified. Connecting you to Caution Studio...
              </p>
            </div>
          )}
        </div>

        {/* Mobile-Only Bottom Social Proof Bar */}
        <div className="lg:hidden mt-10 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-gray-500">
          <span>Trusted by 40,000+ creators worldwide</span>
          <a href={WEB_URL} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
            Back to website <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
