'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass,
  Music,
  Trophy,
  LayoutGrid,
  ListMusic,
  ShoppingBag,
  Heart,
  Clock,
  Megaphone,
  Sliders,
  Upload,
  Search,
  Menu,
  X,
  CreditCard,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { UserDropdown } from './UserDropdown';

interface UserShellProps {
  children: React.ReactNode;
  activePath?: string;
}

export function UserShell({ children, activePath }: UserShellProps) {
  const pathname = usePathname() || activePath || '/';
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const discoverNav = [
    {
      id: 'discover',
      label: 'Discover',
      href: '/',
      icon: Compass,
      isActive: pathname === '/'
    },
    {
      id: 'browse',
      label: 'Browse Beats',
      href: '/?tab=browse',
      icon: Music,
      isActive: pathname.includes('tab=browse')
    },
    {
      id: 'charts',
      label: 'Top Charts',
      href: '/?tab=charts',
      icon: Trophy,
      isActive: pathname.includes('tab=charts')
    },
    {
      id: 'genres',
      label: 'Genres',
      href: '/?tab=genres',
      icon: LayoutGrid,
      isActive: pathname.includes('tab=genres')
    },
    {
      id: 'playlists',
      label: 'Playlists',
      href: '/?tab=playlists',
      icon: ListMusic,
      isActive: pathname.includes('tab=playlists')
    }
  ];

  const libraryNav = [
    {
      id: 'purchased',
      label: 'Purchased',
      href: '/library',
      icon: ShoppingBag,
      isActive: pathname.startsWith('/library')
    },
    {
      id: 'favorites',
      label: 'Favorites',
      href: '/?tab=favorites',
      icon: Heart,
      isActive: pathname.includes('tab=favorites') || pathname.includes('tab=fav')
    },
    {
      id: 'history',
      label: 'Listening History',
      href: '/?tab=history',
      icon: Clock,
      isActive: pathname.includes('tab=history')
    }
  ];

  const creatorNav = [
    {
      id: 'promote',
      label: 'Promote Music',
      href: '/promote',
      icon: Megaphone,
      badge: 'Ads',
      badgeColor: 'bg-amber-400/20 text-amber-300 border border-amber-500/30',
      isActive: pathname.startsWith('/promote')
    },
    {
      id: 'studio',
      label: 'Open Studio',
      href: '/studio',
      icon: Sliders,
      badge: 'PRO',
      badgeColor: 'bg-[#e53935]/20 text-[#e53935] border border-[#e53935]/30',
      isActive: pathname.startsWith('/studio')
    }
  ];

  return (
    <div className="min-h-screen w-full bg-[#0d0e12] text-white flex flex-col font-sans selection:bg-[#e53935] selection:text-white">
      {/* 1. TOP HEADER */}
      <header className="h-16 border-b border-white/[0.06] bg-[#121316] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
        {/* Brand Logo matching updated design */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">
              Caution<span className="text-[#e53935]">.</span>
            </span>
          </Link>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="relative flex items-center w-full">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search beats, producers, genres..."
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e53935] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-white cursor-pointer"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://creator.cautionstudioz.com/beats/upload"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e53935] hover:bg-[#d32f2f] text-white text-xs font-bold transition-all shadow-md shadow-[#e53935]/25 hover:scale-[1.02]"
          >
            <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Upload</span>
          </a>

          {/* User Profile Dropdown */}
          <UserDropdown />

          {/* Hamburger Menu Trigger (Mobile only) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
          </button>
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 md:hidden bg-[#121316] border-b border-white/[0.06] p-4 overflow-y-auto space-y-6">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search beats, producers, genres..."
              className="w-full h-11 pl-10 pr-9 rounded-xl bg-[#0d0e12] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e53935] transition-colors"
            />
          </form>

          {/* Discover Section */}
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">Discover</p>
            <nav className="space-y-1">
              {discoverNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      item.isActive
                        ? 'bg-[#e53935] text-white shadow-md shadow-red-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Collection / Library Section */}
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">Library</p>
            <nav className="space-y-1">
              {libraryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      item.isActive
                        ? 'bg-[#e53935] text-white shadow-md shadow-red-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Creator Section */}
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">Creator</p>
            <nav className="space-y-1">
              {creatorNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      item.isActive
                        ? 'bg-[#e53935] text-white shadow-md shadow-red-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <Link
              href="/subscriptions"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-gray-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-4 w-4 text-[#e53935]" />
                <span>Subscription Plans</span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. BODY CONTENT (FIXED LEFT SIDEBAR + SCROLLABLE MAIN CONTENT) */}
      <div className="flex-1 flex w-full relative">
        {/* FIXED LEFT NAVIGATION SIDEBAR */}
        <aside className="fixed top-16 bottom-0 left-0 w-60 border-r border-white/[0.06] bg-[#121316] p-4 shrink-0 hidden md:flex flex-col justify-between overflow-y-auto pb-12 z-20">
          <div className="space-y-6">
            {/* Discover Section */}
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
                Discover
              </p>
              <nav className="space-y-1">
                {discoverNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        item.isActive
                          ? 'bg-[#e53935] text-white shadow-md shadow-red-500/20'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Collection / Library Section */}
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
                Library
              </p>
              <nav className="space-y-1">
                {libraryNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        item.isActive
                          ? 'bg-[#e53935] text-white shadow-md shadow-red-500/20'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Creator Section */}
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider px-3 mb-2">
                Creator
              </p>
              <nav className="space-y-1">
                {creatorNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        item.isActive
                          ? 'bg-[#e53935] text-white shadow-md shadow-red-500/20'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                <a
                  href="https://creator.cautionstudioz.com/beats/upload"
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Beat</span>
                </a>
              </nav>
            </div>
          </div>

          {/* Sell Your Beats Promo Card at Bottom of Sidebar */}
          <div className="pt-4 border-t border-white/[0.06]">
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#16181d] p-3.5 shadow-lg group">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              <div className="relative z-10 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#e53935]">
                  Creator Studio
                </span>
                <p className="text-xs font-bold text-white leading-tight">
                  Sell your beats worldwide
                </p>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Keep 80% on all license buyouts with direct Paystack transfers.
                </p>
                <a
                  href="https://creator.cautionstudioz.com"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#e53935] hover:text-red-400 pt-1 group-hover:underline"
                >
                  <span>Open Creator Studio</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </aside>

        {/* SCROLLABLE MAIN VIEW */}
        <main className="flex-1 md:pl-60 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
