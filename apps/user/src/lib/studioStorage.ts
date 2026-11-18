import { TrackItem } from '../types/tracks';
import { StudioVocalTrack } from '../components/UserRecordStudioModal';

export interface StudioSavedVocalTrack {
  id: string;
  name: string;
  type: 'lead' | 'backup';
  color: string;
  isArmed: boolean;
  isMuted: boolean;
  isSolo: boolean;
  volume: number;
  pan: number;
  vocalBlob: Blob | null;
  durationSeconds: number;
  latencyOffsetMs?: number;
  startTimeSec?: number;
  trimStartSec?: number;
  trimEndSec?: number;
  playbackRate?: number;
  clips?: any[];
  undoStack?: any[];
}

export interface StudioProjectEffects {
  autoTuneEnabled: boolean;
  autoTuneSpeed: 'hard' | 'fast' | 'subtle';
  autoTuneAmount: number;
  autoTuneKey: string;
  reverbAmount: number;
  delayAmount: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  compressorEnabled: boolean;
  lowCutEnabled: boolean;
  masteringPreset?: string;
  beatVolume: number;
  masterVolume: number;
}

export interface StudioProjectData {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  beat: TrackItem | null;
  vocalTracks: StudioSavedVocalTrack[];
  bpm: number;
  musicalKey: string;
  timeSignature: '4/4' | '3/4' | '6/8';
  lyrics: string;
  notes: string;
  effects: StudioProjectEffects;
}

export interface StudioProjectSummary {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  beatTitle?: string;
  beatArtist?: string;
  beatCoverUrl?: string;
  trackCount: number;
  takeCount: number;
  hasRecordings: boolean;
}

const DB_NAME = 'CautionStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'studio_projects';

// Open or initialize IndexedDB
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Convert a single Project to Summary
function toSummary(project: StudioProjectData): StudioProjectSummary {
  const recordedTracks = (project.vocalTracks || []).filter((t) => t.vocalBlob !== null);
  const totalTakes = (project.vocalTracks || []).reduce((acc, t) => acc + (t.clips?.length || (t.vocalBlob ? 1 : 0)), 0);

  return {
    id: project.id,
    title: project.title || 'Untitled Session',
    createdAt: project.createdAt || Date.now(),
    updatedAt: project.updatedAt || Date.now(),
    beatTitle: project.beat?.title,
    beatArtist: project.beat?.artist,
    beatCoverUrl: project.beat?.coverUrl,
    trackCount: (project.vocalTracks || []).length,
    takeCount: totalTakes,
    hasRecordings: recordedTracks.length > 0
  };
}

/**
 * Save project into local IndexedDB (stores audio Blobs natively)
 */
export async function saveLocalStudioProject(project: StudioProjectData): Promise<string> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const recordToSave: StudioProjectData = {
      ...project,
      updatedAt: Date.now()
    };

    const request = store.put(recordToSave);

    request.onsuccess = () => resolve(recordToSave.id);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Load project from local IndexedDB
 */
export async function loadLocalStudioProject(id: string): Promise<StudioProjectData | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * List all saved projects from IndexedDB
 */
export async function listLocalStudioProjects(): Promise<StudioProjectSummary[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as StudioProjectData[]) || [];
        // Sort descending by updatedAt
        results.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        resolve(results.map(toSummary));
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to list local studio projects:', err);
    return [];
  }
}

/**
 * Delete a saved project from IndexedDB
 */
