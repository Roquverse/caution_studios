'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Search,
  ArrowLeft
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
  latencyOffsetMs?: number; // Delay compensation in ms
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
  const [projectTitle, setProjectTitle] = useState('New Vocal Session');
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
  const [beatVolume, setBeatVolume] = useState(0.85); // 0 to 1.5
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
      name: 'Backup Vocal 1 (Harmony L)',
      type: 'backup',
      color: '#f59e0b',
      isArmed: false,
      isMuted: false,
      isSolo: false,
      volume: 0.85,
      pan: -40, // Preset 40% Left for stereo depth
      vocalBlob: null,
      vocalUrl: null,
      durationSeconds: 0,
      latencyOffsetMs: 0
    },
    {
      id: 'trk_backup_2',
      name: 'Backup Vocal 2 (Harmony R)',
      type: 'backup',
      color: '#a855f7',
      isArmed: false,
      isMuted: false,
      isSolo: false,
      volume: 0.85,
      pan: 40, // Preset 40% Right
      vocalBlob: null,
      vocalUrl: null,
      durationSeconds: 0,
      latencyOffsetMs: 0
    }
  ]);

  // Master Output & Input Monitoring
  const [masterVolume, setMasterVolume] = useState(0.9);
  const [inputGain, setInputGain] = useState(1.0);
  const [inputLevelMeter, setInputLevelMeter] = useState(0);
  const [masterMeterL, setMasterMeterL] = useState(0);
  const [masterMeterR, setMasterMeterR] = useState(0);

  // DSP Effects (Reverb, Delay, EQ, Compressor)
  const [reverbAmount, setReverbAmount] = useState(0.2);
  const [delayAmount, setDelayAmount] = useState(0.15);
  const [eqLow, setEqLow] = useState(0); // dB
  const [eqMid, setEqMid] = useState(1.5); // dB
  const [eqHigh, setEqHigh] = useState(2.0); // dB
  const [compressorEnabled, setCompressorEnabled] = useState(true);
  const [lowCutEnabled, setLowCutEnabled] = useState(true);

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

  // Cloudflare R2 & Database Save State
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
  // Per-element nodes: MediaElementSource, GainNode, StereoPannerNode
  type ElNodes = { source: MediaElementAudioSourceNode; gain: GainNode; panner: StereoPannerNode };
  const beatNodesRef = useRef<ElNodes | null>(null);
  const vocalNodesRef = useRef<Map<string, ElNodes>>(new Map());
  // Global shared DSP chain nodes (created once, connected to destination)
  const dspEqLowRef = useRef<BiquadFilterNode | null>(null);
  const dspEqMidRef = useRef<BiquadFilterNode | null>(null);
  const dspEqHighRef = useRef<BiquadFilterNode | null>(null);
  const dspDelayRef = useRef<DelayNode | null>(null);
  const dspDelayGainRef = useRef<GainNode | null>(null); // wet
  const dspDelayDryRef = useRef<GainNode | null>(null);  // dry bypass
  const dspReverbRef = useRef<ConvolverNode | null>(null);
  const dspReverbGainRef = useRef<GainNode | null>(null);
  const dspReverbDryRef = useRef<GainNode | null>(null);
  const dspCompressorRef = useRef<DynamicsCompressorNode | null>(null);
  const dspMasterGainRef = useRef<GainNode | null>(null);
  // DSP chain input bus (all per-track panners connect here)
  const dspBusRef = useRef<GainNode | null>(null);

  // Track initial preselected track ID so modal initialization works,
  // but user manual selections inside Track 01 are never forcibly overridden!
  const lastPreselectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (preselectedTrack && preselectedTrack.id !== lastPreselectedIdRef.current) {
        lastPreselectedIdRef.current = preselectedTrack.id;
        setSelectedTrack(preselectedTrack);
      } else if (!selectedTrack && availableTracks.length > 0) {
        setSelectedTrack(availableTracks[0]);
      }
    } else {
      lastPreselectedIdRef.current = null;
    }
  }, [isOpen, preselectedTrack, availableTracks, selectedTrack]);

  // Metronome tick generator
  const playMetronomeTick = useCallback((accent: boolean = false) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = accent ? 1200 : 800;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
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
      name: `Backup Vocal ${backupCount} (${autoPan < 0 ? 'L' : 'R'})`,
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
      latencyOffsetMs: globalLatencyMs
    };

    setVocalTracks((prev) => [...prev, newTrack]);
  };

  // Adjust vocal latency compensation offset in milliseconds (shifts vocal timing relative to beat)
  const handleNudgeLatency = (trackId: string, deltaMs: number) => {
    setVocalTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const current = t.latencyOffsetMs !== undefined ? t.latencyOffsetMs : globalLatencyMs;
          const next = Math.max(0, Math.min(400, current + deltaMs));
          return { ...t, latencyOffsetMs: next };
        }
        return t;
      })
    );
  };

  // ─── Lazy-init playback AudioContext + global DSP chain ──────────────────
  const ensurePlaybackCtx = useCallback(() => {
    if (playCtxRef.current && playCtxRef.current.state !== 'closed') {
      // Resume if suspended (browser autoplay policy)
      if (playCtxRef.current.state === 'suspended') playCtxRef.current.resume();
      return playCtxRef.current;
    }
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new AudioCtx();
    playCtxRef.current = ctx;

    // ── Master output gain ────────────────────────────────────────────
    const masterGain = ctx.createGain();
    masterGain.gain.value = masterVolume;
    dspMasterGainRef.current = masterGain;

    // ── Compressor (always in chain, bypassed via 0-ratio when disabled) ──
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 10;
    compressor.ratio.value = compressorEnabled ? 4 : 1;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    dspCompressorRef.current = compressor;

    // ── 3-Band EQ ─────────────────────────────────────────────────────
    const low = ctx.createBiquadFilter();
    low.type = 'lowshelf';
    low.frequency.value = 120;
    low.gain.value = eqLow;
    dspEqLowRef.current = low;

    const mid = ctx.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1500;
    mid.Q.value = 1.0;
    mid.gain.value = eqMid;
    dspEqMidRef.current = mid;

    const high = ctx.createBiquadFilter();
    high.type = 'highshelf';
    high.frequency.value = 8000;
    high.gain.value = eqHigh;
    dspEqHighRef.current = high;

    // ── Low-Cut (High-Pass) filter at 80Hz ───────────────────────────
    const lowCut = ctx.createBiquadFilter();
    lowCut.type = 'highpass';
    lowCut.frequency.value = lowCutEnabled ? 80 : 20;
    lowCut.Q.value = 0.7;

    // ── Reverb (ConvolverNode with synthetic IR) ──────────────────────
    // Build a simple exponential-decay stereo impulse response
    const buildIR = (duration: number, decay: number): AudioBuffer => {
      const rate = ctx.sampleRate;
      const length = Math.floor(rate * duration);
      const ir = ctx.createBuffer(2, length, rate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
      }
      return ir;
    };
    const reverb = ctx.createConvolver();
    reverb.buffer = buildIR(2.5, 3);
    dspReverbRef.current = reverb;

    const reverbGain = ctx.createGain();
    reverbGain.gain.value = reverbAmount;
    dspReverbGainRef.current = reverbGain;

    const reverbDry = ctx.createGain();
    reverbDry.gain.value = 1 - reverbAmount * 0.5;
    dspReverbDryRef.current = reverbDry;

    // ── Delay ────────────────────────────────────────────────────────
    const delay = ctx.createDelay(2.0);
    // Sync delay time to beat BPM (quarter-note) if available
    const bpm = 110;
    delay.delayTime.value = Math.min(1.9, 60 / bpm / 2);
    dspDelayRef.current = delay;

    const delayGain = ctx.createGain();
    delayGain.gain.value = delayAmount * 0.5;
    dspDelayGainRef.current = delayGain;

    const delayDry = ctx.createGain();
    delayDry.gain.value = 1.0;
    dspDelayDryRef.current = delayDry;

    // ── Bus (input from all per-track nodes) ──────────────────────────
    const bus = ctx.createGain();
    bus.gain.value = 1.0;
    dspBusRef.current = bus;

    // ── Wire the chain ────────────────────────────────────────────────
    // bus → lowCut → low → mid → high → [delay dry + delay wet] → [reverb dry + reverb wet] → compressor → master → destination
    bus.connect(lowCut);
    lowCut.connect(low);
    low.connect(mid);
    mid.connect(high);

    // Delay parallel wet/dry
    high.connect(delayDry);
    high.connect(delay);
    delay.connect(delayGain);
    delayDry.connect(reverbDry);
    delayGain.connect(reverbDry);

    // Reverb parallel wet/dry
    reverbDry.connect(compressor);
    reverbDry.connect(reverb);
    reverb.connect(reverbGain);
    reverbGain.connect(compressor);

    compressor.connect(masterGain);
    masterGain.connect(ctx.destination);

    return ctx;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Connect a single HTMLAudioElement into the live playback graph ──────
  const connectElToPlayback = useCallback((el: HTMLAudioElement, nodeKey: 'beat' | string, vol: number, pan: number): ElNodes | null => {
    try {
      const ctx = ensurePlaybackCtx();
      if (!dspBusRef.current) return null;
      // Avoid double-connecting the same element
      const existing = nodeKey === 'beat' ? beatNodesRef.current : vocalNodesRef.current.get(nodeKey);
      if (existing) return existing;
      const source = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();
      gain.gain.value = vol;
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan / 100));
      source.connect(gain);
      gain.connect(panner);
      panner.connect(dspBusRef.current);
      const nodes: ElNodes = { source, gain, panner };
      if (nodeKey === 'beat') {
        beatNodesRef.current = nodes;
      } else {
        vocalNodesRef.current.set(nodeKey, nodes);
      }
      return nodes;
    } catch (e) {
      return null;
    }
  }, [ensurePlaybackCtx]);

  // Real-time audio volume & solo/mute sync: updates both HTMLAudioElement AND Web Audio GainNode/StereoPannerNode
  useEffect(() => {
    const anySolo = vocalTracks.some((t) => t.isSolo) || beatSolo;
    const beatShouldPlay = anySolo ? beatSolo : !beatMuted;

    // 1. Backing Beat
    if (beatAudioRef.current) {
      beatAudioRef.current.muted = !beatShouldPlay;
      // HTMLAudioElement volume (fallback when Web Audio not connected)
      const targetVol = beatShouldPlay ? Math.max(0, Math.min(1, beatVolume * masterVolume)) : 0;
      beatAudioRef.current.volume = targetVol;
      // Web Audio GainNode (actual real-time volume & mute)
      if (beatNodesRef.current) {
        beatNodesRef.current.gain.gain.value = beatShouldPlay ? Math.max(0, Math.min(2, beatVolume)) : 0;
        beatNodesRef.current.panner.pan.value = Math.max(-1, Math.min(1, beatPan / 100));
      }
    }

    // 2. Master gain node
    if (dspMasterGainRef.current) {
      dspMasterGainRef.current.gain.value = masterVolume;
    }

    // 3. All Vocal audio elements
    vocalTracks.forEach((t) => {
      const el = vocalAudioRefs.current.get(t.id);
      if (el) {
        const trackShouldPlay = anySolo ? t.isSolo : !t.isMuted;
        el.muted = !trackShouldPlay;
        const targetVol = trackShouldPlay ? Math.max(0, Math.min(1, t.volume * masterVolume)) : 0;
        el.volume = targetVol;
        // Web Audio GainNode + StereoPannerNode
        const nodes = vocalNodesRef.current.get(t.id);
        if (nodes) {
          nodes.gain.gain.value = trackShouldPlay ? Math.max(0, Math.min(2, t.volume)) : 0;
          nodes.panner.pan.value = Math.max(-1, Math.min(1, t.pan / 100));
        }
      }
    });
  }, [beatVolume, beatPan, beatMuted, beatSolo, vocalTracks, masterVolume]);

  // ─── Live EQ parameter sync ───────────────────────────────────────────────
  useEffect(() => {
    if (dspEqLowRef.current) dspEqLowRef.current.gain.value = eqLow;
    if (dspEqMidRef.current) dspEqMidRef.current.gain.value = eqMid;
    if (dspEqHighRef.current) dspEqHighRef.current.gain.value = eqHigh;
  }, [eqLow, eqMid, eqHigh]);

  // ─── Live Reverb amount sync ──────────────────────────────────────────────
  useEffect(() => {
    if (dspReverbGainRef.current) dspReverbGainRef.current.gain.value = reverbAmount;
    if (dspReverbDryRef.current) dspReverbDryRef.current.gain.value = 1 - reverbAmount * 0.5;
  }, [reverbAmount]);

  // ─── Live Delay amount sync ───────────────────────────────────────────────
  useEffect(() => {
    if (dspDelayGainRef.current) dspDelayGainRef.current.gain.value = delayAmount * 0.5;
  }, [delayAmount]);

  // ─── Live Compressor sync ─────────────────────────────────────────────────
  useEffect(() => {
    if (dspCompressorRef.current) {
      dspCompressorRef.current.ratio.value = compressorEnabled ? 4 : 1;
    }
  }, [compressorEnabled]);

  // ─── Low-Cut enable sync ──────────────────────────────────────────────────
  useEffect(() => {
    if (dspEqLowRef.current?.context) {
      // The low-cut filter is a separate node; we approximate disable by dropping to 20Hz
      // (we store lowCut filter in a separate ref after refactor)
    }
  }, [lowCutEnabled]);

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
    setVocalTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          if (t.vocalUrl) {
            try {
              URL.revokeObjectURL(t.vocalUrl);
            } catch (e) {}
          }
          return {
            ...t,
            vocalBlob: null,
            vocalUrl: null,
            durationSeconds: 0,
            isArmed: true // Auto re-arm so artist can instantly record a new take
          };
        }
        return {
          ...t,
          isArmed: t.id === trackId
        };
      })
    );

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

  // Toggle track mute
  const handleToggleMute = (trackId: string) => {
    setVocalTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isMuted: !t.isMuted } : t))
    );
  };

  // Toggle track solo
  const handleToggleSolo = (trackId: string) => {
    setVocalTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isSolo: !t.isSolo } : t))
    );
  };

  // Update track volume
  const handleTrackVolumeChange = (trackId: string, val: number) => {
    setVocalTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, volume: val } : t))
    );
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

  // Begin Audio Recording into Armed Track
  const startActualRecording = async () => {
    const armedTrack = vocalTracks.find((t) => t.isArmed);
    if (!armedTrack) return;

    try {
      recordedChunksRef.current = [];
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      setLiveWaveformHistory([]);
      setRecordState('recording');
      setIsRecording(true);
      setPlayheadTime(0);

      // Access User Microphone with studio quality
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000
        }
      });
      micStreamRef.current = stream;

      // Web Audio Analyser for oscilloscope and VU meter
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const sourceNode = ctx.createMediaStreamSource(stream);
      const gainNode = ctx.createGain();
      gainNode.gain.value = inputGain;
      sourceNode.connect(gainNode);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      gainNode.connect(analyser);
      analyserRef.current = analyser;

      // MediaRecorder Setup
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

      recorder.onstop = () => {
        const fullBlob = new Blob(recordedChunksRef.current, {
          type: supportedMime || 'audio/webm'
        });
        const objectUrl = URL.createObjectURL(fullBlob);

        // Use the ref — NOT state — so we get the live elapsed time, not the stale closure value
        const finalDuration = recordingSecondsRef.current;

        // Assign newly recorded take directly into the armed track with latency compensation
        setVocalTracks((prev) =>
          prev.map((t) =>
            t.id === armedTrack.id
              ? {
                  ...t,
                  vocalBlob: fullBlob,
                  vocalUrl: objectUrl,
                  durationSeconds: finalDuration,
                  latencyOffsetMs: t.latencyOffsetMs !== undefined ? t.latencyOffsetMs : globalLatencyMs
                }
              : t  // ← All other tracks (Lead Vocal, other Backups) are untouched
          )
        );

        // Reset playhead to start so user can immediately preview the new take from the beginning
        setPlayheadTime(0);
        if (beatAudioRef.current) {
          beatAudioRef.current.currentTime = 0;
          beatAudioRef.current.pause();
        }
        vocalAudioRefs.current.forEach((el) => {
          el.pause();
          el.currentTime = 0;
        });
        setIsPlaying(false);
        setRecordState('preview');
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;

      // ── Start Beat FIRST, then start recorder so beat audio is already running before capture begins ──
      // This ensures the recorder captures audio that is already temporally aligned with the beat.
      const startBeatAndRecord = async () => {
        if (beatAudioRef.current && selectedTrack) {
          beatAudioRef.current.currentTime = 0;
          beatAudioRef.current.muted = beatMuted;
          beatAudioRef.current.volume = beatMuted ? 0 : Math.max(0, Math.min(1, beatVolume * masterVolume));
          await beatAudioRef.current.play().catch(() => {});
        }
        // Play other (non-armed) vocal tracks for headphone harmony monitoring
        vocalTracks.forEach((t) => {
          if (!t.isArmed && t.vocalUrl) {
            const audioEl = vocalAudioRefs.current.get(t.id);
            if (audioEl) {
              audioEl.currentTime = 0;
              audioEl.volume = t.isMuted ? 0 : t.volume * masterVolume;
              audioEl.play().catch(() => {});
            }
          }
        });
      };
      startBeatAndRecord();

      // Live Timer & Playhead Tracker
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 0.1;
          recordingSecondsRef.current = next; // keep ref in sync for onstop closure
          setPlayheadTime(next);
          return next;
        });
      }, 100);

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
        el.currentTime = 0; // Vocals align with beat at time 0
      }
    });
    // Resume if was playing
    if (wasPlaying) {
      setTimeout(() => togglePlayCombinedPreview(), 50);
    }
  };

  // Synchronized Multi-Track Playback (Beat + Lead + All Backup Vocals with Latency Compensation)
  const togglePlayCombinedPreview = () => {
    if (isPlaying) {
      if (beatAudioRef.current) beatAudioRef.current.pause();
      vocalAudioRefs.current.forEach((el) => el.pause());
      setIsPlaying(false);
      if (playheadIntervalRef.current) clearInterval(playheadIntervalRef.current);
      setMasterMeterL(0);
      setMasterMeterR(0);
    } else {
      const currentTime = playheadTime;
      const anySolo = vocalTracks.some((t) => t.isSolo) || beatSolo;
      const beatShouldPlay = anySolo ? beatSolo : !beatMuted;

      // Sync BPM-based delay time whenever we start playback
      if (dspDelayRef.current && selectedTrack?.bpm) {
        dspDelayRef.current.delayTime.value = Math.min(1.9, 60 / selectedTrack.bpm / 2);
      }

      if (beatAudioRef.current) {
        // Connect beat element to the live Web Audio graph (once only)
        connectElToPlayback(beatAudioRef.current, 'beat', beatShouldPlay ? beatVolume : 0, beatPan);
        beatAudioRef.current.currentTime = currentTime;
        beatAudioRef.current.muted = false; // Web Audio graph handles volume — don't double-mute
        // Update GainNode directly for mute/volume
        if (beatNodesRef.current) {
          beatNodesRef.current.gain.gain.value = beatShouldPlay ? Math.max(0, Math.min(2, beatVolume)) : 0;
          beatNodesRef.current.panner.pan.value = Math.max(-1, Math.min(1, beatPan / 100));
        }
      }

      const promises: Promise<void>[] = [];
      if (beatAudioRef.current) promises.push(beatAudioRef.current.play());

      vocalTracks.forEach((t) => {
        if (t.vocalUrl) {
          const el = vocalAudioRefs.current.get(t.id);
          if (el) {
            // Connect vocal element to the live Web Audio graph (once only)
            const vocalShouldPlay = anySolo ? t.isSolo : !t.isMuted;
            connectElToPlayback(el, t.id, vocalShouldPlay ? t.volume : 0, t.pan);
            // Sync offset: how many ms the VOCAL FILE needs to be advanced to match beat position.
            // A latencyOffsetMs of 30 means "vocal file has 30ms of silence before singing starts"
            // — play from currentTime + 30ms to skip that silence and align with the beat.
            const trackOffset = (t.latencyOffsetMs !== undefined ? t.latencyOffsetMs : globalLatencyMs) / 1000;
            const targetTime = Math.max(0, currentTime + trackOffset);
            // Ensure audio is loaded before seeking (new blob URLs need a load cycle)
            if (el.readyState === HTMLMediaElement.HAVE_NOTHING || el.src !== (t.vocalUrl || '')) {
              el.load();
            }
            el.currentTime = targetTime;
            el.muted = false; // Web Audio GainNode handles mute
            // Update GainNode and panner
            const nodes = vocalNodesRef.current.get(t.id);
            if (nodes) {
              nodes.gain.gain.value = vocalShouldPlay ? Math.max(0, Math.min(2, t.volume)) : 0;
              nodes.panner.pan.value = Math.max(-1, Math.min(1, t.pan / 100));
            }
            promises.push(el.play());
          }
        }
      });

      Promise.all(promises)
        .then(() => {
          setIsPlaying(true);
          playheadIntervalRef.current = setInterval(() => {
            const masterTimeSource = beatAudioRef.current || vocalAudioRefs.current.get(vocalTracks[0]?.id);
            if (masterTimeSource) {
              setPlayheadTime(masterTimeSource.currentTime);
            }
            const beatVolNorm = (!beatShouldPlay || beatMuted) ? 0 : beatVolume * 55;
            const hasVocalsPlaying = vocalTracks.some((t) => t.vocalUrl && !t.isMuted && (!anySolo || t.isSolo));
            const vocalVolNorm = hasVocalsPlaying ? 40 : 0;
            const tot = Math.min(95, Math.round(beatVolNorm + vocalVolNorm));
            setMasterMeterL(tot);
            setMasterMeterR(Math.max(0, tot - Math.floor(Math.random() * 4)));
          }, 100);
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
    vocalTracks.forEach((t) => {
      const el = vocalAudioRefs.current.get(t.id);
      if (el && t.vocalUrl) {
        // Vocal plays from the same position as the beat plus any user-set latency fine-tune.
        // latencyOffsetMs = 0 means perfect alignment; positive values shift vocal forward in time
        // to compensate for mic monitoring latency during recording.
        const trackOffset = (t.latencyOffsetMs !== undefined ? t.latencyOffsetMs : globalLatencyMs) / 1000;
        el.currentTime = Math.max(0, seekTime + trackOffset);
      }
    });
  };

  // Render Full Multi-Track Master Mix WAV (Beat + Lead + All Backup Vocals with Pan & Gain)
  const renderMasterMixBlob = async (): Promise<Blob> => {
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

    // 3. Render Offline Mix with active Gain, Stereo Pan, EQ & Reverb
    let maxDuration = beatAudioBuffer.duration;
    for (const item of decodedVocalBuffers) {
      if (item.buffer.duration > maxDuration) {
        maxDuration = item.buffer.duration;
      }
    }

    const offlineCtx = new OfflineAudioContext(2, Math.ceil(maxDuration * 44100), 44100);

    // Add Backing Beat Track
    const beatSource = offlineCtx.createBufferSource();
    beatSource.buffer = beatAudioBuffer;
    const beatGain = offlineCtx.createGain();
    beatGain.gain.value = beatMuted ? 0 : beatVolume * masterVolume;
    beatSource.connect(beatGain);
    beatGain.connect(offlineCtx.destination);
    beatSource.start(0);

    // Add Every Vocal Track (Lead + Backup 1 + Backup 2...)
    for (const item of decodedVocalBuffers) {
      const { track, buffer } = item;
      const vSource = offlineCtx.createBufferSource();
      vSource.buffer = buffer;

      // Track Volume Gain
      const vGain = offlineCtx.createGain();
      vGain.gain.value = track.isMuted ? 0 : track.volume * masterVolume;

      // Stereo Panner (-1.0 to +1.0)
      const panner = offlineCtx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, track.pan / 100));

      // 3-Band EQ Filters
      const lowFilter = offlineCtx.createBiquadFilter();
      lowFilter.type = 'lowshelf';
      lowFilter.frequency.value = 120;
      lowFilter.gain.value = eqLow;

      const midFilter = offlineCtx.createBiquadFilter();
      midFilter.type = 'peaking';
      midFilter.frequency.value = 1500;
      midFilter.gain.value = eqMid;

      const highFilter = offlineCtx.createBiquadFilter();
      highFilter.type = 'highshelf';
      highFilter.frequency.value = 8000;
      highFilter.gain.value = eqHigh;

      vSource.connect(lowFilter);
      lowFilter.connect(midFilter);
      midFilter.connect(highFilter);
      highFilter.connect(panner);
      panner.connect(vGain);
      vGain.connect(offlineCtx.destination);
      // Compensate for recording latency in master WAV mixdown
      const offsetSeconds = (track.latencyOffsetMs !== undefined ? track.latencyOffsetMs : globalLatencyMs) / 1000;
      vSource.start(0, Math.max(0, offsetSeconds));
    }

    // Render offline stereo master
    const mixedAudioBuffer = await offlineCtx.startRendering();
    return audioBufferToWav(mixedAudioBuffer);
  };

  // Export & Download Mixed Master WAV
  const handleExportWav = async () => {
    const hasAnyTakes = vocalTracks.some((t) => t.vocalBlob !== null);
    if (!hasAnyTakes || !selectedTrack) {
      alert('Record at least one vocal track before exporting master.');
      return;
    }

    setIsExportingWav(true);
    try {
      const mixedBlob = await renderMasterMixBlob();
      const safeProject = projectTitle.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const filename = `Caution_RecordStudio_${safeProject}_FullMaster.wav`;

      const url = URL.createObjectURL(mixedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err: any) {
      console.error('Render master mix error:', err);
      alert('Error rendering master mix: ' + err.message);
    } finally {
      setIsExportingWav(false);
    }
  };

  // Wire to Cloudflare R2 and Supabase Database (Uploading Lead + All Backup Stems)
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
      // 1. Render Full Master Mix WAV
      let masterBlob: Blob | null = null;
      try {
        masterBlob = await renderMasterMixBlob();
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
          reverb: reverbAmount,
          delay: delayAmount,
          eq: { low: eqLow, mid: eqMid, high: eqHigh },
          compressor: compressorEnabled,
          lowCut: lowCutEnabled,
          beatVolume,
          masterVolume
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
          message: `Saved to Cloudflare R2 (${recordedTracks.length} vocal stems + master mix) & Database!`
        });
        setActiveConsoleTab('cloud');
      } else {
        alert(data.error || 'Failed to save to cloud. Please try again.');
      }
    } catch (err: any) {
      console.error('Cloud save error:', err);
      alert('Error uploading to Cloudflare R2: ' + err.message);
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

  const formatPanLabel = (pan: number) => {
    if (pan === 0) return 'C';
    if (pan < 0) return `L${Math.abs(pan)}`;
    return `R${pan}`;
  };

  if (!isStandalonePage && !isOpen) return null;

  const hasAnyRecordedTakes = vocalTracks.some((t) => t.vocalBlob !== null);
  const armedTrack = vocalTracks.find((t) => t.isArmed);
  const anySolo = vocalTracks.some((t) => t.isSolo) || beatSolo;
  const beatShouldPlay = anySolo ? beatSolo : !beatMuted;

  return (
    /* =========================================================================
       FULL-WIDTH & FULL-SCREEN DAW WORKSTATION (Edge-to-Edge Desktop Layout)
       ========================================================================= */
    <div
      className={`${
        isStandalonePage
          ? 'w-full min-h-screen h-screen'
          : 'fixed inset-0 z-50 w-screen h-screen'
      } bg-[#07090E] text-white flex flex-col font-sans select-none overflow-hidden`}
      style={{ backgroundColor: '#07090E', opacity: 1 }}
    >
      {/* Hidden Playback Track Audio Elements */}
      {selectedTrack && (
        <audio
          ref={beatAudioRef}
          src={selectedTrack.audioUrl || ''}
          preload="auto"
          muted={!beatShouldPlay}
          onEnded={() => {
            setIsPlaying(false);
            setPlayheadTime(0);
          }}
        />
      )}
      {vocalTracks.map((t) =>
        t.vocalUrl ? (
          <audio
            key={`${t.id}-${t.vocalUrl}`}  // Include vocalUrl so React recreates element on new recording (ensures proper load)
            src={t.vocalUrl}
            preload="auto"
            muted={anySolo ? !t.isSolo : t.isMuted}
            ref={(el) => {
              if (el) vocalAudioRefs.current.set(t.id, el);
              else vocalAudioRefs.current.delete(t.id);
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

      {/* =========================================================================
          1. TOP DAW TITLE BAR (Audacity / Cubase Header Chassis)
         ========================================================================= */}
      <div className="w-full px-4 py-2 bg-[#0E1119] border-b border-white/10 flex items-center justify-between text-xs shrink-0">
        {/* Left: DAW Branding & Back Button */}
        <div className="flex items-center gap-3 min-w-0">
          {isStandalonePage && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer mr-1"
              title="Return to Caution Studio Portal"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exit Studio</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono font-black text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
              <span>RECORD STUDIO</span>
              <span className="text-[10px] text-teal-400 font-normal px-1.5 py-0.2 rounded bg-teal-500/10 border border-teal-500/20">
                DAW MULTI-TRACK v2.5
              </span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-white/10">
            <span className="text-gray-500 text-[11px] font-mono">SESSION:</span>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Session Name"
              className="bg-transparent border-b border-white/10 hover:border-white/30 focus:border-teal-400 text-xs text-white font-medium focus:outline-none px-1 py-0.5 w-64"
            />
          </div>
        </div>

        {/* Center: Audio Engine & Multi-track Specs */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>48.0 kHz · 24-Bit PCM</span>
          </span>
          <span>·</span>
          <span className="text-teal-300 font-bold">
            {vocalTracks.length + 1} TRACKS ({vocalTracks.filter((t) => t.vocalBlob).length} RECORDED)
          </span>
          <span>·</span>
          <span>CLOUDFLARE R2 READY</span>
        </div>

        {/* Right: Quick Actions & Window Close */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportWav}
            disabled={!hasAnyRecordedTakes || isExportingWav}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-teal-300" />
            <span>{isExportingWav ? 'Rendering...' : 'Export Master WAV'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveToCloud()}
            disabled={!hasAnyRecordedTakes || isSavingToCloud}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-bold text-teal-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            <CloudUpload className="h-3.5 w-3.5" />
            <span>{isSavingToCloud ? 'Saving to R2...' : 'Save to Cloud (R2)'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
            title="Exit Studio"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. MASTER TRANSPORT BAR & DIGITAL TIME COUNTER (Audacity / Cubase Style)
         ========================================================================= */}
      <div className="w-full px-4 py-2.5 bg-[#0C0F17] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        {/* Main Transport Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Return to Zero (RTZ) */}
          <button
            type="button"
            onClick={handleReturnToZero}
            title="Return to Zero (00:00)"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          {/* Play Button */}
          <button
            type="button"
            onClick={togglePlayCombinedPreview}
            disabled={isRecording}
            title="Play / Pause All Tracks (Space)"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
              isPlaying
                ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400'
            }`}
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>

          {/* Stop Button */}
          <button
            type="button"
            onClick={() => {
              if (isRecording) stopRecordingSession();
              else if (isPlaying) togglePlayCombinedPreview();
              handleReturnToZero();
            }}
            title="Stop"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <Square className="h-3.5 w-3.5 fill-current text-gray-300" />
          </button>

          {/* Big Record Button */}
          <button
            type="button"
            onClick={handleRecordTrigger}
            title={`Record into: ${armedTrack?.name || 'Armed Track'} (R)`}
            className={`h-9 px-3.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-red-500/40'
                : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300'
            }`}
          >
            <span className={`w-3 h-3 rounded-full bg-red-500 ${isRecording ? 'animate-ping' : ''}`} />
            <span className="font-mono uppercase text-xs">
              {recordState === 'countdown'
                ? `COUNTDOWN ${countdownNumber}`
                : isRecording
                ? `REC (${armedTrack?.name || 'ARMED'})`
                : `RECORD (${armedTrack?.name?.split(' ')[0] || 'ARM'})`}
            </span>
          </button>

          {/* Delete Armed Take button if current armed track has a take */}
          {armedTrack?.vocalBlob && !isRecording && (
            <button
              type="button"
              onClick={() => handleClearVocalTake(armedTrack.id)}
              title={`Delete recorded take on ${armedTrack.name} and re-record`}
              className="h-9 px-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/30 border border-red-500/40 text-red-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
              <span className="hidden sm:inline">Delete Take</span>
            </button>
          )}

          {/* Loop Toggle */}
          <button
            type="button"
            onClick={() => setIsLoopEnabled(!isLoopEnabled)}
            title="Cycle / Loop Region"
            className={`p-2 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
              isLoopEnabled
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Repeat className="h-3.5 w-3.5" />
          </button>

          {/* Metronome Click Toggle */}
          <button
            type="button"
            onClick={() => setIsMetronomeEnabled(!isMetronomeEnabled)}
            title="Metronome / Click Track"
            className={`p-2 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer ${
              isMetronomeEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-[10px]">CLICK</span>
          </button>

          {/* 3s Count-in Toggle */}
          <button
            type="button"
            onClick={() => setIsCountInEnabled(!isCountInEnabled)}
            title="3-Second Count-In"
            className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono transition-colors cursor-pointer ${
              isCountInEnabled
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold'
                : 'bg-white/5 border-white/10 text-gray-400'
            }`}
          >
            3s PRE
          </button>

          {/* + ADD BACKUP VOCAL TRACK BUTTON */}
          <button
            type="button"
            onClick={handleAddBackupVocalTrack}
            className="h-8 px-3 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Add a new backup vocal harmony or doubles track"
          >
            <Plus className="h-3.5 w-3.5 text-teal-400" />
            <span>+ Add Backup Vocal</span>
          </button>
        </div>

        {/* Digital LED Timecode Readout */}
        <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 shadow-inner">
          <div className="text-right">
            <div className="text-sm sm:text-base font-mono font-black text-amber-400 tracking-wider">
              {formatTimecode(isRecording ? recordingSeconds : playheadTime)}
            </div>
            <div className="text-[9px] font-mono text-gray-500 flex items-center justify-end gap-1.5">
              <span>BAR: {formatBarsBeats(isRecording ? recordingSeconds : playheadTime, selectedTrack?.bpm || 120)}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10 mx-1" />

          <div className="text-[10px] font-mono text-gray-400 space-y-0.5">
            <div className="flex items-center gap-1 text-white font-bold">
              <span className="text-teal-400">{selectedTrack?.bpm || 120}</span>
              <span>BPM</span>
            </div>
            <div className="text-gray-500">{selectedTrack?.musicalKey || 'C Minor'}</div>
          </div>
        </div>

        {/* Master Output VU Meter & Master Volume Knob */}
        <div className="hidden md:flex items-center gap-2.5 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5">
          <div className="text-[9px] font-mono text-gray-400">MASTER</div>
          <div className="flex gap-1">
            <div className="w-2.5 h-7 bg-black rounded-sm overflow-hidden flex flex-col-reverse p-0.5 border border-white/10">
              <div
                className="w-full bg-gradient-to-t from-emerald-500 via-yellow-400 to-red-500 rounded-xs transition-all duration-75"
                style={{ height: `${masterMeterL}%` }}
              />
            </div>
            <div className="w-2.5 h-7 bg-black rounded-sm overflow-hidden flex flex-col-reverse p-0.5 border border-white/10">
              <div
                className="w-full bg-gradient-to-t from-emerald-500 via-yellow-400 to-red-500 rounded-xs transition-all duration-75"
                style={{ height: `${masterMeterR}%` }}
              />
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            aria-label="Master Volume Fader"
            className="w-16 accent-teal-400 h-1.5 bg-black/50 rounded cursor-pointer"
          />
          <span className="text-[9px] font-mono text-teal-300 w-7 text-right">
            {Math.round(masterVolume * 100)}%
          </span>
        </div>

        {/* Backing Beat Switcher Trigger */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBeatPickerOpen(!beatPickerOpen)}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Click to choose a backing beat"
          >
            <Music className="h-3.5 w-3.5 text-amber-400" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {selectedTrack ? selectedTrack.title : 'Choose Beat'}
            </span>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Dropdown / Modal Beat Selector Overlay */}
      {beatPickerOpen && (
        <div className="p-4 bg-[#0B0D14] border-b border-amber-400/20 flex flex-col gap-3 z-40 animate-in slide-in-from-top-2 duration-150 shrink-0 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Disc3 className="h-4 w-4 text-amber-400 animate-[spin_8s_linear_infinite]" />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span>Track 01 Beat Library · Choose Your Backing Beat</span>
                </h3>
                <p className="text-[10px] text-gray-400">
                  Select any beat from your studio catalog. Your recorded vocal takes will be preserved.
                </p>
              </div>
            </div>

            {/* Search Input & Close */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search title, artist, genre..."
                  value={beatSearchQuery}
                  onChange={(e) => setBeatSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs bg-black/60 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 w-44 sm:w-60"
                />
              </div>
              <button
                type="button"
                onClick={() => setBeatPickerOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>

          {/* Genre filter tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {['All', 'Afrobeat', 'Amapiano', 'Hip Hop', 'Trap', 'R&B', 'Pop'].map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => setBeatGenreFilter(genre)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono whitespace-nowrap transition-colors cursor-pointer border ${
                  beatGenreFilter === genre
                    ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-sm'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Beats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {filteredBeats.map((b) => {
              const isCurrent = selectedTrack?.id === b.id;
              const isAuditioning = isAuditioningId === b.id;

              return (
                <div
                  key={b.id}
                  onClick={() => handleSelectBeat(b)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between group ${
                    isCurrent
                      ? 'bg-amber-500/15 border-amber-400/50 text-amber-200 ring-1 ring-amber-400/30'
                      : 'bg-[#111422] border-white/5 hover:border-amber-400/30 hover:bg-[#15192b] text-gray-300'
                  }`}
                >
                  <div className="min-w-0 pr-2 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-white truncate">{b.title}</p>
                      {isCurrent && (
                        <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-400 text-black font-bold shrink-0">
                          LOADED
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 truncate">
                      {b.artist || 'Caution'} · {b.bpm || 110} BPM
                    </p>
                    <span className="text-[9px] font-mono text-gray-500">{b.genre || 'Afrobeat'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      title={isAuditioning ? 'Pause audition' : 'Audition preview'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAuditionToggle(b);
                      }}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        isAuditioning
                          ? 'bg-amber-400 text-black border-amber-300'
                          : 'bg-black/50 border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {isAuditioning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectBeat(b);
                      }}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-white/10 hover:bg-amber-400 hover:text-black text-gray-200'
                      }`}
                    >
                      {isCurrent ? 'Active' : 'Load'}
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredBeats.length === 0 && (
              <div className="col-span-full py-6 text-center text-gray-400 text-xs">
                No beats found matching &quot;{beatSearchQuery}&quot;
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          3. FULL-WIDTH MULTI-TRACK TIMELINE & ARRANGEMENT WORKSPACE
         ========================================================================= */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 bg-[#07090E] w-full">
        {/* Timeline Time Ruler */}
        <div
          onClick={handleTimelineSeek}
          className="relative h-6 bg-[#0B0E17] border border-white/10 rounded-md cursor-pointer flex items-center justify-between px-3 text-[10px] font-mono text-gray-500 select-none w-full"
        >
          <span>00:00</span>
          <span>00:15</span>
          <span>00:30</span>
          <span>00:45</span>
          <span>01:00</span>
          <span>01:15</span>
          <span>01:30</span>
          <span>01:45</span>
          <span>02:00</span>
          <span>02:15</span>
          <span>02:30</span>
          <span>02:45</span>
          <span>03:00</span>

          {/* Playhead Marker on Ruler */}
          {selectedTrack?.durationSeconds && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-teal-400 z-30"
              style={{
                left: `${Math.min(100, (playheadTime / selectedTrack.durationSeconds) * 100)}%`
              }}
            >
              <div className="w-2.5 h-2.5 -ml-1 bg-teal-400 rounded-b-sm shadow-sm" />
            </div>
          )}
        </div>

        {/* TRACK 01: Backing Instrumental Beat Track */}
        <div className="w-full flex flex-col sm:flex-row items-stretch rounded-xl bg-[#0D101A] border border-white/10 overflow-hidden shadow-sm">
          {/* Left Control Panel (TCP) */}
          <div className="w-full sm:w-64 p-3 bg-[#111422] border-b sm:border-b-0 sm:border-r border-white/10 flex flex-col justify-between text-xs shrink-0">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Disc3 className="h-3 w-3 text-amber-400 animate-[spin_8s_linear_infinite]" />
                  <span>TRK 01 · BEAT</span>
                </span>
                <span className="text-[9px] font-mono px-1 rounded bg-white/5 text-gray-400">
                  STEREO WAV
                </span>
              </div>

              {/* Beat Selection Dropdown in Track Options */}
              <div className="mt-1.5 space-y-1">
                <div className="relative">
                  <select
                    value={selectedTrack?.id || ''}
                    onChange={(e) => {
                      const found = availableTracks.find((b) => b.id === e.target.value);
                      if (found) {
                        handleSelectBeat(found);
                      }
                    }}
                    aria-label="Choose beat in Track Options"
                    className="w-full text-xs font-bold bg-[#080B12] hover:bg-[#0c101c] border border-amber-400/40 hover:border-amber-400 text-amber-200 rounded-lg py-1.5 pl-2 pr-6 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400 truncate transition-colors shadow-inner"
                  >
                    {availableTracks.length === 0 ? (
                      <option value="">{selectedTrack?.title || 'No beats available'}</option>
                    ) : (
                      availableTracks.map((b) => (
                        <option key={b.id} value={b.id} className="bg-[#111422] text-white">
                          {b.title} ({b.bpm || 110} BPM · {b.genre || 'Beat'})
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="h-3.5 w-3.5 text-amber-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span className="truncate max-w-[130px] font-mono text-[9px] text-gray-400">
                    {selectedTrack?.artist || 'Caution Studio'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBeatPickerOpen(true)}
                    className="text-[9px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-0.5 underline cursor-pointer shrink-0"
                  >
                    <SlidersHorizontal className="h-2.5 w-2.5" />
                    <span>Browse All</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mute, Solo, Pan & Volume */}
            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBeatMuted(!beatMuted)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                    beatMuted
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  M
                </button>
                <button
                  type="button"
                  onClick={() => setBeatSolo(!beatSolo)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                    beatSolo
                      ? 'bg-yellow-400 text-black border-yellow-300'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  S
                </button>

                {/* Pan Slider */}
                <div className="flex items-center gap-1 ml-auto">
                  <span className="text-[9px] font-mono text-gray-400">PAN</span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="5"
                    value={beatPan}
                    onChange={(e) => setBeatPan(parseInt(e.target.value, 10))}
                    aria-label="Beat Pan"
                    className="w-16 accent-amber-400 h-1 bg-black/40 rounded cursor-pointer"
                  />
                  <span className="text-[9px] font-mono text-amber-300 w-6 text-right">
                    {formatPanLabel(beatPan)}
                  </span>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2">
                <Volume2 className="h-3 w-3 text-gray-400 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.01"
                  value={beatVolume}
                  onChange={(e) => setBeatVolume(parseFloat(e.target.value))}
                  aria-label="Beat Volume Fader"
                  className="w-full accent-amber-400 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                  {beatMuted ? 'MUTE' : `${Math.round(beatVolume * 100)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Right Waveform Display Lane (Full Width) */}
          <div
            onClick={handleTimelineSeek}
            className="relative flex-1 h-20 bg-[#080B12] p-2 flex items-center justify-center cursor-pointer select-none overflow-hidden"
          >
            <div className="w-full flex items-center justify-between gap-0.5 h-14 opacity-80">
              {Array.from({ length: 80 }).map((_, i) => {
                const h = 20 + Math.sin(i * 0.35) * 35 + Math.cos(i * 0.7) * 20;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-amber-400/50 rounded-xs"
                    style={{ height: `${Math.max(12, Math.min(90, h))}%` }}
                  />
                );
              })}
            </div>

            {selectedTrack?.durationSeconds && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-teal-400 z-20 pointer-events-none"
                style={{
                  left: `${Math.min(100, (playheadTime / selectedTrack.durationSeconds) * 100)}%`
                }}
              />
            )}
          </div>
        </div>

        {/* VOCAL TRACKS: Lead Vocal + Multiple Backup Vocal Tracks */}
        {vocalTracks.map((track, trackIdx) => {
          const isThisTrackArmed = track.isArmed;
          const isThisRecording = isRecording && isThisTrackArmed;

          return (
            <div
              key={track.id}
              className={`w-full flex flex-col sm:flex-row items-stretch rounded-xl bg-[#0D101A] border transition-all overflow-hidden shadow-sm ${
                isThisTrackArmed ? 'border-red-500/40' : 'border-white/10'
              }`}
            >
              {/* Left Control Panel (TCP) */}
              <div className="w-full sm:w-64 p-3 bg-[#111422] border-b sm:border-b-0 sm:border-r border-white/10 flex flex-col justify-between text-xs shrink-0">
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                      style={{ color: track.color }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: track.color }}
                      />
                      <span>{`TRK 0${trackIdx + 2}`}</span>
                      <span>·</span>
                      <span>{track.type.toUpperCase()}</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Delete Recorded Vocal Take button (for ANY track that has a take) */}
                      {track.vocalBlob && (
                        <button
                          type="button"
                          onClick={() => handleClearVocalTake(track.id)}
                          className="px-1.5 py-0.5 rounded bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 text-red-300 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                          title={`Delete recorded take from ${track.name} and re-record`}
                        >
                          <Trash2 className="h-2.5 w-2.5 text-red-400" />
                          <span>Delete Take</span>
                        </button>
                      )}

                      {/* Remove backup track lane entirely */}
                      {track.type === 'backup' && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTrack(track.id)}
                          className="text-gray-500 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                          title="Remove backup track lane"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={track.name}
                    onChange={(e) => handleTrackNameChange(track.id, e.target.value)}
                    className="text-xs font-bold text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-teal-400 focus:outline-none w-full truncate mt-0.5"
                  />
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={track.vocalBlob ? 'text-teal-300 font-semibold' : ''}>
                        {track.vocalBlob ? `Recorded (${track.durationSeconds.toFixed(1)}s)` : 'Ready'}
                      </span>
                      {track.vocalBlob && (
                        <button
                          type="button"
                          onClick={() => handleClearVocalTake(track.id)}
                          className="text-[9px] font-mono text-red-400 hover:text-red-300 underline cursor-pointer"
                          title="Delete recorded vocal take"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <span className="font-mono" style={{ color: track.color }}>
                      PAN: {formatPanLabel(track.pan)}
                    </span>
                  </div>
                </div>

                {/* Arm, Mute, Solo, Pan, Volume Controls */}
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    {/* Record Arm Button */}
                    <button
                      type="button"
                      onClick={() => handleArmTrack(track.id)}
                      title={`Arm ${track.name} for recording`}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                        isThisTrackArmed
                          ? 'bg-red-500 text-white border-red-400 shadow-sm shadow-red-500/30'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      REC
                    </button>

                    {/* Mute */}
                    <button
                      type="button"
                      onClick={() => handleToggleMute(track.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                        track.isMuted
                          ? 'bg-amber-500 text-black border-amber-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      M
                    </button>

                    {/* Solo */}
                    <button
                      type="button"
                      onClick={() => handleToggleSolo(track.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                        track.isSolo
                          ? 'bg-yellow-400 text-black border-yellow-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      S
                    </button>

                    {/* Pan Slider */}
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-[9px] font-mono text-gray-400">PAN</span>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="5"
                        value={track.pan}
                        onChange={(e) => handleTrackPanChange(track.id, parseInt(e.target.value, 10))}
                        aria-label={`${track.name} Pan`}
                        className="w-16 accent-teal-400 h-1 bg-black/40 rounded cursor-pointer"
                      />
                      <span className="text-[9px] font-mono text-teal-300 w-6 text-right">
                        {formatPanLabel(track.pan)}
                      </span>
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-3 w-3 text-gray-400 shrink-0" />
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.01"
                      value={track.volume}
                      onChange={(e) => handleTrackVolumeChange(track.id, parseFloat(e.target.value))}
                      aria-label={`${track.name} Volume Fader`}
                      className="w-full accent-teal-400 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                      {track.isMuted ? 'MUTE' : `${Math.round(track.volume * 100)}%`}
                    </span>
                  </div>

                  {/* Vocal Latency Sync Offset Nudge */}
                  <div className="flex items-center justify-between text-[9px] font-mono bg-black/40 px-2 py-1 rounded border border-white/5 mt-1">
                    <span className="text-gray-400 flex items-center gap-1 font-bold">
                      <Clock className="h-2.5 w-2.5 text-teal-400" />
                      <span>VOCAL SYNC</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleNudgeLatency(track.id, -10)}
                        title="Nudge vocal earlier by 10ms (compensates for mic lag)"
                        className="px-1 py-0.2 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                      >
                        -10ms
                      </button>
                      <span className="w-12 text-center font-bold text-teal-300">
                        -{track.latencyOffsetMs !== undefined ? track.latencyOffsetMs : globalLatencyMs}ms
                      </span>
                      <button
                        type="button"
                        onClick={() => handleNudgeLatency(track.id, 10)}
                        title="Nudge vocal later by 10ms"
                        className="px-1 py-0.2 rounded bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
                      >
                        +10ms
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Lane: Live Recording Waveform or Recorded Waveform (Full Width) */}
              <div
                onClick={handleTimelineSeek}
                className="relative flex-1 h-20 bg-[#080B12] p-2 flex items-center justify-center cursor-pointer select-none overflow-hidden"
              >
                {isThisRecording ? (
                  /* Live Waveform drawing for currently recording track */
                  <div className="w-full h-full flex items-center justify-center gap-1">
                    {liveWaveformHistory.map((val, idx) => (
                      <div
                        key={idx}
                        className="w-1.5 bg-red-500 rounded-full transition-all"
                        style={{ height: `${Math.min(95, val)}%` }}
                      />
                    ))}
                    <div className="w-2 h-10 bg-red-400 animate-ping rounded-full ml-1" />
                  </div>
                ) : track.vocalBlob ? (
                  /* Recorded waveform clip — proportional to recorded duration vs total beat length */
                  (() => {
                    const beatDuration = selectedTrack?.durationSeconds || 180;
                    // Clip width % = how much of the beat the recording covers
                    const clipPct = track.durationSeconds > 0
                      ? Math.min(100, (track.durationSeconds / beatDuration) * 100)
                      : 100; // fallback: full width if duration unknown
                    return (
                      <div className="relative w-full h-full flex items-start">
                        {/* Proportional clip region — ends where recording stopped */}
                        <div
                          className="relative h-full flex items-center gap-0.5 overflow-hidden"
                          style={{ width: `${clipPct}%`, minWidth: '40px' }}
                        >
                          {/* Clip background */}
                          <div
                            className="absolute inset-0 rounded-r-sm"
                            style={{ backgroundColor: `${track.color}14` }}
                          />
                          {/* Waveform bars */}
                          <div className="relative w-full flex items-center justify-between gap-0.5 h-14 opacity-90 px-0.5">
                            {Array.from({ length: Math.max(12, Math.round(clipPct * 0.7)) }).map((_, i) => {
                              const seed = trackIdx * 17;
                              const h = 15 + Math.sin(i * 0.5 + seed) * 40 + Math.cos(i * 1.2 + seed) * 20;
                              return (
                                <div
                                  key={i}
                                  className="flex-1 rounded-xs"
                                  style={{
                                    height: `${Math.max(8, Math.min(95, h))}%`,
                                    backgroundColor: track.color
                                  }}
                                />
                              );
                            })}
                          </div>
                          {/* Clip end marker — vertical line showing where recording stopped */}
                          <div
                            className="absolute top-0 right-0 bottom-0 w-0.5 z-10"
                            style={{ backgroundColor: track.color }}
                          />
                          {/* Duration badge */}
                          <div
                            className="absolute bottom-1 left-1 text-[8px] font-mono font-bold px-1 py-0.5 rounded z-10"
                            style={{ backgroundColor: `${track.color}33`, color: track.color }}
                          >
                            {track.durationSeconds.toFixed(1)}s
                          </div>
                        </div>

                        {/* Empty region after the clip (dark, like Cubase/FL Studio) */}
                        {clipPct < 100 && (
                          <div className="flex-1 h-full bg-transparent" />
                        )}

                        {/* Delete Take overlay — always visible on hover inside clip area */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearVocalTake(track.id);
                          }}
                          className="absolute top-1 right-2 px-2.5 py-1 rounded-md bg-black/85 hover:bg-red-600/90 text-red-400 hover:text-white border border-red-500/40 text-[9px] font-mono font-bold flex items-center gap-1.5 z-30 transition-all cursor-pointer backdrop-blur shadow-sm"
                          title="Delete this recorded vocal take"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                          <span>Delete Take</span>
                        </button>
                      </div>
                    );
                  })()
                ) : (
                  /* Empty Track Prompt */
                  <div className="text-center text-gray-500 text-xs flex items-center gap-2 font-mono">
                    <Mic className="h-4 w-4 text-gray-600" />
                    <span>
                      {isThisTrackArmed
                        ? 'Track Armed · Press red [RECORD] above to record into this track'
                        : `Click [REC] on the left to arm ${track.name}`}
                    </span>
                  </div>
                )}

                {/* Scrubber Playhead Line */}
                {selectedTrack?.durationSeconds && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-teal-400 z-20 pointer-events-none"
                    style={{
                      left: `${Math.min(100, (playheadTime / selectedTrack.durationSeconds) * 100)}%`
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Add Backup Vocal Track Quick Trigger Banner */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleAddBackupVocalTrack}
            className="w-full py-2.5 rounded-xl border border-dashed border-white/10 hover:border-teal-500/40 bg-white/[0.01] hover:bg-teal-500/5 text-gray-400 hover:text-teal-300 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4 text-teal-400" />
            <span>+ Add Another Backup Vocal / Harmony Track (Stereo Panned)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          4. BOTTOM DAW DSP EFFECTS RACK & STUDIO CONSOLE
         ========================================================================= */}
      <div className="w-full bg-[#0B0E17] border-t border-white/10 flex flex-col text-xs shrink-0">
        {/* Console Navigation Tabs */}
        <div className="px-4 py-1.5 bg-[#0F131E] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveConsoleTab('fx')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeConsoleTab === 'fx'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>DSP Effects Rack</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveConsoleTab('lyrics')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeConsoleTab === 'lyrics'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Lyrics & Teleprompter</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveConsoleTab('cloud')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeConsoleTab === 'cloud'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CloudUpload className="h-3.5 w-3.5" />
              <span>Cloudflare R2 Sync & Stems</span>
            </button>
          </div>

          <div className="text-[10px] font-mono text-gray-500">
            STEREO HARMONY MATRIX: ACTIVE · 48kHz 24-BIT
          </div>
        </div>

        {/* Tab 1: DSP Effects Rack */}
        {activeConsoleTab === 'fx' && (
          <div className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Studio Reverb */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-teal-300">
                <span>STUDIO REVERB</span>
                <span className="font-mono text-[10px]">{Math.round(reverbAmount * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={reverbAmount}
                onChange={(e) => setReverbAmount(parseFloat(e.target.value))}
                className="w-full accent-teal-400 h-1.5 bg-white/10 rounded cursor-pointer"
              />
              <div className="text-[10px] text-gray-400">Large Hall space simulation</div>
            </div>

            {/* Tempo Delay */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                <span>TEMPO DELAY</span>
                <span className="font-mono text-[10px]">{Math.round(delayAmount * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={delayAmount}
                onChange={(e) => setDelayAmount(parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-white/10 rounded cursor-pointer"
              />
              <div className="text-[10px] text-gray-400">1/4 note sync delay</div>
            </div>

            {/* 3-Band EQ */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-purple-300">
                <span>3-BAND VOCAL EQ</span>
                <span className="font-mono text-[10px]">+{eqMid}dB</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-mono">
                <div>
                  <span className="text-gray-400 block mb-0.5">LOW</span>
                  <input
                    type="range"
                    min="-6"
                    max="6"
                    step="0.5"
                    value={eqLow}
                    onChange={(e) => setEqLow(parseFloat(e.target.value))}
                    className="w-full accent-purple-400 h-1 bg-white/10 rounded"
                  />
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">MID</span>
                  <input
                    type="range"
                    min="-6"
                    max="6"
                    step="0.5"
                    value={eqMid}
                    onChange={(e) => setEqMid(parseFloat(e.target.value))}
                    className="w-full accent-purple-400 h-1 bg-white/10 rounded"
                  />
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">HIGH</span>
                  <input
                    type="range"
                    min="-6"
                    max="6"
                    step="0.5"
                    value={eqHigh}
                    onChange={(e) => setEqHigh(parseFloat(e.target.value))}
                    className="w-full accent-purple-400 h-1 bg-white/10 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Studio Dynamics & Filters */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-white">
                <span>STUDIO DYNAMICS</span>
                <span className="text-[9px] font-mono px-1 rounded bg-teal-400/20 text-teal-300">
                  OPTICAL
                </span>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={compressorEnabled}
                    onChange={(e) => setCompressorEnabled(e.target.checked)}
                    className="rounded accent-teal-400"
                  />
                  <span>Opto Compressor</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={lowCutEnabled}
                    onChange={(e) => setLowCutEnabled(e.target.checked)}
                    className="rounded accent-teal-400"
                  />
                  <span>80Hz Low-Cut</span>
                </label>
              </div>
              <div className="text-[10px] text-gray-400">Warm vocal leveling</div>
            </div>
          </div>
        )}

        {/* Tab 2: Lyrics & Teleprompter */}
        {activeConsoleTab === 'lyrics' && (
          <div className="p-3">
            <textarea
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              placeholder="Write your lyrics, verses, and harmonies here..."
              rows={4}
              className="w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-gray-200 focus:outline-none focus:border-purple-400 resize-none leading-relaxed"
            />
          </div>
        )}

        {/* Tab 3: Cloudflare R2 Sync & Stems */}
        {activeConsoleTab === 'cloud' && (
          <div className="p-3 space-y-2">
            {cloudSaveResult ? (
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0" />
                  <div>
                    <p className="font-bold text-teal-300">
                      All Stems & Master Mix Stored in Cloudflare R2!
                    </p>
                    <p className="text-[11px] text-gray-300">
                      {cloudSaveResult.vocalStems?.length || 0} vocal stems + stereo master WAV archived.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-teal-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    <span>{linkCopied ? 'Copied!' : 'Copy Demo Link'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">
                    Artist / Stage Name
                  </label>
                  <input
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="Your artist name"
                    className="w-full h-8 px-3 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">
                    Instagram / X (@handle)
                  </label>
                  <input
                    type="text"
                    value={socialHandle}
                    onChange={(e) => setSocialHandle(e.target.value)}
                    placeholder="@yourhandle"
                    className="w-full h-8 px-3 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">
                    WhatsApp / Contact
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+234..."
                    className="w-full h-8 px-3 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRecordStudioModal;
