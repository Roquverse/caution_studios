'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Volume2,
  Bell,
  CheckCircle2,
  Save,
  ShieldCheck,
  Smartphone,
  Sliders,
  Sparkles,
  Music,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { UserShell } from '../../components/UserShell';
import { useAppSettings } from '../../lib/settings';
import { supabase } from '../../lib/supabaseClient';

export default function SettingsPage() {
  const { settings, updateSettings, isLoading } = useAppSettings();

  const [audioQuality, setAudioQuality] = useState<'lossless' | 'high' | 'standard'>('lossless');
  const [volumeNormalization, setVolumeNormalization] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [crossfadeSeconds, setCrossfadeSeconds] = useState(3);
  const [emailNewDrops, setEmailNewDrops] = useState(true);
  const [emailReceipts, setEmailReceipts] = useState(true);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Real device session state
  const [deviceInfo, setDeviceInfo] = useState({
    os: 'Detecting...',
    browser: 'Browser',
    location: 'Nigeria',
    userEmail: 'Signed in member'
  });

  // Sync state when settings hook finishes loading
  useEffect(() => {
    if (!isLoading) {
      setAudioQuality(settings.audioQuality);
      setVolumeNormalization(settings.volumeNormalization);
      setAutoplay(settings.autoplay);
      setCrossfadeSeconds(settings.crossfadeSeconds);
      setEmailNewDrops(settings.emailNewDrops);
      setEmailReceipts(settings.emailReceipts);
    }
  }, [settings, isLoading]);

  // Detect real device, OS, browser, and user session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      let os = 'Unknown OS';
      if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
      else if (/Android/.test(ua)) os = 'Android';
      else if (/Macintosh|Mac OS X/.test(ua)) os = 'macOS';
      else if (/Windows/.test(ua)) os = 'Windows';
      else if (/Linux/.test(ua)) os = 'Linux';

      let browser = 'Browser';
      if (/Chrome|CriOS/.test(ua) && !/Edg|OPR/.test(ua)) browser = 'Chrome';
      else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
      else if (/Firefox|FxiOS/.test(ua)) browser = 'Firefox';
      else if (/Edg/.test(ua)) browser = 'Edge';

      let location = 'Lagos, Nigeria';
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (timeZone) {
          const parts = timeZone.split('/');
          const city = (parts[1] || parts[0]).replace(/_/g, ' ');
          const region = parts[0] === 'Africa' ? 'Nigeria' : parts[0];
          location = `${city}, ${region}`;
        }
      } catch {}

      supabase.auth.getSession().then(({ data: { session } }) => {
        setDeviceInfo({
          os,
          browser,
          location,
          userEmail: session?.user?.email || 'Signed in member'
        });
      });
    }
  }, []);

  const handleQualitySelect = async (tier: 'lossless' | 'high' | 'standard') => {
    setAudioQuality(tier);
    await updateSettings({ audioQuality: tier });
    showFeedback();
  };

  const handleToggleNormalization = async () => {
    const nextVal = !volumeNormalization;
    setVolumeNormalization(nextVal);
    await updateSettings({ volumeNormalization: nextVal });
    showFeedback();
  };

  const handleToggleAutoplay = async () => {
    const nextVal = !autoplay;
    setAutoplay(nextVal);
    await updateSettings({ autoplay: nextVal });
    showFeedback();
  };

  const handleCrossfadeChange = async (secs: number) => {
    setCrossfadeSeconds(secs);
    await updateSettings({ crossfadeSeconds: secs });
    showFeedback();
  };

  const handleToggleEmailNewDrops = async () => {
    const nextVal = !emailNewDrops;
    setEmailNewDrops(nextVal);
    await updateSettings({ emailNewDrops: nextVal });
    showFeedback();
  };

  const handleToggleEmailReceipts = async () => {
    const nextVal = !emailReceipts;
    setEmailReceipts(nextVal);
    await updateSettings({ emailReceipts: nextVal });
    showFeedback();
  };

  const showFeedback = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateSettings({
      audioQuality,
      volumeNormalization,
      autoplay,
      crossfadeSeconds,
      emailNewDrops,
      emailReceipts
    });
    setIsSaving(false);
    showFeedback();
  };

  return (
    <UserShell activePath="/settings">
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Link href="/" className="hover:text-white transition-colors">
                Caution
              </Link>
              <span>/</span>
              <span className="text-[#e53935] font-semibold">Settings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Manage audio playback engine, notification delivery, security sessions, and account options.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-gray-300 hover:text-white border border-white/[0.06] transition-colors flex items-center gap-2"
            >
              <span>Edit Profile</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {saved && (
          <div className="p-4 rounded-xl bg-[#e53935]/15 border border-[#e53935]/40 text-white flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-5 w-5 text-[#e53935] shrink-0" />
            <div className="flex-1">
              <span className="text-xs font-bold text-white block">
                Preferences saved successfully
              </span>
              <span className="text-[11px] text-gray-300">
                Audio engine, streaming quality, and notifications are now updated for your session.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Section 1: Audio Playback Engine */}
          <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-white">
                <div className="p-2 rounded-xl bg-[#e53935]/15 text-[#e53935]">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Audio Engine & Streaming Quality
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    High-fidelity master streaming and playback optimization
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#e53935] bg-[#e53935]/10 border border-[#e53935]/30 px-2 py-0.5 rounded-full">
                Live DSP Active
              </span>
            </div>

            <div className="space-y-4 pt-1">
              {/* Streaming Quality Cards */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-300 font-semibold block">
                    Streaming Quality
                  </label>
                  <span className="text-[11px] font-mono text-[#e53935] font-semibold">
                    Current: {audioQuality.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'lossless' as const, title: 'Lossless 24-bit', desc: 'Full dynamic range 48kHz WAV / FLAC' },
                    { id: 'high' as const, title: 'High 320kbps', desc: 'Studio grade transparent MP3' },
                    { id: 'standard' as const, title: 'Standard 128kbps', desc: 'Data-saver for mobile bandwidth' }
                  ].map((tier) => {
                    const isSelected = audioQuality === tier.id;
                    return (
                      <button
                        type="button"
                        key={tier.id}
                        onClick={() => handleQualitySelect(tier.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#e53935]/15 border-[#e53935] text-white shadow-md shadow-red-500/10 ring-1 ring-[#e53935]/40'
                            : 'bg-[#16181d] border-white/[0.06] text-gray-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold ${isSelected ? 'text-[#e53935]' : 'text-white'}`}>
                            {tier.title}
                          </p>
                          {isSelected && <Sparkles className="h-3.5 w-3.5 text-[#e53935]" />}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-snug">{tier.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Volume Normalization */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#16181d] border border-white/[0.06]">
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">Volume Normalization</p>
                    <span className="text-[10px] font-mono text-gray-400 bg-white/[0.06] px-1.5 py-0.5 rounded">
                      -14 LUFS
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Maintains consistent loudness across tracks to avoid sudden volume spikes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleNormalization}
                  aria-pressed={volumeNormalization}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    volumeNormalization ? 'bg-[#e53935]' : 'bg-white/10'
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
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#16181d] border border-white/[0.06]">
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">Autoplay Next Beat</p>
                    <span className="text-[10px] font-mono text-[#e53935] bg-[#e53935]/15 px-1.5 py-0.5 rounded">
                      Harmonic Match
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Automatically transition to harmonically compatible beats using the Camelot Wheel
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAutoplay}
                  aria-pressed={autoplay}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    autoplay ? 'bg-[#e53935]' : 'bg-white/10'
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
              <div className="p-4 rounded-xl bg-[#16181d] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Crossfade Duration</span>
                    <p className="text-[11px] text-gray-400">
                      Smooth DJ blending transition between consecutive beats
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#e53935] bg-[#e53935]/15 px-2 py-0.5 rounded border border-[#e53935]/30">
                    {crossfadeSeconds === 0 ? 'Off (Direct Cut)' : `${crossfadeSeconds}s`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={crossfadeSeconds}
                  onChange={(e) => handleCrossfadeChange(parseInt(e.target.value) || 0)}
                  aria-label="Crossfade slider"
                  className="w-full h-1.5 bg-white/20 rounded-lg accent-[#e53935] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-gray-500">
                  <span>0s (Direct Cut)</span>
                  <span>5s</span>
                  <span>10s (Long Blend)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Notifications */}
          <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <div className="p-2 rounded-xl bg-[#e53935]/15 text-[#e53935]">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Notification Alerts
                </h3>
                <p className="text-[11px] text-gray-400">
                  Configure alerts for new drops, licensing contracts, and downloads
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#16181d] border border-white/[0.06]">
                <div className="pr-4">
                  <p className="text-xs font-bold text-white">New Beat Drops & Producers</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Receive email alerts when trending producers release exclusive catalog tracks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleEmailNewDrops}
                  aria-pressed={emailNewDrops}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    emailNewDrops ? 'bg-[#e53935]' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      emailNewDrops ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#16181d] border border-white/[0.06]">
                <div className="pr-4">
                  <p className="text-xs font-bold text-white">Licensing & Purchase Receipts</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Instant PDF agreement delivery and stems download verification links
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleEmailReceipts}
                  aria-pressed={emailReceipts}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    emailReceipts ? 'bg-[#e53935]' : 'bg-white/10'
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-white">
                <div className="p-2 rounded-xl bg-[#e53935]/15 text-[#e53935]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Security & Active Session
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Real-time hardware verification and authenticated session
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-green-500/15 text-green-400 border border-green-500/30">
                ACTIVE
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#16181d] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs font-bold text-white">Current Active Session</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {deviceInfo.os} • {deviceInfo.browser} • {deviceInfo.location} • {deviceInfo.userEmail}
                  </p>
                </div>
              </div>
              <Link
                href="/subscriptions"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#e53935] hover:text-[#ff5252] font-semibold transition-colors"
              >
                <span>Subscription</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#e53935] hover:bg-[#d32f2f] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </UserShell>
  );
}
