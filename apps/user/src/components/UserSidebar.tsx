'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Compass,
  Music,
  Trophy,
  LayoutGrid,
  ListMusic,
  ShoppingBag,
  Heart,
  Clock,
  Sliders,
  Megaphone,
  Settings,
  ChevronDown,
  CreditCard
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export interface UserSidebarProps {
  activeNav?: string;
  onNavigate?: (navId: string) => void;
  favoritesCount?: number;
  onOpenStudio?: () => void;
  userProfile?: { name: string; avatar: string };
  onItemClick?: () => void;
  className?: string;
}

export function UserSidebar({
  activeNav = 'discover',
  onNavigate,
  favoritesCount = 0,
  onOpenStudio,
  userProfile: propUserProfile,
  onItemClick,
  className = ''
}: UserSidebarProps) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const [internalProfile, setInternalProfile] = useState<{
    name: string;
    avatar: string;
    subLabel?: string;
  }>({
    name: 'Holy',
    avatar: '/images/artist_studio_mic.jpg',
    subLabel: 'Creator Account'
  });

  const effectiveProfile = propUserProfile ? { ...propUserProfile, subLabel: 'Creator Account' } : internalProfile;

  useEffect(() => {
    if (propUserProfile) return;
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: p } = await supabase
            .from('profiles')
            .select('display_name, handle, avatar_url, plan, period_resets_at, created_at')
            .eq('id', session.user.id)
            .maybeSingle();

          if (p) {
            let subLabel = 'Creator Account';
            const plan = p.plan?.toLowerCase() || '';
            if (plan === 'plus' || plan === 'pro') {
              const resetTime = p.period_resets_at
                ? new Date(p.period_resets_at).getTime()
                : new Date(p.created_at).getTime() + 30 * 24 * 60 * 60 * 1000;
              const days = Math.max(0, Math.ceil((resetTime - Date.now()) / (1000 * 60 * 60 * 24)));
              const tierName = plan === 'pro' ? 'Caution Pro' : 'Caution Plus';
              subLabel = `${tierName} • ${days}d left`;
            }

            setInternalProfile({
              name: p.display_name || p.handle || session.user.email?.split('@')[0] || 'Holy',
              avatar: p.avatar_url || '/images/artist_studio_mic.jpg',
              subLabel
            });
          }
        }
      } catch (e) {
        console.warn('UserSidebar profile fetch error:', e);
      }
    }
    loadProfile();
  }, [propUserProfile]);

  const discoverItems = [
    { id: 'discover', label: 'Discover', icon: Compass, href: '/' },
    { id: 'browse', label: 'Browse Beats', icon: Music, href: '/?tab=browse' },
    { id: 'charts', label: 'Top Charts', icon: Trophy, href: '/?tab=charts' },
    { id: 'genres', label: 'Genres', icon: LayoutGrid, href: '/?tab=genres' },
    { id: 'playlists', label: 'Playlists', icon: ListMusic, href: '/?tab=playlists' }
  ];

  const libraryItems = [
    { id: 'purchased', label: 'Purchased', icon: ShoppingBag, href: '/library' },
    { id: 'fav', label: 'Favorites', icon: Heart, href: '/?tab=favorites' },
    { id: 'history', label: 'Listening History', icon: Clock, href: '/?tab=history' },
    { id: 'subscriptions', label: 'Subscription Plans', icon: CreditCard, href: '/subscriptions' }
  ];

  const creatorItems = [
    { id: 'promote', label: 'Promote Music', icon: Megaphone, href: '/promote', badge: 'ADS' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' }
  ];

  const handleItemClick = (id: string, href: string) => {
    onItemClick?.();

    // If target is a dedicated standalone route, always push route directly
    const isDedicatedRoute = !href.startsWith('/?') && href !== '/';
    if (isDedicatedRoute) {
      router.push(href);
      return;
    }

    // If currently on another page (not '/'), navigating to / or /?tab=... must push URL
    if (pathname !== '/') {
      router.push(href);
      return;
    }

    // If we're on the home page ('/'):
    if (onNavigate) {
      onNavigate(id);
    } else {
      router.push(href);
    }
  };

  const handleStudioClick = () => {
    onItemClick?.();
    if (onOpenStudio) {
      onOpenStudio();
    } else {
      router.push('/studio');
    }
  };

  return (
    <aside
      className={`w-60 border-r border-white/[0.06] bg-[#121316] p-4 shrink-0 hidden md:flex flex-col justify-between h-full overflow-y-auto pb-6 select-none ${className}`}
    >
      <div className="space-y-5">
        {/* Discover Section */}
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
            Discover
          </p>
          <nav className="space-y-1">
            {discoverItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id || (item.id === 'discover' && activeNav === 'feed');
              return (
                <button
                  key={'left-nav-' + item.id}
                  type="button"
                  onClick={() => handleItemClick(item.id, item.href)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#e53935] text-white shadow-md shadow-red-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Collection / Library Section */}
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
            Library
          </p>
          <div className="space-y-1">
            {libraryItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id || (item.id === 'fav' && activeNav === 'favorites');
              const isFav = item.id === 'fav';
              const isPurchased = item.id === 'purchased';

              return (
                <button
                  key={'left-nav-' + item.id}
                  type="button"
                  onClick={() => handleItemClick(item.id, item.href)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#e53935] text-white shadow-md shadow-red-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : isPurchased ? 'text-[#e53935]' : isFav ? 'text-red-500' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isFav && favoritesCount > 0 && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-white'}`}>
                      {favoritesCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Creator Section */}
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
            Creator
          </p>
          <div className="space-y-1">
            {creatorItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;

              return (
                <button
                  key={'left-nav-' + item.id}
                  type="button"
                  onClick={() => handleItemClick(item.id, item.href)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#e53935] text-white shadow-md shadow-red-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded tracking-wider ${isActive ? 'bg-black/30 text-white' : 'bg-[#e53935]/20 text-[#e53935]'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Creator / Studio & Bottom Profile */}
      <div className="pt-4 border-t border-white/[0.06] space-y-3">
        <button
          type="button"
          onClick={handleStudioClick}
          className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] transition-all cursor-pointer"
          title="Open Studio DAW"
        >
          <Sliders className="h-4 w-4 text-[#e53935]" />
          <span>Open Studio</span>
        </button>

        {/* Profile Row */}
        <Link
          href="/profile"
          className="flex items-center justify-between px-2 pt-1 hover:bg-white/[0.03] rounded-xl p-1.5 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-black border border-white/10 shrink-0">
              <img
                src={effectiveProfile.avatar}
                alt={effectiveProfile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{effectiveProfile.name}</p>
              <p className="text-[10px] text-gray-400 font-mono truncate">{effectiveProfile.subLabel || 'Creator Account'}</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Link>
      </div>
    </aside>
  );
}
