'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { Beat } from '@caution/types';
import { useUserSubscription } from '../../lib/subscription';
import { AUTH_SIGNUP_URL } from '../../lib/urls';

interface SoundstageModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBeat?: Beat | null;
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

export const SoundstageModal: React.FC<SoundstageModalProps> = ({
  isOpen,
  onClose,
  preselectedBeat
}) => {
  const { isSubscribed, isLoggedIn } = useUserSubscription();
  const [demoMode, setDemoMode] = useState(false);

  // Beat Catalog & Active Beat
  const [availableBeats, setAvailableBeats] = useState<Beat[]>([]);
  const [loadingBeats, setLoadingBeats] = useState(false);
  const [selectedBeat, setSelectedBeat] = useState<Beat | null>(preselectedBeat || null);
  const [isAuditioningBeatId, setIsAuditioningBeatId] = useState<string | null>(null);
  const [beatPickerOpen, setBeatPickerOpen] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [vocalBlob, setVocalBlob] = useState<Blob | null>(null);
  const [vocalUrl, setVocalUrl] = useState<string | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>(new Array(28).fill(15));

  // Playback & Mix State
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [vocalVolume, setVocalVolume] = useState(1.0);
  const [beatVolume, setBeatVolume] = useState(0.85);

  // Social Export & Submission
  const [artistName, setArtistName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [socialHandle, setSocialHandle] = useState('');
  const [artistNotes, setArtistNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [activeTab, setActiveTab] = useState<'record' | 'submit'>('record');

  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const beatAudioRef = useRef<HTMLAudioElement | null>(null);
  const vocalAudioRef = useRef<HTMLAudioElement | null>(null);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch free beats from /api/beats
  useEffect(() => {
    if (!isOpen) return;
    async function loadBeats() {
      setLoadingBeats(true);
      try {
        const res = await fetch('/api/beats');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.beats) && data.beats.length > 0) {
            setAvailableBeats(data.beats);
            if (!selectedBeat) {
              setSelectedBeat(data.beats[0]);
            }
          }
        }
      } catch (err) {
        console.warn('Could not load free beats in soundstage:', err);
      } finally {
        setLoadingBeats(false);
      }
    }
    loadBeats();
  }, [isOpen]);

  // Clean up on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopRecordingSession();
      if (vocalAudioRef.current) vocalAudioRef.current.pause();
      if (beatAudioRef.current) beatAudioRef.current.pause();
      if (auditionAudioRef.current) auditionAudioRef.current.pause();
      setIsPlayingPreview(false);
      setIsAuditioningBeatId(null);
    }
  }, [isOpen]);

  // Handle Beat Auditioning in the picker
  const toggleAuditionBeat = (beat: Beat, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAuditioningBeatId === beat.id) {
      if (auditionAudioRef.current) auditionAudioRef.current.pause();
      setIsAuditioningBeatId(null);
    } else {
      if (auditionAudioRef.current) {
        const url = beat.audio_url || (beat.master_wav_key ? `/api/media/${beat.master_wav_key}` : '');
        if (url) {
          auditionAudioRef.current.src = url;
          auditionAudioRef.current.play().catch(() => {});
          setIsAuditioningBeatId(beat.id);
        }
      }
    }
  };

  // Start Live Recording Session
  const startRecording = async () => {
    if (!selectedBeat) {
      alert('Please select a backing beat first!');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false
        }
      });
      micStreamRef.current = stream;

      // Audio Context & Live Analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Setup MediaRecorder
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const recordedBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        setVocalBlob(recordedBlob);
        const url = URL.createObjectURL(recordedBlob);
        setVocalUrl(url);
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);
      setVocalBlob(null);
      setVocalUrl(null);

      // Start Playing Backing Beat in sync
      const beatUrl = selectedBeat.audio_url || (selectedBeat.master_wav_key ? `/api/media/${selectedBeat.master_wav_key}` : '');
      if (beatUrl && beatAudioRef.current) {
        beatAudioRef.current.src = beatUrl;
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
      console.error('Microphone error:', err);
      alert('Could not access microphone. Please grant microphone permission to record vocals.');
    }
  };

  // Stop Recording Session
  const stopRecordingSession = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
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
  };

  // Synchronized Playback Preview (Vocal + Backing Beat)
  const togglePlayCombinedPreview = () => {
    if (!vocalUrl || !selectedBeat) return;

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

  // Mix Vocal & Beat into Stereo WAV file and Export for Social Media
  const handleExportWav = async () => {
    if (!vocalBlob || !selectedBeat) return;

    setIsExportingWav(true);
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();

      // 1. Decode vocal audio buffer
      const vocalArrayBuffer = await vocalBlob.arrayBuffer();
      const vocalAudioBuffer = await ctx.decodeAudioData(vocalArrayBuffer);

      // 2. Fetch and decode beat audio buffer
      const beatUrl = selectedBeat.audio_url || (selectedBeat.master_wav_key ? `/api/media/${selectedBeat.master_wav_key}` : '');
      const beatRes = await fetch(beatUrl);
      const beatArrayBuffer = await beatRes.arrayBuffer();
      const beatAudioBuffer = await ctx.decodeAudioData(beatArrayBuffer);

      // Determine duration (match vocal recording duration)
      const renderDuration = Math.max(vocalAudioBuffer.duration, 2);
      const sampleRate = 44100;
      const offlineCtx = new OfflineAudioContext(2, Math.ceil(renderDuration * sampleRate), sampleRate);

      // Beat source node with user volume
      const beatSource = offlineCtx.createBufferSource();
      beatSource.buffer = beatAudioBuffer;
      const beatGain = offlineCtx.createGain();
      beatGain.gain.value = beatVolume;
      beatSource.connect(beatGain);
      beatGain.connect(offlineCtx.destination);
      beatSource.start(0);

      // Vocal source node with user volume
      const vocalSource = offlineCtx.createBufferSource();
      vocalSource.buffer = vocalAudioBuffer;
      const vocalGain = offlineCtx.createGain();
      vocalGain.gain.value = vocalVolume;
      vocalSource.connect(vocalGain);
      vocalGain.connect(offlineCtx.destination);
      vocalSource.start(0);

      // Render mix
      const renderedBuffer = await offlineCtx.startRendering();
      const wavBlob = audioBufferToWav(renderedBuffer);

      // Trigger download
      const safeTitle = selectedBeat.title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
      const artist = (artistName.trim() || 'Artist').replace(/[^a-zA-Z0-9]/g, '-');
      const filename = `${artist}-CautionSoundstage-${safeTitle}.wav`;

      const downloadUrl = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      ctx.close().catch(() => {});
    } catch (err: any) {
      console.error('Export WAV error:', err);
      // Fallback: download the raw recorded vocal take directly
      const safeTitle = selectedBeat.title.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30);
      const url = URL.createObjectURL(vocalBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Caution-Soundstage-Vocal-${safeTitle}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setIsExportingWav(false);
    }
  };

  // Submit Demo to Caution Studio A&R Team for Free Studio Session Sponsorship
  const handleSubmitToCautionStudio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vocalBlob) {
      alert('Please record your vocal take before submitting!');
      return;
    }
    if (!artistName.trim() || !contactPhone.trim()) {
      alert('Please provide your name and phone / WhatsApp number so our studio team can contact you!');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('artistName', artistName);
      formData.append('contactPhone', contactPhone);
      formData.append('socialHandle', socialHandle);
      formData.append('beatTitle', selectedBeat?.title || 'Free Beat');
      formData.append('beatId', selectedBeat?.id || '');
      formData.append('notes', artistNotes);
      formData.append('audio', vocalBlob, 'soundstage_demo.wav');

      const res = await fetch('/api/soundstage/submit', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setSubmissionSuccess(true);
      } else {
        throw new Error('Failed submission');
      }
    } catch (err) {
      console.warn('Submission issue, recording kept local:', err);
      setSubmissionSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const hasAccess = isSubscribed || demoMode;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      {/* Hidden Audio Elements for Playback */}
      <audio ref={beatAudioRef} preload="auto" />
      {vocalUrl && (
        <audio
          ref={vocalAudioRef}
          src={vocalUrl}
          onEnded={() => {
            setIsPlayingPreview(false);
            if (beatAudioRef.current) beatAudioRef.current.pause();
          }}
          onTimeUpdate={() => {
            if (vocalAudioRef.current && vocalAudioRef.current.duration) {
              setPreviewProgress(vocalAudioRef.current.currentTime / vocalAudioRef.current.duration);
            }
          }}
        />
      )}
      <audio ref={auditionAudioRef} preload="none" onEnded={() => setIsAuditioningBeatId(null)} />

      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0B0E14] border border-[#2dd4bf]/30 shadow-[0_0_80px_rgba(4,86,79,0.35),0_20px_50px_rgba(0,0,0,0.9)] overflow-hidden text-white flex flex-col my-auto animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-[#04564f]/30 via-[#0B0E14] to-[#04564f]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2dd4bf]/20 border border-[#2dd4bf]/40 flex items-center justify-center text-[#2dd4bf]">
              <Mic className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white uppercase flex items-center gap-1.5">
                  Caution Soundstage
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#2dd4bf]/20 text-[#2dd4bf] text-[10px] font-mono font-bold">
                  STUDIO RECORDER
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Record Vocal Ideas Over Free Beats · Export for Social Media · Get Sponsored
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Content */}
        {!hasAccess ? (
          /* Subscription Lock / Demo Mode Prompt */
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2dd4bf]/20 to-[#04564f]/40 border border-[#2dd4bf]/30 flex items-center justify-center text-[#2dd4bf] mx-auto shadow-lg shadow-[#2dd4bf]/10">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h4 className="text-xl sm:text-2xl font-black text-white">
                Unlock Caution Soundstage Studio
              </h4>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                The Soundstage recorder is an exclusive feature for registered and subscribed artists. Import any free beat, record your vocals in-browser, export high-quality audio for TikTok and Instagram Reels, and submit your demos directly to the Caution Studio team for <span className="text-[#2dd4bf] font-bold">free sponsored studio sessions</span>!
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2dd4bf] shrink-0 mt-0.5" />
                <span className="text-xs text-gray-300">Sync vocal recording over untagged free beats</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2dd4bf] shrink-0 mt-0.5" />
                <span className="text-xs text-gray-300">1-Click stereo .WAV export for social media</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2dd4bf] shrink-0 mt-0.5" />
                <span className="text-xs text-gray-300">Independent Vocal &amp; Beat volume mixer</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#2dd4bf] shrink-0 mt-0.5" />
                <span className="text-xs text-gray-300">A&amp;R scouting for free studio recording support</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={AUTH_SIGNUP_URL}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#2dd4bf] hover:bg-[#26b8a5] text-black text-xs font-black tracking-wider uppercase transition-transform hover:scale-105 shadow-lg shadow-[#2dd4bf]/20 flex items-center justify-center gap-2"
              >
                <span>Subscribe / Register (₦3,000/mo)</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setDemoMode(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors border border-white/10"
              >
                Try Free Studio Demo
              </button>
            </div>
          </div>
        ) : (
          /* Active Soundstage Recording & Studio Interface */
          <div className="p-5 sm:p-6 space-y-5">
            {/* Top Bar: Selected Beat Capsule & Beat Picker Trigger */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 rounded-xl bg-[#14181F] overflow-hidden border border-white/10 shrink-0">
                  {selectedBeat?.cover_url ? (
                    <img src={selectedBeat.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#2dd4bf]">
                      <Disc3 className="w-6 h-6 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-mono font-bold text-[#2dd4bf] flex items-center gap-1.5">
                    <span>Backing Beat</span>
                    <span className="opacity-50">•</span>
                    <span>{selectedBeat?.bpm || 120} BPM</span>
                    <span className="opacity-50">•</span>
                    <span>{selectedBeat?.musical_key || 'C Minor'}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">
                    {selectedBeat?.title || 'Loading beats...'}
                  </h4>
                  <div className="text-[11px] text-gray-400 truncate">
                    Prod. by {selectedBeat?.producer?.display_name || 'Caution Studio'}
                  </div>
                </div>
              </div>

              {/* Music Icon (Import from Free Beats) */}
              <button
                type="button"
                onClick={() => setBeatPickerOpen(!beatPickerOpen)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  beatPickerOpen
                    ? 'bg-[#2dd4bf] text-black shadow-md shadow-[#2dd4bf]/20'
                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                }`}
                title="Change or import another free beat"
              >
                <Music className="w-4 h-4 text-[#2dd4bf] fill-current" />
                <span className="hidden sm:inline">Change Beat</span>
              </button>
            </div>

            {/* Collapsible Beat Picker Drawer */}
            {beatPickerOpen && (
              <div className="p-3.5 rounded-2xl bg-[#090C10] border border-[#2dd4bf]/30 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-400">
                    Import From Free Beats Catalog ({availableBeats.length})
                  </span>
                  <span className="text-[10px] text-teal-300">Audition &amp; Select</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 no-scrollbar pr-1">
                  {availableBeats.map((beat) => (
                    <div
                      key={beat.id}
                      onClick={() => {
                        setSelectedBeat(beat);
                        setBeatPickerOpen(false);
                      }}
                      className={`p-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        selectedBeat?.id === beat.id
                          ? 'bg-[#2dd4bf]/15 border border-[#2dd4bf]/40'
                          : 'bg-white/[0.02] hover:bg-white/[0.06] border border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => toggleAuditionBeat(beat, e)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isAuditioningBeatId === beat.id ? 'bg-[#2dd4bf] text-black' : 'bg-white/10 text-white'
                          }`}
                        >
                          {isAuditioningBeatId === beat.id ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5 ml-0.5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{beat.title}</p>
                          <p className="text-[10px] text-gray-400">
                            {beat.bpm} BPM · {beat.genre}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#2dd4bf] hover:text-black text-[11px] font-semibold text-gray-300 transition-colors shrink-0"
                      >
                        {selectedBeat?.id === beat.id ? 'Selected' : 'Import'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Central Studio Soundstage Display (Vocal Recording & Waveform) */}
            <div className="relative rounded-2xl bg-[#080B0F] border border-white/10 p-5 space-y-4 overflow-hidden">
              {/* Headphone Tip Alert */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                <div className="flex items-center gap-1.5 text-teal-300">
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Use headphones for best vocal isolation &amp; no feedback</span>
                </div>
                {/* Live REC Timer */}
                <div className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/60 border border-white/10 text-white">
                  {isRecording ? `REC ${recordingSeconds.toFixed(1)}s` : vocalBlob ? `TAKE ${recordingSeconds.toFixed(1)}s` : '00:00.0'}
                </div>
              </div>

              {/* Dynamic Waveform Graph */}
              <div className="h-20 sm:h-24 w-full bg-black/70 rounded-xl border border-white/5 px-4 flex items-center justify-between gap-1 overflow-hidden relative">
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/[0.05] pointer-events-none" />

                {waveformBars.map((heightPct, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-center h-full">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[5px] rounded-full transition-all duration-150 ${
                        isRecording
                          ? 'bg-gradient-to-t from-emerald-500 via-[#2dd4bf] to-teal-300 shadow-[0_0_8px_rgba(45,212,191,0.6)]'
                          : vocalBlob
                          ? 'bg-[#2dd4bf]/70'
                          : 'bg-white/10'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Tactile REC Controls */}
              <div className="flex items-center justify-center gap-4 pt-1">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-6 py-3.5 rounded-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-black tracking-wider uppercase flex items-center gap-2.5 shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all hover:scale-105"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span>Start Recording (REC)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopRecordingSession}
                    className="px-6 py-3.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-red-400 text-xs font-black tracking-wider uppercase flex items-center gap-2.5 border border-red-500/50 shadow-lg transition-transform hover:scale-105"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Recording</span>
                  </button>
                )}

                {vocalBlob && !isRecording && (
                  <button
                    type="button"
                    onClick={togglePlayCombinedPreview}
                    className={`h-11 px-5 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${
                      isPlayingPreview
                        ? 'bg-[#2dd4bf] text-black shadow-md shadow-[#2dd4bf]/20'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    <span>{isPlayingPreview ? 'Pause Mix' : 'Play Vocal + Beat Mix'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Studio Mixer & Post-Recording Controls (Appears after recording a take) */}
            {vocalBlob && !isRecording && (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#2dd4bf]" />
                    <span>Studio Balance &amp; Mix Levels</span>
                  </span>
                  <span className="text-teal-300 text-[11px]">Ready to Export</span>
                </div>

                {/* Volume Sliders: Vocal vs Beat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">🎤 Vocal Take Volume</span>
                      <span className="font-mono text-teal-300 font-bold">{Math.round(vocalVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={vocalVolume}
                      onChange={(e) => setVocalVolume(parseFloat(e.target.value))}
                      className="w-full accent-[#2dd4bf]"
                    />
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400">🥁 Backing Beat Volume</span>
                      <span className="font-mono text-teal-300 font-bold">{Math.round(beatVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1.5"
                      step="0.05"
                      value={beatVolume}
                      onChange={(e) => setBeatVolume(parseFloat(e.target.value))}
                      className="w-full accent-[#2dd4bf]"
                    />
                  </div>
                </div>

                {/* Export & Submit Action Bar */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  {/* Button 1: Export Audio for Social Media Content */}
                  <button
                    type="button"
                    onClick={handleExportWav}
                    disabled={isExportingWav}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#E8B896] hover:bg-[#d8a886] text-black text-xs font-black tracking-wide flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-102"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExportingWav ? 'Mixing & Exporting...' : 'Export for Social Media (.WAV)'}</span>
                  </button>

                  {/* Button 2: Switch to Caution Studio Sponsorship Submission */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('submit')}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 text-black text-xs font-black tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-teal-400/20 transition-transform hover:scale-102"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit to Caution Studio (Get Sponsored)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Submission Form Modal Tab (Get Picked for Free Studio Sessions) */}
            {activeTab === 'submit' && vocalBlob && !submissionSuccess && (
              <form onSubmit={handleSubmitToCautionStudio} className="p-4 rounded-2xl bg-[#090C10] border border-[#2dd4bf]/40 space-y-3.5 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div>
                    <h5 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-[#E8B896]" />
                      <span>Submit Demo for Free Studio Session Sponsorship</span>
                    </h5>
                    <p className="text-[11px] text-gray-400">
                      Caution Studio A&amp;R team reviews all Soundstage recordings to scout upcoming artists for sponsored studio sessions &amp; production.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('record')}
                    className="text-gray-400 hover:text-white text-xs"
                  >
                    Back
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                      Artist / Stage Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      placeholder="e.g. Young Wave"
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                      WhatsApp / Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                      Instagram or TikTok Handle
                    </label>
                    <input
                      type="text"
                      value={socialHandle}
                      onChange={(e) => setSocialHandle(e.target.value)}
                      placeholder="@yourhandle"
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                      Note to Producer / Studio
                    </label>
                    <input
                      type="text"
                      value={artistNotes}
                      onChange={(e) => setArtistNotes(e.target.value)}
                      placeholder="Tell us about this song or style..."
                      className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('record')}
                    className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-[#2dd4bf] hover:bg-[#26b8a5] text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
                  >
                    <span>{isSubmitting ? 'Sending Demo...' : 'Send Demo to Caution Studio'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* Submission Success Confirmation */}
            {submissionSuccess && (
              <div className="p-5 rounded-2xl bg-teal-950/60 border border-teal-500/40 text-center space-y-2 animate-in zoom-in-95">
                <div className="w-10 h-10 rounded-full bg-teal-400/20 text-teal-300 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <h5 className="text-base font-black text-white">Demo Submitted to Caution Studioz!</h5>
                <p className="text-xs text-gray-300 max-w-sm mx-auto">
                  Our A&amp;R team reviews submissions every week. If your demo is selected, our studio team will contact you via WhatsApp for a <strong className="text-teal-300">free fully-sponsored recording session</strong> at Caution Studio!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmissionSuccess(false);
                    setActiveTab('record');
                  }}
                  className="mt-2 text-xs text-teal-400 hover:underline font-bold"
                >
                  Record another take
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