export async function deleteLocalStudioProject(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Convert Blob to Base64 data URL
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert Base64 data URL back to Blob
 */
function base64ToBlob(base64: string, contentType = 'audio/wav'): Blob {
  const parts = base64.split(',');
  const dataString = parts.length > 1 ? parts[1] : parts[0];
  const binaryString = atob(dataString);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
}

/**
 * Export project to a downloadable standalone .cstudio file (JSON with base64 audio stems)
 */
export async function exportProjectToFile(project: StudioProjectData): Promise<void> {
  if (typeof window === 'undefined') return;

  // Convert vocal blobs to base64
  const serializedTracks = await Promise.all(
    (project.vocalTracks || []).map(async (t) => {
      let audioBase64: string | null = null;
      if (t.vocalBlob) {
        try {
          audioBase64 = await blobToBase64(t.vocalBlob);
        } catch (e) {
          console.warn(`Failed to serialize audio for track ${t.name}:`, e);
        }
      }

      return {
        ...t,
        vocalBlob: null, // do not put Blob in JSON
        audioBase64
      };
    })
  );

  const exportPayload = {
    format: 'CautionStudioProject',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    project: {
      ...project,
      vocalTracks: serializedTracks
    }
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const fileBlob = new Blob([jsonString], { type: 'application/json' });
  const downloadUrl = URL.createObjectURL(fileBlob);

  const safeTitle = (project.title || 'Untitled Session')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 40);

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `${safeTitle}.cstudio`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Import a .cstudio file from user's computer and restore real audio Blobs
 */
export async function importProjectFromFile(file: File): Promise<StudioProjectData> {
  const text = await file.text();
  const parsed = JSON.parse(text);

  const rawProject = parsed.project || parsed;
  if (!rawProject || !rawProject.title) {
    throw new Error('Invalid Caution Studio project file structure.');
  }

  // Restore audio Blobs from base64
  const restoredTracks: StudioSavedVocalTrack[] = (rawProject.vocalTracks || []).map((t: any) => {
    let restoredBlob: Blob | null = null;
    if (t.audioBase64) {
      try {
        restoredBlob = base64ToBlob(t.audioBase64, 'audio/wav');
      } catch (e) {
        console.warn(`Could not restore audio blob for track ${t.name}:`, e);
      }
    }

    return {
      id: t.id || `trk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: t.name || 'Vocal Track',
      type: t.type || 'lead',
      color: t.color || '#2dd4bf',
      isArmed: Boolean(t.isArmed),
      isMuted: Boolean(t.isMuted),
      isSolo: Boolean(t.isSolo),
      volume: typeof t.volume === 'number' ? t.volume : 1.0,
      pan: typeof t.pan === 'number' ? t.pan : 0,
      vocalBlob: restoredBlob,
      durationSeconds: t.durationSeconds || 0,
      latencyOffsetMs: t.latencyOffsetMs || 0,
      startTimeSec: t.startTimeSec || 0,
      trimStartSec: t.trimStartSec || 0,
      trimEndSec: t.trimEndSec || t.durationSeconds || 0,
      playbackRate: t.playbackRate || 1.0,
      clips: t.clips || [],
      undoStack: t.undoStack || []
    };
  });

  const restoredProject: StudioProjectData = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: rawProject.title ? `${rawProject.title} (Imported)` : 'Imported Session',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    beat: rawProject.beat || null,
    vocalTracks: restoredTracks,
    bpm: rawProject.bpm || 92,
    musicalKey: rawProject.musicalKey || 'F Minor',
    timeSignature: rawProject.timeSignature || '4/4',
    lyrics: rawProject.lyrics || '',
    notes: rawProject.notes || '',
    effects: rawProject.effects || {
      autoTuneEnabled: true,
      autoTuneSpeed: 'fast',
      autoTuneAmount: 0.65,
      autoTuneKey: rawProject.musicalKey || 'F Minor',
      reverbAmount: 0.12,
      delayAmount: 0.06,
      eqLow: 0,
      eqMid: 0.5,
      eqHigh: 1.0,
      compressorEnabled: true,
      lowCutEnabled: true,
      masteringPreset: 'Universal',
      beatVolume: 1.0,
      masterVolume: 1.0
    }
  };

  // Save to IndexedDB immediately
  await saveLocalStudioProject(restoredProject);

  return restoredProject;
}

