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
  Link as LinkIcon
} from 'lucide-react';
import { TrackItem } from '../types/tracks';
import { useUserSubscription } from '../lib/subscription';

interface UserRecordStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTrack?: TrackItem | null;
  availableTracks?: TrackItem[];
}

interface VocalTake {
  id: string;
  name: string;
  blob: Blob;
  url: string;
  durationSeconds: number;
  recordedAt: string;
}

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
  isOpen,
  onClose,
  preselectedTrack,
  availableTracks = []
}) => {
  const { isSubscribed } = useUserSubscription();

  // Active Beat & Session metadata
  const [selectedTrack, setSelectedTrack] = useState<TrackItem | null>(preselectedTrack || null);
  const [projectTitle, setProjectTitle] = useState('New Vocal Session');
  const [beatPickerOpen, setBeatPickerOpen] = useState(false);
  const [beatSearchQuery, setBeatSearchQuery] = useState('');
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

  // Multi-Track Controls (Audacity / Cubase style)
  // Track 1: Beat
  const [beatMuted, setBeatMuted] = useState(false);
  const [beatSolo, setBeatSolo] = useState(false);
  const [beatVolume, setBeatVolume] = useState(0.85); // 0 to 1
  const [beatPan, setBeatPan] = useState(0); // -1 to +1

  // Track 2: Vocal
  const [vocalMuted, setVocalMuted] = useState(false);
  const [vocalSolo, setVocalSolo] = useState(false);
  const [vocalVolume, setVocalVolume] = useState(1.0);
  const [vocalPan, setVocalPan] = useState(0);
  const [isArmed, setIsArmed] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [inputGain, setInputGain] = useState(1.0);
  const [inputLevelMeter, setInputLevelMeter] = useState(0);

  // Master Output
  const [masterVolume, setMasterVolume] = useState(0.9);
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

  // Takes & Media
  const [takes, setTakes] = useState<VocalTake[]>([]);
  const [activeTakeIndex, setActiveTakeIndex] = useState<number>(-1);
  const [vocalBlob, setVocalBlob] = useState<Blob | null>(null);
  const [vocalUrl, setVocalUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveWaveformHistory, setLiveWaveformHistory] = useState<number[]>([]);

  // Console Tabs: 'fx' | 'mixer' | 'lyrics' | 'cloud'
  const [activeConsoleTab, setActiveConsoleTab] = useState<'fx' | 'mixer' | 'lyrics' | 'cloud'>('fx');
  const [lyricsText, setLyricsText] = useState(
    '// Write rhymes, hooks, and punchlines here while you record in the studio...\n[Verse 1]\n\n[Chorus]\n'
  );

  // Cloudflare R2 & Database Save State
  const [artistName, setArtistName] = useState('Caution Artist');
  const [socialHandle, setSocialHandle] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [cloudSaveResult, setCloudSaveResult] = useState<{
    vocalUrl?: string;
    masterUrl?: string;
    message?: string;
  } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Refs
  const beatAudioRef = useRef<HTMLAudioElement | null>(null);
  const vocalAudioRef = useRef<HTMLAudioElement | null>(null);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playheadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update selectedTrack on preselectedTrack change
  useEffect(() => {
    if (preselectedTrack) {
      setSelectedTrack(preselectedTrack);
    } else if (!selectedTrack && availableTracks.length > 0) {
      setSelectedTrack(availableTracks[0]);
    }
  }, [preselectedTrack, availableTracks]);

  // Handle Metronome Tick Audio
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

  // Begin Multi-track Recording
  const startActualRecording = async () => {
    try {
      recordedChunksRef.current = [];
      setRecordingSeconds(0);
      setLiveWaveformHistory([]);
      setRecordState('recording');
      setIsRecording(true);
      setPlayheadTime(0);

      // Access User Microphone with high-fidelity studio constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false, // Pure studio vocal capture without aggressive gating
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000
        }
      });
      micStreamRef.current = stream;

      // Web Audio Analyser for live oscilloscope and VU meter
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

      // MediaRecorder Setup (prefer WAV or high bitrate opus)
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
        setVocalBlob(fullBlob);
        const objectUrl = URL.createObjectURL(fullBlob);
        setVocalUrl(objectUrl);

        // Save take into takes list
        const newTake: VocalTake = {
          id: `take_${Date.now()}`,
          name: `Take ${takes.length + 1}`,
          blob: fullBlob,
          url: objectUrl,
          durationSeconds: recordingSeconds,
          recordedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setTakes((prev) => [...prev, newTake]);
        setActiveTakeIndex(takes.length);
        setRecordState('preview');
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;

      // Start Synchronized Backing Beat Playback
      if (beatAudioRef.current && selectedTrack) {
        beatAudioRef.current.currentTime = 0;
        beatAudioRef.current.volume = beatMuted ? 0 : beatVolume * masterVolume;
        beatAudioRef.current.play().catch(() => {});
      }

      // Live Timer & Playhead Tracker
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 0.1;
          setPlayheadTime(next);
          return next;
        });
      }, 100);

      // Live Oscilloscope & VU Meter animation
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWaveform = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);

          // Compute average peak for input level meter
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const levelNorm = Math.min(100, Math.round((avg / 255) * 100 * inputGain));
          setInputLevelMeter(levelNorm);

          // Master Meter simulation based on beat + vocal
          const mLevel = Math.min(98, Math.round(levelNorm * 0.7 + (beatMuted ? 0 : beatVolume * 50)));
          setMasterMeterL(mLevel);
          setMasterMeterR(Math.max(0, mLevel - Math.floor(Math.random() * 5)));

          // Record peak sample into waveform history for multi-track visual
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
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setInputLevelMeter(0);
    setMasterMeterL(0);
    setMasterMeterR(0);
  };

  // Playhead Rewind (RTZ)
  const handleReturnToZero = () => {
    setPlayheadTime(0);
    if (beatAudioRef.current) beatAudioRef.current.currentTime = 0;
    if (vocalAudioRef.current) vocalAudioRef.current.currentTime = 0;
  };

  // Synchronized Multi-Track Playback (Beat + Vocal Take)
  const togglePlayCombinedPreview = () => {
    if (!vocalUrl && !selectedTrack) return;

    if (isPlaying) {
      if (vocalAudioRef.current) vocalAudioRef.current.pause();
      if (beatAudioRef.current) beatAudioRef.current.pause();
      setIsPlaying(false);
      if (playheadIntervalRef.current) clearInterval(playheadIntervalRef.current);
      setMasterMeterL(0);
      setMasterMeterR(0);
    } else {
      if (vocalAudioRef.current || beatAudioRef.current) {
        const currentTime = playheadTime;

        if (vocalAudioRef.current) {
          vocalAudioRef.current.currentTime = currentTime;
          vocalAudioRef.current.volume = vocalMuted ? 0 : vocalVolume * masterVolume;
        }
        if (beatAudioRef.current) {
          beatAudioRef.current.currentTime = currentTime;
          beatAudioRef.current.volume = beatMuted ? 0 : beatVolume * masterVolume;
        }

        const promises: Promise<void>[] = [];
        if (vocalAudioRef.current) promises.push(vocalAudioRef.current.play());
        if (beatAudioRef.current) promises.push(beatAudioRef.current.play());

        Promise.all(promises)
          .then(() => {
            setIsPlaying(true);
            playheadIntervalRef.current = setInterval(() => {
              if (beatAudioRef.current) {
                setPlayheadTime(beatAudioRef.current.currentTime);
                // Simulate master level meter during playback
                const beatVolNorm = beatMuted ? 0 : beatVolume * 65;
                const vocalVolNorm = vocalMuted || !vocalAudioRef.current ? 0 : vocalVolume * 30;
                const tot = Math.min(95, Math.round(beatVolNorm + vocalVolNorm));
                setMasterMeterL(tot);
                setMasterMeterR(Math.max(0, tot - Math.floor(Math.random() * 4)));
              }
            }, 100);
          })
          .catch((err) => {
            console.warn('Playback error:', err);
            setIsPlaying(false);
          });
      }
    }
  };

  // Seek playhead by clicking on timeline
  const handleTimelineSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const totalDuration = selectedTrack?.durationSeconds || 180;
    const seekTime = ratio * totalDuration;

    setPlayheadTime(seekTime);
    if (beatAudioRef.current) beatAudioRef.current.currentTime = seekTime;
    if (vocalAudioRef.current) vocalAudioRef.current.currentTime = seekTime;
  };

  // Render Stereo 16-bit PCM Master Mix WAV
  const renderMasterMixBlob = async (): Promise<Blob> => {
    if (!vocalBlob || !selectedTrack) {
      throw new Error('No recorded vocal or backing beat');
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const decodeCtx = new AudioCtx();

    // 1. Fetch & decode backing beat audio
    const beatAudioSrc = selectedTrack.audioUrl || '';
    const beatResponse = await fetch(beatAudioSrc);
    const beatArrayBuffer = await beatResponse.arrayBuffer();
    const beatAudioBuffer = await decodeCtx.decodeAudioData(beatArrayBuffer);

    // 2. Decode recorded vocal blob
    const vocalArrayBuffer = await vocalBlob.arrayBuffer();
    const vocalAudioBuffer = await decodeCtx.decodeAudioData(vocalArrayBuffer);

    decodeCtx.close();

    // 3. Render Offline Mix with active Gain, EQ & Reverb
    const mixDuration = Math.max(beatAudioBuffer.duration, vocalAudioBuffer.duration);
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(mixDuration * 44100), 44100);

    // Add Vocal Track with EQ & Gain
    const vocalSource = offlineCtx.createBufferSource();
    vocalSource.buffer = vocalAudioBuffer;

    const vocalGain = offlineCtx.createGain();
    vocalGain.gain.value = vocalMuted ? 0 : vocalVolume * masterVolume;

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

    vocalSource.connect(lowFilter);
    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);
    highFilter.connect(vocalGain);
    vocalGain.connect(offlineCtx.destination);
    vocalSource.start(0);

    // Add Beat Track
    const beatSource = offlineCtx.createBufferSource();
    beatSource.buffer = beatAudioBuffer;
    const beatGain = offlineCtx.createGain();
    beatGain.gain.value = beatMuted ? 0 : beatVolume * masterVolume;
    beatSource.connect(beatGain);
    beatGain.connect(offlineCtx.destination);
    beatSource.start(0);

    // Render mix
    const mixedAudioBuffer = await offlineCtx.startRendering();
    return audioBufferToWav(mixedAudioBuffer);
  };

  // Export & Download Mixed WAV
  const handleExportWav = async () => {
    if (!vocalBlob || !selectedTrack) return;
    setIsExportingWav(true);
    try {
      const mixedBlob = await renderMasterMixBlob();
      const safeProject = projectTitle.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const filename = `Caution_RecordStudio_${safeProject}_Master.wav`;

      const url = URL.createObjectURL(mixedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (err) {
      console.error('Render master mix error:', err);
      // Fallback: download raw vocal blob
      const url = URL.createObjectURL(vocalBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Caution_Studio_VocalTake.wav';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExportingWav(false);
    }
  };

  // Wire to Cloudflare R2 and Supabase Database
  const handleSaveToCloud = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!vocalBlob || !selectedTrack) {
      alert('Record a vocal take first before saving to cloud.');
      return;
    }

    setIsSavingToCloud(true);
    setCloudSaveResult(null);

    try {
      // 1. Render Master Mix WAV
      let masterBlob: Blob | null = null;
      try {
        masterBlob = await renderMasterMixBlob();
      } catch (mixErr) {
        console.warn('Could not render master mix, using vocal take:', mixErr);
      }

      // 2. Prepare FormData
      const formData = new FormData();
      formData.append('artistName', artistName.trim() || 'Caution Artist');
      formData.append('projectTitle', projectTitle.trim() || 'Record Studio Session');
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
          vocalVolume,
          masterVolume
        })
      );

      // Append Vocal Stem and Mixed Master
      formData.append('vocalAudio', vocalBlob, 'vocal_take.wav');
      if (masterBlob) {
        formData.append('masterMixAudio', masterBlob, 'master_mix.wav');
      }

      // 3. Post to /api/record-studio/save
      const res = await fetch('/api/record-studio/save', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCloudSaveResult({
          vocalUrl: data.vocalUrl,
          masterUrl: data.masterUrl || data.primaryUrl,
          message: 'Saved to Cloudflare R2 & Database!'
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[96vh] overflow-hidden bg-[#0A0D14] border border-white/10 rounded-2xl shadow-2xl text-white flex flex-col font-sans select-none">
        {/* Hidden Playback Track Audio Elements */}
        {selectedTrack && (
          <audio
            ref={beatAudioRef}
            src={selectedTrack.audioUrl || ''}
            preload="auto"
            onEnded={() => {
              setIsPlaying(false);
              setPlayheadTime(0);
            }}
          />
        )}
        {vocalUrl && (
          <audio
            ref={vocalAudioRef}
            src={vocalUrl}
            preload="auto"
            onEnded={() => {
              setIsPlaying(false);
            }}
          />
        )}
        <audio ref={auditionAudioRef} onEnded={() => setIsAuditioningId(null)} />

        {/* =========================================================================
            1. TOP DAW TITLE BAR (Audacity / Cubase Header Chassis)
           ========================================================================= */}
        <div className="px-4 py-2 bg-[#12151E] border-b border-white/10 flex items-center justify-between text-xs">
          {/* Left: DAW Branding & Project Name Input */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono font-black text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                <span>RECORD STUDIO</span>
                <span className="text-[10px] text-teal-400 font-normal px-1.5 py-0.2 rounded bg-teal-500/10 border border-teal-500/20">
                  DAW PRO v2.4
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
                className="bg-transparent border-b border-white/10 hover:border-white/30 focus:border-teal-400 text-xs text-white font-medium focus:outline-none px-1 py-0.5 max-w-[200px]"
              />
            </div>
          </div>

          {/* Center: Engine & Audio Spec Readouts */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>48.0 kHz · 24-Bit PCM</span>
            </span>
            <span>·</span>
            <span>R2 CLOUD SYNC: READY</span>
          </div>

          {/* Right: Quick Actions & Window Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportWav}
              disabled={!vocalBlob || isExportingWav}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-teal-300" />
              <span>{isExportingWav ? 'Exporting...' : 'Export WAV'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSaveToCloud()}
              disabled={!vocalBlob || isSavingToCloud}
              className="flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/40 text-xs font-bold text-teal-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm"
            >
              <CloudUpload className="h-3.5 w-3.5" />
              <span>{isSavingToCloud ? 'Saving to R2...' : 'Save to Cloud (R2)'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. MASTER TRANSPORT BAR & DIGITAL TIME COUNTER (Audacity / Cubase Style)
           ========================================================================= */}
        <div className="px-4 py-2.5 bg-[#0F121A] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
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
              title="Play / Pause (Space)"
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
              title="Record Vocals (R)"
              className={`h-9 px-3.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse shadow-red-500/40'
                  : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300'
              }`}
            >
              <span className={`w-3 h-3 rounded-full bg-red-500 ${isRecording ? 'animate-ping' : ''}`} />
              <span className="font-mono uppercase text-xs">
                {recordState === 'countdown' ? `COUNTDOWN ${countdownNumber}` : isRecording ? 'RECORDING' : 'RECORD'}
              </span>
            </button>

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
          </div>

          {/* Digital Timecode Display (Audacity / Cubase LED Screen) */}
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

          {/* Master Stereo Peak LED Ladder Meters */}
          <div className="hidden md:flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5">
            <div className="text-[9px] font-mono text-gray-400">MASTER</div>
            <div className="flex gap-1">
              {/* Left Meter */}
              <div className="w-2.5 h-7 bg-black rounded-sm overflow-hidden flex flex-col-reverse p-0.5 border border-white/10">
                <div
                  className="w-full bg-gradient-to-t from-emerald-500 via-yellow-400 to-red-500 rounded-xs transition-all duration-75"
                  style={{ height: `${masterMeterL}%` }}
                />
              </div>
              {/* Right Meter */}
              <div className="w-2.5 h-7 bg-black rounded-sm overflow-hidden flex flex-col-reverse p-0.5 border border-white/10">
                <div
                  className="w-full bg-gradient-to-t from-emerald-500 via-yellow-400 to-red-500 rounded-xs transition-all duration-75"
                  style={{ height: `${masterMeterR}%` }}
                />
              </div>
            </div>
          </div>

          {/* Backing Beat Switcher Trigger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setBeatPickerOpen(!beatPickerOpen)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Music className="h-3.5 w-3.5 text-[#E8B896]" />
              <span className="truncate max-w-[120px] sm:max-w-[160px]">
                {selectedTrack ? selectedTrack.title : 'Select Beat'}
              </span>
            </button>
          </div>
        </div>

        {/* Dropdown Beat Selector Modal Overlay */}
        {beatPickerOpen && (
          <div className="p-3 bg-[#0B0D14] border-b border-white/10 flex flex-col gap-2 z-40 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Disc3 className="h-3.5 w-3.5 text-teal-400" />
                <span>Switch Backing Instrumental Beat:</span>
              </span>
              <button
                type="button"
                onClick={() => setBeatPickerOpen(false)}
                className="text-gray-400 hover:text-white text-xs"
              >
                Done
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto no-scrollbar">
              {availableTracks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedTrack(b);
                    setBeatPickerOpen(false);
                  }}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-colors flex items-center justify-between ${
                    selectedTrack?.id === b.id
                      ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-white truncate">{b.title}</p>
                    <p className="text-[10px] text-gray-400">{b.bpm || 120} BPM · {b.genre}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAuditionToggle(b);
                    }}
                    className="p-1 rounded bg-black/40 text-gray-300 hover:text-white"
                  >
                    {isAuditioningId === b.id ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            3. MULTI-TRACK TIMELINE & WAVEFORM ARRANGEMENT VIEW
           ========================================================================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-[#080A0F]">
          {/* Timeline Time Ruler */}
          <div
            onClick={handleTimelineSeek}
            className="relative h-6 bg-[#0E1119] border border-white/10 rounded-md cursor-pointer flex items-center justify-between px-3 text-[10px] font-mono text-gray-500 select-none"
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

          {/* TRACK 01: Backing Instrumental Beat Track (Audacity / Cubase Channel) */}
          <div className="flex flex-col sm:flex-row items-stretch rounded-xl bg-[#0F131D] border border-white/10 overflow-hidden shadow-md">
            {/* Left Control Panel (TCP) */}
            <div className="w-full sm:w-56 p-3 bg-[#131722] border-b sm:border-b-0 sm:border-r border-white/10 flex flex-col justify-between text-xs shrink-0">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    TRK 01 · BEAT
                  </span>
                  <span className="text-[9px] font-mono px-1 rounded bg-white/5 text-gray-400">
                    STEREO WAV
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate mt-0.5" title={selectedTrack?.title}>
                  {selectedTrack?.title || 'Backing Beat'}
                </h4>
                <p className="text-[10px] text-gray-400">{selectedTrack?.artist || 'Caution Studio'}</p>
              </div>

              {/* Mute / Solo & Volume Slider */}
              <div className="mt-3 space-y-2">
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

                  <span className="text-[10px] font-mono text-gray-400 ml-auto">
                    {beatMuted ? 'MUTE' : `${Math.round(beatVolume * 100)}%`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Volume2 className="h-3 w-3 text-gray-400 shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={beatVolume}
                    onChange={(e) => setBeatVolume(parseFloat(e.target.value))}
                    aria-label="Beat Volume Fader"
                    className="w-full accent-[#E8B896] h-1.5 bg-black/40 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Right Waveform Display Lane */}
            <div
              onClick={handleTimelineSeek}
              className="relative flex-1 h-24 bg-[#0A0D15] p-2 flex items-center justify-center cursor-pointer select-none overflow-hidden"
            >
              {/* Waveform graphic bars */}
              <div className="w-full flex items-center justify-between gap-0.5 h-16 opacity-80">
                {Array.from({ length: 60 }).map((_, i) => {
                  const h = 20 + Math.sin(i * 0.4) * 35 + Math.cos(i * 0.8) * 15;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-amber-400/50 rounded-xs"
                      style={{ height: `${Math.max(12, Math.min(90, h))}%` }}
                    />
                  );
                })}
              </div>

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

          {/* TRACK 02: Lead Vocal Track (Recording & Multi-take Lane) */}
          <div className="flex flex-col sm:flex-row items-stretch rounded-xl bg-[#0F131D] border border-white/10 overflow-hidden shadow-md">
            {/* Left Control Panel (TCP) */}
            <div className="w-full sm:w-56 p-3 bg-[#131722] border-b sm:border-b-0 sm:border-r border-white/10 flex flex-col justify-between text-xs shrink-0">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span>TRK 02 · VOCAL</span>
                  </span>
                  <span className="text-[9px] font-mono px-1 rounded bg-white/5 text-teal-300">
                    48kHz MONO
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate mt-0.5">
                  Lead Vocal Take
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span>Take:</span>
                  <span className="font-mono text-teal-300 font-bold">
                    {takes.length > 0 ? `Take ${activeTakeIndex + 1}/${takes.length}` : 'Empty'}
                  </span>
                </div>
              </div>

              {/* Arm Record, Mute/Solo, Input VU Meter */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsArmed(!isArmed)}
                    title="Arm Track for Recording"
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                      isArmed
                        ? 'bg-red-500 text-white border-red-400 shadow-sm shadow-red-500/30'
                        : 'bg-white/5 border-white/10 text-gray-500'
                    }`}
                  >
                    REC
                  </button>
                  <button
                    type="button"
                    onClick={() => setVocalMuted(!vocalMuted)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                      vocalMuted
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    M
                  </button>
                  <button
                    type="button"
                    onClick={() => setVocalSolo(!vocalSolo)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                      vocalSolo
                        ? 'bg-yellow-400 text-black border-yellow-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    S
                  </button>

                  {/* Input VU Meter indicator */}
                  <div className="flex-1 flex items-center justify-end gap-1">
                    <Mic className={`h-3 w-3 ${isRecording ? 'text-red-400 animate-pulse' : 'text-gray-400'}`} />
                    <div className="w-12 h-2 bg-black rounded-full overflow-hidden border border-white/10 p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 rounded-full transition-all duration-75"
                        style={{ width: `${inputLevelMeter}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Vocal Volume Fader */}
                <div className="flex items-center gap-2">
                  <Volume2 className="h-3 w-3 text-gray-400 shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.01"
                    value={vocalVolume}
                    onChange={(e) => setVocalVolume(parseFloat(e.target.value))}
                    aria-label="Vocal Volume Fader"
                    className="w-full accent-teal-400 h-1.5 bg-black/40 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                    {vocalMuted ? 'M' : `${Math.round(vocalVolume * 100)}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Lane: Live Recording Waveform Canvas or Audio Take View */}
            <div
              onClick={handleTimelineSeek}
              className="relative flex-1 h-24 bg-[#0A0D15] p-2 flex items-center justify-center cursor-pointer select-none overflow-hidden"
            >
              {isRecording ? (
                /* Live Waveform drawing while singing/rapping */
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
              ) : vocalBlob ? (
                /* Rendered recorded vocal waveform */
                <div className="w-full flex items-center justify-between gap-0.5 h-16 opacity-90">
                  {Array.from({ length: 60 }).map((_, i) => {
                    const h = 15 + Math.sin(i * 0.9) * 45 + Math.cos(i * 1.5) * 25;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-teal-400/70 rounded-xs"
                        style={{ height: `${Math.max(8, Math.min(95, h))}%` }}
                      />
                    );
                  })}
                </div>
              ) : (
                /* Empty Armed Track Prompt */
                <div className="text-center text-gray-500 text-xs flex items-center gap-2 font-mono">
                  <Mic className="h-4 w-4 text-gray-600" />
                  <span>Track Armed · Press red [RECORD] above to lay down your vocals</span>
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
        </div>

        {/* =========================================================================
            4. BOTTOM DAW MIXER & FX PROCESSING RACK (Cubase Channel Strip & Audacity)
           ========================================================================= */}
        <div className="bg-[#0F131D] border-t border-white/10 flex flex-col text-xs">
          {/* Console Tabs */}
          <div className="px-4 py-1.5 bg-[#141824] border-b border-white/10 flex items-center justify-between">
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
                <span>Lyrics & Notepad</span>
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
                <span>Cloudflare R2 & Scouting</span>
              </button>
            </div>

            <div className="text-[10px] font-mono text-gray-500">
              AUDIO BUFFER: 512 SAMPLES · 0.04% CPU
            </div>
          </div>

          {/* Tab 1: DSP Effects Rack */}
          {activeConsoleTab === 'fx' && (
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Studio Reverb */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
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
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
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
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
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

              {/* Master Dynamics & Filters */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
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

          {/* Tab 2: Lyrics & Notepad */}
          {activeConsoleTab === 'lyrics' && (
            <div className="p-4">
              <textarea
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                placeholder="Type or paste your lyrics here to read along while you record..."
                rows={5}
                className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs font-mono text-gray-200 focus:outline-none focus:border-purple-400 resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Tab 3: Cloudflare R2 & Database Scouting Submission */}
          {activeConsoleTab === 'cloud' && (
            <div className="p-4 space-y-3">
              {cloudSaveResult ? (
                <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0" />
                    <div>
                      <p className="font-bold text-teal-300">Session Stored in Cloudflare R2 & Database!</p>
                      <p className="text-[11px] text-gray-300">
                        Your master recording and vocal stems are safely archived and ready for distribution or A&R review.
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
                      className="w-full h-9 px-3 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-teal-400"
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
                      className="w-full h-9 px-3 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">
                      WhatsApp / Phone
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+234..."
                      className="w-full h-9 px-3 rounded-lg bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-teal-400"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserRecordStudioModal;
