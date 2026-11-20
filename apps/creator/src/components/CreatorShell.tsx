'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import {
  LayoutDashboard,
  Music2,
  DollarSign,
  Activity,
  ShieldCheck,
  MessageSquare,
  Sliders,
  ExternalLink,
  LogOut,
  Search,
  Plus,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Gift,
  CheckCircle2,
  Upload,
  Download,
  Megaphone,
  Bell,
  ArrowRight
} from 'lucide-react';

interface CreatorShellProps {
  children: React.ReactNode;
  activePath?: string;
}

export function CreatorShell({ children, activePath }: CreatorShellProps) {
  const pathname = usePathname() || activePath || '/';
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [creatorUser, setCreatorUser] = useState<any>(null);
  const [producerProfile, setProducerProfile] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkCreatorSession() {
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
              console.warn('Failed restoring creator session from URL:', e);
            }
          }
        }

        // 2. Restore from cookie if needed
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
              console.warn('Failed restoring creator session from cookie:', e);
            }
          }
        }

        if (session?.user) {
          // Verify user role
          const meta = session.user.user_metadata || {};
          const primaryRole = meta.primary_role || meta.role;
          const userRoles: string[] = Array.isArray(meta.roles) ? meta.roles : (primaryRole ? [primaryRole] : []);
          let isAllowed =
            primaryRole === 'producer' ||
            userRoles.includes('producer') ||
            primaryRole === 'admin' ||
            userRoles.includes('admin') ||
            session.user.email?.toLowerCase().includes('admin') ||
            session.user.email?.toLowerCase().includes('producer');

          // Always fetch full profile from DB
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile && isMounted) {
            setProducerProfile(profile);
          }

          if (!isAllowed) {
            const isDbAllowed =
              profile?.primary_role === 'producer' ||
              profile?.primary_role === 'admin' ||
              (profile?.roles && (profile.roles.includes('producer') || profile.roles.includes('admin')));

            if (!isDbAllowed) {
              await supabase.auth.signOut();
              router.replace('/login?error=artist_restricted');
              return;
            }
          }

          if (isMounted) setCreatorUser(session.user);
        } else {
          router.replace('/login');
          return;
        }
      } catch (err) {
        console.error('Error verifying creator session:', err);
      } finally {
        if (isMounted) setCheckingAuth(false);
      }
    }

    checkCreatorSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCreatorUser(session.user);
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        if (p && isMounted) setProducerProfile(p);
      } else if (event === 'SIGNED_OUT') {
        setCreatorUser(null);
        setProducerProfile(null);
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

  const navItems = [
    {
      label: 'Overview',
      href: '/',
      icon: LayoutDashboard,
      badge: null
    },
    {
      label: 'Beat Catalog',
      href: '/beats',
      icon: Music2,
      badge: 'Live'
    },
    {
      label: 'Promote Beats',
      href: '/promote',
      icon: Megaphone,
      badge: 'Ads'
    },
    {
      label: 'Earnings & Payouts',
      href: '/payouts',
      icon: DollarSign,
      badge: 'Paystack'
    },
    {
      label: 'Downloads & Rewards',
      href: '/streaming',
      icon: Download,
      badge: '10k Goal'
    },
    {
      label: 'Licenses & Sales',
      href: '/licenses',
      icon: ShieldCheck,
      badge: null
    },
    {
      label: 'Studio Chat',
      href: '/chat',
      icon: MessageSquare,
      badge: 'Direct'
    },
    {
      label: 'Creator Settings',
      href: '/settings',
      icon: Sliders,
      badge: null
    }
  ];

  const getBreadcrumbTitle = () => {
    if (pathname === '/beats' || pathname.startsWith('/beats/')) return 'Beat Catalog';
    if (pathname === '/payouts') return 'Earnings & Paystack Payouts';
    if (pathname === '/streaming') return 'Downloads & Verification';
    if (pathname === '/licenses') return 'Licenses & Clearances';
    if (pathname === '/chat') return 'Studio Artist Collaboration Chat';
    if (pathname === '/settings') return 'Creator Studio Settings';
    return 'Creator Dashboard';
  };

  const displayName = producerProfile?.display_name || 
    creatorUser?.user_metadata?.full_name || 
    (creatorUser?.email ? creatorUser.email.split('@')[0] : 'Caution Producer');
  const displayHandle = producerProfile?.handle || creatorUser?.user_metadata?.handle || 'producer';
  const avatarUrl = producerProfile?.avatar_url || creatorUser?.user_metadata?.avatar_url || null;
  const isVerifiedProducer = Boolean(producerProfile?.is_verified);
  
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part: string) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'CR';

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 border-2 border-[#e53935] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500 font-mono">Verifying producer credentials...</span>
        </div>
      </div>
    );
  }

  if (!creatorUser) {
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
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src="/logo.png"
                alt="Caution Studio"
                className="h-7 w-auto max-w-[125px] object-contain brightness-0 invert group-hover:opacity-90 transition-opacity"
              />
            </Link>
            <button
              type="button"
              className="lg:hidden p-1.5 text-gray-400 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Prominent Upload Beat Button */}
          <div className="p-3.5 pb-2">
            <Link
              href="/beats/upload"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#e53935] hover:bg-[#d32f2f] text-white text-xs font-bold transition-all shadow-md shadow-[#e53935]/25"
            >
              <Upload className="h-4 w-4 stroke-[2.5]" />
              <span>Upload Beat</span>
            </Link>
          </div>

          {/* Navigation Section */}
          <div className="flex-1 px-3 py-1 space-y-4 overflow-y-auto">
            <div>
              <div className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Studio Portal
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
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
                            item.badge === 'Live'
                              ? 'bg-[#e53935]/20 text-[#ff6b67] border border-[#e53935]/30'
                              : item.badge === '3' || item.badge === 'Direct'
                              ? 'bg-[#e53935] text-white min-w-[18px] text-center'
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

          {/* Producer Promotion Card */}
          <div className="p-3">
            <div className="relative rounded-2xl overflow-hidden p-4 border border-white/[0.06] bg-[#16181d] space-y-2 group">
              <img
                src="/images/african_producer_beats.jpg"
                alt="Studio Producer"
                className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e12] via-[#0d0e12]/80 to-transparent" />
              <div className="relative z-10 space-y-1.5">
                <h3 className="text-xs font-black text-white leading-tight">Grow your sales</h3>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Promote your beats to millions of artists.
                </p>
                <div className="pt-1">
                  <Link
                    href="/promote"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white hover:text-[#e53935] transition-colors"
                  >
                    <span>Go to Promotion</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
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
                  {isVerifiedProducer && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-gray-400 font-mono block truncate">
                  @{displayHandle}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out of Creator Studio"
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
        <header className="sticky top-0 z-30 h-16 border-b border-white/[0.06] bg-[#121316]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-1.5 -ml-1 text-gray-400 hover:text-white"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
              <span>Creator Studio</span>
              <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
              <span className="text-white font-semibold">{getBreadcrumbTitle()}</span>
            </div>
          </div>

          {/* Global Search in Header */}
          <div className="flex-1 max-w-xl mx-4 hidden md:block">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search beats, producers, genres..."
                className="w-full bg-[#181a20] border border-white/[0.06] rounded-xl py-2 pl-9 pr-3 text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <a
              href={process.env.NEXT_PUBLIC_WEB_URL || 'https://cautionstudioz.com'}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1 rounded transition-colors"
            >
              <span>Main Site</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <a
              href={process.env.NEXT_PUBLIC_USER_URL || 'https://app.cautionstudioz.com'}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1 rounded transition-colors"
            >
              <span>Listener App</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            {/* Notifications Bell */}
            <button
              type="button"
              title="Notifications"
              className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#e53935]" />
            </button>

            {/* Profile Avatar with Live Status Indicator */}
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[#e53935] font-black">{initials}</span>
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#121316]" />
            </div>

            <Link
              href="/beats/upload"
              className="inline-flex sm:hidden items-center gap-1.5 bg-[#e53935] hover:bg-[#d32f2f] text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Upload</span>
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
