'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AdminShell } from '../../components/AdminShell';
import {
  Plus,
  Search,
  RefreshCw,
  Play,
  Pause,
  Edit,
  Trash2,
  FileAudio,
  Image as ImageIcon,
  Layers,
  CheckCircle,
  X,
  Filter,
  Music,
  Sliders,
  Sparkles
} from 'lucide-react';

export interface BeatTrack {
  id: string;
  slug: string;
  title: string;
  description?: string;
  genre: string;
  moods?: string[];
  tags?: string[];
  bpm?: number;
  musical_key?: string;
  cover_url?: string;
  master_wav_key?: string;
  preview_clean_key?: string;
  stems_zip_key?: string;
  duration_seconds?: number;
  status: 'draft' | 'live' | 'unlisted' | 'archived';
  created_at: string;
  producer?: {
    id?: string;
    display_name?: string;
    handle?: string;
    avatar_url?: string;
  };
  licenses?: Array<{
    type: 'basic' | 'premium' | 'exclusive';
    price_cents: number;
    enabled: boolean;
  }>;
}

export default function AdminTracksPage() {
  const [tracks, setTracks] = useState<BeatTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Audio Playback
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Upload Form Fields
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('Cinematic');
  const [mood, setMood] = useState('Epic');
  const [bpm, setBpm] = useState<number | ''>('');
  const [musicalKey, setMusicalKey] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'live' | 'draft' | 'unlisted'>('live');

  // License Pricing in Naira (NGN ₦)
  const [basicPrice, setBasicPrice] = useState<number | ''>('');
  const [premiumPrice, setPremiumPrice] = useState<number | ''>('');
  const [exclusivePrice, setExclusivePrice] = useState<number | ''>('');

  // Files
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [stemsFile, setStemsFile] = useState<File | null>(null);

  // Edit Modal & Price Editing
  const [editingTrack, setEditingTrack] = useState<BeatTrack | null>(null);
  const [editPriceNgn, setEditPriceNgn] = useState<number>(15000);
  const [editPremiumPriceNgn, setEditPremiumPriceNgn] = useState<number>(35000);
  const [editSaving, setEditSaving] = useState(false);

  // Dynamic Genres fetched from API
  const [genreOptions, setGenreOptions] = useState<string[]>([
    'Afrobeats',
    'Amapiano',
    'Cinematic',
    'Electronic',
    'Hip Hop',
    'R&B',
    'Funk',
    'Lofi',
    'Pop',
    'Rock'
  ]);

  useEffect(() => {
    fetchTracks();
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const res = await fetch('/api/genres');
      if (res.ok) {
        const data = await res.json();
        if (data.genres && Array.isArray(data.genres)) {
          const names = data.genres.map((g: any) => g.name);
          setGenreOptions(names);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch genres from API:', err);
    }
  };

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tracks');
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
      }
    } catch (err) {
      console.error('Failed to load tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);

      if (!title) {
        const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(clean.charAt(0).toUpperCase() + clean.slice(1));
      }

      try {
        const temp = new Audio(URL.createObjectURL(file));
        temp.onloadedmetadata = () => {
          if (temp.duration && !isNaN(temp.duration)) {
            setDurationSeconds(Math.round(temp.duration));
          }
        };
      } catch (err) {
        console.warn('Duration detection error', err);
      }
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setUploadError('Track title is required');
      return;
    }
    if (!audioFile) {
      setUploadError('Master audio file (WAV or MP3) is required');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('artist', artist.trim() || 'Caution Studio');
      formData.append('genre', genre);
      formData.append('bpm', bpm ? bpm.toString() : '120');
      formData.append('musicalKey', musicalKey.trim() || 'C Minor');
      formData.append('durationSeconds', durationSeconds.toString());
      formData.append('description', description.trim());
      formData.append('status', status);
      formData.append('moods', mood);
      formData.append('tags', tags.trim());

      const finalBasic = typeof basicPrice === 'number' && basicPrice > 0 ? basicPrice : 15000;
      const finalPremium = typeof premiumPrice === 'number' && premiumPrice > 0 ? premiumPrice : 45000;
      const finalExclusive = typeof exclusivePrice === 'number' && exclusivePrice > 0 ? exclusivePrice : 250000;

      formData.append('basicPrice', Math.round(finalBasic * 100).toString());
      formData.append('premiumPrice', Math.round(finalPremium * 100).toString());
      formData.append('exclusivePrice', Math.round(finalExclusive * 100).toString());

      formData.append('audio', audioFile);
      if (coverFile) formData.append('cover', coverFile);
      if (stemsFile) formData.append('stems', stemsFile);

      const res = await fetch('/api/tracks', {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to upload master track');
      }

      setUploadSuccess(true);
      setTimeout(() => {
        setIsUploadOpen(false);
        setUploadSuccess(false);
        resetUploadForm();
        fetchTracks();
      }, 1000);
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading track');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setTitle('');
    setArtist('');
    setGenre('Cinematic');
    setMood('Epic');
    setBpm('');
    setMusicalKey('');
    setDurationSeconds(0);
    setTags('');
    setDescription('');
    setStatus('live');
    setBasicPrice('');
    setPremiumPrice('');
    setExclusivePrice('');
    setAudioFile(null);
    setCoverFile(null);
    setCoverPreviewUrl(null);
    setStemsFile(null);
    setUploadError(null);
  };

  const togglePlayTrack = (track: BeatTrack) => {
    if (playingTrackId === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      const audioUrl = track.master_wav_key
        ? `/api/media/${track.master_wav_key}`
        : track.preview_clean_key
        ? `/api/media/${track.preview_clean_key}`
        : '';

      if (!audioUrl) {
        alert('No audio stream found for track.');
        return;
      }

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch((err) => console.warn('Play error:', err));
        setPlayingTrackId(track.id);
        setIsPlaying(true);
      }
    }
  };

  const handleDelete = async (track: BeatTrack) => {
    if (!confirm(`Are you sure you want to delete "${track.title}" from catalog and R2 storage?`)) {
      return;
    }

    try {
      if (playingTrackId === track.id) {
        audioRef.current?.pause();
        setPlayingTrackId(null);
        setIsPlaying(false);
      }

      const res = await fetch(`/api/tracks/${track.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to delete track');
        return;
      }

      setTracks(tracks.filter((t) => t.id !== track.id));
    } catch (err: any) {
      alert(err.message || 'Error deleting track');
    }
  };

  const toggleStatus = async (track: BeatTrack) => {
    const nextStatus = track.status === 'live' ? 'unlisted' : 'live';
    try {
      const res = await fetch(`/api/tracks/${track.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        setTracks(tracks.map((t) => (t.id === track.id ? { ...t, status: nextStatus } : t)));
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;

    try {
      setEditSaving(true);
      const basicPriceCents = Math.round(Number(editPriceNgn) * 100);
      const premiumPriceCents = Math.round(Number(editPremiumPriceNgn) * 100);

      const res = await fetch(`/api/tracks/${editingTrack.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingTrack.title,
          genre: editingTrack.genre,
          bpm: editingTrack.bpm,
          musical_key: editingTrack.musical_key,
          duration_seconds: editingTrack.duration_seconds,
          status: editingTrack.status,
          description: editingTrack.description,
          basicPrice: basicPriceCents,
          premiumPrice: premiumPriceCents
        })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to update track');
        return;
      }

      const resData = await res.json();
      const updatedBeat = resData.beat;

      setTracks((prev) =>
        prev.map((t) =>
          t.id === editingTrack.id
            ? {
                ...t,
                ...editingTrack,
                licenses: updatedBeat?.licenses || [
                  { id: 'basic', beat_id: editingTrack.id, type: 'basic', price_cents: basicPriceCents, enabled: true },
                  { id: 'premium', beat_id: editingTrack.id, type: 'premium', price_cents: premiumPriceCents, enabled: true }
                ]
              }
            : t
        )
      );
      setEditingTrack(null);
    } catch (err: any) {
      alert(err.message || 'Error updating track');
    } finally {
      setEditSaving(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getBasicPrice = (track: BeatTrack) => {
    const lic = track.licenses?.find((l) => l.type === 'basic');
    return lic?.price_cents ? `₦${(lic.price_cents / 100).toLocaleString('en-NG')}` : '₦15,000';
  };

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    genreOptions.forEach((g) => g && set.add(g));
    tracks.forEach((t) => t.genre && set.add(t.genre));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [genreOptions, tracks]);

  const filtered = tracks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.genre.toLowerCase().includes(search.toLowerCase()) ||
      (t.musical_key || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()));

    const matchesGenre = genreFilter === 'all' || t.genre.toLowerCase() === genreFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    return matchesSearch && matchesGenre && matchesStatus;
  });

  return (
    <AdminShell activePath="/tracks">
      <audio
        ref={audioRef}
        onEnded={() => {
          setIsPlaying(false);
          setPlayingTrackId(null);
        }}
        onError={() => {
          setIsPlaying(false);
          setPlayingTrackId(null);
        }}
      />

      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Master Catalog
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Upload master audio, manage license tiers, and monitor Cloudflare R2 synchronization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchTracks}
              className="p-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 transition-colors"
              title="Refresh Catalog"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-semibold text-xs px-3.5 py-1.5 rounded-md transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Upload Master Track</span>
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Count */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by title, genre, key..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-1.5 pl-8 pr-7 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Genre Select */}
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-md py-1.5 px-2.5 focus:outline-none focus:border-zinc-700"
            >
              <option value="all">All Genres</option>
              {allGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-md py-1.5 px-2.5 focus:outline-none focus:border-zinc-700"
            >
              <option value="all">All Statuses</option>
              <option value="live">Live</option>
              <option value="unlisted">Unlisted</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">
            {filtered.length} {filtered.length === 1 ? 'track' : 'tracks'} registered
          </span>
        </div>

        {/* Data Table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Track & Preview</th>
                  <th className="py-3 px-4">Producer</th>
                  <th className="py-3 px-4">Genre / Mood</th>
                  <th className="py-3 px-4">BPM & Key</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Basic Lease (₦)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-5 w-5 border-2 border-[#2dd4bf] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-zinc-500">Loading catalog...</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                      <Music className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                      <p className="font-medium text-zinc-300">No catalog recordings found</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {tracks.length === 0
                          ? 'Get started by uploading your first audio master.'
                          : 'Try clearing your filters.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((track) => {
                    const isTrackPlaying = playingTrackId === track.id && isPlaying;
                    return (
                      <tr
                        key={track.id}
                        className={`hover:bg-zinc-800/30 transition-colors ${
                          isTrackPlaying ? 'bg-[#2dd4bf]/5' : ''
                        }`}
                      >
                        {/* Artwork & Audition */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative group/play shrink-0">
                              <img
                                src={track.cover_url || '/images/album_neon_dj.jpg'}
                                alt={track.title}
                                className="h-10 w-10 rounded-md object-cover border border-zinc-800 shadow-xs"
                              />
                              <button
                                type="button"
                                onClick={() => togglePlayTrack(track)}
                                className={`absolute inset-0 rounded-md flex items-center justify-center transition-all ${
                                  isTrackPlaying
                                    ? 'bg-black/60 text-[#2dd4bf]'
                                    : 'bg-black/40 text-white opacity-0 group-hover/play:opacity-100'
                                }`}
                                title={isTrackPlaying ? 'Pause' : 'Play preview'}
                              >
                                {isTrackPlaying ? (
                                  <Pause className="h-4 w-4 fill-current" />
                                ) : (
                                  <Play className="h-4 w-4 fill-current ml-0.5" />
                                )}
                              </button>
                            </div>

                            <div className="min-w-0">
                              <span className="font-semibold text-white block truncate">
                                {track.title}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono truncate block">
                                /{track.slug}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Producer */}
                        <td className="py-3 px-4 text-zinc-300 font-medium">
                          {track.producer?.display_name || 'Caution Studio'}
                        </td>

                        {/* Genre / Mood */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                              {track.genre}
                            </span>
                            {track.moods && track.moods[0] && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#2dd4bf]/10 text-[#2dd4bf] border border-[#2dd4bf]/20">
                                {track.moods[0]}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* BPM & Key */}
                        <td className="py-3 px-4 font-mono text-zinc-300">
                          <div>{track.bpm || 120} BPM</div>
                          <div className="text-[10px] text-zinc-500">{track.musical_key || 'C Minor'}</div>
                        </td>

                        {/* Duration */}
                        <td className="py-3 px-4 font-mono text-zinc-400">
                          {formatDuration(track.duration_seconds)}
                        </td>

                        {/* Basic Price */}
                        <td className="py-3 px-4 font-mono font-medium text-emerald-400">
                          {getBasicPrice(track)}
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => toggleStatus(track)}
                            className={`inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-0.5 rounded-full border transition-all ${
                              track.status === 'live'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700/60'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                track.status === 'live' ? 'bg-emerald-400' : 'bg-zinc-400'
                              }`}
                            />
                            {track.status === 'live' ? 'Live' : 'Unlisted'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTrack(track);
                                const basicLic = track.licenses?.find((l) => l.type === 'basic');
                                const premLic = track.licenses?.find((l) => l.type === 'premium');
                                setEditPriceNgn(basicLic?.price_cents ? basicLic.price_cents / 100 : 15000);
                                setEditPremiumPriceNgn(premLic?.price_cents ? premLic.price_cents / 100 : 35000);
                              }}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                              title="Edit track"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(track)}
                              className="p-1.5 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete track"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload Master Modal (Shadcn Dialog Style) */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-xl border border-zinc-800 bg-[#0c0d10] p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Upload Master Recording
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Upload uncompressed audio to Cloudflare R2 and configure license pricing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-zinc-200">
              {uploadError && (
                <div className="p-3 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                  {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Track uploaded successfully to catalog!
                </div>
              )}

              {/* Master Audio Upload Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  1. Master Audio File <span className="text-rose-400">*</span>
                </label>
                <label
                  htmlFor="master-audio-file"
                  className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all block ${
                    audioFile
                      ? 'border-[#2dd4bf] bg-[#2dd4bf]/5'
                      : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40'
                  }`}
                >
                  <input
                    id="master-audio-file"
                    type="file"
                    accept="audio/*,.wav,.mp3,.flac"
                    className="hidden"
                    onChange={handleAudioChange}
                    disabled={uploading}
                  />
                  <FileAudio
                    className={`h-7 w-7 mx-auto mb-1.5 ${
                      audioFile ? 'text-[#2dd4bf]' : 'text-zinc-500'
                    }`}
                  />
                  {audioFile ? (
                    <div>
                      <span className="text-xs font-bold text-white block">{audioFile.name}</span>
                      <span className="text-[10px] text-[#2dd4bf] font-mono mt-0.5 block">
                        {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • Duration: {formatDuration(durationSeconds)}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-medium text-zinc-300 block">
                        Click to select master audio (WAV, MP3, FLAC)
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-0.5 block">
                        Direct upload to Cloudflare R2
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* Cover Image & Stems Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cover Art */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    2. Cover Artwork
                  </label>
                  <label
                    htmlFor="cover-artwork-file"
                    className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all flex items-center gap-2.5 ${
                      coverPreviewUrl
                        ? 'border-[#2dd4bf]/60 bg-zinc-900'
                        : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40'
                    }`}
                  >
                    <input
                      id="cover-artwork-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverChange}
                      disabled={uploading}
                    />
                    {coverPreviewUrl ? (
                      <img
                        src={coverPreviewUrl}
                        alt="Preview"
                        className="h-10 w-10 rounded object-cover border border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                    <div className="text-left min-w-0">
                      <span className="text-xs font-medium text-white block truncate">
                        {coverFile ? coverFile.name : 'Select Image'}
                      </span>
                      <span className="text-[10px] text-zinc-500">JPG, PNG, WebP</span>
                    </div>
                  </label>
                </div>

                {/* Stems ZIP */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    3. Stems ZIP Archive (Optional)
                  </label>
                  <label
                    htmlFor="stems-archive-file"
                    className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all flex items-center gap-2.5 ${
                      stemsFile
                        ? 'border-[#2dd4bf]/60 bg-zinc-900'
                        : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40'
                    }`}
                  >
                    <input
                      id="stems-archive-file"
                      type="file"
                      accept=".zip,.rar"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setStemsFile(e.target.files[0]);
                        }
                      }}
                      disabled={uploading}
                    />
                    <div className="h-10 w-10 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="text-xs font-medium text-white block truncate">
                        {stemsFile ? stemsFile.name : 'Select Stems'}
                      </span>
                      <span className="text-[10px] text-zinc-500">ZIP archive</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Title & Artist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Track Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Midnight Cyberpunk"
                    className="w-full text-xs rounded-md border border-zinc-800 p-2 bg-zinc-900 text-white focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Artist / Producer Name
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Caution Studio"
                    className="w-full text-xs rounded-md border border-zinc-800 p-2 bg-zinc-900 text-white focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>
              </div>

              {/* Genre, Mood, BPM, Key */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Genre</label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full text-xs rounded-md border border-zinc-800 p-2 bg-zinc-900 text-white focus:outline-none focus:border-[#2dd4bf]"
                  >
                    {allGenres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Mood</label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full text-xs rounded-md border border-zinc-800 p-2 bg-zinc-900 text-white focus:outline-none focus:border-[#2dd4bf]"
                  >
                    <option value="Epic">Epic</option>
                    <option value="Uplifting">Uplifting</option>
                    <option value="Chill">Chill</option>
                    <option value="Dark">Dark</option>
                    <option value="Energetic">Energetic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">BPM</label>
                  <input
                    type="number"
                    value={bpm}
                    onChange={(e) => setBpm(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="120"
                    className="w-full text-xs rounded-md border border-zinc-800 p-2 bg-zinc-900 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Key</label>
                  <input
                    type="text"
                    value={musicalKey}
                    onChange={(e) => setMusicalKey(e.target.value)}
                    placeholder="e.g. C Minor"
                    className="w-full text-xs rounded-md border border-zinc-800 p-2 bg-zinc-900 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>
              </div>

              {/* License Pricing Grid */}
              <div className="rounded-lg border border-zinc-800 p-3 bg-zinc-900/40 space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                  License Pricing (NGN ₦)
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-0.5">Basic (₦)</label>
                    <input
                      type="number"
                      step="1000"
                      value={basicPrice}
                      onChange={(e) => setBasicPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="15000"
                      className="w-full text-xs rounded-md border border-zinc-800 p-1.5 bg-zinc-900 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2dd4bf]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-0.5">Premium (₦)</label>
                    <input
                      type="number"
                      step="1000"
                      value={premiumPrice}
                      onChange={(e) => setPremiumPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="45000"
                      className="w-full text-xs rounded-md border border-zinc-800 p-1.5 bg-zinc-900 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2dd4bf]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-0.5">Exclusive (₦)</label>
                    <input
                      type="number"
                      step="5000"
                      value={exclusivePrice}
                      onChange={(e) => setExclusivePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="250000"
                      className="w-full text-xs rounded-md border border-zinc-800 p-1.5 bg-zinc-900 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2dd4bf]"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => setIsUploadOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-1.5 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-semibold"
                >
                  {uploading ? (
                    <div className="flex items-center gap-1.5">
                      <div className="h-3.5 w-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>Uploading to R2...</span>
                    </div>
                  ) : (
                    'Publish Master Track'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-[#0c0d10] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
              <h2 className="text-base font-bold text-white tracking-tight">
                Edit: {editingTrack.title}
              </h2>
              <button
                type="button"
                onClick={() => setEditingTrack(null)}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-3 text-zinc-200">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingTrack.title}
                  onChange={(e) => setEditingTrack({ ...editingTrack, title: e.target.value })}
                  className="w-full text-xs rounded-md border border-zinc-800 p-2 bg-zinc-900 text-white focus:outline-none focus:border-[#2dd4bf]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Genre</label>
                  <select
                    value={editingTrack.genre}
                    onChange={(e) => setEditingTrack({ ...editingTrack, genre: e.target.value })}
                    className="w-full text-xs rounded-md border border-zinc-800 p-2 bg-zinc-900 text-white focus:outline-none focus:border-[#2dd4bf]"
                  >
                    {allGenres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                    {editingTrack.genre && !allGenres.includes(editingTrack.genre) && (
                      <option value={editingTrack.genre}>{editingTrack.genre}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Status</label>
                  <select
                    value={editingTrack.status}
                    onChange={(e) => setEditingTrack({ ...editingTrack, status: e.target.value as any })}
                    className="w-full text-xs rounded-md border border-zinc-800 p-2 bg-zinc-900 text-white focus:outline-none focus:border-[#2dd4bf]"
                  >
                    <option value="live">Live</option>
                    <option value="unlisted">Unlisted</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Editable License Prices */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Basic Lease Price (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-mono text-zinc-500">₦</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={editPriceNgn}
                      onChange={(e) => setEditPriceNgn(Number(e.target.value))}
                      className="w-full text-xs rounded-md border border-zinc-800 pl-7 p-2 bg-zinc-900 text-white font-mono focus:outline-none focus:border-[#2dd4bf]"
                      placeholder="15000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Premium Lease Price (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs font-mono text-zinc-500">₦</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={editPremiumPriceNgn}
                      onChange={(e) => setEditPremiumPriceNgn(Number(e.target.value))}
                      className="w-full text-xs rounded-md border border-zinc-800 pl-7 p-2 bg-zinc-900 text-white font-mono focus:outline-none focus:border-[#2dd4bf]"
                      placeholder="35000"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">BPM</label>
                  <input
                    type="number"
                    value={editingTrack.bpm || ''}
                    onChange={(e) => setEditingTrack({ ...editingTrack, bpm: e.target.value === '' ? 0 : Number(e.target.value) })}
                    placeholder="120"
                    className="w-full text-xs rounded-md border border-zinc-800 p-2 bg-zinc-900 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Key</label>
                  <input
                    type="text"
                    value={editingTrack.musical_key || ''}
                    onChange={(e) => setEditingTrack({ ...editingTrack, musical_key: e.target.value })}
                    placeholder="e.g. C Minor"
                    className="w-full text-xs rounded-md border border-zinc-800 p-2 bg-zinc-900 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2dd4bf]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingTrack(null)}
                  className="px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-1.5 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-semibold"
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
