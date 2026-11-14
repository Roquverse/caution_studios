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
  Mail,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://cautionstudioz.com';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPreVerified, setIsPreVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Read URL search params (?email=...&code=...&token_hash=...)
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const paramEmail = searchParams.get('email');
      const paramCode = searchParams.get('code');
      const paramTokenHash = searchParams.get('token_hash');

      if (paramEmail) {
        setEmail(paramEmail.trim().toLowerCase());
      }
      if (paramCode) {
        setResetCode(paramCode.trim());
      }

      // If token_hash was provided directly
      if (paramTokenHash) {
        supabase.auth
          .verifyOtp({
            token_hash: paramTokenHash,
            type: 'recovery'
          })
          .then(({ data, error }) => {
            if (!error && data?.session) {
              setIsPreVerified(true);
              setInfoMessage('Secure link verified! Enter your new password below.');
            }
          })
          .catch(() => {});
      }

      // 2. Check for tokens in URL hash (#access_token=...)
      if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          supabase.auth
            .setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            .then(({ data, error }) => {
              if (!error && data?.session) {
                setIsPreVerified(true);
                setInfoMessage('Secure session verified! Enter your new password below.');
              }
            })
            .catch(() => {});
        }
      }
    }

    // 3. Listen to auth state changes (e.g. PASSWORD_RECOVERY event)
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && session.user)) {
        setIsPreVerified(true);
        setInfoMessage('Recovery session active. Enter your new password below.');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = resetCode.trim().replace(/\s+/g, '');
    const cleanPassword = newPassword.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (!isPreVerified && (!cleanCode || cleanCode.length < 6)) {
      setErrorMessage('Please enter the 6-digit recovery code sent to your email.');
      return;
    }

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

      // Step 1: Verify OTP if not already pre-verified in an active recovery session
      if (!isPreVerified) {
        const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanCode,
          type: 'recovery'
        });

        if (otpError) {
          throw new Error(
            otpError.message.includes('Token has expired')
              ? 'The 6-digit code has expired. Please request a new code.'
              : otpError.message.includes('Token is invalid')
              ? 'Invalid 6-digit code. Please verify the code in your email or request a new one.'
              : otpError.message || 'Verification failed. Please check your code.'
          );
        }

        if (!otpData?.session) {
          throw new Error('Failed to establish secure recovery session. Please try again.');
        }
      }

      // Step 2: Update password with verified session
      const { error: updateError } = await supabase.auth.updateUser({
        password: cleanPassword
      });

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update password.');
      }

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Password reset update error:', err);
      setErrorMessage(err.message || 'Failed to update password. Please check your code and try again.');
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
          {isSuccess ? (
            <div className="p-6 sm:p-8 bg-[#0F131C] rounded-[10px] border border-white/[0.1] text-center space-y-4 animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
              <div className="h-14 w-14 rounded-full bg-[#04564f]/30 border border-[#2dd4bf]/40 flex items-center justify-center text-[#2dd4bf] mx-auto shadow-lg shadow-[#04564f]/30">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-white">Password Updated!</h3>
                <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">
                  Your Caution Studio account password has been successfully updated. You can now sign in with your new credentials.
                </p>
              </div>
              <div className="pt-3">
                <a
                  href="/login"
                  className="w-full h-11 rounded-[6px] bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#2dd4bf]/40 shadow-md hover:scale-[1.01]"
                >
                  <span>Sign In to Studio</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-black text-white tracking-[-0.02em]">
                  Reset your password
                </h1>
                <p className="mt-1 text-xs text-gray-400">
                  Enter your email, the 6-digit code from your inbox, and your new password.
                </p>
              </div>

              {infoMessage && (
                <div className="mb-4 p-3 rounded-[6px] bg-teal-950/40 border border-teal-700/60 text-teal-200 flex items-center gap-2.5 text-xs animate-in fade-in">
                  <Sparkles className="h-4 w-4 text-[#2dd4bf] shrink-0" />
                  <span>{infoMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="mb-4 p-3.5 rounded-[6px] bg-red-950/40 border border-red-800/60 text-red-200 flex items-center gap-2.5 text-xs animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Email Address Field */}
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

                {/* 2. 6-Digit Reset Code Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400">
                      6-Digit Reset Code
                    </label>
                    {isPreVerified ? (
                      <span className="text-[10px] text-[#2dd4bf] font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Link Verified
                      </span>
                    ) : (
                      <a
                        href="/forgot-password"
                        className="text-[10px] text-gray-400 hover:text-[#2dd4bf] transition-colors"
                      >
                        Resend code
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500 pointer-events-none" />
                    <input
                      type="text"
                      required={!isPreVerified}
                      placeholder={isPreVerified ? 'Code verified via recovery link' : 'e.g. 448225'}
                      disabled={isPreVerified}
                      maxLength={8}
                      value={isPreVerified ? 'VERIFIED' : resetCode}
                      onChange={(e) => {
                        setResetCode(e.target.value);
                        setErrorMessage(null);
                      }}
                      className={`w-full h-11 pl-10 pr-3.5 rounded-[6px] bg-[#0F131C] border text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors font-mono tracking-widest uppercase ${
                        isPreVerified
                          ? 'border-teal-500/50 bg-teal-950/20 text-[#2dd4bf] font-bold'
                          : 'border-white/[0.1]'
                      }`}
                    />
                  </div>
                  {!isPreVerified && (
                    <p className="mt-1 text-[10px] text-gray-500">
                      Check your email inbox or spam folder for the 6-digit recovery code.
                    </p>
                  )}
                </div>

                {/* 3. New Password Field */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500 pointer-events-none" />
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
                      className="w-full h-11 pl-10 pr-10 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors font-mono"
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

                {/* 4. Confirm Password Field */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500 pointer-events-none" />
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
                      className="w-full h-11 pl-10 pr-3.5 rounded-[6px] bg-[#0F131C] border border-white/[0.1] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !email || (!isPreVerified && !resetCode) || newPassword.length < 6}
                    variant="primary"
                    size="lg"
                    className="w-full h-11 rounded-[6px] bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#2dd4bf]/40 shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Verifying &amp; Saving Password...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" />
                        <span>Save New Password</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center pt-3 flex items-center justify-center gap-3 text-xs text-gray-400">
                  <a href="/login" className="hover:text-white transition-colors">
                    Back to sign in
                  </a>
                  <span>•</span>
                  <a href="/forgot-password" className="hover:text-white transition-colors">
                    Request another code
                  </a>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
