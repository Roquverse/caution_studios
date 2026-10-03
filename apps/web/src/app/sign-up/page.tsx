'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { User, Mail, Lock, ArrowRight, Check } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<string[]>(['artist']);
  const [loading, setLoading] = useState(false);

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

    try {
      await supabase.auth.signUp({
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
      router.push('/beats');
    } catch (err) {
      router.push('/beats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block">
          <img
            src="/logo.png"
            alt="Caution Studio"
            className="h-8 w-auto object-contain brightness-0 invert mx-auto"
            style={{ width: 140 }}
          />
        </Link>
        <h2 className="mt-4 text-2xl font-black text-text tracking-[-0.03em]">
          Create your account
        </h2>
        <p className="mt-1 text-xs text-text-muted">
          Join Caution Studio as an artist, producer, or both
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface p-6 sm:p-8 rounded-sm border border-border space-y-5">
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Role picker */}
            <div>
              <label className="block text-xs font-semibold text-text mb-1.5">
                Account role (one account can hold both)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => toggleRole('artist')}
                  className={`p-2.5 rounded-sm border text-xs font-medium text-left flex items-center justify-between ${
                    roles.includes('artist')
                      ? 'bg-surface-2 border-accent-live text-text'
                      : 'bg-surface border-border text-text-muted'
                  }`}
                >
                  <span>Recording Artist</span>
                  {roles.includes('artist') && <Check className="h-3.5 w-3.5 text-accent-live" />}
                </button>

                <button
                  type="button"
                  onClick={() => toggleRole('producer')}
                  className={`p-2.5 rounded-sm border text-xs font-medium text-left flex items-center justify-between ${
                    roles.includes('producer')
                      ? 'bg-surface-2 border-accent-live text-text'
                      : 'bg-surface border-border text-text-muted'
                  }`}
                >
                  <span>Beat Producer</span>
                  {roles.includes('producer') && <Check className="h-3.5 w-3.5 text-accent-live" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Display Name / Stage Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Samuel Drake"
                className="w-full h-10 px-3 rounded-sm bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-live"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Handle (URL username)
              </label>
              <input
                type="text"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. samuel_sound"
                className="w-full h-10 px-3 rounded-sm bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-live font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="artist@cautionstudio.com"
                className="w-full h-10 px-3 rounded-sm bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-live"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 rounded-sm bg-surface-2 border border-border text-xs text-text focus:outline-none focus:border-accent-live"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-pill bg-accent hover:bg-[#135d56] text-text font-bold text-xs uppercase tracking-wider border border-accent flex items-center justify-center gap-2 transition-colors mt-2"
            >
              <span>{loading ? 'Creating...' : 'Create account'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="pt-4 border-t border-border text-center text-xs text-text-muted">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-accent-live font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
