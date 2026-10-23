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
  Upload
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

        // Restore from cookie if needed
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
      label: 'Earnings & Payouts',
      href: '/payouts',
      icon: DollarSign,
      badge: 'Paystack'
    },
    {
      label: 'Streaming & Verification',
      href: '/streaming',
      icon: Activity,
      badge: 'Promo'
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
    if (pathname === '/streaming') return 'Streaming Royalties & Verification';
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
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-zinc-500 font-mono">Verifying producer credentials...</span>
        </div>
      </div>
    );
  }

  if (!creatorUser) {
    return null;
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
              Creator
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

        {/* Promo Telemetry Tag */}
        <div className="p-3">
          <div className="p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center gap-2.5">
            <div className="p-1 rounded bg-amber-500/20 text-amber-300 shrink-0">
              <Gift className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-amber-200 block truncate">
                3 Months Free Promo
              </span>
              <span className="text-[10px] text-amber-400/80 block">
                78 days left · 80% keep rate
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-1 space-y-6 overflow-y-auto">
          <div>
            <div className="px-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
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
              <div className="h-8 w-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-[#2dd4bf] shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-white block truncate leading-tight">
                    {displayName}
                  </span>
                  {isVerifiedProducer && (
                    <ShieldCheck className="h-3 w-3 text-[#2dd4bf] shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 block truncate">
                  @{displayHandle}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out of Creator Studio"
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
              <span>Creator Studio</span>
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
              <span>Main Site</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <a
              href={process.env.NEXT_PUBLIC_USER_URL || 'https://app.cautionstudioz.com'}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded transition-colors"
            >
              <span>Listener App</span>
              <ExternalLink className="h-3 w-3" />
            </a>

            <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

            <Link
              href="/beats/upload"
              className="inline-flex items-center gap-1.5 bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-semibold text-xs px-3 py-1.5 rounded-md transition-colors shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Upload Beat</span>
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
