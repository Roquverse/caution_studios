'use client';

import React, { useState } from 'react';
import { Button, Input, Card, Badge } from '@caution/ui';
import { Music2, ArrowRight, Lock, Mail, User, Youtube, Check } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [channel, setChannel] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      // Redirect to user portal dashboard
      window.location.href = 'http://localhost:3002';
    }, 600);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column: Register Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-white overflow-y-auto">
        <div>
          <a href="http://localhost:3000" className="inline-flex items-center gap-2.5 font-extrabold text-xl tracking-tight text-gray-950">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-950 text-white shadow-sm">
              <Music2 className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span>Music Website</span>
          </a>
        </div>

        <div className="max-w-md w-full mx-auto my-10">
          <div className="mb-6">
            <Badge variant="brand" size="sm" className="mb-2">
              Free 14-Day Creator Trial
            </Badge>
            <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">
              Create your account
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              Start downloading royalty-free soundtrack audio and whitelist your YouTube channel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              required
              placeholder="Alex Rivers"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
            />

            <Input
              label="Email address"
              type="email"
              required
              placeholder="alex@creator.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <Input
              label="Primary YouTube channel or social handle"
              type="text"
              placeholder="@alexrivers or youtube.com/@channel"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              leftIcon={<Youtube className="h-4 w-4" />}
            />

            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#1E50FF] stroke-[3]" />
                <span>Full access to 10,000+ songs and stems</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#1E50FF] stroke-[3]" />
                <span>Automated Content ID clearance for your channel</span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              pill
              isLoading={isLoading}
              className="w-full text-xs font-bold uppercase tracking-wider py-3.5 shadow-md shadow-[#1E50FF]/25 hover:shadow-glow-brand"
            >
              START FREE NOW
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-[#1E50FF] font-semibold hover:underline">
              Sign In
            </a>
          </p>
        </div>

        <div className="text-xs text-gray-400 text-center">
          By signing up, you agree to our Terms of Use and Licensing Policy.
        </div>
      </div>

      {/* Right Column: Visual Artwork */}
      <div className="hidden lg:flex w-1/2 bg-[#090A0F] p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-600/25 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/20 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex justify-end">
          <a href="http://localhost:3000" className="text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1">
            Back to website <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="relative z-10 max-w-lg mx-auto text-center space-y-6">
          <div className="relative w-64 h-64 mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-white/20 transform hover:scale-105 transition-transform duration-500">
            <img
              src="/images/golden_clef.jpg"
              alt="Golden treble clef"
              className="w-full h-full object-cover"
            />
          </div>

          <h2 className="text-2xl font-bold tracking-tight">
            Clear music rights in one single click
          </h2>
          <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
            Never stress about copyright strikes or demonetized videos again. Enjoy complete creative freedom.
          </p>
        </div>

        <div className="relative z-10 text-center text-xs text-gray-500">
          Trusted by top creators, agencies, and indie studios
        </div>
      </div>
    </div>
  );
}
