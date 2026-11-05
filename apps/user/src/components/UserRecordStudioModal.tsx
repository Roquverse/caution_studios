'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Download,
  Share2,
  Music,
  Check,
  Sparkles,
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Disc3,
  Flame,
  ArrowRight,
  ExternalLink,
  Layers,
  Activity,
  Headphones,
  Save,
  Radio,
  FileText,
  Clock,
  CheckCircle2,
  Repeat,
  Bell,
  SkipBack,
  SlidersHorizontal,
  CloudUpload,
  Link as LinkIcon,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowLeft,
  Bookmark,
  Target,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Magnet,
  Wand2,
  Scissors,
  Music2,
  Folder,
  Keyboard,
  ChevronRight,
  Settings,
  HelpCircle,
  Upload,
  Globe,
  Menu,
  Star,
  Lock
} from 'lucide-react';
import { TrackItem } from '../types/tracks';
import { useUserSubscription } from '../lib/subscription';

export interface UserRecordStudioModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  preselectedTrack?: TrackItem | null;
  availableTracks?: TrackItem[];
  isStandalonePage?: boolean;
}

export interface StudioVocalClipSegment {
  id: string;
  name: string;
  startTimeSec: number; // Timeline start position in seconds
  durationSeconds: number; // Timeline duration in seconds
}

export interface StudioVocalUndoSnapshot {
  vocalBlob: Blob;
  vocalUrl: string;
  durationSeconds: number;
  startTimeSec: number;
  trimStartSec: number;
  trimEndSec: number;
  playbackRate: number;
  clips: StudioVocalClipSegment[];
}

export interface StudioVocalTrack {
  id: string;
  name: string;
  type: 'lead' | 'backup';
  color: string;
  isArmed: boolean;
  isMuted: boolean;
  isSolo: boolean;
  volume: number; // 0 to 1.5
  pan: number; // -100 (Full Left) to +100 (Full Right)
  vocalBlob: Blob | null;
  vocalUrl: string | null;
  durationSeconds: number;
  latencyOffsetMs?: number; // Fine timing offset in ms
  startTimeSec?: number; // Timeline start position in seconds (move forward / backward)
  trimStartSec?: number; // Seconds trimmed from start of vocal file
  trimEndSec?: number; // End second in vocal file (defaults to durationSeconds)
  playbackRate?: number; // Vocal playback speed ratio (0.75 to 1.25, default 1.0)
  clips?: StudioVocalClipSegment[]; // Cubase-style non-destructive recorded regions on this channel
  undoStack?: StudioVocalUndoSnapshot[]; // Undo stack for non-destructive punch-in / overdub takes
}

const TRACK_PALETTE = [
  '#2dd4bf', // Teal (Lead)
  '#f59e0b', // Amber (Backup 1)
  '#a855f7', // Purple (Backup 2)
  '#ec4899', // Pink (Backup 3)
  '#3b82f6', // Blue (Backup 4)
  '#10b981', // Emerald (Backup 5)
  '#f43f5e'  // Rose (Backup 6)
];

// Convert Web Audio API AudioBuffer to stereo 16-bit PCM WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const length = buffer.length * numChannels;
  const data = new Int16Array(length);
  const channels: Float32Array[] = [];

  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  let offset = 0;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      data[offset++] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
  }

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + data.byteLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, data.byteLength, true);

  return new Blob([header, data.buffer], { type: 'audio/wav' });
}

// Cubase-style Non-Destructive Punch-In / Multi-Region Audio Compositor:
// Merges an existing vocal track buffer with a newly recorded take at `newStartSec`
// while preserving everything before `newStartSec` and after `newEndSec` with a smooth 15ms crossfade.
function compositePunchInAudioBuffers(
  ctx: BaseAudioContext,
  existingBuffer: AudioBuffer,
  existStartSec: number,
  existTrimIn: number,
  existTrimOut: number,
  existRate: number,
  newBuffer: AudioBuffer,
  newStartSec: number,
  newRate: number
): {
  mergedBuffer: AudioBuffer;
  mergedStartSec: number;
  mergedDurationSec: number;
  newTimelineDur: number;
} {
  const sampleRate = newBuffer.sampleRate || existingBuffer.sampleRate || 48000;
  const numChannels = Math.max(existingBuffer.numberOfChannels, newBuffer.numberOfChannels, 1);

  const safeExistRate = Math.max(0.75, Math.min(1.25, existRate || 1.0));
  const safeNewRate = Math.max(0.75, Math.min(1.25, newRate || 1.0));

  const existTimelineDur = Math.max(0.05, (existTrimOut - existTrimIn) / safeExistRate);
  const existEndSec = existStartSec + existTimelineDur;

  const newTimelineDur = Math.max(0.05, newBuffer.duration / safeNewRate);
  const newEndSec = newStartSec + newTimelineDur;

  const mergedStartSec = Math.min(existStartSec, newStartSec);
  const mergedEndSec = Math.max(existEndSec, newEndSec);
  const mergedDurationSec = Math.max(0.25, mergedEndSec - mergedStartSec);

  const totalFrames = Math.max(1, Math.ceil(mergedDurationSec * sampleRate));
  const mergedBuffer = ctx.createBuffer(numChannels, totalFrames, sampleRate);

  const existStartFrame = Math.max(0, Math.round((existStartSec - mergedStartSec) * sampleRate));
  const existEndFrame = Math.min(totalFrames, Math.round((existEndSec - mergedStartSec) * sampleRate));

  const newStartFrame = Math.max(0, Math.round((newStartSec - mergedStartSec) * sampleRate));
  const newEndFrame = Math.min(totalFrames, Math.round((newEndSec - mergedStartSec) * sampleRate));
  const xfadeFrames = Math.min(
    Math.floor(sampleRate * 0.015),
    Math.max(1, Math.floor((newEndFrame - newStartFrame) / 4))
  );

  for (let c = 0; c < numChannels; c++) {
    const outData = mergedBuffer.getChannelData(c);
    const existChan = existingBuffer.getChannelData(Math.min(c, existingBuffer.numberOfChannels - 1));
    const newChan = newBuffer.getChannelData(Math.min(c, newBuffer.numberOfChannels - 1));

    // 1. Lay down the existing recording at its exact timeline position
    for (let f = existStartFrame; f < existEndFrame; f++) {
      const timelineOffsetSec = (f - existStartFrame) / sampleRate;
      const srcSec = existTrimIn + timelineOffsetSec * safeExistRate;
      const srcIdx = srcSec * existingBuffer.sampleRate;
      const idx0 = Math.floor(srcIdx);
      if (idx0 >= 0 && idx0 < existChan.length) {
        const frac = srcIdx - idx0;
        const s0 = existChan[idx0];
        const s1 = idx0 + 1 < existChan.length ? existChan[idx0 + 1] : s0;
        outData[f] = s0 + (s1 - s0) * frac;
      }
    }

    // 2. Punch-in the new take at [newStartFrame, newEndFrame) with click-free 15ms crossfades
    for (let f = newStartFrame; f < newEndFrame; f++) {
      const timelineOffsetSec = (f - newStartFrame) / sampleRate;
      const srcSec = timelineOffsetSec * safeNewRate;
      const srcIdx = srcSec * newBuffer.sampleRate;
      const idx0 = Math.floor(srcIdx);
      let newSample = 0;
      if (idx0 >= 0 && idx0 < newChan.length) {
        const frac = srcIdx - idx0;
        const s0 = newChan[idx0];
        const s1 = idx0 + 1 < newChan.length ? newChan[idx0 + 1] : s0;
        newSample = s0 + (s1 - s0) * frac;
      }

      let w = 1.0;
      const distFromStart = f - newStartFrame;
      const distFromEnd = newEndFrame - 1 - f;
      if (distFromStart < xfadeFrames && newStartSec > existStartSec && newStartSec < existEndSec) {
        w = distFromStart / Math.max(1, xfadeFrames);
      } else if (distFromEnd < xfadeFrames && newEndSec < existEndSec && newEndSec > existStartSec) {
        w = distFromEnd / Math.max(1, xfadeFrames);
      }
      outData[f] = outData[f] * (1 - w) + newSample * w;
    }
  }

  return {
    mergedBuffer,
    mergedStartSec: Number(mergedStartSec.toFixed(3)),
    mergedDurationSec: Number(mergedDurationSec.toFixed(3)),
    newTimelineDur: Number(newTimelineDur.toFixed(3))
  };
}

// ===========================================================================
// LOOP STUDIO UI HELPERS
// ===========================================================================
interface StudioTrackStyle {
  dot: string;
  clipBg: string;
  clipBorder: string;
  text: string;
  wave: string;
}

const STUDIO_TRACK_STYLES: Record<string, StudioTrackStyle> = {
  beat: { dot: '#e8a33d', clipBg: '#46361e', clipBorder: '#7a5f33', text: '#f1dcb0', wave: '#e0a64e' },
  lead: { dot: '#4fc1b5', clipBg: '#1f3b3d', clipBorder: '#326361', text: '#bfe9e3', wave: '#6fc9bd' }
};

const BACKUP_STYLES: StudioTrackStyle[] = [
  { dot: '#9b86e8', clipBg: '#2f2a4a', clipBorder: '#4d4678', text: '#d5cdf7', wave: '#a58df0' },
  { dot: '#d96aa8', clipBg: '#402c3b', clipBorder: '#66475f', text: '#ecc3dc', wave: '#c87fb0' },
  { dot: '#5b8def', clipBg: '#222d41', clipBorder: '#3b4f73', text: '#c4d6f5', wave: '#6b9be3' },
  { dot: '#86c27a', clipBg: '#2f3b2b', clipBorder: '#4c6146', text: '#d4e6cb', wave: '#8fc27f' }
];

interface StudioRow {
  id: string;
  kind: 'beat' | 'lead' | 'backup';
  name: string;
  sub: string;
  style: StudioTrackStyle;
  track?: StudioVocalTrack;
}

const volToDb = (v: number) => (v <= 0.0056 ? -45 : Math.max(-45, Math.min(0, 20 * Math.log10(v))));
const dbToVol = (db: number) => (db <= -44.9 ? 0 : Math.pow(10, db / 20));

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Real waveform peaks decoded from the actual audio (beat or recorded take)
const peaksCache = new Map<string, number[]>();
const peaksFailed = new Set<string>();
let sharedDecodeCtx: AudioContext | null = null;

