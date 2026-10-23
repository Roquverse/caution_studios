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
  RotateCcw,
  Send,
  Headphones,
  Sliders,
  ShieldCheck,
  Disc3,
  Flame,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { TrackItem } from '../types/tracks';
import { useUserSubscription } from '../lib/subscription';

interface UserSoundstageModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedTrack?: TrackItem | null;
  availableTracks?: TrackItem[];
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

export const UserSoundstageModal: React.FC<UserSoundstageModalProps> = ({
  isOpen,
  onClose,
  preselectedTrack,
  availableTracks = []
}) => {
  const { isSubscribed } = useUserSubscription();

  // Active Selected Beat
  const [selectedTrack, setSelectedTrack] = useState<TrackItem | null>(preselectedTrack || null);
  const [beatPickerOpen, setBeatPickerOpen] = useState(false);
  const [beatSearchQuery, setBeatSearchQuery] = useState('');
  const [isAuditioningId, setIsAuditioningId] = useState<string | null>(null);

  // Recording State Machine: 'idle' | 'countdown' | 'recording' | 'preview'
  const [recordState, setRecordState] = useState<'idle' | 'countdown' | 'recording' | 'preview'>('idle');
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  // Audio References & Visualizer
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [vocalBlob, setVocalBlob] = useState<Blob | null>(null);
  const [vocalUrl, setVocalUrl] = useState<string | null>(null);

  // Real-time Waveform Canvas/Bars
  const [waveformBars, setWaveformBars] = useState<number[]>(new Array(28).fill(15));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dual Audio Elements for Sync Playback
  const beatAudioRef = useRef<HTMLAudioElement | null>(null);
  const vocalAudioRef = useRef<HTMLAudioElement | null>(null);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Preview Playback & Volume Balance Controls
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [beatVolume, setBeatVolume] = useState(0.8);
  const [vocalVolume, setVocalVolume] = useState(1.0);

  // Export & Scouting Submission
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [artistName, setArtistName] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmittingToCaution, setIsSubmittingToCaution] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Filter free beats
  const freeTracks = availableTracks.filter(
    (t) => !t.priceNgn || t.priceNgn <= 5000 || t.category === 'playlists' || t.category === 'free'
  );

  // Stop Recording Session
  const stopRecordingSession = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping media recorder:', e);
      }
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (beatAudioRef.current) {
      beatAudioRef.current.pause();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Update selected track if preselectedTrack changes
  useEffect(() => {
    if (preselectedTrack) {
      setSelectedTrack(preselectedTrack);
    } else if (!selectedTrack && freeTracks.length > 0) {
      setSelectedTrack(freeTracks[0]);
    }
  }, [preselectedTrack, availableTracks]);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopRecordingSession();
      if (vocalAudioRef.current) vocalAudioRef.current.pause();
      if (beatAudioRef.current) beatAudioRef.current.pause();
      if (auditionAudioRef.current) auditionAudioRef.current.pause();
      setIsPlayingPreview(false);
      setIsAuditioningId(null);
    }
  }, [isOpen, stopRecordingSession]);

  // Handle Auditioning in Beat Picker
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

  // Start 3-Second Countdown
  const triggerCountdown = () => {
    if (!selectedTrack) {
      alert('Please select a free beat first.');
      return;
    }
    setRecordState('countdown');
    setCountdownNumber(3);

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownNumber(count);
      } else {
        clearInterval(interval);
        startActualRecording();
      }
    }, 1000);
  };

  // Begin Audio Recording & Beat Playback
  const startActualRecording = async () => {
    try {
      recordedChunksRef.current = [];
      setRecordingSeconds(0);
      setRecordState('recording');
      setIsRecording(true);
      setExportComplete(false);

      // Access User Microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      micStreamRef.current = stream;

      // Web Audio Analyser for live waveform visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const sourceNode = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      sourceNode.connect(analyser);
      analyserRef.current = analyser;

      // MediaRecorder Setup
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const supportedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';
      const recorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : undefined);

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
        setRecordState('preview');
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;

      // Start Synchronized Backing Beat Playback
      if (beatAudioRef.current && selectedTrack) {
        beatAudioRef.current.currentTime = 0;
        beatAudioRef.current.volume = beatVolume;
        beatAudioRef.current.play().catch(() => {});
      }

      // Live Timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 0.1);
      }, 100);

      // Live Waveform Visualizer
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateWaveform = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const bars: number[] = [];
          for (let i = 0; i < 28; i++) {
            const val = dataArray[i % dataArray.length] || 10;
            const pct = Math.max(12, Math.min(95, (val / 255) * 100));
            bars.push(pct);
          }
          setWaveformBars(bars);
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


  // Synchronized Playback Preview (Vocal + Backing Beat)
  const togglePlayCombinedPreview = () => {
    if (!vocalUrl || !selectedTrack) return;

    if (isPlayingPreview) {
      if (vocalAudioRef.current) vocalAudioRef.current.pause();
      if (beatAudioRef.current) beatAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      if (vocalAudioRef.current && beatAudioRef.current) {
        vocalAudioRef.current.currentTime = 0;
        beatAudioRef.current.currentTime = 0;
        vocalAudioRef.current.volume = vocalVolume;
        beatAudioRef.current.volume = beatVolume;

        const p1 = vocalAudioRef.current.play();
        const p2 = beatAudioRef.current.play();

        Promise.all([p1, p2])
          .then(() => setIsPlayingPreview(true))
          .catch(() => setIsPlayingPreview(false));
      }
    }
  };

  // Mix Vocal & Beat into Stereo WAV file and Download
  const handleExportWav = async () => {
    if (!vocalBlob || !selectedTrack) return;

    setIsExportingWav(true);
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();

      // 1. Decode vocal audio buffer
      const vocalArrayBuffer = await vocalBlob.arrayBuffer();
      const vocalAudioBuffer = await ctx.decodeAudioData(vocalArrayBuffer);

      // 2. Fetch and decode beat audio buffer
      const beatUrl = selectedTrack.audioUrl || '';
      let beatAudioBuffer: AudioBuffer | null = null;
      if (beatUrl) {
        try {
          const beatRes = await fetch(beatUrl);
          if (beatRes.ok) {
            const beatArrayBuffer = await beatRes.arrayBuffer();
            beatAudioBuffer = await ctx.decodeAudioData(beatArrayBuffer);
          }
        } catch (e) {
          console.warn('Could not fetch beat buffer for mixing, exporting vocals directly:', e);
        }
      }

      // If no beat buffer, convert vocal buffer directly
      if (!beatAudioBuffer) {
        const singleWavBlob = audioBufferToWav(vocalAudioBuffer);
        triggerBrowserDownload(singleWavBlob, `${selectedTrack.title.replace(/[^a-zA-Z0-9]/g, '_')}_Take.wav`);
        setIsExportingWav(false);
        setExportComplete(true);
        return;
      }

      // 3. Offline Audio Mixing (Mix vocals with beat synchronously)
      const renderLength = Math.max(vocalAudioBuffer.length, beatAudioBuffer.length);
      const sampleRate = vocalAudioBuffer.sampleRate;
      const offlineCtx = new OfflineAudioContext(2, renderLength, sampleRate);

      // Add Vocal Track
      const vocalSource = offlineCtx.createBufferSource();
      vocalSource.buffer = vocalAudioBuffer;
      const vocalGain = offlineCtx.createGain();
      vocalGain.gain.value = vocalVolume;
      vocalSource.connect(vocalGain);
      vocalGain.connect(offlineCtx.destination);
      vocalSource.start(0);

      // Add Beat Track
      const beatSource = offlineCtx.createBufferSource();
      beatSource.buffer = beatAudioBuffer;
      const beatGain = offlineCtx.createGain();
      beatGain.gain.value = beatVolume;
      beatSource.connect(beatGain);
      beatGain.connect(offlineCtx.destination);
      beatSource.start(0);

      // Render rendered audio buffer
      const mixedAudioBuffer = await offlineCtx.startRendering();

      // Convert to 16-bit PCM WAV Blob
      const mixedWavBlob = audioBufferToWav(mixedAudioBuffer);

      // Trigger automatic browser file download
      const cleanTitle = selectedTrack.title.replace(/[^a-zA-Z0-9]/g, '_');
      triggerBrowserDownload(mixedWavBlob, `CautionStudio_${cleanTitle}_SongDemo.wav`);

      setIsExportingWav(false);
      setExportComplete(true);
    } catch (err) {
      console.error('Offline audio mix render error:', err);
      // Fallback: download the raw recorded vocal take
      triggerBrowserDownload(vocalBlob, 'CautionStudio_Vocal_Take.webm');
      setIsExportingWav(false);
      setExportComplete(true);
    }
  };

  const triggerBrowserDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  // Submit to Caution Studio A&R Team for Artist Scouting
  const handleSubmitToCautionStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vocalBlob || !selectedTrack) return;

    setIsSubmittingToCaution(true);
    try {
      const formData = new FormData();
      formData.append('artistName', artistName.trim() || 'Artist Demo');
      formData.append('socialHandle', socialHandle.trim());
      formData.append('contactPhone', contactPhone.trim());
      formData.append('beatTitle', selectedTrack.title);
      formData.append('beatId', selectedTrack.id);
      formData.append('notes', notes.trim());
      formData.append('audio', vocalBlob, 'vocal_take.wav');

      const res = await fetch('/api/soundstage/submit', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setSubmitSuccess(true);
      } else {
        alert('Could not submit demo right now. Your downloaded file is saved on your device!');
      }
    } catch (err) {
      console.error('Error submitting take:', err);
      alert('Network issue submitting take. Your recording has been downloaded safely.');
    } finally {
      setIsSubmittingToCaution(false);
    }
  };

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const padM = m.toString().padStart(2, '0');
    const padS = s.toString().padStart(2, '0');
    return `${padM}:${padS}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-[#0A0D14] border border-white/10 rounded-3xl shadow-2xl text-white flex flex-col">
        {/* Hidden Audition Audio Tag */}
        <audio ref={auditionAudioRef} onEnded={() => setIsAuditioningId(null)} />

        {/* Hidden Playback Track Tags */}
        {selectedTrack && (
          <audio
            ref={beatAudioRef}
            src={selectedTrack.audioUrl || ''}
            preload="auto"
          />
        )}
        {vocalUrl && (
          <audio
            ref={vocalAudioRef}
            src={vocalUrl}
            preload="auto"
            onEnded={() => setIsPlayingPreview(false)}
          />
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] sticky top-0 bg-[#0A0D14]/95 backdrop-blur-xl z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#04564f]/40 border border-[#2dd4bf]/40 flex items-center justify-center text-[#2dd4bf] shadow-lg shadow-[#04564f]/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Caution Studio Soundstage
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/30">
                  LIVE RECORDER
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Record your song ideas over free studio beats, playback, and export for social media.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white transition-colors"
            aria-label="Close recorder"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Body */}
        <div className="p-5 sm:p-8 space-y-6 flex-1">
          {/* Headphone Notification Tip */}
          <div className="p-3.5 rounded-2xl bg-[#0F1E1C]/90 border border-[#2dd4bf]/30 flex items-center gap-3 text-xs text-neutral-300">
            <Headphones className="w-5 h-5 text-[#2dd4bf] shrink-0" />
            <span>
              <strong className="text-white">Pro Tip:</strong> Plug in your headphones while recording so the beat plays clearly in your ears without leaking back into your microphone.
            </span>
          </div>

          {/* Active Beat Selection Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#121620] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0">
                <img
                  src={selectedTrack?.coverUrl || '/images/artist_studio_mic.jpg'}
                  alt={selectedTrack?.title || 'Beat'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#2dd4bf]">
                  Active Instrumental
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {selectedTrack?.title || 'No beat selected'}
                </h3>
                <p className="text-xs text-neutral-400">
                  {selectedTrack?.artist || 'Caution Producer'} · {selectedTrack?.bpm || 120} BPM · {selectedTrack?.genre || 'Afrobeats'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setBeatPickerOpen(!beatPickerOpen)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-neutral-200 hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Music className="w-4 h-4 text-[#2dd4bf]" />
              <span>{beatPickerOpen ? 'Hide Beats' : 'Choose Free Beat'}</span>
            </button>
          </div>

          {/* Collapsible Beat Picker Drawer */}
          {beatPickerOpen && (
            <div className="p-4 rounded-2xl bg-[#0d1017] border border-white/10 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Select A Free Beat To Record On
                </span>
                <span className="text-[11px] text-neutral-500">
                  {freeTracks.length} Available
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {freeTracks.map((t) => {
                  const isSelected = selectedTrack?.id === t.id;
                  const isAuditioning = isAuditioningId === t.id;

                  return (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[#04564f]/30 border-[#2dd4bf]/40'
                          : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleAuditionToggle(t)}
                          className="w-8 h-8 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-white hover:text-[#2dd4bf] shrink-0"
                          title="Audition beat"
                        >
                          {isAuditioning ? <Pause className="w-3.5 h-3.5 text-[#2dd4bf]" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{t.title}</p>
                          <p className="text-[11px] text-neutral-400 truncate">
                            {t.artist} · {t.bpm || 120} BPM
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTrack(t);
                          setBeatPickerOpen(false);
                          if (auditionAudioRef.current) auditionAudioRef.current.pause();
                          setIsAuditioningId(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-[#2dd4bf] text-black font-extrabold'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {isSelected ? 'Loaded' : 'Select'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Studio Recording Console */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#131722] to-[#0A0D14] border border-white/10 text-center relative overflow-hidden flex flex-col items-center justify-center min-h-[300px]">
            {/* Countdown Overlay */}
            {recordState === 'countdown' && (
              <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center animate-in zoom-in-90">
                <span className="text-7xl sm:text-8xl font-black text-[#2dd4bf] animate-bounce">
                  {countdownNumber}
                </span>
                <p className="mt-3 text-xs uppercase tracking-widest text-neutral-300 font-bold">
                  Get Ready to Sing / Rap...
                </p>
              </div>
            )}

            {/* Live Waveform Bar Display */}
            <div className="w-full max-w-lg h-24 flex items-center justify-center gap-1.5 px-4 mb-4">
              {waveformBars.map((height, idx) => (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-all duration-75 ${
                    isRecording
                      ? 'bg-gradient-to-t from-[#04564f] via-[#2dd4bf] to-emerald-400'
                      : 'bg-white/10'
                  }`}
                  style={{
                    height: `${height}%`,
                    opacity: isRecording ? 1 : 0.4
                  }}
                />
              ))}
            </div>

            {/* Timer Display */}
            <div className="mb-6 font-mono font-bold text-2xl sm:text-3xl tracking-wider text-white">
              {formatSecs(recordingSeconds)}
            </div>

            {/* Main Action Trigger Buttons */}
            {recordState === 'idle' && (
              <button
                type="button"
                onClick={triggerCountdown}
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-red-900/40 hover:scale-105 transition-all cursor-pointer border border-red-400/30"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white animate-pulse" />
                <span>Start Recording</span>
              </button>
            )}

            {recordState === 'recording' && (
              <button
                type="button"
                onClick={stopRecordingSession}
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-red-500 to-red-700 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-red-900/60 hover:scale-105 transition-all cursor-pointer border border-white/20 animate-pulse"
              >
                <Square className="w-4 h-4 fill-white text-white" />
                <span>Stop Recording</span>
              </button>
            )}

            {/* Preview State After Recording */}
            {recordState === 'preview' && (
              <div className="w-full max-w-xl space-y-6 animate-in fade-in">
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-left space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2dd4bf] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Take Recorded Successfully!
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRecordState('idle');
                        setRecordingSeconds(0);
                        setVocalBlob(null);
                        setVocalUrl(null);
                        setIsPlayingPreview(false);
                      }}
                      className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Record Take 2</span>
                    </button>
                  </div>

                  {/* Playback Preview Button */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={togglePlayCombinedPreview}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      {isPlayingPreview ? (
                        <>
                          <Pause className="w-4 h-4 fill-black text-black" />
                          <span>Pause Song</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-black text-black" />
                          <span>Play Song Preview</span>
                        </>
                      )}
                    </button>
                    <span className="text-xs text-neutral-400">
                      Synchronized vocals + beat
                    </span>
                  </div>

                  {/* Balance Volume Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/5">
                    <div>
                      <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                        <span>Vocal Volume</span>
                        <span>{Math.round(vocalVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.05"
                        value={vocalVolume}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setVocalVolume(val);
                          if (vocalAudioRef.current) vocalAudioRef.current.volume = val;
                        }}
                        className="w-full accent-[#2dd4bf]"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                        <span>Beat Instrumental Volume</span>
                        <span>{Math.round(beatVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.05"
                        value={beatVolume}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setBeatVolume(val);
                          if (beatAudioRef.current) beatAudioRef.current.volume = val;
                        }}
                        className="w-full accent-[#2dd4bf]"
                      />
                    </div>
                  </div>
                </div>

                {/* 1-Click Download Button */}
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                  <button
                    type="button"
                    onClick={handleExportWav}
                    disabled={isExportingWav}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#04564f]/40 border border-[#2dd4bf]/40 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#2dd4bf]" />
                    <span>
                      {isExportingWav ? 'Mixing & Rendering WAV...' : 'Download Song (.WAV)'}
                    </span>
                  </button>

                  {exportComplete && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Downloaded to your device!
                    </span>
                  )}
                </div>

                {/* Artist Scouting & Free Studio Support Application */}
                <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-[#0B1E1C]/80 to-[#121418]/80 border border-[#2dd4bf]/30 text-left space-y-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      Get Scouted For Free Studio Support From Caution Studio
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300">
                    Caution Studio producers actively review soundstage takes to sponsor upcoming artists with free recording sessions, mixing, and social media promotions.
                  </p>

                  {submitSuccess ? (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Take submitted! Caution Studio A&R team will contact you if shortlisted.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitToCautionStudio} className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Artist / Stage Name"
                          value={artistName}
                          onChange={(e) => setArtistName(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2dd4bf]"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Instagram / TikTok @handle"
                          value={socialHandle}
                          onChange={(e) => setSocialHandle(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2dd4bf]"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="WhatsApp Phone Number"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#2dd4bf]"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-neutral-500">
                          Submit recorded demo to Caution Studio
                        </span>
                        <button
                          type="submit"
                          disabled={isSubmittingToCaution}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmittingToCaution ? 'Submitting...' : 'Submit Demo to A&R'}</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
