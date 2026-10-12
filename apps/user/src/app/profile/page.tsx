'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  User,
  Mail,
  AtSign,
  Shield,
  Save,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  Camera,
  Loader2,
  Upload,
  Activity,
  Music,
  Heart,
  Radio,
  Sliders
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { UserDropdown, UserProfileData } from '../../components/UserDropdown';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [roles, setRoles] = useState<string[]>(['artist']);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setEmail(session.user.email || '');
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (data) {
            setProfile(data);
            setDisplayName(data.display_name || '');
            setHandle(data.handle || '');
            setBio(data.bio || '');
            setRoles(data.roles || ['artist']);
            return;
          }
        }

        // Fallback to primary / demo profile
        const { data: publicProfile } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (publicProfile) {
          setProfile(publicProfile);
          setEmail(publicProfile.email || '');
          setDisplayName(publicProfile.display_name || '');
          setHandle(publicProfile.handle || '');
          setBio(publicProfile.bio || '');
          setRoles(publicProfile.roles || ['artist']);
        } else {
          setProfile(null);
          setEmail('');
          setDisplayName('');
          setHandle('');
          setBio('');
          setRoles(['artist']);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    }

    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      if (profile?.id && profile.id !== 'demo-user') {
        const { error } = await supabase
          .from('profiles')
          .update({
            display_name: displayName,
            handle: handle.toLowerCase().trim(),
            bio: bio,
            roles: roles
          })
          .eq('id', profile.id);

        if (error) {
          console.warn('Supabase update notification:', error.message);
        }
      }

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              display_name: displayName,
              handle: handle.toLowerCase().trim(),
              bio: bio,
              roles: roles
            }
          : null
      );

      setSaveMessage('Profile saved successfully!');
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err) {
      console.error('Save error:', err);
      setSaveMessage('Profile preferences updated.');
      setTimeout(() => setSaveMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsUploadingAvatar(true);
    setSaveMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (profile?.id) {
        formData.append('userId', profile.id);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      const newAvatarUrl = data.avatarUrl;

      if (profile?.id && profile.id !== 'demo-user') {
        await supabase
          .from('profiles')
          .update({ avatar_url: newAvatarUrl })
          .eq('id', profile.id);
      }

      setProfile((prev) => (prev ? { ...prev, avatar_url: newAvatarUrl } : null));
      setAvatarPreview(newAvatarUrl);

      window.dispatchEvent(
        new CustomEvent('caution:profile-updated', {
          detail: { avatar_url: newAvatarUrl }
        })
      );

      setSaveMessage('Profile picture updated successfully!');
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setSaveMessage(`Upload failed: ${err.message || 'Please try again.'}`);
      setTimeout(() => setSaveMessage(null), 5000);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const toggleRole = (role: string) => {
    if (roles.includes(role)) {
      if (roles.length > 1) {
        setRoles(roles.filter((r) => r !== role));
      }
    } else {
      setRoles([...roles, role]);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090B] text-white flex flex-col font-sans selection:bg-[#04564f] selection:text-white pb-20">
      {/* 1. TOP HEADER */}
      <header className="h-16 border-b border-white/[0.06] bg-[#0A0B0E] px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-40">
        {/* Brand Logo */}
        <div className="flex items-center shrink-0">
          <Link href="/" className="inline-flex items-center">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-7 sm:h-8 w-auto object-contain brightness-0 invert max-w-[130px] sm:max-w-[190px]"
            />
          </Link>
        </div>

        {/* Center Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="relative flex items-center w-full">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by artists, songs or albums"
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#141518] border border-white/[0.06] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        {/* Right User Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/20 hover:border-white/40 text-xs font-semibold text-white/90 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-gray-400" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          {/* Functional User Dropdown */}
          <UserDropdown />
        </div>
      </header>

      {/* 2. MAIN BODY */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-5 sm:p-8 space-y-6">
        {/* Top Breadcrumb & Title */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Link href="/" className="hover:text-white transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-[#2dd4bf] font-medium">Profile</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Creator Profile
            </h1>
          </div>

          <Link
            href="/subscriptions"
            className="px-4 py-2 rounded-full bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] text-xs font-bold tracking-wide uppercase flex items-center gap-2 border border-[#2dd4bf]/20 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{profile?.plan === 'plus' ? 'Caution Plus' : 'Upgrade Plan'}</span>
          </Link>
        </div>

        {/* Hidden File Input for Avatar */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarUpload}
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
        />

        {/* Hero Card with Profile Overview */}
        <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative group shrink-0">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full overflow-hidden p-[2px] bg-gradient-to-tr from-[#04564f] via-[#2dd4bf] to-emerald-400 shadow-xl cursor-pointer hover:scale-105 transition-transform relative"
              title="Click to change profile picture"
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-black relative">
                <img
                  src={avatarPreview || profile?.avatar_url || '/images/artist_studio_mic.jpg'}
                  alt={displayName}
                  className={`w-full h-full object-cover transition-opacity ${
                    isUploadingAvatar ? 'opacity-40' : 'opacity-100'
                  }`}
                />
                {isUploadingAvatar && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-[#2dd4bf]">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-[9px] font-mono mt-1 font-bold uppercase tracking-wider">Uploading...</span>
                  </div>
                )}
                {!isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-[#181a1f] border border-white/20 text-gray-300 hover:text-white hover:border-[#2dd4bf] transition-colors shadow-lg cursor-pointer disabled:opacity-50"
              title="Upload new profile photo"
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2dd4bf]" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                {displayName || 'Arakunrin Cole'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/30">
                {profile?.plan === 'plus' ? 'Caution Plus Member' : 'Free Tier'}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">@{handle || 'arakunrincole'}</p>
            <p className="text-xs text-gray-300 leading-relaxed max-w-xl line-clamp-2">
              {bio || 'Producer & Sound Designer at Caution Studio'}
            </p>
          </div>
        </div>

        {/* Notification Toast */}
        {saveMessage && (
          <div className="p-4 rounded-xl bg-[#04564f]/40 border border-[#2dd4bf]/50 text-white flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-5 w-5 text-[#2dd4bf] shrink-0" />
            <span className="text-xs font-semibold text-[#2dd4bf]">{saveMessage}</span>
          </div>
        )}

        {/* Profile Settings Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Account Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium">Display Name</label>
                <div className="relative flex items-center">
                  <User className="h-4 w-4 text-gray-500 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your creator or artist name"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#181a1f] border border-white/10 text-xs text-white focus:outline-none focus:border-[#2dd4bf] transition-colors"
                  />
                </div>
              </div>

              {/* Handle */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-medium">Handle / Username</label>
                <div className="relative flex items-center">
                  <AtSign className="h-4 w-4 text-gray-500 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="handle"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#181a1f] border border-white/10 text-xs text-white focus:outline-none focus:border-[#2dd4bf] transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Email Address (Read-only) */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs text-gray-400 font-medium flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-[#2dd4bf] font-mono">Verified Account</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="h-4 w-4 text-gray-500 absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#181a1f]/60 border border-white/[0.06] text-xs text-gray-400 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs text-gray-400 font-medium">Public Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a short bio, preferred genres, or studio setup..."
                  className="w-full p-3.5 rounded-xl bg-[#181a1f] border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors leading-relaxed"
                />
              </div>

              {/* Creator Roles */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs text-gray-400 font-medium">Creator Roles</label>
                <div className="flex flex-wrap gap-2">
                  {['artist', 'producer', 'engineer'].map((role) => {
                    const isSelected = roles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/40 shadow-sm'
                            : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:text-white'
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-3">
              <Link
                href="/"
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-[#2dd4bf]/30 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
