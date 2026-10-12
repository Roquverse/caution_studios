'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Cast,
  Activity,
  ListMusic,
  BarChart2,
  Heart,
  Clock,
  Calendar,
  Radio,
  Plus,
  Play,
  Pause,
  MoreVertical,
  ChevronRight,
  Volume2,
  VolumeX,
  Shuffle,
  SkipBack,
  SkipForward,
  Repeat,
  SlidersHorizontal,
  ListOrdered,
  X,
  Sparkles,
  Music,
  Disc3,
  Check
} from 'lucide-react';
import { audioSynth } from '@caution/ui';
import { supabase } from '../../lib/supabaseClient';
import { SEEDED_BEATS, SEEDED_PRODUCERS } from '../../lib/seedBeats';
import { UserDropdown } from '../../components/UserDropdown';
import { useUserSubscription, FREE_PREVIEW_LIMIT_SECONDS } from '../../lib/subscription';

interface TrackItem {
  id: string;
  title: string;
  artist: string;
  subscribers?: string;
  tracksCount?: string;
  duration: string;
  durationSeconds: number;
  date?: string;
  coverUrl: string;
  isLiked?: boolean;
  category?: string;
}

export default function UserPortalPage() {
  const { isSubscribed } = useUserSubscription();
  // Navigation & Tabs
  const [activeNav, setActiveNav] = useState('feed');
  const [activeTab, setActiveTab] = useState<'playlists' | 'artists' | 'albums' | 'streams' | 'friends'>('playlists');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlists, setPlaylists] = useState([
    { name: 'Metalcore', color: '#2dd4bf' },
    { name: 'Electro', color: '#10B981' },
    { name: 'Funk', color: '#F59E0B' },
    { name: 'Disco', color: '#8B5CF6' }
  ]);

  // Audio Playback State
  const [currentTrack, setCurrentTrack] = useState<TrackItem>({
    id: 'hero-1',
    title: 'Between Death and Dreams',
    artist: 'Brand of Sacrifice',
    duration: '4:12',
    durationSeconds: 252,
    coverUrl: '/images/cinematic_hero_tunnel.jpg',
    isLiked: true
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  // Statistics State
  const [likesCount, setLikesCount] = useState(247);
  const [tracksCount] = useState(363);
  const [streamsCount, setStreamsCount] = useState(29);

  // Center Playlist Rows (Table in Reference Image)
  const [playlistRows, setPlaylistRows] = useState<TrackItem[]>([
    {
      id: 'pl-1',
      title: 'Workout at the gym',
      artist: 'Caution Studio Curated',
      tracksCount: '29 tracks • 2h 15m',
      date: '23 June, 2023',
      duration: '3:45',
      durationSeconds: 225,
      coverUrl: '/images/album_neon_dj.jpg',
      isLiked: true,
      category: 'playlists'
    },
    {
      id: 'pl-2',
      title: 'Tracks without lirycs',
      artist: 'Instrumental Archive',
      tracksCount: '35 tracks • 2h 15m',
      date: '27 April, 2023',
      duration: '4:10',
      durationSeconds: 250,
      coverUrl: '/images/studio_mixing_console.jpg',
      isLiked: false,
      category: 'playlists'
    },
    {
      id: 'pl-3',
      title: 'Funny stuff',
      artist: 'Eclectic Beats',
      tracksCount: '108 tracks • 6h 48m',
      date: '12 February, 2023',
      duration: '2:55',
      durationSeconds: 175,
      coverUrl: '/images/hero_boombox.jpg',
      isLiked: true,
      category: 'playlists'
    },
    {
      id: 'pl-4',
      title: 'Careful driving vibes',
      artist: 'Night Drive Amapiano',
      tracksCount: '84 tracks • 5h 09m',
      date: '18 May, 2023',
      duration: '3:30',
      durationSeconds: 210,
      coverUrl: '/images/golden_clef.jpg',
      isLiked: false,
      category: 'playlists'
    },
    {
      id: 'pl-5',
      title: 'Philosophy during walking',
      artist: 'Ambient & Lo-Fi',
      tracksCount: '52 tracks • 3h 59m',
      date: '21 December, 2022',
      duration: '4:02',
      durationSeconds: 242,
      coverUrl: '/images/album_sunrise.jpg',
      isLiked: true,
      category: 'playlists'
    }
  ]);

  // Right Column: New Releases
  const newReleases: TrackItem[] = [
    {
      id: 'nr-1',
      title: 'Calamity',
      artist: 'Track • Annisokay • Calamity • 2023',
      duration: '3:42',
      durationSeconds: 222,
      coverUrl: '/images/artist_studio_mic.jpg'
    },
    {
      id: 'nr-2',
      title: 'Last Resort (Reimagined)',
      artist: 'Track • Falling in Reverse • Single • 2023',
      duration: '4:43',
      durationSeconds: 283,
      coverUrl: '/images/studio_mixing_console.jpg'
    }
  ];

  // Right Column: Listen More Often
  const [listenMoreOften, setListenMoreOften] = useState<TrackItem[]>([
    {
      id: 'lmo-1',
      title: 'Blood Orange',
      artist: 'Berried Alive',
      duration: '3:20',
      durationSeconds: 200,
      coverUrl: '/images/album_neon_dj.jpg',
      isLiked: true
    },
    {
      id: 'lmo-2',
      title: 'Soul Decay',
      artist: 'Make Them Suffer',
      duration: '3:50',
      durationSeconds: 230,
      coverUrl: '/images/diamond_playlist_art.jpg',
      isLiked: true
    },
    {
      id: 'lmo-3',
      title: 'A Little Bit Off',
      artist: 'Five Finger Death Punch',
      duration: '3:12',
      durationSeconds: 192,
      coverUrl: '/images/golden_clef.jpg',
      isLiked: true
    }
  ]);

  // Right Column: Favourite Artists (Ranked 1-5 with large outlined numbers)
  const favouriteArtists = [
    { rank: 1, name: 'Ice Nine Kills', subscribers: '432k subscribers', coverUrl: '/images/artist_studio_mic.jpg' },
    { rank: 2, name: 'Bloodywood', subscribers: '31k subscribers', coverUrl: '/images/album_neon_dj.jpg' },
    { rank: 3, name: 'Bad Omens', subscribers: '183k subscribers', coverUrl: '/images/studio_mixing_console.jpg' },
    { rank: 4, name: 'Lorna Shore', subscribers: '108k subscribers', coverUrl: '/images/golden_clef.jpg' },
    { rank: 5, name: 'Annisokay', subscribers: '79k subscribers', coverUrl: '/images/hero_boombox.jpg' }
  ];

  // Audio Playback Simulation Timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const limit = isSubscribed ? currentTrack.durationSeconds : Math.min(FREE_PREVIEW_LIMIT_SECONDS, currentTrack.durationSeconds);
          if (prev >= limit) {
            audioSynth.stop();
            setIsPlaying(false);
            if (!isSubscribed) {
              setShowUpgradeModal(true);
            }
            return limit;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.durationSeconds, isSubscribed]);

  // Toggle Play
  const handlePlayToggle = (track: TrackItem) => {
    if (currentTrack.id === track.id) {
      if (isPlaying) {
        audioSynth.stop();
        setIsPlaying(false);
      } else {
        if (!isSubscribed && currentTime >= FREE_PREVIEW_LIMIT_SECONDS) {
          setCurrentTime(0);
        }
        setIsPlaying(true);
        audioSynth.playTrack(track.id, () => {}, isSubscribed ? undefined : FREE_PREVIEW_LIMIT_SECONDS);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setCurrentTime(0);
      setStreamsCount((prev) => prev + 1);
      audioSynth.stop();
      audioSynth.playTrack(track.id, () => {}, isSubscribed ? undefined : FREE_PREVIEW_LIMIT_SECONDS);
    }
  };

  // Toggle Track Like
  const toggleLike = (id: string) => {
    setPlaylistRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const nextState = !row.isLiked;
          setLikesCount((c) => (nextState ? c + 1 : Math.max(0, c - 1)));
          return { ...row, isLiked: nextState };
        }
        return row;
      })
    );

    setListenMoreOften((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          const nextState = !row.isLiked;
          setLikesCount((c) => (nextState ? c + 1 : Math.max(0, c - 1)));
          return { ...row, isLiked: nextState };
        }
        return row;
      })
    );

    if (currentTrack.id === id) {
      setCurrentTrack((prev) => ({
        ...prev,
        isLiked: !prev.isLiked
      }));
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    const colors = ['#EC4899', '#3B82F6', '#14B8A6', '#F97316'];
    const randomColor = colors[playlists.length % colors.length];
    setPlaylists([...playlists, { name: newPlaylistName.trim(), color: randomColor }]);
    setNewPlaylistName('');
    setShowCreatePlaylistModal(false);
  };

  // Progress percentage
  const progressRatio = currentTrack.durationSeconds > 0 ? (currentTime / currentTrack.durationSeconds) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#08090B] text-white flex flex-col font-sans selection:bg-[#04564f] selection:text-white pb-24">
      {/* 1. TOP HEADER */}
      <header className="h-16 border-b border-white/[0.06] bg-[#0A0B0E] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
        {/* Logo */}
        <div className="flex items-center gap-8 w-64 shrink-0">
          <Link href="/" className="inline-flex items-center">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-8 w-auto object-contain brightness-0 invert"
              style={{ width: 200 }}
            />
          </Link>
        </div>

        {/* Center Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative flex items-center">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by artists, songs or albums"
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#141518] border border-white/[0.06] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        {/* Right User Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/20 hover:border-white/40 text-xs font-semibold text-white/90 transition-colors cursor-pointer"
          >
            <span>My channel</span>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          </button>

          <button
            type="button"
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="Airplay / Cast"
          >
            <Cast className="h-4 w-4" />
          </button>

          {/* Functional User Profile Dropdown */}
          <UserDropdown />
        </div>
      </header>

      {/* 2. BODY CONTENT (3-COLUMN SPLIT: LEFT SIDEBAR, CENTER MAIN, RIGHT SIDEBAR) */}
      <div className="flex-1 flex w-full">
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-64 border-r border-white/[0.06] bg-[#0A0B0E] p-5 shrink-0 hidden md:flex flex-col justify-between">
          <div className="space-y-6">
            {/* Primary Nav */}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveNav('feed')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeNav === 'feed'
                    ? 'text-white bg-white/[0.04]'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <Activity className={`h-4 w-4 ${activeNav === 'feed' ? 'text-[#2dd4bf]' : 'text-gray-400'}`} />
                <span className={activeNav === 'feed' ? 'font-semibold text-[#2dd4bf]' : ''}>Feed</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveNav('playlists')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeNav === 'playlists'
                    ? 'text-white bg-white/[0.04]'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <ListMusic className="h-4 w-4 text-gray-400" />
                <span>Playlists</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveNav('statistics')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeNav === 'statistics'
                    ? 'text-white bg-white/[0.04]'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                <BarChart2 className="h-4 w-4 text-gray-400" />
                <span>Statistics</span>
              </button>
            </nav>

            {/* YOUR MUSIC Section */}
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-500 px-3 mb-2">
                YOUR MUSIC
              </p>
              <div className="space-y-0.5">
                {[
                  { id: 'fav', label: 'Favourites', icon: Heart },
                  { id: 'later', label: 'Listen Later', icon: Clock },
                  { id: 'history', label: 'History', icon: Calendar },
                  { id: 'podcasts', label: 'Podcasts', icon: Radio }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveNav(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isActive ? 'text-white bg-white/[0.04]' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4 w-4 text-gray-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* YOUR PLAYLISTS Section */}
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-gray-500 px-3 mb-2">
                YOUR PLAYLISTS
              </p>
              <div className="space-y-1">
                {playlists.map((pl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveNav(`pl-${pl.name}`)}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-300 hover:text-white transition-colors"
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: pl.color }}
                    />
                    <span className="truncate">{pl.name}</span>
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowCreatePlaylistModal(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#2dd4bf] hover:text-[#5eead4] transition-colors mt-2 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create new playlist</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06] text-[10px] text-gray-500">
            <span>Caution Studio v2.4</span>
          </div>
        </aside>

        {/* CENTER MAIN CONTENT AREA */}
        <main className="flex-1 p-5 sm:p-6 lg:p-7 overflow-y-auto min-w-0 space-y-6">
          {/* TOP ROW: TWO HERO CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Card 1: Playlist of the day (~40% width) */}
            <div className="lg:col-span-5 bg-[#121316] border border-white/[0.06] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
              <div>
                <p className="text-[11px] font-mono text-gray-400">
                  69 tracks • 4 hours 37 minutes
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Playlist of the day
                </h2>
              </div>

              {/* Diamond Artwork in center */}
              <div className="my-6 flex justify-center relative">
                <div className="w-44 h-44 rounded-xl overflow-hidden shadow-2xl relative border border-white/10 group-hover:scale-105 transition-transform duration-500">
                  <img
                    src="/images/diamond_playlist_art.jpg"
                    alt="Playlist of the day artwork"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              </div>

              {/* Ambient Bottom Glow */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-16 bg-[#04564f]/30 blur-2xl pointer-events-none rounded-full" />
            </div>

            {/* Card 2: Cinematic Hero Player - Between Death and Dreams (~60% width) */}
            <div className="lg:col-span-7 bg-[#121316] border border-white/[0.06] rounded-2xl relative overflow-hidden flex flex-col justify-between p-6 min-h-[300px]">
              {/* Background Cinematic Image with Overlays */}
              <img
                src="/images/cinematic_hero_tunnel.jpg"
                alt="Between Death and Dreams"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0E] via-black/40 to-black/60" />

              {/* Top Meta Bar */}
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-mono text-gray-300 uppercase tracking-wider">
                    Brand of Sacrifice • April, 2023
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-1 tracking-tight">
                    Between Death and Dreams
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleLike('hero-1')}
                    className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Heart className={`h-4 w-4 ${currentTrack.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                  <button
                    type="button"
                    className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:text-gray-300 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Center Play Button Overlay */}
              <div className="relative z-10 flex justify-center my-8">
                <button
                  type="button"
                  onClick={() =>
                    handlePlayToggle({
                      id: 'hero-1',
                      title: 'Between Death and Dreams',
                      artist: 'Brand of Sacrifice',
                      duration: '4:12',
                      durationSeconds: 252,
                      coverUrl: '/images/cinematic_hero_tunnel.jpg'
                    })
                  }
                  className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:bg-[#04564f] hover:border-[#2dd4bf] text-white flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg"
                >
                  {isPlaying && currentTrack.id === 'hero-1' ? (
                    <Pause className="h-7 w-7 fill-white" />
                  ) : (
                    <Play className="h-7 w-7 fill-white translate-x-0.5" />
                  )}
                </button>
              </div>

              {/* Bottom Scrubber & Timers */}
              <div className="relative z-10 pt-2">
                <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mb-2 cursor-pointer">
                  <div
                    className="h-full bg-gradient-to-r from-[#04564f] to-[#2dd4bf] transition-all duration-300"
                    style={{
                      width: currentTrack.id === 'hero-1' ? `${progressRatio}%` : '0%'
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-gray-300">
                  <span>{currentTrack.id === 'hero-1' ? formatTime(currentTime) : '0:00'}</span>
                  <span>4:12</span>
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE TABBED PLAYLISTS TABLE */}
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-6 border-b border-white/[0.06] pb-3 text-xs font-semibold overflow-x-auto">
              {[
                { id: 'playlists', label: 'Playlists' },
                { id: 'artists', label: 'Artists' },
                { id: 'albums', label: 'Albums' },
                { id: 'streams', label: 'Streams' },
                { id: 'friends', label: "Friends' playlists" }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative py-1 transition-colors whitespace-nowrap cursor-pointer ${
                      isActive ? 'text-[#2dd4bf]' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[#2dd4bf]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Playlists Table Rows */}
            <div className="space-y-2">
              {playlistRows.map((row) => {
                const isThisPlaying = isPlaying && currentTrack.id === row.id;
                return (
                  <div
                    key={row.id}
                    onClick={() => handlePlayToggle(row)}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#121316] hover:bg-[#181a1f] border border-white/[0.04] hover:border-white/10 transition-all cursor-pointer group"
                  >
                    {/* Left: Thumbnail & Name */}
                    <div className="flex items-center gap-3.5 min-w-0 w-72 sm:w-80">
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                        <img
                          src={row.coverUrl}
                          alt={row.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        {isThisPlaying && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="h-2 w-2 rounded-full bg-[#2dd4bf] animate-ping" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isThisPlaying ? 'text-[#2dd4bf]' : 'text-white'}`}>
                          {row.title}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {row.artist}
                        </p>
                      </div>
                    </div>

                    {/* Center: Track Count / Duration */}
                    <div className="hidden sm:block text-xs font-mono text-gray-400 text-left w-36">
                      {row.tracksCount}
                    </div>

                    {/* Center: Date Added */}
                    <div className="hidden md:block text-xs text-gray-500 w-36">
                      {row.date}
                    </div>

                    {/* Right: Play Action & Options */}
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayToggle(row);
                        }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                          isThisPlaying
                            ? 'bg-[#04564f] text-[#2dd4bf]'
                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {isThisPlaying ? (
                          <Pause className="h-3.5 w-3.5 fill-current" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-current translate-x-0.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(row.id);
                        }}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM ROW: PROMO BANNER + STATISTICS WIDGET */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
            {/* Promo Banner Card (~65% width) */}
            {showPromoBanner && (
              <div className="lg:col-span-8 bg-gradient-to-r from-[#171821] via-[#1a1b24] to-[#1e1724] border border-white/[0.08] rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
                <button
                  type="button"
                  onClick={() => setShowPromoBanner(false)}
                  className="absolute top-4 right-4 p-1 rounded-full text-gray-400 hover:text-white transition-colors z-20"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="max-w-xs sm:max-w-sm relative z-10 space-y-2">
                  <h4 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    Check the power <br />
                    of Caution Studio
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed pt-1">
                    Enjoy uninterrupted music streaming with our premium subscription.
                  </p>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(true)}
                      className="px-5 py-2.5 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white text-xs font-bold tracking-wide uppercase transition-colors cursor-pointer shadow-md"
                    >
                      Upgrade
                    </button>
                  </div>
                </div>

                {/* 3D Wavy Accordion Ribbon Graphic on Right */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-56 sm:w-64 h-56 sm:h-64 pointer-events-none opacity-90 overflow-hidden">
                  <img
                    src="/images/ribbon_promo_wave.jpg"
                    alt="3D Wave Ribbon"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}

            {/* Statistics Widget Cards (~35% width) */}
            <div className={`space-y-3 ${showPromoBanner ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                  STATISTICS
                </span>
                <button
                  type="button"
                  onClick={() => setActiveNav('statistics')}
                  className="text-xs font-semibold text-[#2dd4bf] hover:underline"
                >
                  Explore
                </button>
              </div>

              {/* Stat 1: LIKES */}
              <div className="p-3.5 rounded-xl bg-[#121316] border border-white/[0.04] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    LIKES
                  </p>
                  <p className="text-lg font-black text-white mt-0.5">{likesCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
                  <Heart className="h-4 w-4 fill-red-500/20" />
                </div>
              </div>

              {/* Stat 2: TRACKS */}
              <div className="p-3.5 rounded-xl bg-[#121316] border border-white/[0.04] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    TRACKS
                  </p>
                  <p className="text-lg font-black text-white mt-0.5">{tracksCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.03] text-gray-400">
                  <Music className="h-4 w-4" />
                </div>
              </div>

              {/* Stat 3: STREAMS */}
              <div className="p-3.5 rounded-xl bg-[#121316] border border-white/[0.04] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    STREAMS
                  </p>
                  <p className="text-lg font-black text-white mt-0.5">{streamsCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.03] text-gray-400">
                  <Radio className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR (NEW RELEASES, LISTEN MORE OFTEN, FAVOURITE ARTISTS) */}
        <aside className="w-72 lg:w-80 border-l border-white/[0.06] bg-[#0A0B0E] p-5 shrink-0 hidden xl:flex flex-col space-y-6 overflow-y-auto">
          {/* Section 1: NEW RELEASES */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                NEW RELEASES
              </span>
              <button type="button" className="text-xs text-[#2dd4bf] hover:underline font-semibold">
                See all
              </button>
            </div>

            <div className="space-y-3">
              {newReleases.map((nr) => (
                <div
                  key={nr.id}
                  onClick={() => handlePlayToggle(nr)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                    <img
                      src={nr.coverUrl}
                      alt={nr.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-3.5 w-3.5 fill-white text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{nr.title}</p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{nr.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: LISTEN MORE OFTEN */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                LISTEN MORE OFTEN
              </span>
            </div>

            <div className="space-y-2.5">
              {listenMoreOften.map((track) => (
                <div
                  key={track.id}
                  onClick={() => handlePlayToggle(track)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{track.title}</p>
                      <p className="text-[10px] text-gray-500 truncate">{track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(track.id);
                      }}
                      className="p-1 text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Heart className="h-3.5 w-3.5 fill-red-500" />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-500 hover:text-white transition-colors"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: FAVOURITE ARTISTS (Ranked 1-5 with large outlined numbers) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                FAVOURITE ARTISTS
              </span>
              <button type="button" className="text-xs text-[#2dd4bf] hover:underline font-semibold">
                See all
              </button>
            </div>

            <div className="space-y-3">
              {favouriteArtists.map((artist) => (
                <div
                  key={artist.rank}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Big Stylized Outline Rank Number */}
                    <span
                      className="text-2xl font-black font-mono shrink-0 select-none text-transparent"
                      style={{
                        WebkitTextStroke: '1.2px #4B5563'
                      }}
                    >
                      {artist.rank}
                    </span>

                    {/* Artist Thumbnail */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0">
                      <img
                        src={artist.coverUrl}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{artist.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{artist.subscribers}</p>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* 3. BOTTOM PERSISTENT PLAYER BAR */}
      <footer className="fixed bottom-0 left-0 right-0 h-20 bg-[#0A0B0E] border-t border-white/[0.08] px-4 sm:px-6 flex items-center justify-between gap-4 z-50">
        {/* Left: Track Cover & Info */}
        <div className="flex items-center gap-3 w-64 shrink-0 min-w-0">
          <div className="w-11 h-11 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0">
            <img
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
              {!isSubscribed && (
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors shrink-0 cursor-pointer"
                  title="Free preview is limited to 15 seconds. Click to upgrade for full tracks."
                >
                  15s Preview
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-400 truncate mt-0.5">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Center: Controls & Scrubber */}
        <div className="flex-1 max-w-2xl flex flex-col items-center gap-1.5 min-w-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsShuffle(!isShuffle)}
              className={`p-1 transition-colors ${isShuffle ? 'text-[#2dd4bf]' : 'text-gray-400 hover:text-white'}`}
            >
              <Shuffle className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setCurrentTime(0)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            {/* Circular Play Button */}
            <button
              type="button"
              onClick={() => handlePlayToggle(currentTrack)}
              className="w-8 h-8 rounded-full bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] flex items-center justify-center transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4 fill-white" />
              ) : (
                <Play className="h-4 w-4 fill-white translate-x-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setCurrentTime(0)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <SkipForward className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => toggleLike(currentTrack.id)}
              className={`p-1 transition-colors cursor-pointer ${currentTrack.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
            >
              <Heart className={`h-3.5 w-3.5 ${currentTrack.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>

          {/* Scrubber Progress Bar */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] font-mono text-gray-500 w-8 text-right shrink-0">
              {formatTime(currentTime)}
            </span>
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const targetSec = Math.round(ratio * currentTrack.durationSeconds);
                if (!isSubscribed && targetSec > FREE_PREVIEW_LIMIT_SECONDS) {
                  setCurrentTime(FREE_PREVIEW_LIMIT_SECONDS);
                  audioSynth.stop();
                  setIsPlaying(false);
                  setShowUpgradeModal(true);
                  return;
                }
                setCurrentTime(targetSec);
              }}
              className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer relative group"
            >
              <div
                className="h-full bg-gradient-to-r from-[#04564f] to-[#2dd4bf] transition-all"
                style={{ width: `${progressRatio}%` }}
              />
              {!isSubscribed && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 z-10"
                  style={{ left: `${Math.min(100, (FREE_PREVIEW_LIMIT_SECONDS / currentTrack.durationSeconds) * 100)}%` }}
                  title="15-second free preview limit"
                />
              )}
            </div>
            <span className="text-[10px] font-mono text-gray-500 w-8 shrink-0">
              {!isSubscribed ? '0:15' : currentTrack.duration}
            </span>
          </div>
        </div>

        {/* Right: Volume & Options */}
        <div className="hidden sm:flex items-center gap-3 w-64 justify-end shrink-0">
          <div className="flex items-center gap-1.5 text-gray-400">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-16 h-1 bg-white/20 rounded-lg accent-[#2dd4bf] cursor-pointer"
            />
          </div>

          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
            title="Equalizer"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
            title="Playlist Queue"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>
      </footer>

      {/* CREATE PLAYLIST MODAL */}
      {showCreatePlaylistModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-[#121316] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create New Playlist</h3>
              <button
                type="button"
                onClick={() => setShowCreatePlaylistModal(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreatePlaylist} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-gray-400 mb-1">
                  Playlist Title
                </label>
                <input
                  type="text"
                  required
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="e.g. Late Night Synthwave"
                  className="w-full h-10 px-3 rounded-lg bg-[#181a1f] border border-white/10 text-xs text-white focus:outline-none focus:border-[#2dd4bf]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreatePlaylistModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#04564f] hover:bg-[#03453f] text-xs font-bold text-white uppercase tracking-wider"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPGRADE SUBSCRIPTION MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#121316] border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#2dd4bf]" />
                <h3 className="text-lg font-black text-white">Upgrade to Caution Plus</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              {!isSubscribed && currentTime >= FREE_PREVIEW_LIMIT_SECONDS
                ? "You've reached the 15-second preview limit for free accounts. Upgrade to Caution Plus to unlock unlimited full-length streaming, WAV stem downloads, and commercial licensing."
                : "Unlock unlimited 24-bit lossless streaming, stem downloads, multi-track separation, and automated synchronization clearance for commercial releases."}
            </p>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2.5 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#2dd4bf]" />
                <span>Unlimited high-fidelity streaming & downloads</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#2dd4bf]" />
                <span>WAV trackout stems (.ZIP) for every track</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#2dd4bf]" />
                <span>Commercial synchronization rights for YouTube, TikTok & DSPs</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="text-2xl font-black text-white">₦3,000</span>
                <span className="text-xs text-gray-400"> / month</span>
              </div>
              <Link
                href="/subscriptions"
                onClick={() => setShowUpgradeModal(false)}
                className="px-5 py-2.5 rounded-full bg-[#04564f] hover:bg-[#03453f] text-xs font-bold text-white uppercase tracking-wider transition-colors inline-block text-center cursor-pointer"
              >
                Upgrade to Plus
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
