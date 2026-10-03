'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { Check, ArrowRight, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-[#07090D] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#04564f] selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block">
          <img
            src="/logo.png"
            alt="Caution Studio"
            className="h-8 w-auto object-contain brightness-0 invert mx-auto"
            style={{ width: 140 }}
          />
        </Link>
        <h2 className="mt-4 text-2xl sm:text-3xl font-black text-white tracking-tight">
          Create your account
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          Join Caution Studio as an artist, producer, or both
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#0E131B] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Role picker */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Account role (one account can hold both)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => toggleRole('artist')}
                  className={`p-2.5 rounded-lg border text-xs font-medium text-left flex items-center justify-between transition-all ${
                    roles.includes('artist')
                      ? 'bg-[#04564f]/30 border-[#2dd4bf] text-white font-bold'
                      : 'bg-[#131924] border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <span>Recording Artist</span>
                  {roles.includes('artist') && <Check className="h-3.5 w-3.5 text-[#2dd4bf]" />}
                </button>

                <button
                  type="button"
                  onClick={() => toggleRole('producer')}
                  className={`p-2.5 rounded-lg border text-xs font-medium text-left flex items-center justify-between transition-all ${
                    roles.includes('producer')
                      ? 'bg-[#04564f]/30 border-[#2dd4bf] text-white font-bold'
                      : 'bg-[#131924] border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <span>Beat Producer</span>
                  {roles.includes('producer') && <Check className="h-3.5 w-3.5 text-[#2dd4bf]" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Display Name / Stage Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Samuel Drake"
                className="w-full h-10 px-3 rounded-lg bg-[#131924] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Handle (URL username)
              </label>
              <input
                type="text"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. samuel_sound"
                className="w-full h-10 px-3 rounded-lg bg-[#131924] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="artist@cautionstudio.com"
                className="w-full h-10 px-3 rounded-lg bg-[#131924] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 rounded-lg bg-[#131924] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#04564f]/30 mt-2 active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'Creating account...' : 'Create account'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="pt-4 border-t border-white/10 text-center text-xs text-gray-400">
            Already have an account?{' '}
            <Link href="/sign-in" className="text-[#2dd4bf] font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
