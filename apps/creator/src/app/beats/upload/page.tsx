'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CreatorShell } from '../../../components/CreatorShell';
import { supabase } from '../../../lib/supabaseClient';
import { ArtworkUploader } from '../../../components/ArtworkUploader';
import {
  Upload,
  Music2,
  FileArchive,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';

export default function BeatUploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState('Afrobeats');
  const [bpm, setBpm] = useState('110');
  const [musicalKey, setMusicalKey] = useState('F Minor');
  const [tags, setTags] = useState('Burnaboy, Asake, Wizkid, Summer');
  const [priceBasic, setPriceBasic] = useState('3000');
  const [pricePremium, setPricePremium] = useState('30000');
  const [priceExclusive, setPriceExclusive] = useState('100000');
  const [enableFreeStreaming, setEnableFreeStreaming] = useState(true);
  const [isFreeBeat, setIsFreeBeat] = useState(false);

  // File objects
  const [audioFileObj, setAudioFileObj] = useState<File | null>(null);
  const [stemsFileObj, setStemsFileObj] = useState<File | null>(null);
  const [coverFileObj, setCoverFileObj] = useState<File | null>(null);
  const [coverPresetUrl, setCoverPresetUrl] = useState<string | null>('/images/studio_mixing_console.jpg');

  // Direct storage upload with real progress tracking (bypasses Vercel 4.5MB serverless limit)
  const uploadFileDirectly = async (
    file: File,
    type: 'audio' | 'stems' | 'cover',
    titleStr: string,
    authToken?: string
  ): Promise<string> => {
    // 1. Request presigned upload URL
    const presignRes = await fetch('/api/beats/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || (type === 'audio' ? 'audio/wav' : type === 'stems' ? 'application/zip' : 'image/jpeg'),
        type,
        title: titleStr
      })
    });

    const presignText = await presignRes.text();
    let presignJson: any = {};
    try {
      presignJson = JSON.parse(presignText);
    } catch {
      throw new Error(`Storage URL error (${presignRes.status}): ${presignText.slice(0, 120)}`);
    }

    if (!presignRes.ok || !presignJson.uploadUrl || !presignJson.key) {
      throw new Error(presignJson.error || `Failed to initiate storage upload for ${file.name}`);
    }

    // 2. Direct PUT to Cloudflare R2 Storage with real-time percentage progress
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignJson.uploadUrl, true);
      if (file.type) {
        xhr.setRequestHeader('Content-Type', file.type);
      }

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Direct storage upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during file upload to storage. Check connection.'));
      };

      xhr.send(file);
    });

    return presignJson.key;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a beat title.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setUploadProgress(0);

    try {
      let { data: { session } } = await supabase.auth.getSession();
      
      // Cookie fallback if local session empty
      if (!session) {
        const match = document.cookie.match(/sb-token=([^;]+)/);
        const matchRefresh = document.cookie.match(/sb-refresh=([^;]+)/);
        if (match && matchRefresh) {
          const { data } = await supabase.auth.setSession({
            access_token: match[1],
            refresh_token: matchRefresh[1]
          });
          session = data.session;
        }
      }

      const userId = session?.user?.id;
      if (!userId) {
        setErrorMessage('You must be signed in as a producer to upload beats.');
        setLoading(false);
        return;
      }

      let masterAudioKey: string | null = null;
      let stemsKey: string | null = null;
      let finalCoverUrl = coverPresetUrl || '/images/studio_mixing_console.jpg';

      // 1. Upload Master Audio directly to R2 if selected
      if (audioFileObj) {
        setUploadStep(`Uploading audio master (${(audioFileObj.size / (1024 * 1024)).toFixed(1)} MB)...`);
        masterAudioKey = await uploadFileDirectly(audioFileObj, 'audio', title.trim(), session?.access_token);
      }

      // 2. Upload Stems directly to R2 if selected
      if (stemsFileObj) {
        setUploadStep(`Uploading stems archive (${(stemsFileObj.size / (1024 * 1024)).toFixed(1)} MB)...`);
        stemsKey = await uploadFileDirectly(stemsFileObj, 'stems', title.trim(), session?.access_token);
      }

      // 3. Upload Custom Cover if selected
      if (coverFileObj) {
        setUploadStep('Uploading cover artwork...');
        const coverKey = await uploadFileDirectly(coverFileObj, 'cover', title.trim(), session?.access_token);
        finalCoverUrl = `/api/media/${coverKey}`;
      }

      // 4. Save Beat & Licenses to Supabase Catalog
      setUploadStep('Publishing beat to Caution Studio catalog...');
      const payload = {
        producerId: userId,
        title: title.trim(),
        genre,
        bpm,
        musicalKey,
        tags,
        isFreeBeat,
        priceBasic: isFreeBeat ? '0' : priceBasic,
        pricePremium: isFreeBeat ? '0' : pricePremium,
        priceExclusive: isFreeBeat ? '0' : priceExclusive,
        enableFreeStreaming: isFreeBeat ? true : enableFreeStreaming,
        masterAudioKey,
        stemsKey,
        coverUrl: finalCoverUrl
      };

      const res = await fetch('/api/beats/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const resText = await res.text();
      let resJson: any = {};
      try {
        resJson = JSON.parse(resText);
      } catch {
        throw new Error(`Server returned error (${res.status}): ${resText.slice(0, 120)}`);
      }

      if (!res.ok || resJson.error) {
        throw new Error(resJson.error || 'Failed to publish beat to catalog.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/beats');
      }, 1200);
    } catch (err: any) {
      console.error('Error uploading beat:', err);
      setErrorMessage(err.message || 'Failed to upload beat. Please try again.');
      setLoading(false);
    }
  };

  return (
    <CreatorShell>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/beats"
            className="p-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Upload New Master Beat
            </h1>
            <p className="text-xs text-zinc-400">
              Publish your instrumentals to the Caution Studio master catalog
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-[#2dd4bf] bg-[#2dd4bf]/10 border border-[#2dd4bf]/20 px-2.5 py-1 rounded-full">
          80% Creator Revenue Split
        </span>
      </div>

      {success && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-semibold block text-sm">Beat Uploaded Successfully!</span>
            <span className="text-xs text-emerald-300">
              Your beat is published to the live catalog and will be available for streaming and licensing. Redirecting...
            </span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4 text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-xs">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata & Audio Files */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Upload Dropzones */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-white">1. Master Files</h3>

            {/* Master WAV / MP3 */}
            <div>
              <label className="text-xs font-medium text-zinc-300 mb-1.5 block">
                Audio Master (24-bit WAV or high-res MP3) *
              </label>
              {/* Entire zone is tappable — critical for mobile iOS where only label clicks work */}
              <label
                htmlFor="master-audio-input"
                className="flex flex-col items-center border border-dashed border-zinc-700 hover:border-[#2dd4bf] active:border-[#2dd4bf] rounded-lg p-6 text-center cursor-pointer transition-colors bg-zinc-950/60 select-none"
              >
                <Upload className="h-6 w-6 text-zinc-500 mb-2" />
                <span className="text-xs font-medium text-zinc-200 block">
                  {audioFileObj ? audioFileObj.name : 'Tap or click to select master audio'}
                </span>
                {audioFileObj && (
                  <span className="text-[10px] text-[#2dd4bf] block mt-1 font-mono">
                    {(audioFileObj.size / (1024 * 1024)).toFixed(1)} MB selected ✓
                  </span>
                )}
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Supports .wav, .mp3 up to 150MB
                </span>
                <input
                  type="file"
                  accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/aac,audio/*,.mp3,.wav,.m4a,.aac,.flac"
                  onChange={(e) => setAudioFileObj(e.target.files?.[0] || null)}
                  className="sr-only"
                  id="master-audio-input"
                />
                <span className="mt-3 inline-block px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 rounded pointer-events-none">
                  Choose Audio File
                </span>
              </label>
            </div>

            {/* Trackout Stems ZIP */}
            <div>
              <label className="text-xs font-medium text-zinc-300 mb-1.5 block">
                Trackout Stems Archive (.zip) (Required for Premium & Exclusive)
              </label>
              <label
                htmlFor="stems-zip-input"
                className="flex flex-col items-center border border-dashed border-zinc-700 hover:border-[#2dd4bf] active:border-[#2dd4bf] rounded-lg p-5 text-center cursor-pointer transition-colors bg-zinc-950/60 select-none"
              >
                <FileArchive className="h-6 w-6 text-zinc-500 mb-2" />
                <span className="text-xs font-medium text-zinc-200 block">
                  {stemsFileObj ? stemsFileObj.name : 'Tap or click to upload stems archive'}
                </span>
                {stemsFileObj && (
                  <span className="text-[10px] text-[#2dd4bf] block mt-1 font-mono">
                    {(stemsFileObj.size / (1024 * 1024)).toFixed(1)} MB selected ✓
                  </span>
                )}
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Kick, Snare, Hi-Hats, Bass, Melodies (.zip up to 1GB)
                </span>
                <input
                  type="file"
                  accept=".zip,.rar,.tar,application/zip,application/x-zip-compressed"
                  onChange={(e) => setStemsFileObj(e.target.files?.[0] || null)}
                  className="sr-only"
                  id="stems-zip-input"
                />
                <span className="mt-3 inline-block px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 rounded pointer-events-none">
                  Choose ZIP Archive
                </span>
              </label>
            </div>

            {/* Cover Artwork */}
            <div className="pt-2 border-t border-zinc-800/80">
              <ArtworkUploader
                initialArtworkUrl={coverPresetUrl}
                onArtworkChange={(file, presetUrl) => {
                  setCoverFileObj(file);
                  setCoverPresetUrl(presetUrl);
                }}
                title="Cover Artwork"
                description="Upload custom square artwork (PNG, JPG, WebP) or choose a Caution Studio preset cover."
              />
            </div>
          </div>

          {/* Beat Information */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-white">2. Beat Details & Tagging</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Beat Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lagos Nights (Afrobeats Club Banger)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Genre *</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                >
                  <option value="Afrobeats">Afrobeats</option>
                  <option value="Amapiano">Amapiano</option>
                  <option value="Lo-Fi">Lo-Fi</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Afropop">Afropop</option>
                  <option value="Hip-Hop">Hip-Hop / Trap</option>
                  <option value="R&B">R&B / Soul</option>
                  <option value="Cinematic">Cinematic</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Tempo (BPM) *</label>
                <input
                  type="number"
                  required
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                  placeholder="110"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Musical Key *</label>
                <input
                  type="text"
                  required
                  value={musicalKey}
                  onChange={(e) => setMusicalKey(e.target.value)}
                  placeholder="e.g. F Minor"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Artist / Mood Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma-separated keywords"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-2 px-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Verification Boost */}
        <div className="space-y-6">
          {/* Beat Distribution Model Toggle: Paid Beat vs Free Beat */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">3. Distribution Model</h3>
                <p className="text-[11px] text-zinc-400">Choose whether this beat is for paid commercial licensing or free download</p>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full ${
                isFreeBeat
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/30'
              }`}>
                {isFreeBeat ? 'FREE BEAT' : 'PAID BEAT'}
              </span>
            </div>

            {/* Segmented Toggle Control */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-zinc-950 border border-zinc-800">
              <button
                type="button"
                onClick={() => setIsFreeBeat(false)}
                className={`py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isFreeBeat
                    ? 'bg-[#2dd4bf] text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                <span>Paid Beat (For Sale)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFreeBeat(true)}
                className={`py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isFreeBeat
                    ? 'bg-emerald-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Free Beat (100% Free)</span>
              </button>
            </div>
          </div>

          {/* PAID BEAT: Commercial License Pricing (Only shown for Paid Beat) */}
          {!isFreeBeat && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Commercial License Pricing</h3>
                <span className="text-[10px] font-mono text-zinc-500">80% Producer Cut</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Set separate license prices for upcoming artists (Starter), commercial record labels (Premium), and exclusive buyers.
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-zinc-200">
                      Starter / Basic MP3 Lease
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">100k streams</span>
                  </div>
                  <input
                    type="number"
                    value={priceBasic}
                    onChange={(e) => setPriceBasic(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-1.5 px-3 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-700"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Your cut (80%): ₦{((Number(priceBasic) || 0) * 0.8).toLocaleString()}</span>
                </div>

                <div className="p-3 rounded-md bg-zinc-950 border border-[#2dd4bf]/30">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-[#2dd4bf]">
                      Premium Beat Plan (WAV Master + Stems)
                    </label>
                    <span className="text-[10px] text-[#2dd4bf] font-mono">500k streams</span>
                  </div>
                  <input
                    type="number"
                    value={pricePremium}
                    onChange={(e) => setPricePremium(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-1.5 px-3 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-700"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Your cut (80%): ₦{((Number(pricePremium) || 0) * 0.8).toLocaleString()}</span>
                </div>

                <div className="p-3 rounded-md bg-zinc-950 border border-purple-500/30">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-purple-300">
                      100% Exclusive Rights Buyout (1-of-1 Ownership)
                    </label>
                    <span className="text-[10px] text-purple-300 font-mono">Unlimited Master</span>
                  </div>
                  <input
                    type="number"
                    value={priceExclusive}
                    onChange={(e) => setPriceExclusive(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-1.5 px-3 text-xs text-purple-200 font-mono font-bold focus:outline-none focus:border-zinc-700"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Your cut (80%): ₦{((Number(priceExclusive) || 0) * 0.8).toLocaleString()} · Permanently removed from store</span>
                </div>
              </div>
            </div>
          )}

          {/* FREE BEAT: Reward & Download Boost (Only shown for Free Beat) */}
          {isFreeBeat && (
            <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/90 to-zinc-950 p-5 shadow-sm space-y-3 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-bold text-white block">
                    Free Beat Community Distribution &amp; Rewards
                  </span>
                  <span className="text-xs text-emerald-300 font-medium block mt-0.5">
                    Earn ₦30,000 per 10k downloads &amp; support upcoming talent
                  </span>
                  <p className="text-[11px] text-zinc-300 block mt-1.5 leading-relaxed">
                    This beat will be available for <strong>100% Free Download</strong> on Caution Studio so artists can record demos, rehearse, and create songs in the Studio.
                  </p>
                  <div className="mt-3 p-3 rounded-lg bg-zinc-950/80 border border-emerald-500/20 text-[11px] text-emerald-200/90 space-y-1 font-mono">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Zero cost to artists (100% Free Download)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>₦30,000 producer royalty payout per 10,000 downloads</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Boosts your ranking toward Verified Producer badge</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="space-y-2">
            {loading && (
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 font-medium flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 text-[#2dd4bf] animate-spin" />
                    <span>{uploadStep || 'Uploading beat files...'}</span>
                  </span>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <span className="font-mono text-[#2dd4bf] font-bold text-[11px]">{uploadProgress}%</span>
                  )}
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#2dd4bf] h-1.5 rounded-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{uploadStep || 'Publishing Beat to Catalog...'}</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 stroke-[2.5]" />
                  <span>Publish Beat to Catalog</span>
                </>
              )}
            </button>

            <Link
              href="/beats"
              className="w-full py-2 px-4 rounded-md border border-zinc-800 text-zinc-400 hover:text-white text-xs font-medium flex items-center justify-center transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </CreatorShell>
  );
}
