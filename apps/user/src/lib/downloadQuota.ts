'use client';

import { useState, useEffect } from 'react';

export const DAILY_BASE_DOWNLOAD_LIMIT = 2;

export interface DailyDownloadQuotaState {
  used: number;
  bonus: number;
  baseLimit: number;
  totalAllowed: number;
  remaining: number;
  canDownload: boolean;
  todayDate: string;
}

export function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyDownloadState(): DailyDownloadQuotaState {
  if (typeof window === 'undefined') {
    return {
      used: 0,
      bonus: 0,
      baseLimit: DAILY_BASE_DOWNLOAD_LIMIT,
      totalAllowed: DAILY_BASE_DOWNLOAD_LIMIT,
      remaining: DAILY_BASE_DOWNLOAD_LIMIT,
      canDownload: true,
      todayDate: getTodayDateString()
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

  const totalAllowed = DAILY_BASE_DOWNLOAD_LIMIT + bonus;
  const remaining = Math.max(0, totalAllowed - used);
  const canDownload = remaining > 0;

  return {
    used,
    bonus,
    baseLimit: DAILY_BASE_DOWNLOAD_LIMIT,
    totalAllowed,
    remaining,
    canDownload,
    todayDate: today
  };
}

export function grantBonusDownload(count: number = 1): DailyDownloadQuotaState {
  if (typeof window === 'undefined') return getDailyDownloadState();

  const state = getDailyDownloadState();
  const newBonus = state.bonus + count;

  localStorage.setItem('caution_daily_downloads_date', state.todayDate);
  localStorage.setItem('caution_daily_bonus_downloads', newBonus.toString());

  const updatedState = getDailyDownloadState();

  window.dispatchEvent(
    new CustomEvent('caution:bonus-download-awarded', {
      detail: { bonusGranted: count, totalBonus: newBonus, remaining: updatedState.remaining }
    })
  );

  return updatedState;
}

export function recordBeatDownload(beatId: string, title?: string): DailyDownloadQuotaState {
  if (typeof window === 'undefined') return getDailyDownloadState();

  const state = getDailyDownloadState();
  const newUsed = state.used + 1;

  localStorage.setItem('caution_daily_downloads_date', state.todayDate);
  localStorage.setItem('caution_daily_downloads_used', newUsed.toString());

  const updatedState = getDailyDownloadState();

  window.dispatchEvent(
    new CustomEvent('caution:download-recorded', {
      detail: { beatId, title, used: newUsed, remaining: updatedState.remaining }
    })
  );

  return updatedState;
}

export function useDailyDownloadQuota(): DailyDownloadQuotaState {
  const [quota, setQuota] = useState<DailyDownloadQuotaState>(getDailyDownloadState());

  useEffect(() => {
    const handleSync = () => {
      setQuota(getDailyDownloadState());
    };

    window.addEventListener('caution:bonus-download-awarded', handleSync);
    window.addEventListener('caution:download-recorded', handleSync);
    window.addEventListener('storage', handleSync);

    handleSync();

    return () => {
      window.removeEventListener('caution:bonus-download-awarded', handleSync);
      window.removeEventListener('caution:download-recorded', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  return quota;
}
