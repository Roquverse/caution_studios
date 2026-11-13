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
  Zap,
  Info
} from 'lucide-react';
import { UserShell } from '../../components/UserShell';
import { useAppSettings, AppSettings } from '../../lib/settings';
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <Link href="/" className="hover:text-white transition-colors">
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
            <div className="flex-1">
              <span className="text-xs font-semibold text-[#2dd4bf] block">
                Settings preferences updated successfully!
              </span>
              <span className="text-[11px] text-gray-300">
                Audio engine, streaming quality, and playback settings are now active across your session.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          {/* Section 1: Audio Playback */}
          <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Volume2 className="h-5 w-5 text-[#2dd4bf]" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                  Audio Engine & Streaming
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#2dd4bf] bg-[#04564f]/30 border border-[#2dd4bf]/30 px-2 py-0.5 rounded">
                Live DSP Active
              </span>
            </div>

            <div className="space-y-4">
              {/* Streaming Quality */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-gray-300 font-medium block">
                    Streaming Quality
                  </label>
                  <span className="text-[11px] font-mono text-[#2dd4bf]">
                    Active: {audioQuality.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'lossless' as const, title: 'Lossless (24-bit/48kHz)', desc: 'Full dynamic range FLAC / WAV' },
                    { id: 'high' as const, title: 'High (320kbps MP3)', desc: 'Crystal-clear studio compression' },
                    { id: 'standard' as const, title: 'Standard (128kbps)', desc: 'Data saver for mobile bandwidth' }
                  ].map((tier) => {
                    const isSelected = audioQuality === tier.id;
                    return (
                      <button
                        type="button"
                        key={tier.id}
                        onClick={() => handleQualitySelect(tier.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#04564f]/30 border-[#2dd4bf] text-white shadow-sm ring-1 ring-[#2dd4bf]/40'
                            : 'bg-[#181a1f] border-white/[0.06] text-gray-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold ${isSelected ? 'text-[#2dd4bf]' : 'text-white'}`}>
                            {tier.title}
                          </p>
                          {isSelected && <Sparkles className="h-3.5 w-3.5 text-[#2dd4bf]" />}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">{tier.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Volume Normalization */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181a1f] border border-white/[0.06]">
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">Volume Normalization</p>
                    <span className="text-[10px] font-mono text-gray-400 bg-white/[0.05] px-1.5 py-0.2 rounded">
                      -14 LUFS
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Maintains consistent loudness across tracks (-14 LUFS mastering standard)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleNormalization}
                  aria-pressed={volumeNormalization}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
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
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-white">Autoplay Next Beat</p>
                    <span className="text-[10px] font-mono text-[#2dd4bf] bg-[#04564f]/30 px-1.5 py-0.2 rounded">
                      Camelot Wheel
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Keep the session flowing with harmonically matched tracks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAutoplay}
                  aria-pressed={autoplay}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
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
                  <div>
                    <span className="text-xs font-bold text-white">Crossfade Duration</span>
                    <p className="text-[11px] text-gray-400">
                      Smooth DJ fade transition between beats
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#2dd4bf] bg-[#04564f]/40 px-2 py-0.5 rounded border border-[#2dd4bf]/30">
                    {crossfadeSeconds === 0 ? 'Off (0s)' : `${crossfadeSeconds}s`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={crossfadeSeconds}
                  onChange={(e) => handleCrossfadeChange(parseInt(e.target.value) || 0)}
                  className="w-full h-1.5 bg-white/20 rounded-lg accent-[#2dd4bf] cursor-pointer"
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
            <div className="flex items-center gap-2 text-white">
              <Bell className="h-5 w-5 text-[#2dd4bf]" />
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                Notifications
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#181a1f] border border-white/[0.06]">
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
                <div className="pr-4">
                  <p className="text-xs font-bold text-white">Licensing & Purchase Receipts</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Instant signed PDF contract delivery and receipt copies
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleEmailReceipts}
                  aria-pressed={emailReceipts}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
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
                    {deviceInfo.os} • {deviceInfo.browser} • {deviceInfo.location} • {deviceInfo.userEmail}
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
              href="/"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Back to Studio
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-[#2dd4bf]/30 transition-colors shadow-md cursor-pointer disabled:opacity-50"
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
