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

export interface SubscriptionCountdown {
  daysRemaining: number;
  totalDays: number;
  percentRemaining: number;
  formattedResetDate: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export function getSubscriptionDaysRemaining(
  profile?: { period_resets_at?: string | null; subscription_expires_at?: string | null; created_at?: string | null; plan?: string | null } | null
): SubscriptionCountdown {
  const plan = profile?.plan?.toLowerCase().trim() || '';
  if (!plan || plan === 'free' || plan === 'expired' || plan === 'unsubscribed') {
    return {
      daysRemaining: 0,
      totalDays: 30,
      percentRemaining: 0,
      formattedResetDate: 'N/A',
      isExpired: true,
      isExpiringSoon: false
    };
  }

  const now = Date.now();
  let resetTime: number;

  const expiryTimestamp = profile?.period_resets_at || profile?.subscription_expires_at;
  if (expiryTimestamp) {
    resetTime = new Date(expiryTimestamp).getTime();
  } else if (profile?.created_at) {
    resetTime = new Date(profile.created_at).getTime() + 30 * 24 * 60 * 60 * 1000;
  } else {
    resetTime = now + 30 * 24 * 60 * 60 * 1000;
  }

  const diffMs = resetTime - now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const totalDays = 30;
  const percentRemaining = Math.min(100, Math.max(0, Math.round((daysRemaining / totalDays) * 100)));
  const isExpired = daysRemaining <= 0;
  const isExpiringSoon = !isExpired && daysRemaining <= 3;

  const resetDate = new Date(resetTime);
  const formattedResetDate = resetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return {
    daysRemaining,
    totalDays,
    percentRemaining,
    formattedResetDate,
    isExpired,
    isExpiringSoon
  };
}

export function resolveEffectivePlan(
  profile?: { plan?: string | null; stripe_customer_id?: string | null; subscription_expires_at?: string | null; period_resets_at?: string | null } | null,
  userMetadata?: Record<string, any> | null
): 'unsubscribed' | 'plus' | 'pro' {
  // If subscription has expired, it is no longer active
  const expiryTimestamp = profile?.period_resets_at || profile?.subscription_expires_at;
  if (expiryTimestamp) {
    const expiresAt = new Date(expiryTimestamp).getTime();
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
  const [countdown, setCountdown] = useState<SubscriptionCountdown>({
    daysRemaining: 0,
    totalDays: 30,
    percentRemaining: 0,
    formattedResetDate: 'N/A',
    isExpired: true,
    isExpiringSoon: false
  });

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
            setCountdown({
              daysRemaining: 0,
              totalDays: 30,
              percentRemaining: 0,
              formattedResetDate: 'N/A',
              isExpired: true,
              isExpiringSoon: false
            });
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
          .select('plan, stripe_customer_id, subscription_expires_at, period_resets_at, created_at')
          .eq('id', session.user.id)
          .maybeSingle();

        const currentPlan = resolveEffectivePlan(profile, session.user.user_metadata);
        const cd = getSubscriptionDaysRemaining(profile);

        if (isMounted) {
          setPlan(currentPlan);
          setIsSubscribed(isPlanSubscribed(currentPlan));
          setCountdown(cd);
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
    previewLimitSeconds: FREE_PREVIEW_LIMIT_SECONDS,
    countdown,
    daysRemaining: countdown.daysRemaining,
    formattedResetDate: countdown.formattedResetDate,
    percentRemaining: countdown.percentRemaining,
    isExpiringSoon: countdown.isExpiringSoon
  };
}
