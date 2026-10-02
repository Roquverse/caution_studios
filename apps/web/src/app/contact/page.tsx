'use client';

import React, { useState } from 'react';
import { Navbar, Footer, Button, Input } from '@caution/ui';
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
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Navbar
        brandName="Music Website"
        currentPath="/contact"
        onStartFree={() => (window.location.href = 'http://localhost:3001/register')}
        onSignIn={() => (window.location.href = 'http://localhost:3001/login')}
        userPortalUrl="http://localhost:3002"
        adminPortalUrl="http://localhost:3003"
        onNavigate={(href) => (window.location.href = href)}
      />

      <main className="flex-1 py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-950 tracking-tight">
              Get in Touch with our Music Team
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              Need custom music production, enterprise licensing, or copyright clearance assistance? We respond within 24 hours.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200/80 p-8 shadow-soft-card">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h3 className="text-xl font-bold text-gray-900">Message Received!</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Thank you for reaching out, {name}. A music licensing specialist will reply to {email} shortly.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  pill
                  onClick={() => setSubmitted(false)}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <Input
                  label="Your Name"
                  required
                  placeholder="Taylor Scott"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Input
                  label="Email Address"
                  type="email"
                  required
                  placeholder="taylor@production.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">
                    How can we help?
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about your video project, channel, or licensing requirements..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1E50FF] focus:ring-2 focus:ring-[#1E50FF]/20"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  pill
                  className="w-full text-xs font-bold uppercase tracking-wider py-3.5 shadow-md shadow-[#1E50FF]/25"
                  rightIcon={<Send className="h-3.5 w-3.5" />}
                >
                  Submit Inquiry
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer brandName="Music Website" />
    </div>
  );
}
