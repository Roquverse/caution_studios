'use client';

import React, { useState } from 'react';
import { CreatorShell } from '../../components/CreatorShell';
import {
  Sliders,
  User,
  ShieldCheck,
  Bell,
  CheckCircle2,
  Sparkles,
  Save,
  Globe
} from 'lucide-react';

export default function CreatorSettingsPage() {
  const [displayName, setDisplayName] = useState('Arakunrin Cole');
  const [handle, setHandle] = useState('arakunrincole');
  const [bio, setBio] = useState('Multi-genre Afrobeats and Amapiano producer based in Lagos. Crafting chart-topping drum grooves, heavy log drums, and cinematic melodies.');
  const [daw, setDaw] = useState('FL Studio & Logic Pro');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <CreatorShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Creator Studio Settings
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your producer profile, credits, social links, and notifications
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {saved && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Creator settings and public producer profile updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-white">Public Producer Profile</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Producer / Stage Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Creator Handle (@)</label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Producer Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Primary DAW & Gear</label>
                <input
                  type="text"
                  value={daw}
                  onChange={(e) => setDaw(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Studio Location</label>
                <input
                  type="text"
                  defaultValue="Lagos, Nigeria"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-white">Social & Music Links</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Instagram Handle</label>
                <input
                  type="text"
                  defaultValue="@caution_cole"
                  placeholder="@handle"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">YouTube Channel</label>
                <input
                  type="text"
                  defaultValue="youtube.com/@cautioncole"
                  placeholder="Channel link"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Notifications */}
        <div className="space-y-6">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-white">Producer Status</h3>

            <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Launch Promo:</span>
                <span className="text-amber-300 font-bold font-mono">3 Months Free</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Revenue Split:</span>
                <span className="text-[#2dd4bf] font-bold font-mono">80% Creator</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Verification:</span>
                <span className="text-amber-300 font-semibold font-mono">₦38.5k / ₦50k</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-zinc-700 bg-zinc-950 text-[#2dd4bf] focus:ring-[#2dd4bf]"
                />
                <span className="text-zinc-300">Email on each beat license sale</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-zinc-700 bg-zinc-950 text-[#2dd4bf] focus:ring-[#2dd4bf]"
                />
                <span className="text-zinc-300">Email on new artist studio chat message</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-zinc-700 bg-zinc-950 text-[#2dd4bf] focus:ring-[#2dd4bf]"
                />
                <span className="text-zinc-300">Weekly Paystack royalty disbursement digest</span>
              </label>
            </div>
          </div>
        </div>
      </form>
    </CreatorShell>
  );
}