function useAudioPeaks(url?: string | null, resolution = 200) {
  const [peaks, setPeaks] = useState<number[] | null>(url ? peaksCache.get(url) || null : null);

  useEffect(() => {
    if (!url) {
      setPeaks(null);
      return;
    }
    const cached = peaksCache.get(url);
    if (cached) {
      setPeaks(cached);
      return;
    }
    if (peaksFailed.has(url)) {
      setPeaks(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        if (!sharedDecodeCtx) sharedDecodeCtx = new Ctx();
        const audio = await sharedDecodeCtx!.decodeAudioData(buf.slice(0));
        const ch = audio.getChannelData(0);
        const block = Math.floor(ch.length / resolution);
        if (block < 1) return;
        const stride = Math.max(1, Math.floor(block / 120));
        const out: number[] = [];
        for (let i = 0; i < resolution; i++) {
          let max = 0;
          const start = i * block;
          for (let j = 0; j < block; j += stride) {
            const v = Math.abs(ch[start + j]);
            if (v > max) max = v;
          }
          out.push(max);
        }
        const top = Math.max(...out, 1e-6);
        const norm = out.map((v) => v / top);
        peaksCache.set(url, norm);
        if (!cancelled) setPeaks(norm);
      } catch (e) {
        peaksFailed.add(url);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, resolution]);

  return peaks;
}

const WaveBars = React.memo(function WaveBars({
  seed,
  color,
  bars = 56,
  peaks
}: {
  seed: string;
  color: string;
  bars?: number;
  peaks?: number[] | null;
}) {
  const rects = useMemo(() => {
    const out: { x: number; y: number; h: number }[] = [];
    if (peaks && peaks.length) {
      for (let i = 0; i < bars; i++) {
        const from = Math.floor((i / bars) * peaks.length);
        const to = Math.max(from + 1, Math.floor(((i + 1) / bars) * peaks.length));
        let amp = 0;
        for (let k = from; k < to && k < peaks.length; k++) amp = Math.max(amp, peaks[k]);
        amp = Math.max(0.08, Math.min(1, amp));
        out.push({ x: i * 4, y: 50 - amp * 50, h: amp * 100 });
      }
      return out;
    }
    const rnd = seeded(hashStr(seed));
    for (let i = 0; i < bars; i++) {
      const env = 0.45 + 0.55 * Math.sin((i / bars) * Math.PI);
      const amp = Math.max(0.14, Math.min(1, env * (0.35 + 0.65 * rnd())));
      out.push({ x: i * 4, y: 50 - amp * 50, h: amp * 100 });
    }
    return out;
  }, [seed, bars, peaks]);

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${bars * 4} 100`} preserveAspectRatio="none">
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={2.2} height={r.h} rx={1} fill={color} />
      ))}
    </svg>
  );
});

function AudioWave({
  url,
  seed,
  color,
  bars,
  trimStartRatio = 0,
  trimEndRatio = 1
}: {
  url?: string | null;
  seed: string;
  color: string;
  bars: number;
  trimStartRatio?: number;
  trimEndRatio?: number;
}) {
  const rawPeaks = useAudioPeaks(url);
  const slicedPeaks = useMemo(() => {
    if (!rawPeaks || !rawPeaks.length) return rawPeaks;
    const startIdx = Math.max(0, Math.min(rawPeaks.length - 1, Math.floor(trimStartRatio * rawPeaks.length)));
    const endIdx = Math.max(startIdx + 1, Math.min(rawPeaks.length, Math.ceil(trimEndRatio * rawPeaks.length)));
    return rawPeaks.slice(startIdx, endIdx);
  }, [rawPeaks, trimStartRatio, trimEndRatio]);
  return <WaveBars seed={seed} color={color} bars={bars} peaks={slicedPeaks} />;
}

function LiveBars({ values, color }: { values: number[]; color: string }) {
  const shown = values.slice(-60);
  return (
    <div className="w-full h-full flex items-center gap-[2px] justify-end">
      {shown.map((v, i) => (
        <span
          key={i}
          className="flex-1 min-w-[1px] rounded-full"
          style={{ height: `${Math.max(8, Math.min(100, v))}%`, background: color }}
        />
      ))}
    </div>
  );
}

const StudioTakeClip = React.memo(function StudioTakeClip({
  id,
  name,
  leftPct,
  widthPct,
  style,
  selected,
  onSelect,
  url,
  seed,
  onDelete,
  onUndo,
  live,
  viewSpanSec = 180,
  trimStartRatio = 0,
  trimEndRatio = 1,
  segments,
  clipStartSec = 0,
  clipSpanSec = 1,
  onMoveDeltaSec,
  onTrimStartDeltaSec,
  onTrimEndDeltaSec
}: {
  id: string;
  name: string;
  leftPct: number;
  widthPct: number;
  style: StudioTrackStyle;
  selected: boolean;
  onSelect: (id: string) => void;
  url?: string | null;
  seed: string;
  onDelete?: () => void;
  onUndo?: () => void;
  live?: number[];
  viewSpanSec?: number;
  trimStartRatio?: number;
  trimEndRatio?: number;
  segments?: StudioVocalClipSegment[];
  clipStartSec?: number;
  clipSpanSec?: number;
  onMoveDeltaSec?: (deltaSec: number) => void;
  onTrimStartDeltaSec?: (deltaSec: number) => void;
  onTrimEndDeltaSec?: (deltaSec: number) => void;
}) {
  const clipRef = useRef<HTMLDivElement>(null);
  const dragModeRef = useRef<'move' | 'trim-start' | 'trim-end' | null>(null);
  const lastXRef = useRef<number>(0);
  const didDragRef = useRef<boolean>(false);

  const getLaneWidth = () => {
    const parent = clipRef.current?.parentElement;
    return parent ? Math.max(100, parent.getBoundingClientRect().width) : 600;
  };

  return (
    <div
      ref={clipRef}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        onSelect(id);
        // If user dragged the clip or trim handles, stop click from seeking playhead on release;
        // if user simply clicked a point on the clip, allow parent lane to seek playhead to that exact spot!
        if (didDragRef.current) {
          e.stopPropagation();
          didDragRef.current = false;
        }
      }}
      onPointerDown={(e) => {
        if (live || !onMoveDeltaSec) return;
        e.stopPropagation();
        onSelect(id);
        dragModeRef.current = 'move';
        didDragRef.current = false;
        lastXRef.current = e.clientX;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!dragModeRef.current) return;
        e.stopPropagation();
        const dx = e.clientX - lastXRef.current;
        if (Math.abs(dx) < 3) return;
        didDragRef.current = true;
        lastXRef.current = e.clientX;
        const deltaSec = (dx / getLaneWidth()) * viewSpanSec;
        if (dragModeRef.current === 'move' && onMoveDeltaSec) {
          onMoveDeltaSec(deltaSec);
        } else if (dragModeRef.current === 'trim-start' && onTrimStartDeltaSec) {
          onTrimStartDeltaSec(deltaSec);
        } else if (dragModeRef.current === 'trim-end' && onTrimEndDeltaSec) {
          onTrimEndDeltaSec(deltaSec);
        }
      }}
      onPointerUp={(e) => {
        if (dragModeRef.current) {
          e.stopPropagation();
          dragModeRef.current = null;
        }
      }}
      onPointerCancel={() => {
        dragModeRef.current = null;
      }}
      title={
        onMoveDeltaSec
          ? 'Click anywhere to set punch-in playhead · Drag clip left/right to move · Drag edges [ ] to trim'
          : undefined
      }
      className={`group absolute top-[8%] bottom-[8%] rounded-md border overflow-hidden touch-none ${
        onMoveDeltaSec ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${selected && !live ? 'z-10 border-2' : live ? 'z-20' : 'hover:brightness-110'}`}
      style={{
        left: `${Math.max(0, leftPct)}%`,
        width: `${Math.max(widthPct, 0.8)}%`,
        background: live ? '#3a1d1a' : style.clipBg,
        borderColor: live ? '#ff5a36' : selected ? '#f4f4f5' : style.clipBorder
      }}
    >
      {/* Left Trim Handle [ */}
      {onTrimStartDeltaSec && !live && (
        <div
          title="Drag to trim vocal start"
          onPointerDown={(e) => {
            e.stopPropagation();
            onSelect(id);
            dragModeRef.current = 'trim-start';
            didDragRef.current = true;
            lastXRef.current = e.clientX;
            (clipRef.current as any)?.setPointerCapture?.(e.pointerId);
          }}
          className="absolute left-0 top-0 bottom-0 w-2.5 z-20 cursor-ew-resize flex items-center justify-center bg-black/25 hover:bg-[#ff5a36]/80 transition-colors"
        >
          <span className="w-0.5 h-3.5 rounded-full bg-white/80" />
        </div>
      )}

      {/* Right Trim Handle ] */}
      {onTrimEndDeltaSec && !live && (
        <div
          title="Drag to trim vocal end"
          onPointerDown={(e) => {
            e.stopPropagation();
            onSelect(id);
            dragModeRef.current = 'trim-end';
            didDragRef.current = true;
            lastXRef.current = e.clientX;
            (clipRef.current as any)?.setPointerCapture?.(e.pointerId);
          }}
          className="absolute right-0 top-0 bottom-0 w-2.5 z-20 cursor-ew-resize flex items-center justify-center bg-black/25 hover:bg-[#ff5a36]/80 transition-colors"
        >
          <span className="w-0.5 h-3.5 rounded-full bg-white/80" />
        </div>
      )}

      {/* Cubase-Style Non-Destructive Punch-In Region Boundaries */}
      {!live && segments && segments.length > 1 && clipSpanSec > 0.2 && (
        <div className="absolute inset-0 pointer-events-none z-10">
          {segments.map((seg, idx) => {
            const relLeftPct = Math.max(0, Math.min(99, ((seg.startTimeSec - clipStartSec) / clipSpanSec) * 100));
            return idx > 0 ? (
              <div
                key={seg.id}
                className="absolute top-0 bottom-0 border-l border-dashed border-white/45"
                style={{ left: `${relLeftPct}%` }}
              >
                <span className="ml-1 mt-0.5 inline-block px-1 py-[1px] rounded bg-black/45 text-[8.5px] font-semibold text-white/85 leading-none">
                  {seg.name}
                </span>
              </div>
            ) : null;
          })}
        </div>
      )}

      <span
        className="absolute left-3 top-1 text-[11px] font-medium leading-none whitespace-nowrap truncate max-w-[calc(100%-52px)] pointer-events-none"
        style={{ color: live ? '#ffb4a3' : style.text }}
      >
        {live ? name || 'Recording…' : name}
      </span>
      <div className="absolute right-2.5 top-1 z-20 flex items-center gap-1">
        {onUndo && selected && !live && (
          <button
            type="button"
            title="Undo last punch-in take (restore previous recording)"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onUndo();
            }}
            className="h-4 px-1.5 rounded bg-black/55 hover:bg-[#ff5a36] text-white flex items-center gap-0.5 text-[9px] font-semibold"
          >
            <Undo2 className="h-2.5 w-2.5" />
            <span>Undo</span>
          </button>
        )}
        {onDelete && selected && !live && (
          <button
            type="button"
            title="Clear all takes on this track"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="w-4 h-4 rounded bg-black/40 hover:bg-[#ff5a36] text-white flex items-center justify-center"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="absolute left-2.5 right-2.5 bottom-1 top-[36%] pointer-events-none">
        {live ? (
          <LiveBars values={live} color="#ff8a6e" />
        ) : (
          <AudioWave
            url={url}
            seed={seed}
            color={style.wave}
            bars={Math.max(12, Math.min(140, Math.round(widthPct * 1.1)))}
            trimStartRatio={trimStartRatio}
            trimEndRatio={trimEndRatio}
          />
        )}
      </div>
    </div>
  );
});

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

function RotaryKnob({
  norm,
  size,
  valueLabel,
  label,
  onNorm
}: {
  norm: number;
  size: number;
  valueLabel: string;
  label: string;
  onNorm: (n: number) => void;
}) {
  const stroke = size * 0.075;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - stroke;
  const a0 = 135;
  const aVal = a0 + 270 * Math.max(0, Math.min(1, norm));
  const [px0, py0] = polar(cx, cy, r * 0.3, aVal);
  const [px1, py1] = polar(cx, cy, r * 0.68, aVal);
  const drag = useRef<{ y: number; n: number } | null>(null);

  return (
    <div className="flex flex-col items-center select-none">
      <div
        className="relative touch-none cursor-ns-resize"
        style={{ width: size, height: size }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { y: e.clientY, n: norm };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const delta = (drag.current.y - e.clientY) / 140;
          onNorm(Math.max(0, Math.min(1, drag.current.n + delta)));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id={`knobDisc-${size}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#222328" />
              <stop offset="100%" stopColor="#121316" />
            </linearGradient>
          </defs>
          <path d={arcPath(cx, cy, r, 135, 405)} stroke="#232429" strokeWidth={stroke} fill="none" strokeLinecap="round" />
          {norm > 0.01 && (
            <path
              d={arcPath(cx, cy, r, a0, aVal)}
              stroke="#ff5a36"
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 5px rgba(255,90,54,0.45))' }}
            />
          )}
          <circle cx={cx} cy={cy} r={r * 0.76} fill={`url(#knobDisc-${size})`} stroke="#2d2e34" strokeWidth={1} />
          <line
            x1={px0}
            y1={py0}
            x2={px1}
            y2={py1}
            stroke="#ffffff"
            strokeWidth={Math.max(2, size * 0.04)}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="mt-1.5 text-[12px] font-semibold text-white tabular-nums leading-none">{valueLabel}</div>
      <div className="mt-1 text-[10px] text-[#757983] leading-none">{label}</div>
    </div>
  );
}

const FilterCurve = React.memo(function FilterCurve({
  type,
  cutoffKhz,
  resonance,
  driveDb = 0
}: {
  type: 'LP 24' | 'HP' | 'BP';
  cutoffKhz: number;
  resonance: number;
  driveDb?: number;
}) {
  const W = 260;
  const H = 80;
  const pts: string[] = [];
  const fc = Math.max(20, cutoffKhz * 1000);
  for (let i = 0; i <= 64; i++) {
    const f = 20 * Math.pow(1000, i / 64);
    const rr = f / fc;
    let mag: number;
    if (type === 'LP 24') mag = 1 / Math.sqrt(1 + Math.pow(rr, 8));
    else if (type === 'HP') mag = 1 / Math.sqrt(1 + Math.pow(1 / rr, 8));
    else mag = 1 / Math.sqrt(1 + Math.pow(Math.log(rr) / 0.9, 4));
    let db = 20 * Math.log10(Math.max(mag, 1e-4)) + driveDb * 0.6;
    db += resonance * 9 * Math.exp(-Math.pow(Math.log(rr) / 0.22, 2));
    const y = Math.max(3, Math.min(H - 3, ((12 - db) / 48) * H));
    pts.push(`${((i / 64) * W).toFixed(1)} ${y.toFixed(1)}`);
  }
  const line = `M ${pts.join(' L ')}`;
  return (
    <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="studioFilterFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5a36" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ff5a36" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill="url(#studioFilterFill)" />
      <path
        d={line}
        fill="none"
        stroke="#ff5a36"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
});

const ReverbCurve = React.memo(function ReverbCurve({
  mix,
  decaySec,
  toneKhz,
  mode
}: {
  mix: number;
  decaySec: number;
  toneKhz: number;
  mode: 'Room' | 'Hall' | 'Plate';
}) {
  const W = 260;
  const H = 80;
  const pts: string[] = [];
  const normDecay = Math.max(0.15, Math.min(1, decaySec / 6.0));
  const rate = mode === 'Room' ? 5.2 : mode === 'Plate' ? 3.5 : 2.8;
  const toneLift = 0.75 + 0.25 * (toneKhz / 16);
  const ampScale = Math.max(0.12, mix) * toneLift;

  for (let i = 0; i <= 64; i++) {
    const t = i / 64;
    const env = Math.exp((-t * rate) / normDecay) * ampScale;
    const y = Math.max(4, Math.min(H - 3, H - 4 - env * (H - 12)));
    pts.push(`${(t * W).toFixed(1)} ${y.toFixed(1)}`);
  }
  const line = `M ${pts.join(' L ')}`;

  const bars = 28;
  const reflectionBars: { x: number; y: number; h: number }[] = [];
  for (let i = 0; i < bars; i++) {
    const t = (i + 0.5) / bars;
    const env = Math.exp((-t * rate) / normDecay) * ampScale;
    const mod = 0.55 + 0.45 * Math.abs(Math.sin(i * 2.3 + (mode === 'Plate' ? 1 : 0)));
    const h = Math.max(2, env * mod * (H - 16));
    reflectionBars.push({ x: t * W, y: H - 3 - h, h });
  }

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="studioReverbFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5a36" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ff5a36" stopOpacity="0" />
        </linearGradient>
      </defs>
      {reflectionBars.map((b, idx) => (
        <rect key={idx} x={b.x} y={b.y} width={2.2} height={b.h} rx={1} fill="#ff5a36" fillOpacity={0.35} />
      ))}
      <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill="url(#studioReverbFill)" />
      <path
        d={line}
        fill="none"
        stroke="#ff5a36"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
});

const DelayCurve = React.memo(function DelayCurve({
  mix,
  feedback,
  cutoffKhz,
  sync
}: {
  mix: number;
  feedback: number;
  cutoffKhz: number;
  sync: '1/4' | '1/8' | '1/8D';
}) {
  const W = 260;
  const H = 80;
  const stepX = sync === '1/8' ? 32 : sync === '1/8D' ? 44 : 56;
  const taps: { x: number; h: number }[] = [];
  const brightness = 0.7 + 0.3 * (cutoffKhz / 12);
  let gain = Math.max(0.18, mix) * brightness;
  for (let x = 18; x < W - 8; x += stepX) {
    const h = Math.max(4, Math.min(H - 12, gain * (H - 14)));
    taps.push({ x, h });
    gain *= Math.max(0.15, feedback);
  }
  const pts = taps.map((t) => `${t.x.toFixed(1)} ${(H - 4 - t.h).toFixed(1)}`);
  const line = pts.length > 1 ? `M 0 ${H - 4} L ${pts.join(' L ')} L ${W} ${H - 4}` : `M 0 ${H - 4} L ${W} ${H - 4}`;

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="studioDelayFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5a36" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#ff5a36" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill="url(#studioDelayFill)" />
      {taps.map((t, i) => (
        <rect key={i} x={t.x - 2.5} y={H - 4 - t.h} width={5} height={t.h} rx={2} fill="#ff5a36" fillOpacity={0.85} />
      ))}
      <path
        d={line}
        fill="none"
        stroke="#ff5a36"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
});

const EqCurve = React.memo(function EqCurve({
  lowDb,
  midDb,
  highDb,
  lowCut
}: {
  lowDb: number;
  midDb: number;
  highDb: number;
  lowCut: boolean;
}) {
  const W = 260;
  const H = 80;
  const pts: string[] = [];
  for (let i = 0; i <= 64; i++) {
    const f = 20 * Math.pow(1000, i / 64);
    let db = 0;
    if (lowCut) {
      const hpRatio = 80 / f;
      db -= 10 * Math.log10(1 + Math.pow(hpRatio, 4));
    }
    const lowWeight = 1 / (1 + Math.pow(f / 160, 2));
    const midWeight = Math.exp(-Math.pow(Math.log(f / 1500) / 0.85, 2));
    const highWeight = 1 / (1 + Math.pow(4500 / f, 2));
    db += lowDb * lowWeight + midDb * midWeight + highDb * highWeight;
    const y = Math.max(4, Math.min(H - 4, H / 2 - (db / 16) * (H / 2 - 6)));
    pts.push(`${((i / 64) * W).toFixed(1)} ${y.toFixed(1)}`);
  }
  const line = `M ${pts.join(' L ')}`;
  return (
    <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="studioEqFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5a36" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ff5a36" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#262830" strokeWidth={1} strokeDasharray="3 3" />
      <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill="url(#studioEqFill)" />
      <path
        d={line}
        fill="none"
        stroke="#ff5a36"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
});

const DynamicsCurve = React.memo(function DynamicsCurve({
  thresholdDb,
  ratio,
  makeupDb
}: {
  thresholdDb: number;
  ratio: number;
  makeupDb: number;
}) {
  const W = 260;
  const H = 80;
  const pts: string[] = [];
  for (let i = 0; i <= 48; i++) {
    const inDb = -48 + i; // -48 dB to 0 dB
    let outDb = inDb;
    if (inDb > thresholdDb) {
      outDb = thresholdDb + (inDb - thresholdDb) / Math.max(1, ratio);
    }
    outDb = Math.min(3, outDb + makeupDb);
    const x = (i / 48) * W;
    const y = Math.max(4, Math.min(H - 4, ((0 - outDb) / 48) * (H - 8) + 4));
    pts.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  const line = `M ${pts.join(' L ')}`;
  return (
    <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="studioDynFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff5a36" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ff5a36" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1={0} y1={H - 4} x2={W} y2={4} stroke="#262830" strokeWidth={1} strokeDasharray="3 3" />
      <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill="url(#studioDynFill)" />
      <path
        d={line}
        fill="none"
        stroke="#ff5a36"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
});

function makeDriveCurve(driveDb: number) {
  const k = Math.max(0, driveDb) * 0.65;
  const n = 2048;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = k <= 0.02 ? x : Math.tanh(x * (1 + k)) / Math.tanh(1 + k);
  }
  return curve;
}

function buildReverbIR(
  ctx: BaseAudioContext,
  durationSec: number,
  mode: 'Room' | 'Hall' | 'Plate' = 'Hall'
): AudioBuffer {
  const rate = ctx.sampleRate || 48000;
  const dur = Math.max(0.3, Math.min(6.0, durationSec));
  const length = Math.floor(rate * dur);
  const ir = ctx.createBuffer(2, length, rate);
  const decayExp = mode === 'Room' ? 5.2 : mode === 'Plate' ? 3.8 : 3.0;
  const preDelaySamples = Math.floor(rate * (mode === 'Hall' ? 0.018 : mode === 'Room' ? 0.006 : 0.002));
  const damp = mode === 'Plate' ? 0.45 : mode === 'Room' ? 0.68 : 0.6;
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      if (i < preDelaySamples) {
        d[i] = 0;
        continue;
      }
      const t = (i - preDelaySamples) / Math.max(1, length - preDelaySamples);
      const env = Math.pow(1 - t, decayExp) * Math.min(1, (i - preDelaySamples) / (rate * 0.008));
      const white = Math.random() * 2 - 1;
      lp = lp * damp + white * (1 - damp);
      d[i] = lp * env * 0.22;
    }
  }
  return ir;
}

function MixFader({
  db,
  accent,
  onChange
}: {
  db: number;
  accent: string;
  onChange: (db: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pct = Math.max(0, Math.min(100, 5 + 2.1 * Math.abs(db)));
  const update = (clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const usable = Math.max(1, rect.height - 14);
    const y = Math.max(0, Math.min(1, (clientY - rect.top - 7) / usable)) * 100;
    const next = -(y - 5) / 2.1;
    onChange(Math.round(Math.max(-45, Math.min(0, next)) * 10) / 10);
  };
  return (
    <div
      ref={ref}
      className="relative w-8 shrink-0 touch-none cursor-ns-resize"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        update(e.clientY);
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) update(e.clientY);
      }}
      onDoubleClick={() => onChange(-3)}
    >
      <div className="absolute left-1/2 -translate-x-1/2 inset-y-[7px] w-[4px] rounded-full bg-[#0b0c0e] border border-[#1d1e23]" />
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[30px] h-[14px] rounded-[5px] border border-[#4a4d55] bg-gradient-to-b from-[#3d4047] to-[#26282d] shadow-md flex items-center justify-center"
        style={{ top: `calc((100% - 14px) * ${pct / 100})` }}
      >
        <span className="w-[16px] h-[2px] rounded-full" style={{ background: accent }} />
      </div>
    </div>
  );
}

function MixMeter({ levels, wide = false }: { levels: number[]; wide?: boolean }) {
  return (
    <div className="flex gap-[3px] py-[7px]">
      {levels.map((lv, i) => {
        const level = Math.max(0, Math.min(1, lv));
        return (
          <div
            key={i}
            className={`relative ${wide ? 'w-[9px]' : 'w-[7px]'} rounded-[2px] bg-[#111215] overflow-hidden`}
          >
            {level > 0.005 && (
              <div
                className="absolute bottom-0 inset-x-0"
                style={{
                  height: `${level * 100}%`,
                  backgroundImage:
                    'linear-gradient(to top, #4ade80 0%, #4ade80 62%, #d9e04a 80%, #fb923c 100%)',
                  backgroundSize: `100% ${(1 / level) * 100}%`,
                  backgroundPosition: 'bottom'
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export const UserRecordStudioModal: React.FC<UserRecordStudioModalProps> = ({
  isOpen = true,
  onClose,
  preselectedTrack,
  availableTracks = [],
  isStandalonePage = false
}) => {
  const { isSubscribed } = useUserSubscription();

  // Active Beat & Session metadata
  const [selectedTrack, setSelectedTrack] = useState<TrackItem | null>(preselectedTrack || null);
  const [projectTitle, setProjectTitle] = useState('Untitled session');
  const [beatPickerOpen, setBeatPickerOpen] = useState(false);
  const [beatSearchQuery, setBeatSearchQuery] = useState('');
  const [beatGenreFilter, setBeatGenreFilter] = useState('All');
  const [isAuditioningId, setIsAuditioningId] = useState<string | null>(null);

  // DAW State & Transport
  const [recordState, setRecordState] = useState<'idle' | 'countdown' | 'recording' | 'preview'>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(0);
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [isMetronomeEnabled, setIsMetronomeEnabled] = useState(false);
  const [isLoopEnabled, setIsLoopEnabled] = useState(false);
  const [isCountInEnabled, setIsCountInEnabled] = useState(true);

  // Multi-Track State: Track 1 (Beat)
  const [beatMuted, setBeatMuted] = useState(false);
  const [beatSolo, setBeatSolo] = useState(false);
  const [beatVolume, setBeatVolume] = useState(1.0); // 1.0 = 0.0 dB full Beat Store master quality
  const [beatPan, setBeatPan] = useState(0); // -100 to +100

  // Audio Hardware Latency Compensation Offset (ms) - aligns mic delay with backing track
  const [globalLatencyMs, setGlobalLatencyMs] = useState<number>(0);

  // Multi-Track State: Vocal Tracks (Lead Vocal + Multiple Backup Vocals)
  const [vocalTracks, setVocalTracks] = useState<StudioVocalTrack[]>([
    {
      id: 'trk_lead',
      name: 'Lead Vocal',
      type: 'lead',
      color: '#2dd4bf',
      isArmed: true,
      isMuted: false,
      isSolo: false,
      volume: 1.0,
      pan: 0,
      vocalBlob: null,
      vocalUrl: null,
      durationSeconds: 0,
      latencyOffsetMs: 0
    },
    {
      id: 'trk_backup_1',
      name: 'Backup 1',
      type: 'backup',
      color: '#f59e0b',
      isArmed: false,
      isMuted: false,
      isSolo: false,
      volume: 0.85,
      pan: -40,
      vocalBlob: null,
      vocalUrl: null,
      durationSeconds: 0,
      latencyOffsetMs: 0
    }
  ]);

  // Master Output & Input Monitoring
  const [masterVolume, setMasterVolume] = useState(1.0);
  const [inputGain, setInputGain] = useState(1.0);
  const [inputLevelMeter, setInputLevelMeter] = useState(0);
  const [masterMeterL, setMasterMeterL] = useState(0);
  const [masterMeterR, setMasterMeterR] = useState(0);

  // DSP Console: collapsed by default on mobile to free up track timeline space
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  // DSP Effects (Auto-Tune Pro, Reverb, Delay, EQ, Compressor)
  const [autoTuneEnabled, setAutoTuneEnabled] = useState(true);
  const [autoTuneSpeed, setAutoTuneSpeed] = useState<'hard' | 'fast' | 'subtle'>('fast');
  const [autoTuneAmount, setAutoTuneAmount] = useState(0.65); // 0 to 1
  const [autoTuneKey, setAutoTuneKey] = useState('F Minor'); // canonical key string, e.g. 'F Minor', 'C Major'
  const [reverbAmount, setReverbAmount] = useState(0.12);
  const [delayAmount, setDelayAmount] = useState(0.06);
  const [eqLow, setEqLow] = useState(0); // dB
  const [eqMid, setEqMid] = useState(0.5); // dB
  const [eqHigh, setEqHigh] = useState(1.0); // dB
  const [compressorEnabled, setCompressorEnabled] = useState(true);
  const [lowCutEnabled, setLowCutEnabled] = useState(true);


  // =========================================================================
  // BANDLAB PRO DAW WORKSTATION STATE
  // =========================================================================
  const [timeSignature, setTimeSignature] = useState<'4/4' | '3/4' | '6/8'>('4/4');
  const [timeSigDropdownOpen, setTimeSigDropdownOpen] = useState(false);
  const [keyDropdownOpen, setKeyDropdownOpen] = useState(false);
  const [bpmInputOpen, setBpmInputOpen] = useState(false);
  const [sessionBpm, setSessionBpm] = useState<number>(selectedTrack?.bpm || 92);
  const [masteringPreset, setMasteringPreset] = useState<'Select Preset' | 'Universal' | 'Warm' | 'Clarity' | 'Bass Boost'>('Universal');
  const [masteringDropdownOpen, setMasteringDropdownOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'autopitch' | 'fx' | 'editor' | 'input' | 'output'>('autopitch');
  const [autoPitchCategory, setAutoPitchCategory] = useState<'Essentials' | 'Modern Rap' | 'Afrobeat' | 'Pop' | 'R&B'>('Essentials');
  const [autoPitchPreset, setAutoPitchPreset] = useState<'Classic' | 'Duet' | 'Big Harmony' | 'Natural' | 'Third' | 'Octave'>('Classic');
  const [selectedTrackTab, setSelectedTrackTab] = useState<string>('trk_lead');
  const [audioInputDevice, setAudioInputDevice] = useState<string>('default');
  const [availableMics, setAvailableMics] = useState<{ deviceId: string; label: string }[]>([
    { deviceId: 'default', label: 'Default Studio Microphone' }
  ]);
  const [audioOutputDevice, setAudioOutputDevice] = useState<string>('default');
  const [availableOutputs, setAvailableOutputs] = useState<{ deviceId: string; label: string }[]>([
    { deviceId: 'default', label: 'System Default Output (Speakers / Headphones)' }
  ]);
  const [audioInputChannel, setAudioInputChannel] = useState<'Channel 1 (Mono)' | 'Channel 2' | 'Stereo'>('Channel 1 (Mono)');
  const [isInputMonitoring, setIsInputMonitoring] = useState<boolean>(false);

  // =========================================================================
  // STUDIO MULTI-TRACK ARRANGEMENT & MIXER STATE (Loop Studio UI)
  // =========================================================================
  interface StudioArrangementTrack {
    id: string;
    name: string;
    sub: string;
    type: 'audio' | 'midi';
    color: string;
    borderColor: string;
    dotColor: string;
    volumeDb: number;
    isMuted: boolean;
    isSolo: boolean;
    meterLevel: number;
  }

  const [studioTracks, setStudioTracks] = useState<StudioArrangementTrack[]>([
    {
      id: 'drums',
      name: 'Drums',
      sub: 'Audio · Break 92',
      type: 'audio',
      color: '#8a5d29',
      borderColor: '#b07936',
      dotColor: '#e67e22',
      volumeDb: -3.5,
      isMuted: false,
      isSolo: false,
      meterLevel: 0.72
    },
    {
      id: 'bass',
      name: 'Bass',
      sub: 'MIDI · Sub bass',
      type: 'midi',
      color: '#243750',
      borderColor: '#3d5678',
      dotColor: '#3498db',
      volumeDb: -5.0,
      isMuted: false,
      isSolo: false,
      meterLevel: 0.65
    },
    {
      id: 'rhodes',
      name: 'Rhodes',
      sub: 'Audio · Mk I',
      type: 'audio',
      color: '#35452f',
      borderColor: '#4f6345',
      dotColor: '#78e08f',
      volumeDb: -7.5,
      isMuted: false,
      isSolo: false,
      meterLevel: 0.58
    },
    {
      id: 'vox_chop',
      name: 'Vox chop',
      sub: 'Audio · Sampler',
      type: 'audio',
      color: '#522b3e',
      borderColor: '#6b3b52',
      dotColor: '#e056fd',
      volumeDb: -6.0,
      isMuted: false,
      isSolo: false,
      meterLevel: 0.61
    },
    {
      id: 'pad',
      name: 'Pad',
      sub: 'MIDI · Strings',
      type: 'midi',
      color: '#3b3455',
      borderColor: '#4b436b',
      dotColor: '#9b59b6',
      volumeDb: -9.0,
      isMuted: false,
      isSolo: false,
      meterLevel: 0.45
    },
    {
      id: 'fx',
      name: 'FX',
      sub: 'Audio · Risers',
      type: 'audio',
      color: '#183e42',
      borderColor: '#2a555a',
      dotColor: '#1abc9c',
      volumeDb: -12.0,
      isMuted: false,
      isSolo: false,
      meterLevel: 0.38
    }
  ]);

  const [selectedStudioTrackId, setSelectedStudioTrackId] = useState<string>('rhodes');
  const [inspectorFxTab, setInspectorFxTab] = useState<'filter' | 'reverb' | 'delay' | 'eq' | 'dynamics'>('filter');
  const [filterType, setFilterType] = useState<'LP 24' | 'HP' | 'BP'>('LP 24');
  const [filterCutoff, setFilterCutoff] = useState<number>(20.0);
  const [filterResonance, setFilterResonance] = useState<number>(0.0);
  const [filterDrive, setFilterDrive] = useState<number>(0.0);
  const [reverbMode, setReverbMode] = useState<'Room' | 'Hall' | 'Plate'>('Hall');
  const [reverbDecay, setReverbDecay] = useState<number>(2.0);
  const [reverbTone, setReverbTone] = useState<number>(7.5);
  const [delaySync, setDelaySync] = useState<'1/4' | '1/8' | '1/8D'>('1/8');
  const [delayFeedback, setDelayFeedback] = useState<number>(0.28);
  const [delayCutoff, setDelayCutoff] = useState<number>(3.5);
  const [eqPreset, setEqPreset] = useState<'80Hz Cut' | 'Flat' | 'Air'>('80Hz Cut');
  const [dynamicsMode, setDynamicsMode] = useState<'Vocal' | 'Punch' | 'Limit'>('Vocal');
  const [compThreshold, setCompThreshold] = useState<number>(-18.0);
  const [compRatio, setCompRatio] = useState<number>(2.5);
  const [compMakeup, setCompMakeup] = useState<number>(0.0);
  const [masterDb, setMasterDb] = useState<number>(-1.2);
  const [selectedClipId, setSelectedClipId] = useState<string>('trk_lead');
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);
  const [isLyricsDrawerOpen, setIsLyricsDrawerOpen] = useState<boolean>(false);
  const [mutedScaleNotes, setMutedScaleNotes] = useState<string[]>([]);
  const [loopStartBar, setLoopStartBar] = useState<number>(1);
  const [loopEndBar, setLoopEndBar] = useState<number>(5);
  const [isAutoMixRunning, setIsAutoMixRunning] = useState<boolean>(false);
  const [autoMixSuccess, setAutoMixSuccess] = useState<boolean>(false);

  // Acoustic Shield / Phone Mic Cleaner (Echo Cancellation & Noise Suppression)
  const [micCleanFilter, setMicCleanFilter] = useState(true);

  // Live recording waveform animation
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  // Ref mirrors recordingSeconds so recorder.onstop closure reads the live value (avoids stale closure bug)
  const recordingSecondsRef = useRef(0);
  const [liveWaveformHistory, setLiveWaveformHistory] = useState<number[]>([]);

  // Console Tabs: 'fx' | 'mixer' | 'lyrics' | 'cloud'
  const [activeConsoleTab, setActiveConsoleTab] = useState<'fx' | 'mixer' | 'lyrics' | 'cloud'>('fx');
  const [lyricsText, setLyricsText] = useState(
    '// Write rhymes, hooks, and harmonies here while you record in the studio...\n[Lead Vocal]\n\n[Backup Vocals / Harmonies]\n'
  );

  // Cloud Storage & Database Save State
  const [artistName, setArtistName] = useState('Caution Artist');
  const [socialHandle, setSocialHandle] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [cloudSaveResult, setCloudSaveResult] = useState<{
    vocalStems?: any[];
    masterUrl?: string;
    message?: string;
  } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // =========================================================================
  // STUDIO LOCATORS & EXPORT RANGE
  // =========================================================================
  // 'recorded': Auto-detects end of recorded vocals (exports only recorded song length)
  // 'custom': User-positioned [R] Right Locator on timeline
  // 'full': Full length of backing instrumental beat
  const [exportRangeMode, setExportRangeMode] = useState<'recorded' | 'custom' | 'full'>('recorded');
  const [customExportEndSeconds, setCustomExportEndSeconds] = useState<number | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState<boolean>(false);
  const [isDraggingLocator, setIsDraggingLocator] = useState<boolean>(false);
  const rulerRef = useRef<HTMLDivElement | null>(null);

  // Calculate furthest recorded vocal end time across all takes (including punch-in / startTimeSec offset)
  const maxRecordedVocalDuration = useMemo(() => {
    const recorded = vocalTracks.filter((t) => t.vocalBlob !== null && t.durationSeconds > 0);
    if (recorded.length === 0) return 0;
    return Math.max(
      ...recorded.map((t) => {
        const start = Math.max(0, t.startTimeSec ?? 0);
        const rate = Math.max(0.75, Math.min(1.25, t.playbackRate ?? 1.0));
        const trimIn = Math.max(0, t.trimStartSec ?? 0);
        const trimOut = Math.max(trimIn + 0.1, t.trimEndSec ?? t.durationSeconds);
        return start + (trimOut - trimIn) / rate;
      })
    );
  }, [vocalTracks]);

  // Effective export length in seconds (locator [R] stop position)
  const effectiveExportDuration = useMemo(() => {
    const beatDuration = selectedTrack?.durationSeconds || 180;
    if (exportRangeMode === 'recorded') {
      return maxRecordedVocalDuration > 0 ? Math.min(beatDuration, maxRecordedVocalDuration) : beatDuration;
    }
    if (exportRangeMode === 'full') {
      return beatDuration;
    }
    if (exportRangeMode === 'custom') {
      if (customExportEndSeconds && customExportEndSeconds > 0) {
        return Math.min(beatDuration, Math.max(1, customExportEndSeconds));
      }
      return maxRecordedVocalDuration > 0 ? Math.min(beatDuration, maxRecordedVocalDuration) : beatDuration;
    }
    return beatDuration;
  }, [exportRangeMode, customExportEndSeconds, maxRecordedVocalDuration, selectedTrack?.durationSeconds]);

  // Drag handler for interactive [R] Right Locator on the timeline ruler
  const handleLocatorDrag = useCallback(
    (clientX: number) => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const ratio = Math.max(0.01, Math.min(1, clickX / rect.width));
      const totalDuration = selectedTrack?.durationSeconds || 180;
      const newSec = Math.max(1, Number((ratio * totalDuration).toFixed(1)));
      setExportRangeMode('custom');
      setCustomExportEndSeconds(newSec);
    },
    [selectedTrack?.durationSeconds]
  );

  useEffect(() => {
    if (!isDraggingLocator) return;
    const onMouseMove = (e: MouseEvent) => {
      handleLocatorDrag(e.clientX);
    };
    const onMouseUp = () => {
      setIsDraggingLocator(false);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDraggingLocator, handleLocatorDrag]);

  // Audio Element Refs
  const beatAudioRef = useRef<HTMLAudioElement | null>(null);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);
  const vocalAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Hardware Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playheadIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Live Playback Web Audio Graph ───────────────────────────────────────
  // Persistent AudioContext used ONLY for live playback (separate from recording ctx)
  const playCtxRef = useRef<AudioContext | null>(null);
  const dspGraphVersionRef = useRef<number>(0);
  // Per-element nodes: MediaElementSource, GainNode, StereoPannerNode
  type ElNodes = { source: MediaElementAudioSourceNode; gain: GainNode; panner: StereoPannerNode };
  const beatNodesRef = useRef<ElNodes | null>(null);
  const vocalNodesRef = useRef<Map<string, ElNodes>>(new Map());
  // Global shared DSP chain nodes (created once, connected to destination)
  const dspVocalSyncDelayRef = useRef<DelayNode | null>(null);
  const dspAutoTuneFilterRef = useRef<BiquadFilterNode | null>(null);
  const dspAutoTuneHarmonicRef = useRef<WaveShaperNode | null>(null);
  const dspAutoTuneWetRef = useRef<GainNode | null>(null);
  const dspAutoTuneDryRef = useRef<GainNode | null>(null);
  const dspFxBusRef = useRef<GainNode | null>(null);
  const dspFilterDriveRef = useRef<WaveShaperNode | null>(null);
  const dspFilterRef = useRef<BiquadFilterNode | null>(null);
  const dspLowCutRef = useRef<BiquadFilterNode | null>(null);
  const dspEqLowRef = useRef<BiquadFilterNode | null>(null);
  const dspEqMidRef = useRef<BiquadFilterNode | null>(null);
  const dspEqHighRef = useRef<BiquadFilterNode | null>(null);
  const dspDelayRef = useRef<DelayNode | null>(null);
  const dspDelayFeedbackRef = useRef<GainNode | null>(null);
  const dspDelayFilterRef = useRef<BiquadFilterNode | null>(null);
  const dspDelayGainRef = useRef<GainNode | null>(null); // wet
  const dspDelayDryRef = useRef<GainNode | null>(null);  // dry bypass
  const dspReverbRef = useRef<ConvolverNode | null>(null);
  const dspReverbToneRef = useRef<BiquadFilterNode | null>(null);
  const dspReverbGainRef = useRef<GainNode | null>(null);
  const dspReverbDryRef = useRef<GainNode | null>(null);
  const dspCompressorRef = useRef<DynamicsCompressorNode | null>(null);
  const dspMakeupGainRef = useRef<GainNode | null>(null);
  const dspMasterGainRef = useRef<GainNode | null>(null);
  // DSP vocal input bus (all vocal track panners connect here)
  const dspBusRef = useRef<GainNode | null>(null);

  // Apply chosen audio output device (sinkId) to AudioContext and all HTMLAudioElements
  const applyAudioOutputSinkId = useCallback(async (deviceId: string) => {
    const sinkTarget = !deviceId || deviceId === 'default' ? '' : deviceId;
    try {
      const ctx = playCtxRef.current as any;
      if (ctx && typeof ctx.setSinkId === 'function') {
        await ctx.setSinkId(sinkTarget);
      }
    } catch (_) {}
    const applyEl = async (el: HTMLAudioElement | null | undefined) => {
      if (!el) return;
      try {
        if (typeof (el as any).setSinkId === 'function') {
          await (el as any).setSinkId(sinkTarget);
        }
      } catch (_) {}
    };
    await applyEl(beatAudioRef.current);
    await applyEl(auditionAudioRef.current);
    vocalAudioRefs.current.forEach((el) => {
      applyEl(el);
    });
  }, []);

  const refreshAudioDevices = useCallback(async () => {
    try {
      if (typeof window === 'undefined' || !navigator?.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, idx) => ({
          deviceId: d.deviceId || `mic-${idx}`,
          label: d.label || (d.deviceId === 'default' ? 'Default Studio Microphone' : `Microphone ${idx + 1}`)
        }));
      if (mics.length > 0) {
        setAvailableMics(mics);
      }

      const outputs = devices
        .filter((d) => d.kind === 'audiooutput')
        .map((d, idx) => ({
          deviceId: d.deviceId || `out-${idx}`,
          label:
            d.label ||
            (d.deviceId === 'default'
              ? 'System Default Output (Speakers / Headphones)'
              : `Audio Output ${idx + 1}`)
        }));
      if (outputs.length > 0) {
        setAvailableOutputs(outputs);
      }
    } catch (_) {}
  }, []);

  // Track initial preselected track ID so modal initialization works,
  // but user manual selections inside Track 01 are never forcibly overridden!
  const lastPreselectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (preselectedTrack && preselectedTrack.id !== lastPreselectedIdRef.current) {
        lastPreselectedIdRef.current = preselectedTrack.id;
        setSelectedTrack(preselectedTrack);
      }
    } else {
      lastPreselectedIdRef.current = null;
    }
  }, [isOpen, preselectedTrack]);

  // Metronome tick generator
  const playMetronomeTick = useCallback((accent: boolean = false) => {
    try {
      const ctx = playCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = accent ? 1200 : 800;
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }, []);

  // Metronome interval during recording/playback
  useEffect(() => {
    if (isMetronomeEnabled && (isRecording || isPlaying) && selectedTrack?.bpm) {
      const intervalMs = (60 / selectedTrack.bpm) * 1000;
      let tickCount = 0;
      const metroInterval = setInterval(() => {
        playMetronomeTick(tickCount % 4 === 0);
        tickCount++;
      }, intervalMs);
      return () => clearInterval(metroInterval);
    }
  }, [isMetronomeEnabled, isRecording, isPlaying, selectedTrack?.bpm, playMetronomeTick]);

  // Clean up AudioContext & MediaRecorder on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (playheadIntervalRef.current) clearInterval(playheadIntervalRef.current);
    };
  }, []);

  // Live Microphone Analyser for Input Level RMS Meter + Device Enumeration + Live Monitoring
  useEffect(() => {
    let animId: number;
    let localStream: MediaStream | null = null;
    let localCtx: AudioContext | null = null;

    if (typeof window !== 'undefined' && navigator?.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshAudioDevices);
    }

    // Enumerate devices passively without opening a live mic capture stream!
    // CRITICAL: Holding getUserMedia open while NOT recording forces macOS / Windows / Bluetooth
    // headphones into 8kHz/16kHz Hands-Free Telephony (phone-call) audio mode!
    refreshAudioDevices();

    if (isRecording || !isInputMonitoring) {
      if (!isRecording) setInputLevelMeter(0);
      return () => {
        if (typeof window !== 'undefined' && navigator?.mediaDevices?.removeEventListener) {
          navigator.mediaDevices.removeEventListener('devicechange', refreshAudioDevices);
        }
      };
    }

    async function initLiveMicMonitor() {
      try {
        if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) return;
        const audioConstraints: MediaTrackConstraints = {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          ...(audioInputDevice && audioInputDevice !== 'default' ? { deviceId: { ideal: audioInputDevice } } : {})
        };
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: audioConstraints
        });
        localStream = stream;

        await refreshAudioDevices();

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx({ latencyHint: 'interactive' });
        localCtx = ctx;
        const source = ctx.createMediaStreamSource(stream);

        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = micCleanFilter ? 85 : 20;
        hp.Q.value = 0.707;
        source.connect(hp);

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        hp.connect(analyser);

        if (audioOutputDevice && audioOutputDevice !== 'default' && typeof (ctx as any).setSinkId === 'function') {
          try {
            await (ctx as any).setSinkId(audioOutputDevice);
          } catch (_) {}
        }
        const monGain = ctx.createGain();
        monGain.gain.value = Math.min(1.2, inputGain * 0.85);
        hp.connect(monGain);
        monGain.connect(ctx.destination);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const measure = () => {
          analyser.getByteTimeDomainData(dataArray);
          let sumSquares = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const norm = (dataArray[i] - 128) / 128;
            sumSquares += norm * norm;
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);
          const scaledPct = Math.min(100, Math.round(rms * 320 * inputGain));
          setInputLevelMeter(scaledPct);
          animId = requestAnimationFrame(measure);
        };
        measure();
      } catch (e) {}
    }

    if (isOpen || isStandalonePage) {
      initLiveMicMonitor();
    }

    return () => {
      if (typeof window !== 'undefined' && navigator?.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener('devicechange', refreshAudioDevices);
      }
      if (animId) cancelAnimationFrame(animId);
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (localCtx) {
        localCtx.close().catch(() => {});
      }
    };
  }, [
    isOpen,
    isStandalonePage,
    isRecording,
    inputGain,
    audioInputDevice,
    audioOutputDevice,
    micCleanFilter,
    isInputMonitoring,
    refreshAudioDevices
  ]);

  // Audition track preview inside beat switcher
  const handleAuditionToggle = (track: TrackItem) => {
    if (isAuditioningId === track.id) {
      if (auditionAudioRef.current) auditionAudioRef.current.pause();
      setIsAuditioningId(null);
    } else {
      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
        const url = track.audioUrl || '';
        auditionAudioRef.current.src = url;
        auditionAudioRef.current.play().catch(() => {});
        setIsAuditioningId(track.id);
      }
    }
  };

  // Select beat cleanly, updating audio source and timeline without wiping recorded vocal tracks
  const handleSelectBeat = (track: TrackItem) => {
    if (auditionAudioRef.current) {
      auditionAudioRef.current.pause();
      setIsAuditioningId(null);
    }
    if (isPlaying) {
      if (beatAudioRef.current) beatAudioRef.current.pause();
      vocalAudioRefs.current.forEach((el) => el.pause());
      setIsPlaying(false);
      if (playheadIntervalRef.current) clearInterval(playheadIntervalRef.current);
    }
    setSelectedTrack(track);
    setPlayheadTime(0);
    if (beatAudioRef.current) {
      beatAudioRef.current.src = track.audioUrl || '';
      beatAudioRef.current.currentTime = 0;
    }
    setBeatPickerOpen(false);
  };

  // Filtered beats for search & genre picker
  const filteredBeats = availableTracks.filter((b) => {
    const query = beatSearchQuery.trim().toLowerCase();
    const matchesSearch =
      query === '' ||
      b.title.toLowerCase().includes(query) ||
      (b.artist && b.artist.toLowerCase().includes(query)) ||
      (b.genre && b.genre.toLowerCase().includes(query));
    const matchesGenre =
      beatGenreFilter === 'All' ||
      (b.genre && b.genre.toLowerCase() === beatGenreFilter.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  // Add a new Backup Vocal Track
  const handleAddBackupVocalTrack = () => {
    const backupCount = vocalTracks.filter((t) => t.type === 'backup').length + 1;
    const colorIndex = (vocalTracks.length) % TRACK_PALETTE.length;
    // Alternate stereo panning between Left & Right for instant wide harmony
    const autoPan = backupCount % 2 === 1 ? -45 : 45;

    const newTrack: StudioVocalTrack = {
      id: `trk_backup_${Date.now()}`,
      name: `Backup ${backupCount}`,
      type: 'backup',
      color: TRACK_PALETTE[colorIndex],
      isArmed: false,
      isMuted: false,
      isSolo: false,
      volume: 0.85,
      pan: autoPan,
      vocalBlob: null,
      vocalUrl: null,
      durationSeconds: 0,
      latencyOffsetMs: 0
    };

    setVocalTracks((prev) => [...prev, newTrack]);
  };

  // Adjust vocal latency compensation offset in milliseconds (-250ms delays vocal, +250ms advances vocal)
  const handleNudgeLatency = (trackId: string, deltaMs: number) => {
    setVocalTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const current = t.latencyOffsetMs !== undefined ? t.latencyOffsetMs : globalLatencyMs;
          const next = Math.max(-250, Math.min(250, current + deltaMs));
          if (dspVocalSyncDelayRef.current && playCtxRef.current) {
            const delaySec = next < 0 ? Math.min(0.5, Math.abs(next) / 1000) : 0;
            dspVocalSyncDelayRef.current.delayTime.setTargetAtTime(delaySec, playCtxRef.current.currentTime, 0.01);
          }
          const el = vocalAudioRefs.current.get(trackId);
          if (el && beatAudioRef.current && isPlaying) {
            el.currentTime = Math.max(0, beatAudioRef.current.currentTime + Math.max(0, next / 1000));
          }
          return { ...t, latencyOffsetMs: next };
        }
        return t;
      })
    );
  };

  const handleSetLatency = (trackId: string, ms: number) => {
    const clamped = Math.max(-250, Math.min(250, ms));
    setVocalTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, latencyOffsetMs: clamped } : t))
    );
    if (dspVocalSyncDelayRef.current && playCtxRef.current) {
      const delaySec = clamped < 0 ? Math.min(0.5, Math.abs(clamped) / 1000) : 0;
      dspVocalSyncDelayRef.current.delayTime.setTargetAtTime(delaySec, playCtxRef.current.currentTime, 0.01);
    }
  };

  // Refs to measure exact beat start/end positions during recording for automatic vocal-to-beat speed calibration
  const recBeatStartSecRef = useRef<number>(0);
  const recBeatEndSecRef = useRef<number>(0);

  // Live ref to vocalTracks so playback intervals & drag handlers never read stale state closures
  const vocalTracksRef = useRef<StudioVocalTrack[]>(vocalTracks);
  useEffect(() => {
    vocalTracksRef.current = vocalTracks;
  }, [vocalTracks]);

  // Automatically upgrade any existing non-WAV MediaRecorder vocalBlob in state to a 100% seekable 16-bit PCM WAV Blob
  // (Ensures even previously recorded WebM takes in the session can seek to any moved/trimmed position immediately!)
  useEffect(() => {
    vocalTracks.forEach((t) => {
      if (t.vocalBlob && t.vocalBlob.type !== 'audio/wav') {
        const blobToUpgrade = t.vocalBlob;
        const trackId = t.id;
        (async () => {
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const tempCtx = new AudioCtx();
            const arrBuf = await blobToUpgrade.arrayBuffer();
            const decoded = await tempCtx.decodeAudioData(arrBuf);
            tempCtx.close().catch(() => {});
            if (decoded && decoded.duration > 0.15 && Number.isFinite(decoded.duration)) {
              const wavBlob = audioBufferToWav(decoded);
              const wavUrl = URL.createObjectURL(wavBlob);
              const exactDur = Number(decoded.duration.toFixed(3));
              setVocalTracks((prev) => {
                const next = prev.map((tr) =>
                  tr.id === trackId && tr.vocalBlob === blobToUpgrade
                    ? {
                        ...tr,
                        vocalBlob: wavBlob,
                        vocalUrl: wavUrl,
                        durationSeconds: exactDur,
                        trimEndSec: tr.trimEndSec ? Math.min(exactDur, tr.trimEndSec) : exactDur
                      }
                    : tr
                );
                vocalTracksRef.current = next;
                return next;
              });
            }
          } catch (_) {}
        })();
      }
    });
  }, [vocalTracks]);

  // Helper: get current master beat playhead time
  const getCurrentMasterSec = () => {
    if (beatAudioRef.current && !beatAudioRef.current.paused) {
      return beatAudioRef.current.currentTime;
    }
    return playheadTime;
  };

  // Authoritative sync for a single vocal track <audio> element at timeline position `masterSec`
  const syncSingleVocalTrackToMasterTime = (
    t: StudioVocalTrack,
    masterSec: number,
    currentlyPlaying: boolean,
    forceSeek: boolean = false
  ) => {
    const el = vocalAudioRefs.current.get(t.id);
    if (!el || !t.vocalUrl) return;

    const rate = Math.max(0.75, Math.min(1.25, t.playbackRate ?? 1.0));
    if ('preservesPitch' in el) (el as any).preservesPitch = true;
    if ('mozPreservesPitch' in el) (el as any).mozPreservesPitch = true;
    if ('webkitPreservesPitch' in el) (el as any).webkitPreservesPitch = true;
    if (Math.abs(el.playbackRate - rate) > 0.002) {
      el.playbackRate = rate;
    }

    const offsetSec = (t.latencyOffsetMs !== undefined ? t.latencyOffsetMs : globalLatencyMs) / 1000;
    const trimIn = Math.max(0, t.trimStartSec ?? 0);
    const fileDur =
      el.duration && Number.isFinite(el.duration) && el.duration > 0.1
        ? el.duration
        : t.durationSeconds || 999;
    const trimOut = Math.min(fileDur, Math.max(trimIn + 0.1, t.trimEndSec ?? t.durationSeconds ?? fileDur));

    // Exact timeline window [clipStart, clipEnd) where this vocal clip exists on the beat
    const clipStart = (t.startTimeSec ?? 0) - offsetSec;
    const clipEnd = clipStart + (trimOut - trimIn) / rate;

    const anySoloNow = vocalTracksRef.current.some((tr) => tr.isSolo) || beatSolo;
    const trackShouldBeAudible = anySoloNow ? t.isSolo : !t.isMuted;
    const nodes = vocalNodesRef.current.get(t.id);

    if (masterSec >= clipStart && masterSec < clipEnd - 0.03) {
      // Playhead is INSIDE the vocal clip's timeline region -> unmute track gain & play from exact offset!
      if (nodes && playCtxRef.current) {
        const targetG = trackShouldBeAudible ? Math.max(0, Math.min(2, t.volume)) : 0;
        nodes.gain.gain.value = targetG;
        nodes.gain.gain.setValueAtTime(targetG, playCtxRef.current.currentTime);
      }
      const expectedVocalSec = Math.max(trimIn, Math.min(trimOut - 0.03, trimIn + (masterSec - clipStart) * rate));
      if (currentlyPlaying) {
        if (el.paused) {
          try {
            el.currentTime = expectedVocalSec;
          } catch (_) {}
          el.play().catch(() => {});
        } else if (forceSeek || Math.abs(el.currentTime - expectedVocalSec) > 0.065) {
          try {
            el.currentTime = expectedVocalSec;
          } catch (_) {}
        }
      } else {
        if (!el.paused) el.pause();
        try {
          el.currentTime = expectedVocalSec;
        } catch (_) {}
      }
    } else {
      // Playhead is BEFORE clipStart or AFTER clipEnd -> strictly silence gain AND pause <audio> element!
      if (nodes && playCtxRef.current) {
        nodes.gain.gain.value = 0;
        nodes.gain.gain.setValueAtTime(0, playCtxRef.current.currentTime);
      }
      if (!el.paused) {
        el.pause();
      }
      if (forceSeek) {
        try {
          el.currentTime = trimIn;
        } catch (_) {}
      }
    }
  };

  // Move vocal clip forward (+deltaSec) or backward (-deltaSec) along the timeline
  const handleMoveVocalClip = (trackId: string, deltaSec: number) => {
    const maxBeatSec = selectedTrack?.durationSeconds || 180;
    const masterSec = getCurrentMasterSec();
    setVocalTracks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== trackId) return t;
        const curStart = t.startTimeSec ?? 0;
        const nextStart = Number(Math.max(-15, Math.min(maxBeatSec - 0.2, curStart + deltaSec)).toFixed(3));
        const actualShift = nextStart - curStart;
        const nextClips = t.clips?.map((c) => ({
          ...c,
          startTimeSec: Number(Math.max(0, c.startTimeSec + actualShift).toFixed(3))
        }));
        const updated = { ...t, startTimeSec: nextStart, clips: nextClips };
        syncSingleVocalTrackToMasterTime(updated, masterSec, isPlaying, true);
        return updated;
      });
      vocalTracksRef.current = next;
      return next;
    });
  };

  const handleSetVocalStartTime = (trackId: string, startSec: number) => {
    const maxBeatSec = selectedTrack?.durationSeconds || 180;
    const clamped = Number(Math.max(-15, Math.min(maxBeatSec - 0.2, startSec)).toFixed(3));
    const masterSec = getCurrentMasterSec();
    setVocalTracks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== trackId) return t;
        const curStart = t.startTimeSec ?? 0;
        const actualShift = clamped - curStart;
        const nextClips = t.clips?.map((c) => ({
          ...c,
          startTimeSec: Number(Math.max(0, c.startTimeSec + actualShift).toFixed(3))
        }));
        const updated = { ...t, startTimeSec: clamped, clips: nextClips };
        syncSingleVocalTrackToMasterTime(updated, masterSec, isPlaying, true);
        return updated;
      });
      vocalTracksRef.current = next;
      return next;
    });
  };

  // Trim start of vocal clip (dragging left handle `[` right trims into the take & shifts startTimeSec so the rest of the vocal stays anchored on the beat)
  const handleTrimVocalStart = (trackId: string, deltaSec: number) => {
    const masterSec = getCurrentMasterSec();
    setVocalTracks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== trackId) return t;
        const dur = Math.max(0.2, t.durationSeconds || 1);
        const rate = Math.max(0.5, Math.min(1.5, t.playbackRate ?? 1.0));
        const curTrimIn = t.trimStartSec ?? 0;
        const curTrimOut = t.trimEndSec ?? dur;
        const nextTrimIn = Number(
          Math.max(0, Math.min(curTrimOut - 0.15, curTrimIn + deltaSec * rate)).toFixed(3)
        );
        const actualSourceDelta = nextTrimIn - curTrimIn;
        const timelineDelta = actualSourceDelta / rate;
        const nextStart = Number(((t.startTimeSec ?? 0) + timelineDelta).toFixed(3));
        const updated = {
          ...t,
          trimStartSec: nextTrimIn,
          startTimeSec: nextStart
        };
        syncSingleVocalTrackToMasterTime(updated, masterSec, isPlaying, true);
        return updated;
      });
      vocalTracksRef.current = next;
      return next;
    });
  };

  // Trim end of vocal clip (dragging right handle `]` left/right)
  const handleTrimVocalEnd = (trackId: string, deltaSec: number) => {
    const masterSec = getCurrentMasterSec();
    setVocalTracks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== trackId) return t;
        const dur = Math.max(0.2, t.durationSeconds || 1);
        const rate = Math.max(0.5, Math.min(1.5, t.playbackRate ?? 1.0));
        const curTrimIn = t.trimStartSec ?? 0;
        const curTrimOut = t.trimEndSec ?? dur;
        const nextTrimOut = Number(
          Math.max(curTrimIn + 0.15, Math.min(dur, curTrimOut + deltaSec * rate)).toFixed(3)
        );
        const updated = {
          ...t,
          trimEndSec: nextTrimOut
        };
        syncSingleVocalTrackToMasterTime(updated, masterSec, isPlaying, true);
        return updated;
      });
      vocalTracksRef.current = next;
      return next;
    });
  };

  // Direct setter for Trim In / Trim Out sliders
  const handleSetVocalTrim = (trackId: string, trimInSec: number, trimOutSec: number) => {
    const masterSec = getCurrentMasterSec();
    setVocalTracks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== trackId) return t;
        const dur = Math.max(0.2, t.durationSeconds || 1);
        const safeIn = Number(Math.max(0, Math.min(dur - 0.15, trimInSec)).toFixed(2));
        const safeOut = Number(Math.max(safeIn + 0.15, Math.min(dur, trimOutSec)).toFixed(2));
        const updated = {
          ...t,
          trimStartSec: safeIn,
          trimEndSec: safeOut
        };
        syncSingleVocalTrackToMasterTime(updated, masterSec, isPlaying, true);
        return updated;
      });
      vocalTracksRef.current = next;
      return next;
    });
  };

  // Adjust vocal playback speed (playbackRate: 0.75 = 75% slower, 1.00 = 100%, 1.25 = 125% faster) with pitch preservation
  const handleVocalSpeedChange = (trackId: string, newRate: number) => {
    const clamped = Number(Math.max(0.75, Math.min(1.25, newRate)).toFixed(3));
    const masterSec = getCurrentMasterSec();
    setVocalTracks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== trackId) return t;
        const updated = { ...t, playbackRate: clamped };
        syncSingleVocalTrackToMasterTime(updated, masterSec, isPlaying, true);
        return updated;
      });
      vocalTracksRef.current = next;
      return next;
    });
  };

  // ─── Lazy-init playback AudioContext + global acyclic DSP chain ──────────
  const ensurePlaybackCtx = useCallback(() => {
    const CURRENT_DSP_VERSION = 5;
    if (
      playCtxRef.current &&
      playCtxRef.current.state !== 'closed' &&
      dspGraphVersionRef.current === CURRENT_DSP_VERSION
    ) {
      if (playCtxRef.current.state === 'suspended') {
        playCtxRef.current.resume().catch(() => {});
      }
      return playCtxRef.current;
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;

    // Reuse existing context if open (to preserve MediaElementAudioSourceNodes across hot reload)
    // but disconnect all old internal DSP nodes so we build a clean acyclic graph
    let ctx: AudioContext;
    if (playCtxRef.current && playCtxRef.current.state !== 'closed') {
      ctx = playCtxRef.current;
      [
        dspBusRef.current,
        dspVocalSyncDelayRef.current,
        dspAutoTuneFilterRef.current,
        dspAutoTuneWetRef.current,
        dspFxBusRef.current,
        dspFilterDriveRef.current,
        dspFilterRef.current,
        dspLowCutRef.current,
        dspEqLowRef.current,
        dspEqMidRef.current,
        dspEqHighRef.current,
        dspDelayRef.current,
        dspDelayFeedbackRef.current,
        dspDelayFilterRef.current,
        dspDelayGainRef.current,
        dspDelayDryRef.current,
        dspReverbRef.current,
        dspReverbToneRef.current,
        dspReverbGainRef.current,
        dspReverbDryRef.current,
        dspCompressorRef.current,
        dspMakeupGainRef.current,
        dspMasterGainRef.current
      ].forEach((n) => {
        try {
          n?.disconnect();
        } catch (_) {}
      });
    } else {
      ctx = new AudioCtx({ latencyHint: 'interactive' });
      playCtxRef.current = ctx;
    }
    dspGraphVersionRef.current = CURRENT_DSP_VERSION;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (audioOutputDevice && audioOutputDevice !== 'default' && typeof (ctx as any).setSinkId === 'function') {
      (ctx as any).setSinkId(audioOutputDevice).catch(() => {});
    }

    // ── Master output gain ────────────────────────────────────────────
    const masterGain = ctx.createGain();
    masterGain.gain.value = masterVolume;
    dspMasterGainRef.current = masterGain;

    // ── Vocal Submix Bus (all vocal tracks connect here) ───────────────
    const vocalBus = ctx.createGain();
    vocalBus.gain.value = 1.0;
    dspBusRef.current = vocalBus;

    // ── Hardware Vocal Timing Alignment Delay (allows sub-ms vocal delay when offset < 0) ──
    const vocalSyncDelay = ctx.createDelay(1.0);
    const leadOffset = vocalTracks[0]?.latencyOffsetMs ?? globalLatencyMs;
    vocalSyncDelay.delayTime.value = leadOffset < 0 ? Math.min(0.5, Math.abs(leadOffset) / 1000) : 0;
    dspVocalSyncDelayRef.current = vocalSyncDelay;

    // ── Shared Studio Bus (receives clean Beat + processed Vocals) ────
    const fxBus = ctx.createGain();
    fxBus.gain.value = 1.0;
    dspFxBusRef.current = fxBus;

    // ── Clean Auto-Tune Presence Filter (zero WaveShaper distortion) ──
    const autoTuneFilter = ctx.createBiquadFilter();
    autoTuneFilter.type = 'peaking';
    autoTuneFilter.frequency.value = autoTuneSpeed === 'hard' ? 3100 : autoTuneSpeed === 'fast' ? 2800 : 2500;
    autoTuneFilter.Q.value = autoTuneSpeed === 'hard' ? 1.5 : autoTuneSpeed === 'fast' ? 1.1 : 0.8;
    autoTuneFilter.gain.value = autoTuneEnabled
      ? (autoTuneSpeed === 'hard' ? 2.5 : autoTuneSpeed === 'fast' ? 1.8 : 1.0) * autoTuneAmount
      : 0;
    dspAutoTuneFilterRef.current = autoTuneFilter;

    // ── Vocal Low-Cut (High-Pass) filter at 80Hz (Vocals only — keeps Beat 808 sub-bass intact!) ──
    const lowCut = ctx.createBiquadFilter();
    lowCut.type = 'highpass';
    lowCut.frequency.value = lowCutEnabled ? 80 : 20;
    lowCut.Q.value = 0.707;
    dspLowCutRef.current = lowCut;

    // ── Studio Resonant Filter + Optional Drive (LP 24 / HP / BP) ─────
    const filterDriveNode = ctx.createWaveShaper();
    filterDriveNode.curve = makeDriveCurve(filterDrive);
    filterDriveNode.oversample = '4x';
    dspFilterDriveRef.current = filterDriveNode;

    const mainFilter = ctx.createBiquadFilter();
    mainFilter.type = filterType === 'LP 24' ? 'lowpass' : filterType === 'HP' ? 'highpass' : 'bandpass';
    mainFilter.frequency.value = Math.max(20, Math.min(20000, filterCutoff * 1000));
    mainFilter.Q.value = 0.707 + filterResonance * 6.0;
    dspFilterRef.current = mainFilter;

    // ── 3-Band Studio EQ ──────────────────────────────────────────────
    const low = ctx.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 120;
    low.gain.value = eqLow;
    dspEqLowRef.current = low;

    const mid = ctx.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1500;
    mid.Q.value = 0.8;
    mid.gain.value = eqMid;
    dspEqMidRef.current = mid;

    const high = ctx.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.value = 8000;
    high.gain.value = eqHigh;
    dspEqHighRef.current = high;

    // ── Tempo-Synced Delay + Feedback + Analog High-Cut (Parallel Send) ──
    const delay = ctx.createDelay(2.0);
    const bpm = sessionBpm || selectedTrack?.bpm || 92;
    const syncMult = delaySync === '1/4' ? 1.0 : delaySync === '1/8D' ? 0.75 : 0.5;
    delay.delayTime.value = Math.max(0.05, Math.min(1.9, (60 / bpm) * syncMult));
    dspDelayRef.current = delay;

    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = Math.max(400, Math.min(16000, delayCutoff * 1000));
    delayFilter.Q.value = 0.707;
    dspDelayFilterRef.current = delayFilter;

    const delayFeedbackNode = ctx.createGain();
    delayFeedbackNode.gain.value = Math.max(0, Math.min(0.85, delayFeedback));
    dspDelayFeedbackRef.current = delayFeedbackNode;

    delay.connect(delayFilter);
    delayFilter.connect(delayFeedbackNode);
    delayFeedbackNode.connect(delay);

    const delayGain = ctx.createGain();
    delayGain.gain.value = delayAmount * 0.65;
    dspDelayGainRef.current = delayGain;

    // ── Studio Reverb (Velvet-Damped ConvolverNode + Tone Filter, Parallel Send) ──
    const reverb = ctx.createConvolver();
    reverb.buffer = buildReverbIR(ctx, reverbDecay, reverbMode);
    dspReverbRef.current = reverb;

    const reverbToneFilter = ctx.createBiquadFilter();
    reverbToneFilter.type = 'lowpass';
    reverbToneFilter.frequency.value = Math.max(500, Math.min(18000, reverbTone * 1000));
    reverbToneFilter.Q.value = 0.707;
    dspReverbToneRef.current = reverbToneFilter;

    const reverbGain = ctx.createGain();
    reverbGain.gain.value = reverbAmount * 0.9;
    dspReverbGainRef.current = reverbGain;

    // ── Transparent Studio Optical Compressor + Makeup Gain ───────────
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = compThreshold;
    compressor.knee.value = 18;
    compressor.ratio.value = compressorEnabled ? compRatio : 1;
    compressor.attack.value = dynamicsMode === 'Punch' ? 0.015 : dynamicsMode === 'Limit' ? 0.003 : 0.012;
    compressor.release.value = dynamicsMode === 'Limit' ? 0.12 : 0.25;
    dspCompressorRef.current = compressor;

    const makeupGain = ctx.createGain();
    makeupGain.gain.value = compressorEnabled ? Math.pow(10, compMakeup / 20) : 1.0;
    dspMakeupGainRef.current = makeupGain;

    // ── Wire Strict Acyclic (DAG) Studio DSP Chain (Zero illegal cycles!):
    // 1. Vocals: vocalBus → vocalSyncDelay → autoTuneFilter → lowCut (80Hz) → fxBus
    // 2. Vocals also feed parallel Delay & Reverb directly after lowCut
    // 3. Beat connects to fxBus (and optional auxSend into Delay/Reverb when user selects Beat clip)
    vocalBus.connect(vocalSyncDelay);
    vocalSyncDelay.connect(autoTuneFilter);
    autoTuneFilter.connect(lowCut);
    lowCut.connect(fxBus);

    // Parallel Vocal FX Sends (strictly forward into compressor — NEVER back into fxBus!)
    lowCut.connect(delay);
    lowCut.connect(reverb);

    // Optional Beat FX Send (strictly forward from high into delay/reverb → compressor)
    const auxSend = ctx.createGain();
    auxSend.gain.value = 0.35;
    dspAutoTuneWetRef.current = auxSend;

    // Shared Bus: fxBus → filterDriveNode → mainFilter → low → mid → high → compressor
    fxBus.connect(filterDriveNode);
    filterDriveNode.connect(mainFilter);
    mainFilter.connect(low);
    low.connect(mid);
    mid.connect(high);

    // Dry main path to compressor
    high.connect(compressor);

    // Parallel FX returns forward into compressor
    high.connect(auxSend);
    auxSend.connect(delay);
    auxSend.connect(reverb);

    delayFilter.connect(delayGain);
    delayGain.connect(compressor);

    reverb.connect(reverbToneFilter);
    reverbToneFilter.connect(reverbGain);
    reverbGain.connect(compressor);

    // Master output stage
    compressor.connect(makeupGain);
    makeupGain.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Re-attach any existing beat/vocal element nodes to the freshly built buses
    if (beatNodesRef.current) {
      try {
        const targetNode = beatNodesRef.current.panner || beatNodesRef.current.gain;
        targetNode.disconnect();
        targetNode.connect(fxBus);
      } catch (_) {}
    }
    vocalNodesRef.current.forEach((nodes) => {
      try {
        const targetNode = nodes.panner || nodes.gain;
        targetNode.disconnect();
        targetNode.connect(vocalBus);
      } catch (_) {}
    });

    return ctx;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrack?.bpm, audioOutputDevice]);

  // Handle user changing the Studio Audio Output Device
  const handleOutputDeviceChange = useCallback(
    async (deviceId: string) => {
      setAudioOutputDevice(deviceId);
      const ctx = ensurePlaybackCtx();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      await applyAudioOutputSinkId(deviceId);
    },
    [ensurePlaybackCtx, applyAudioOutputSinkId]
  );

  // Play a clean studio monitor test tone to verify audio output device routing
  const handleTestOutputAudio = useCallback(async () => {
    try {
      const ctx = ensurePlaybackCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      await applyAudioOutputSinkId(audioOutputDevice);
      const now = ctx.currentTime;
      const freqs = [523.25, 659.25]; // C5 -> E5 warm studio check chime
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.11);
        g.gain.setValueAtTime(0.001, now + idx * 0.11);
        g.gain.linearRampToValueAtTime(0.22, now + idx * 0.11 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0008, now + idx * 0.11 + 0.28);
        osc.connect(g);
        g.connect(dspMasterGainRef.current || ctx.destination);
        osc.start(now + idx * 0.11);
        osc.stop(now + idx * 0.11 + 0.3);
      });
    } catch (_) {}
  }, [ensurePlaybackCtx, applyAudioOutputSinkId, audioOutputDevice]);

  // ─── Connect a single HTMLAudioElement into the live playback graph ──────
  const connectElToPlayback = useCallback((el: HTMLAudioElement, nodeKey: 'beat' | string, vol: number, pan: number): ElNodes | null => {
    try {
      const ctx = ensurePlaybackCtx();
      if (!ctx || !dspMasterGainRef.current || !dspBusRef.current) return null;

      // Ensure HTMLAudioElement is at unity volume (1.0) and unmuted so Web Audio GainNode has full dynamic range
      el.muted = false;
      el.volume = 1.0;
      if (nodeKey === 'beat') el.playbackRate = 1.0;

      const beatTarget = dspFxBusRef.current || dspMasterGainRef.current;
      const destBus = nodeKey === 'beat' ? beatTarget : dspBusRef.current;

      const existing = nodeKey === 'beat' ? beatNodesRef.current : vocalNodesRef.current.get(nodeKey);
      if (existing) {
        if ((existing.source as any).mediaElement === el) {
          existing.gain.gain.value = vol;
          existing.gain.gain.setValueAtTime(vol, ctx.currentTime);
          if (existing.panner && existing.panner.pan?.setValueAtTime) {
            try { existing.panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan / 100)), ctx.currentTime); } catch(_) {}
          }
          // Ensure connected to active bus
          try {
            const outNode = existing.panner || existing.gain;
            outNode.disconnect();
            outNode.connect(destBus);
          } catch (_) {}
          return existing;
        }
        try {
          existing.source.disconnect();
          existing.gain.disconnect();
          if (existing.panner?.disconnect) existing.panner.disconnect();
        } catch (_) {}
      }

      let source: MediaElementAudioSourceNode;
      if ((el as any).__sourceNode) {
        source = (el as any).__sourceNode;
        try {
          source.disconnect();
        } catch (_) {}
      } else {
        source = ctx.createMediaElementSource(el);
        (el as any).__sourceNode = source;
      }

      const gain = ctx.createGain();
      gain.gain.value = vol;
      gain.gain.setValueAtTime(vol, ctx.currentTime);

      let panner: StereoPannerNode | null = null;
      if (typeof ctx.createStereoPanner === 'function') {
        try {
          panner = ctx.createStereoPanner();
          panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan / 100)), ctx.currentTime);
        } catch (_) {
          panner = null;
        }
      }

      source.connect(gain);
      if (panner) {
        gain.connect(panner);
        panner.connect(destBus);
      } else {
        gain.connect(destBus);
      }

      const nodes: ElNodes = { source, gain, panner: panner || (gain as any) };
      if (nodeKey === 'beat') {
        beatNodesRef.current = nodes;
      } else {
        vocalNodesRef.current.set(nodeKey, nodes);
      }
      return nodes;
    } catch (e) {
      console.warn('connectElToPlayback error:', e);
      return null;
    }
  }, [ensurePlaybackCtx]);

  // Real-time audio volume & solo/mute sync:
  // Backing Beat plays directly via native HTMLAudioElement (100% original Beat Store master quality, zero DSP coloration or ducking).
  // Vocal tracks route through the Web Audio Vocal DSP chain.
  useEffect(() => {
    const anySolo = vocalTracks.some((t) => t.isSolo) || beatSolo;
    const beatShouldPlay = anySolo ? beatSolo : !beatMuted;

    // 1. Backing Beat (100% Pure Native Master Output)
    if (beatAudioRef.current) {
      beatAudioRef.current.muted = !beatShouldPlay;
      beatAudioRef.current.volume = beatShouldPlay ? Math.max(0, Math.min(1, beatVolume * masterVolume)) : 0;
    }

    // 2. Master gain node (for Vocal Bus)
    if (dspMasterGainRef.current && playCtxRef.current) {
      dspMasterGainRef.current.gain.value = masterVolume;
      dspMasterGainRef.current.gain.setValueAtTime(masterVolume, playCtxRef.current.currentTime);
    }

    // 3. All Vocal audio elements
    vocalTracks.forEach((t) => {
      const el = vocalAudioRefs.current.get(t.id);
      if (el) {
        const trackShouldPlay = anySolo ? t.isSolo : !t.isMuted;
        const nodes = vocalNodesRef.current.get(t.id);
        if (nodes && playCtxRef.current) {
          el.muted = false;
          el.volume = 1.0;
          const g = trackShouldPlay ? Math.max(0, Math.min(2, t.volume)) : 0;
          nodes.gain.gain.value = g;
          nodes.gain.gain.setValueAtTime(g, playCtxRef.current.currentTime);
          nodes.panner.pan.setValueAtTime(
            Math.max(-1, Math.min(1, t.pan / 100)),
            playCtxRef.current.currentTime
          );
        } else {
          el.muted = !trackShouldPlay;
          el.volume = trackShouldPlay ? Math.max(0, Math.min(1, t.volume * masterVolume)) : 0;
        }
      }
    });
  }, [beatVolume, beatPan, beatMuted, beatSolo, vocalTracks, masterVolume]);

  // ─── Live Auto-Tune parameter sync (clean studio formant lift, zero distortion) ──
  useEffect(() => {
    if (dspAutoTuneFilterRef.current && playCtxRef.current) {
      dspAutoTuneFilterRef.current.frequency.setValueAtTime(
        autoTuneSpeed === 'hard' ? 3100 : autoTuneSpeed === 'fast' ? 2800 : 2500,
        playCtxRef.current.currentTime
      );
      dspAutoTuneFilterRef.current.Q.setValueAtTime(
        autoTuneSpeed === 'hard' ? 1.5 : autoTuneSpeed === 'fast' ? 1.1 : 0.8,
        playCtxRef.current.currentTime
      );
      dspAutoTuneFilterRef.current.gain.setValueAtTime(
        autoTuneEnabled ? (autoTuneSpeed === 'hard' ? 2.5 : autoTuneSpeed === 'fast' ? 1.8 : 1.0) * autoTuneAmount : 0,
        playCtxRef.current.currentTime
      );
    }
  }, [autoTuneEnabled, autoTuneSpeed, autoTuneAmount]);

  // ─── Live Filter parameter sync (LP 24 / HP / BP + Cutoff + Resonance + Drive) ──
  useEffect(() => {
    const ctx = playCtxRef.current;
    if (dspFilterRef.current && ctx) {
      dspFilterRef.current.type = filterType === 'LP 24' ? 'lowpass' : filterType === 'HP' ? 'highpass' : 'bandpass';
      const targetHz = Math.max(20, Math.min(20000, filterCutoff * 1000));
      dspFilterRef.current.frequency.value = targetHz;
      dspFilterRef.current.frequency.setTargetAtTime(targetHz, ctx.currentTime, 0.015);
      const targetQ = 0.707 + filterResonance * 6.0;
      dspFilterRef.current.Q.value = targetQ;
      dspFilterRef.current.Q.setTargetAtTime(targetQ, ctx.currentTime, 0.015);
    }
    if (dspFilterDriveRef.current) {
      dspFilterDriveRef.current.curve = makeDriveCurve(filterDrive);
    }
  }, [filterType, filterCutoff, filterResonance, filterDrive]);

  // ─── Live EQ parameter sync ───────────────────────────────────────────────
  useEffect(() => {
    const ctx = playCtxRef.current;
    if (!ctx) return;
    if (dspEqLowRef.current) {
      dspEqLowRef.current.gain.value = eqLow;
      dspEqLowRef.current.gain.setTargetAtTime(eqLow, ctx.currentTime, 0.015);
    }
    if (dspEqMidRef.current) {
      dspEqMidRef.current.gain.value = eqMid;
      dspEqMidRef.current.gain.setTargetAtTime(eqMid, ctx.currentTime, 0.015);
    }
    if (dspEqHighRef.current) {
      dspEqHighRef.current.gain.value = eqHigh;
      dspEqHighRef.current.gain.setTargetAtTime(eqHigh, ctx.currentTime, 0.015);
    }
  }, [eqLow, eqMid, eqHigh]);

  // ─── Live Reverb amount & tone sync ───────────────────────────────────────
  useEffect(() => {
    const ctx = playCtxRef.current;
    if (!ctx) return;
    if (dspReverbGainRef.current) {
      const wet = reverbAmount * 0.9;
      dspReverbGainRef.current.gain.value = wet;
      dspReverbGainRef.current.gain.setTargetAtTime(wet, ctx.currentTime, 0.015);
    }
    if (dspReverbToneRef.current) {
      const hz = Math.max(500, Math.min(18000, reverbTone * 1000));
      dspReverbToneRef.current.frequency.value = hz;
      dspReverbToneRef.current.frequency.setTargetAtTime(hz, ctx.currentTime, 0.015);
    }
    if (dspAutoTuneWetRef.current) {
      const noVocals = !vocalTracks.some((t) => t.vocalBlob !== null);
      const sendAmt = noVocals || selectedClipId === 'beat' ? 0.35 : 0.0;
      dspAutoTuneWetRef.current.gain.setTargetAtTime(sendAmt, ctx.currentTime, 0.02);
    }
  }, [reverbAmount, reverbTone, delayAmount, vocalTracks, selectedClipId]);

  // ─── Live Reverb Decay & Mode IR rebuild ──────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      const ctx = playCtxRef.current;
      if (ctx && dspReverbRef.current) {
        try {
          dspReverbRef.current.buffer = buildReverbIR(ctx, reverbDecay, reverbMode);
        } catch (_) {}
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [reverbDecay, reverbMode]);

  // ─── Live Delay amount, feedback, cutoff & sync ───────────────────────────
  useEffect(() => {
    const ctx = playCtxRef.current;
    if (!ctx) return;
    if (dspDelayGainRef.current) {
      const wet = delayAmount * 0.65;
      dspDelayGainRef.current.gain.value = wet;
      dspDelayGainRef.current.gain.setTargetAtTime(wet, ctx.currentTime, 0.015);
    }
    if (dspDelayFeedbackRef.current) {
      const fb = Math.max(0, Math.min(0.85, delayFeedback));
      dspDelayFeedbackRef.current.gain.value = fb;
      dspDelayFeedbackRef.current.gain.setTargetAtTime(fb, ctx.currentTime, 0.015);
    }
    if (dspDelayFilterRef.current) {
      const hz = Math.max(400, Math.min(16000, delayCutoff * 1000));
      dspDelayFilterRef.current.frequency.value = hz;
      dspDelayFilterRef.current.frequency.setTargetAtTime(hz, ctx.currentTime, 0.015);
    }
    if (dspDelayRef.current) {
      const bpm = sessionBpm || selectedTrack?.bpm || 92;
      const mult = delaySync === '1/4' ? 1.0 : delaySync === '1/8D' ? 0.75 : 0.5;
      const delaySec = Math.max(0.05, Math.min(1.9, (60 / bpm) * mult));
      dspDelayRef.current.delayTime.setTargetAtTime(delaySec, ctx.currentTime, 0.02);
    }
  }, [delayAmount, delayFeedback, delayCutoff, delaySync, sessionBpm, selectedTrack?.bpm]);

  // ─── Live Dynamics / Compressor sync ──────────────────────────────────────
  useEffect(() => {
    const ctx = playCtxRef.current;
    if (!ctx) return;
    if (dspCompressorRef.current) {
      dspCompressorRef.current.threshold.value = compThreshold;
      dspCompressorRef.current.threshold.setValueAtTime(compThreshold, ctx.currentTime);
      const r = compressorEnabled ? compRatio : 1;
      dspCompressorRef.current.ratio.value = r;
      dspCompressorRef.current.ratio.setValueAtTime(r, ctx.currentTime);
      const att = dynamicsMode === 'Punch' ? 0.015 : dynamicsMode === 'Limit' ? 0.003 : 0.012;
      const rel = dynamicsMode === 'Limit' ? 0.12 : 0.25;
      dspCompressorRef.current.attack.setValueAtTime(att, ctx.currentTime);
      dspCompressorRef.current.release.setValueAtTime(rel, ctx.currentTime);
    }
    if (dspMakeupGainRef.current) {
      const g = compressorEnabled ? Math.pow(10, compMakeup / 20) : 1.0;
      dspMakeupGainRef.current.gain.value = g;
      dspMakeupGainRef.current.gain.setTargetAtTime(g, ctx.currentTime, 0.015);
    }
  }, [compressorEnabled, compThreshold, compRatio, compMakeup, dynamicsMode]);

  // ─── Low-Cut enable sync ──────────────────────────────────────────────────
  useEffect(() => {
    if (dspLowCutRef.current && playCtxRef.current) {
      dspLowCutRef.current.frequency.value = lowCutEnabled ? 80 : 20;
      dspLowCutRef.current.frequency.setValueAtTime(lowCutEnabled ? 80 : 20, playCtxRef.current.currentTime);
    }
  }, [lowCutEnabled]);

  // Undo the most recent punch-in / overdub take on a vocal channel, restoring the previous recording intact
  const handleUndoVocalTake = (trackId: string) => {
    const masterSec = getCurrentMasterSec();
    setVocalTracks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== trackId || !t.undoStack || t.undoStack.length === 0) return t;
        const nextStack = [...t.undoStack];
        const snapshot = nextStack.pop()!;
        if (t.vocalUrl && t.vocalUrl !== snapshot.vocalUrl) {
          try {
            URL.revokeObjectURL(t.vocalUrl);
          } catch (_) {}
        }
        const restored: StudioVocalTrack = {
          ...t,
          vocalBlob: snapshot.vocalBlob,
          vocalUrl: snapshot.vocalUrl,
          durationSeconds: snapshot.durationSeconds,
          startTimeSec: snapshot.startTimeSec,
          trimStartSec: snapshot.trimStartSec,
          trimEndSec: snapshot.trimEndSec,
          playbackRate: snapshot.playbackRate,
          clips: snapshot.clips,
          undoStack: nextStack
        };
        setTimeout(() => {
          syncSingleVocalTrackToMasterTime(restored, masterSec, isPlaying, true);
        }, 30);
        return restored;
      });
      vocalTracksRef.current = next;
      return next;
    });
  };

  // Delete / Clear a recorded vocal take on any track (Lead or Backup) so user can re-record cleanly
  const handleClearVocalTake = (trackId: string) => {
    // 1. Stop audio playback for this take
    const el = vocalAudioRefs.current.get(trackId);
    if (el) {
      el.pause();
      el.currentTime = 0;
      el.removeAttribute('src');
      el.load();
    }
    vocalAudioRefs.current.delete(trackId);

    // 2. Clear take state & revoke object URL
    setVocalTracks((prev) => {
      const next = prev.map((t) => {
        if (t.id === trackId) {
          if (t.vocalUrl) {
            try {
              URL.revokeObjectURL(t.vocalUrl);
            } catch (e) {}
          }
          t.undoStack?.forEach((snap) => {
            try {
              if (snap.vocalUrl) URL.revokeObjectURL(snap.vocalUrl);
            } catch (_) {}
          });
          return {
            ...t,
            vocalBlob: null,
            vocalUrl: null,
            durationSeconds: 0,
            startTimeSec: 0,
            trimStartSec: 0,
            trimEndSec: 0,
            playbackRate: 1.0,
            clips: [],
            undoStack: [],
            isArmed: true // Auto re-arm so artist can instantly record a new take
          };
        }
        return {
          ...t,
          isArmed: t.id === trackId
        };
      });
      vocalTracksRef.current = next;
      return next;
    });

    // 3. Reset playback state if no takes remain
    setVocalTracks((currentTracks) => {
      const remainingTakes = currentTracks.filter((t) => t.id !== trackId && t.vocalBlob);
      if (remainingTakes.length === 0) {
        if (beatAudioRef.current) {
          beatAudioRef.current.pause();
          beatAudioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
        setRecordState('idle');
        setRecordingSeconds(0);
        setPlayheadTime(0);
        setCloudSaveResult(null);
      }
      return currentTracks;
    });
  };

  // Remove a Backup Vocal Track entirely
  const handleRemoveTrack = (trackId: string) => {
    const el = vocalAudioRefs.current.get(trackId);
    if (el) {
      el.pause();
      el.removeAttribute('src');
      el.load();
    }
    vocalAudioRefs.current.delete(trackId);
    setVocalTracks((prev) => {
      const target = prev.find((t) => t.id === trackId);
      if (target?.vocalUrl) {
        try {
          URL.revokeObjectURL(target.vocalUrl);
        } catch (e) {}
      }
      return prev.filter((t) => t.id !== trackId);
    });
  };

  // Arm a specific vocal track (Exclusive arming: only one track records at a time)
  const handleArmTrack = (trackId: string) => {
    setVocalTracks((prev) =>
      prev.map((t) => ({
        ...t,
        isArmed: t.id === trackId
      }))
    );
  };

  // Toggle track mute (instant Web Audio gain update for iOS/mobile)
  const handleToggleMute = (trackId: string) => {
    setVocalTracks((prev) => {
      const next = prev.map((t) => (t.id === trackId ? { ...t, isMuted: !t.isMuted } : t));
      const target = next.find((t) => t.id === trackId);
      if (target) {
        const anySolo = next.some((t) => t.isSolo) || beatSolo;
        const trackShouldPlay = anySolo ? target.isSolo : !target.isMuted;
        const nodes = vocalNodesRef.current.get(trackId);
        if (nodes && playCtxRef.current) {
          nodes.gain.gain.setValueAtTime(
            trackShouldPlay ? Math.max(0, Math.min(2, target.volume)) : 0,
            playCtxRef.current.currentTime
          );
        }
      }
      return next;
    });
  };

  // Toggle track solo
  const handleToggleSolo = (trackId: string) => {
    setVocalTracks((prev) => {
      const next = prev.map((t) => (t.id === trackId ? { ...t, isSolo: !t.isSolo } : t));
      const anySolo = next.some((t) => t.isSolo) || beatSolo;
      next.forEach((t) => {
        const trackShouldPlay = anySolo ? t.isSolo : !t.isMuted;
        const nodes = vocalNodesRef.current.get(t.id);
        if (nodes && playCtxRef.current) {
          nodes.gain.gain.setValueAtTime(
            trackShouldPlay ? Math.max(0, Math.min(2, t.volume)) : 0,
            playCtxRef.current.currentTime
          );
        }
      });
      return next;
    });
  };

  // Update track volume (instant fader response on mobile phones)
  const handleTrackVolumeChange = (trackId: string, val: number) => {
    const ctx = ensurePlaybackCtx();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    setVocalTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, volume: val } : t))
    );

    const nodes = vocalNodesRef.current.get(trackId);
    if (nodes && ctx) {
      const anySolo = vocalTracks.some((t) => t.isSolo) || beatSolo;
      const t = vocalTracks.find((tr) => tr.id === trackId);
      const trackShouldPlay = anySolo ? (t?.isSolo ?? false) : !(t?.isMuted ?? false);
      const targetGain = trackShouldPlay ? Math.max(0, Math.min(2, val)) : 0;
      nodes.gain.gain.value = targetGain;
      nodes.gain.gain.setValueAtTime(targetGain, ctx.currentTime);
      const el = vocalAudioRefs.current.get(trackId);
      if (el) el.volume = 1.0;
    } else {
      const el = vocalAudioRefs.current.get(trackId);
      if (el) {
        try {
          el.volume = Math.max(0, Math.min(1, val * masterVolume));
        } catch (_) {}
      }
    }
  };

  // Beat volume fader (native master fidelity)
  const handleBeatVolumeChange = (val: number) => {
    setBeatVolume(val);
    if (beatAudioRef.current) {
      const anySolo = vocalTracks.some((t) => t.isSolo) || beatSolo;
      const beatShouldPlay = anySolo ? beatSolo : !beatMuted;
      beatAudioRef.current.muted = !beatShouldPlay;
      beatAudioRef.current.volume = beatShouldPlay ? Math.max(0, Math.min(1, val * masterVolume)) : 0;
    }
  };

  // Beat mute toggle
  const handleToggleBeatMute = () => {
    setBeatMuted((prev) => {
      const next = !prev;
      if (beatAudioRef.current) {
        const anySolo = vocalTracks.some((t) => t.isSolo) || beatSolo;
        const beatShouldPlay = anySolo ? beatSolo : !next;
        beatAudioRef.current.muted = !beatShouldPlay;
        beatAudioRef.current.volume = beatShouldPlay ? Math.max(0, Math.min(1, beatVolume * masterVolume)) : 0;
      }
      return next;
    });
  };

  // Beat solo toggle
  const handleToggleBeatSolo = () => {
    setBeatSolo((prev) => {
      const next = !prev;
      const anySolo = vocalTracks.some((t) => t.isSolo) || next;
      if (beatAudioRef.current) {
        const beatShouldPlay = anySolo ? next : !beatMuted;
        beatAudioRef.current.muted = !beatShouldPlay;
        beatAudioRef.current.volume = beatShouldPlay ? Math.max(0, Math.min(1, beatVolume * masterVolume)) : 0;
      }
      vocalTracks.forEach((t) => {
        const trackShouldPlay = anySolo ? t.isSolo : !t.isMuted;
        const nodes = vocalNodesRef.current.get(t.id);
        if (nodes && playCtxRef.current) {
          nodes.gain.gain.setValueAtTime(
            trackShouldPlay ? Math.max(0, Math.min(2, t.volume)) : 0,
            playCtxRef.current.currentTime
          );
        }
      });
      return next;
    });
  };

  // Update track pan
  const handleTrackPanChange = (trackId: string, val: number) => {
    setVocalTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, pan: val } : t))
    );
  };

  // Rename track name inline
  const handleTrackNameChange = (trackId: string, name: string) => {
    setVocalTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, name } : t))
    );
  };

  // Start 3-Second Count-in or Immediate Recording
  const handleRecordTrigger = () => {
    if (isRecording) {
      stopRecordingSession();
      return;
    }

    if (!selectedTrack) {
      alert('Please select a backing beat first.');
      return;
    }

    const armedTrack = vocalTracks.find((t) => t.isArmed);
    if (!armedTrack) {
      alert('Please arm a vocal track by clicking [REC] on the track before recording.');
      return;
    }

    // If currently playing preview, seamlessly transition / punch-in from the current playhead location!
    if (isPlaying) {
      if (playheadIntervalRef.current) clearInterval(playheadIntervalRef.current);
      if (beatAudioRef.current) {
        setPlayheadTime(beatAudioRef.current.currentTime);
        beatAudioRef.current.pause();
      }
      vocalAudioRefs.current.forEach((el) => el.pause());
      setIsPlaying(false);
    }

    // Unlock Web Audio on user gesture
    const pCtx = ensurePlaybackCtx();
    if (pCtx && pCtx.state === 'suspended') {
      pCtx.resume().catch(() => {});
    }

    if (isCountInEnabled) {
      setRecordState('countdown');
      setCountdownNumber(3);
      playMetronomeTick(true);

      let count = 3;
      const interval = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdownNumber(count);
          playMetronomeTick(true);
        } else {
          clearInterval(interval);
          startActualRecording();
        }
      }, 1000);
    } else {
      startActualRecording();
    }
  };

  // Begin Audio Recording into Armed Track from the Current Playhead Location (Cubase-style Punch-In)
  const startActualRecording = async () => {
    const armedTrack = vocalTracksRef.current.find((t) => t.isArmed) || vocalTracks.find((t) => t.isArmed);
    if (!armedTrack) return;

    try {
      // Capture current playhead location as the exact punch-in start position (instead of resetting to 0:00)
      const beatMaxDur = selectedTrack?.durationSeconds || 180;
      const currentPos = beatAudioRef.current && isPlaying ? beatAudioRef.current.currentTime : playheadTime;
      const initialPunchStartSec =
        currentPos >= beatMaxDur - 0.5 ? 0 : Math.max(0, Number(currentPos.toFixed(3)));

      recordedChunksRef.current = [];
      recBeatStartSecRef.current = initialPunchStartSec;
      setRecordingSeconds(initialPunchStartSec);
      recordingSecondsRef.current = initialPunchStartSec;
      setLiveWaveformHistory([]);
      setRecordState('recording');
      setIsRecording(true);
      setPlayheadTime(initialPunchStartSec);

      // Pause any previous playback on the armed track during active punch-in recording
      const armedEl = vocalAudioRefs.current.get(armedTrack.id);
      if (armedEl) {
        armedEl.pause();
      }

      // Ensure playback AudioContext is awake & routed to chosen output device
      const pCtx = ensurePlaybackCtx();
      if (pCtx && pCtx.state === 'suspended') {
        await pCtx.resume().catch(() => {});
      }
      await applyAudioOutputSinkId(audioOutputDevice);

      // Access User Microphone at native hardware sample rate (prevents sample-clock speed drift!)
      let stream: MediaStream;
      try {
        const devConstraint =
          audioInputDevice && audioInputDevice !== 'default' ? { deviceId: { ideal: audioInputDevice } } : {};
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            ...devConstraint
          }
        });
      } catch (err1) {
        console.warn('Studio audio constraints fallback to standard audio:', err1);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err2) {
          console.error('Microphone access denied or unsupported:', err2);
          alert('Microphone access could not be started. Please enable microphone permissions in your browser settings.');
          setRecordState('idle');
          setIsRecording(false);
          return;
        }
      }
      micStreamRef.current = stream;

      // Side-branch Web Audio Analyser ONLY for visual waveform & VU meter
      // (Recording directly from hardware `stream` keeps 100% exact 1.0x sample clock alignment with the beat!)
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx({ latencyHint: 'interactive' });
      audioContextRef.current = ctx;

      const sourceNode = ctx.createMediaStreamSource(stream);
      const gainNode = ctx.createGain();
      gainNode.gain.value = inputGain;
      sourceNode.connect(gainNode);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      gainNode.connect(analyser);
      analyserRef.current = analyser;

      // Record directly from the hardware MediaStream (zero frame drops or sample-rate clock drift)
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const supportedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';
      const recorder = new MediaRecorder(
        stream,
        supportedMime ? { mimeType: supportedMime, audioBitsPerSecond: 256000 } : undefined
      );

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      // Start the Backing Beat from the exact Punch-In Playhead Position (`initialPunchStartSec`)
      if (beatAudioRef.current && selectedTrack) {
        beatAudioRef.current.playbackRate = 1.0;
        beatAudioRef.current.currentTime = initialPunchStartSec;
        beatAudioRef.current.muted = beatMuted;
        beatAudioRef.current.volume = beatMuted ? 0 : Math.max(0, Math.min(1, beatVolume * masterVolume));
        await beatAudioRef.current.play().catch(() => {});
      }

      recorder.onstart = () => {
        const punchStart = beatAudioRef.current ? beatAudioRef.current.currentTime : initialPunchStartSec;
        recBeatStartSecRef.current = punchStart;
        // Play other (non-armed) vocal tracks synced to the exact punch-in position for headphone monitoring
        vocalTracksRef.current.forEach((t) => {
          if (!t.isArmed && t.vocalUrl) {
            const audioEl = vocalAudioRefs.current.get(t.id);
            if (audioEl) {
              connectElToPlayback(audioEl, t.id, t.isMuted ? 0 : t.volume, t.pan);
              syncSingleVocalTrackToMasterTime(t, punchStart, true, true);
            }
          }
        });
      };

      recorder.onstop = async () => {
        const rawBlob = new Blob(recordedChunksRef.current, {
          type: supportedMime || 'audio/webm'
        });

        const beatStart = Math.max(0, recBeatStartSecRef.current || 0);
        const beatEnd = Math.max(beatStart + 0.2, recBeatEndSecRef.current || recordingSecondsRef.current || beatStart + 1);
        const beatElapsedSec = Math.max(0.2, beatEnd - beatStart);

        // Look up the current state of the armed track to see if it already has a previous recording
        const prevTrack =
          vocalTracksRef.current.find((t) => t.id === armedTrack.id) ||
          vocalTracks.find((t) => t.id === armedTrack.id) ||
          armedTrack;

        // Decode true audio sample duration from the recorded Blob AND composite with any existing recording on this channel!
        let finalDurationSeconds = beatElapsedSec;
        let finalStartTimeSec = Number(beatStart.toFixed(3));
        let finalPlaybackRate = 1.0;
        let finalBlob: Blob = rawBlob;
        let updatedClips: StudioVocalClipSegment[] = [];
        let updatedUndoStack: StudioVocalUndoSnapshot[] = prevTrack.undoStack ? [...prevTrack.undoStack] : [];

        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const tempCtx = new AudioCtx();
            const arrBuf = await rawBlob.arrayBuffer();
            const newDecoded = await tempCtx.decodeAudioData(arrBuf);
            if (newDecoded && newDecoded.duration > 0.2 && Number.isFinite(newDecoded.duration)) {
              const trueSampleDuration = Number(newDecoded.duration.toFixed(3));
              let autoCalibratedRate = 1.0;
              if (beatElapsedSec > 0.8 && trueSampleDuration > 0.8) {
                const rawRatio = trueSampleDuration / beatElapsedSec;
                if (rawRatio >= 0.78 && rawRatio <= 1.22) {
                  autoCalibratedRate = Number(rawRatio.toFixed(3));
                }
              }

              // Check if this vocal channel ALREADY has a previous recording -> Cubase Non-Destructive Punch-In!
              if (prevTrack.vocalBlob && prevTrack.durationSeconds > 0.15) {
                const existRate = Math.max(0.75, Math.min(1.25, prevTrack.playbackRate ?? 1.0));
                const existStartSec = Math.max(0, prevTrack.startTimeSec ?? 0);
                const existTrimIn = Math.max(0, prevTrack.trimStartSec ?? 0);
                const existTrimOut = Math.max(
                  existTrimIn + 0.05,
                  prevTrack.trimEndSec ?? prevTrack.durationSeconds
                );
                const existTimelineDur = Math.max(0.15, (existTrimOut - existTrimIn) / existRate);

                const prevClipsList: StudioVocalClipSegment[] =
                  prevTrack.clips && prevTrack.clips.length > 0
                    ? prevTrack.clips
                    : [
                        {
                          id: 'clip_1',
                          name: 'Take 1',
                          startTimeSec: existStartSec,
                          durationSeconds: Number(existTimelineDur.toFixed(3))
                        }
                      ];

                // 1. Push previous recording state onto Undo Stack so it is never lost
                const undoSnapshot: StudioVocalUndoSnapshot = {
                  vocalBlob: prevTrack.vocalBlob,
                  vocalUrl: prevTrack.vocalUrl || URL.createObjectURL(prevTrack.vocalBlob),
                  durationSeconds: prevTrack.durationSeconds,
                  startTimeSec: existStartSec,
                  trimStartSec: existTrimIn,
                  trimEndSec: existTrimOut,
                  playbackRate: existRate,
                  clips: prevClipsList
                };
                updatedUndoStack = [...updatedUndoStack.slice(-6), undoSnapshot];

                // 2. Decode existing track audio and composite with the new punch-in take at `beatStart`
                const existArrBuf = await prevTrack.vocalBlob.arrayBuffer();
                const existingDecoded = await tempCtx.decodeAudioData(existArrBuf);
                const { mergedBuffer, mergedStartSec, mergedDurationSec, newTimelineDur } =
                  compositePunchInAudioBuffers(
                    tempCtx,
                    existingDecoded,
                    existStartSec,
                    existTrimIn,
                    Math.min(existingDecoded.duration, existTrimOut),
                    existRate,
                    newDecoded,
                    beatStart,
                    autoCalibratedRate
                  );

                finalBlob = audioBufferToWav(mergedBuffer);
                finalStartTimeSec = mergedStartSec;
                finalDurationSeconds = mergedDurationSec;
                finalPlaybackRate = 1.0; // Both existing and new takes are time-aligned at 1.0x in the composite WAV

                // 3. Split/trim existing clip segments around `[newStart, newEnd]` and insert the new take segment
                const newStart = Number(beatStart.toFixed(3));
                const newEnd = Number((beatStart + newTimelineDur).toFixed(3));
                const nextSegments: StudioVocalClipSegment[] = [];
                prevClipsList.forEach((seg) => {
                  const sStart = seg.startTimeSec;
                  const sEnd = seg.startTimeSec + seg.durationSeconds;
                  if (sEnd <= newStart + 0.05 || sStart >= newEnd - 0.05) {
                    nextSegments.push(seg);
                  } else {
                    if (newStart - sStart >= 0.15) {
                      nextSegments.push({
                        ...seg,
                        id: `${seg.id}_pre`,
                        durationSeconds: Number((newStart - sStart).toFixed(3))
                      });
                    }
                    if (sEnd - newEnd >= 0.15) {
                      nextSegments.push({
                        ...seg,
                        id: `${seg.id}_post`,
                        startTimeSec: newEnd,
                        durationSeconds: Number((sEnd - newEnd).toFixed(3))
                      });
                    }
                  }
                });
                const takeNum = updatedUndoStack.length + 1;
                nextSegments.push({
                  id: `clip_${Date.now()}`,
                  name: `Take ${takeNum}`,
                  startTimeSec: newStart,
                  durationSeconds: newTimelineDur
                });
                nextSegments.sort((a, b) => a.startTimeSec - b.startTimeSec);
                updatedClips = nextSegments;
              } else {
                // First recording on this vocal channel (placed at `beatStart` on the timeline)
                finalBlob = audioBufferToWav(newDecoded);
                finalDurationSeconds = trueSampleDuration;
                finalStartTimeSec = Number(beatStart.toFixed(3));
                finalPlaybackRate = autoCalibratedRate;
                const newTimelineDur = Number((trueSampleDuration / autoCalibratedRate).toFixed(3));
                updatedClips = [
                  {
                    id: `clip_${Date.now()}`,
                    name: 'Take 1',
                    startTimeSec: finalStartTimeSec,
                    durationSeconds: newTimelineDur
                  }
                ];
              }
            }
            tempCtx.close().catch(() => {});
          }
        } catch (compErr) {
          console.warn('Punch-in composite fallback:', compErr);
        }

        const objectUrl = URL.createObjectURL(finalBlob);

        // Assign composite or newly recorded WAV take into the armed track
        setVocalTracks((prev) => {
          const next = prev.map((t) =>
            t.id === armedTrack.id
              ? {
                  ...t,
                  vocalBlob: finalBlob,
                  vocalUrl: objectUrl,
                  durationSeconds: finalDurationSeconds,
                  startTimeSec: finalStartTimeSec,
                  trimStartSec: 0,
                  trimEndSec: Number(finalDurationSeconds.toFixed(3)),
                  playbackRate: finalPlaybackRate,
                  clips: updatedClips,
                  undoStack: updatedUndoStack,
                  latencyOffsetMs: t.latencyOffsetMs !== undefined ? t.latencyOffsetMs : 0
                }
              : t
          );
          vocalTracksRef.current = next;
          return next;
        });

        // Cue playhead right to the punch-in start position (`beatStart`) so the artist can immediately audition their take in context
        const cueSec = Number(beatStart.toFixed(3));
        setPlayheadTime(cueSec);
        if (beatAudioRef.current) {
          beatAudioRef.current.pause();
          beatAudioRef.current.currentTime = cueSec;
        }
        vocalAudioRefs.current.forEach((el) => {
          el.pause();
        });
        setIsPlaying(false);
        setRecordState('preview');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);

      // Live Timer & Playhead Tracker (locked to beatAudioRef.currentTime when running)
      timerIntervalRef.current = setInterval(() => {
        const beatTime = beatAudioRef.current && !beatAudioRef.current.paused ? beatAudioRef.current.currentTime : null;
        setRecordingSeconds((prev) => {
          const next = beatTime !== null && beatTime >= 0 ? beatTime : prev + 0.1;
          recordingSecondsRef.current = next;
          setPlayheadTime(next);
          // Keep all non-armed vocal tracks continuously synced with the beat during recording
          vocalTracksRef.current.forEach((t) => {
            if (!t.isArmed && t.vocalUrl) {
              syncSingleVocalTrackToMasterTime(t, next, true, false);
            }
          });
          return next;
        });
      }, 80);

      // Live Oscilloscope & VU Meter animation
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWaveform = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const levelNorm = Math.min(100, Math.round((avg / 255) * 100 * inputGain));
          setInputLevelMeter(levelNorm);

          const mLevel = Math.min(98, Math.round(levelNorm * 0.7 + (beatMuted ? 0 : beatVolume * 50)));
          setMasterMeterL(mLevel);
          setMasterMeterR(Math.max(0, mLevel - Math.floor(Math.random() * 5)));

          const peakSample = Math.max(8, (dataArray[2] || 10) / 2.5);
          setLiveWaveformHistory((prev) => [...prev.slice(-180), peakSample]);

          animationFrameRef.current = requestAnimationFrame(updateWaveform);
        }
      };
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      alert('Could not access microphone. Please grant browser microphone permission to record vocals.');
      setRecordState('idle');
      setIsRecording(false);
    }
  };

  // Stop Recording Session
  const stopRecordingSession = () => {
    setIsRecording(false);
    if (beatAudioRef.current) {
      recBeatEndSecRef.current = beatAudioRef.current.currentTime || recordingSecondsRef.current;
    } else {
      recBeatEndSecRef.current = recordingSecondsRef.current;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (beatAudioRef.current) {
      beatAudioRef.current.pause();
    }
    vocalAudioRefs.current.forEach((el) => el.pause());

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setInputLevelMeter(0);
    setMasterMeterL(0);
    setMasterMeterR(0);
  };

  // Playhead Rewind (RTZ) — resets beat and all vocals to time 0
  const handleReturnToZero = () => {
    const wasPlaying = isPlaying;
    if (wasPlaying) {
      if (beatAudioRef.current) beatAudioRef.current.pause();
      vocalAudioRefs.current.forEach((el) => el.pause());
      setIsPlaying(false);
      if (playheadIntervalRef.current) clearInterval(playheadIntervalRef.current);
    }
    setPlayheadTime(0);
    if (beatAudioRef.current) beatAudioRef.current.currentTime = 0;
    vocalTracks.forEach((t) => {
      const el = vocalAudioRefs.current.get(t.id);
      if (el) {
        el.currentTime = Math.max(0, t.trimStartSec ?? 0);
      }
    });
    if (wasPlaying) {
      setTimeout(() => togglePlayCombinedPreview(), 50);
    }
  };

  // Synchronized Multi-Track Playback (Beat + Lead + All Backup Vocals with Trim, Move & Speed Sync)
  const togglePlayCombinedPreview = async () => {
    if (isPlaying) {
      if (beatAudioRef.current) beatAudioRef.current.pause();
      vocalAudioRefs.current.forEach((el) => el.pause());
      setIsPlaying(false);
      if (playheadIntervalRef.current) clearInterval(playheadIntervalRef.current);
      setMasterMeterL(0);
      setMasterMeterR(0);
    } else {
      const ctx = ensurePlaybackCtx();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
      await applyAudioOutputSinkId(audioOutputDevice);

      const currentTime = playheadTime;
      const anySolo = vocalTracks.some((t) => t.isSolo) || beatSolo;
      const beatShouldPlay = anySolo ? beatSolo : !beatMuted;

      // Sync BPM-based delay time whenever we start playback
      if (dspDelayRef.current) {
        const bpm = sessionBpm || selectedTrack?.bpm || 92;
        const mult = delaySync === '1/4' ? 1.0 : delaySync === '1/8D' ? 0.75 : 0.5;
        dspDelayRef.current.delayTime.value = Math.max(0.05, Math.min(1.9, (60 / bpm) * mult));
      }

      if (beatAudioRef.current) {
        beatAudioRef.current.playbackRate = 1.0;
        beatAudioRef.current.currentTime = currentTime;
        beatAudioRef.current.muted = !beatShouldPlay;
        beatAudioRef.current.volume = beatShouldPlay ? Math.max(0, Math.min(1, beatVolume * masterVolume)) : 0;
      }

      const promises: Promise<void>[] = [];
      if (beatAudioRef.current) promises.push(beatAudioRef.current.play());

      vocalTracksRef.current.forEach((t) => {
        if (t.vocalUrl) {
          const el = vocalAudioRefs.current.get(t.id);
          if (el) {
            const vocalShouldPlay = anySolo ? t.isSolo : !t.isMuted;
            connectElToPlayback(el, t.id, vocalShouldPlay ? t.volume : 0, t.pan);

            const rate = Math.max(0.75, Math.min(1.25, t.playbackRate ?? 1.0));
            if ('preservesPitch' in el) (el as any).preservesPitch = true;
            if ('mozPreservesPitch' in el) (el as any).mozPreservesPitch = true;
            if ('webkitPreservesPitch' in el) (el as any).webkitPreservesPitch = true;
            el.playbackRate = rate;

            const offsetMs = t.latencyOffsetMs !== undefined ? t.latencyOffsetMs : globalLatencyMs;
            if (dspVocalSyncDelayRef.current && ctx && t.type === 'lead') {
              const delaySec = offsetMs < 0 ? Math.min(0.5, Math.abs(offsetMs) / 1000) : 0;
              dspVocalSyncDelayRef.current.delayTime.setValueAtTime(delaySec, ctx.currentTime);
            }

            if (el.readyState === HTMLMediaElement.HAVE_NOTHING || el.src !== (t.vocalUrl || '')) {
              el.load();
            }
            el.muted = false;
            el.volume = 1.0;
            const nodes = vocalNodesRef.current.get(t.id);
            if (nodes) {
              nodes.gain.gain.value = vocalShouldPlay ? Math.max(0, Math.min(2, t.volume)) : 0;
              nodes.panner.pan.value = Math.max(-1, Math.min(1, t.pan / 100));
            }

            // Cue or start vocal track strictly based on whether `currentTime` is inside `[clipStart, clipEnd)`
            syncSingleVocalTrackToMasterTime(t, currentTime, true, true);
          }
        }
      });

      Promise.all(promises)
        .then(() => {
          setIsPlaying(true);
          playheadIntervalRef.current = setInterval(() => {
            const latestTracks = vocalTracksRef.current;
            const masterTimeSource = beatAudioRef.current || vocalAudioRefs.current.get(latestTracks[0]?.id);
            if (masterTimeSource) {
              const masterSec = masterTimeSource.currentTime;
              setPlayheadTime(masterSec);

              // Continuously sync every vocal track against its LIVE `startTimeSec`, `trimStartSec`, `trimEndSec`, and `playbackRate`
              if (beatAudioRef.current && !beatAudioRef.current.paused) {
                latestTracks.forEach((t) => {
                  if (t.vocalUrl) {
                    syncSingleVocalTrackToMasterTime(t, masterSec, true, false);
                  }
                });
              }
            }
            const beatVolNorm = (!beatShouldPlay || beatMuted) ? 0 : beatVolume * 55;
            const hasVocalsPlaying = latestTracks.some((t) => {
              const el = vocalAudioRefs.current.get(t.id);
              return t.vocalUrl && el && !el.paused && !t.isMuted && (!anySolo || t.isSolo);
            });
            const vocalVolNorm = hasVocalsPlaying ? 40 : 0;
            const tot = Math.min(95, Math.round(beatVolNorm + vocalVolNorm));
            setMasterMeterL(tot);
            setMasterMeterR(Math.max(0, tot - Math.floor(Math.random() * 4)));
          }, 45);
        })
        .catch((err) => {
          console.warn('Multi-track playback error:', err);
          setIsPlaying(false);
        });
    }
  };

  // Seek playhead by clicking anywhere on the timeline — syncs beat AND all vocals to the same position
  const handleTimelineSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const totalDuration = selectedTrack?.durationSeconds || 180;
    const seekTime = ratio * totalDuration;

    setPlayheadTime(seekTime);
    if (beatAudioRef.current) beatAudioRef.current.currentTime = seekTime;
    vocalTracksRef.current.forEach((t) => {
      syncSingleVocalTrackToMasterTime(t, seekTime, isPlaying, true);
    });
  };

  // Render Full Multi-Track Master Mix WAV (Beat + Lead + All Backup Vocals with Pan & Gain)
  // Honors export range (exports only recorded song length or custom [R] locator stop point)
  const renderMasterMixBlob = async (exportLimitSeconds?: number): Promise<Blob> => {
    if (!selectedTrack) {
      throw new Error('No backing beat selected');
    }

    const recordedTracks = vocalTracks.filter((t) => t.vocalBlob !== null);
    if (recordedTracks.length === 0) {
      throw new Error('No recorded vocal tracks to mix');
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const decodeCtx = new AudioCtx();

    // 1. Fetch & decode backing beat audio
    const beatAudioSrc = selectedTrack.audioUrl || '';
    const beatResponse = await fetch(beatAudioSrc);
    const beatArrayBuffer = await beatResponse.arrayBuffer();
    const beatAudioBuffer = await decodeCtx.decodeAudioData(beatArrayBuffer);

    // 2. Decode each vocal track's recorded blob
    const decodedVocalBuffers: { track: StudioVocalTrack; buffer: AudioBuffer }[] = [];
    for (const t of recordedTracks) {
      if (t.vocalBlob) {
        const arrBuf = await t.vocalBlob.arrayBuffer();
        const buf = await decodeCtx.decodeAudioData(arrBuf);
        decodedVocalBuffers.push({ track: t, buffer: buf });
      }
    }

    decodeCtx.close();

    // 3. Render Offline Mix with active Gain, Stereo Pan, EQ, Auto-Tune & Compressor
    // In DAWs, the export ends at the specified locator / recorded song length
    const limit = exportLimitSeconds !== undefined ? exportLimitSeconds : effectiveExportDuration;
    const targetDuration = Math.max(1, Math.min(beatAudioBuffer.duration, limit));

    const offlineCtx = new OfflineAudioContext(2, Math.ceil(targetDuration * 44100), 44100);

    // Master Bus
    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = masterVolume;
    masterGain.connect(offlineCtx.destination);

    // Add Backing Beat Track (routes directly to master, bypassing vocal FX)
    const beatSource = offlineCtx.createBufferSource();
    beatSource.buffer = beatAudioBuffer;
    const beatGain = offlineCtx.createGain();
    beatGain.gain.value = beatMuted ? 0 : beatVolume;
    if (typeof offlineCtx.createStereoPanner === 'function') {
      try {
        const beatPanner = offlineCtx.createStereoPanner();
        beatPanner.pan.value = Math.max(-1, Math.min(1, beatPan / 100));
        beatSource.connect(beatGain);
        beatGain.connect(beatPanner);
        beatPanner.connect(masterGain);
      } catch (_) {
        beatSource.connect(beatGain);
        beatGain.connect(masterGain);
      }
    } else {
      beatSource.connect(beatGain);
      beatGain.connect(masterGain);
    }
    beatSource.start(0);

    // Vocal Submix Bus
    const vocalBus = offlineCtx.createGain();
    vocalBus.gain.value = 1.0;

    // ── Auto-Tune Pro DSP in Master Mix (clean studio formant lift, zero distortion) ──
    const offlineAutoTuneFilter = offlineCtx.createBiquadFilter();
    offlineAutoTuneFilter.type = 'peaking';
    offlineAutoTuneFilter.frequency.value = autoTuneSpeed === 'hard' ? 3100 : autoTuneSpeed === 'fast' ? 2800 : 2500;
    offlineAutoTuneFilter.Q.value = autoTuneSpeed === 'hard' ? 1.5 : autoTuneSpeed === 'fast' ? 1.1 : 0.8;
    offlineAutoTuneFilter.gain.value = autoTuneEnabled
      ? (autoTuneSpeed === 'hard' ? 2.5 : autoTuneSpeed === 'fast' ? 1.8 : 1.0) * autoTuneAmount
      : 0;

    // Studio Resonant Filter + Drive
    const offlineFilterDrive = offlineCtx.createWaveShaper();
    offlineFilterDrive.curve = makeDriveCurve(filterDrive);
    offlineFilterDrive.oversample = '4x';

    const offlineMainFilter = offlineCtx.createBiquadFilter();
    offlineMainFilter.type = filterType === 'LP 24' ? 'lowpass' : filterType === 'HP' ? 'highpass' : 'bandpass';
    offlineMainFilter.frequency.value = Math.max(20, Math.min(20000, filterCutoff * 1000));
    offlineMainFilter.Q.value = 0.707 + filterResonance * 6.0;

    // Low-Cut Filter
    const offlineLowCut = offlineCtx.createBiquadFilter();
    offlineLowCut.type = 'highpass';
    offlineLowCut.frequency.value = lowCutEnabled ? 80 : 20;
    offlineLowCut.Q.value = 0.707;

    vocalBus.connect(offlineAutoTuneFilter);
    offlineAutoTuneFilter.connect(offlineFilterDrive);
    offlineFilterDrive.connect(offlineMainFilter);
    offlineMainFilter.connect(offlineLowCut);

    // ── 3-Band EQ ──
    const lowFilter = offlineCtx.createBiquadFilter();
    lowFilter.type = 'lowshelf';
    lowFilter.frequency.value = 120;
    lowFilter.gain.value = eqLow;

    const midFilter = offlineCtx.createBiquadFilter();
    midFilter.type = 'peaking';
    midFilter.frequency.value = 1500;
    midFilter.Q.value = 0.8;
    midFilter.gain.value = eqMid;

    const highFilter = offlineCtx.createBiquadFilter();
    highFilter.type = 'highshelf';
    highFilter.frequency.value = 8000;
    highFilter.gain.value = eqHigh;

    offlineLowCut.connect(lowFilter);
    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);

    // ── Tempo-Synced Delay ──
    const offlineDelay = offlineCtx.createDelay(2.0);
    const bpm = sessionBpm || selectedTrack?.bpm || 92;
    const syncMult = delaySync === '1/4' ? 1.0 : delaySync === '1/8D' ? 0.75 : 0.5;
    offlineDelay.delayTime.value = Math.max(0.05, Math.min(1.9, (60 / bpm) * syncMult));

    const offlineDelayFilter = offlineCtx.createBiquadFilter();
    offlineDelayFilter.type = 'lowpass';
    offlineDelayFilter.frequency.value = Math.max(400, Math.min(16000, delayCutoff * 1000));
    offlineDelayFilter.Q.value = 0.707;

    const offlineDelayFeedback = offlineCtx.createGain();
    offlineDelayFeedback.gain.value = Math.max(0, Math.min(0.85, delayFeedback));
    offlineDelay.connect(offlineDelayFilter);
    offlineDelayFilter.connect(offlineDelayFeedback);
    offlineDelayFeedback.connect(offlineDelay);

    const offlineDelayGain = offlineCtx.createGain();
    offlineDelayGain.gain.value = delayAmount * 0.65;
    const offlineDelayDry = offlineCtx.createGain();
    offlineDelayDry.gain.value = 1.0;

    highFilter.connect(offlineDelayDry);
    highFilter.connect(offlineDelay);
    offlineDelayFilter.connect(offlineDelayGain);

    const postDelaySum = offlineCtx.createGain();
    postDelaySum.gain.value = 1.0;
    offlineDelayDry.connect(postDelaySum);
    offlineDelayGain.connect(postDelaySum);

    // ── Studio Reverb ──
    const offlineReverb = offlineCtx.createConvolver();
    offlineReverb.buffer = buildReverbIR(offlineCtx, reverbDecay, reverbMode);

    const offlineReverbTone = offlineCtx.createBiquadFilter();
    offlineReverbTone.type = 'lowpass';
    offlineReverbTone.frequency.value = Math.max(500, Math.min(18000, reverbTone * 1000));
    offlineReverbTone.Q.value = 0.707;

    const offlineReverbGain = offlineCtx.createGain();
    offlineReverbGain.gain.value = reverbAmount * 0.9;
    const offlineReverbDry = offlineCtx.createGain();
    offlineReverbDry.gain.value = 1.0;

    postDelaySum.connect(offlineReverbDry);
    postDelaySum.connect(offlineReverb);
    offlineReverb.connect(offlineReverbTone);
    offlineReverbTone.connect(offlineReverbGain);

    // ── Dynamics Compressor + Makeup Gain ──
    const offlineComp = offlineCtx.createDynamicsCompressor();
    offlineComp.threshold.value = compThreshold;
    offlineComp.knee.value = 18;
    offlineComp.ratio.value = compressorEnabled ? compRatio : 1;
    offlineComp.attack.value = dynamicsMode === 'Punch' ? 0.015 : dynamicsMode === 'Limit' ? 0.003 : 0.012;
    offlineComp.release.value = dynamicsMode === 'Limit' ? 0.12 : 0.25;

    const offlineMakeup = offlineCtx.createGain();
    offlineMakeup.gain.value = compressorEnabled ? Math.pow(10, compMakeup / 20) : 1.0;

    offlineReverbDry.connect(offlineComp);
    offlineReverbGain.connect(offlineComp);
    offlineComp.connect(offlineMakeup);
    offlineMakeup.connect(masterGain);

    // Add Every Vocal Track (Lead + Backup 1 + Backup 2...)
    for (const item of decodedVocalBuffers) {
      const { track, buffer } = item;
      const vSource = offlineCtx.createBufferSource();
      vSource.buffer = buffer;

      // Track Volume Gain
      const vGain = offlineCtx.createGain();
      vGain.gain.value = track.isMuted ? 0 : track.volume;

      vSource.connect(vGain);

      // Stereo Panner (-1.0 to +1.0)
      if (typeof offlineCtx.createStereoPanner === 'function') {
        try {
          const panner = offlineCtx.createStereoPanner();
          panner.pan.value = Math.max(-1, Math.min(1, track.pan / 100));
          vGain.connect(panner);
          panner.connect(vocalBus);
        } catch (_) {
          vGain.connect(vocalBus);
        }
      } else {
        vGain.connect(vocalBus);
      }

      // Honor Trim Start/End, Timeline Move Position (startTimeSec), Speed (playbackRate), and Latency Offset
      const rate = Math.max(0.75, Math.min(1.25, track.playbackRate ?? 1.0));
      vSource.playbackRate.value = rate;
      const offsetSeconds = (track.latencyOffsetMs !== undefined ? track.latencyOffsetMs : globalLatencyMs) / 1000;
      const trimIn = Math.max(0, track.trimStartSec ?? 0);
      const trimOut = Math.min(buffer.duration, Math.max(trimIn + 0.1, track.trimEndSec ?? buffer.duration));
      const clipTimelineStart = (track.startTimeSec ?? 0) - offsetSeconds;
      const startWhen = Math.max(0, clipTimelineStart);
      const earlyCutSec = clipTimelineStart < 0 ? Math.abs(clipTimelineStart) * rate : 0;
      const startOffset = Math.min(buffer.duration - 0.05, trimIn + earlyCutSec);
      const sourceDuration = Math.max(0.05, trimOut - startOffset);
      vSource.start(startWhen, startOffset, sourceDuration);
    }

    // Render offline stereo master
    const mixedAudioBuffer = await offlineCtx.startRendering();
    return audioBufferToWav(mixedAudioBuffer);
  };

  // Export & Download Mixed Master WAV (Honors Studio Locators)
  const handleExportWav = async (durationOverride?: number) => {
    const hasAnyTakes = vocalTracks.some((t) => t.vocalBlob !== null);
    if (!hasAnyTakes || !selectedTrack) {
      alert('Record at least one vocal track before exporting master.');
      return;
    }

    setIsExportingWav(true);
    try {
      const renderDuration = durationOverride !== undefined ? durationOverride : effectiveExportDuration;
      const mixedBlob = await renderMasterMixBlob(renderDuration);
      const safeProject = projectTitle.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const filename = `Caution_RecordStudio_${safeProject}_MasterMix_${Math.round(renderDuration)}s.wav`;

      const url = URL.createObjectURL(mixedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setIsExportDialogOpen(false);
    } catch (err: any) {
      console.error('Render master mix error:', err);
      alert('Error rendering master mix: ' + err.message);
    } finally {
      setIsExportingWav(false);
    }
  };

  // Wire to Cloud Storage and Supabase Database (Uploading Lead + All Backup Stems)
  const handleSaveToCloud = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const recordedTracks = vocalTracks.filter((t) => t.vocalBlob !== null);
    if (recordedTracks.length === 0 || !selectedTrack) {
      alert('Record at least one vocal track first before saving to cloud.');
      return;
    }

    setIsSavingToCloud(true);
    setCloudSaveResult(null);

    try {
      // 1. Render Full Master Mix WAV (using active export length)
      let masterBlob: Blob | null = null;
      try {
        masterBlob = await renderMasterMixBlob(effectiveExportDuration);
      } catch (mixErr) {
        console.warn('Could not render master mix, uploading individual stems:', mixErr);
      }

      // 2. Prepare FormData with all vocal tracks
      const formData = new FormData();
      formData.append('artistName', artistName.trim() || 'Caution Artist');
      formData.append('projectTitle', projectTitle.trim() || 'Record Studio Multi-Track Session');
      formData.append('contactPhone', contactPhone.trim());
      formData.append('socialHandle', socialHandle.trim());
      formData.append('beatTitle', selectedTrack.title);
      formData.append('beatId', selectedTrack.id);
      formData.append('notes', notes.trim());
      formData.append('lyrics', lyricsText.trim());
      formData.append(
        'effectsConfig',
        JSON.stringify({
          autoTune: {
            enabled: autoTuneEnabled,
            speed: autoTuneSpeed,
            amount: autoTuneAmount,
            key: autoTuneKey
          },
          reverb: reverbAmount,
          delay: delayAmount,
          eq: { low: eqLow, mid: eqMid, high: eqHigh },
          compressor: compressorEnabled,
          lowCut: lowCutEnabled,
          beatVolume,
          masterVolume,
          exportDurationSeconds: effectiveExportDuration
        })
      );

      // Append Each Recorded Vocal Stem with its metadata
      recordedTracks.forEach((t, index) => {
        if (t.vocalBlob) {
          formData.append(`vocalAudio_${index}`, t.vocalBlob, `${t.name}.wav`);
          formData.append(`vocalTrackName_${index}`, t.name);
          formData.append(`vocalTrackPan_${index}`, t.pan.toString());
          formData.append(`vocalTrackVol_${index}`, t.volume.toString());
        }
      });

      // Append Full Mixed Master
      if (masterBlob) {
        formData.append('masterMixAudio', masterBlob, 'full_master_mix.wav');
      }

      // 3. Post to /api/record-studio/save
      const res = await fetch('/api/record-studio/save', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCloudSaveResult({
          vocalStems: data.vocalStems,
          masterUrl: data.masterUrl || data.primaryUrl,
          message: `Saved to Studio Cloud (${recordedTracks.length} vocal stems + master mix) & Database!`
        });
        setActiveConsoleTab('cloud');
      } else {
        alert(data.error || 'Failed to save to cloud. Please try again.');
      }
    } catch (err: any) {
      console.error('Cloud save error:', err);
      alert('Error uploading to studio cloud: ' + err.message);
    } finally {
      setIsSavingToCloud(false);
    }
  };

  const copyShareLink = () => {
    if (!cloudSaveResult?.masterUrl) return;
    const full = `${window.location.origin}${cloudSaveResult.masterUrl}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(full);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const formatTimecode = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = Math.floor(totalSecs % 60);
    const ms = Math.floor((totalSecs % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const formatBarsBeats = (totalSecs: number, bpm: number = 120) => {
    const beatsPerSec = bpm / 60;
    const totalBeats = totalSecs * beatsPerSec;
    const bar = Math.floor(totalBeats / 4) + 1;
    const beat = Math.floor(totalBeats % 4) + 1;
    const fraction = Math.floor((totalBeats % 1) * 10);
    return `${bar.toString().padStart(3, '0')}.${beat.toString().padStart(2, '0')}.${fraction}`;
  };

  const formattedBeatCounter = useMemo(() => {
    const spb = 60 / (sessionBpm || 92);
    const totalBeats = playheadTime / spb;
    const bar = Math.floor(totalBeats / 4) + 1;
    const beat = Math.floor(totalBeats % 4) + 1;
    const sixteenth = Math.floor((totalBeats % 1) * 4) + 1;
    return `${bar}.${beat}.${sixteenth}`;
  }, [playheadTime, sessionBpm]);

  const formatPanLabel = (pan: number) => {
    if (pan === 0) return 'C';
    if (pan < 0) return `L${Math.abs(pan)}`;
    return `R${pan}`;
  };

  // Studio: follow the loaded beat's tempo
  useEffect(() => {
    if (selectedTrack?.bpm) setSessionBpm(selectedTrack.bpm);
  }, [selectedTrack?.id]);

  // Studio: zoom the timeline in when recording starts so the take is visible
  useEffect(() => {
    if (!isRecording) return;
    const beatSec = selectedTrack?.durationSeconds || 180;
    const target = beatSec >= 120 ? 8 : beatSec >= 60 ? 4 : 2;
    setZoomLevel((z) => (z === 1 ? target : z));
  }, [isRecording]);

  // Studio: zoom out automatically if the live take outgrows the visible span
  useEffect(() => {
    if (!isRecording) return;
    const beatSec = selectedTrack?.durationSeconds || 180;
    if (recordingSeconds > (beatSec / zoomLevel) * 0.9) {
      setZoomLevel((z) => Math.max(1, z / 2));
    }
  }, [isRecording, recordingSeconds]);

  if (!isStandalonePage && !isOpen) return null;

  const hasAnyRecordedTakes = vocalTracks.some((t) => t.vocalBlob !== null);
  const armedTrack = vocalTracks.find((t) => t.isArmed);
  const anySolo = vocalTracks.some((t) => t.isSolo) || beatSolo;
  const beatShouldPlay = anySolo ? beatSolo : !beatMuted;


  // =========================================================================
  // BANDLAB PRO DAW HELPERS & LOGIC
  // =========================================================================
  const autoPitchPercent = Math.round(autoTuneAmount * 100);

  const getAutoPitchDialLabel = (val: number) => {
    if (!autoTuneEnabled) return 'Bypass';
    if (val >= 80) return `Strength ${val}%`;
    if (val >= 55) return `Strength ${val}%`;
    if (val >= 30) return `Strength ${val}%`;
    return `Strength ${val}%`;
  };

  const handleSelectAutoPitchPreset = (preset: 'Classic' | 'Duet' | 'Big Harmony' | 'Natural' | 'Third' | 'Octave') => {
    setAutoPitchPreset(preset);
    if (!autoTuneEnabled) setAutoTuneEnabled(true);
    if (preset === 'Classic') {
      setAutoTuneSpeed('hard');
      setAutoTuneAmount(0.95);
    } else if (preset === 'Natural') {
      setAutoTuneSpeed('subtle');
      setAutoTuneAmount(0.45);
    } else if (preset === 'Big Harmony') {
      setAutoTuneSpeed('fast');
      setAutoTuneAmount(0.85);
      setReverbAmount(0.35);
    } else if (preset === 'Duet') {
      setAutoTuneSpeed('fast');
      setAutoTuneAmount(0.75);
      setDelayAmount(0.2);
    } else if (preset === 'Third') {
      setAutoTuneSpeed('hard');
      setAutoTuneAmount(0.85);
    } else if (preset === 'Octave') {
      setAutoTuneSpeed('hard');
      setAutoTuneAmount(0.9);
    }
  };

  const handleAutoDetectKey = () => {
    const detected = selectedTrack?.musicalKey || 'D Minor';
    setAutoTuneKey(detected);
    setAutoTuneEnabled(true);
  };

  const handleAutoMixAI = () => {
    setIsAutoMixRunning(true);
    setTimeout(() => {
      // Intelligent vocal balancing & mastering
      setBeatVolume(0.78);
      setVocalTracks((prev) =>
        prev.map((t) => ({ ...t, volume: t.type === 'lead' ? 1.05 : 0.85 }))
      );
      setCompressorEnabled(true);
      setLowCutEnabled(true);
      setEqLow(-1.0);
      setEqMid(2.0);
      setEqHigh(2.5);
      setReverbAmount(0.22);
      setDelayAmount(0.12);
      setIsAutoMixRunning(false);
      setAutoMixSuccess(true);
      setTimeout(() => setAutoMixSuccess(false), 3000);
    }, 1200);
  };

  // Determine active scale notes for key matrix
  const scaleKeyRoot = useMemo(() => {
    // Parse "D Minor" -> "D", "C Major" -> "C", etc.
    const parts = autoTuneKey.trim().split(' ');
    return (parts[0] || 'D').toUpperCase();
  }, [autoTuneKey]);

  const isMinorScale = useMemo(() => {
    return autoTuneKey.toLowerCase().includes('minor') || autoTuneKey.toLowerCase().includes('min');
  }, [autoTuneKey]);

  const activeScaleNotes = useMemo(() => {
    const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    if (autoTuneKey.toLowerCase().includes('chromatic')) {
      return new Set(allNotes);
    }
    const rootIdx = allNotes.findIndex((n) => n.toLowerCase() === scaleKeyRoot.toLowerCase());
    const validRoot = rootIdx >= 0 ? rootIdx : 2; // Default D
    const intervals = isMinorScale ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    return new Set(intervals.map((i) => allNotes[(validRoot + i) % 12]));
  }, [scaleKeyRoot, isMinorScale, autoTuneKey]);

  // Reset custom muted notes when key/scale changes
  useEffect(() => {
    setMutedScaleNotes([]);
  }, [autoTuneKey]);

  // Audio tone synthesizer for scale note buttons
  const playNoteTone = useCallback((note: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = playCtxRef.current || new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const noteFrequencies: Record<string, number> = {
        'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
        'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
        'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
      };
      const freq = noteFrequencies[note] || 440;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch (_) {}
  }, []);

  const toggleScaleNote = (note: string) => {
    playNoteTone(note);
    setMutedScaleNotes((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    );
  };

  // Currently focused track for the console strip fader & controls
  const activeSelectedTrack = useMemo(() => {
    if (selectedTrackTab === 'trk_beat') {
      return {
        id: 'trk_beat',
        name: 'Instrumental',
        volume: beatVolume,
        pan: beatPan,
        isBeat: true
      };
    }
    const v = vocalTracks.find((t) => t.id === selectedTrackTab) || vocalTracks.find((t) => t.isArmed) || vocalTracks[0];
    return {
      id: v?.id || 'trk_lead',
      name: v?.name || 'Lead Vocal',
      volume: v?.volume ?? 1.0,
      pan: v?.pan ?? 0,
      isBeat: false
    };
  }, [selectedTrackTab, beatVolume, beatPan, vocalTracks]);

  const handleActiveVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(1.5, Number(newVol.toFixed(2))));
    if (activeSelectedTrack.isBeat) {
      handleBeatVolumeChange(clamped);
    } else if (activeSelectedTrack.id) {
      handleTrackVolumeChange(activeSelectedTrack.id, clamped);
    }
  };
  // ---- Studio timeline geometry ----
  const studioBeatSec = selectedTrack?.durationSeconds || 180;
  const studioViewSpan = Math.max(8, studioBeatSec / zoomLevel);
  const studioBarSec = 240 / (sessionBpm || 92);
  const studioTotalBars = Math.max(4, Math.ceil(studioViewSpan / studioBarSec));
  const studioBarStep = [1, 2, 4, 8, 16, 32, 64].find((s) => studioTotalBars / s <= 10) || 64;
  const studioBars: number[] = [];
  for (let b = 1; b <= studioTotalBars; b += studioBarStep) studioBars.push(b);
  const timeToPct = (sec: number) => Math.max(0, Math.min(100, (sec / studioViewSpan) * 100));
  const studioPlayheadPct = (playheadTime / studioViewSpan) * 100;
  const studioSlug = projectTitle.toLowerCase().trim().split(' ').join('-') || 'session';

  const studioKeyLabel = (() => {
    const raw = selectedTrack?.musicalKey;
    if (raw) {
      const m = raw.match(/^([A-Ga-g][#b]?)\s*([A-Za-z]*)/);
      if (m) {
        const root = m[1][0].toUpperCase() + m[1].slice(1);
        const q = m[2].toLowerCase();
        return `${root} ${q.startsWith('min') || q === 'm' ? 'min' : 'maj'}`;
      }
    }
    return `${scaleKeyRoot} ${isMinorScale ? 'min' : 'maj'}`;
  })();

  // ---- Rows: Beat, Lead Vocal, Backups ----
  let studioBackupIdx = 0;
  const studioRows: StudioRow[] = [
    {
      id: 'beat',
      kind: 'beat',
      name: 'Beat',
      sub: selectedTrack ? selectedTrack.title : 'Choose a free beat',
      style: STUDIO_TRACK_STYLES.beat
    },
    ...vocalTracks.map((t): StudioRow => {
      const isLead = t.type === 'lead';
      const style = isLead
        ? STUDIO_TRACK_STYLES.lead
        : BACKUP_STYLES[studioBackupIdx++ % BACKUP_STYLES.length];
      return {
        id: t.id,
        kind: isLead ? 'lead' : 'backup',
        name: t.name,
        sub: t.vocalBlob ? `Audio · ${t.durationSeconds.toFixed(1)}s` : 'Audio · Mic',
        style,
        track: t
      };
    })
  ];

  const selectedRow = studioRows.find((r) => r.id === selectedClipId) || studioRows[0];
  const selectedUrl =
    selectedRow.kind === 'beat' ? selectedTrack?.audioUrl || null : selectedRow.track?.vocalUrl || null;
  const selectedTitle = selectedRow.kind === 'beat' ? selectedTrack?.title || 'Beat' : selectedRow.name;
  const selectedDesc =
    selectedRow.kind === 'beat'
      ? selectedTrack
        ? `Free beat · ${selectedTrack.bpm || sessionBpm} BPM · ${studioKeyLabel}`
        : 'No beat selected'
      : selectedRow.track?.vocalBlob
      ? `Audio take · ${selectedRow.track.durationSeconds.toFixed(1)} s`
      : 'No recording yet';

  const hasAnyTake = vocalTracks.some((t) => t.vocalBlob);

  const rowVolume = (row: StudioRow) => (row.kind === 'beat' ? beatVolume : row.track?.volume ?? 1);
  const rowMuted = (row: StudioRow) => (row.kind === 'beat' ? beatMuted : !!row.track?.isMuted);
  const rowSolo = (row: StudioRow) => (row.kind === 'beat' ? beatSolo : !!row.track?.isSolo);
  const setRowVolume = (row: StudioRow, vol: number) => {
    if (row.kind === 'beat') handleBeatVolumeChange(vol);
    else handleTrackVolumeChange(row.id, vol);
  };
  const toggleRowMute = (row: StudioRow) => {
    if (row.kind === 'beat') handleToggleBeatMute();
    else handleToggleMute(row.id);
  };
  const toggleRowSolo = (row: StudioRow) => {
    if (row.kind === 'beat') handleToggleBeatSolo();
    else handleToggleSolo(row.id);
  };

  const rowMeter = (row: StudioRow, idx: number) => {
    if (rowMuted(row)) return 0;
    let base = 0;
    if (row.kind === 'beat') {
      base = selectedTrack && (isPlaying || isRecording) ? 0.62 : 0;
    } else if (row.track) {
      if (isRecording && row.track.isArmed) base = Math.min(1, inputLevelMeter / 100);
      else if (isPlaying && row.track.vocalUrl) base = 0.55;
    }
    if (base <= 0) return 0;
    const jitter = 0.8 + 0.3 * Math.abs(Math.sin(playheadTime * 9 + idx * 1.7 + row.id.length));
    return Math.min(1, base * Math.min(1, rowVolume(row)) * jitter);
  };

  const masterDbValue = volToDb(masterVolume);
  const masterLevels = [masterMeterL, masterMeterR, masterMeterL * 0.95, masterMeterR * 0.95].map((v) =>
    Math.min(1, v / 100)
  );

  const handleStudioSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isRecording) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTime = ratio * studioViewSpan;
    setPlayheadTime(seekTime);
    if (beatAudioRef.current) beatAudioRef.current.currentTime = seekTime;
    vocalTracksRef.current.forEach((t) => {
      syncSingleVocalTrackToMasterTime(t, seekTime, isPlaying, true);
    });
  };

  const onStudioRecord = () => {
    if (!isRecording && !selectedTrack) {
      setBeatPickerOpen(true);
      return;
    }
    handleRecordTrigger();
  };

  const onStudioPlay = () => {
    if (!selectedTrack && !hasAnyTake) {
      setBeatPickerOpen(true);
      return;
    }
    togglePlayCombinedPreview();
  };

  const clearAllTakes = () => {
    vocalTracks.forEach((t) => {
      if (t.vocalBlob) handleClearVocalTake(t.id);
    });
    handleArmTrack('trk_lead');
  };


  return (
    <div
      className={`${
        isStandalonePage
          ? 'w-full min-h-screen h-screen'
          : 'fixed inset-0 z-50 w-screen h-screen'
      } bg-[#111214] text-[#eceef2] flex flex-col font-sans select-none overflow-hidden`}
    >
      {/* Hidden Playback Track Audio Elements */}
      {selectedTrack && (
        <audio
          key={`native-beat-${selectedTrack.id}-v7`}
          ref={(el) => {
            beatAudioRef.current = el;
          }}
          src={selectedTrack.audioUrl || ''}
          preload="auto"
          playsInline
          onEnded={() => {
            setIsPlaying(false);
            setPlayheadTime(0);
          }}
        />
      )}
      {vocalTracks.map((t) =>
        t.vocalUrl ? (
          <audio
            key={`vocal-el-${t.id}-${t.vocalUrl}-v6`}
            src={t.vocalUrl}
            preload="auto"
            crossOrigin="anonymous"
            playsInline
            ref={(el) => {
              if (el) {
                const prevEl = vocalAudioRefs.current.get(t.id);
                vocalAudioRefs.current.set(t.id, el);
                if (prevEl !== el && playCtxRef.current && playCtxRef.current.state === 'running') {
                  const trackShouldPlay = anySolo ? t.isSolo : !t.isMuted;
                  connectElToPlayback(el, t.id, trackShouldPlay ? t.volume : 0, t.pan);
                }
              } else {
                vocalAudioRefs.current.delete(t.id);
              }
            }}
            onEnded={() => {
              const anyOtherVocal = vocalTracks.some(
                (other) => other.id !== t.id && other.vocalUrl && (!anySolo || other.isSolo) && !other.isMuted
              );
              if (!anyOtherVocal && !beatShouldPlay) {
                setIsPlaying(false);
              }
            }}
          />
        ) : null
      )}
      <audio ref={auditionAudioRef} onEnded={() => setIsAuditioningId(null)} />

      {/* COUNT-IN OVERLAY */}
      {recordState === 'countdown' && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/65 pointer-events-none">
          <span className="text-[120px] sm:text-[160px] font-semibold text-white leading-none tabular-nums">
            {countdownNumber}
          </span>
          <span className="mt-3 text-sm text-[#c9ccd3]">Get ready to record</span>
        </div>
      )}

      {/* HEADER */}
      <header className="shrink-0 bg-[#111215] px-2.5 sm:px-6 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3 z-20">
        <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              if (onClose) {
                onClose();
              } else if (typeof window !== 'undefined') {
                if (window.history.length > 1) window.history.back();
                else window.location.href = '/';
              }
            }}
            title="Back"
            className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-[#1b1c20] hover:bg-[#232429] border border-[#26272d] text-[#d8dae0] hover:text-white flex items-center gap-1.5 text-[11px] sm:text-[12px] font-medium shrink-0 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">Back</span>
          </button>
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              aria-label="Project title"
              className="w-full bg-transparent text-[15px] sm:text-[26px] md:text-[32px] font-medium tracking-tight text-white leading-tight focus:outline-none truncate"
            />
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#7b7f89] min-w-0">
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  isRecording ? 'bg-[#ff5a36] animate-pulse' : selectedTrack ? 'bg-[#4ade80]' : 'bg-[#5d616b]'
                }`}
              />
              <span className="truncate">
                {isRecording
                  ? `Recording ${armedTrack?.name || 'vocal'}…`
                  : selectedTrack
                  ? `${selectedTrack.title}${selectedTrack.artist ? ` · ${selectedTrack.artist}` : ''}`
                  : 'Choose a free beat to get started'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReturnToZero}
            title="Return to start"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#1b1c20] hover:bg-[#232429] text-[#c9ccd3] flex items-center justify-center transition-colors"
          >
            <SkipBack className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
          </button>
          <button
            type="button"
            onClick={onStudioPlay}
            disabled={isRecording}
            title="Play / Pause"
            className="w-10 h-9 sm:w-14 sm:h-11 rounded-xl bg-[#ff5a36] hover:bg-[#ff6b49] text-white flex items-center justify-center shadow-[0_0_22px_rgba(255,90,54,0.35)] transition-colors disabled:opacity-50"
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>
          <button
            type="button"
            onClick={onStudioRecord}
            title={
              isRecording
                ? 'Stop recording'
                : `Record ${armedTrack?.name || 'vocal'} from ${formatTimecode(playheadTime)} (Non-destructive Punch-In)`
            }
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-colors ${
              isRecording ? 'bg-[#ff5a36]' : 'bg-[#1b1c20] hover:bg-[#232429]'
            }`}
          >
            {isRecording ? (
              <span className="w-3 h-3 rounded-[3px] bg-white" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5a36]" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setIsLoopEnabled(!isLoopEnabled)}
            title="Loop"
            className={`hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-xl items-center justify-center transition-colors ${
              isLoopEnabled ? 'bg-[#3a1e18] text-[#ff5a36]' : 'bg-[#2a1b18] text-[#ff5a36] opacity-80 hover:opacity-100'
            }`}
          >
            <Repeat className="h-4 w-4" />
          </button>

          <div className="pl-1 sm:pl-3">
            <div className="text-[18px] sm:text-[36px] md:text-[44px] font-medium text-white tabular-nums tracking-tight leading-none">
              {formattedBeatCounter}
            </div>
            <div className="hidden sm:flex gap-1 mt-1.5">
              <span className="h-[3px] w-4 rounded-full bg-[#ff5a36]" />
              <span className="h-[3px] w-4 rounded-full bg-[#2a2b30]" />
              <span className="h-[3px] w-4 rounded-full bg-[#2a2b30]" />
              <span className="h-[3px] w-4 rounded-full bg-[#2a2b30]" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2.5 min-w-0">
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setBpmInputOpen(!bpmInputOpen)}
              title="Tempo"
              className="w-[60px] h-11 rounded-xl bg-[#1b1c20] hover:bg-[#232429] flex flex-col items-center justify-center transition-colors"
            >
              <span className="text-[17px] font-semibold text-white leading-none tabular-nums">{sessionBpm}</span>
              <span className="text-[10px] text-[#757983] leading-none mt-1">BPM</span>
            </button>
            {bpmInputOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 p-2.5 rounded-xl bg-[#1b1c20] border border-[#2a2b31] shadow-2xl z-50 space-y-2">
                <span className="text-[10px] text-[#757983] block">Tempo (BPM)</span>
                <input
                  type="number"
                  min="60"
                  max="200"
                  value={sessionBpm}
                  onChange={(e) => setSessionBpm(parseInt(e.target.value, 10) || 92)}
                  className="w-full bg-[#111215] border border-[#2a2b31] rounded-md px-2 py-1 text-white text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setBpmInputOpen(false)}
                  className="w-full py-1 rounded-md bg-[#ff5a36] text-white text-[11px] font-semibold"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          <div
            className="hidden md:flex w-[68px] h-11 rounded-xl bg-[#1b1c20] flex-col items-center justify-center"
            title="Beat key & time signature"
          >
            <span className="text-[17px] font-semibold text-white leading-none">{studioKeyLabel}</span>
            <span className="text-[10px] text-[#757983] leading-none mt-1">{timeSignature}</span>
          </div>

          <button
            type="button"
            onClick={() => setMobileInspectorOpen((v) => !v)}
            title="Toggle Vocal Editor & FX Inspector"
            className={`lg:hidden h-8 sm:h-10 px-2.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0 ${
              mobileInspectorOpen
                ? 'bg-[#ff5a36] border-[#ff5a36] text-white'
                : 'bg-[#1b1c20] border-[#26272d] text-[#d8dae0] hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">FX</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExportDialogOpen(true)}
            className="h-8 sm:h-11 px-2.5 sm:px-4 rounded-xl bg-[#f5f3ef] hover:bg-white text-black text-[11px] sm:text-[13px] font-semibold flex items-center gap-1.5 sm:gap-2 transition-colors shrink-0"
          >
            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </header>

      {/* 3. WORKSPACE: TIMELINE + INSPECTOR */}
      <div className="flex-1 min-h-0 flex">
        {/* Timeline column */}
        <div className="flex-1 min-w-0 flex flex-col relative">
          {/* Ruler */}
          <div className="h-8 shrink-0 flex border-b border-[#1c1d21]">
            <div className="w-[128px] sm:w-[190px] shrink-0 flex items-center gap-1 pl-4">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, z / 2))}
                title="Zoom out"
                className="w-5 h-5 rounded-md text-[#757983] hover:text-white hover:bg-white/5 flex items-center justify-center"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(16, z * 2))}
                title="Zoom in"
                className="w-5 h-5 rounded-md text-[#757983] hover:text-white hover:bg-white/5 flex items-center justify-center"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="relative flex-1 cursor-pointer" onClick={handleStudioSeek}>
              {studioBars.map((b) => (
                <span
                  key={b}
                  className="absolute bottom-1.5 text-[11px] text-[#6d717b] tabular-nums leading-none"
                  style={{ left: `calc(${timeToPct((b - 1) * studioBarSec)}% + 6px)` }}
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Track rows */}
          <div className="flex-1 min-h-0 flex flex-col overflow-y-auto overflow-x-hidden bg-[#0f1013]">
            {studioRows.map((row) => {
              const muted = rowMuted(row);
              const solo = rowSolo(row);
              const t = row.track;
              const isRowSelected = selectedRow.id === row.id;
              return (
                <div
                  key={row.id}
                  onClick={() => setSelectedClipId(row.id)}
                  className="grow shrink-0 basis-0 min-h-[64px] max-h-[104px] flex border-b border-[#1a1b1f]"
                >
                  <div
                    className={`w-[128px] sm:w-[190px] shrink-0 relative flex items-center justify-between gap-1 pl-4 pr-2 border-r border-[#1a1b1f] cursor-pointer ${
                      isRowSelected ? 'bg-[#16171b]' : 'bg-[#121316]'
                    }`}
                  >
                    <span
                      className="absolute left-1 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-full"
                      style={{ background: row.style.dot }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-white truncate leading-tight">{row.name}</div>
                      {row.kind === 'beat' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBeatPickerOpen(true);
                          }}
                          title="Choose a free beat"
                          className="hidden sm:block max-w-full text-left text-[10px] text-[#8a8e98] hover:text-[#ff5a36] truncate leading-tight mt-0.5"
                        >
                          {selectedTrack ? `${selectedTrack.title} · Change` : 'Choose a free beat'}
                        </button>
                      ) : (
                        <div className="hidden sm:block text-[10px] text-[#757983] truncate leading-tight mt-0.5">
                          {row.sub}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {t && (
                        <button
                          type="button"
                          title={t.isArmed ? 'Armed for recording' : 'Arm for recording'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isRecording) handleArmTrack(row.id);
                          }}
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md text-[10px] font-semibold transition-colors ${
                            t.isArmed ? 'bg-[#e5453a] text-white' : 'bg-[#1d1e22] text-[#8a8e98] hover:text-white'
                          }`}
                        >
                          R
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowSolo(row);
                        }}
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md text-[10px] font-semibold transition-colors ${
                          solo ? 'bg-[#f5b841] text-black' : 'bg-[#1d1e22] text-[#8a8e98] hover:text-white'
                        }`}
                      >
                        S
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowMute(row);
                        }}
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md text-[10px] font-semibold transition-colors ${
                          muted ? 'bg-[#ff5a36] text-white' : 'bg-[#1d1e22] text-[#8a8e98] hover:text-white'
                        }`}
                      >
                        M
                      </button>
                    </div>
                  </div>

                  <div
                    className={`relative flex-1 bg-[#0f1013] cursor-pointer ${muted ? 'opacity-45' : ''}`}
                    onClick={handleStudioSeek}
                  >
                    {studioBars.map((b) => (
                      <span
                        key={b}
                        className="absolute top-0 bottom-0 w-px bg-white/[0.04]"
                        style={{ left: `${timeToPct((b - 1) * studioBarSec)}%` }}
                      />
                    ))}

                    {/* BEAT LANE */}
                    {row.kind === 'beat' &&
                      (selectedTrack ? (
                        <StudioTakeClip
                          id="beat"
                          name={selectedTrack.title}
                          leftPct={0}
                          widthPct={Math.min(100, (studioBeatSec / studioViewSpan) * 100)}
                          style={row.style}
                          selected={selectedRow.id === 'beat'}
                          onSelect={setSelectedClipId}
                          url={selectedTrack.audioUrl}
                          seed={selectedTrack.id}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBeatPickerOpen(true);
                          }}
                          className="absolute inset-y-3 left-3 right-3 rounded-lg border border-dashed border-[#3a3d45] hover:border-[#ff5a36]/60 hover:bg-[#ff5a36]/[0.05] text-[12px] text-[#8a8e98] hover:text-white flex items-center justify-center gap-2 transition-colors"
                        >
                          <Disc3 className="h-4 w-4" />
                          Choose a free beat from the Beat Store
                        </button>
                      ))}

                    {/* VOCAL LANES */}
                    {t && t.vocalUrl && (() => {
                      const fullDur = Math.max(0.25, t.durationSeconds || 1);
                      const rate = Math.max(0.75, Math.min(1.25, t.playbackRate ?? 1.0));
                      const trimIn = Math.max(0, t.trimStartSec ?? 0);
                      const trimOut = Math.max(trimIn + 0.15, t.trimEndSec ?? fullDur);
                      const rawStart = t.startTimeSec ?? 0;
                      const fullSpanSec = Math.max(0.25, (trimOut - trimIn) / rate);
                      const clipEndSec = rawStart + fullSpanSec;
                      const clipStart = Math.max(0, rawStart);
                      const visibleSpanSec = Math.max(0.25, clipEndSec - clipStart);
                      const earlyCutSourceSec = rawStart < 0 ? Math.abs(rawStart) * rate : 0;
                      const effectiveTrimIn = Math.min(trimOut - 0.05, trimIn + earlyCutSourceSec);
                      const trimStartRatio = Math.max(0, Math.min(0.98, effectiveTrimIn / fullDur));
                      const trimEndRatio = Math.max(trimStartRatio + 0.02, Math.min(1, trimOut / fullDur));
                      const speedPct = Math.round(rate * 100);
                      const takesCount = t.clips?.length || 1;
                      const posTag =
                        Math.abs(rawStart) >= 0.02
                          ? ` ${rawStart >= 0 ? '+' : ''}${rawStart.toFixed(2)}s`
                          : '';
                      const speedTag = speedPct !== 100 ? ` · ${speedPct}%` : '';
                      const takesTag = takesCount > 1 ? ` · ${takesCount} regions` : '';
                      const clipBadge =
                        posTag || speedTag || takesTag
                          ? `${row.name}${posTag}${speedTag}${takesTag}`
                          : trimIn > 0.05 || trimOut < fullDur - 0.05
                          ? `${row.name} (${(trimOut - trimIn).toFixed(1)}s)`
                          : `${row.name} take`;
                      return (
                        <StudioTakeClip
                          id={row.id}
                          name={clipBadge}
                          leftPct={timeToPct(clipStart)}
                          widthPct={timeToPct(visibleSpanSec)}
                          style={row.style}
                          selected={selectedRow.id === row.id}
                          onSelect={setSelectedClipId}
                          url={t.vocalUrl}
                          seed={row.id}
                          onDelete={() => handleClearVocalTake(row.id)}
                          onUndo={(t.undoStack?.length || 0) > 0 ? () => handleUndoVocalTake(row.id) : undefined}
                          viewSpanSec={studioViewSpan}
                          trimStartRatio={trimStartRatio}
                          trimEndRatio={trimEndRatio}
                          segments={t.clips}
                          clipStartSec={clipStart}
                          clipSpanSec={visibleSpanSec}
                          onMoveDeltaSec={(d) => handleMoveVocalClip(row.id, d)}
                          onTrimStartDeltaSec={(d) => handleTrimVocalStart(row.id, d)}
                          onTrimEndDeltaSec={(d) => handleTrimVocalEnd(row.id, d)}
                        />
                      );
                    })()}
                    {t && isRecording && t.isArmed && (() => {
                      const punchStart = Math.max(0, recBeatStartSecRef.current || 0);
                      const recElapsed = Math.max(0.2, recordingSeconds - punchStart);
                      return (
                        <StudioTakeClip
                          id={`${row.id}-live`}
                          name={
                            t.vocalBlob
                              ? `Punch-In @ ${formatTimecode(punchStart)}`
                              : `Recording @ ${formatTimecode(punchStart)}`
                          }
                          leftPct={timeToPct(punchStart)}
                          widthPct={timeToPct(recElapsed)}
                          style={row.style}
                          selected={false}
                          onSelect={setSelectedClipId}
                          seed={`${row.id}-live`}
                          live={liveWaveformHistory}
                        />
                      );
                    })()}
                    {t && !t.vocalUrl && !(isRecording && t.isArmed) && (
                      <div className="absolute inset-0 flex items-center justify-between px-4 gap-3 pointer-events-none">
                        <span className="text-[12px] text-[#5d616b] truncate">
                          {t.isArmed
                            ? `Armed · Click timeline to set start (${formatTimecode(playheadTime)}) & press Record`
                            : 'Click R to arm this track'}
                        </span>
                        {row.kind === 'backup' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTrack(row.id);
                            }}
                            className="pointer-events-auto shrink-0 h-6 px-2 rounded-md text-[11px] text-[#757983] hover:text-white hover:bg-white/5"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add backup */}
            <div className="shrink-0 flex h-11 border-b border-[#1a1b1f]">
              <div className="w-[128px] sm:w-[190px] shrink-0 bg-[#121316] border-r border-[#1a1b1f] flex items-center pl-4">
                <button
                  type="button"
                  onClick={handleAddBackupVocalTrack}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-[#9a9ea8] hover:text-white transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add backup
                </button>
              </div>
              <div className="flex-1 bg-[#0f1013]" />
            </div>

            {/* Filler */}
            <div className="grow-[0.01] basis-0 min-h-0 flex">
              <div className="w-[128px] sm:w-[190px] shrink-0 bg-[#121316] border-r border-[#1a1b1f]" />
              <div className="flex-1 bg-[#0f1013]" />
            </div>
          </div>

          {/* Playhead overlay (aligned to lane area) */}
          <div className="absolute top-0 bottom-0 right-0 left-[128px] sm:left-[190px] pointer-events-none overflow-hidden">
            {isLoopEnabled && (
              <div className="absolute top-[3px] h-[3px] rounded-full bg-[#ff5a36] left-0 right-0" />
            )}
            {studioPlayheadPct <= 100 && (
              <div
                className="absolute top-0 bottom-0 w-[1.5px] bg-[#ff5a36] shadow-[0_0_8px_rgba(255,90,54,0.7)]"
                style={{ left: `${studioPlayheadPct}%` }}
              />
            )}
          </div>
        </div>

        {/* Inspector */}
        <aside
          className={`${
            mobileInspectorOpen
              ? 'fixed inset-y-0 right-0 z-40 flex w-[88vw] max-w-[340px] shadow-2xl'
              : 'hidden lg:flex w-[26%] min-w-[260px] max-w-[340px]'
          } shrink-0 flex-col gap-3 bg-[#131417] border-l border-[#1c1d21] px-4 sm:px-5 py-4 overflow-y-auto overflow-x-hidden`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: selectedRow.style.wave }} />
                <h3 className="text-[16px] font-semibold text-white leading-none truncate">{selectedTitle}</h3>
              </div>
              <p className="text-[11px] text-[#757983] mt-2 leading-none truncate">{selectedDesc}</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileInspectorOpen(false)}
              title="Close Inspector"
              className="lg:hidden w-7 h-7 rounded-lg bg-[#1b1c20] hover:bg-[#25272e] text-[#9a9ea8] hover:text-white flex items-center justify-center shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="relative h-[13vh] min-h-[78px] max-h-[120px] rounded-xl bg-[#0f1012] border border-[#1c1d21] px-3 py-2.5 shrink-0 overflow-hidden">
            {selectedUrl ? (
              <>
                <AudioWave
                  url={selectedUrl}
                  seed={`inspector-${selectedRow.id}`}
                  color={selectedRow.style.wave}
                  bars={46}
                />
                {/* Shaded Trim-In / Trim-Out Regions when viewing a Vocal Take */}
                {selectedRow.kind !== 'beat' && selectedRow.track && (selectedRow.track.durationSeconds || 0) > 0 && (() => {
                  const dur = Math.max(0.2, selectedRow.track.durationSeconds || 1);
                  const tInPct = Math.max(0, Math.min(95, ((selectedRow.track.trimStartSec ?? 0) / dur) * 100));
                  const tOutPct = Math.max(5, Math.min(100, ((selectedRow.track.trimEndSec ?? dur) / dur) * 100));
                  return (
                    <>
                      {tInPct > 0.5 && (
                        <div
                          className="absolute inset-y-0 left-0 bg-black/70 border-r border-[#ff5a36]"
                          style={{ width: `${tInPct}%` }}
                        />
                      )}
                      {tOutPct < 99.5 && (
                        <div
                          className="absolute inset-y-0 right-0 bg-black/70 border-l border-[#ff5a36]"
                          style={{ width: `${100 - tOutPct}%` }}
                        />
                      )}
                    </>
                  );
                })()}
                <span
                  className="absolute top-2 bottom-2 w-px bg-[#ff5a36]"
                  style={{
                    left: `${Math.min(
                      100,
                      (playheadTime /
                        Math.max(
                          1,
                          selectedRow.kind === 'beat' ? studioBeatSec : selectedRow.track?.durationSeconds || 1
                        )) *
                        100
                    )}%`
                  }}
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[12px] text-[#5d616b]">
                {selectedRow.kind === 'beat' ? 'No beat loaded' : 'No recording yet'}
              </div>
            )}
          </div>

          {/* VOCAL CLIP TRIM, MOVE (FORWARD/BACKWARD) & SPEED MATCH EDITOR */}
          {selectedRow.kind !== 'beat' && selectedRow.track?.vocalBlob && (() => {
            const trk = selectedRow.track;
            const dur = Math.max(0.2, trk.durationSeconds || 1);
            const trimIn = Math.max(0, trk.trimStartSec ?? 0);
            const trimOut = Math.max(trimIn + 0.15, trk.trimEndSec ?? dur);
            const startSec = trk.startTimeSec ?? 0;
            const rate = Math.max(0.75, Math.min(1.25, trk.playbackRate ?? 1.0));
            const speedPct = Number((rate * 100).toFixed(1));
            const undoCount = trk.undoStack?.length || 0;
            const regionCount = trk.clips?.length || 1;
            return (
              <div className="rounded-xl bg-[#0f1012] border border-[#1c1d21] p-2.5 space-y-2 shrink-0">
                {/* 0. Cubase Punch-In Location & Non-Destructive Take History */}
                <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-[#1b1c21]">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-[#d8dae0] truncate">
                      Punch-In @ <span className="text-[#ff7a5c] tabular-nums">{formatTimecode(playheadTime)}</span>
                    </div>
                    <div className="text-[9px] text-[#757983] truncate">
                      {regionCount} recorded region{regionCount > 1 ? 's' : ''} · non-destructive
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {undoCount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleUndoVocalTake(selectedRow.id)}
                        title="Undo last punch-in take and restore previous recording"
                        className="h-6 px-2 rounded-md bg-[#1d1e25] hover:bg-[#ff5a36] text-[10px] font-semibold text-white flex items-center gap-1 transition-colors"
                      >
                        <Undo2 className="h-3 w-3" />
                        <span>Undo ({undoCount})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleClearVocalTake(selectedRow.id)}
                      title="Clear entire track recording"
                      className="h-6 px-1.5 rounded-md bg-[#1d1e25] hover:bg-[#e5453a] text-[10px] font-semibold text-[#9a9ea8] hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* 1. Move Vocal Backward / Forward on Beat Timeline */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-[#8a8e98] font-medium">Move Vocal (Back / Fwd)</span>
                    <button
                      type="button"
                      onClick={() => handleSetVocalStartTime(selectedRow.id, 0)}
                      title="Reset position to 0.00s"
                      className="text-[#5eead4] hover:underline font-semibold tabular-nums"
                    >
                      {startSec >= 0 ? `+${startSec.toFixed(2)}s` : `${startSec.toFixed(2)}s`}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveVocalClip(selectedRow.id, -0.05)}
                      title="Move vocal backward 50ms (earlier)"
                      className="h-5 px-1.5 rounded bg-[#1b1c22] hover:bg-[#282a33] text-[9.5px] font-semibold text-white"
                    >
                      ◀ -50ms
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveVocalClip(selectedRow.id, -0.01)}
                      title="Move vocal backward 10ms"
                      className="h-5 px-1.5 rounded bg-[#1b1c22] hover:bg-[#282a33] text-[9.5px] font-semibold text-[#c9ccd3] hover:text-white"
                    >
                      -10ms
                    </button>
                    <input
                      type="range"
                      min={-5}
                      max={Math.min(60, Math.round(studioBeatSec))}
                      step={0.02}
                      value={startSec}
                      onChange={(e) => handleSetVocalStartTime(selectedRow.id, Number(e.target.value))}
                      title="Slide vocal clip backward or forward along the beat"
                      className="flex-1 h-1 accent-[#4fc1b5] bg-[#23242a] rounded-lg cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => handleMoveVocalClip(selectedRow.id, 0.01)}
                      title="Move vocal forward 10ms"
                      className="h-5 px-1.5 rounded bg-[#1b1c22] hover:bg-[#282a33] text-[9.5px] font-semibold text-[#c9ccd3] hover:text-white"
                    >
                      +10ms
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveVocalClip(selectedRow.id, 0.05)}
                      title="Move vocal forward 50ms (later)"
                      className="h-5 px-1.5 rounded bg-[#1b1c22] hover:bg-[#282a33] text-[9.5px] font-semibold text-white"
                    >
                      +50ms ▶
                    </button>
                  </div>
                </div>

                {/* 2. Trim Vocal Start & End */}
                <div className="space-y-1 pt-1 border-t border-[#1b1c21]">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-[#8a8e98] font-medium">
                      Trim Vocal <span className="text-[#6a6e78]">({trimIn.toFixed(1)}s – {trimOut.toFixed(1)}s)</span>
                    </span>
                    {(trimIn > 0.02 || trimOut < dur - 0.02) && (
                      <button
                        type="button"
                        onClick={() => handleSetVocalTrim(selectedRow.id, 0, dur)}
                        className="text-[9.5px] text-[#ff7a5c] hover:underline font-semibold"
                      >
                        Reset Trim
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] text-[#757983] shrink-0">In</span>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0.05, Number((trimOut - 0.15).toFixed(2)))}
                        step={0.05}
                        value={trimIn}
                        onChange={(e) => handleSetVocalTrim(selectedRow.id, Number(e.target.value), trimOut)}
                        title="Trim vocal start"
                        className="w-full h-1 accent-[#ff5a36] bg-[#23242a] rounded-lg cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9.5px] text-[#757983] shrink-0">Out</span>
                      <input
                        type="range"
                        min={Math.min(dur, Number((trimIn + 0.15).toFixed(2)))}
                        max={dur}
                        step={0.05}
                        value={trimOut}
                        onChange={(e) => handleSetVocalTrim(selectedRow.id, trimIn, Number(e.target.value))}
                        title="Trim vocal end"
                        className="w-full h-1 accent-[#ff5a36] bg-[#23242a] rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Vocal Playback Speed (Match Beat Tempo without changing pitch) */}
                <div className="space-y-1 pt-1 border-t border-[#1b1c21]">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-[#8a8e98] font-medium">Vocal Speed (Match Beat)</span>
                    <button
                      type="button"
                      onClick={() => handleVocalSpeedChange(selectedRow.id, 1.0)}
                      title="Click to reset speed to 100%"
                      className="text-[#f5b841] hover:underline font-semibold tabular-nums"
                    >
                      {speedPct}%
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleVocalSpeedChange(selectedRow.id, rate - 0.01)}
                      title="Slow down vocal by 1% (use if vocal is faster than beat)"
                      className="h-5 px-1.5 rounded bg-[#1b1c22] hover:bg-[#282a33] text-[9.5px] font-semibold text-white"
                    >
                      -1%
                    </button>
                    <input
                      type="range"
                      min={75}
                      max={125}
                      step={0.5}
                      value={speedPct}
                      onChange={(e) => handleVocalSpeedChange(selectedRow.id, Number(e.target.value) / 100)}
                      title="Adjust vocal speed (pitch-preserved) to match the beat"
                      className="flex-1 h-1 accent-[#f5b841] bg-[#23242a] rounded-lg cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => handleVocalSpeedChange(selectedRow.id, rate + 0.01)}
                      title="Speed up vocal by 1% (use if vocal is slower than beat)"
                      className="h-5 px-1.5 rounded bg-[#1b1c22] hover:bg-[#282a33] text-[9.5px] font-semibold text-white"
                    >
                      +1%
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="flex gap-2 shrink-0">
            {selectedRow.kind === 'beat' ? (
              <button
                type="button"
                onClick={() => setBeatPickerOpen(true)}
                className="flex-1 h-8 rounded-lg bg-[#1b1c20] hover:bg-[#232429] text-[12px] font-medium text-white"
              >
                {selectedTrack ? 'Change beat' : 'Choose free beat'}
              </button>
            ) : (
              <>
                {selectedRow.track?.vocalBlob && (
                  <button
                    type="button"
                    onClick={() => handleClearVocalTake(selectedRow.id)}
                    className="flex-1 h-8 rounded-lg bg-[#1b1c20] hover:bg-[#3a1e18] text-[12px] font-medium text-white"
                  >
                    Delete take
                  </button>
                )}
                {selectedRow.kind === 'backup' && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTrack(selectedRow.id)}
                    className="flex-1 h-8 rounded-lg bg-[#1b1c20] hover:bg-[#232429] text-[12px] font-medium text-[#c9ccd3]"
                  >
                    Remove track
                  </button>
                )}
              </>
            )}
          </div>

          {/* DSP Effect Module Selector: Filter | Reverb | Delay | EQ | Dynamics */}
          <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-[#0f1012] border border-[#1c1d21] shrink-0">
            {(
              [
                { id: 'filter', label: 'Filter' },
                { id: 'reverb', label: 'Reverb' },
                { id: 'delay', label: 'Delay' },
                { id: 'eq', label: 'EQ' },
                { id: 'dynamics', label: 'Dynamics' }
              ] as const
            ).map((tab) => {
              const isActive = inspectorFxTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    ensurePlaybackCtx();
                    setInspectorFxTab(tab.id);
                  }}
                  className={`h-7 rounded-lg text-[10.5px] font-semibold transition-colors flex items-center justify-center ${
                    isActive
                      ? 'bg-[#25262c] text-white shadow-sm border border-[#32343c]'
                      : 'text-[#757983] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* 1. FILTER MODULE */}
          {inspectorFxTab === 'filter' && (
            <>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[13px] font-medium text-white">Filter</span>
                <div className="flex items-center p-0.5 rounded-lg bg-[#1b1c20]">
                  {(['LP 24', 'HP', 'BP'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        ensurePlaybackCtx();
                        setFilterType(m);
                      }}
                      className={`px-2.5 h-5 rounded-md text-[10px] font-semibold transition-colors ${
                        filterType === m ? 'bg-[#2c2d33] text-white' : 'text-[#757983] hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-between px-1 shrink-0">
                <RotaryKnob
                  size={84}
                  norm={Math.log(filterCutoff / 0.02) / Math.log(20 / 0.02)}
                  valueLabel={`${filterCutoff.toFixed(1)} kHz`}
                  label="Cutoff"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setFilterCutoff(Math.round(0.02 * Math.pow(1000, n) * 10) / 10 || 0.1);
                  }}
                />
                <RotaryKnob
                  size={58}
                  norm={filterResonance}
                  valueLabel={filterResonance.toFixed(2)}
                  label="Resonance"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setFilterResonance(Math.round(n * 100) / 100);
                  }}
                />
                <RotaryKnob
                  size={58}
                  norm={filterDrive / 12}
                  valueLabel={`${filterDrive.toFixed(1)} dB`}
                  label="Drive"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setFilterDrive(Math.round(n * 12 * 10) / 10);
                  }}
                />
              </div>

              <div className="h-[84px] shrink-0 rounded-xl bg-[#0f1012] border border-[#1c1d21] overflow-hidden">
                <FilterCurve
                  type={filterType}
                  cutoffKhz={filterCutoff}
                  resonance={filterResonance}
                  driveDb={filterDrive}
                />
              </div>
            </>
          )}

          {/* 2. REVERB MODULE */}
          {inspectorFxTab === 'reverb' && (
            <>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[13px] font-medium text-white">Reverb</span>
                <div className="flex items-center p-0.5 rounded-lg bg-[#1b1c20]">
                  {(['Room', 'Hall', 'Plate'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        ensurePlaybackCtx();
                        setReverbMode(m);
                        if (m === 'Room') {
                          setReverbDecay(1.2);
                          setReverbTone(5.5);
                        } else if (m === 'Hall') {
                          setReverbDecay(3.2);
                          setReverbTone(4.5);
                        } else {
                          setReverbDecay(2.2);
                          setReverbTone(9.5);
                        }
                      }}
                      className={`px-2.5 h-5 rounded-md text-[10px] font-semibold transition-colors ${
                        reverbMode === m ? 'bg-[#2c2d33] text-white' : 'text-[#757983] hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-between px-1 shrink-0">
                <RotaryKnob
                  size={84}
                  norm={reverbAmount}
                  valueLabel={`${Math.round(reverbAmount * 100)}%`}
                  label="Mix"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setReverbAmount(Math.round(n * 100) / 100);
                  }}
                />
                <RotaryKnob
                  size={58}
                  norm={(reverbDecay - 0.4) / 5.6}
                  valueLabel={`${reverbDecay.toFixed(1)} s`}
                  label="Decay"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setReverbDecay(Math.round((0.4 + n * 5.6) * 10) / 10);
                  }}
                />
                <RotaryKnob
                  size={58}
                  norm={(reverbTone - 1.0) / 15.0}
                  valueLabel={`${reverbTone.toFixed(1)} kHz`}
                  label="Tone"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setReverbTone(Math.round((1.0 + n * 15.0) * 10) / 10);
                  }}
                />
              </div>

              <div className="h-[84px] shrink-0 rounded-xl bg-[#0f1012] border border-[#1c1d21] overflow-hidden">
                <ReverbCurve mix={reverbAmount} decaySec={reverbDecay} toneKhz={reverbTone} mode={reverbMode} />
              </div>
            </>
          )}

          {/* 3. DELAY MODULE */}
          {inspectorFxTab === 'delay' && (
            <>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[13px] font-medium text-white">Delay</span>
                <div className="flex items-center p-0.5 rounded-lg bg-[#1b1c20]">
                  {(['1/4', '1/8', '1/8D'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        ensurePlaybackCtx();
                        setDelaySync(m);
                      }}
                      className={`px-2.5 h-5 rounded-md text-[10px] font-semibold transition-colors ${
                        delaySync === m ? 'bg-[#2c2d33] text-white' : 'text-[#757983] hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-between px-1 shrink-0">
                <RotaryKnob
                  size={84}
                  norm={delayAmount}
                  valueLabel={`${Math.round(delayAmount * 100)}%`}
                  label="Mix"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setDelayAmount(Math.round(n * 100) / 100);
                  }}
                />
                <RotaryKnob
                  size={58}
                  norm={delayFeedback / 0.85}
                  valueLabel={`${Math.round(delayFeedback * 100)}%`}
                  label="Feedback"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setDelayFeedback(Math.round(n * 0.85 * 100) / 100);
                  }}
                />
                <RotaryKnob
                  size={58}
                  norm={(delayCutoff - 0.8) / 11.2}
                  valueLabel={`${delayCutoff.toFixed(1)} kHz`}
                  label="Cutoff"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setDelayCutoff(Math.round((0.8 + n * 11.2) * 10) / 10);
                  }}
                />
              </div>

              <div className="h-[84px] shrink-0 rounded-xl bg-[#0f1012] border border-[#1c1d21] overflow-hidden">
                <DelayCurve mix={delayAmount} feedback={delayFeedback} cutoffKhz={delayCutoff} sync={delaySync} />
              </div>
            </>
          )}

          {/* 4. EQ MODULE */}
          {inspectorFxTab === 'eq' && (
            <>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[13px] font-medium text-white">EQ</span>
                <div className="flex items-center p-0.5 rounded-lg bg-[#1b1c20]">
                  {(['80Hz Cut', 'Flat', 'Air'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        ensurePlaybackCtx();
                        setEqPreset(m);
                        if (m === '80Hz Cut') {
                          setLowCutEnabled(true);
                        } else if (m === 'Flat') {
                          setLowCutEnabled(false);
                          setEqLow(0);
                          setEqMid(0);
                          setEqHigh(0);
                        } else if (m === 'Air') {
                          setLowCutEnabled(true);
                          setEqLow(-1.0);
                          setEqMid(2.0);
                          setEqHigh(4.5);
                        }
                      }}
                      className={`px-2.5 h-5 rounded-md text-[10px] font-semibold transition-colors ${
                        eqPreset === m ? 'bg-[#2c2d33] text-white' : 'text-[#757983] hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-between px-1 shrink-0">
                <RotaryKnob
                  size={84}
                  norm={(eqLow + 12) / 24}
                  valueLabel={`${eqLow >= 0 ? '+' : ''}${eqLow.toFixed(1)} dB`}
                  label="Low"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setEqLow(Math.round((-12 + n * 24) * 10) / 10);
                  }}
                />
                <RotaryKnob
                  size={58}
                  norm={(eqMid + 12) / 24}
                  valueLabel={`${eqMid >= 0 ? '+' : ''}${eqMid.toFixed(1)} dB`}
                  label="Mid"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setEqMid(Math.round((-12 + n * 24) * 10) / 10);
                  }}
                />
                <RotaryKnob
                  size={58}
                  norm={(eqHigh + 12) / 24}
                  valueLabel={`${eqHigh >= 0 ? '+' : ''}${eqHigh.toFixed(1)} dB`}
                  label="High"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setEqHigh(Math.round((-12 + n * 24) * 10) / 10);
                  }}
                />
              </div>

              <div className="h-[84px] shrink-0 rounded-xl bg-[#0f1012] border border-[#1c1d21] overflow-hidden">
                <EqCurve lowDb={eqLow} midDb={eqMid} highDb={eqHigh} lowCut={lowCutEnabled} />
              </div>
            </>
          )}

          {/* 5. DYNAMICS MODULE */}
          {inspectorFxTab === 'dynamics' && (
            <>
              <div className="flex items-center justify-between mt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    ensurePlaybackCtx();
                    setCompressorEnabled((v) => !v);
                  }}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-white"
                  title="Toggle Dynamics Compressor"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      compressorEnabled ? 'bg-[#ff5a36]' : 'bg-[#4b4e57]'
                    }`}
                  />
                  <span>Dynamics</span>
                </button>
                <div className="flex items-center p-0.5 rounded-lg bg-[#1b1c20]">
                  {(['Vocal', 'Punch', 'Limit'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        ensurePlaybackCtx();
                        setCompressorEnabled(true);
                        setDynamicsMode(m);
                        if (m === 'Vocal') {
                          setCompThreshold(-18);
                          setCompRatio(4.0);
                          setCompMakeup(2.5);
                        } else if (m === 'Punch') {
                          setCompThreshold(-22);
                          setCompRatio(6.0);
                          setCompMakeup(4.0);
                        } else {
                          setCompThreshold(-12);
                          setCompRatio(12.0);
                          setCompMakeup(3.5);
                        }
                      }}
                      className={`px-2.5 h-5 rounded-md text-[10px] font-semibold transition-colors ${
                        dynamicsMode === m ? 'bg-[#2c2d33] text-white' : 'text-[#757983] hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-end justify-between px-1 shrink-0">
                <RotaryKnob
                  size={84}
                  norm={(compThreshold + 40) / 40}
                  valueLabel={`${compThreshold.toFixed(1)} dB`}
                  label="Threshold"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setCompressorEnabled(true);
                    setCompThreshold(Math.round((-40 + n * 40) * 10) / 10);
                  }}
                />
                <RotaryKnob
                  size={58}
                  norm={(compRatio - 1) / 11}
                  valueLabel={`${compRatio.toFixed(1)}:1`}
                  label="Ratio"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setCompressorEnabled(true);
                    setCompRatio(Math.round((1 + n * 11) * 10) / 10);
                  }}
                />
                <RotaryKnob
                  size={58}
                  norm={compMakeup / 12}
                  valueLabel={`+${compMakeup.toFixed(1)} dB`}
                  label="Makeup"
                  onNorm={(n) => {
                    ensurePlaybackCtx();
                    setCompressorEnabled(true);
                    setCompMakeup(Math.round(n * 12 * 10) / 10);
                  }}
                />
              </div>

              <div className="h-[84px] shrink-0 rounded-xl bg-[#0f1012] border border-[#1c1d21] overflow-hidden">
                <DynamicsCurve
                  thresholdDb={compThreshold}
                  ratio={compressorEnabled ? compRatio : 1}
                  makeupDb={compressorEnabled ? compMakeup : 0}
                />
              </div>
            </>
          )}
        </aside>
      </div>

      {/* 4. MIXER */}
      <div className="shrink-0 h-[33vh] min-h-[208px] max-h-[256px] bg-[#101114] border-t border-[#1c1d21] flex gap-2.5 sm:gap-3.5 px-2.5 sm:px-6 py-2.5">
        <div className="hidden md:flex w-[116px] lg:w-[124px] shrink-0 flex-col justify-between py-1">
          <div>
            <div className="text-[17px] font-semibold text-white leading-none">Mixer</div>
            <div className="text-[11px] text-[#757983] mt-2 leading-none">{studioRows.length} tracks · 1 bus</div>
          </div>
          {isRecording ? (
            <div className="inline-flex self-start items-center gap-1.5 h-6 px-2.5 rounded-md bg-[#2a1613] border border-[#4a2119] text-[11px] font-medium text-[#ff8a6e] whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a36] animate-pulse" />
              Recording · {recordingSeconds.toFixed(0)}s
            </div>
          ) : hasAnyTake ? (
            <button
              type="button"
              onClick={clearAllTakes}
              className="inline-flex self-start items-center gap-1.5 h-6 px-2.5 rounded-md bg-[#1b1c20] hover:bg-[#3a1e18] border border-[#26272d] text-[11px] font-medium text-[#c9ccd3] hover:text-white transition-colors whitespace-nowrap"
            >
              <X className="h-3 w-3" />
              Clear all takes
            </button>
          ) : (
            <div className="inline-flex self-start items-center gap-1.5 h-6 px-2.5 rounded-md bg-[#14261c] border border-[#1f3d2b] text-[11px] font-medium text-[#6ee7a0] whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" />
              Ready
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex gap-2.5 overflow-x-auto snap-x snap-mandatory pb-0.5">
          {studioRows.map((row) => {
            const db = volToDb(rowVolume(row));
            const muted = rowMuted(row);
            const solo = rowSolo(row);
            const t = row.track;
            const isVocalRow = row.kind === 'lead' || row.kind === 'backup';
            const panVal = row.kind === 'beat' ? beatPan : t?.pan ?? 0;

            return (
              <div
                key={row.id}
                onClick={() => setSelectedClipId(row.id)}
                className={`shrink-0 w-[304px] sm:w-[320px] xl:flex-1 xl:min-w-[312px] snap-start rounded-xl bg-[#16171b] border px-3 pt-2.5 pb-2 flex flex-col overflow-hidden transition-colors ${
                  selectedRow.id === row.id ? 'border-[#2f313a]' : 'border-[#202126]'
                }`}
              >
                {/* Strip Header */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.style.dot }} />
                    <span className="text-[12px] font-semibold text-white truncate">{row.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {t && (
                      <button
                        type="button"
                        title={t.isArmed ? 'Armed for recording' : 'Arm track'}
                        onClick={() => {
                          if (!isRecording) handleArmTrack(row.id);
                        }}
                        className={`h-5 px-1.5 rounded text-[9.5px] font-bold transition-colors ${
                          t.isArmed ? 'bg-[#e5453a] text-white' : 'bg-[#1f2026] text-[#8a8e98] hover:text-white'
                        }`}
                      >
                        R
                      </button>
                    )}
                    <button
                      type="button"
                      title="Solo track"
                      onClick={() => toggleRowSolo(row)}
                      className={`h-5 px-1.5 rounded text-[9.5px] font-bold transition-colors ${
                        solo ? 'bg-[#f5b841] text-black' : 'bg-[#1f2026] text-[#8a8e98] hover:text-white'
                      }`}
                    >
                      S
                    </button>
                    <button
                      type="button"
                      title="Mute track"
                      onClick={() => toggleRowMute(row)}
                      className={`h-5 px-1.5 rounded text-[9.5px] font-bold transition-colors ${
                        muted ? 'bg-[#ff5a36] text-white' : 'bg-[#1f2026] text-[#8a8e98] hover:text-white'
                      }`}
                    >
                      M
                    </button>
                  </div>
                </div>

                {/* Strip Body: Left (Fader + Meter) + Right (Track Channel Controls) */}
                <div className="flex-1 min-h-0 flex items-stretch gap-2 mt-1.5 min-w-0">
                  {/* Left: Fader + Meter + dB */}
                  <div className="flex flex-col shrink-0">
                    <div className="flex-1 min-h-0 flex items-stretch gap-1.5">
                      <MixFader db={db} accent={row.style.dot} onChange={(d) => setRowVolume(row, dbToVol(d))} />
                      <MixMeter levels={[rowMeter(row, 0), rowMeter(row, 1)]} />
                      <div className="relative w-5 shrink-0 text-[9.5px] text-[#6a6e78] tabular-nums">
                        <span className="absolute -translate-y-1/2" style={{ top: '8%' }}>0</span>
                        <span className="absolute -translate-y-1/2" style={{ top: '34%' }}>-12</span>
                        <span className="absolute -translate-y-1/2" style={{ top: '62%' }}>-24</span>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-[#7b7f89] tabular-nums leading-none mt-1 whitespace-nowrap">
                      {db <= -44.9 ? '-∞' : db.toFixed(1)} dB
                    </div>
                  </div>

                  {/* Right: Channel Strip Module */}
                  {isVocalRow ? (
                    <div
                      className="flex-1 min-w-0 flex flex-col justify-between gap-1.5 border-l border-[#22232a] pl-2 py-0.5 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 1. Mic Input Selector + Shield & Monitor Toggles */}
                      <div className="rounded-lg bg-[#111215] border border-[#1f2026] px-2 py-1.5 space-y-1.5 overflow-hidden">
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            <Mic className="h-3 w-3 text-[#4fc1b5] shrink-0" />
                            <select
                              value={audioInputDevice}
                              onChange={(e) => setAudioInputDevice(e.target.value)}
                              title="Select Microphone Input"
                              className="w-full min-w-0 bg-transparent text-[10px] font-medium text-[#d8dae0] focus:outline-none truncate cursor-pointer"
                            >
                              {availableMics.map((m) => (
                                <option key={m.deviceId} value={m.deviceId} className="bg-[#16171b] text-white">
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => setMicCleanFilter((v) => !v)}
                            title="Acoustic Noise & Echo Shield"
                            className={`h-4 px-1.5 rounded text-[9px] font-semibold transition-colors shrink-0 whitespace-nowrap ${
                              micCleanFilter
                                ? 'bg-[#1c332f] text-[#5eead4] border border-[#2b524b]'
                                : 'bg-[#1b1c20] text-[#757983]'
                            }`}
                          >
                            Clean
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsInputMonitoring((v) => !v)}
                            title="Live Headphone Input Monitoring"
                            className={`h-4 px-1.5 rounded text-[9px] font-semibold flex items-center gap-0.5 transition-colors shrink-0 whitespace-nowrap ${
                              isInputMonitoring
                                ? 'bg-[#3a1e18] text-[#ff7a5c] border border-[#5c2c22]'
                                : 'bg-[#1b1c20] text-[#757983]'
                            }`}
                          >
                            <Headphones className="h-2.5 w-2.5" />
                            <span>Mon</span>
                          </button>
                        </div>

                        {/* Monitoring Range Bar & Gain / Pan */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1 text-[8.5px] whitespace-nowrap min-w-0">
                            <span className="text-[#757983] truncate">
                              Range <span className="text-[#4ade80]">(-18..-6 dB)</span>
                            </span>
                            <span className="text-white font-semibold tabular-nums shrink-0">
                              Gain {Math.round(inputGain * 100)}% · Pan {formatPanLabel(panVal)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 pr-1">
                            <div className="relative flex-1 min-w-0 h-2 rounded-full bg-[#0b0c0e] border border-[#1d1e24] overflow-hidden">
                              {/* Ideal -18dB to -6dB sweet spot zone */}
                              <div
                                className="absolute inset-y-0 bg-[#4ade80]/15 border-x border-[#4ade80]/40"
                                style={{ left: '42%', width: '36%' }}
                              />
                              <div
                                className="h-full rounded-full transition-all duration-75"
                                style={{
                                  width: `${Math.min(100, Math.max(4, inputLevelMeter))}%`,
                                  background:
                                    inputLevelMeter > 85
                                      ? '#ff5a36'
                                      : inputLevelMeter >= 35
                                      ? '#4ade80'
                                      : '#4fc1b5'
                                }}
                              />
                            </div>
                            <input
                              type="range"
                              min={25}
                              max={150}
                              value={Math.round(inputGain * 100)}
                              onChange={(e) => setInputGain(Number(e.target.value) / 100)}
                              title="Mic Input Monitoring Gain"
                              className="w-11 h-1 accent-[#ff5a36] bg-[#23242a] rounded-lg cursor-pointer shrink-0"
                            />
                            <input
                              type="range"
                              min={-100}
                              max={100}
                              value={panVal}
                              onChange={(e) => handleTrackPanChange(row.id, Number(e.target.value))}
                              onDoubleClick={() => handleTrackPanChange(row.id, 0)}
                              title="Stereo Pan (Double-click to center)"
                              className="w-9 h-1 accent-[#4fc1b5] bg-[#23242a] rounded-lg cursor-pointer shrink-0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Auto-Tune, Key/Scale & Vocal Beat Sync Timing */}
                      <div className="rounded-lg bg-[#111215] border border-[#1f2026] px-2 py-1.5 space-y-1.5 overflow-hidden">
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => setAutoTuneEnabled((v) => !v)}
                            className="flex items-center gap-1 text-[9.5px] font-semibold text-white whitespace-nowrap shrink-0"
                            title="Toggle Auto-Tune Pitch Processing"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                autoTuneEnabled ? 'bg-[#ff5a36]' : 'bg-[#4b4e57]'
                              }`}
                            />
                            <span>Auto-Tune</span>
                            <span className="text-[#8a8e98] font-normal tabular-nums">{autoPitchPercent}%</span>
                          </button>

                          <div className="flex items-center gap-0.5 bg-[#191a1f] p-0.5 rounded shrink-0">
                            {(['subtle', 'fast', 'hard'] as const).map((spd) => (
                              <button
                                key={spd}
                                type="button"
                                onClick={() => {
                                  setAutoTuneEnabled(true);
                                  setAutoTuneSpeed(spd);
                                }}
                                className={`px-1.5 h-4 rounded text-[8.5px] font-semibold capitalize whitespace-nowrap transition-colors ${
                                  autoTuneEnabled && autoTuneSpeed === spd
                                    ? 'bg-[#ff5a36] text-white'
                                    : 'text-[#757983] hover:text-white'
                                }`}
                              >
                                {spd}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Key Root + Scale Selector, Move Backward/Forward & Speed Match */}
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <div className="flex items-center gap-0.5 shrink-0">
                            <select
                              value={scaleKeyRoot}
                              onChange={(e) =>
                                setAutoTuneKey(`${e.target.value} ${isMinorScale ? 'Minor' : 'Major'}`)
                              }
                              title="Auto-Tune Root Key"
                              className="h-4.5 px-1 rounded bg-[#1b1c22] border border-[#2a2c34] text-[9px] font-semibold text-white focus:outline-none cursor-pointer"
                            >
                              {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((note) => (
                                <option key={note} value={note} className="bg-[#16171b] text-white">
                                  {note}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() =>
                                setAutoTuneKey(`${scaleKeyRoot} ${isMinorScale ? 'Major' : 'Minor'}`)
                              }
                              title="Toggle Minor / Major Scale"
                              className="h-4.5 px-1 rounded bg-[#1b1c22] border border-[#2a2c34] text-[8.5px] font-semibold text-[#c9ccd3] hover:text-white whitespace-nowrap"
                            >
                              {isMinorScale ? 'Min' : 'Maj'}
                            </button>
                          </div>

                          <div className="flex items-center gap-1 min-w-0 shrink-0">
                            {/* Move Vocal Backward / Forward */}
                            <div className="flex items-center bg-[#18191f] border border-[#252730] rounded px-0.5 py-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveVocalClip(row.id, -0.04)}
                                title="Move vocal backward 40ms (earlier)"
                                className="w-3.5 h-3.5 rounded bg-[#23252d] hover:bg-[#323540] text-[8px] font-bold text-white flex items-center justify-center"
                              >
                                ◀
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetVocalStartTime(row.id, 0)}
                                title="Click to reset vocal timeline position to 0.0s"
                                className="px-1 text-[8px] font-semibold text-[#5eead4] tabular-nums whitespace-nowrap"
                              >
                                {(row.track?.startTimeSec ?? 0) >= 0
                                  ? `+${(row.track?.startTimeSec ?? 0).toFixed(1)}s`
                                  : `${(row.track?.startTimeSec ?? 0).toFixed(1)}s`}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveVocalClip(row.id, 0.04)}
                                title="Move vocal forward 40ms (later)"
                                className="w-3.5 h-3.5 rounded bg-[#23252d] hover:bg-[#323540] text-[8px] font-bold text-white flex items-center justify-center"
                              >
                                ▶
                              </button>
                            </div>

                            {/* Vocal Speed (% Rate) */}
                            <div className="flex items-center bg-[#18191f] border border-[#252730] rounded px-0.5 py-0.5">
                              <button
                                type="button"
                                onClick={() => handleVocalSpeedChange(row.id, (row.track?.playbackRate ?? 1.0) - 0.01)}
                                title="Slow down vocal by 1% (use if vocal is faster than beat)"
                                className="w-3.5 h-3.5 rounded bg-[#23252d] hover:bg-[#323540] text-[8.5px] font-bold text-white flex items-center justify-center"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleVocalSpeedChange(row.id, 1.0)}
                                title="Click to reset vocal speed to 100%"
                                className="px-1 text-[8px] font-semibold text-[#f5b841] tabular-nums whitespace-nowrap"
                              >
                                {Math.round((row.track?.playbackRate ?? 1.0) * 100)}%
                              </button>
                              <button
                                type="button"
                                onClick={() => handleVocalSpeedChange(row.id, (row.track?.playbackRate ?? 1.0) + 0.01)}
                                title="Speed up vocal by 1% (use if vocal is slower than beat)"
                                className="w-3.5 h-3.5 rounded bg-[#23252d] hover:bg-[#323540] text-[8.5px] font-bold text-white flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* BEAT CHANNEL STRIP CONTROLS */
                    <div
                      className="flex-1 min-w-0 flex flex-col justify-between gap-1.5 border-l border-[#22232a] pl-2 py-0.5 overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 1. Active Free Beat Deck & Quick Switcher */}
                      <div className="rounded-lg bg-[#111215] border border-[#1f2026] px-2 py-1.5 space-y-1.5 overflow-hidden">
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <div className="text-[10.5px] font-semibold text-white truncate min-w-0 flex-1">
                            {selectedTrack ? selectedTrack.title : 'No beat loaded'}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {availableTracks.length > 1 && (
                              <button
                                type="button"
                                title="Next Free Beat"
                                onClick={() => {
                                  const idx = availableTracks.findIndex((b) => b.id === selectedTrack?.id);
                                  const nextBeat = availableTracks[(idx + 1) % availableTracks.length];
                                  if (nextBeat) handleSelectBeat(nextBeat);
                                }}
                                className="h-4.5 px-1.5 rounded bg-[#1b1c22] hover:bg-[#262830] text-[9px] font-semibold text-[#c9ccd3] hover:text-white whitespace-nowrap"
                              >
                                Next
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setBeatPickerOpen(true)}
                              className="h-4.5 px-2 rounded bg-[#ff5a36] hover:bg-[#ff6b49] text-[9px] font-semibold text-white whitespace-nowrap"
                            >
                              Store
                            </button>
                          </div>
                        </div>

                        {/* Beat Sub-label + Stereo Pan */}
                        <div className="flex items-center justify-between gap-1.5 text-[9px] min-w-0 pr-1">
                          <span className="text-[#757983] truncate min-w-0 flex-1">
                            {selectedTrack
                              ? `${selectedTrack.artist || 'Beat Store'} · ${selectedTrack.genre || 'Beat'}`
                              : 'Select from Beat Store'}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <span className="text-[#757983]">Pan</span>
                            <span className="text-white font-semibold tabular-nums">{formatPanLabel(beatPan)}</span>
                            <input
                              type="range"
                              min={-100}
                              max={100}
                              value={beatPan}
                              onChange={(e) => setBeatPan(Number(e.target.value))}
                              onDoubleClick={() => setBeatPan(0)}
                              title="Beat Stereo Pan (Double-click to center)"
                              className="w-12 h-1 accent-[#e8a33d] bg-[#23242a] rounded-lg cursor-pointer shrink-0"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Tempo, Key Sync & Cue Controls */}
                      <div className="rounded-lg bg-[#111215] border border-[#1f2026] px-2 py-1.5 space-y-1.5 overflow-hidden">
                        <div className="flex items-center justify-between gap-1 min-w-0">
                          <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSessionBpm((b) => Math.max(60, b - 1))}
                              className="w-4 h-4 rounded bg-[#1b1c22] text-[10px] text-[#c9ccd3] hover:text-white flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="text-[10px] font-semibold text-white tabular-nums px-0.5 whitespace-nowrap">
                              {sessionBpm} BPM
                            </span>
                            <button
                              type="button"
                              onClick={() => setSessionBpm((b) => Math.min(200, b + 1))}
                              className="w-4 h-4 rounded bg-[#1b1c22] text-[10px] text-[#c9ccd3] hover:text-white flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={handleAutoDetectKey}
                            title="Lock Vocal Auto-Tune to Beat Key"
                            className="h-4.5 px-1.5 rounded bg-[#1b1c22] hover:bg-[#262830] border border-[#2a2c34] text-[8.5px] font-semibold text-[#e8a33d] whitespace-nowrap shrink-0"
                          >
                            Key: {studioKeyLabel} · Sync
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => setIsMetronomeEnabled((v) => !v)}
                            className={`h-4.5 px-1 rounded text-[8.5px] font-semibold whitespace-nowrap truncate transition-colors ${
                              isMetronomeEnabled
                                ? 'bg-[#362815] text-[#f5b841] border border-[#5c4320]'
                                : 'bg-[#191a1f] text-[#757983] hover:text-white'
                            }`}
                          >
                            Click {isMetronomeEnabled ? 'ON' : 'OFF'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCountInEnabled((v) => !v)}
                            className={`h-4.5 px-1 rounded text-[8.5px] font-semibold whitespace-nowrap truncate transition-colors ${
                              isCountInEnabled
                                ? 'bg-[#25262c] text-white border border-[#343640]'
                                : 'bg-[#191a1f] text-[#757983] hover:text-white'
                            }`}
                          >
                            Count 3s
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsLoopEnabled((v) => !v)}
                            className={`h-4.5 px-1 rounded text-[8.5px] font-semibold whitespace-nowrap truncate transition-colors ${
                              isLoopEnabled
                                ? 'bg-[#3a1e18] text-[#ff5a36] border border-[#5c2c22]'
                                : 'bg-[#191a1f] text-[#757983] hover:text-white'
                            }`}
                          >
                            Loop
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* MASTER BUS CARD */}
          <div className="shrink-0 w-[312px] sm:w-[332px] xl:flex-[1.15] xl:min-w-[324px] snap-start rounded-xl bg-[#1a1b20] border border-[#26272d] px-3 pt-2.5 pb-2 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                <span className="text-[12px] font-semibold text-white truncate">Master</span>
              </div>
              <button
                type="button"
                onClick={handleAutoMixAI}
                disabled={isAutoMixRunning}
                title="AI Auto-Mix & Level Balance"
                className={`h-5 px-2 rounded text-[9.5px] font-semibold flex items-center gap-1 transition-colors shrink-0 whitespace-nowrap ${
                  autoMixSuccess
                    ? 'bg-[#14261c] text-[#4ade80] border border-[#1f3d2b]'
                    : 'bg-[#ff5a36] hover:bg-[#ff6b49] text-white'
                }`}
              >
                <Sparkles className="h-2.5 w-2.5" />
                <span>{isAutoMixRunning ? 'Mixing…' : autoMixSuccess ? 'Balanced' : 'AI Auto-Mix'}</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 flex items-stretch gap-2.5 mt-1.5 min-w-0">
              {/* Left: Master Fader + 4-bar Stereo Meter */}
              <div className="flex flex-col shrink-0">
                <div className="flex-1 min-h-0 flex items-stretch gap-2">
                  <MixFader db={masterDbValue} accent="#ffffff" onChange={(d) => setMasterVolume(dbToVol(d))} />
                  <MixMeter wide levels={masterLevels} />
                </div>
                <div className="text-[10.5px] text-[#7b7f89] tabular-nums leading-none mt-1 whitespace-nowrap">
                  {masterDbValue <= -44.9 ? '-∞' : masterDbValue.toFixed(1)} dB
                </div>
              </div>

              {/* Right: Audio Output Routing, Master Bus Character & Quick Bounce */}
              <div className="flex-1 min-w-0 flex flex-col justify-between gap-1 border-l border-[#262830] pl-2 py-0.5 overflow-hidden">
                {/* 1. Audio Output Device Selector + Test Button */}
                <div className="rounded-lg bg-[#121317] border border-[#22242c] px-2 py-1 space-y-0.5 overflow-hidden">
                  <div className="flex items-center justify-between gap-1 text-[9px] min-w-0">
                    <span className="text-[#757983] whitespace-nowrap truncate">Audio Output Device</span>
                    <button
                      type="button"
                      onClick={handleTestOutputAudio}
                      title="Play test tone on selected output device"
                      className="px-1.5 h-3.5 rounded bg-[#1e2d29] hover:bg-[#273d38] text-[#5eead4] border border-[#2b524b] text-[8.5px] font-semibold flex items-center gap-0.5 transition-colors shrink-0 whitespace-nowrap"
                    >
                      <Volume2 className="h-2.5 w-2.5" />
                      <span>Test</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    <Headphones className="h-3 w-3 text-[#ff5a36] shrink-0" />
                    <select
                      value={audioOutputDevice}
                      onFocus={() => refreshAudioDevices()}
                      onChange={(e) => handleOutputDeviceChange(e.target.value)}
                      title="Choose Studio Audio Output Destination (Speakers / Headphones / Audio Interface)"
                      className="w-full min-w-0 bg-transparent text-[9.5px] font-medium text-[#eceef2] focus:outline-none truncate cursor-pointer"
                    >
                      {availableOutputs.map((out) => (
                        <option key={out.deviceId} value={out.deviceId} className="bg-[#16171b] text-white">
                          {out.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Mastering Tone Presets */}
                <div className="rounded-lg bg-[#121317] border border-[#22242c] px-2 py-1 space-y-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-1 text-[9px] min-w-0">
                    <span className="text-[#757983] whitespace-nowrap truncate">Mastering Character</span>
                    <span className="text-[#4ade80] font-semibold whitespace-nowrap shrink-0">Limiter ON</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {(['Universal', 'Warm', 'Clarity', 'Bass Boost'] as const).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          ensurePlaybackCtx();
                          setMasteringPreset(preset);
                          setCompressorEnabled(true);
                          if (preset === 'Universal') {
                            setEqLow(0);
                            setEqMid(1.5);
                            setEqHigh(2.0);
                            setCompThreshold(-18);
                            setCompRatio(4.0);
                          } else if (preset === 'Warm') {
                            setEqLow(2.5);
                            setEqMid(0.5);
                            setEqHigh(-1.0);
                            setCompThreshold(-20);
                            setCompRatio(3.2);
                          } else if (preset === 'Clarity') {
                            setLowCutEnabled(true);
                            setEqLow(-1.5);
                            setEqMid(2.5);
                            setEqHigh(4.0);
                            setCompThreshold(-16);
                            setCompRatio(4.5);
                          } else if (preset === 'Bass Boost') {
                            setEqLow(4.5);
                            setEqMid(0.0);
                            setEqHigh(1.5);
                            setCompThreshold(-15);
                            setCompRatio(5.0);
                          }
                        }}
                        className={`h-4.5 rounded text-[8.5px] font-semibold whitespace-nowrap truncate px-0.5 transition-colors ${
                          masteringPreset === preset
                            ? 'bg-[#2a2c35] text-white border border-[#3d404d]'
                            : 'bg-[#18191f] text-[#757983] hover:text-white'
                        }`}
                      >
                        {preset === 'Bass Boost' ? 'Bass' : preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Export Range & Master Bounce */}
                <div className="rounded-lg bg-[#121317] border border-[#22242c] px-2 py-1 flex items-center justify-between gap-1 overflow-hidden">
                  <div className="flex items-center gap-0.5 bg-[#191a20] p-0.5 rounded shrink-0">
                    {(['recorded', 'full'] as const).map((rng) => (
                      <button
                        key={rng}
                        type="button"
                        onClick={() => setExportRangeMode(rng)}
                        className={`px-1.5 h-4 rounded text-[8.5px] font-semibold capitalize whitespace-nowrap ${
                          exportRangeMode === rng ? 'bg-[#2c2e38] text-white' : 'text-[#757983] hover:text-white'
                        }`}
                      >
                        {rng === 'recorded' ? 'Rec' : 'Full'}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportWav()}
                    disabled={isExportingWav}
                    className="flex-1 min-w-0 h-4.5 px-1.5 rounded bg-[#f5f3ef] hover:bg-white text-black text-[8.5px] font-semibold flex items-center justify-center gap-1 transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    <Download className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{isExportingWav ? 'Rendering…' : 'Bounce'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExportDialogOpen(true)}
                    className="shrink-0 h-4.5 px-2 rounded bg-[#23252e] hover:bg-[#2d303b] text-[8.5px] font-semibold text-white whitespace-nowrap"
                  >
                    Publish
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Beat Picker Modal */}
      {beatPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div
            className="relative w-full max-w-lg rounded-lg bg-[#1c1e24] border border-[#2a2d34] p-4 shadow-2xl flex flex-col max-h-[80vh] text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2d34]">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-[#8b8f98]" />
                <h3 className="text-[14px] font-semibold text-white">Free beats · Beat Store</h3>
              </div>
              <button
                type="button"
                onClick={() => setBeatPickerOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="py-3 flex gap-2">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={beatSearchQuery}
                  onChange={(e) => setBeatSearchQuery(e.target.value)}
                  placeholder="Search beats by title, producer, genre..."
                  className="w-full pl-9 pr-3 py-2 rounded-md bg-[#111214] border border-[#2a2d34] text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
              {filteredBeats.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    handleSelectBeat(b);
                    setBeatPickerOpen(false);
                  }}
                  className={`p-2 rounded-md border flex items-center justify-between gap-3 cursor-pointer ${
                    selectedTrack?.id === b.id
                      ? 'bg-[#2bbbad]/12 border-[#2bbbad]/40'
                      : 'bg-transparent border-transparent hover:bg-white/5 text-[#d7dbe2]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={b.coverUrl} alt={b.title} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate text-white">{b.title}</p>
                      <p className="text-[11px] text-gray-400 truncate">{b.artist} • {b.bpm || 110} BPM • {b.genre}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3 py-1 rounded-md bg-white text-black text-xs font-semibold shrink-0"
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export / Render Dialog Modal */}
      {isExportDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div
            className="relative w-full max-w-sm rounded-lg bg-[#1c1e24] border border-[#2a2d34] p-5 shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#2a2d34]">
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-semibold text-white">Publish</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportDialogOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#8b8f98]">
              Bounce a stereo WAV of this mix.
            </p>

            <div className="p-3 rounded-md bg-[#111214] border border-[#2a2d34] space-y-1 text-[11px]">
              <div className="flex justify-between text-gray-400">
                <span>FORMAT:</span>
                <span className="text-white font-bold">16-Bit PCM WAV · 44.1kHz Stereo</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>ACTIVE TRACKS:</span>
                <span className="text-teal-300 font-bold">{vocalTracks.length + 1} Stems</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsExportDialogOpen(false)}
                className="flex-1 py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#d7dbe2]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExportWav()}
                disabled={isExportingWav}
                className="flex-1 py-2 rounded-md bg-white hover:bg-[#f2f2f2] text-black text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Download className="h-4 w-4" />
                <span>{isExportingWav ? 'Rendering...' : 'Download WAV'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {isShortcutsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div
            className="relative w-full max-w-sm rounded-lg bg-[#1c1e24] border border-[#2a2d34] p-5 shadow-2xl text-white space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsShortcutsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Play / Pause</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">Space</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Record into Armed Track</span>
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">R</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Return to Zero (00:00)</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">Return</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-gray-400">Toggle Loop Mode</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">L</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserRecordStudioModal;
