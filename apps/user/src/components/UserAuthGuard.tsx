'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// Capture URL tokens immediately when script loads before GoTrueClient can clear window.location.hash
const initialUrlTokens: { access_token: string | null; refresh_token: string | null } = (() => {
  if (typeof window === 'undefined') {
    return { access_token: null, refresh_token: null };
  }
  const hashParams = new URLSearchParams(window.location.hash ? window.location.hash.substring(1) : '');
  const searchParams = new URLSearchParams(window.location.search || '');
  return {
    access_token:
      hashParams.get('access_token') ||
      searchParams.get('sb_token') ||
      searchParams.get('access_token') ||
      null,
    refresh_token:
      hashParams.get('refresh_token') ||
      searchParams.get('sb_refresh') ||
      searchParams.get('refresh_token') ||
      null
  };
})();

function getAuthLoginRedirectUrl(): string {
  const authBase =
    process.env.NEXT_PUBLIC_AUTH_URL ||
    (typeof window !== 'undefined' && window.location.hostname.includes('cautionstudioz.com')
      ? 'https://auth.cautionstudioz.com'
      : 'http://localhost:3001');

  if (typeof window !== 'undefined') {
    const cleanSearch = new URLSearchParams(window.location.search);
    cleanSearch.delete('sb_token');
    cleanSearch.delete('sb_refresh');
    cleanSearch.delete('access_token');
    cleanSearch.delete('refresh_token');
    const queryStr = cleanSearch.toString();
    const currentUrl =
      window.location.origin + window.location.pathname + (queryStr ? `?${queryStr}` : '');
    return `${authBase.replace(/\/$/, '')}/login?redirect=${encodeURIComponent(currentUrl)}`;
  }
  return `${authBase.replace(/\/$/, '')}/login`;
}

function persistAuthCookies(accessToken: string, refreshToken: string) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const isProd = window.location.hostname.includes('cautionstudioz.com');
  const domainStr = isProd ? '; domain=.cautionstudioz.com; Secure' : '';
  document.cookie = `sb-token=${encodeURIComponent(accessToken)}; path=/; max-age=604800; SameSite=Lax${domainStr}`;
  document.cookie = `sb-refresh=${encodeURIComponent(refreshToken)}; path=/; max-age=604800; SameSite=Lax${domainStr}`;
}

function cleanAuthUrlParams() {
  if (typeof window === 'undefined') return;
  const cleanSearch = new URLSearchParams(window.location.search);
  cleanSearch.delete('sb_token');
  cleanSearch.delete('sb_refresh');
  cleanSearch.delete('access_token');
  cleanSearch.delete('refresh_token');
  const queryStr = cleanSearch.toString();
  const nextUrl = window.location.pathname + (queryStr ? `?${queryStr}` : '');
  window.history.replaceState(null, '', nextUrl);
}

export function UserAuthGuard({ children }: { children: React.ReactNode }) {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyUserSession() {
      try {
        let session = (await supabase.auth.getSession()).data.session;

        // 1. Restore session from URL hash / query params (or captured initialUrlTokens)
        if (!session?.user && typeof window !== 'undefined') {
          const hashParams = new URLSearchParams(
            window.location.hash ? window.location.hash.substring(1) : ''
          );
          const searchParams = new URLSearchParams(window.location.search || '');
          const access_token =
            hashParams.get('access_token') ||
            searchParams.get('sb_token') ||
            searchParams.get('access_token') ||
            initialUrlTokens.access_token;
          const refresh_token =
            hashParams.get('refresh_token') ||
            searchParams.get('sb_refresh') ||
            searchParams.get('refresh_token') ||
            initialUrlTokens.refresh_token;

          if (access_token && refresh_token) {
            // Clear captured tokens so they are only consumed once
            initialUrlTokens.access_token = null;
            initialUrlTokens.refresh_token = null;
            try {
              const { data: restored } = await supabase.auth.setSession({
                access_token,
                refresh_token
              });
              if (restored?.session?.user) {
                session = restored.session;
                persistAuthCookies(session.access_token, session.refresh_token);
                cleanAuthUrlParams();
              }
            } catch (e) {
              console.warn('Failed restoring user session from URL tokens:', e);
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
                persistAuthCookies(session.access_token, session.refresh_token);
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
          persistAuthCookies(session.access_token, session.refresh_token);
          cleanAuthUrlParams();
          if (isMounted) {
            setIsAuthenticated(true);
            setCheckingAuth(false);
          }
          return;
        }

        // Unauthenticated -> redirect to Auth portal login
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
      if (session?.user && isMounted) {
        persistAuthCookies(session.access_token, session.refresh_token);
        setIsAuthenticated(true);
        setCheckingAuth(false);
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setIsAuthenticated(false);
        }
        if (typeof window !== 'undefined') {
          window.location.replace(getAuthLoginRedirectUrl());
        }
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

