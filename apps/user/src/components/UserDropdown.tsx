'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Settings, CreditCard, LogOut, ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { setCachedUserPlan } from '../lib/subscription';

export interface UserProfileData {
  id: string;
  handle: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  plan: 'free' | 'plus' | string;
  roles?: string[];
}

export function UserDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [email, setEmail] = useState<string>('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setEmail(session.user.email || '');
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (data) {
            setProfile(data);
            setCachedUserPlan(data.plan || 'free');
            return;
          }
        }

        // If no active session or record, fetch the primary profile or fallback gracefully
        const { data: publicProfile } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (publicProfile) {
          setProfile(publicProfile);
          setCachedUserPlan(publicProfile.plan || 'free');
          setEmail('arakunrincole@cautionstudio.com');
        } else {
          setProfile({
            id: 'demo-user',
            handle: 'arakunrincole',
            display_name: 'Arakunrin Cole',
            avatar_url: '/images/artist_studio_mic.jpg',
            plan: 'free',
            bio: 'Producer & Audio Engineer at Caution Studio'
          });
          setCachedUserPlan('free');
          setEmail('cole@cautionstudio.com');
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      }
    }

    loadUser();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (typeof document !== 'undefined') {
          const isProd = window.location.hostname.includes('cautionstudioz.com');
          const domainStr = isProd ? '; domain=.cautionstudioz.com' : '';
          document.cookie = `sb-token=${session.access_token}; path=/; max-age=604800; SameSite=Lax${domainStr}`;
          document.cookie = `sb-refresh=${session.refresh_token}; path=/; max-age=604800; SameSite=Lax${domainStr}`;
        }
        setEmail(session.user.email || '');
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (data) {
          setProfile(data);
          setCachedUserPlan(data.plan || 'free');
        }
      }
    });

    // Listen to profile update broadcast
    const handleProfileUpdate = (e: any) => {
      if (e.detail?.avatar_url) {
        setProfile((prev) => (prev ? { ...prev, avatar_url: e.detail.avatar_url } : null));
      }
    };
    window.addEventListener('caution:profile-updated', handleProfileUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('caution:profile-updated', handleProfileUpdate);
    };
  }, []);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getAuthLoginUrl = () => {
    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL;
    if (authUrl) return `${authUrl}/login`;
    // In production, redirect to the dedicated auth subdomain
    if (typeof window !== 'undefined' && window.location.hostname.includes('cautionstudioz.com')) {
      return 'https://auth.cautionstudioz.com/login';
    }
    // In local dev, auth runs on port 3001
    return 'http://localhost:3001/login';
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      if (typeof document !== 'undefined') {
        const isProd = window.location.hostname.includes('cautionstudioz.com');
        const domainStr = isProd ? '; domain=.cautionstudioz.com' : '';
        document.cookie = `sb-token=; path=/; max-age=0${domainStr}`;
        document.cookie = `sb-refresh=; path=/; max-age=0${domainStr}`;
      }
      setCachedUserPlan('free');
      // Redirect to the auth app login page (not an internal /login route)
      window.location.href = getAuthLoginUrl();
    } catch (err) {
      console.error('Sign out error:', err);
      setCachedUserPlan('free');
      window.location.href = getAuthLoginUrl();
    }
  };

  const isPlus = profile?.plan === 'plus';

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative block rounded-full focus:outline-none focus:ring-2 focus:ring-[#2dd4bf]/60 transition-transform active:scale-95 cursor-pointer"
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full overflow-hidden p-[1.5px] bg-gradient-to-tr from-[#04564f] via-[#2dd4bf] to-emerald-400 hover:scale-105 transition-transform">
          <div className="w-full h-full rounded-full overflow-hidden bg-black">
            <img
              src={profile?.avatar_url || '/images/artist_studio_mic.jpg'}
              alt={profile?.display_name || 'User Avatar'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </button>

      {/* Dropdown Menu Box */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-72 max-w-[calc(100vw-2rem)] bg-[#0E1015] border border-white/[0.08] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
          {/* Header Info */}
          <div className="p-3 bg-white/[0.03] rounded-xl border border-white/[0.04] mb-1.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-black border border-white/10 shrink-0">
                <img
                  src={profile?.avatar_url || '/images/artist_studio_mic.jpg'}
                  alt={profile?.display_name || 'User Avatar'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate">
                    {profile?.display_name || 'Arakunrin Cole'}
                  </p>
                  {isPlus ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/30">
                      PLUS
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/10 text-gray-400">
                      FREE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                  @{profile?.handle || 'arakunrincole'}
                </p>
                {email && (
                  <p className="text-[10px] text-gray-500 truncate mt-0.5 font-mono">
                    {email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-0.5">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-gray-400 group-hover:text-[#2dd4bf] transition-colors" />
                <span>Profile</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="h-4 w-4 text-gray-400 group-hover:text-[#2dd4bf] transition-colors" />
                <span>Settings</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
            </Link>

            <Link
              href="/subscriptions"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-4 w-4 text-gray-400 group-hover:text-[#2dd4bf] transition-colors" />
                <span>Subscriptions</span>
              </div>
              <div className="flex items-center gap-1.5">
                {!isPlus && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#04564f]/30 text-[#2dd4bf]">
                    Upgrade
                  </span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-gray-600 group-hover:text-gray-400 transition-colors" />
              </div>
            </Link>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.06] my-1.5" />

          {/* Sign Out Action */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer group"
          >
            <LogOut className="h-4 w-4 text-red-400 group-hover:text-red-300 transition-colors" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
