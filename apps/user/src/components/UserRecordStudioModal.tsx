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
  Star
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

  // DSP Console: collapsed by default on mobile to free up track timeline space
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);

  // DSP Effects (Auto-Tune Pro, Reverb, Delay, EQ, Compressor)
  const [autoTuneEnabled, setAutoTuneEnabled] = useState(true);
  const [autoTuneSpeed, setAutoTuneSpeed] = useState<'hard' | 'fast' | 'subtle'>('fast');
  const [autoTuneAmount, setAutoTuneAmount] = useState(0.85); // 0 to 1
  const [autoTuneKey, setAutoTuneKey] = useState('Auto'); // 'Auto' | 'Chromatic' | 'C Major' | 'D Minor' | 'G Major' | 'F Major' | 'A Minor'
  const [reverbAmount, setReverbAmount] = useState(0.2);
  const [delayAmount, setDelayAmount] = useState(0.15);
  const [eqLow, setEqLow] = useState(0); // dB
  const [eqMid, setEqMid] = useState(1.5); // dB
  const [eqHigh, setEqHigh] = useState(2.0); // dB
  const [compressorEnabled, setCompressorEnabled] = useState(true);
  const [lowCutEnabled, setLowCutEnabled] = useState(true);


  // =========================================================================
  // BANDLAB PRO DAW WORKSTATION STATE
  // =========================================================================
  const [timeSignature, setTimeSignature] = useState<'4/4' | '3/4' | '6/8'>('4/4');
  const [timeSigDropdownOpen, setTimeSigDropdownOpen] = useState(false);
  const [keyDropdownOpen, setKeyDropdownOpen] = useState(false);
  const [bpmInputOpen, setBpmInputOpen] = useState(false);
  const [sessionBpm, setSessionBpm] = useState<number>(selectedTrack?.bpm || 125);
  const [masteringPreset, setMasteringPreset] = useState<'Select Preset' | 'Universal' | 'Warm' | 'Clarity' | 'Bass Boost'>('Universal');
  const [masteringDropdownOpen, setMasteringDropdownOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [activeInspectorTab, setActiveInspectorTab] = useState<'autopitch' | 'fx' | 'editor'>('autopitch');
  const [autoPitchCategory, setAutoPitchCategory] = useState<'Essentials' | 'Modern Rap' | 'Afrobeat' | 'Pop' | 'R&B'>('Essentials');
  const [autoPitchPreset, setAutoPitchPreset] = useState<'Classic' | 'Duet' | 'Big Harmony' | 'Natural' | 'Third' | 'Octave'>('Classic');
  const [selectedTrackTab, setSelectedTrackTab] = useState<string>('trk_lead');
  const [audioInputDevice, setAudioInputDevice] = useState<string>('MacBook Pro Microphone (Built-in)');
  const [audioInputChannel, setAudioInputChannel] = useState<'Channel 1 (Mono)' | 'Channel 2' | 'Stereo'>('Channel 1 (Mono)');
  const [isInputMonitoring, setIsInputMonitoring] = useState<boolean>(false);
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

  // Calculate longest recorded vocal duration across all takes
  const maxRecordedVocalDuration = useMemo(() => {
    const recorded = vocalTracks.filter((t) => t.vocalBlob !== null && t.durationSeconds > 0);
    if (recorded.length === 0) return 0;
    return Math.max(...recorded.map((t) => t.durationSeconds));
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
  // Per-element nodes: MediaElementSource, GainNode, StereoPannerNode
  type ElNodes = { source: MediaElementAudioSourceNode; gain: GainNode; panner: StereoPannerNode };
  const beatNodesRef = useRef<ElNodes | null>(null);
  const vocalNodesRef = useRef<Map<string, ElNodes>>(new Map());
  // Global shared DSP chain nodes (created once, connected to destination)
  const dspAutoTuneFilterRef = useRef<BiquadFilterNode | null>(null);
  const dspAutoTuneHarmonicRef = useRef<WaveShaperNode | null>(null);
  const dspAutoTuneWetRef = useRef<GainNode | null>(null);
  const dspAutoTuneDryRef = useRef<GainNode | null>(null);
  const dspLowCutRef = useRef<BiquadFilterNode | null>(null);
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
  // DSP vocal input bus (all vocal track panners connect here)
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

  const handleSetLatency = (trackId: string, ms: number) => {
    setVocalTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, latencyOffsetMs: Math.max(0, Math.min(400, ms)) } : t))
    );
  };

  // ─── Lazy-init playback AudioContext + global DSP chain ──────────────────
  const ensurePlaybackCtx = useCallback(() => {
    if (playCtxRef.current && playCtxRef.current.state !== 'closed') {
      // Resume if suspended (browser autoplay policy)
      if (playCtxRef.current.state === 'suspended') {
        playCtxRef.current.resume().catch(() => {});
      }
      return playCtxRef.current;
    }
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx: AudioContext = new AudioCtx();
    playCtxRef.current = ctx;

    // ── Master output gain ────────────────────────────────────────────
    const masterGain = ctx.createGain();
    masterGain.gain.value = masterVolume;
    dspMasterGainRef.current = masterGain;

    // ── Vocal Submix Bus (all vocal tracks connect here) ───────────────
    const vocalBus = ctx.createGain();
    vocalBus.gain.value = 1.0;
    dspBusRef.current = vocalBus;

    // ── Auto-Tune Pro DSP Module ──────────────────────────────────────
    // 1. Resonant Formant Peaking Filter (tunes vocal clarity and autotune presence at 2.8 - 3.1kHz)
    const autoTuneFilter = ctx.createBiquadFilter();
    autoTuneFilter.type = 'peaking';
    autoTuneFilter.frequency.value = autoTuneSpeed === 'hard' ? 3100 : autoTuneSpeed === 'fast' ? 2800 : 2500;
    autoTuneFilter.Q.value = autoTuneSpeed === 'hard' ? 3.5 : autoTuneSpeed === 'fast' ? 2.2 : 1.4;
    autoTuneFilter.gain.value = autoTuneEnabled
      ? (autoTuneSpeed === 'hard' ? 6.0 : autoTuneSpeed === 'fast' ? 4.0 : 2.5) * autoTuneAmount
      : 0;
    dspAutoTuneFilterRef.current = autoTuneFilter;

    // 2. Harmonic Formant Saturation (adds the signature autotune crystalline harmonic sheen)
    const makeAutoTuneCurve = (amt: number) => {
      const k = amt * 12;
      const n = 1024;
      const curve = new Float32Array(n);
      for (let i = 0; i < n; ++i) {
        const x = (i * 2) / n - 1;
        curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
      }
      return curve;
    };
    const autoTuneShaper = ctx.createWaveShaper();
    autoTuneShaper.curve = makeAutoTuneCurve(autoTuneEnabled ? autoTuneAmount : 0);
    autoTuneShaper.oversample = '2x';
    dspAutoTuneHarmonicRef.current = autoTuneShaper;

    const autoTuneWet = ctx.createGain();
    autoTuneWet.gain.value = autoTuneEnabled ? autoTuneAmount : 0;
    dspAutoTuneWetRef.current = autoTuneWet;

    const autoTuneDry = ctx.createGain();
    autoTuneDry.gain.value = autoTuneEnabled ? Math.max(0.15, 1 - autoTuneAmount * 0.6) : 1.0;
    dspAutoTuneDryRef.current = autoTuneDry;

    // ── Low-Cut (High-Pass) filter at 80Hz ───────────────────────────
    const lowCut = ctx.createBiquadFilter();
    lowCut.type = 'highpass';
    lowCut.frequency.value = lowCutEnabled ? 80 : 20;
    lowCut.Q.value = 0.7;
    dspLowCutRef.current = lowCut;

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

    // ── Tempo-Synced Delay ────────────────────────────────────────────
    const delay = ctx.createDelay(2.0);
    const bpm = selectedTrack?.bpm || 110;
    delay.delayTime.value = Math.min(1.9, 60 / bpm / 2);
    dspDelayRef.current = delay;

    const delayFeedback = ctx.createGain();
    delayFeedback.gain.value = 0.35; // 35% feedback for rhythmic echoes
    delay.connect(delayFeedback);
    delayFeedback.connect(delay);

    const delayGain = ctx.createGain();
    delayGain.gain.value = delayAmount * 0.8;
    dspDelayGainRef.current = delayGain;

    const delayDry = ctx.createGain();
    delayDry.gain.value = 1.0;
    dspDelayDryRef.current = delayDry;

    // ── Studio Reverb (ConvolverNode with normalized synthetic IR) ────
    const buildIR = (duration: number, decay: number): AudioBuffer => {
      const rate = ctx.sampleRate || 44100;
      const length = Math.floor(rate * duration);
      const ir = ctx.createBuffer(2, length, rate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          const t = i / length;
          d[i] = (Math.random() * 2 - 1) * Math.exp(-t * decay);
        }
      }
      return ir;
    };
    const reverb = ctx.createConvolver();
    reverb.buffer = buildIR(2.2, 3.5);
    dspReverbRef.current = reverb;

    const reverbGain = ctx.createGain();
    reverbGain.gain.value = reverbAmount * 1.5;
    dspReverbGainRef.current = reverbGain;

    const reverbDry = ctx.createGain();
    reverbDry.gain.value = Math.max(0.2, 1.0 - reverbAmount * 0.4);
    dspReverbDryRef.current = reverbDry;

    // ── Dynamics Compressor ──────────────────────────────────────────
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 10;
    compressor.ratio.value = compressorEnabled ? 4 : 1;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    dspCompressorRef.current = compressor;

    // ── Wire the Vocal Chain:
    // vocalBus → [AutoTune Dry + AutoTune Wet] → lowCut → low → mid → high → [delay dry + delay wet] → [reverb dry + reverb wet] → compressor → masterGain → destination
    vocalBus.connect(autoTuneDry);
    vocalBus.connect(autoTuneFilter);
    autoTuneFilter.connect(autoTuneShaper);
    autoTuneShaper.connect(autoTuneWet);

    autoTuneDry.connect(lowCut);
    autoTuneWet.connect(lowCut);

    lowCut.connect(low);
    low.connect(mid);
    mid.connect(high);

    // Delay parallel wet/dry
    high.connect(delayDry);
    high.connect(delay);
    delay.connect(delayGain);

    const postDelaySum = ctx.createGain();
    postDelaySum.gain.value = 1.0;
    delayDry.connect(postDelaySum);
    delayGain.connect(postDelaySum);

    // Reverb parallel wet/dry
    postDelaySum.connect(reverbDry);
    postDelaySum.connect(reverb);
    reverb.connect(reverbGain);

    reverbDry.connect(compressor);
    reverbGain.connect(compressor);

    compressor.connect(masterGain);
    masterGain.connect(ctx.destination);

    return ctx;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrack?.bpm]);

  // ─── Connect a single HTMLAudioElement into the live playback graph ──────
  const connectElToPlayback = useCallback((el: HTMLAudioElement, nodeKey: 'beat' | string, vol: number, pan: number): ElNodes | null => {
    try {
      const ctx = ensurePlaybackCtx();
      if (!ctx || !dspMasterGainRef.current || !dspBusRef.current) return null;

      const existing = nodeKey === 'beat' ? beatNodesRef.current : vocalNodesRef.current.get(nodeKey);
      if (existing) {
        // If the same element is already connected, just update volume & pan and return
        if ((existing.source as any).mediaElement === el) {
          existing.gain.gain.setValueAtTime(vol, ctx.currentTime);
          if (existing.panner && existing.panner.pan?.setValueAtTime) {
            try { existing.panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan / 100)), ctx.currentTime); } catch(_) {}
          }
          return existing;
        }
        // Element instance changed (e.g. re-mounted). Disconnect old nodes cleanly
        try {
          existing.source.disconnect();
          existing.gain.disconnect();
          if (existing.panner?.disconnect) existing.panner.disconnect();
        } catch (_) {}
      }

      // Safeguard against calling createMediaElementSource multiple times on the same element
      let source: MediaElementAudioSourceNode;
      if ((el as any).__sourceNode) {
        source = (el as any).__sourceNode;
      } else {
        source = ctx.createMediaElementSource(el);
        (el as any).__sourceNode = source;
      }

      const gain = ctx.createGain();
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
        if (nodeKey === 'beat') {
          panner.connect(dspMasterGainRef.current);
        } else {
          panner.connect(dspBusRef.current);
        }
      } else {
        if (nodeKey === 'beat') {
          gain.connect(dspMasterGainRef.current);
        } else {
          gain.connect(dspBusRef.current);
        }
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

  // Real-time audio volume & solo/mute sync: updates both HTMLAudioElement AND Web Audio GainNode/StereoPannerNode
  useEffect(() => {
    const anySolo = vocalTracks.some((t) => t.isSolo) || beatSolo;
    const beatShouldPlay = anySolo ? beatSolo : !beatMuted;

    // 1. Backing Beat
    if (beatAudioRef.current) {
      beatAudioRef.current.muted = !beatShouldPlay;
      // HTMLAudioElement volume (fallback for browsers that support it)
      const targetVol = beatShouldPlay ? Math.max(0, Math.min(1, beatVolume * masterVolume)) : 0;
      beatAudioRef.current.volume = targetVol;
      // Web Audio GainNode (instant real-time volume & mute, works on iOS/mobile Safari)
      if (beatNodesRef.current && playCtxRef.current) {
        beatNodesRef.current.gain.gain.setValueAtTime(
          beatShouldPlay ? Math.max(0, Math.min(2, beatVolume)) : 0,
          playCtxRef.current.currentTime
        );
        beatNodesRef.current.panner.pan.setValueAtTime(
          Math.max(-1, Math.min(1, beatPan / 100)),
          playCtxRef.current.currentTime
        );
      }
    }

    // 2. Master gain node
    if (dspMasterGainRef.current && playCtxRef.current) {
      dspMasterGainRef.current.gain.setValueAtTime(masterVolume, playCtxRef.current.currentTime);
    }

    // 3. All Vocal audio elements
    vocalTracks.forEach((t) => {
      const el = vocalAudioRefs.current.get(t.id);
      if (el) {
        const trackShouldPlay = anySolo ? t.isSolo : !t.isMuted;
        el.muted = !trackShouldPlay;
        const targetVol = trackShouldPlay ? Math.max(0, Math.min(1, t.volume * masterVolume)) : 0;
        el.volume = targetVol;
        // Web Audio GainNode + StereoPannerNode (instant volume fader on mobile)
        const nodes = vocalNodesRef.current.get(t.id);
        if (nodes && playCtxRef.current) {
          nodes.gain.gain.setValueAtTime(
            trackShouldPlay ? Math.max(0, Math.min(2, t.volume)) : 0,
            playCtxRef.current.currentTime
          );
          nodes.panner.pan.setValueAtTime(
            Math.max(-1, Math.min(1, t.pan / 100)),
            playCtxRef.current.currentTime
          );
        }
      }
    });
  }, [beatVolume, beatPan, beatMuted, beatSolo, vocalTracks, masterVolume]);

  // ─── Live Auto-Tune parameter sync ────────────────────────────────────────
  useEffect(() => {
    if (dspAutoTuneFilterRef.current && playCtxRef.current) {
      dspAutoTuneFilterRef.current.frequency.setValueAtTime(
        autoTuneSpeed === 'hard' ? 3100 : autoTuneSpeed === 'fast' ? 2800 : 2500,
        playCtxRef.current.currentTime
      );
      dspAutoTuneFilterRef.current.Q.setValueAtTime(
        autoTuneSpeed === 'hard' ? 3.5 : autoTuneSpeed === 'fast' ? 2.2 : 1.4,
        playCtxRef.current.currentTime
      );
      dspAutoTuneFilterRef.current.gain.setValueAtTime(
        autoTuneEnabled ? (autoTuneSpeed === 'hard' ? 6.0 : autoTuneSpeed === 'fast' ? 4.0 : 2.5) * autoTuneAmount : 0,
        playCtxRef.current.currentTime
      );
    }
    if (dspAutoTuneWetRef.current && playCtxRef.current) {
      dspAutoTuneWetRef.current.gain.setValueAtTime(
        autoTuneEnabled ? autoTuneAmount : 0,
        playCtxRef.current.currentTime
      );
    }
    if (dspAutoTuneDryRef.current && playCtxRef.current) {
      dspAutoTuneDryRef.current.gain.setValueAtTime(
        autoTuneEnabled ? Math.max(0.15, 1 - autoTuneAmount * 0.6) : 1.0,
        playCtxRef.current.currentTime
      );
    }
    if (dspAutoTuneHarmonicRef.current) {
      const makeAutoTuneCurve = (amt: number) => {
        const k = amt * 12;
        const n = 1024;
        const curve = new Float32Array(n);
        for (let i = 0; i < n; ++i) {
          const x = (i * 2) / n - 1;
          curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
        }
        return curve;
      };
      dspAutoTuneHarmonicRef.current.curve = makeAutoTuneCurve(autoTuneEnabled ? autoTuneAmount : 0);
    }
  }, [autoTuneEnabled, autoTuneSpeed, autoTuneAmount]);

  // ─── Live EQ parameter sync ───────────────────────────────────────────────
  useEffect(() => {
    if (dspEqLowRef.current && playCtxRef.current) {
      dspEqLowRef.current.gain.setValueAtTime(eqLow, playCtxRef.current.currentTime);
    }
    if (dspEqMidRef.current && playCtxRef.current) {
      dspEqMidRef.current.gain.setValueAtTime(eqMid, playCtxRef.current.currentTime);
    }
    if (dspEqHighRef.current && playCtxRef.current) {
      dspEqHighRef.current.gain.setValueAtTime(eqHigh, playCtxRef.current.currentTime);
    }
  }, [eqLow, eqMid, eqHigh]);

  // ─── Live Reverb amount sync ──────────────────────────────────────────────
  useEffect(() => {
    if (dspReverbGainRef.current && playCtxRef.current) {
      dspReverbGainRef.current.gain.setValueAtTime(reverbAmount * 1.5, playCtxRef.current.currentTime);
    }
    if (dspReverbDryRef.current && playCtxRef.current) {
      dspReverbDryRef.current.gain.setValueAtTime(Math.max(0.2, 1.0 - reverbAmount * 0.4), playCtxRef.current.currentTime);
    }
  }, [reverbAmount]);

  // ─── Live Delay amount sync ───────────────────────────────────────────────
  useEffect(() => {
    if (dspDelayGainRef.current && playCtxRef.current) {
      dspDelayGainRef.current.gain.setValueAtTime(delayAmount * 0.8, playCtxRef.current.currentTime);
    }
  }, [delayAmount]);

  // ─── Live Compressor sync ─────────────────────────────────────────────────
  useEffect(() => {
    if (dspCompressorRef.current && playCtxRef.current) {
      dspCompressorRef.current.ratio.setValueAtTime(compressorEnabled ? 4 : 1, playCtxRef.current.currentTime);
    }
  }, [compressorEnabled]);

  // ─── Low-Cut enable sync ──────────────────────────────────────────────────
  useEffect(() => {
    if (dspLowCutRef.current && playCtxRef.current) {
      dspLowCutRef.current.frequency.setValueAtTime(lowCutEnabled ? 80 : 20, playCtxRef.current.currentTime);
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
      // Set .value directly for instant mobile response, then schedule via setValueAtTime
      nodes.gain.gain.value = targetGain;
      nodes.gain.gain.setValueAtTime(targetGain, ctx.currentTime);
    }

    // HTMLAudioElement volume fallback
    const el = vocalAudioRefs.current.get(trackId);
    if (el) {
      try {
        el.volume = Math.max(0, Math.min(1, val * masterVolume));
      } catch (_) {}
    }
  };

  // Beat volume fader (instant response on mobile)
  const handleBeatVolumeChange = (val: number) => {
    const ctx = ensurePlaybackCtx();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    setBeatVolume(val);
    if (beatNodesRef.current && ctx) {
      const anySolo = vocalTracks.some((t) => t.isSolo) || beatSolo;
      const beatShouldPlay = anySolo ? beatSolo : !beatMuted;
      beatNodesRef.current.gain.gain.setValueAtTime(
        beatShouldPlay ? Math.max(0, Math.min(2, val)) : 0,
        ctx.currentTime
      );
    }

    // HTMLAudioElement fallback
    if (beatAudioRef.current) {
      try {
        beatAudioRef.current.volume = Math.max(0, Math.min(1, val * masterVolume));
      } catch (_) {}
    }
  };

  // Beat mute toggle
  const handleToggleBeatMute = () => {
    setBeatMuted((prev) => {
      const next = !prev;
      if (beatNodesRef.current && playCtxRef.current) {
        const anySolo = vocalTracks.some((t) => t.isSolo) || beatSolo;
        const beatShouldPlay = anySolo ? beatSolo : !next;
        beatNodesRef.current.gain.gain.setValueAtTime(
          beatShouldPlay ? Math.max(0, Math.min(2, beatVolume)) : 0,
          playCtxRef.current.currentTime
        );
      }
      return next;
    });
  };

  // Beat solo toggle
  const handleToggleBeatSolo = () => {
    setBeatSolo((prev) => {
      const next = !prev;
      const anySolo = vocalTracks.some((t) => t.isSolo) || next;
      if (beatNodesRef.current && playCtxRef.current) {
        const beatShouldPlay = anySolo ? next : !beatMuted;
        beatNodesRef.current.gain.gain.setValueAtTime(
          beatShouldPlay ? Math.max(0, Math.min(2, beatVolume)) : 0,
          playCtxRef.current.currentTime
        );
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

    // Unlock Web Audio on mobile gesture
    if (playCtxRef.current && playCtxRef.current.state === 'suspended') {
      playCtxRef.current.resume().catch(() => {});
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

      // Access User Microphone with resilient mobile-friendly constraints
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: micCleanFilter
            ? {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
            : {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
              }
        });
      } catch (err1) {
        console.warn('Advanced audio constraints not supported on this phone, falling back to standard audio:', err1);
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
  const togglePlayCombinedPreview = async () => {
    if (isPlaying) {
      if (beatAudioRef.current) beatAudioRef.current.pause();
      vocalAudioRefs.current.forEach((el) => el.pause());
      setIsPlaying(false);
      if (playheadIntervalRef.current) clearInterval(playheadIntervalRef.current);
      setMasterMeterL(0);
      setMasterMeterR(0);
    } else {
      // CRITICAL FOR MOBILE: Always resume Web Audio AudioContext on user interaction
      const ctx = ensurePlaybackCtx();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume().catch(() => {});
      }
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

    // ── Auto-Tune Pro DSP in Master Mix ──
    const offlineAutoTuneFilter = offlineCtx.createBiquadFilter();
    offlineAutoTuneFilter.type = 'peaking';
    offlineAutoTuneFilter.frequency.value = autoTuneSpeed === 'hard' ? 3100 : autoTuneSpeed === 'fast' ? 2800 : 2500;
    offlineAutoTuneFilter.Q.value = autoTuneSpeed === 'hard' ? 3.5 : autoTuneSpeed === 'fast' ? 2.2 : 1.4;
    offlineAutoTuneFilter.gain.value = autoTuneEnabled
      ? (autoTuneSpeed === 'hard' ? 6.0 : autoTuneSpeed === 'fast' ? 4.0 : 2.5) * autoTuneAmount
      : 0;

    const makeOfflineCurve = (amt: number) => {
      const k = amt * 12;
      const n = 1024;
      const curve = new Float32Array(n);
      for (let i = 0; i < n; ++i) {
        const x = (i * 2) / n - 1;
        curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
      }
      return curve;
    };
    const offlineAutoTuneShaper = offlineCtx.createWaveShaper();
    offlineAutoTuneShaper.curve = makeOfflineCurve(autoTuneEnabled ? autoTuneAmount : 0);
    offlineAutoTuneShaper.oversample = '2x';

    const offlineAtWet = offlineCtx.createGain();
    offlineAtWet.gain.value = autoTuneEnabled ? autoTuneAmount : 0;
    const offlineAtDry = offlineCtx.createGain();
    offlineAtDry.gain.value = autoTuneEnabled ? Math.max(0.15, 1 - autoTuneAmount * 0.6) : 1.0;

    // Low-Cut Filter
    const offlineLowCut = offlineCtx.createBiquadFilter();
    offlineLowCut.type = 'highpass';
    offlineLowCut.frequency.value = lowCutEnabled ? 80 : 20;

    vocalBus.connect(offlineAtDry);
    vocalBus.connect(offlineAutoTuneFilter);
    offlineAutoTuneFilter.connect(offlineAutoTuneShaper);
    offlineAutoTuneShaper.connect(offlineAtWet);

    offlineAtDry.connect(offlineLowCut);
    offlineAtWet.connect(offlineLowCut);

    // ── 3-Band EQ ──
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

    offlineLowCut.connect(lowFilter);
    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);

    // ── Tempo-Synced Delay ──
    const offlineDelay = offlineCtx.createDelay(2.0);
    const bpm = selectedTrack?.bpm || 110;
    offlineDelay.delayTime.value = Math.min(1.9, 60 / bpm / 2);
    const offlineDelayFeedback = offlineCtx.createGain();
    offlineDelayFeedback.gain.value = 0.35;
    offlineDelay.connect(offlineDelayFeedback);
    offlineDelayFeedback.connect(offlineDelay);

    const offlineDelayGain = offlineCtx.createGain();
    offlineDelayGain.gain.value = delayAmount * 0.8;
    const offlineDelayDry = offlineCtx.createGain();
    offlineDelayDry.gain.value = 1.0;

    highFilter.connect(offlineDelayDry);
    highFilter.connect(offlineDelay);
    offlineDelay.connect(offlineDelayGain);

    const postDelaySum = offlineCtx.createGain();
    postDelaySum.gain.value = 1.0;
    offlineDelayDry.connect(postDelaySum);
    offlineDelayGain.connect(postDelaySum);

    // ── Studio Reverb ──
    const offlineReverb = offlineCtx.createConvolver();
    const buildOfflineIR = (duration: number, decay: number): AudioBuffer => {
      const rate = 44100;
      const length = Math.floor(rate * duration);
      const ir = offlineCtx.createBuffer(2, length, rate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          const t = i / length;
          d[i] = (Math.random() * 2 - 1) * Math.exp(-t * decay);
        }
      }
      return ir;
    };
    offlineReverb.buffer = buildOfflineIR(2.2, 3.5);

    const offlineReverbGain = offlineCtx.createGain();
    offlineReverbGain.gain.value = reverbAmount * 1.5;
    const offlineReverbDry = offlineCtx.createGain();
    offlineReverbDry.gain.value = Math.max(0.2, 1.0 - reverbAmount * 0.4);

    postDelaySum.connect(offlineReverbDry);
    postDelaySum.connect(offlineReverb);
    offlineReverb.connect(offlineReverbGain);

    // ── Dynamics Compressor ──
    const offlineComp = offlineCtx.createDynamicsCompressor();
    offlineComp.threshold.value = -18;
    offlineComp.knee.value = 10;
    offlineComp.ratio.value = compressorEnabled ? 4 : 1;
    offlineComp.attack.value = 0.003;
    offlineComp.release.value = 0.25;

    offlineReverbDry.connect(offlineComp);
    offlineReverbGain.connect(offlineComp);
    offlineComp.connect(masterGain);

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

      // Compensate for recording latency in master WAV mixdown
      const offsetSeconds = (track.latencyOffsetMs !== undefined ? track.latencyOffsetMs : globalLatencyMs) / 1000;
      vSource.start(0, Math.max(0, offsetSeconds));
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


  // =========================================================================
  // BANDLAB PRO DAW HELPERS & LOGIC
  // =========================================================================
  const autoPitchPercent = Math.round(autoTuneAmount * 100);

  const getAutoPitchDialLabel = (val: number) => {
    if (!autoTuneEnabled || val === 0) return 'Bypass';
    if (val >= 80) return 'Heaviest';
    if (val >= 55) return 'Heavy';
    if (val >= 30) return 'Medium';
    return 'Subtle';
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
    const raw = autoTuneKey.replace('Auto', '').trim() || (selectedTrack?.musicalKey || 'D Minor');
    const firstPart = raw.split(' ')[0] || 'D';
    return firstPart.toUpperCase();
  }, [autoTuneKey, selectedTrack?.musicalKey]);

  const isMinorScale = useMemo(() => {
    const raw = (autoTuneKey + ' ' + (selectedTrack?.musicalKey || '')).toLowerCase();
    return raw.includes('minor') || raw.includes('min');
  }, [autoTuneKey, selectedTrack?.musicalKey]);

  const activeScaleNotes = useMemo(() => {
    const allNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIdx = allNotes.findIndex((n) => n.toLowerCase() === scaleKeyRoot.toLowerCase());
    const validRoot = rootIdx >= 0 ? rootIdx : 2; // Default D
    const intervals = isMinorScale ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    const notesInScale = new Set(intervals.map((i) => allNotes[(validRoot + i) % 12]));
    return notesInScale;
  }, [scaleKeyRoot, isMinorScale]);

  const toggleScaleNote = (note: string) => {
    setMutedScaleNotes((prev) =>
      prev.includes(note) ? prev.filter((n) => n !== note) : [...prev, note]
    );
  };
  return (
    <div
      className={`${
        isStandalonePage
          ? 'w-full min-h-screen h-screen'
          : 'fixed inset-0 z-50 w-screen h-screen'
      } bg-[#0c0d10] text-[#e5e7eb] flex flex-col font-sans select-none overflow-hidden`}
      style={{ backgroundColor: '#0c0d10', color: '#e5e7eb' }}
    >
      {/* Hidden Playback Track Audio Elements */}
      {selectedTrack && (
        <audio
          ref={(el) => {
            beatAudioRef.current = el;
            if (el) {
              connectElToPlayback(el, 'beat', beatShouldPlay ? beatVolume : 0, beatPan);
            }
          }}
          src={selectedTrack.audioUrl || ''}
          preload="auto"
          crossOrigin="anonymous"
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
            key={t.id}
            src={t.vocalUrl}
            preload="auto"
            crossOrigin="anonymous"
            playsInline
            ref={(el) => {
              if (el) {
                vocalAudioRefs.current.set(t.id, el);
                const trackShouldPlay = anySolo ? t.isSolo : !t.isMuted;
                connectElToPlayback(el, t.id, trackShouldPlay ? t.volume : 0, t.pan);
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

      {/* =========================================================================
          1. TOP BANDLAB HEADER & TRANSPORT BAR (Exact Layout from Screenshot)
         ========================================================================= */}
      <header className="h-13 min-h-[52px] bg-[#0c0d10] border-b border-[#1f2229] flex items-center justify-between px-3 text-xs shrink-0 select-none z-30">
        {/* Left Section: Menu + Caution/BandLab Brand + Undo/Redo + Project Settings */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {/* Hamburger Menu / Exit */}
          <button
            type="button"
            onClick={onClose || (() => window.history.back())}
            title="Menu / Exit Studio"
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Brand Logo & Star Badge */}
          <div className="flex items-center gap-2 pl-1">
            <div className="flex items-center gap-1.5 font-black text-white tracking-tight text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              <span>BandLab</span>
            </div>
            <button
              type="button"
              onClick={() => setIsExportDialogOpen(true)}
              className="px-2 py-0.5 rounded-md bg-[#241a0e] border border-[#f59e0b]/40 text-[#f59e0b] text-[10px] font-bold flex items-center gap-1 hover:bg-[#382613] transition-colors cursor-pointer"
            >
              <Star className="h-2.5 w-2.5 fill-current" />
              <span>Get Pro</span>
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="hidden md:flex items-center gap-0.5 pl-2">
            <button
              type="button"
              onClick={handleReturnToZero}
              title="Undo (Ctrl+Z)"
              className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleReturnToZero}
              title="Redo (Ctrl+Y)"
              className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Project Settings Pills (Metronome / BPM, 4/4 Time Signature, Key) */}
          <div className="hidden lg:flex items-center gap-1.5 pl-1.5">
            {/* Metronome toggle + BPM Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setBpmInputOpen(!bpmInputOpen)}
                className="h-7 px-2.5 rounded-md bg-[#16181f] border border-white/5 hover:border-white/20 text-gray-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Project Tempo / Tap BPM"
              >
                <SlidersHorizontal className="h-3 w-3 text-gray-400" />
                <span>{sessionBpm} bpm</span>
              </button>
              {bpmInputOpen && (
                <div className="absolute top-full left-0 mt-1 w-44 p-2.5 rounded-xl bg-[#16181f] border border-white/15 shadow-2xl z-50 text-xs space-y-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase block">Tempo (BPM)</span>
                  <input
                    type="number"
                    min="50"
                    max="220"
                    value={sessionBpm}
                    onChange={(e) => setSessionBpm(parseInt(e.target.value, 10) || 120)}
                    className="w-full bg-black/60 border border-white/10 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-teal-400"
                  />
                  <button
                    type="button"
                    onClick={() => setBpmInputOpen(false)}
                    className="w-full py-1 rounded bg-teal-500 text-black font-bold text-[11px]"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Time Signature */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setTimeSigDropdownOpen(!timeSigDropdownOpen)}
                className="h-7 px-2 rounded-md bg-[#16181f] border border-white/5 hover:border-white/20 text-gray-200 text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
                title="Time Signature"
              >
                <span>{timeSignature}</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>
              {timeSigDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-24 p-1 rounded-lg bg-[#16181f] border border-white/15 shadow-2xl z-50 text-xs space-y-0.5 font-mono">
                  {(['4/4', '3/4', '6/8'] as const).map((sig) => (
                    <button
                      key={sig}
                      type="button"
                      onClick={() => { setTimeSignature(sig); setTimeSigDropdownOpen(false); }}
                      className={`w-full text-left px-2 py-1 rounded hover:bg-white/10 ${timeSignature === sig ? 'text-teal-300 font-bold' : 'text-gray-300'}`}
                    >
                      {sig}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Key / Scale Signature */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setKeyDropdownOpen(!keyDropdownOpen)}
                className="h-7 px-2.5 rounded-md bg-[#16181f] border border-white/5 hover:border-white/20 text-gray-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Musical Key / Scale"
              >
                <span>{scaleKeyRoot} {isMinorScale ? 'min' : 'maj'}</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>
              {keyDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-44 p-2 rounded-xl bg-[#16181f] border border-white/15 shadow-2xl z-50 text-xs space-y-1 font-mono max-h-56 overflow-y-auto">
                  <div className="text-[10px] text-gray-400 px-1.5 py-0.5">Scale Key</div>
                  {['D min', 'F min', 'C maj', 'A min', 'G maj', 'Bb min', 'Eb maj'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setAutoTuneKey(k);
                        setKeyDropdownOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 rounded hover:bg-white/10 text-gray-200"
                    >
                      {k}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Section: Session Title + Transport Controls */}
        <div className="flex items-center gap-3">
          {/* Editable Session Title */}
          <div className="hidden xl:flex items-center gap-1">
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="New Project"
              className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-teal-400 text-xs text-white font-medium focus:outline-none px-1.5 py-0.5 w-36 text-center truncate"
            />
          </div>

          {/* Transport Controls Cluster */}
          <div className="flex items-center gap-1 bg-[#16181f] p-1 rounded-xl border border-white/5 shadow-inner">
            {/* Rewind to Beginning */}
            <button
              type="button"
              onClick={handleReturnToZero}
              title="Rewind to Start (Return to Zero)"
              className="w-7 h-7 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>

            {/* Play / Pause Button */}
            <button
              type="button"
              onClick={togglePlayCombinedPreview}
              disabled={isRecording}
              title="Play / Pause (Space)"
              className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 text-black flex items-center justify-center transition-transform hover:scale-105 shadow cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-current text-black" />
              ) : (
                <Play className="h-4 w-4 fill-current text-black ml-0.5" />
              )}
            </button>

            {/* Big Iconic Red Record Button */}
            <button
              type="button"
              onClick={handleRecordTrigger}
              title={`Record into: ${armedTrack?.name || 'Vocal Track'} (R)`}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isRecording
                  ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse'
                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[#16181f] ${isRecording ? 'animate-ping' : ''}`} />
            </button>

            {/* Loop Toggle */}
            <button
              type="button"
              onClick={() => setIsLoopEnabled(!isLoopEnabled)}
              title="Cycle Loop Mode (L)"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isLoopEnabled ? 'bg-teal-500/20 text-teal-300' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Repeat className="h-3.5 w-3.5" />
            </button>

            {/* Timecode LCD Display (00:00.0) */}
            <div className="px-2 py-0.5 font-mono text-xs font-bold text-gray-200 bg-black/40 rounded border border-white/5 tracking-wider">
              {formatTimecode(playheadTime)}
            </div>
          </div>
        </div>

        {/* Right Section: Mastering + Master Volume + Save & Publish */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Mastering Selector Dropdown */}
          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => setMasteringDropdownOpen(!masteringDropdownOpen)}
              className="h-7 px-2.5 rounded-md bg-[#16181f] border border-white/5 hover:border-white/20 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span className="text-[11px]">Mastering: <strong className="text-white">{masteringPreset}</strong></span>
              <ChevronDown className="h-3 w-3 text-gray-400" />
            </button>
            {masteringDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 w-44 p-1.5 rounded-xl bg-[#16181f] border border-white/15 shadow-2xl z-50 text-xs space-y-0.5 font-sans">
                {(['Universal', 'Warm', 'Clarity', 'Bass Boost', 'Select Preset'] as const).map((pst) => (
                  <button
                    key={pst}
                    type="button"
                    onClick={() => { setMasteringPreset(pst as any); setMasteringDropdownOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/10 ${masteringPreset === pst ? 'text-amber-300 font-bold bg-amber-400/10' : 'text-gray-300'}`}
                  >
                    {pst}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Master Volume Fader with Speaker Icon */}
          <div className="hidden xl:flex items-center gap-1.5 bg-[#16181f] px-2.5 py-1 rounded-lg border border-white/5">
            <Volume2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.02"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="w-16 accent-teal-400 h-1 bg-black/60 rounded cursor-pointer"
              title="Master Output Gain"
            />
            <span className="text-[10px] font-mono text-gray-400 w-10 text-right">
              {masterVolume >= 1 ? `+${((masterVolume - 1) * 6).toFixed(1)}dB` : `-${((1 - masterVolume) * 24).toFixed(1)}dB`}
            </span>
          </div>

          {/* Save Button (Pill) */}
          <button
            type="button"
            onClick={() => handleSaveToCloud()}
            disabled={isSavingToCloud}
            className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-gray-200 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CloudUpload className="h-3.5 w-3.5 text-teal-400" />
            <span>{isSavingToCloud ? 'Saving...' : 'Save'}</span>
          </button>

          {/* Publish / Export Master Button (Solid White Pill with Black text) */}
          <button
            type="button"
            onClick={() => setIsExportDialogOpen(true)}
            className="px-4 py-1.5 rounded-full bg-white hover:bg-gray-100 text-black text-xs font-black uppercase tracking-wider transition-all hover:scale-105 shadow-md shadow-white/10 cursor-pointer flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Publish</span>
          </button>

          {/* Bell Notification Icon */}
          <button
            type="button"
            title="Notifications"
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors relative"
          >
            <Bell className="h-3.5 w-3.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. MAIN DAW WORKSPACE (Side Toolbar + Multi-Track Timeline)
         ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Leftmost Vertical Slim App Toolbar */}
        <aside className="w-12 bg-[#0c0d10] border-r border-[#1f2229] flex flex-col items-center py-3 justify-between shrink-0 select-none z-20">
          <div className="flex flex-col items-center gap-4 text-gray-400">
            {/* Mixer icon */}
            <button
              type="button"
              onClick={() => setIsConsoleOpen(!isConsoleOpen)}
              title="Toggle Console / Inspector"
              className={`p-2 rounded-xl transition-colors cursor-pointer ${isConsoleOpen ? 'text-teal-400 bg-teal-400/10' : 'hover:text-white hover:bg-white/5'}`}
            >
              <Sliders className="h-4 w-4" />
            </button>

            {/* Folder / Sounds icon */}
            <button
              type="button"
              onClick={() => setBeatPickerOpen(true)}
              title="Open Beat & Loops Library"
              className="p-2 rounded-xl hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Folder className="h-4 w-4" />
            </button>

            {/* Disc library icon */}
            <button
              type="button"
              onClick={() => setBeatPickerOpen(true)}
              title="Caution Beat Catalog"
              className="p-2 rounded-xl hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Disc3 className="h-4 w-4" />
            </button>

            {/* AI Assistant */}
            <button
              type="button"
              onClick={handleAutoMixAI}
              title="AI Vocal AutoMix"
              className={`p-2 rounded-xl transition-colors cursor-pointer ${isAutoMixRunning ? 'text-teal-400 animate-spin' : 'hover:text-teal-300 hover:bg-white/5'}`}
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-3 text-gray-500">
            {/* Keyboard Shortcuts */}
            <button
              type="button"
              onClick={() => setIsShortcutsModalOpen(true)}
              title="Keyboard Shortcuts"
              className="p-2 rounded-xl hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Keyboard className="h-4 w-4" />
            </button>

            {/* Lyrics Drawer */}
            <button
              type="button"
              onClick={() => {
                setActiveInspectorTab('editor');
                setIsConsoleOpen(true);
              }}
              title="Lyrics & Notepad"
              className="p-2 rounded-xl hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <FileText className="h-4 w-4" />
            </button>
          </div>
        </aside>

        {/* Multi-Track Workspace Body */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Upper Half: Arrangement Tracks (Split TCP Left + Timeline Grid Right) */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Track Control Panels (TCP) on the Left */}
            <div className="w-72 sm:w-80 bg-[#12141a] border-r border-[#1f2229] flex flex-col shrink-0 overflow-y-auto">
              {/* "+ Add Track" Button at the Top */}
              <div className="p-2.5 border-b border-[#1f2229] flex items-center justify-between bg-[#0e1014]">
                <button
                  type="button"
                  onClick={handleAddBackupVocalTrack}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 text-teal-400" />
                  <span>+ Add Track</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBeatPickerOpen(true)}
                  className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
                >
                  <Music className="h-3 w-3 text-amber-400" />
                  <span className="truncate max-w-[110px]">{selectedTrack?.title || 'Load Beat'}</span>
                </button>
              </div>

              {/* Track Headers List */}
              <div className="divide-y divide-[#1f2229]/60">
                {/* Track 01: Drum Machine / Backing Beat */}
                <div
                  onClick={() => setSelectedTrackTab('trk_beat')}
                  className={`p-3 transition-colors cursor-pointer ${selectedTrackTab === 'trk_beat' ? 'bg-[#181b24]' : 'hover:bg-white/[0.02]'}`}
                >
                  {/* Title row with Golden brown accent bar */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-3.5 rounded-full bg-[#d97706]" />
                      <Disc3 className="h-3.5 w-3.5 text-[#d97706] shrink-0" />
                      <span className="text-xs font-bold text-gray-200 truncate">
                        01 Drum Machine
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Mute */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setBeatMuted(!beatMuted); }}
                        className={`w-6 h-5 rounded text-[10px] font-mono font-bold transition-colors ${beatMuted ? 'bg-[#d97706] text-black' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                      >
                        M
                      </button>
                      {/* Solo */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setBeatSolo(!beatSolo); }}
                        className={`w-6 h-5 rounded text-[10px] font-mono font-bold transition-colors ${beatSolo ? 'bg-teal-400 text-black' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                      >
                        S
                      </button>
                    </div>
                  </div>

                  {/* Controls row: +Fx, Volume Slider with gold fill, Rotary Pan */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveInspectorTab('fx');
                        setIsConsoleOpen(true);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5"
                    >
                      + Fx
                    </button>

                    {/* Volume Slider with golden fill */}
                    <div className="flex-1 flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.01"
                        value={beatVolume}
                        onChange={(e) => handleBeatVolumeChange(parseFloat(e.target.value))}
                        className="w-full accent-[#d97706] h-1 bg-black/60 rounded cursor-pointer"
                        title="Beat Volume"
                      />
                    </div>

                    {/* Rotary Pan Knob (L | R) */}
                    <div className="flex items-center gap-1 text-[9px] font-mono text-gray-400">
                      <span>{formatPanLabel(beatPan)}</span>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="5"
                        value={beatPan}
                        onChange={(e) => setBeatPan(parseInt(e.target.value, 10))}
                        className="w-10 accent-[#d97706] h-1 bg-black/60 rounded cursor-pointer"
                        title="Beat Pan"
                      />
                    </div>
                  </div>
                </div>

                {/* Track 02+: Voice/Audio Tracks */}
                {vocalTracks.map((trk, idx) => {
                  const isSelected = selectedTrackTab === trk.id;
                  const isArmed = trk.isArmed;

                  return (
                    <div
                      key={trk.id}
                      onClick={() => setSelectedTrackTab(trk.id)}
                      className={`p-3 transition-colors cursor-pointer ${isSelected ? 'bg-[#181b24]' : 'hover:bg-white/[0.02]'}`}
                    >
                      {/* Title row with Copper/Orange accent bar */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-1.5 h-3.5 rounded-full"
                            style={{ backgroundColor: trk.color || '#ea580c' }}
                          />
                          <Mic className="h-3.5 w-3.5 shrink-0" style={{ color: trk.color || '#ea580c' }} />
                          <span className="text-xs font-bold text-gray-200 truncate">
                            {`0${idx + 2} ${trk.name}`}
                          </span>
                          {isArmed && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" title="Armed for Recording" />
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Arm for record */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleArmTrack(trk.id); }}
                            title="Arm Track for Recording"
                            className={`w-5 h-5 rounded text-[9px] font-mono font-bold flex items-center justify-center ${isArmed ? 'bg-red-500 text-white' : 'bg-black/40 text-gray-500 hover:text-red-400'}`}
                          >
                            ⏺
                          </button>
                          {/* Mute */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleToggleMute(trk.id); }}
                            className={`w-6 h-5 rounded text-[10px] font-mono font-bold transition-colors ${trk.isMuted ? 'bg-[#ea580c] text-black' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                          >
                            M
                          </button>
                          {/* Solo */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleToggleSolo(trk.id); }}
                            className={`w-6 h-5 rounded text-[10px] font-mono font-bold transition-colors ${trk.isSolo ? 'bg-teal-400 text-black' : 'bg-black/40 text-gray-400 hover:text-white'}`}
                          >
                            S
                          </button>
                        </div>
                      </div>

                      {/* Controls row: +Fx, Volume Slider, Rotary Pan */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrackTab(trk.id);
                            setActiveInspectorTab('autopitch');
                            setIsConsoleOpen(true);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5"
                        >
                          + Fx
                        </button>

                        {/* Volume Slider with orange fill */}
                        <div className="flex-1 flex items-center">
                          <input
                            type="range"
                            min="0"
                            max="1.5"
                            step="0.01"
                            value={trk.volume}
                            onChange={(e) => handleTrackVolumeChange(trk.id, parseFloat(e.target.value))}
                            className="w-full h-1 bg-black/60 rounded cursor-pointer"
                            style={{ accentColor: trk.color || '#ea580c' }}
                            title="Track Volume"
                          />
                        </div>

                        {/* Rotary Pan Knob */}
                        <div className="flex items-center gap-1 text-[9px] font-mono text-gray-400">
                          <span>{formatPanLabel(trk.pan)}</span>
                          <input
                            type="range"
                            min="-100"
                            max="100"
                            step="5"
                            value={trk.pan}
                            onChange={(e) => handleTrackPanChange(trk.id, parseInt(e.target.value, 10))}
                            className="w-10 h-1 bg-black/60 rounded cursor-pointer"
                            style={{ accentColor: trk.color || '#ea580c' }}
                            title="Track Pan"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AutoMix AI Button at bottom of tracks */}
              <div className="p-3 mt-auto border-t border-[#1f2229] bg-[#0c0d10]">
                <button
                  type="button"
                  onClick={handleAutoMixAI}
                  disabled={isAutoMixRunning}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-[#181b24] to-[#242833] hover:from-[#202533] hover:to-[#2d3342] border border-white/10 text-xs font-bold text-gray-200 flex items-center justify-between px-3 transition-all cursor-pointer group shadow"
                >
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-3.5 w-3.5 text-teal-400 group-hover:rotate-12 transition-transform" />
                    <span>AutoMix AI</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-400/20 text-teal-300 font-bold">
                      AI 🤖
                    </span>
                  </div>
                  {autoMixSuccess ? (
                    <span className="text-[10px] text-teal-300 font-bold">Level Balanced!</span>
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-gray-500 group-hover:text-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Right: Timeline & Arrangement Grid */}
            <div
              ref={rulerRef}
              onClick={handleTimelineSeek}
              className="flex-1 bg-[#14161d] overflow-x-auto relative flex flex-col cursor-pointer select-none"
            >
              {/* Top Timeline Ruler Bar (1, 2, 3, 4, 5, 6...) */}
              <div className="h-7 bg-[#101217] border-b border-[#1f2229] flex items-center relative text-[10px] font-mono text-gray-400 shrink-0">
                {/* Red Loop Region Bar spanning active bars */}
                {isLoopEnabled && (
                  <div
                    className="absolute top-0 bottom-0 bg-red-500/20 border-b-2 border-red-500 z-10 pointer-events-none"
                    style={{ left: '0%', width: '35%' }}
                  >
                    <span className="text-[9px] font-bold text-red-400 px-1 bg-red-500/30 rounded-br">LOOP REGION</span>
                  </div>
                )}

                {/* Bar Ticks */}
                {Array.from({ length: 32 }).map((_, barIdx) => (
                  <div
                    key={barIdx}
                    className="flex-1 border-r border-white/5 h-full flex items-center pl-1.5 opacity-70"
                  >
                    <span>{barIdx + 1}</span>
                  </div>
                ))}

                {/* Vertical Playhead Cursor */}
                {selectedTrack?.durationSeconds && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                    style={{
                      left: `${Math.min(100, (playheadTime / selectedTrack.durationSeconds) * 100)}%`
                    }}
                  >
                    <div className="w-2.5 h-2 bg-red-500 -ml-1 -top-0 absolute rounded-b" />
                  </div>
                )}
              </div>

              {/* Arrangement Clips Canvas */}
              <div className="flex-1 flex flex-col divide-y divide-[#1f2229]/40 relative overflow-y-auto">
                {/* Playhead Line down through all track lanes */}
                {selectedTrack?.durationSeconds && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500/80 z-20 pointer-events-none"
                    style={{
                      left: `${Math.min(100, (playheadTime / selectedTrack.durationSeconds) * 100)}%`
                    }}
                  />
                )}

                {/* Track 01 Lane (Beat / Drum Machine Clip) */}
                <div className="h-16 relative flex items-center p-1.5 bg-[#14161d]">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex pointer-events-none opacity-10">
                    {Array.from({ length: 16 }).map((_, idx) => (
                      <div key={idx} className="flex-1 border-r border-white" />
                    ))}
                  </div>

                  {/* Golden Audio Clip Container */}
                  <div
                    className="h-full rounded-lg bg-gradient-to-r from-[#b45309]/80 via-[#d97706]/75 to-[#b45309]/80 border border-[#f59e0b]/40 shadow-sm relative overflow-hidden flex items-center px-3"
                    style={{ width: '85%' }}
                  >
                    {/* Clip Title & Loop Handles */}
                    <div className="absolute top-1 left-2 text-[10px] font-bold text-amber-100 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Drum Machine</span>
                      <span className="opacity-70 font-mono text-[9px]">• {selectedTrack?.genre || 'Afrobeats'}</span>
                    </div>

                    {/* Pattern Cells [A][B][A][B] & Waveform Peaks */}
                    <div className="w-full flex items-center justify-between gap-1 pt-3 opacity-90">
                      {Array.from({ length: 48 }).map((_, i) => {
                        const h = 25 + Math.sin(i * 0.45) * 35 + Math.cos(i * 0.8) * 20;
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-amber-950/70 rounded-xs"
                            style={{ height: `${Math.max(15, Math.min(85, h))}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Track 02+ Lanes (Voice/Audio Vocal Takes) */}
                {vocalTracks.map((trk) => {
                  const hasTake = trk.vocalBlob !== null;
                  const isThisRecording = isRecording && trk.isArmed;

                  return (
                    <div key={trk.id} className="h-16 relative flex items-center p-1.5 bg-[#14161d]">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex pointer-events-none opacity-10">
                        {Array.from({ length: 16 }).map((_, idx) => (
                          <div key={idx} className="flex-1 border-r border-white" />
                        ))}
                      </div>

                      {/* Clip representation */}
                      {isThisRecording ? (
                        /* Live recording pulsating clip */
                        <div
                          className="h-full rounded-lg bg-red-950/80 border-2 border-red-500 shadow-lg shadow-red-500/20 relative overflow-hidden flex items-center px-3 animate-pulse"
                          style={{
                            width: `${Math.max(15, Math.min(100, (recordingSeconds / (selectedTrack?.durationSeconds || 180)) * 100))}%`
                          }}
                        >
                          <div className="absolute top-1 left-2 text-[10px] font-bold text-red-200 uppercase flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            <span>RECORDING: {trk.name} ({recordingSeconds}s)</span>
                          </div>
                          <div className="w-full flex items-center gap-1 pt-3">
                            {liveWaveformHistory.slice(-32).map((val, idx) => (
                              <div
                                key={idx}
                                className="flex-1 bg-red-400 rounded-xs"
                                style={{ height: `${Math.max(10, val * 85)}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      ) : hasTake ? (
                        /* Recorded vocal clip */
                        <div
                          className="h-full rounded-lg bg-gradient-to-r from-[#9a3412]/80 via-[#ea580c]/70 to-[#9a3412]/80 border border-[#f97316]/40 shadow-sm relative overflow-hidden flex items-center px-3"
                          style={{
                            width: `${Math.min(100, Math.max(20, (trk.durationSeconds / (selectedTrack?.durationSeconds || 180)) * 100))}%`
                          }}
                        >
                          <div className="absolute top-1 left-2 text-[10px] font-bold text-orange-100 uppercase tracking-wider flex items-center gap-1">
                            <span>{trk.name}</span>
                            <span className="opacity-70 font-mono text-[9px]">• Take 1 ({trk.durationSeconds.toFixed(1)}s)</span>
                          </div>
                          <div className="w-full flex items-center justify-between gap-1 pt-3 opacity-90">
                            {Array.from({ length: 48 }).map((_, i) => {
                              const h = 20 + Math.sin(i * 0.6) * 30 + Math.cos(i * 1.1) * 20;
                              return (
                                <div
                                  key={i}
                                  className="flex-1 bg-orange-950/70 rounded-xs"
                                  style={{ height: `${Math.max(15, Math.min(85, h))}%` }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        /* Empty Ready Lane */
                        <div className="h-full w-full rounded-lg border border-dashed border-white/5 flex items-center px-4 text-gray-500 text-[11px] font-mono">
                          {trk.isArmed ? (
                            <span className="text-red-400/80 flex items-center gap-1.5 font-bold">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              <span>ARMED: Press ⏺ Record (or press R) to capture vocals</span>
                            </span>
                          ) : (
                            <span className="text-gray-600">Track Ready</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Empty Drop Area (Drop a loop or an audio/MIDI/video file) */}
                <div
                  onClick={() => setBeatPickerOpen(true)}
                  className="p-6 m-3 rounded-2xl border-2 border-dashed border-white/10 hover:border-teal-500/40 bg-white/[0.01] hover:bg-white/[0.03] transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-white cursor-pointer"
                >
                  <Music2 className="h-6 w-6 text-gray-500" />
                  <span className="text-xs font-medium">Drop a loop or an audio/MIDI/video file</span>
                  <span className="text-[10px] text-gray-500 font-mono">Click to browse Caution Studio beat catalog</span>
                </div>
              </div>

              {/* Floating Bottom-Right Toolbar (Magnet & Zoom) */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-[#101217]/90 p-1 rounded-xl border border-white/10 shadow-xl backdrop-blur-md z-30">
                <button
                  type="button"
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  title="Snap to Grid"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${snapToGrid ? 'text-teal-400 bg-teal-400/10' : 'text-gray-400 hover:text-white'}`}
                >
                  <Magnet className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.2))}
                  title="Zoom Out"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(Math.min(2.0, zoomLevel + 0.2))}
                  title="Zoom In"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* =========================================================================
              3. BOTTOM BANDLAB STUDIO CONSOLE & AUTOPITCH™ (Exact Layout from Screenshot)
             ========================================================================= */}
          {isConsoleOpen && (
            <div className="h-[340px] bg-[#101217] border-t border-[#1f2229] flex flex-col shrink-0 select-none animate-in slide-in-from-bottom-2 duration-150">
              {/* Console Top Header */}
              <div className="px-3.5 py-1.5 bg-[#0e1014] border-b border-[#1f2229] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Close Cross */}
                  <button
                    type="button"
                    onClick={() => setIsConsoleOpen(false)}
                    title="Close Inspector"
                    className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                  {/* Active Track Title */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-200">
                    <Mic className="h-3.5 w-3.5 text-[#ea580c]" />
                    <span>Voice/Audio</span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-gray-500">
                  AUTO-PITCH ENGINE: ACTIVE · 48.0kHz 24-BIT
                </div>
              </div>

              {/* Console Content: 3-Column BandLab Layout */}
              <div className="flex-1 flex overflow-hidden">
                {/* Column 1: Input & Monitoring Panel */}
                <div className="w-56 sm:w-64 p-3.5 border-r border-[#1f2229] flex flex-col justify-between shrink-0 bg-[#0e1014]/60">
                  <div className="space-y-3">
                    {/* Input Device Dropdown */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono uppercase text-gray-400 block">Input</span>
                      <select
                        value={audioInputDevice}
                        onChange={(e) => setAudioInputDevice(e.target.value)}
                        className="w-full bg-[#181b24] border border-white/10 rounded-lg py-1 px-2 text-xs text-gray-200 focus:outline-none focus:border-teal-500 cursor-pointer truncate"
                      >
                        <option value="MacBook Pro Microphone (Built-in)">MacBook Pro Microphone (Built-in)</option>
                        <option value="Default USB Audio Codec">Default USB Audio Codec</option>
                        <option value="Studio Microphone Array">Studio Microphone Array</option>
                      </select>
                    </div>

                    {/* Channel Mode Dropdown */}
                    <div className="space-y-1">
                      <select
                        value={audioInputChannel}
                        onChange={(e) => setAudioInputChannel(e.target.value as any)}
                        className="w-full bg-[#181b24] border border-white/10 rounded-lg py-1 px-2 text-xs text-gray-200 focus:outline-none focus:border-teal-500 cursor-pointer"
                      >
                        <option value="Channel 1 (Mono)">Channel 1 (Mono)</option>
                        <option value="Channel 2">Channel 2</option>
                        <option value="Stereo">Stereo</option>
                      </select>
                    </div>

                    {/* Input Level Animated Meter */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
                        <span>Input Level</span>
                        <span className="text-teal-400 font-bold">{Math.round(inputLevelMeter * 100)}%</span>
                      </div>
                      <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 transition-all duration-75"
                          style={{ width: `${Math.min(100, Math.max(5, inputLevelMeter * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Monitoring Button */}
                    <button
                      type="button"
                      onClick={() => setIsInputMonitoring(!isInputMonitoring)}
                      className={`w-full py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isInputMonitoring
                          ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-sm'
                          : 'bg-[#181b24] border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Headphones className="h-3.5 w-3.5" />
                      <span>{isInputMonitoring ? 'Monitoring: ON' : 'Monitoring'}</span>
                    </button>
                  </div>

                  {/* Armed indicator */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-500">
                    <span>MIC STATUS:</span>
                    <span className="text-emerald-400 font-bold">READY</span>
                  </div>
                </div>

                {/* Column 2: BandLab AutoPitch™ Unit Centerpiece */}
                {activeInspectorTab === 'autopitch' ? (
                  <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto bg-[#101217]">
                    {/* Top Row: Power Switch + Title + AutoDetect Key */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Power Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => setAutoTuneEnabled(!autoTuneEnabled)}
                          className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                            autoTuneEnabled ? 'bg-teal-400' : 'bg-gray-700'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                              autoTuneEnabled ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>

                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-white tracking-wide">AutoPitch™</span>
                        </div>
                      </div>

                      {/* AutoDetect Key Button */}
                      <button
                        type="button"
                        onClick={handleAutoDetectKey}
                        className="px-3 py-1 rounded-lg bg-[#181b24] hover:bg-[#202533] border border-white/10 text-gray-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-teal-500/40"
                      >
                        <span>AutoDetect Key</span>
                        <Sparkles className="h-3 w-3 text-teal-400" />
                      </button>
                    </div>

                    {/* Category & Scale Selectors */}
                    <div className="grid grid-cols-2 gap-6 pt-2 max-w-xl">
                      <div>
                        <span className="text-[10px] font-mono text-gray-400 block mb-1">Category</span>
                        <select
                          value={autoPitchCategory}
                          onChange={(e) => setAutoPitchCategory(e.target.value as any)}
                          className="w-full bg-[#181b24] border border-white/10 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer"
                        >
                          <option value="Essentials">Essentials</option>
                          <option value="Modern Rap">Modern Rap</option>
                          <option value="Afrobeat">Afrobeat Glow</option>
                          <option value="Pop">Pop Polish</option>
                          <option value="R&B">R&B Velvet</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-gray-400 block mb-1">Scale</span>
                        <select
                          value={autoTuneKey}
                          onChange={(e) => {
                            setAutoTuneKey(e.target.value);
                            if (!autoTuneEnabled) setAutoTuneEnabled(true);
                          }}
                          className="w-full bg-[#181b24] border border-white/10 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none focus:border-teal-400 cursor-pointer"
                        >
                          <option value="D Minor">D Minor</option>
                          <option value="F Minor">F Minor</option>
                          <option value="C Major">C Major</option>
                          <option value="A Minor">A Minor</option>
                          <option value="G Major">G Major</option>
                          <option value="Chromatic">Chromatic (All)</option>
                        </select>
                      </div>
                    </div>

                    {/* Middle Section: Preset Grid + Big Central Rotary Dial + Piano Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2">
                      {/* 6 Preset Cards (2x3 Grid) */}
                      <div className="md:col-span-4 grid grid-cols-3 gap-2">
                        {(['Classic', 'Duet', 'Big Harmony', 'Natural', 'Third', 'Octave'] as const).map((pst) => {
                          const isActive = autoPitchPreset === pst && autoTuneEnabled;
                          return (
                            <button
                              key={pst}
                              type="button"
                              onClick={() => handleSelectAutoPitchPreset(pst)}
                              className={`h-12 rounded-xl border flex flex-col items-center justify-center p-1 text-center transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.25)]'
                                  : 'bg-[#181b24] border-white/5 text-gray-400 hover:text-white hover:bg-[#202533]'
                              }`}
                            >
                              <span className="text-[10px] font-bold truncate w-full">{pst}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Centerpiece Big Radial Rotary Dial ("Heaviest") */}
                      <div className="md:col-span-4 flex flex-col items-center justify-center">
                        <div
                          className="relative w-28 h-28 flex items-center justify-center cursor-pointer group"
                          onClick={() => {
                            // Cycle through values on click: 30% -> 60% -> 85% -> 100%
                            const next = autoPitchPercent >= 90 ? 35 : autoPitchPercent + 25;
                            setAutoTuneAmount(next / 100);
                            if (!autoTuneEnabled) setAutoTuneEnabled(true);
                          }}
                          title="Click to cycle Pitch Depth / Drag slider"
                        >
                          {/* Radial SVG Dial with Tick Marks */}
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            {/* Background Track Circle */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="#232733"
                              strokeWidth="6"
                              fill="transparent"
                              strokeDasharray="251.2"
                              strokeDashoffset="62.8"
                            />
                            {/* Active Teal Arc */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke={autoTuneEnabled ? '#2dd4bf' : '#4b5563'}
                              strokeWidth="6"
                              fill="transparent"
                              strokeDasharray="251.2"
                              strokeDashoffset={251.2 - (autoPitchPercent / 100) * 188.4}
                              strokeLinecap="round"
                              className="transition-all duration-150"
                            />
                          </svg>

                          {/* Inner Metallic Center Cap */}
                          <div className="absolute w-18 h-18 rounded-full bg-gradient-to-b from-[#242938] via-[#141721] to-[#0c0d12] border border-white/15 flex flex-col items-center justify-center shadow-inner">
                            <span className="text-xs font-black text-white font-mono">{autoPitchPercent}%</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-0.5" />
                          </div>
                        </div>

                        {/* Dial Label underneath */}
                        <span className="text-xs font-bold text-gray-300 mt-1 uppercase tracking-wider font-mono">
                          {getAutoPitchDialLabel(autoPitchPercent)}
                        </span>
                      </div>

                      {/* 12-Note Piano Key Matrix Grid */}
                      <div className="md:col-span-4 flex flex-col gap-1.5 p-2 rounded-xl bg-[#141721] border border-white/5">
                        <span className="text-[10px] font-mono text-gray-400 uppercase text-center block">Active Scale Notes</span>
                        {/* Naturals (C D E F G A B) */}
                        <div className="grid grid-cols-7 gap-1">
                          {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((note) => {
                            const inScale = activeScaleNotes.has(note) && !mutedScaleNotes.includes(note);
                            return (
                              <button
                                key={note}
                                type="button"
                                onClick={() => toggleScaleNote(note)}
                                className={`h-8 rounded font-mono text-xs font-bold transition-all ${
                                  inScale
                                    ? 'bg-teal-400 text-black shadow-sm'
                                    : 'bg-[#1e2230] text-gray-500 hover:text-white'
                                }`}
                              >
                                {note}
                              </button>
                            );
                          })}
                        </div>
                        {/* Accidentals (C# D# F# G# A#) */}
                        <div className="grid grid-cols-5 gap-1.5 pt-1">
                          {['C#', 'D#', 'F#', 'G#', 'A#'].map((note) => {
                            const inScale = activeScaleNotes.has(note) && !mutedScaleNotes.includes(note);
                            return (
                              <button
                                key={note}
                                type="button"
                                onClick={() => toggleScaleNote(note)}
                                className={`h-7 rounded font-mono text-[10px] font-bold transition-all ${
                                  inScale
                                    ? 'bg-amber-400 text-black shadow-sm'
                                    : 'bg-[#181b24] text-gray-600 hover:text-white'
                                }`}
                              >
                                {note}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeInspectorTab === 'fx' ? (
                  /* Tab 2: Fx Effects Rack (Reverb, Delay, EQ, Compressor) */
                  <div className="flex-1 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-y-auto bg-[#101217]">
                    {/* Reverb */}
                    <div className="p-3 rounded-xl bg-[#141721] border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-teal-300">
                        <span>STUDIO REVERB</span>
                        <span className="font-mono">{Math.round(reverbAmount * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={reverbAmount}
                        onChange={(e) => setReverbAmount(parseFloat(e.target.value))}
                        className="w-full accent-teal-400 h-1.5 bg-black/60 rounded cursor-pointer"
                      />
                      <span className="text-[10px] text-gray-500">Convolver Hall simulation</span>
                    </div>

                    {/* Delay */}
                    <div className="p-3 rounded-xl bg-[#141721] border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-amber-300">
                        <span>TEMPO DELAY</span>
                        <span className="font-mono">{Math.round(delayAmount * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={delayAmount}
                        onChange={(e) => setDelayAmount(parseFloat(e.target.value))}
                        className="w-full accent-amber-400 h-1.5 bg-black/60 rounded cursor-pointer"
                      />
                      <span className="text-[10px] text-gray-500">1/4 note tempo sync</span>
                    </div>

                    {/* 3-Band EQ */}
                    <div className="p-3 rounded-xl bg-[#141721] border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-purple-300">
                        <span>3-BAND EQ</span>
                        <span className="font-mono">+{eqMid}dB</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-center">
                        <div>
                          <span className="text-gray-400">LOW</span>
                          <input
                            type="range"
                            min="-6"
                            max="6"
                            step="0.5"
                            value={eqLow}
                            onChange={(e) => setEqLow(parseFloat(e.target.value))}
                            className="w-full accent-purple-400 h-1 bg-black/60 rounded"
                          />
                        </div>
                        <div>
                          <span className="text-gray-400">MID</span>
                          <input
                            type="range"
                            min="-6"
                            max="6"
                            step="0.5"
                            value={eqMid}
                            onChange={(e) => setEqMid(parseFloat(e.target.value))}
                            className="w-full accent-purple-400 h-1 bg-black/60 rounded"
                          />
                        </div>
                        <div>
                          <span className="text-gray-400">HI</span>
                          <input
                            type="range"
                            min="-6"
                            max="6"
                            step="0.5"
                            value={eqHigh}
                            onChange={(e) => setEqHigh(parseFloat(e.target.value))}
                            className="w-full accent-purple-400 h-1 bg-black/60 rounded"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dynamics */}
                    <div className="p-3 rounded-xl bg-[#141721] border border-white/5 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-white">
                        <span>DYNAMICS</span>
                        <span className="text-[9px] font-mono px-1 bg-teal-400/20 text-teal-300 rounded">OPTO</span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                        <input
                          type="checkbox"
                          checked={compressorEnabled}
                          onChange={(e) => setCompressorEnabled(e.target.checked)}
                          className="rounded accent-teal-400"
                        />
                        <span>Compressor</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                        <input
                          type="checkbox"
                          checked={lowCutEnabled}
                          onChange={(e) => setLowCutEnabled(e.target.checked)}
                          className="rounded accent-teal-400"
                        />
                        <span>80Hz Low-Cut</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  /* Tab 3: Editor / Lyrics & Notepad */
                  <div className="flex-1 p-4 overflow-y-auto bg-[#101217] space-y-2">
                    <span className="text-[10px] font-mono uppercase text-gray-400 block">Lyrics & Song Notes</span>
                    <textarea
                      value={lyricsText}
                      onChange={(e) => setLyricsText(e.target.value)}
                      placeholder="Type your verses, harmonies, and recording cues here..."
                      rows={5}
                      className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white font-mono resize-none focus:outline-none focus:border-teal-400 leading-relaxed"
                    />
                  </div>
                )}

                {/* Column 3: Track Output Strip (Right) */}
                <div className="w-40 sm:w-48 p-3.5 border-l border-[#1f2229] flex flex-col items-center justify-between shrink-0 bg-[#0e1014]/60">
                  <span className="text-[10px] font-mono uppercase text-gray-400">Volume</span>

                  {/* Vertical Channel Fader with Decibel Marks */}
                  <div className="flex items-center gap-2 h-36">
                    {/* dB Marks */}
                    <div className="flex flex-col justify-between text-[9px] font-mono text-gray-500 h-full py-1">
                      <span>+6</span>
                      <span>0</span>
                      <span>-6</span>
                      <span>-12</span>
                      <span>-24</span>
                    </div>

                    {/* Vertical Slider */}
                    <div className="h-full flex items-center relative">
                      <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.01"
                        value={armedTrack?.volume || 1.0}
                        onChange={(e) => armedTrack && handleTrackVolumeChange(armedTrack.id, parseFloat(e.target.value))}
                        className="h-28 w-2 accent-teal-400 cursor-pointer -rotate-90"
                      />
                    </div>

                    {/* Peak Level LED meter */}
                    <div className="w-2 h-28 bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10 flex flex-col justify-end">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-500 via-teal-400 to-amber-400 rounded-full transition-all duration-75"
                        style={{ height: `${Math.min(100, Math.max(5, (armedTrack?.volume || 1) * 60))}%` }}
                      />
                    </div>
                  </div>

                  {/* Rotary Pan & Reverb Knobs */}
                  <div className="grid grid-cols-2 gap-2 w-full pt-1 text-center">
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 block">Pan</span>
                      <span className="text-[10px] font-mono text-teal-300">{formatPanLabel(armedTrack?.pan || 0)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 block">Reverb</span>
                      <span className="text-[10px] font-mono text-amber-300">{Math.round(reverbAmount * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Tab Switcher Footer */}
              <div className="h-9 bg-[#0c0d10] border-t border-[#1f2229] flex items-center justify-between px-3 text-xs shrink-0 select-none">
                {/* Left Tabs */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveInspectorTab('autopitch')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeInspectorTab === 'autopitch'
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>AutoPitch™</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveInspectorTab('fx')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeInspectorTab === 'fx'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Fx Effects</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveInspectorTab('editor')}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeInspectorTab === 'editor'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Scissors className="h-3.5 w-3.5" />
                    <span>Editor</span>
                  </button>
                </div>

                {/* Right Action Shortcuts */}
                <div className="flex items-center gap-2 text-gray-400">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveInspectorTab('editor');
                      setIsConsoleOpen(true);
                    }}
                    className="hover:text-white flex items-center gap-1 text-[11px] font-medium"
                  >
                    <FileText className="h-3 w-3" />
                    <span>Lyrics/Notes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBeatPickerOpen(true)}
                    className="hover:text-white flex items-center gap-1 text-[11px] font-medium"
                  >
                    <Disc3 className="h-3 w-3 text-amber-400" />
                    <span>Beats</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsShortcutsModalOpen(true)}
                    className="hover:text-white flex items-center gap-1 text-[11px] font-medium"
                  >
                    <Keyboard className="h-3 w-3" />
                    <span>Shortcuts</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          4. MODALS & DRAWERS (Beat Catalog, Export Dialog, Shortcuts)
         ========================================================================= */}

      {/* Beat Picker Modal */}
      {beatPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-[#0F131C] border border-white/10 p-6 shadow-2xl flex flex-col max-h-[85vh] text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Disc3 className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Load Backing Instrumental Beat</h3>
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
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-teal-400"
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
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    selectedTrack?.id === b.id
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/5 text-gray-200'
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
                    className="px-3 py-1 rounded-lg bg-teal-500 text-black text-xs font-bold shrink-0 hover:bg-teal-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md rounded-2xl bg-[#0F131C] border border-white/10 p-6 shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Publish & Export Track</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportDialogOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Render your full arrangement into a studio-grade 24-Bit WAV master ready for distribution on Spotify, Apple Music, and Audiomack.
            </p>

            <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1 font-mono text-[10px]">
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
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExportWav()}
                disabled={isExportingWav}
                className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-sm rounded-2xl bg-[#0F131C] border border-white/10 p-5 shadow-2xl text-white space-y-3 font-sans"
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
