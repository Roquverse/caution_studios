'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import {
  LayoutDashboard,
  Music2,
  ShieldCheck,
  Users,
  Database,
  ExternalLink,
  LogOut,
  Search,
  Bell,
  Plus,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Command,
  CheckCircle2,
  Sliders,
  Flame,
  Radio,
  Tag,
  Megaphone
} from 'lucide-react';
import { Avatar } from '@caution/ui';

interface AdminShellProps {
  children: React.ReactNode;
  activePath?: string;
  onOpenUpload?: () => void;
}

export function AdminShell({ children, activePath, onOpenUpload }: AdminShellProps) {
  const pathname = usePathname() || activePath || '/';
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAdminSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
          if (isMounted) router.replace('/login');
          return;
        }

        const appMeta = session.user.app_metadata || {};
        const isAdmin =
          appMeta.is_admin === true ||
          appMeta.role === 'admin' ||
          appMeta.role === 'superadmin' ||
          session.user.email === 'admin@cautionstudioz.com' ||
          session.user.email === 'admin@caution.studio' ||
          session.user.email === 'damicoledj@gmail.com';

        if (!isAdmin) {
          await supabase.auth.signOut();
          if (isMounted) router.replace('/login?error=unauthorized');
          return;
        }

        if (isMounted) {
          setAdminUser(session.user);
          setCheckingAuth(false);
        }
      } catch (err) {
        console.error('Error verifying admin session:', err);
        if (isMounted) router.replace('/login');
      }
    }

    checkAdminSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      router.replace('/login');
    }
  };

  const navItems = [
    {
      label: 'Overview',
      href: '/',
      icon: LayoutDashboard,
      badge: null
    },
    {
      label: 'Master Catalog',
      href: '/tracks',
      icon: Music2,
      badge: 'Audio'
    },
    {
      label: 'Genres',
      href: '/genres',
      icon: Tag,
      badge: null
    },
    {
      label: 'Subscribers & Users',
      href: '/users',
      icon: Users,
      badge: null
    },
    {
      label: 'Licenses',
      href: '/licenses',
      icon: ShieldCheck,
      badge: 'Live'
    },
    {
      label: 'Ads Manager',
      href: '/ads',
      icon: Megaphone,
      badge: 'Revenue'
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Sliders,
      badge: null
    }
  ];

  const getBreadcrumbTitle = () => {
    if (pathname === '/tracks') return 'Master Catalog';
    if (pathname === '/genres') return 'Genre Management';
    if (pathname === '/users') return 'Subscribers & Users';
    if (pathname === '/licenses') return 'Licenses';
    if (pathname === '/ads') return 'Ads Manager & Sponsored Music';
    if (pathname === '/settings') return 'Admin Settings';
    return 'Dashboard';
  };

  const displayName = adminUser?.user_metadata?.full_name || (adminUser?.email ? adminUser.email.split('@')[0] : 'Admin Master');
  const displayEmail = adminUser?.email || 'admin@cautionstudioz.com';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part: string) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AD';

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-100 selection:bg-[#2dd4bf] selection:text-black">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logo.png"
            alt="Caution Studio"
            className="h-8 w-auto max-w-[150px] object-contain brightness-0 invert opacity-80 animate-pulse"
          />
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2dd4bf] animate-ping" />
            <span>Verifying executive clearance...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-zinc-800 bg-[#0c0d10] flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="h-14 border-b border-zinc-800 px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-7 w-auto max-w-[120px] object-contain brightness-0 invert group-hover:opacity-90 transition-opacity"
            />
            <span className="bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/30 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
              Admin
            </span>
          </Link>
          <button
            type="button"
            className="lg:hidden p-1.5 text-zinc-400 hover:text-white"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Search Trigger */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              readOnly
              placeholder="Search admin... (⌘K)"
              className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-md py-1.5 pl-8 pr-3 text-xs text-zinc-400 placeholder:text-zinc-600 focus:outline-none cursor-pointer hover:border-zinc-700"
            />
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-2 space-y-6 overflow-y-auto">
          <div>
            <div className="px-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Platform
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-zinc-800/90 text-white font-semibold shadow-xs border border-zinc-700/60'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 ${
                          isActive ? 'text-[#2dd4bf]' : 'text-zinc-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          isActive
                            ? 'bg-[#2dd4bf]/20 text-[#2dd4bf]'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer / User Profile */}
        <div className="p-3 border-t border-zinc-800 bg-[#0c0d10]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-[#2dd4bf] shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-white block truncate leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] text-zinc-400 block truncate">
                  {displayEmail}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out of Admin Console"
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 rounded transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-14 border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-1.5 -ml-1 text-zinc-400 hover:text-white"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              <span>Admin</span>
              <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
              <span className="text-white font-semibold">{getBreadcrumbTitle()}</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            <a
              href={process.env.NEXT_PUBLIC_WEB_URL || 'https://cautionstudioz.com'}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded transition-colors"
            >
              <span>Landing</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <a
              href={process.env.NEXT_PUBLIC_USER_URL || 'https://app.cautionstudioz.com'}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded transition-colors"
            >
              <span>User Portal</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <a
              href={process.env.NEXT_PUBLIC_CREATOR_URL || 'https://creator.cautionstudioz.com'}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded transition-colors"
            >
              <span>Creator Studio</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

            <Link
              href="/tracks"
              className="inline-flex items-center gap-1.5 bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-semibold text-xs px-3 py-1.5 rounded-md transition-colors shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Upload Track</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
