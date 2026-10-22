'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CreatorShell } from '../../components/CreatorShell';
import {
  Music2,
  Plus,
  Search,
  SlidersHorizontal,
  Play,
  Pause,
  MoreVertical,
  Download,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';

export default function BeatsCatalogPage() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGenre, setFilterGenre] = useState('all');

  const initialBeats = [
    {
      id: 'beat-1',
      title: 'Lagos Nights (Afrobeats Master)',
      genre: 'Afrobeats',
      bpm: 105,
      key: 'F Minor',
      duration: '3:12',
      stemsUploaded: true,
      priceBasicNgn: 3000,
      pricePremiumNgn: 30000,
      priceExclusiveNgn: 100000,
      streamsCount: 48200,
      salesCount: 14,
      status: 'live',
      coverUrl: '/images/album_neon_dj.jpg'
    },
    {
      id: 'beat-2',
      title: 'Piano Fever - Amapiano Stems',
      genre: 'Amapiano',
      bpm: 113,
      key: 'C Major',
      duration: '3:45',
      stemsUploaded: true,
      priceBasicNgn: 3000,
      pricePremiumNgn: 30000,
      priceExclusiveNgn: 120000,
      streamsCount: 34900,
      salesCount: 19,
      status: 'live',
      coverUrl: '/images/artist_studio_mic.jpg'
    },
    {
      id: 'beat-3',
      title: 'Midnight Drift Chill Hop',
      genre: 'Lo-Fi',
      bpm: 88,
      key: 'D Minor',
      duration: '2:30',
      stemsUploaded: false,
      priceBasicNgn: 3000,
      pricePremiumNgn: 25000,
      priceExclusiveNgn: 80000,
      streamsCount: 21100,
      salesCount: 8,
      status: 'live',
      coverUrl: '/images/studio_mixing_console.jpg'
    },
    {
      id: 'beat-4',
      title: 'Neon Overdrive Synthwave',
      genre: 'Electronic',
      bpm: 128,
      key: 'A Minor',
      duration: '3:05',
      stemsUploaded: true,
      priceBasicNgn: 3000,
      pricePremiumNgn: 30000,
      priceExclusiveNgn: 95000,
      streamsCount: 16400,
      salesCount: 5,
      status: 'live',
      coverUrl: '/images/hero_boombox.jpg'
    },
    {
      id: 'beat-5',
      title: 'Sunset Afropop Groove',
      genre: 'Afropop',
      bpm: 102,
      key: 'G Major',
      duration: '2:55',
      stemsUploaded: true,
      priceBasicNgn: 3000,
      pricePremiumNgn: 35000,
      priceExclusiveNgn: 150000,
      streamsCount: 9200,
      salesCount: 2,
      status: 'sold_exclusive',
      coverUrl: '/images/album_sunrise.jpg'
    }
  ];

  const filteredBeats = initialBeats.filter((b) => {
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
            Manage your audio masters, trackout stems, license tiers, and live distribution
          </p>
        </div>

        <Link
          href="/beats/upload"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-semibold transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Upload New Beat</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search beats by title or genre..."
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-md py-1.5 px-2.5 text-xs text-zinc-300 focus:outline-none"
          >
            <option value="all">All Genres</option>
            <option value="Afrobeats">Afrobeats</option>
            <option value="Amapiano">Amapiano</option>
            <option value="Lo-Fi">Lo-Fi</option>
            <option value="Electronic">Electronic</option>
            <option value="Afropop">Afropop</option>
          </select>

          <span className="text-xs text-zinc-500 font-mono">
            {filteredBeats.length} beats
          </span>
        </div>
      </div>

      {/* Beats Catalog Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Track</th>
                <th className="py-3 px-4">BPM / Key</th>
                <th className="py-3 px-4">Stems</th>
                <th className="py-3 px-4">License Pricing</th>
                <th className="py-3 px-4 text-center">Streams</th>
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
                        onClick={() => setPlayingId(playingId === beat.id ? null : beat.id)}
                        className="h-8 w-8 rounded bg-zinc-800 hover:bg-[#2dd4bf] hover:text-black flex items-center justify-center shrink-0 transition-colors text-zinc-300"
                      >
                        {playingId === beat.id ? (
                          <Pause className="h-3.5 w-3.5" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                        )}
                      </button>
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
                        title="Edit Beat"
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Delete Track"
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors"
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
      </div>
    </CreatorShell>
  );
}
