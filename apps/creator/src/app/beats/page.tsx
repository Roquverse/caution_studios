'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreatorShell } from '../../components/CreatorShell';
import { supabase } from '../../lib/supabaseClient';
import {
  Music2,
  Plus,
  Search,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { UpdateArtworkModal } from '../../components/UpdateArtworkModal';

function formatDbBeat(b: any) {
  const licenses = b.licenses || [];
  const basic = licenses.find((l: any) => l.type === 'basic');
  const premium = licenses.find((l: any) => l.type === 'premium');
  const exclusive = licenses.find((l: any) => l.type === 'exclusive');

  const durM = Math.floor((b.duration_seconds || 180) / 60);
  const durS = (b.duration_seconds || 180) % 60;
  const audioKey = b.master_wav_key || b.preview_clean_key || b.preview_tagged_key;
  let audioUrl = '';
  if (audioKey) {
    audioUrl = audioKey.startsWith('http') || audioKey.startsWith('/') ? audioKey : `/api/media/${audioKey}`;
  } else {
    audioUrl = '/api/media/masters/alex-morgan-afrobeat-instrumental-summer-groove-573648-hubz_1791151613114.mp3';
  }

  return {
    id: b.id,
    title: b.title,
    genre: b.genre || 'Afrobeats',
    bpm: b.bpm || 110,
    key: b.musical_key || 'C Minor',
    duration: `${durM}:${durS.toString().padStart(2, '0')}`,
    stemsUploaded: Boolean(b.stems_zip_key),
    priceBasicNgn: basic ? Math.round(basic.price_cents / 100) : 3000,
    pricePremiumNgn: premium ? Math.round(premium.price_cents / 100) : 30000,
    priceExclusiveNgn: exclusive ? Math.round(exclusive.price_cents / 100) : 100000,
    streamsCount: b.play_count || 0,
    salesCount: b.sales_count || (b.status === 'sold' ? 1 : 0),
    status: b.status === 'sold' ? 'sold_exclusive' : (b.status || 'live'),
    coverUrl: b.cover_url || '/images/studio_mixing_console.jpg',
    audioUrl
  };
}

export default function BeatsCatalogPage() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState('all');
  const [beatsList, setBeatsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [artworkModalBeat, setArtworkModalBeat] = useState<{ id: string; title: string; coverUrl?: string } | null>(null);

  // Fetch only this producer's real beats from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadRealBeats() {
      try {
        setIsLoading(true);
        let { data: { session } } = await supabase.auth.getSession();

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

        if (userId) {
          const { data: userBeats, error: userError } = await supabase
            .from('beats')
            .select(`
              *,
              licenses:beat_licenses (
                type,
                price_cents,
                enabled
              )
            `)
            .eq('producer_id', userId)
            .order('created_at', { ascending: false });

          if (!userError && userBeats && isMounted) {
            setBeatsList(userBeats.map(formatDbBeat));
          }
        }
      } catch (err) {
        console.warn('Failed to load real beats for creator catalog:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRealBeats();
    return () => {
      isMounted = false;
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, []);

  const togglePlay = (id: string, audioUrl?: string) => {
    if (playingId === id) {
      if (audioElement) audioElement.pause();
      setPlayingId(null);
    } else {
      if (audioElement) audioElement.pause();
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(() => {});
        audio.onended = () => setPlayingId(null);
        setAudioElement(audio);
        setPlayingId(id);
      } else {
        setPlayingId(id);
      }
    }
  };

  const handleDeleteBeat = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from your catalog?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('beats')
        .delete()
        .eq('id', id);

      if (!error) {
        setBeatsList((prev) => prev.filter((b) => b.id !== id));
      } else {
        alert('Could not delete beat. Please try again.');
      }
    } catch (e) {
      console.error('Error deleting beat:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBeats = beatsList.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = filterGenre === 'all' || b.genre.toLowerCase() === filterGenre.toLowerCase();
    return matchesSearch && matchesGenre;
  });

  return (
    <CreatorShell>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Beat Catalog Management
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your master files, pricing, stem archives, and commercial license availability
          </p>
        </div>

        <Link
          href="/beats/upload"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Upload Beat</span>
        </Link>
      </div>

      {/* Catalog Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog by title or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 pl-9 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Genre:</span>
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 py-1.5 px-2.5 rounded-md focus:outline-none focus:border-zinc-700"
          >
            <option value="all">All Genres</option>
            <option value="afrobeats">Afrobeats</option>
            <option value="amapiano">Amapiano</option>
            <option value="lo-fi">Lo-Fi</option>
            <option value="electronic">Electronic</option>
            <option value="afropop">Afropop</option>
          </select>
        </div>
      </div>

      {/* Beats Table Card */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-7 w-7 text-[#2dd4bf] animate-spin" />
            <span className="text-xs font-mono text-zinc-400">Loading your beat catalog...</span>
          </div>
        ) : filteredBeats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Track</th>
                  <th className="py-3 px-4">BPM / Key</th>
                  <th className="py-3 px-4">Stems ZIP</th>
                  <th className="py-3 px-4">License Pricing</th>
                  <th className="py-3 px-4 text-center">Plays</th>
                  <th className="py-3 px-4 text-center">Sales</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredBeats.map((beat) => (
                  <tr key={beat.id} className="hover:bg-zinc-800/30 transition-colors">
                    {/* Track Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => togglePlay(beat.id, beat.audioUrl)}
                          className="h-8 w-8 rounded bg-zinc-800 hover:bg-[#2dd4bf] hover:text-black flex items-center justify-center shrink-0 transition-colors text-zinc-300"
                        >
                          {playingId === beat.id ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          )}
                        </button>

                        {/* Beat Artwork Thumbnail */}
                        <div
                          onClick={() => setArtworkModalBeat(beat)}
                          className="relative h-10 w-10 rounded-lg overflow-hidden shrink-0 border border-zinc-700/80 bg-zinc-950 group cursor-pointer shadow-xs"
                          title="Click to view/change artwork"
                        >
                          <img
                            src={beat.coverUrl}
                            alt={beat.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#2dd4bf]">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <span className="font-semibold text-white block truncate max-w-[200px]">
                            {beat.title}
                          </span>
                          <span className="text-[10px] text-zinc-400 block font-mono">
                            {beat.genre} · {beat.duration}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* BPM & Key */}
                    <td className="py-3 px-4 font-mono text-zinc-300">
                      <div>{beat.bpm} BPM</div>
                      <div className="text-[10px] text-zinc-500">{beat.key}</div>
                    </td>

                    {/* Stems Status */}
                    <td className="py-3 px-4">
                      {beat.stemsUploaded ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Ready (WAV)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>Stems Missing</span>
                        </span>
                      )}
                    </td>

                    {/* License Pricing */}
                    <td className="py-3 px-4 font-mono text-[11px] space-y-0.5">
                      <div className="text-zinc-300">
                        Basic: ₦{beat.priceBasicNgn.toLocaleString()}
                      </div>
                      <div className="text-zinc-400">
                        Prem: ₦{beat.pricePremiumNgn.toLocaleString()}
                      </div>
                      <div className="text-[#2dd4bf]">
                        Excl: ₦{beat.priceExclusiveNgn.toLocaleString()}
                      </div>
                    </td>

                    {/* Streams */}
                    <td className="py-3 px-4 text-center font-mono text-zinc-300">
                      {beat.streamsCount.toLocaleString()}
                    </td>

                    {/* Sales */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-white">
                      {beat.salesCount}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {beat.status === 'live' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Live
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          Sold Exclusive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setArtworkModalBeat(beat)}
                          title="Change Artwork"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-zinc-300 hover:text-[#2dd4bf] hover:bg-zinc-800 rounded transition-colors text-[11px] font-medium border border-zinc-800 hover:border-zinc-700"
                        >
                          <ImageIcon className="h-3.5 w-3.5 text-[#2dd4bf]" />
                          <span className="hidden sm:inline">Artwork</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBeat(beat.id, beat.title)}
                          disabled={deletingId === beat.id}
                          title="Delete Track"
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center space-y-3 px-4">
            <UploadCloud className="h-10 w-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">Your Beat Catalog is Empty</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              You haven&apos;t uploaded any beats yet. Click below to publish your first instrumental to Caution Studio and start earning 80% on every sale and monthly streaming royalties.
            </p>
            <div className="pt-2">
              <Link
                href="/beats/upload"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-bold transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Upload First Beat</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modal for updating beat artwork */}
      <UpdateArtworkModal
        beat={artworkModalBeat}
        isOpen={Boolean(artworkModalBeat)}
        onClose={() => setArtworkModalBeat(null)}
        onSuccess={(beatId, newCoverUrl) => {
          setBeatsList((prev) =>
            prev.map((b) => (b.id === beatId ? { ...b, coverUrl: newCoverUrl } : b))
          );
        }}
      />
    </CreatorShell>
  );
}
