'use client';

import React, { useState, useEffect } from 'react';
import { CreatorShell } from '../../components/CreatorShell';
import {
  Sliders,
  User,
  ShieldCheck,
  Bell,
  CheckCircle2,
  Sparkles,
  Save,
  Globe,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function CreatorSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile fields
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [daw, setDaw] = useState('');
  const [location, setLocation] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');

  // Status & Notifications
  const [isVerified, setIsVerified] = useState(false);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [streamingEarningsCents, setStreamingEarningsCents] = useState(0);
  const [notifySales, setNotifySales] = useState(true);
  const [notifyChats, setNotifyChats] = useState(true);
  const [notifyPayouts, setNotifyPayouts] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        const { data: profile, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          setDisplayName(profile.display_name || user.user_metadata?.full_name || '');
          setHandle(profile.handle || user.email?.split('@')[0] || '');
          setBio(profile.bio || '');
          setDaw(profile.daw || '');
          setLocation(profile.location || 'Lagos, Nigeria');
          setInstagram(profile.instagram_handle || '');
          setYoutube(profile.youtube_channel || '');
          setIsVerified(Boolean(profile.is_verified));
          setStreamingEarningsCents(profile.streaming_earnings_cents || 0);
          setNotifySales(profile.notify_sales ?? true);
          setNotifyChats(profile.notify_chats ?? true);
          setNotifyPayouts(profile.notify_payouts ?? true);
        }

        const { data: beats } = await supabase
          .from('beats')
          .select('free_commercial_downloads_count, download_count')
          .eq('producer_id', user.id);

        if (beats) {
          const sumDl = beats.reduce((acc, b) => acc + (b.free_commercial_downloads_count || b.download_count || 0), 0);
          setTotalDownloads(sumDl);
        }
      } catch (err: any) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please sign in to update creator settings');
      }

      const updates = {
        display_name: displayName.trim(),
        handle: handle.trim().replace(/^@/, ''),
        bio: bio.trim(),
        daw: daw.trim(),
        location: location.trim(),
        instagram_handle: instagram.trim(),
        youtube_channel: youtube.trim(),
        notify_sales: notifySales,
        notify_chats: notifyChats,
        notify_payouts: notifyPayouts,
        updated_at: new Date().toISOString()
      };

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
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
          disabled={saving || loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {saved && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Creator settings and public producer profile updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
        </div>
      ) : (
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
                    placeholder="e.g. Master Producer"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Creator Handle (@)</label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="producerhandle"
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
                  placeholder="Tell artists about your production style, past placements, or signature sound..."
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
                    placeholder="e.g. FL Studio, Logic Pro, Ableton"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Studio Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Lagos, Nigeria"
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
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@yourhandle"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">YouTube Channel</label>
                  <input
                    type="text"
                    value={youtube}
                    onChange={(e) => setYoutube(e.target.value)}
                    placeholder="youtube.com/@yourchannel"
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
                  <span className={isVerified ? "text-emerald-400 font-bold" : "text-amber-300 font-semibold font-mono"}>
                    {isVerified ? 'Verified Producer' : `${totalDownloads.toLocaleString()} / 10,000 downloads`}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>

              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifySales}
                    onChange={(e) => setNotifySales(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-[#2dd4bf] focus:ring-[#2dd4bf]"
                  />
                  <span className="text-zinc-300">Email on each beat license sale</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyChats}
                    onChange={(e) => setNotifyChats(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-[#2dd4bf] focus:ring-[#2dd4bf]"
                  />
                  <span className="text-zinc-300">Email on new artist studio chat message</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyPayouts}
                    onChange={(e) => setNotifyPayouts(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-950 text-[#2dd4bf] focus:ring-[#2dd4bf]"
                  />
                  <span className="text-zinc-300">Weekly Paystack royalty disbursement digest</span>
                </label>
              </div>
            </div>
          </div>
        </form>
      )}
    </CreatorShell>
  );
}
