'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@caution/ui';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Loader2,
  KeyRound,
  ArrowUpRight
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://cautionstudioz.com';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function verifyRecoverySession() {
      try {
        // 1. Check for tokens in URL hash (Supabase default redirect format)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (!error && data?.session) {
              setIsAuthorized(true);
              setIsVerifying(false);
              return;
            }
          }
        }

        // 2. Check for active Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthorized(true);
          setIsVerifying(false);
          return;
        }

        // 3. Listen to auth state changes (e.g. PASSWORD_RECOVERY event)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' || session) {
            setIsAuthorized(true);
            setIsVerifying(false);
          }
        });

        // Timeout fallback after 3 seconds if no session is detected
        const timer = setTimeout(() => {
          setIsVerifying(false);
        }, 3000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timer);
        };
      } catch (err) {
        console.warn('Session verification exception:', err);
        setIsVerifying(false);
      }
    }

    verifyRecoverySession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPassword = newPassword.trim();

    if (cleanPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const { data, error } = await supabase.auth.updateUser({
        password: cleanPassword
      });

      if (error) {
        throw new Error(error.message);
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Password reset update error:', err);
      setErrorMessage(err.message || 'Failed to update password. Please request a new recovery link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#07090D] text-white selection:bg-[#04564f] selection:text-white">
      {/* Left Column: Showcase */}
      <div className="w-full lg:w-1/2 bg-[#0A0D14] p-6 sm:p-10 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.08]">
        <div>
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
              <span>Password Recovery</span>
            </div>
          </div>

          <div className="mt-8 mb-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-[-0.03em] leading-tight max-w-lg">
              Set your new studio password
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed max-w-md">
              Securely regain access to your beat catalog, master stem archives, and producer earnings.
            </p>
          </div>

          <div className="relative rounded-[8px] overflow-hidden border border-white/10 bg-[#07090D] group max-w-lg">
            <div className="aspect-[16/9] w-full overflow-hidden relative">
              <img
                src="/images/golden_clef.jpg"
                alt="Caution Studio Golden Master"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-black/30 to-black/20" />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="font-mono text-[10px] text-white/90 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-[4px] border border-white/10 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3 text-[#2dd4bf]" />
                  Secure Cryptographic Authentication
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-gray-500">
          <span>Caution Studio Security</span>
          <a href={WEB_URL} className="text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
            Back to website <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Right Column: Interactive Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-16 bg-[#07090D]">
        <div className="max-w-md w-full mx-auto">
          {isVerifying ? (
            <div className="p-8 text-center space-y-4">
              <div className="h-8 w-8 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-400">Verifying secure recovery link...</p>
            </div>
          ) : isSuccess ? (
            <div className="p-6 bg-[#0F131C] rounded-[8px] border border-white/[0.1] text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="h-12 w-12 rounded-full bg-[#04564f]/30 border border-[#2dd4bf]/40 flex items-center justify-center text-[#2dd4bf] mx-auto shadow-lg shadow-[#04564f]/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Password Updated!</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Your password has been successfully reset. You can now sign in with your new credentials.
                </p>
              </div>
              <div className="pt-3">
                <a
                  href="/login"
                  className="w-full h-11 rounded-[6px] bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#2dd4bf]/40 shadow-md"
                >
                  <span>Sign In Now</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          ) : !isAuthorized ? (
            <div className="p-6 bg-[#0F131C] rounded-[8px] border border-white/[0.1] text-center space-y-4 animate-in fade-in">
              <div className="h-12 w-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Invalid or Expired Link</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  This password reset link is invalid, expired, or has already been used. Please request a new one.
                </p>
              </div>
              <div className="pt-3">
                <a
                  href="/forgot-password"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  <span>Request New Link</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl font-black text-white tracking-[-0.02em]">
                  Create new password
                </h1>
                <p className="mt-1 text-xs text-gray-400">
                  Please enter a new password for your Caution Studio account.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-4 p-3.5 rounded-[6px] bg-red-950/40 border border-red-800/60 text-red-200 flex items-center gap-2.5 text-xs animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setErrorMessage(null);
                      }}
                      className="w-full h-11 px-3.5 pr-10 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full h-11 px-3.5 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors font-mono"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !newPassword || newPassword.length < 6}
                    variant="primary"
                    size="lg"
                    className="w-full h-11 rounded-[6px] bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border-0 shadow-none disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        <span>Save New Password</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
