'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

function getAuthLoginRedirectUrl(): string {
  const authBase =
    process.env.NEXT_PUBLIC_AUTH_URL ||
    (typeof window !== 'undefined' && window.location.hostname.includes('cautionstudioz.com')
      ? 'https://auth.cautionstudioz.com'
      : 'http://localhost:3001');

  if (typeof window !== 'undefined') {
    const currentUrl = window.location.origin + window.location.pathname + window.location.search;
    return `${authBase.replace(/\/$/, '')}/login?redirect=${encodeURIComponent(currentUrl)}`;
  }
  return `${authBase.replace(/\/$/, '')}/login`;
}

export function UserAuthGuard({ children }: { children: React.ReactNode }) {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyUserSession() {
      try {
        let session = (await supabase.auth.getSession()).data.session;

        // 1. Restore session from URL hash if redirected from Auth portal (#access_token=...&refresh_token=...)
        if (!session?.user && typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');
          if (access_token && refresh_token) {
            try {
              const { data: restored } = await supabase.auth.setSession({
                access_token,
                refresh_token
              });
              if (restored?.session?.user) {
                session = restored.session;
                const isProd = window.location.hostname.includes('cautionstudioz.com');
                const domainStr = isProd ? '; domain=.cautionstudioz.com' : '';
                document.cookie = `sb-token=${session.access_token}; path=/; max-age=604800; SameSite=Lax${domainStr}`;
                document.cookie = `sb-refresh=${session.refresh_token}; path=/; max-age=604800; SameSite=Lax${domainStr}`;
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
              }
            } catch (e) {
              console.warn('Failed restoring user session from hash:', e);
            }
          }
        }

        // 2. Restore session from shared cookies (sb-token / sb-refresh)
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
              console.warn('Failed restoring user session from cookie:', e);
            }
          }
        }

        // 3. Server-side token check fallback
        if (!session?.user) {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            session = (await supabase.auth.getSession()).data.session;
          }
        }

        if (session?.user) {
          if (isMounted) {
            setIsAuthenticated(true);
            setCheckingAuth(false);
          }
          return;
        }

        // Unauthenticated -> redirect immediately to Auth portal login
        if (typeof window !== 'undefined') {
          window.location.replace(getAuthLoginRedirectUrl());
        }
      } catch (err) {
        console.error('Error verifying user session:', err);
        if (typeof window !== 'undefined') {
          window.location.replace(getAuthLoginRedirectUrl());
        }
      }
    }

    verifyUserSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        if (isMounted) {
          setIsAuthenticated(false);
        }
        if (typeof window !== 'undefined') {
          window.location.replace(getAuthLoginRedirectUrl());
        }
      } else if (session?.user && isMounted) {
        setIsAuthenticated(true);
        setCheckingAuth(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checkingAuth || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#111214] text-[#eceef2] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-[#8b8f98] font-mono">Verifying studio session...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

