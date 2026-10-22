'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export const FREE_PREVIEW_LIMIT_SECONDS = 15;

export function isPlanSubscribed(plan?: string | null): boolean {
  if (!plan) return false;
  const normalized = plan.toLowerCase().trim();
  return normalized === 'plus' || normalized === 'pro' || normalized === 'creator' || normalized === 'label';
}

export function getCachedUserPlan(): string {
  if (typeof window === 'undefined') return 'free';
  return localStorage.getItem('caution:user-plan') || 'free';
}

export function setCachedUserPlan(plan: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('caution:user-plan', plan);
  window.dispatchEvent(new CustomEvent('caution:plan-changed', { detail: { plan } }));
}

export function useUserSubscription() {
  const [plan, setPlan] = useState<string>('free');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const cachedPlan = typeof window !== 'undefined' ? localStorage.getItem('caution:user-plan') || 'free' : 'free';
    setPlan(cachedPlan);
    setIsSubscribed(isPlanSubscribed(cachedPlan));

    async function checkSubscription() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (isMounted) {
            setIsLoggedIn(false);
            setPlan('free');
            setIsSubscribed(false);
            if (typeof window !== 'undefined') {
              localStorage.setItem('caution:user-plan', 'free');
            }
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setIsLoggedIn(true);
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', session.user.id)
          .maybeSingle();

        const currentPlan = profile?.plan || 'free';
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
      const newPlan = e.detail?.plan || 'free';
      setPlan(newPlan);
      setIsSubscribed(isPlanSubscribed(newPlan));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('caution:plan-changed', handlePlanChanged);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsLoggedIn(false);
        setPlan('free');
        setIsSubscribed(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('caution:user-plan', 'free');
        }
      } else {
        setIsLoggedIn(true);
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
    isLoggedIn,
    isRegistered: isLoggedIn,
    isLoading,
    previewLimitSeconds: FREE_PREVIEW_LIMIT_SECONDS
  };
}

export const DAILY_DOWNLOAD_LIMIT = 2;
export const MONTHLY_BEAT_ACCESS_LIMIT = 62;
export const DOWNLOAD_RESET_HOURS = 24;

export interface DailyDownloadState {
  downloadsCount: number;
  limit: number;
  remaining: number;
  canDownload: boolean;
  nextAvailableTime: Date | null;
  hoursRemaining: number;
  minutesRemaining: number;
  unlimitedPreview: boolean;
}

export function getDailyDownloadState(): DailyDownloadState {
  if (typeof window === 'undefined') {
    return {
      downloadsCount: 0,
      limit: DAILY_DOWNLOAD_LIMIT,
      remaining: DAILY_DOWNLOAD_LIMIT,
      canDownload: true,
      nextAvailableTime: null,
      hoursRemaining: 0,
      minutesRemaining: 0,
      unlimitedPreview: true
    };
  }

  const raw = localStorage.getItem('caution:daily-downloads');
  let timestamps: number[] = [];
  try {
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        timestamps = parsed.filter((t: any) => typeof t === 'number');
      }
    }
  } catch (e) {
    timestamps = [];
  }

  const now = Date.now();
  const windowMs = DOWNLOAD_RESET_HOURS * 60 * 60 * 1000;
  // Filter active downloads from last 24h
  const activeDownloads = timestamps.filter((t) => now - t < windowMs);

  if (activeDownloads.length !== timestamps.length) {
    try {
      localStorage.setItem('caution:daily-downloads', JSON.stringify(activeDownloads));
    } catch (e) {}
  }

  const count = activeDownloads.length;
  const remaining = Math.max(0, DAILY_DOWNLOAD_LIMIT - count);
  const canDownload = count < DAILY_DOWNLOAD_LIMIT;

  let nextAvailableTime: Date | null = null;
  let hoursRemaining = 0;
  let minutesRemaining = 0;

  if (!canDownload && activeDownloads.length > 0) {
    const oldest = Math.min(...activeDownloads);
    const resetTime = oldest + windowMs;
    nextAvailableTime = new Date(resetTime);
    const diffMs = Math.max(0, resetTime - now);
    hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
    minutesRemaining = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  }

  return {
    downloadsCount: count,
    limit: DAILY_DOWNLOAD_LIMIT,
    remaining,
    canDownload,
    nextAvailableTime,
    hoursRemaining,
    minutesRemaining,
    unlimitedPreview: true
  };
}

export function recordBeatDownload(beatId: string, beatTitle?: string): DailyDownloadState {
  if (typeof window === 'undefined') return getDailyDownloadState();

  const raw = localStorage.getItem('caution:daily-downloads');
  let timestamps: number[] = [];
  try {
    if (raw) timestamps = JSON.parse(raw) || [];
  } catch (e) {
    timestamps = [];
  }

  const now = Date.now();
  timestamps.push(now);
  try {
    localStorage.setItem('caution:daily-downloads', JSON.stringify(timestamps));
  } catch (e) {}

  window.dispatchEvent(
    new CustomEvent('caution:download-recorded', {
      detail: { beatId, beatTitle, timestamp: now }
    })
  );

  return getDailyDownloadState();
}

export function useDailyDownloadQuota() {
  const [downloadState, setDownloadState] = useState<DailyDownloadState>(getDailyDownloadState());

  useEffect(() => {
    setDownloadState(getDailyDownloadState());

    const updateState = () => {
      setDownloadState(getDailyDownloadState());
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('caution:download-recorded', updateState);
      const interval = setInterval(updateState, 30000); // refresh every 30s
      return () => {
        window.removeEventListener('caution:download-recorded', updateState);
        clearInterval(interval);
      };
    }
  }, []);

  return downloadState;
}

