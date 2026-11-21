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
  ExternalLink,
  LogOut,
  Search,
  Bell,
  Upload,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  CheckCircle2,
  Sliders,
  Radio,
  MessageSquare,
  Tag,
  Megaphone,
  ArrowRight,
  Crown
} from 'lucide-react';

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
  const [adminProfile, setAdminProfile] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAdminSession() {
      try {
        let session = (await supabase.auth.getSession()).data.session;

        // 1. Restore from URL hash or query params if redirected from Auth portal
        if (!session?.user && typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
          const hashParams = new URLSearchParams(window.location.hash ? window.location.hash.substring(1) : '');
          const searchParams = new URLSearchParams(window.location.search || '');
          const access_token =
            hashParams.get('access_token') ||
            searchParams.get('sb_token') ||
            searchParams.get('access_token');
          const refresh_token =
            hashParams.get('refresh_token') ||
            searchParams.get('sb_refresh') ||
            searchParams.get('refresh_token');
          if (access_token && refresh_token) {
            try {
              const { data: restored } = await supabase.auth.setSession({
                access_token,
                refresh_token
              });
              if (restored?.session?.user) {
                session = restored.session;
                const isProd = window.location.hostname.includes('cautionstudioz.com');
                const domainStr = isProd ? '; domain=.cautionstudioz.com; Secure' : '';
                document.cookie = `sb-token=${encodeURIComponent(session.access_token)}; path=/; max-age=604800; SameSite=Lax${domainStr}`;
                document.cookie = `sb-refresh=${encodeURIComponent(session.refresh_token)}; path=/; max-age=604800; SameSite=Lax${domainStr}`;
                const cleanSearch = new URLSearchParams(window.location.search);
                cleanSearch.delete('sb_token');
                cleanSearch.delete('sb_refresh');
                cleanSearch.delete('access_token');
                cleanSearch.delete('refresh_token');
                const q = cleanSearch.toString();
                window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : ''));
              }
            } catch (e) {
              console.warn('Failed restoring admin session from URL:', e);
            }
          }
        }

        // 2. Restore from shared cookie if needed
        if (!session?.user && typeof document !== 'undefined') {
          const matchToken = document.cookie.match(/(?:^|;\s*)sb-token=([^;]*)/);
          const matchRefresh = document.cookie.match(/(?:^|;\s*)sb-refresh=([^;]*)/);
          const cookieToken = matchToken ? decodeURIComponent(matchToken[1]) : null;
          const cookieRefresh = matchRefresh ? decodeURIComponent(matchRefresh[1]) : null;

          if (cookieToken && cookieRefresh) {
            try {
              const { data: restored } = await supabase.auth.setSession({
                access_token: cookieToken,
                refresh_token: cookieRefresh
              });
              if (restored?.session?.user) {
                session = restored.session;
              }
            } catch (e) {
              console.warn('Failed restoring admin session from cookie:', e);
            }
          }
        }

        if (!session || !session.user) {
          if (isMounted) router.replace('/login');
          return;
        }

        const appMeta = session.user.app_metadata || {};
        const userMeta = session.user.user_metadata || {};
        const email = (session.user.email || '').toLowerCase().trim();

        let isDbAdmin = false;
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (prof && isMounted) {
            setAdminProfile(prof);
          }

          const userRoles = prof?.roles || [];
          const handle = (prof?.handle || '').toLowerCase();

          if (
            userRoles.includes('admin') ||
            userRoles.includes('superadmin') ||
            userRoles.includes('producer') ||
            handle.includes('admin') ||
            handle === 'arakunrincole' ||
            handle === 'olajide_samuel_ojo' ||
            handle === 'jaiden'
          ) {
            isDbAdmin = true;
          }
        } catch (e) {}

        const isAdmin =
          appMeta.is_admin === true ||
          appMeta.role === 'admin' ||
          appMeta.role === 'superadmin' ||
          appMeta.role === 'producer' ||
          userMeta.is_admin === true ||
          userMeta.role === 'admin' ||
          userMeta.primary_role === 'admin' ||
          userMeta.primary_role === 'producer' ||
          email === 'admin@cautionstudioz.com' ||
          email === 'admin@caution.studio' ||
          email === 'damicoledj@gmail.com' ||
          email === 'jaidenolajide@gmail.com' ||
          email === 'cautionstudioz@gmail.com' ||
          email.endsWith('@cautionstudioz.com') ||
          email.endsWith('@caution.studio') ||
          isDbAdmin;

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setAdminUser(session.user);
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (p && isMounted) setAdminProfile(p);
      } else if (event === 'SIGNED_OUT') {
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
      if (typeof document !== 'undefined') {
        const isProd = window.location.hostname.includes('cautionstudioz.com');
        const domainStr = isProd ? '; domain=.cautionstudioz.com' : '';
        document.cookie = `sb-token=; path=/; max-age=0${domainStr}`;
        document.cookie = `sb-refresh=; path=/; max-age=0${domainStr}`;
      }
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      router.replace('/login');
    }
  };

  const navOperations = [
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
      badge: 'Live'
    },
    {
      label: 'Ads Manager',
      href: '/ads',
      icon: Megaphone,
      badge: 'Revenue'
    },
    {
      label: 'Genres & Tags',
      href: '/genres',
      icon: Tag,
      badge: null
    }
  ];

  const navManagement = [
    {
      label: 'Subscribers & Users',
      href: '/users',
      icon: Users,
      badge: null
    },
    {
      label: 'Licenses & Pricing',
      href: '/licenses',
      icon: ShieldCheck,
      badge: 'Tiers'
    },
    {
      label: 'Producer Chat',
      href: '/chat',
      icon: MessageSquare,
      badge: 'Direct'
    },
    {
      label: 'Admin Settings',
      href: '/settings',
      icon: Sliders,
      badge: null
    }
  ];

  const getBreadcrumbTitle = () => {
    if (pathname === '/tracks') return 'Master Catalog';
    if (pathname === '/genres') return 'Genre Management';
    if (pathname === '/users') return 'Subscribers & Users';
    if (pathname === '/chat') return 'Producer Support & Chat';
    if (pathname === '/licenses') return 'Licenses & Pricing';
    if (pathname === '/ads') return 'Ads Manager & Sponsored Music';
    if (pathname === '/settings') return 'Admin Settings';
    return 'Executive Dashboard';
  };

  const displayName =
    adminProfile?.display_name ||
    adminUser?.user_metadata?.full_name ||
    (adminUser?.email ? adminUser.email.split('@')[0] : 'Admin Master');
  const displayHandle =
    adminProfile?.handle ||
    adminUser?.user_metadata?.handle ||
    'admin';
  const avatarUrl =
    adminProfile?.avatar_url ||
    adminUser?.user_metadata?.avatar_url ||
    null;

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part: string) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'AD';

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 border-2 border-[#e53935] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-mono">Verifying executive credentials...</span>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0d0e12] text-gray-100 flex">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-white/[0.06] bg-[#121316] flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Workspace Brand Header */}
          <div className="h-16 border-b border-white/[0.06] px-5 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="Caution Studio"
                className="h-7 w-auto max-w-[125px] object-contain brightness-0 invert group-hover:opacity-90 transition-opacity"
              />
              <span className="bg-[#e53935]/15 text-[#ff6b67] border border-[#e53935]/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Admin
              </span>
            </Link>
            <button
              type="button"
              className="lg:hidden p-1.5 text-gray-400 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Prominent Upload Track CTA Button */}
          <div className="p-3.5 pb-2">
            <Link
              href="/tracks?upload=1"
              onClick={() => {
                if (onOpenUpload) onOpenUpload();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#e53935] hover:bg-[#d32f2f] text-white text-xs font-bold transition-all shadow-md shadow-[#e53935]/25"
            >
              <Upload className="h-4 w-4 stroke-[2.5]" />
              <span>Upload Track</span>
            </Link>
          </div>

          {/* Navigation Section */}
          <div className="flex-1 px-3 py-1 space-y-4 overflow-y-auto">
            {/* Operations */}
            <div>
              <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Studio Portal
              </div>
              <nav className="space-y-1">
                {navOperations.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#1c1e24] text-white shadow-sm border border-white/[0.08]'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? 'text-[#e53935]' : 'text-gray-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            item.badge === 'Live' || item.badge === 'Audio'
                              ? 'bg-[#e53935]/20 text-[#ff6b67] border border-[#e53935]/30'
                              : 'bg-white/[0.06] text-gray-400'
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

            {/* Management */}
            <div>
              <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Executive Control
              </div>
              <nav className="space-y-1">
                {navManagement.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#1c1e24] text-white shadow-sm border border-white/[0.08]'
                          : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? 'text-[#e53935]' : 'text-gray-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            item.badge === 'Direct'
                              ? 'bg-[#e53935] text-white'
                              : 'bg-white/[0.06] text-gray-400'
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

          {/* Quick Telemetry Status Widget */}
          <div className="p-3">
            <div className="relative rounded-2xl overflow-hidden p-3.5 border border-white/[0.06] bg-[#16181d] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  System Health
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-[11px] text-gray-300 font-medium leading-snug">
                Cloudflare R2 & Supabase Real-Time Connected
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Footer / User Profile */}
        <div className="p-3 border-t border-white/[0.06] bg-[#121316]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[#e53935] font-black">{initials}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white block truncate leading-tight">
                    {displayName}
                  </span>
                  <Crown className="h-3 w-3 text-amber-400 shrink-0" />
                </div>
                <span className="text-[10px] text-gray-400 font-mono block truncate">
                  @{displayHandle}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out of Admin Console"
              className="p-1.5 text-gray-400 hover:text-[#e53935] hover:bg-white/[0.04] rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 border-b border-white/[0.06] bg-[#0d0e12]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden p-1.5 -ml-1 text-gray-400 hover:text-white"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium truncate">
              <span>Admin Console</span>
              <ChevronRight className="h-3.5 w-3.5 text-gray-600 shrink-0" />
              <span className="text-white font-bold truncate">{getBreadcrumbTitle()}</span>
            </div>
          </div>

          {/* Center Search Input */}
          <div className="hidden md:flex items-center max-w-sm w-full mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Search catalog, producers, users..."
                className="w-full bg-[#16181d] border border-white/[0.06] rounded-xl py-1.5 pl-9 pr-3 text-xs text-gray-300 placeholder:text-gray-500 focus:outline-none focus:border-[#e53935]/50 transition-colors"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = (e.target as HTMLInputElement).value;
                    if (q.trim()) router.push(`/tracks?search=${encodeURIComponent(q.trim())}`);
                  }
                }}
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <a
              href={process.env.NEXT_PUBLIC_CREATOR_URL || 'https://creator.cautionstudioz.com'}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              <span>Creator Studio</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <a
              href={process.env.NEXT_PUBLIC_USER_URL || 'https://app.cautionstudioz.com'}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              <span>Listener App</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <div className="h-4 w-px bg-white/[0.08] hidden sm:block" />

            {/* Notification Bell */}
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-white hover:bg-white/[0.04] rounded-xl transition-colors relative"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#e53935]" />
            </button>

            {/* Upload Track Button */}
            <Link
              href="/tracks?upload=1"
              onClick={() => {
                if (onOpenUpload) onOpenUpload();
              }}
              className="inline-flex items-center gap-1.5 bg-[#e53935] hover:bg-[#d32f2f] text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md shadow-[#e53935]/25"
            >
              <Upload className="h-3.5 w-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Upload Track</span>
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
