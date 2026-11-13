'use client';

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { TrackItem } from '../types/tracks';

export interface AppSettings {
  audioQuality: 'lossless' | 'high' | 'standard';
  volumeNormalization: boolean;
  autoplay: boolean;
  crossfadeSeconds: number;
  emailNewDrops: boolean;
  emailReceipts: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  audioQuality: 'lossless',
  volumeNormalization: true,
  autoplay: true,
  crossfadeSeconds: 3,
  emailNewDrops: true,
  emailReceipts: true
};

const SETTINGS_STORAGE_KEY = 'caution_app_settings';
const SETTINGS_EVENT_NAME = 'caution-settings-updated';

/**
 * Retrieve settings from localStorage synchronously with fallback to defaults.
 */
export function getStoredSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      audioQuality: ['lossless', 'high', 'standard'].includes(parsed.audioQuality)
        ? parsed.audioQuality
        : DEFAULT_SETTINGS.audioQuality,
      volumeNormalization: typeof parsed.volumeNormalization === 'boolean'
        ? parsed.volumeNormalization
        : DEFAULT_SETTINGS.volumeNormalization,
      autoplay: typeof parsed.autoplay === 'boolean'
        ? parsed.autoplay
        : DEFAULT_SETTINGS.autoplay,
      crossfadeSeconds: typeof parsed.crossfadeSeconds === 'number'
        ? Math.max(0, Math.min(10, parsed.crossfadeSeconds))
        : DEFAULT_SETTINGS.crossfadeSeconds,
      emailNewDrops: typeof parsed.emailNewDrops === 'boolean'
        ? parsed.emailNewDrops
        : DEFAULT_SETTINGS.emailNewDrops,
      emailReceipts: typeof parsed.emailReceipts === 'boolean'
        ? parsed.emailReceipts
        : DEFAULT_SETTINGS.emailReceipts
    };
  } catch (err) {
    console.warn('Failed to parse stored settings:', err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to localStorage, fire cross-component event, and sync to Supabase user_metadata if authenticated.
 */
export async function saveStoredSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
  const current = getStoredSettings();
  const updated: AppSettings = { ...current, ...newSettings };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent(SETTINGS_EVENT_NAME, { detail: updated }));
    } catch (err) {
      console.warn('Failed to write to localStorage:', err);
    }
  }

  // Sync to Supabase user_metadata asynchronously in background
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await supabase.auth.updateUser({
        data: { app_settings: updated }
      });
    }
  } catch (err) {
    console.warn('Could not sync app settings to Supabase session:', err);
  }

  return updated;
}

/**
 * React hook to access and subscribe to live settings changes.
 */
export function useAppSettings(): {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  isLoading: boolean;
} {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Load initial from localStorage
    const initial = getStoredSettings();
    setSettings(initial);
    setIsLoading(false);

    // 2. Fetch Supabase user_metadata if available to keep in sync
    async function syncFromCloud() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.user_metadata?.app_settings) {
          const cloudSettings = session.user.user_metadata.app_settings as AppSettings;
          const merged = { ...initial, ...cloudSettings };
          setSettings(merged);
          if (typeof window !== 'undefined') {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
          }
        }
      } catch (err) {
        console.warn('Error syncing settings from cloud:', err);
      }
    }
    syncFromCloud();

    // 3. Listen to local event updates
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<AppSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      }
    };

    window.addEventListener(SETTINGS_EVENT_NAME, handleUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === SETTINGS_STORAGE_KEY && e.newValue) {
        try {
          setSettings(JSON.parse(e.newValue));
        } catch {}
      }
    });

    return () => {
      window.removeEventListener(SETTINGS_EVENT_NAME, handleUpdate);
    };
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const saved = await saveStoredSettings(newSettings);
    setSettings(saved);
  };

  return { settings, updateSettings, isLoading };
}

/**
 * Camelot Wheel Mapping for Harmonic Key Mixing
 */
