'use client';

import React, { useState } from 'react';
import { TopNav } from '../../components/layout/TopNav';
import { LandingFooter } from '../../components/LandingFooter';
import { Mail, MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col selection:bg-[#04564f] selection:text-white">
      <TopNav />

      <main className="flex-1 py-16 sm:py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2dd4bf]">
              Support &amp; Inquiries
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-2">
              Get in Touch with our Music Team
            </h1>
            <p className="mt-3 text-sm text-neutral-400">
              Need custom music production, enterprise licensing, or copyright clearance assistance? We respond within 24 hours.
            </p>
          </div>

          <div className="bg-white/[0.04] rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-xl">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <CheckCircle2 className="h-12 w-12 text-[#2dd4bf] mx-auto" />
                <h3 className="text-xl font-bold text-white">Message Received!</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Thank you for reaching out, {name}. A music licensing specialist will reply to {email} shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setName('');
                    setEmail('');
                    setMessage('');
                  }}
                  className="inline-flex text-xs font-bold uppercase tracking-wider px-5 py-2.5 bg-[#04564f] hover:bg-[#03453f] text-white transition-all shadow-md rounded-full mt-4 cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 text-left">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cole Johnson"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#2dd4bf]/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#2dd4bf]/60 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    Message or Production Request
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you need help with..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-[#2dd4bf]/60 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full text-xs font-bold uppercase tracking-wider py-3.5 bg-[#04564f] hover:bg-[#03453f] text-white transition-all shadow-md shadow-[#04564f]/30 rounded-full flex items-center justify-center gap-2 cursor-pointer font-semibold"
                >
                  <span>Submit Inquiry</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
