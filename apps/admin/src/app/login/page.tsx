'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

function LoginForm() {
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
    if (searchParams.get('error') === 'unauthorized') {
      setErrorMsg('Access denied: You do not have permission to access the admin portal.');
    }
  }, [searchParams]);

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const appMeta = session.user.app_metadata || {};
          const isAdmin =
            appMeta.is_admin === true ||
            appMeta.role === 'admin' ||
            appMeta.role === 'superadmin' ||
            session.user.email === 'admin@cautionstudioz.com' ||
            session.user.email === 'admin@caution.studio' ||
            session.user.email === 'damicoledj@gmail.com';

          if (isAdmin) {
            router.replace('/');
            return;
          }
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
        setErrorMsg('Invalid email or password. Please verify your credentials.');
        setLoading(false);
        return;
      }

      const appMeta = data.user.app_metadata || {};
      const isAdmin =
        appMeta.is_admin === true ||
        appMeta.role === 'admin' ||
        appMeta.role === 'superadmin' ||
        cleanEmail === 'admin@cautionstudioz.com' ||
        cleanEmail === 'admin@caution.studio' ||
        cleanEmail === 'damicoledj@gmail.com';

      if (!isAdmin) {
        await supabase.auth.signOut();
        setErrorMsg('Access denied: You do not have permission to access the admin portal.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Signed in successfully. Redirecting...');
      setTimeout(() => {
        router.replace('/');
      }, 350);
    } catch (err: any) {
      setErrorMsg('Authentication error. Please try again.');
      setLoading(false);
    }
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
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Admin Login
        </h1>
        <p className="text-sm text-zinc-400">
          Enter your email and password to access the dashboard
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
        {errorMsg && (
          <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMsg}</span>
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
              Email
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
              placeholder="name@example.com"
              className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium leading-none text-zinc-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Password
            </label>
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
              'Sign in'
            )}
          </button>
        </form>
      </div>

      <p className="px-8 text-center text-xs text-zinc-500">
        Caution Studio Administration
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
