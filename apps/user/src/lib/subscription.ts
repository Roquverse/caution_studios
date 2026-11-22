'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export const FREE_PREVIEW_LIMIT_SECONDS = 30;

export function isPlanSubscribed(plan?: string | null): boolean {
  if (!plan) return false;
  const normalized = plan.toLowerCase().trim();
  if (normalized === 'free' || normalized === 'expired' || normalized === 'unsubscribed' || normalized === 'none') {
    return false;
  }
  return normalized === 'plus' || normalized === 'pro' || normalized === 'creator' || normalized === 'label';
}

export function resolveEffectivePlan(
  profile?: { plan?: string | null; stripe_customer_id?: string | null; subscription_expires_at?: string | null } | null,
  userMetadata?: Record<string, any> | null
): 'unsubscribed' | 'plus' | 'pro' {
  // If subscription has expired, it is no longer active
  if (profile?.subscription_expires_at) {
    const expiresAt = new Date(profile.subscription_expires_at).getTime();
    if (!isNaN(expiresAt) && expiresAt < Date.now()) {
      return 'unsubscribed';
    }
  }

  if (
    profile?.plan === 'pro' ||
    profile?.stripe_customer_id === 'plan:pro' ||
    userMetadata?.plan === 'pro'
  ) {
    return 'pro';
  }
  if (
    profile?.plan === 'plus' ||
    profile?.stripe_customer_id === 'plan:plus' ||
    userMetadata?.plan === 'plus'
  ) {
    return 'plus';
  }
  return 'unsubscribed';
}

export function getCachedUserPlan(): string {
  if (typeof window === 'undefined') return 'unsubscribed';
  const cached = localStorage.getItem('caution:user-plan');
  if (!cached || cached === 'free') return 'unsubscribed';
  return cached;
}

export function setCachedUserPlan(plan: string) {
  if (typeof window === 'undefined') return;
  const normalized = (!plan || plan === 'free') ? 'unsubscribed' : plan;
  localStorage.setItem('caution:user-plan', normalized);
  window.dispatchEvent(new CustomEvent('caution:plan-changed', { detail: { plan: normalized } }));
}

export function useUserSubscription() {
  const [plan, setPlan] = useState<string>('unsubscribed');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const cachedPlan = typeof window !== 'undefined' ? getCachedUserPlan() : 'unsubscribed';
    setPlan(cachedPlan);
    setIsSubscribed(isPlanSubscribed(cachedPlan));

    async function checkSubscription() {
      try {
        let session = (await supabase.auth.getSession()).data.session;

        // If not in localStorage, check shared root-domain/localhost cookies
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
              console.warn('Failed restoring session from cookie in apps/user:', e);
            }
          }
        }

        if (!session?.user) {
          if (isMounted) {
            setPlan('unsubscribed');
            setIsSubscribed(false);
            if (typeof window !== 'undefined') {
              localStorage.setItem('caution:user-plan', 'unsubscribed');
            }
            setIsLoading(false);
          }
          return;
        }

        // Keep session cookie synchronized across domains
        if (typeof document !== 'undefined' && session) {
          const isProd = window.location.hostname.includes('cautionstudioz.com');
          const domainStr = isProd ? '; domain=.cautionstudioz.com' : '';
          document.cookie = `sb-token=${session.access_token}; path=/; max-age=604800; SameSite=Lax${domainStr}`;
          document.cookie = `sb-refresh=${session.refresh_token}; path=/; max-age=604800; SameSite=Lax${domainStr}`;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('plan, stripe_customer_id, subscription_expires_at')
          .eq('id', session.user.id)
          .maybeSingle();

        const currentPlan = resolveEffectivePlan(profile, session.user.user_metadata);
        if (isMounted) {
          setPlan(currentPlan);
          setIsSubscribed(isPlanSubscribed(currentPlan));
          if (typeof window !== 'undefined') {
            localStorage.setItem('caution:user-plan', currentPlan);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error checking user subscription:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    checkSubscription();

    const handlePlanChanged = (e: any) => {
      const newPlan = e.detail?.plan || 'unsubscribed';
      setPlan(newPlan);
      setIsSubscribed(isPlanSubscribed(newPlan));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('caution:plan-changed', handlePlanChanged);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setPlan('unsubscribed');
        setIsSubscribed(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('caution:user-plan', 'unsubscribed');
        }
      } else {
        checkSubscription();
      }
    });

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('caution:plan-changed', handlePlanChanged);
      }
      subscription.unsubscribe();
    };
  }, []);

  return {
    plan,
    isSubscribed,
    isLoading,
    previewLimitSeconds: FREE_PREVIEW_LIMIT_SECONDS
  };
}
