'use client';

import React, { useState } from 'react';
import { AdminShell } from '../../components/AdminShell';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Search,
  Upload,
  Radio,
  Sliders,
  Sparkles,
  Lock,
  X,
  CreditCard,
  Trash2
} from 'lucide-react';

interface AdCampaign {
  id: string;
  songTitle: string;
  artistName: string;
  artistHandle: string;
  coverUrl: string;
  genre: string;
  tier: 'Starter Spotlight' | 'Pro Rotation' | 'Studio Blast';
  amountPaidNgn: number;
  impressionsDelivered: number;
  impressionsTarget: number;
  clicksCount: number;
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  spotifyUrl: string;
  appleMusicUrl: string;
  audiomackUrl: string;
  youtubeUrl: string;
}

export default function AdminAdsManagerPage() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Frequency Rule State
  const [songsPerAd, setSongsPerAd] = useState(3);
  const [adDurationSeconds, setAdDurationSeconds] = useState(15);
  const [isUnskippableEnforced, setIsUnskippableEnforced] = useState(true);

  // Initial Campaigns
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([
    {
      id: 'ad-camp-1',
      songTitle: 'Midnight Lagos',
      artistName: 'Teniola Sound',
      artistHandle: '@teniola_snd',
      coverUrl: '/images/artist_studio_mic.jpg',
      genre: 'Afro-Soul',
      tier: 'Studio Blast',
      amountPaidNgn: 75000,
      impressionsDelivered: 38400,
      impressionsTarget: 40000,
      clicksCount: 2940,
      status: 'active',
      startDate: 'Oct 10, 2026',
      spotifyUrl: 'https://open.spotify.com',
      appleMusicUrl: 'https://music.apple.com',
      audiomackUrl: 'https://audiomack.com',
      youtubeUrl: 'https://youtube.com'
    },
    {
      id: 'ad-camp-2',
      songTitle: 'Golden Horizon',
      artistName: 'Zino Waves ft. Caution',
      artistHandle: '@zinowaves',
      coverUrl: '/images/album_sunrise.jpg',
      genre: 'Amapiano',
      tier: 'Pro Rotation',
      amountPaidNgn: 35000,
      impressionsDelivered: 14200,
      impressionsTarget: 15000,
      clicksCount: 1180,
      status: 'active',
      startDate: 'Oct 14, 2026',
      spotifyUrl: 'https://open.spotify.com',
      appleMusicUrl: 'https://music.apple.com',
      audiomackUrl: 'https://audiomack.com',
      youtubeUrl: 'https://youtube.com'
    },
    {
      id: 'ad-camp-3',
      songTitle: 'Eko Nights Fever',
      artistName: 'Burna Prince',
      artistHandle: '@burnaprince',
      coverUrl: '/images/album_neon_dj.jpg',
      genre: 'Afrobeats',
      tier: 'Starter Spotlight',
      amountPaidNgn: 15000,
      impressionsDelivered: 5000,
      impressionsTarget: 5000,
      clicksCount: 410,
      status: 'completed',
      startDate: 'Oct 01, 2026',
      spotifyUrl: 'https://open.spotify.com',
      appleMusicUrl: 'https://music.apple.com',
      audiomackUrl: 'https://audiomack.com',
      youtubeUrl: 'https://youtube.com'
    },
    {
      id: 'ad-camp-4',
      songTitle: 'Subway Tokyo Drift',
      artistName: 'Kroma Sound Lab',
      artistHandle: '@dj_kroma',
      coverUrl: '/images/studio_mixing_console.jpg',
      genre: 'Electronic',
      tier: 'Pro Rotation',
      amountPaidNgn: 35000,
      impressionsDelivered: 8900,
      impressionsTarget: 15000,
      clicksCount: 780,
      status: 'active',
      startDate: 'Oct 18, 2026',
      spotifyUrl: 'https://open.spotify.com',
      appleMusicUrl: 'https://music.apple.com',
      audiomackUrl: 'https://audiomack.com',
      youtubeUrl: 'https://youtube.com'
    }
  ]);

  // Form State for New Campaign Payment
  const [formArtistName, setFormArtistName] = useState('');
  const [formArtistHandle, setFormArtistHandle] = useState('');
  const [formSongTitle, setFormSongTitle] = useState('');
  const [formGenre, setFormGenre] = useState('Afrobeats');
  const [formTier, setFormTier] = useState<'Starter Spotlight' | 'Pro Rotation' | 'Studio Blast'>('Pro Rotation');
  const [formSpotify, setFormSpotify] = useState('https://open.spotify.com');
  const [formApple, setFormApple] = useState('https://music.apple.com');
  const [formAudiomack, setFormAudiomack] = useState('https://audiomack.com');
  const [formYouTube, setFormYouTube] = useState('https://youtube.com');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Paystack Direct Card/Transfer');

  const totalRevenueNgn = campaigns.reduce((acc, c) => acc + c.amountPaidNgn, 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + c.impressionsDelivered, 0);
  const activeCount = campaigns.filter((c) => c.status === 'active').length;

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSongTitle || !formArtistName) return;

    const tierPrices = {
      'Starter Spotlight': { price: 15000, impressions: 5000 },
      'Pro Rotation': { price: 35000, impressions: 15000 },
      'Studio Blast': { price: 75000, impressions: 40000 }
    };

    const newCamp: AdCampaign = {
      id: `ad-camp-${Date.now()}`,
      songTitle: formSongTitle,
      artistName: formArtistName,
      artistHandle: formArtistHandle.startsWith('@') ? formArtistHandle : `@${formArtistHandle || 'artist'}`,
      coverUrl: '/images/hero_boombox.jpg',
      genre: formGenre,
      tier: formTier,
      amountPaidNgn: tierPrices[formTier].price,
      impressionsDelivered: 0,
      impressionsTarget: tierPrices[formTier].impressions,
      clicksCount: 0,
      status: 'active',
      startDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      spotifyUrl: formSpotify,
      appleMusicUrl: formApple,
      audiomackUrl: formAudiomack,
      youtubeUrl: formYouTube
    };

    setCampaigns([newCamp, ...campaigns]);
    setIsModalOpen(false);
    setSuccessMsg(`Campaign "${formSongTitle}" created & payment of ₦${tierPrices[formTier].price.toLocaleString()} verified! Added to 3-song rotation.`);
    setTimeout(() => setSuccessMsg(''), 5000);

    // Reset Form
    setFormArtistName('');
    setFormSongTitle('');
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(
      campaigns.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === 'active' ? 'paused' : 'active';
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const handleDeleteCampaign = (id: string) => {
    if (confirm('Are you sure you want to remove this ad campaign from rotation?')) {
      setCampaigns(campaigns.filter((c) => c.id !== id));
    }
  };

  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.songTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#2dd4bf] animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Commercial Engine // Caution Studios
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Caution Studios Ads Manager
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage unskippable audio ads (Audiomack/Spotify model: 1 ad after every 3 songs), advertiser payments, and DSP clicks
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-bold transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Book & Pay for Ad Campaign</span>
        </button>
      </div>

      {successMsg && (
        <div className="rounded-md border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Ad Engine Frequency Rules Bar (Audiomack/Spotify Model) */}
      <div className="rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-zinc-900/80 to-zinc-950 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-amber-500/20 text-amber-300 shrink-0">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                Audio Interstitial Rule: 1 Ad Every 3 Songs
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                Unskippable Enforced
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
              Like Audiomack and Spotify: when a free listener streams 3 consecutive songs, the next track is delayed by an unskippable 15-second sponsored artist audio spotlight.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-500">Frequency: </span>
            <span className="text-[#2dd4bf] font-bold">Every {songsPerAd} Songs</span>
          </div>
          <div className="px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-500">Duration: </span>
            <span className="text-amber-300 font-bold">{adDurationSeconds}s Non-Skippable</span>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Ad Revenue</span>
            <div className="p-1.5 rounded-md bg-[#2dd4bf]/10 text-[#2dd4bf]">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">
              ₦{totalRevenueNgn.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" />
              <span>+45%</span>
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Paid directly by artists/sponsors</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Active Campaigns</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-300">
              <Megaphone className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-white">{activeCount}</span>
          </div>
          <p className="text-[11px] text-amber-300 mt-1">Serving in listener 3-song rotation</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Unskippable Impressions</span>
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-300">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold font-mono text-white">
              {totalDelivered.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">100% full 15s completions</p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Ad Completion Rate</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">99.2%</span>
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">Non-skippable modal lock active</p>
        </div>
      </div>

      {/* Ad Packages & Pricing Rates */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-1">
          Caution Studios Ad Packages (Advertiser Rates)
        </h3>
        <p className="text-xs text-zinc-400 mb-4">
          Standardized pricing tiers where artists and record labels pay for guaranteed audio placements
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-200">Starter Spotlight</span>
              <span className="text-xs font-mono font-bold text-white">₦15,000</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              5,000 guaranteed unskippable 15s audio plays across free listeners.
            </p>
            <div className="pt-2 text-[10px] text-zinc-500 font-mono">
              CPM: ₦3,000 / 1k plays · All DSP links
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-950 border border-[#2dd4bf]/40 space-y-2 relative">
            <span className="absolute -top-2 right-3 px-2 py-0.2 bg-[#2dd4bf] text-zinc-950 rounded text-[9px] font-bold uppercase">
              Most Popular
            </span>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#2dd4bf]">Pro Rotation</span>
              <span className="text-xs font-mono font-bold text-white">₦35,000</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              15,000 guaranteed unskippable plays + high-priority queue injection.
            </p>
            <div className="pt-2 text-[10px] text-zinc-500 font-mono">
              CPM: ₦2,333 / 1k plays · Spotify/Apple/Audiomack links
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-950 border border-purple-500/40 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-purple-300">Studio Blast</span>
              <span className="text-xs font-mono font-bold text-white">₦75,000</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              40,000 guaranteed plays + featured homepage artist spotlight.
            </p>
            <div className="pt-2 text-[10px] text-zinc-500 font-mono">
              CPM: ₦1,875 / 1k plays · Maximum reach & CTR
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Sponsored Ad Campaigns</h3>
            <p className="text-xs text-zinc-400">All audio commercials currently serving in player rotation</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by song or artist..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Sponsored Track</th>
                <th className="py-3 px-4">Artist / Sponsor</th>
                <th className="py-3 px-4">Package</th>
                <th className="py-3 px-4 text-right">Paid (₦)</th>
                <th className="py-3 px-4">Delivery Progress</th>
                <th className="py-3 px-4 text-center">DSP Clicks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredCampaigns.map((camp) => {
                const progressPct = Math.min(100, Math.round((camp.impressionsDelivered / camp.impressionsTarget) * 100));
                return (
                  <tr key={camp.id} className="hover:bg-zinc-800/30 transition-colors">
                    {/* Track info with Play button */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setPlayingId(playingId === camp.id ? null : camp.id)}
                          className="h-8 w-8 rounded bg-zinc-800 hover:bg-[#2dd4bf] hover:text-black flex items-center justify-center shrink-0 transition-colors text-zinc-300"
                          title="Preview 15s Ad Snippet"
                        >
                          {playingId === camp.id ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <span className="font-semibold text-white block truncate max-w-[180px]">
                            {camp.songTitle}
                          </span>
                          <span className="text-[10px] text-zinc-400 block font-mono">
                            {camp.genre} · 15s snippet
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Artist / Sponsor */}
                    <td className="py-3 px-4">
                      <span className="text-zinc-200 block font-medium">{camp.artistName}</span>
                      <span className="text-zinc-500 text-[10px] font-mono block">{camp.artistHandle}</span>
                    </td>

                    {/* Package */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {camp.tier}
                      </span>
                    </td>

                    {/* Paid Amount */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      ₦{camp.amountPaidNgn.toLocaleString()}
                    </td>

                    {/* Delivery Progress Bar */}
                    <td className="py-3 px-4 min-w-[160px]">
                      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                        <span className="text-zinc-300">{camp.impressionsDelivered.toLocaleString()}</span>
                        <span className="text-zinc-500">/ {camp.impressionsTarget.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#2dd4bf] to-emerald-400 rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </td>

                    {/* Clicks */}
                    <td className="py-3 px-4 text-center font-mono text-[#2dd4bf] font-bold">
                      {camp.clicksCount.toLocaleString()}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {camp.status === 'active' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active (3-Song)
                        </span>
                      ) : camp.status === 'paused' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          Paused
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
                          Fulfilled
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleCampaignStatus(camp.id)}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          {camp.status === 'active' ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCampaign(camp.id)}
                          title="Delete Campaign"
                          className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-zinc-800 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book & Pay for Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0d10] border border-zinc-800 rounded-lg max-w-lg w-full p-6 text-zinc-100 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-[#2dd4bf]" />
                <h3 className="text-base font-bold text-white">
                  Book & Pay for Audio Ad Campaign
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-300">Promoted Song Title *</label>
                <input
                  type="text"
                  required
                  value={formSongTitle}
                  onChange={(e) => setFormSongTitle(e.target.value)}
                  placeholder="e.g. Lagos City Lights"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Artist / Sponsor Name *</label>
                  <input
                    type="text"
                    required
                    value={formArtistName}
                    onChange={(e) => setFormArtistName(e.target.value)}
                    placeholder="e.g. Teniola Sounds"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-3 text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Social Handle (@)</label>
                  <input
                    type="text"
                    value={formArtistHandle}
                    onChange={(e) => setFormArtistHandle(e.target.value)}
                    placeholder="@teniola"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-3 text-xs text-zinc-100 font-mono focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Genre</label>
                  <select
                    value={formGenre}
                    onChange={(e) => setFormGenre(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-3 text-xs text-zinc-100 focus:outline-none"
                  >
                    <option value="Afrobeats">Afrobeats</option>
                    <option value="Amapiano">Amapiano</option>
                    <option value="Afro-Soul">Afro-Soul</option>
                    <option value="Hip-Hop">Hip-Hop / Trap</option>
                    <option value="Lo-Fi">Lo-Fi</option>
                    <option value="Electronic">Electronic</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Ad Package *</label>
                  <select
                    value={formTier}
                    onChange={(e) => setFormTier(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-3 text-xs text-zinc-100 focus:outline-none"
                  >
                    <option value="Starter Spotlight">Starter Spotlight (₦15,000 · 5k plays)</option>
                    <option value="Pro Rotation">Pro Rotation (₦35,000 · 15k plays)</option>
                    <option value="Studio Blast">Studio Blast (₦75,000 · 40k plays)</option>
                  </select>
                </div>
              </div>

              {/* Streaming DSP Links */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <span className="text-xs font-semibold text-zinc-300 block">
                  DSP Links (Where listeners go when clicking ad)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="url"
                    value={formSpotify}
                    onChange={(e) => setFormSpotify(e.target.value)}
                    placeholder="Spotify URL"
                    className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-200"
                  />
                  <input
                    type="url"
                    value={formApple}
                    onChange={(e) => setFormApple(e.target.value)}
                    placeholder="Apple Music URL"
                    className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-200"
                  />
                  <input
                    type="url"
                    value={formAudiomack}
                    onChange={(e) => setFormAudiomack(e.target.value)}
                    placeholder="Audiomack URL"
                    className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-200"
                  />
                  <input
                    type="url"
                    value={formYouTube}
                    onChange={(e) => setFormYouTube(e.target.value)}
                    placeholder="YouTube URL"
                    className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-[11px] text-zinc-200"
                  />
                </div>
              </div>

              {/* Payment Verification */}
              <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Total Campaign Cost:</span>
                  <span className="text-[#2dd4bf] font-bold font-mono">
                    {formTier === 'Starter Spotlight'
                      ? '₦15,000'
                      : formTier === 'Pro Rotation'
                      ? '₦35,000'
                      : '₦75,000'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Payment Status:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified via Paystack / Bank</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-md border border-zinc-800 text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Activate & Inject Into 3-Song Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
