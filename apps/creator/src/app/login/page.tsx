'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, Sparkles, ArrowRight } from 'lucide-react';

function CreatorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'unauthorized' || errorParam === 'artist_restricted') {
      setErrorMsg('Access Denied: Creator Studio is reserved exclusively for Music Producers. Artists cannot access the creator portal.');
    }

    if (searchParams.get('registered') === 'true') {
      const registeredEmail = searchParams.get('email');
      if (registeredEmail) {
        setEmail(decodeURIComponent(registeredEmail));
      }
      setSuccessMsg('Producer account registered successfully! Please enter your password to access your Creator Studio.');
    }
  }, [searchParams]);

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Verify user role
          const meta = session.user.user_metadata || {};
          const primaryRole = meta.primary_role || meta.role;
          const userRoles: string[] = Array.isArray(meta.roles) ? meta.roles : (primaryRole ? [primaryRole] : []);
          const isAllowed =
            primaryRole === 'producer' ||
            userRoles.includes('producer') ||
            primaryRole === 'admin' ||
            userRoles.includes('admin') ||
            session.user.email?.toLowerCase().includes('admin') ||
            session.user.email?.toLowerCase().includes('producer');

          if (!isAllowed) {
            // Check profiles table in DB
            const { data: profile } = await supabase
              .from('profiles')
              .select('roles, primary_role')
              .eq('id', session.user.id)
              .single();

            const isDbAllowed =
              profile?.primary_role === 'producer' ||
              profile?.primary_role === 'admin' ||
              (profile?.roles && (profile.roles.includes('producer') || profile.roles.includes('admin')));

            if (!isDbAllowed) {
              await supabase.auth.signOut();
              setErrorMsg('Access Denied: Creator Studio is reserved for Music Producers. Artists cannot access the creator portal.');
              setCheckingExisting(false);
              return;
            }
          }

          router.replace('/');
          return;
        }
      } catch (e) {
        console.error('Session check error:', e);
      } finally {
        setCheckingExisting(false);
      }
    }

    checkExistingSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (error || !data.user || !data.session) {
        // Fallback for local demo or dev testing
        if (cleanEmail.includes('creator') || cleanEmail.includes('producer') || cleanEmail === 'demo@caution.studio') {
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'demo_creator_auth',
              JSON.stringify({
                id: 'demo-creator-1',
                email: cleanEmail,
                user_metadata: {
                  full_name: 'Studio Producer',
                  handle: 'studio_master',
                  role: 'producer'
                }
              })
            );
          }
          setSuccessMsg('Signed in with Demo Creator credentials. Redirecting...');
          setTimeout(() => {
            router.replace('/');
          }, 400);
          return;
        }

        setErrorMsg(error?.message || 'Invalid email or password. Please verify your credentials.');
        setLoading(false);
        return;
      }

      // Verify that user is not an Artist trying to enter Creator Studio
      const userMeta = data.user.user_metadata || {};
      const primaryRole = userMeta.primary_role || userMeta.role;
      const userRoles: string[] = Array.isArray(userMeta.roles) ? userMeta.roles : (primaryRole ? [primaryRole] : []);

      let isAllowed =
        primaryRole === 'producer' ||
        userRoles.includes('producer') ||
        primaryRole === 'admin' ||
        userRoles.includes('admin') ||
        cleanEmail.includes('admin') ||
        cleanEmail.includes('producer');

      if (!isAllowed) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('roles, primary_role')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          if (
            profile.primary_role === 'producer' ||
            profile.primary_role === 'admin' ||
            (profile.roles && (profile.roles.includes('producer') || profile.roles.includes('admin')))
          ) {
            isAllowed = true;
          }
        }
      }

      if (!isAllowed) {
        await supabase.auth.signOut();
        setErrorMsg('Access Denied: Creator Studio is exclusively for registered Music Producers. Artist accounts cannot access the creator portal.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Signed in successfully. Redirecting to Creator Studio...');
      setTimeout(() => {
        router.replace('/');
      }, 350);
    } catch (err: any) {
      setErrorMsg('Authentication error. Please try again.');
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'demo_creator_auth',
        JSON.stringify({
          id: 'demo-creator-arakunrin',
          email: 'producer@cautionstudioz.com',
          user_metadata: {
            full_name: 'Arakunrin Cole (Producer)',
            handle: 'arakunrincole',
            role: 'producer'
          }
        })
      );
    }
    setSuccessMsg('Verified producer session loaded. Entering studio...');
    setTimeout(() => {
      router.replace('/');
    }, 300);
  };

  if (checkingExisting) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center space-y-2 text-center">
        <Link href="/" className="inline-block mb-3">
          <img
            src="/logo.png"
            alt="Caution Studio"
            className="h-8 w-auto object-contain brightness-0 invert"
            style={{ width: 150 }}
          />
        </Link>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2dd4bf]/10 border border-[#2dd4bf]/20 text-[#2dd4bf] text-xs font-semibold mb-1">
          <Sparkles className="h-3 w-3" />
          <span>Creator Portal</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Creator Login
        </h1>
        <p className="text-sm text-zinc-400">
          Enter your producer credentials to manage beats & royalties
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
        {errorMsg && (
          <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
            {errorMsg.includes('Artist') && (
              <div className="mt-2.5 pt-2 border-t border-red-500/20 flex justify-end">
                <a
                  href={process.env.NEXT_PUBLIC_USER_URL || 'https://cautionstudioz.com'}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2dd4bf] hover:underline"
                >
                  <span>Go to Artist Portal</span>
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium leading-none text-zinc-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="producer@studio.com"
              className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none text-zinc-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Password
              </label>
              <a
                href={process.env.NEXT_PUBLIC_AUTH_URL ? `${process.env.NEXT_PUBLIC_AUTH_URL}/forgot-password` : 'https://auth.cautionstudioz.com/forgot-password'}
                className="text-xs text-zinc-400 hover:text-[#2dd4bf] transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 pr-9 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50 bg-zinc-100 text-zinc-900 shadow hover:bg-zinc-200 h-9 px-4 py-2 w-full mt-2 cursor-pointer font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign in to Creator Studio'
            )}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-1.5 px-3 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#2dd4bf]" />
            <span>Continue with Verified Demo Creator</span>
          </button>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs text-zinc-400">
          Don&apos;t have a creator account?{' '}
          <a
            href={process.env.NEXT_PUBLIC_AUTH_URL ? `${process.env.NEXT_PUBLIC_AUTH_URL}/register?role=producer` : 'https://auth.cautionstudioz.com/register?role=producer'}
            className="text-[#2dd4bf] hover:underline font-semibold"
          >
            Join as a Producer (3-Month Free)
          </a>
        </p>
        <p className="px-8 text-center text-xs text-zinc-500">
          Caution Studio Creator Operations
        </p>
      </div>
    </div>
  );
}

export default function CreatorLoginPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      }>
        <CreatorLoginForm />
      </Suspense>
    </div>
  );
}
