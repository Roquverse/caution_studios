'use client';

import React, { useState } from 'react';
import { Button, Input, Card } from '@caution/ui';
import { Music2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 p-8 sm:p-10 shadow-soft-card">
        <div className="mb-6 text-center">
          <a href="http://localhost:3000" className="inline-flex items-center justify-center gap-2 mb-6 group">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-12 w-auto max-w-[180px] object-contain transition-transform duration-200 group-hover:scale-105"
            />
          </a>

          <h1 className="text-2xl font-extrabold text-gray-950 tracking-tight">
            Reset your password
          </h1>
          <p className="mt-2 text-xs text-gray-500">
            Enter your email and we&apos;ll send you instructions to reset your account password.
          </p>
        </div>

        {submitted ? (
          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-900">Check your email</h3>
            <p className="text-xs text-emerald-700 leading-relaxed">
              We&apos;ve sent a password reset link to <strong>{email}</strong>.
            </p>
            <div className="pt-2">
              <a href="/login" className="text-xs font-semibold text-emerald-800 underline">
                Return to sign in
              </a>
            </div>
          </div>
        ) : (
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

            <Button
              type="submit"
              variant="primary"
              size="lg"
              pill
              className="w-full text-xs font-bold uppercase tracking-wider py-3.5 shadow-md shadow-[#1E50FF]/25"
            >
              Send Reset Link
            </Button>

            <div className="text-center pt-2">
              <a href="/login" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-black font-medium">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