const CAMELOT_KEY_MAP: Record<string, { num: number; letter: 'A' | 'B' }> = {
  'ab minor': { num: 1, letter: 'A' }, 'g# minor': { num: 1, letter: 'A' }, 'b major': { num: 1, letter: 'B' },
  'eb minor': { num: 2, letter: 'A' }, 'd# minor': { num: 2, letter: 'A' }, 'f# major': { num: 2, letter: 'B' }, 'gb major': { num: 2, letter: 'B' },
  'bb minor': { num: 3, letter: 'A' }, 'a# minor': { num: 3, letter: 'A' }, 'db major': { num: 3, letter: 'B' }, 'c# major': { num: 3, letter: 'B' },
  'f minor': { num: 4, letter: 'A' }, 'ab major': { num: 4, letter: 'B' }, 'g# major': { num: 4, letter: 'B' },
  'c minor': { num: 5, letter: 'A' }, 'eb major': { num: 5, letter: 'B' }, 'd# major': { num: 5, letter: 'B' },
  'g minor': { num: 6, letter: 'A' }, 'bb major': { num: 6, letter: 'B' }, 'a# major': { num: 6, letter: 'B' },
  'd minor': { num: 7, letter: 'A' }, 'f major': { num: 7, letter: 'B' },
  'a minor': { num: 8, letter: 'A' }, 'c major': { num: 8, letter: 'B' },
  'e minor': { num: 9, letter: 'A' }, 'g major': { num: 9, letter: 'B' },
  'b minor': { num: 10, letter: 'A' }, 'd major': { num: 10, letter: 'B' },
  'f# minor': { num: 11, letter: 'A' }, 'gb minor': { num: 11, letter: 'A' }, 'a major': { num: 11, letter: 'B' },
  'c# minor': { num: 12, letter: 'A' }, 'db minor': { num: 12, letter: 'A' }, 'e major': { num: 12, letter: 'B' }
};

/**
 * Returns harmonic compatibility score between two musical keys (0-100).
 */
export function getHarmonicCompatibility(keyA?: string, keyB?: string): number {
  if (!keyA || !keyB) return 30; // neutral fallback
  const aNorm = keyA.toLowerCase().trim();
  const bNorm = keyB.toLowerCase().trim();

  if (aNorm === bNorm) return 100; // Perfect match

  const cA = CAMELOT_KEY_MAP[aNorm];
  const cB = CAMELOT_KEY_MAP[bNorm];
  if (!cA || !cB) return 40;

  // Relative Major / Minor (e.g. 5A <-> 5B)
  if (cA.num === cB.num) return 90;

  // Adjacent on Camelot Wheel (+1 or -1 hour)
  const diff = Math.abs(cA.num - cB.num);
  if (diff === 1 || diff === 11) {
    if (cA.letter === cB.letter) return 80; // Same mode adjacent (5A <-> 6A)
    return 70; // Diagonal transition
  }

  return 20; // Harmonic clash
}

/**
 * Finds the best harmonically and musically matched beat for autoplay continuity.
 */
export function findHarmonicallyMatchedBeat(
  current: TrackItem,
  candidateTracks: TrackItem[]
): TrackItem | null {
  const eligible = candidateTracks.filter((t) => t.id !== current.id);
  if (eligible.length === 0) return null;

  let bestTrack: TrackItem = eligible[0];
  let bestScore = -1;

  for (const track of eligible) {
    let score = 0;

    // Harmonic key score
    const keyScore = getHarmonicCompatibility(current.musicalKey, track.musicalKey);
    score += keyScore * 0.5;

    // Genre similarity (+30 points)
    if (current.genre && track.genre && current.genre.toLowerCase() === track.genre.toLowerCase()) {
      score += 30;
    }

    // BPM proximity (+20 points if within 6 BPM)
    if (current.bpm && track.bpm) {
      const bpmDiff = Math.abs(current.bpm - track.bpm);
      if (bpmDiff <= 6) score += 20;
      else if (bpmDiff <= 12) score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestTrack = track;
    }
  }

  return bestTrack;
}

/**
 * Resolves the optimal streaming audio URL based on user's active streaming quality tier.
 */
export function resolveAudioForQuality(
  track: TrackItem,
  quality: 'lossless' | 'high' | 'standard'
): string {
  if (quality === 'lossless' && track.masterUrl) {
    return track.masterUrl;
  }
  if (quality === 'high' && track.previewCleanUrl) {
    return track.previewCleanUrl;
  }
  if (quality === 'standard' && track.previewTaggedUrl) {
    return track.previewTaggedUrl;
  }
  return track.previewCleanUrl || track.audioUrl || track.masterUrl || '';
}
