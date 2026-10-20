'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminShell } from '../../components/AdminShell';
import {
  FileText,
  ShieldCheck,
  Music,
  Users,
  Search,
  RefreshCw,
  ExternalLink,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  FileCheck2,
  Sparkles,
  Layers,
  Award
} from 'lucide-react';

interface Producer {
  id: string;
  display_name: string;
  handle: string;
  avatar_url?: string | null;
}

interface SongItem {
  id: string;
  title: string;
  slug: string;
  genre: string;
  bpm: number;
  cover_url: string;
  status: string;
  duration_seconds: number;
  created_at: string;
  uploader: Producer;
  licenseTiers: Array<{
    type: string;
    price_cents: number;
    enabled: boolean;
  }>;
  generatedLicenseCount: number;
}

interface IssuedLicense {
  id: string;
  type: 'basic' | 'premium' | 'exclusive';
  stream_cap: number;
  video_cap: number;
  agreement_pdf_key: string;
  issued_at: string;
  price_cents: number;
  reference: string;
  song: {
    id: string;
    title: string;
    slug: string;
    genre: string;
    cover_url: string;
  };
  producer: Producer;
  buyer: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string | null;
  };
}

export default function AdminLicensesPage() {
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [issuedLicenses, setIssuedLicenses] = useState<IssuedLicense[]>([]);
  const [metrics, setMetrics] = useState({
    totalSongs: 0,
    totalIssued: 0,
    totalIssuedRevenue: 0,
    uniqueProducers: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'issued' | 'catalog'>('issued');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'basic' | 'premium' | 'exclusive'>('all');
  const [selectedLicense, setSelectedLicense] = useState<IssuedLicense | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/licenses');
      if (res.ok) {
        const data = await res.json();
        setSongs(data.songs || []);
        setIssuedLicenses(data.issuedLicenses || []);
        if (data.metrics) setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNaira = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatPriceCents = (cents?: number) => {
    if (!cents) return '₦0.00';
    return formatNaira(cents / 100);
  };

  // Filter issued licenses
  const filteredIssued = issuedLicenses.filter((lic) => {
    const matchesSearch =
      lic.song.title.toLowerCase().includes(search.toLowerCase()) ||
      lic.producer.display_name.toLowerCase().includes(search.toLowerCase()) ||
      lic.producer.handle.toLowerCase().includes(search.toLowerCase()) ||
      lic.buyer.display_name.toLowerCase().includes(search.toLowerCase()) ||
      lic.buyer.handle.toLowerCase().includes(search.toLowerCase()) ||
      lic.reference.toLowerCase().includes(search.toLowerCase()) ||
      lic.id.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'all' || lic.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Filter songs
  const filteredSongs = songs.filter((s) => {
    return (
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.genre.toLowerCase().includes(search.toLowerCase()) ||
      s.uploader.display_name.toLowerCase().includes(search.toLowerCase()) ||
      s.uploader.handle.toLowerCase().includes(search.toLowerCase())
    );
  });

  const getLicenseBadgeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'exclusive':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'premium':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-[#2dd4bf]/15 text-[#2dd4bf] border-[#2dd4bf]/30';
    }
  };

  return (
    <AdminShell activePath="/licenses">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Licenses</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              All master tracks, their generated commercial licenses, legal agreements, and uploading producers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              title="Refresh Licenses"
              className="p-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <Link
              href="/tracks"
              className="inline-flex items-center gap-1.5 bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-semibold text-xs px-3.5 py-1.5 rounded-md transition-colors shadow-sm"
            >
              <Music className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Catalog Tracks</span>
            </Link>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium text-zinc-400">Total Songs</span>
              <Music className="h-4 w-4 text-[#2dd4bf]" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {loading ? '-' : metrics.totalSongs}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Cataloged beats & recordings</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium text-zinc-400">Generated Licenses</span>
              <Award className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {loading ? '-' : metrics.totalIssued}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Issued commercial certificates</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium text-zinc-400">Uploading Producers</span>
              <Users className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {loading ? '-' : metrics.uniqueProducers}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Verified creator uploaders</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-medium text-zinc-400">License Volume</span>
              <ShieldCheck className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white tracking-tight">
              {loading ? '-' : formatNaira(metrics.totalIssuedRevenue)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Processed license fees</p>
          </div>
        </div>

        {/* View Tabs & Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('issued')}
              className={`pb-3 -mb-[13px] transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'issued'
                  ? 'border-[#2dd4bf] text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Generated Licenses ({issuedLicenses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`pb-3 -mb-[13px] transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'border-[#2dd4bf] text-white font-semibold'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>All Songs & License Tiers ({songs.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search song, producer, buyer, ID..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-1.5 pl-8 pr-7 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#2dd4bf]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            {activeTab === 'issued' && (
              <select
                value={typeFilter}
                onChange={(e: any) => setTypeFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-md py-1.5 px-2.5 focus:outline-none focus:border-[#2dd4bf]"
              >
                <option value="all">All Tiers</option>
                <option value="basic">Basic Lease</option>
                <option value="premium">Premium Lease</option>
                <option value="exclusive">Exclusive Buyout</option>
              </select>
            )}
          </div>
        </div>

        {/* TAB 1: Generated / Issued Licenses */}
        {activeTab === 'issued' && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xs">
            {loading ? (
              <div className="py-16 text-center text-zinc-500 text-xs">
                Loading generated licenses...
              </div>
            ) : filteredIssued.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-xs space-y-2">
                <FileText className="h-8 w-8 text-zinc-600 mx-auto stroke-1" />
                <p>No generated licenses match your current search.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Song Recording</th>
                      <th className="py-3 px-4">Uploaded By (Producer)</th>
                      <th className="py-3 px-4">Licensed To (Buyer)</th>
                      <th className="py-3 px-4">License Type</th>
                      <th className="py-3 px-4">Terms & Cap</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Issued On</th>
                      <th className="py-3 px-4 text-right">Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredIssued.map((lic) => (
                      <tr key={lic.id} className="hover:bg-zinc-800/30 transition-colors">
                        {/* Song Recording */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <img
                              src={lic.song.cover_url}
                              alt={lic.song.title}
                              className="h-9 w-9 rounded-md object-cover border border-zinc-800 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-medium text-white block truncate leading-tight">
                                {lic.song.title}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-mono block">
                                {lic.song.genre}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Uploaded By Producer */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5 min-w-[160px]">
                            {lic.producer.avatar_url ? (
                              <img
                                src={lic.producer.avatar_url}
                                alt={lic.producer.display_name}
                                className="h-7 w-7 rounded-full object-cover border border-zinc-700 shrink-0"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-[10px] shrink-0">
                                {lic.producer.display_name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-medium text-white block truncate">
                                {lic.producer.display_name}
                              </span>
                              <span className="text-[10px] text-zinc-500 block truncate">
                                @{lic.producer.handle}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Licensed To Buyer */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5 min-w-[160px]">
                            {lic.buyer.avatar_url ? (
                              <img
                                src={lic.buyer.avatar_url}
                                alt={lic.buyer.display_name}
                                className="h-7 w-7 rounded-full object-cover border border-zinc-700 shrink-0"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-[#2dd4bf] text-[10px] shrink-0">
                                {lic.buyer.display_name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="font-medium text-white block truncate">
                                {lic.buyer.display_name}
                              </span>
                              <span className="text-[10px] text-zinc-500 block truncate">
                                @{lic.buyer.handle}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* License Type */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${getLicenseBadgeStyle(
                              lic.type
                            )}`}
                          >
                            <ShieldCheck className="h-3 w-3" />
                            {lic.type.toUpperCase()}
                          </span>
                        </td>

                        {/* Terms & Cap */}
                        <td className="py-3 px-4 font-mono text-[11px] text-zinc-300">
                          {lic.type === 'exclusive'
                            ? 'Unlimited Streams • Full Buyout'
                            : `${(lic.stream_cap || 100000).toLocaleString()} streams • ${lic.video_cap || 1} video`}
                        </td>

                        {/* Price */}
                        <td className="py-3 px-4 font-mono font-bold text-white">
                          {formatPriceCents(lic.price_cents)}
                        </td>

                        {/* Issued Timestamp */}
                        <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                          {new Date(lic.issued_at).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>

                        {/* Certificate Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedLicense(lic)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] font-medium transition-colors"
                          >
                            <FileText className="h-3 w-3 text-[#2dd4bf]" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: All Songs & Configured License Tiers */}
        {activeTab === 'catalog' && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xs">
            {loading ? (
              <div className="py-16 text-center text-zinc-500 text-xs">
                Loading songs catalog...
              </div>
            ) : filteredSongs.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-xs">
                No songs match your search query.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="py-3 px-4">Master Track</th>
                      <th className="py-3 px-4">Uploaded By Producer</th>
                      <th className="py-3 px-4">Basic Lease</th>
                      <th className="py-3 px-4">Premium Lease</th>
                      <th className="py-3 px-4">Exclusive Buyout</th>
                      <th className="py-3 px-4">Generated Licenses</th>
                      <th className="py-3 px-4 text-right">Catalog Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredSongs.map((song) => {
                      const basicLic = song.licenseTiers.find((t) => t.type === 'basic');
                      const premiumLic = song.licenseTiers.find((t) => t.type === 'premium');
                      const exclusiveLic = song.licenseTiers.find((t) => t.type === 'exclusive');

                      return (
                        <tr key={song.id} className="hover:bg-zinc-800/30 transition-colors">
                          {/* Song Title & Artwork */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <img
                                src={song.cover_url}
                                alt={song.title}
                                className="h-9 w-9 rounded-md object-cover border border-zinc-800 shrink-0"
                              />
                              <div className="min-w-0">
                                <span className="font-semibold text-white block truncate leading-tight">
                                  {song.title}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-mono block">
                                  {song.genre} • {song.bpm} BPM
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Uploaded By Producer */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5 min-w-[170px]">
                              {song.uploader.avatar_url ? (
                                <img
                                  src={song.uploader.avatar_url}
                                  alt={song.uploader.display_name}
                                  className="h-7 w-7 rounded-full object-cover border border-zinc-700 shrink-0"
                                />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-[10px] shrink-0">
                                  {song.uploader.display_name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-medium text-white block truncate">
                                  {song.uploader.display_name}
                                </span>
                                <span className="text-[10px] text-[#2dd4bf] block truncate">
                                  @{song.uploader.handle}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Basic Price */}
                          <td className="py-3 px-4 font-mono">
                            <span className="text-zinc-200 block font-medium">
                              {basicLic ? formatPriceCents(basicLic.price_cents) : '₦15,000'}
                            </span>
                            <span className="text-[10px] text-zinc-500">MP3 Streaming</span>
                          </td>

                          {/* Premium Price */}
                          <td className="py-3 px-4 font-mono">
                            <span className="text-zinc-200 block font-medium">
                              {premiumLic ? formatPriceCents(premiumLic.price_cents) : '₦45,000'}
                            </span>
                            <span className="text-[10px] text-zinc-500">WAV + Stems</span>
                          </td>

                          {/* Exclusive Price */}
                          <td className="py-3 px-4 font-mono">
                            <span className="text-zinc-200 block font-medium">
                              {exclusiveLic ? formatPriceCents(exclusiveLic.price_cents) : '₦250,000'}
                            </span>
                            <span className="text-[10px] text-zinc-500">Full Buyout</span>
                          </td>

                          {/* Generated / Issued Count */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700 text-xs font-mono font-medium text-zinc-200">
                              <FileCheck2 className="h-3.5 w-3.5 text-[#2dd4bf]" />
                              <span>{song.generatedLicenseCount} issued</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                song.status === 'live'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  song.status === 'live' ? 'bg-emerald-400' : 'bg-zinc-400'
                                }`}
                              />
                              {song.status === 'live' ? 'Live & Licensed' : 'Draft'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal: View Generated License Certificate */}
        {selectedLicense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-[#0c0d10] p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#2dd4bf]/15 border border-[#2dd4bf]/30 flex items-center justify-center text-[#2dd4bf]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Commercial License Certificate</h3>
                    <p className="text-[10px] text-zinc-400 font-mono">ID: {selectedLicense.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLicense(null)}
                  className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* License Details Card */}
              <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Song Title</span>
                  <span className="font-semibold text-white">{selectedLicense.song.title}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Uploaded By Producer</span>
                  <div className="text-right">
                    <span className="font-semibold text-white block">{selectedLicense.producer.display_name}</span>
                    <span className="text-[10px] text-[#2dd4bf]">@{selectedLicense.producer.handle}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Licensed To (Buyer)</span>
                  <div className="text-right">
                    <span className="font-semibold text-white block">{selectedLicense.buyer.display_name}</span>
                    <span className="text-[10px] text-zinc-400">@{selectedLicense.buyer.handle}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400">License Tier</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getLicenseBadgeStyle(selectedLicense.type)}`}>
                    {selectedLicense.type.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Distribution Cap</span>
                  <span className="font-mono text-zinc-200">
                    {selectedLicense.type === 'exclusive' ? 'Unlimited Worldwide' : `${selectedLicense.stream_cap.toLocaleString()} Streams • ${selectedLicense.video_cap} Video`}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-zinc-400">Invoice / Reference</span>
                  <span className="font-mono text-zinc-200 font-semibold">{selectedLicense.reference}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Settled Fee</span>
                  <span className="font-mono font-bold text-white text-sm">{formatPriceCents(selectedLicense.price_cents)}</span>
                </div>
              </div>

              {/* Legal PDF Key */}
              <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                <span className="truncate">Agreement: {selectedLicense.agreement_pdf_key || 'contracts/digital_license_agreement.pdf'}</span>
                <span className="text-emerald-400 shrink-0 ml-2">✓ Digitally Signed</span>
              </div>

              {/* Close / Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedLicense(null)}
                  className="px-3.5 py-1.5 rounded-md border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
