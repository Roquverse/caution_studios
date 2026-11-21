'use client';

import { useState, useEffect } from 'react';

export const DAILY_FREE_BASE_DOWNLOAD_LIMIT = 2;
export const DAILY_PRO_BASE_DOWNLOAD_LIMIT = 5;
export const DAILY_FREE_MAX_BONUS_DOWNLOADS = 2; // Restricted to 2 extra downloads per day via ads for free tier
export const DAILY_PRO_MAX_BONUS_DOWNLOADS = 20; // Pro subscribers can unlock additional beats via download ads

export interface DailyDownloadQuotaState {
  used: number;
  bonus: number;
  baseLimit: number;
  maxBonus: number;
  bonusRemaining: number;
  canEarnBonus: boolean;
  totalAllowed: number;
  remaining: number;
  canDownload: boolean;
  todayDate: string;
  isPro: boolean;
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyDownloadState(isProUser?: boolean): DailyDownloadQuotaState {
  const isPro = typeof isProUser === 'boolean'
    ? isProUser
    : (typeof window !== 'undefined' ? (localStorage.getItem('caution:user-plan') === 'pro') : false);

  const baseLimit = isPro ? DAILY_PRO_BASE_DOWNLOAD_LIMIT : DAILY_FREE_BASE_DOWNLOAD_LIMIT;
  const maxBonus = isPro ? DAILY_PRO_MAX_BONUS_DOWNLOADS : DAILY_FREE_MAX_BONUS_DOWNLOADS;

  if (typeof window === 'undefined') {
    return {
      used: 0,
      bonus: 0,
      baseLimit,
      maxBonus,
      bonusRemaining: maxBonus,
      canEarnBonus: true,
      totalAllowed: baseLimit,
      remaining: baseLimit,
      canDownload: true,
      todayDate: getTodayDateString(),
      isPro
    };
  }

  const today = getTodayDateString();
  const storedDate = localStorage.getItem('caution_daily_downloads_date');

  let used = 0;
  let bonus = 0;

  if (storedDate === today) {
    used = parseInt(localStorage.getItem('caution_daily_downloads_used') || '0', 10) || 0;
    bonus = parseInt(localStorage.getItem('caution_daily_bonus_downloads') || '0', 10) || 0;
  } else {
    // Reset for the new day
    localStorage.setItem('caution_daily_downloads_date', today);
    localStorage.setItem('caution_daily_downloads_used', '0');
    localStorage.setItem('caution_daily_bonus_downloads', '0');
  }

  // Ensure bonus does not exceed the allowed bonus ceiling
  const cappedBonus = Math.min(bonus, maxBonus);
  const bonusRemaining = Math.max(0, maxBonus - cappedBonus);
  const canEarnBonus = bonusRemaining > 0;

  const totalAllowed = baseLimit + cappedBonus;
  const remaining = Math.max(0, totalAllowed - used);
  const canDownload = remaining > 0;

  return {
    used,
    bonus: cappedBonus,
    baseLimit,
    maxBonus,
    bonusRemaining,
    canEarnBonus,
    totalAllowed,
    remaining,
    canDownload,
    todayDate: today,
    isPro
  };
}

export function canEarnBonusDownload(isProUser?: boolean): boolean {
  const state = getDailyDownloadState(isProUser);
  return state.canEarnBonus;
}

export function grantBonusDownload(count: number = 1, isProUser?: boolean): DailyDownloadQuotaState {
  if (typeof window === 'undefined') return getDailyDownloadState(isProUser);

  const state = getDailyDownloadState(isProUser);
  // Restrict bonus downloads to max allowed bonus per tier
  const allowedGrant = Math.min(count, Math.max(0, state.maxBonus - state.bonus));
  const newBonus = state.bonus + allowedGrant;

  localStorage.setItem('caution_daily_downloads_date', state.todayDate);
  localStorage.setItem('caution_daily_bonus_downloads', newBonus.toString());

  const updatedState = getDailyDownloadState(isProUser);

  window.dispatchEvent(
    new CustomEvent('caution:bonus-download-awarded', {
      detail: { bonusGranted: count, totalBonus: newBonus, remaining: updatedState.remaining }
    })
  );

  return updatedState;
}

export function recordBeatDownload(beatId: string, title?: string, isProUser?: boolean): DailyDownloadQuotaState {
  if (typeof window === 'undefined') return getDailyDownloadState(isProUser);

  const state = getDailyDownloadState(isProUser);
  const newUsed = state.used + 1;

  localStorage.setItem('caution_daily_downloads_date', state.todayDate);
  localStorage.setItem('caution_daily_downloads_used', newUsed.toString());

  const updatedState = getDailyDownloadState(isProUser);

  window.dispatchEvent(
    new CustomEvent('caution:download-recorded', {
      detail: { beatId, title, used: newUsed, remaining: updatedState.remaining }
    })
  );

  return updatedState;
}

export function useDailyDownloadQuota(isProUser?: boolean): DailyDownloadQuotaState {
  const [quota, setQuota] = useState<DailyDownloadQuotaState>(getDailyDownloadState(isProUser));

  useEffect(() => {
    const handleSync = () => {
      setQuota(getDailyDownloadState(isProUser));
    };

    window.addEventListener('caution:bonus-download-awarded', handleSync);
    window.addEventListener('caution:download-recorded', handleSync);
    window.addEventListener('caution:plan-changed', handleSync);
    window.addEventListener('storage', handleSync);

    handleSync();

    return () => {
      window.removeEventListener('caution:bonus-download-awarded', handleSync);
      window.removeEventListener('caution:download-recorded', handleSync);
      window.removeEventListener('caution:plan-changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [isProUser]);

  return quota;
}
