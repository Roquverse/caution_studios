'use client';

import React, { useState } from 'react';
import { Button, Input, Card } from '@caution/ui';
import { Music2, ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      // If admin email, redirect to admin, else user portal
      if (email.includes('admin')) {
        window.location.href = 'http://localhost:3003';
      } else {
        window.location.href = 'http://localhost:3002';
      }
    }, 600);
  };

  const handleDemoLogin = (role: 'user' | 'admin') => {
    if (role === 'admin') {
      window.location.href = 'http://localhost:3003';
    } else {
      window.location.href = 'http://localhost:3002';
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-white">
        <div>
          {/* Logo */}
          <a href="http://localhost:3000" className="inline-flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-gray-950 group">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-12 w-auto max-w-[180px] object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </a>
        </div>

        <div className="max-w-md w-full mx-auto my-12">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Sign in to manage your music downloads, licenses, and Content ID clearances.
            </p>
          </div>

          {/* Quick Demo Login Buttons */}
          <div className="mb-6 p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">
              Quick One-Click Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('user')}
                className="text-xs font-semibold py-1.5 px-3 bg-white text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors shadow-2xs text-center"
              >
                Sign In as Creator
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="text-xs font-semibold py-1.5 px-3 bg-[#090A0F] text-white rounded-lg hover:bg-gray-800 transition-colors shadow-2xs text-center"
              >
                Sign In as Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              required
              placeholder="creator@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                <input type="checkbox" className="rounded border-gray-300 text-[#1E50FF] focus:ring-[#1E50FF]" />
                <span>Remember me</span>
              </label>
              <a href="/forgot-password" className="text-[#1E50FF] hover:underline font-medium">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              pill
              isLoading={isLoading}
              className="w-full text-xs font-bold uppercase tracking-wider py-3.5 shadow-md shadow-[#1E50FF]/25 hover:shadow-glow-brand"
            >
              Sign In to Account
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-500">
            Don&apos;t have an account?{' '}
            <a href="/register" className="text-[#1E50FF] font-semibold hover:underline">
              Start Free Now
            </a>
          </p>
        </div>

        <div className="text-xs text-gray-400 text-center">
          © 2026 Music Website. All rights reserved.
        </div>
      </div>

      {/* Right Column: Creative Artwork Showpiece */}
      <div className="hidden lg:flex w-1/2 bg-[#090A0F] p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#1E50FF]/20 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-600/20 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex justify-end">
          <a href="http://localhost:3000" className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1">
            Back to website <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="relative z-10 max-w-lg mx-auto text-center space-y-6">
          <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 transform hover:scale-105 transition-transform duration-500">
            <img
              src="/images/album_neon_dj.jpg"
              alt="Music album"
              className="w-full h-full object-cover"
            />
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            Royalty-free music for world-class storytellers
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
            Unlimited downloads, stem separation, and instant monetization clearance for YouTube, TikTok, commercial advertisements, and indie films.
          </p>
        </div>

        <div className="relative z-10 text-center text-xs text-gray-500">
          Used by 40,000+ creators worldwide
        </div>
      </div>
    </div>
  );
}
