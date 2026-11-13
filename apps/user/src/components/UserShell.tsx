'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  ListMusic,
  ShoppingBag,
  Mic,
  Megaphone,
  Heart,
  Clock,
  Calendar,
  Sparkles,
  ChevronRight,
  Search,
  Menu,
  X,
  CreditCard
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

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Activity,
      isActive: pathname === '/'
    },
    {
      label: 'Playlists',
      href: '/?tab=playlists',
      icon: ListMusic,
      isActive: pathname.includes('tab=playlists')
    },
    {
      label: 'Beat Store',
      href: '/?tab=marketplace',
      icon: ShoppingBag,
      badge: 'Store',
      badgeColor: 'bg-[#E8B896]/20 text-[#E8B896]',
      isActive: pathname.includes('tab=marketplace')
    },
    {
      label: 'Studio',
      href: '/studio',
      icon: Mic,
      isButton: true,
      isActive: pathname.startsWith('/studio')
    },
    {
      label: 'Promote Music',
      href: '/promote',
      icon: Megaphone,
      badge: 'Ads',
      badgeColor: 'bg-amber-400/20 text-amber-300',
      isActive: pathname.startsWith('/promote')
    }
  ];

  const libraryItems = [
    {
      label: 'Favourites',
      href: '/?tab=fav',
      icon: Heart,
      iconColor: 'text-red-500',
      isActive: pathname.includes('tab=fav')
    },
    {
      label: 'Listen Later',
      href: '/?tab=later',
      icon: Clock,
      iconColor: 'text-[#2dd4bf]',
      isActive: pathname.includes('tab=later')
    },
    {
      label: 'History',
      href: '/?tab=history',
      icon: Calendar,
      iconColor: 'text-[#2dd4bf]',
      isActive: pathname.includes('tab=history')
    }
  ];

  return (
    <div className="min-h-screen bg-[#111214] text-white flex flex-col font-sans selection:bg-[#04564f] selection:text-white">
      {/* 1. TOP HEADER */}
      <header className="h-14 border-b border-[#2a2d34] bg-[#16181c] px-3 sm:px-4 flex items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center shrink-0">
          <Link href="/" className="inline-flex items-center">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-6 sm:h-7 w-auto object-contain brightness-0 invert max-w-[120px] sm:max-w-[160px]"
            />
          </Link>
        </div>

        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative flex items-center w-full">
            <Search className="h-4 w-4 text-[#8b8f98] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search beats, artists, projects"
              className="w-full h-9 pl-9 pr-8 rounded-full bg-[#111214] border border-[#2a2d34] text-[13px] text-white placeholder-[#6b7078] focus:outline-none focus:border-[#4a4e57]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-[#8b8f98] hover:text-white"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <Link
            href="/studio"
            className="hidden md:inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-[#e53935] hover:bg-[#d32f2f] text-white text-[12px] font-semibold transition-colors"
          >
            <Mic className="h-3.5 w-3.5" />
            Create
          </Link>

          {/* Hamburger Menu Trigger (Mobile only) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
          </button>

          {/* User Profile Dropdown */}
          <UserDropdown />
        </div>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-14 z-50 md:hidden bg-[#16181c] border-b border-[#2a2d34] p-4 overflow-y-auto space-y-6">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by artists, songs or albums"
              className="w-full h-11 pl-10 pr-9 rounded-xl bg-[#141518] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors"
            />
          </form>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    item.isActive
                      ? 'text-white bg-white/[0.08] font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${item.isActive ? 'text-[#2dd4bf]' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${item.badgeColor || 'bg-white/10 text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div>
            <p className="text-[11px] font-medium text-[#8b8f98] px-3.5 mb-2">Library</p>
            <div className="space-y-1">
              {libraryItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-white/[0.03]"
                  >
                    <Icon className={`h-4 w-4 ${item.iconColor}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-[#2a2d34]">
            <Link
              href="/subscriptions"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs font-medium text-gray-300 hover:text-white transition-colors"
            >
              <span>Subscription Plans</span>
              <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. BODY CONTENT (2-COLUMN SPLIT: LEFT SIDEBAR + MAIN VIEW) */}
      <div className="flex-1 flex w-full">
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-56 border-r border-[#2a2d34] bg-[#16181c] px-3 py-4 shrink-0 hidden md:flex flex-col justify-between">
          <div className="space-y-6">
            {/* Primary Nav */}
            <nav className="space-y-1">
              <Link
                href="/"
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  pathname === '/'
                    ? 'text-white bg-white/[0.08] font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <Activity className={`h-4 w-4 ${pathname === '/' ? 'text-[#2bbbad]' : 'text-[#8b8f98]'}`} />
                <span>Home</span>
              </Link>

              <Link
                href="/?tab=playlists"
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  pathname.includes('tab=playlists')
                    ? 'text-white bg-white/[0.08] font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <ListMusic className="h-4 w-4 text-gray-400" />
                <span>Playlists</span>
              </Link>

              <Link
                href="/?tab=marketplace"
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  pathname.includes('tab=marketplace')
                    ? 'text-[#E8B896] bg-[#E8B896]/15 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-4 w-4 text-[#E8B896]" />
                  <span className={pathname.includes('tab=marketplace') ? 'text-[#E8B896]' : ''}>Beat Store</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#E8B896]/20 text-[#E8B896] uppercase">
                  Store
                </span>
              </Link>

              <Link
                href="/studio"
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-semibold text-white bg-[#e53935] hover:bg-[#d32f2f] transition-colors mt-2"
                title="Open Studio"
              >
                <Mic className="h-4 w-4" />
                <span>Studio</span>
              </Link>

              <Link
                href="/promote"
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors mt-2 ${
                  pathname.startsWith('/promote')
                    ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20'
                }`}
                title="Promote Your Song with Audio Ads"
              >
                <div className="flex items-center gap-2.5">
                  <Megaphone className="h-4 w-4 text-amber-400" />
                  <span>Promote Music</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 uppercase">
                  Ads
                </span>
              </Link>
            </nav>

            {/* Library Links */}
            <div>
              <p className="text-[11px] font-medium text-[#8b8f98] px-3 mb-1">Library</p>
              <div className="space-y-0.5">
                {libraryItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        item.isActive ? 'text-white bg-white/[0.04]' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${item.iconColor}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Subscriptions */}
            <div className="pt-2">
              <Link
                href="/subscriptions"
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  pathname.startsWith('/subscriptions')
                    ? 'text-[#2dd4bf] bg-[#2dd4bf]/10 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="h-4 w-4 text-[#2dd4bf]" />
                  <span>Subscription Plans</span>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-[#2a2d34] text-[10px] text-[#6b7078] px-3">
            Caution Studio
          </div>
        </aside>

        {/* MAIN VIEW CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 overflow-y-auto min-w-0 bg-[#111214]">
          {children}
        </main>
      </div>
    </div>
  );
}

