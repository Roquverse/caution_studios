'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Sliders,
  Volume2,
  Bell,
  Lock,
  ChevronLeft,
  CheckCircle2,
  Save,
  Radio,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { UserDropdown } from '../../components/UserDropdown';

export default function SettingsPage() {
  const [audioQuality, setAudioQuality] = useState<'lossless' | 'high' | 'standard'>('lossless');
  const [volumeNormalization, setVolumeNormalization] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [crossfadeSeconds, setCrossfadeSeconds] = useState(3);
  const [emailNewDrops, setEmailNewDrops] = useState(true);
  const [emailReceipts, setEmailReceipts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  return (
    <div className="min-h-screen bg-[#08090B] text-white flex flex-col font-sans selection:bg-[#04564f] selection:text-white pb-20">
      {/* 1. TOP HEADER */}
      <header className="h-16 border-b border-white/[0.06] bg-[#0A0B0E] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-8 w-64 shrink-0">
          <Link href="/dashboard" className="inline-flex items-center">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-8 w-auto object-contain brightness-0 invert"
              style={{ width: 200 }}
            />
          </Link>
        </div>

        <div className="flex-1 max-w-xl">
          <div className="relative flex items-center">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#141518] border border-white/[0.06] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/20 hover:border-white/40 text-xs font-semibold text-white/90 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-gray-400" />
            <span>Dashboard</span>
          </Link>

          <UserDropdown />
        </div>
      </header>

      {/* 2. MAIN BODY */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-5 sm:p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-[#2dd4bf] font-medium">Settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            App & Audio Settings
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Customize audio playback quality, DSP features, notification alerts and security.
          </p>
        </div>

        {saved && (
          <div className="p-4 rounded-xl bg-[#04564f]/40 border border-[#2dd4bf]/50 text-white flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-5 w-5 text-[#2dd4bf] shrink-0" />
            <span className="text-xs font-semibold text-[#2dd4bf]">
              Settings preferences saved successfully!
            </span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: Audio Playback */}
          <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-5">
            <div className="flex items-center gap-2 text-white">
              <Volume2 className="h-5 w-5 text-[#2dd4bf]" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                Audio Engine & Streaming
              </h3>
            </div>

            <div className="space-y-4">
              {/* Streaming Quality */}
              <div>
                <label className="text-xs text-gray-300 font-medium block mb-2">
                  Streaming Quality
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'lossless', title: 'Lossless (24-bit/48kHz)', desc: 'Full dynamic range FLAC / WAV' },
                    { id: 'high', title: 'High (320kbps MP3)', desc: 'Crystal-clear studio compression' },
                    { id: 'standard', title: 'Standard (128kbps)', desc: 'Data saver for mobile bandwidth' }
                  ].map((tier) => (
                    <div
                      key={tier.id}
                      onClick={() => setAudioQuality(tier.id as any)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        audioQuality === tier.id
                          ? 'bg-[#04564f]/30 border-[#2dd4bf] text-white shadow-sm'
                          : 'bg-[#181a1f] border-white/[0.06] text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <p className={`text-xs font-bold ${audioQuality === tier.id ? 'text-[#2dd4bf]' : 'text-white'}`}>
                        {tier.title}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">{tier.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volume Normalization */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181a1f] border border-white/[0.06]">
                <div>
                  <p className="text-xs font-bold text-white">Volume Normalization</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Maintains consistent loudness across tracks (-14 LUFS mastering standard)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setVolumeNormalization(!volumeNormalization)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    volumeNormalization ? 'bg-[#04564f]' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      volumeNormalization ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Autoplay */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181a1f] border border-white/[0.06]">
                <div>
                  <p className="text-xs font-bold text-white">Autoplay Next Beat</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Keep the session flowing with harmonically matched tracks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoplay(!autoplay)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    autoplay ? 'bg-[#04564f]' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      autoplay ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Crossfade */}
              <div className="p-3.5 rounded-xl bg-[#181a1f] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Crossfade Duration</span>
                  <span className="text-xs font-mono text-[#2dd4bf]">{crossfadeSeconds}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={crossfadeSeconds}
                  onChange={(e) => setCrossfadeSeconds(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-lg accent-[#2dd4bf] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Notifications */}
          <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Bell className="h-5 w-5 text-[#2dd4bf]" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                Notifications
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181a1f] border border-white/[0.06]">
                <div>
                  <p className="text-xs font-bold text-white">New Beat Drops & Producers</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Receive email alerts when trending producers release exclusive catalog tracks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailNewDrops(!emailNewDrops)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    emailNewDrops ? 'bg-[#04564f]' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      emailNewDrops ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181a1f] border border-white/[0.06]">
                <div>
                  <p className="text-xs font-bold text-white">Licensing & Purchase Receipts</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Instant signed PDF contract delivery and receipt copies
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailReceipts(!emailReceipts)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    emailReceipts ? 'bg-[#04564f]' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      emailReceipts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Security & Session */}
          <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-4">
            <div className="flex items-center gap-2 text-white">
              <ShieldCheck className="h-5 w-5 text-[#2dd4bf]" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                Security & Devices
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-[#181a1f] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs font-bold text-white">Current Active Session</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Mac OS • Chrome • Lagos, Nigeria • Signed in
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#04564f]/50 text-[#2dd4bf] border border-[#2dd4bf]/30">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-[#2dd4bf]/30 transition-colors shadow-md cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
