'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Home,
  Search,
  Folder,
  FolderHeart,
  Settings,
  SlidersHorizontal,
  Heart,
  Play,
  Pause,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  Music,
  Check,
  Disc3,
  X
} from 'lucide-react';
import { audioSynth } from '@caution/ui';
import { supabase } from '../lib/supabaseClient';
import { SEEDED_BEATS, SEEDED_PRODUCERS } from '../lib/seedBeats';

interface DisplayBeat {
  id: string;
  title: string;
  producerName: string;
  coverUrl: string;
  genre: string;
  duration: number;
  formattedDuration: string;
  isLiked?: boolean;
}

interface DisplayArtist {
  id: string;
  name: string;
  avatarUrl: string;
  role: string;
}

export default function UserStreamingDashboard() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'library' | 'liked' | 'settings'>('home');

  // Supabase Beats & Artists state
  const [beats, setBeats] = useState<DisplayBeat[]>([]);
  const [producers, setProducers] = useState<DisplayArtist[]>([]);
  const [userProfile, setUserProfile] = useState<{ name: string; avatarUrl: string }>({
    name: 'Xavi',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  });

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Playback state
  const [currentBeat, setCurrentBeat] = useState<DisplayBeat | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [likedBeats, setLikedBeats] = useState<Record<string, boolean>>({
    'beat-1': true,
    'beat-2': true,
    'beat-4': true
  });

  // 1. Fetch from Supabase on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch user auth & profile
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', userData.user.id)
            .single();

          if (profile) {
            setUserProfile({
              name: profile.display_name || 'Xavi',
              avatarUrl: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            });
          }
        }

        // Fetch live beats
        const { data: liveBeats, error: beatsErr } = await supabase
          .from('beats')
          .select('id, title, genre, cover_url, duration_seconds, producer:profiles(display_name)')
          .order('created_at', { ascending: false });

        if (!beatsErr && liveBeats && liveBeats.length > 0) {
          const mapped: DisplayBeat[] = liveBeats.map((b: any) => ({
            id: b.id,
            title: b.title,
            producerName: b.producer?.display_name || 'Caution Studio',
            coverUrl: b.cover_url || '/images/album_neon_dj.jpg',
            genre: b.genre || 'Afrobeats',
            duration: b.duration_seconds || 180,
            formattedDuration: `${Math.floor((b.duration_seconds || 180) / 60)}:${(b.duration_seconds || 180) % 60 < 10 ? '0' : ''}${(b.duration_seconds || 180) % 60}`
          }));
          setBeats(mapped);
          setCurrentBeat(mapped[0]);
        } else {
          // Fallback to rich seeded beats matching reference demo
          fallbackSeedData();
        }

        // Fetch producers
        const { data: liveProds, error: prodsErr } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, roles');

        if (!prodsErr && liveProds && liveProds.length > 0) {
          setProducers(
            liveProds.map((p: any) => ({
              id: p.id,
              name: p.display_name,
              avatarUrl: p.avatar_url || '/images/golden_clef.jpg',
              role: 'Producer'
            }))
          );
        } else {
          fallbackProducers();
        }
      } catch (e) {
        fallbackSeedData();
        fallbackProducers();
      }
    }

    loadData();
  }, []);

  const fallbackSeedData = () => {
    const list: DisplayBeat[] = [
      {
        id: 'beat-1',
        title: 'Dill Pe Zakhm Kha Te Hai',
        producerName: 'Nusrat Fateh Ali Khan',
        coverUrl: '/images/album_sunrise.jpg',
        genre: 'Sufi & Qawwali Fusion',
        duration: 215,
        formattedDuration: '3:35'
      },
      {
        id: 'beat-2',
        title: "Can't Feel My Face",
        producerName: 'The Weeknd',
        coverUrl: '/images/album_neon_dj.jpg',
        genre: 'Synth Pop & R&B',
        duration: 218,
        formattedDuration: '3:38'
      },
      {
        id: 'beat-3',
        title: 'Save Your Tears',
        producerName: 'The Weeknd',
        coverUrl: '/images/hero_boombox.jpg',
        genre: '80s Synthwave',
        duration: 215,
        formattedDuration: '3:35'
      },
      {
        id: 'beat-4',
        title: 'Starboy',
        producerName: 'The Weeknd ft. Daft Punk',
        coverUrl: '/images/album_neon_dj.jpg',
        genre: 'Electro R&B',
        duration: 230,
        formattedDuration: '3:50'
      },
      {
        id: 'beat-5',
        title: 'Shape of You',
        producerName: 'Ed Sheeran',
        coverUrl: '/images/golden_clef.jpg',
        genre: 'Pop & Dancehall',
        duration: 233,
        formattedDuration: '3:53'
      },
      {
        id: 'beat-6',
        title: 'Tumhe Dill Lagi',
        producerName: 'Nusrat Fateh Ali Khan',
        coverUrl: '/images/album_sunrise.jpg',
        genre: 'Acoustic Soul',
        duration: 280,
        formattedDuration: '4:40'
      },
      {
        id: 'beat-7',
        title: 'Blinding Lights',
        producerName: 'The Weeknd',
        coverUrl: '/images/hero_boombox.jpg',
        genre: 'Synthwave',
        duration: 200,
        formattedDuration: '3:20'
      },
      {
        id: 'beat-8',
        title: 'Levitating',
        producerName: 'Dua Lipa',
        coverUrl: '/images/album_neon_dj.jpg',
        genre: 'Nu-Disco',
        duration: 203,
        formattedDuration: '3:23'
      },
      {
        id: 'beat-9',
        title: 'Rolling in the Deep',
        producerName: 'Adele',
        coverUrl: '/images/golden_clef.jpg',
        genre: 'Blues & Soul',
        duration: 228,
        formattedDuration: '3:48'
      }
    ];
    setBeats(list);
    setCurrentBeat(list[3]); // Starboy as active Now Playing card matching screenshot!
  };

  const fallbackProducers = () => {
    setProducers([
      {
        id: 'prod-1',
        name: 'Nusrat Fateh Ali Khan',
        avatarUrl: '/images/album_sunrise.jpg',
        role: 'Master Composer'
      },
      {
        id: 'prod-2',
        name: 'The Weeknd',
        avatarUrl: '/images/album_neon_dj.jpg',
        role: 'Recording Artist'
      },
      {
        id: 'prod-3',
        name: 'Elvish Presley',
        avatarUrl: '/images/golden_clef.jpg',
        role: 'Rock & Groove'
      }
    ]);
  };

  // Playback clock
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const max = currentBeat?.duration || 215;
          if (prev >= max) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentBeat]);

  const handlePlayToggle = (beat: DisplayBeat) => {
    if (currentBeat?.id === beat.id) {
      if (isPlaying) {
        audioSynth.stop();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        audioSynth.playTrack(beat.id, () => {});
      }
    } else {
      audioSynth.stop();
      setCurrentBeat(beat);
      setIsPlaying(true);
      setCurrentTime(0);
      audioSynth.playTrack(beat.id, () => {});
    }
  };

  const handleNext = () => {
    if (!beats.length) return;
    const currentIdx = beats.findIndex((b) => b.id === currentBeat?.id);
    let nextIdx = (currentIdx + 1) % beats.length;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * beats.length);
    }
    handlePlayToggle(beats[nextIdx]);
  };

  const handlePrev = () => {
    if (!beats.length) return;
    const currentIdx = beats.findIndex((b) => b.id === currentBeat?.id);
    const prevIdx = (currentIdx - 1 + beats.length) % beats.length;
    handlePlayToggle(beats[prevIdx]);
  };

  const toggleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLikedBeats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filtered beats
  const filteredBeats = useMemo(() => {
    return beats.filter((beat) => {
      if (selectedGenre !== 'All' && !beat.genre.toLowerCase().includes(selectedGenre.toLowerCase())) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          beat.title.toLowerCase().includes(q) ||
          beat.producerName.toLowerCase().includes(q) ||
          beat.genre.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [beats, selectedGenre, searchQuery]);

  // Categories matching the reference screenshot
  const madeForYouBeats = filteredBeats.slice(0, 3);
  const recentlyPlayedBeats = filteredBeats.slice(3, 6);
  const listenAgainBeats = filteredBeats.slice(4, 9);

  const progressRatio = currentBeat && currentBeat.duration > 0
    ? Math.min(1, currentTime / currentBeat.duration)
    : 0.35;

  return (
    <div className="min-h-screen bg-[#07090D] text-white flex select-none overflow-x-hidden">
      {/* 1. Left Vertical Navigation Rail */}
      <aside className="w-20 sm:w-24 shrink-0 flex flex-col items-center py-6 px-2 border-r border-white/[0.06] bg-[#07090D] justify-between z-20">
        <div className="flex flex-col items-center space-y-6 w-full">
          {/* User Profile Avatar */}
          <div className="flex flex-col items-center group cursor-pointer">
            <div className="h-12 w-12 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-[#04564f] to-[#2dd4bf] shadow-md">
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="h-full w-full object-cover rounded-full"
              />
            </div>
            <span className="text-[11px] font-semibold text-gray-300 mt-1.5 tracking-tight group-hover:text-white transition-colors">
              {userProfile.name}
            </span>
          </div>

          {/* Navigation Pill Container */}
          <div className="w-14 sm:w-16 rounded-3xl bg-[#0D121B] border border-white/[0.08] py-4 flex flex-col items-center space-y-6 shadow-xl">
            {/* Home */}
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'home'
                  ? 'text-[#2dd4bf]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div
                className={`p-2 rounded-xl transition-all ${
                  activeTab === 'home' ? 'bg-[#04564f]/30 border border-[#04564f]' : ''
                }`}
              >
                <Home className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">Home</span>
            </button>

            {/* Search */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('search');
                const el = document.getElementById('dashboard-search-input');
                if (el) el.focus();
              }}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'search'
                  ? 'text-[#2dd4bf]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div
                className={`p-2 rounded-xl transition-all ${
                  activeTab === 'search' ? 'bg-[#04564f]/30 border border-[#04564f]' : ''
                }`}
              >
                <Search className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">Search</span>
            </button>

            {/* Library */}
            <button
              type="button"
              onClick={() => setActiveTab('library')}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'library'
                  ? 'text-[#2dd4bf]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div
                className={`p-2 rounded-xl transition-all ${
                  activeTab === 'library' ? 'bg-[#04564f]/30 border border-[#04564f]' : ''
                }`}
              >
                <Folder className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">Library</span>
            </button>

            {/* Liked / Playlists */}
            <button
              type="button"
              onClick={() => setActiveTab('liked')}
              className={`flex flex-col items-center gap-1 transition-all ${
                activeTab === 'liked'
                  ? 'text-[#2dd4bf]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <div
                className={`p-2 rounded-xl transition-all ${
                  activeTab === 'liked' ? 'bg-[#04564f]/30 border border-[#04564f]' : ''
                }`}
              >
                <FolderHeart className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-medium">Library</span>
            </button>
          </div>
        </div>

        {/* Bottom Settings Button */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'settings'
              ? 'text-[#2dd4bf]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div
            className={`p-2 rounded-xl transition-all ${
              activeTab === 'settings' ? 'bg-[#04564f]/30 border border-[#04564f]' : ''
            }`}
          >
            <Settings className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </aside>

      {/* 2. Main Center Discovery Stream */}
      <main className="flex-1 p-5 sm:p-7 overflow-y-auto space-y-7 max-w-[1200px]">
        {/* Top Search Input Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative flex items-center">
            <Search className="absolute left-4 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              id="dashboard-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="I want to listen to..."
              className="w-full bg-[#10151E] border border-white/[0.08] hover:border-white/20 focus:border-[#04564f] focus:outline-none rounded-2xl py-3 pl-11 pr-10 text-sm text-white placeholder-gray-400 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Equalizer Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilterDrawer((prev) => !prev)}
            aria-label="Filter beats by genre"
            className={`h-11 w-11 rounded-2xl border flex items-center justify-center transition-all shrink-0 ${
              showFilterDrawer || selectedGenre !== 'All'
                ? 'bg-[#04564f] border-[#2dd4bf] text-white shadow-md shadow-[#04564f]/30'
                : 'bg-[#10151E] border-white/[0.08] text-gray-300 hover:text-white hover:border-white/20'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Pills Drawer (if toggled) */}
        {showFilterDrawer && (
          <div className="p-3.5 rounded-2xl bg-[#0E131B] border border-white/[0.08] flex items-center gap-2 overflow-x-auto animate-fadeIn">
            {['All', 'Synth Pop', 'Sufi', 'Synthwave', '80s', 'Nu-Disco', 'Afrobeats', 'Trap'].map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => {
                  setSelectedGenre(genre);
                  setShowFilterDrawer(false);
                }}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition-all shrink-0 ${
                  selectedGenre === genre
                    ? 'bg-[#04564f] text-white shadow-sm border border-[#2dd4bf]/40'
                    : 'bg-white/[0.05] text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        )}

        {/* Section 1: "Made For You" */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Made For You
            </h2>
            <button
              type="button"
              onClick={() => setSelectedGenre('All')}
              className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {madeForYouBeats.map((beat) => {
              const isCurrent = currentBeat?.id === beat.id;
              const isPlayingNow = isCurrent && isPlaying;
              const isLiked = !!likedBeats[beat.id];

              return (
                <div
                  key={beat.id}
                  onClick={() => handlePlayToggle(beat)}
                  className="group relative rounded-2xl bg-[#10151E] border border-white/[0.07] hover:border-[#04564f]/60 p-3.5 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#04564f]/10"
                >
                  {/* Artwork Container */}
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/60 shadow-md">
                    <img
                      src={beat.coverUrl}
                      alt={beat.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Top-Right Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => toggleLike(beat.id, e)}
                      title="Save to favorites"
                      className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isLiked ? 'text-red-500 fill-red-500' : 'text-white'
                        }`}
                      />
                    </button>

                    {/* Center Play Button Overlay on Hover or Active Playing */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[1px] transition-opacity ${
                        isPlayingNow ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <div className="h-12 w-12 rounded-full bg-[#04564f] text-white flex items-center justify-center shadow-xl shadow-[#04564f]/50 border border-[#2dd4bf]/40 transform group-hover:scale-105 transition-transform">
                        {isPlayingNow ? (
                          <Pause className="h-5 w-5 fill-white" />
                        ) : (
                          <Play className="h-5 w-5 fill-white ml-0.5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Metadata below image */}
                  <div className="mt-3.5 space-y-0.5">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-[#2dd4bf] transition-colors">
                      {beat.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium truncate">
                      {beat.producerName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: "Recommended Artists" (Producers) */}
        <section className="space-y-3.5 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Recommended Artists
            </h2>
            <button
              type="button"
              onClick={() => setSelectedGenre('All')}
              className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {producers.map((artist) => (
              <div
                key={artist.id}
                onClick={() => setSearchQuery(artist.name)}
                className="group relative rounded-2xl bg-[#10151E] border border-white/[0.07] hover:border-[#04564f]/60 p-3.5 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#04564f]/10"
              >
                {/* Artist Photo */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/60 shadow-md">
                  <img
                    src={artist.avatarUrl}
                    alt={artist.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                </div>

                {/* Name */}
                <div className="mt-3 text-center">
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-[#2dd4bf] transition-colors">
                    {artist.name}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    {artist.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: "Recently Played" */}
        <section className="space-y-3.5 pt-2 pb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Recently Played
            </h2>
            <button
              type="button"
              onClick={() => setSelectedGenre('All')}
              className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentlyPlayedBeats.map((beat) => {
              const isCurrent = currentBeat?.id === beat.id;
              const isPlayingNow = isCurrent && isPlaying;
              const isLiked = !!likedBeats[beat.id];

              return (
                <div
                  key={beat.id}
                  onClick={() => handlePlayToggle(beat)}
                  className="group relative rounded-2xl bg-[#10151E] border border-white/[0.07] hover:border-[#04564f]/60 p-3.5 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#04564f]/10"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-black/60 shadow-md">
                    <img
                      src={beat.coverUrl}
                      alt={beat.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={(e) => toggleLike(beat.id, e)}
                      title="Save to favorites"
                      className="absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all"
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          isLiked ? 'text-red-500 fill-red-500' : 'text-white'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="mt-3 space-y-0.5">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-[#2dd4bf] transition-colors">
                      {beat.title}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium truncate">
                      {beat.producerName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* 3. Right Sidebar (Now Playing Billboard + Listen Again) */}
      <aside className="w-80 xl:w-96 shrink-0 p-5 sm:p-7 border-l border-white/[0.06] bg-[#07090D] hidden lg:flex flex-col space-y-6 overflow-y-auto">
        {/* Top Billboard: "Now Playing" Card */}
        {currentBeat && (
          <div className="relative rounded-3xl overflow-hidden bg-[#10151E] border border-white/[0.08] shadow-2xl group flex flex-col justify-between">
            {/* Billboard Cover Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <img
                src={currentBeat.coverUrl}
                alt={currentBeat.title}
                className="h-full w-full object-cover object-center filter brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#10151E] via-transparent to-black/60" />

              {/* Top Banner Pill: "Now playing: Starboy by Weekend" */}
              <div className="absolute top-3.5 left-3.5 right-3.5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-white/90 shadow-lg">
                  <span className="h-2 w-2 rounded-full bg-[#2dd4bf] animate-pulse" />
                  <span className="truncate">
                    Now playing: <strong className="text-white">{currentBeat.title}</strong> by {currentBeat.producerName}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Floating Glass Player Controls Box */}
            <div className="p-4 sm:p-5 bg-gradient-to-b from-[#10151E]/90 to-[#0A0E15] backdrop-blur-md border-t border-white/[0.08] space-y-4">
              {/* Scrubbing Bar & Time */}
              <div className="space-y-1.5">
                <div
                  className="relative h-1.5 w-full bg-white/10 rounded-full cursor-pointer overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                    setCurrentTime(ratio * (currentBeat.duration || 215));
                  }}
                >
                  <div
                    style={{ width: `${progressRatio * 100}%` }}
                    className="h-full bg-gradient-to-r from-[#04564f] to-[#2dd4bf] rounded-full transition-all duration-150"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>{currentBeat.formattedDuration}</span>
                </div>
              </div>

              {/* Controls Row: Shuffle, Prev, Play/Pause, Next, Volume */}
              <div className="flex items-center justify-between px-2">
                {/* Shuffle */}
                <button
                  type="button"
                  onClick={() => setIsShuffle((prev) => !prev)}
                  title="Toggle shuffle"
                  className={`transition-colors ${
                    isShuffle ? 'text-[#2dd4bf]' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Shuffle className="h-4 w-4" />
                </button>

                {/* Previous */}
                <button
                  type="button"
                  onClick={handlePrev}
                  title="Previous track"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <SkipBack className="h-5 w-5 fill-current" />
                </button>

                {/* Main Play / Pause Circle Button */}
                <button
                  type="button"
                  onClick={() => handlePlayToggle(currentBeat)}
                  title={isPlaying ? 'Pause' : 'Play'}
                  className="h-12 w-12 rounded-full bg-[#04564f] hover:bg-[#03453f] border border-[#2dd4bf]/40 text-white flex items-center justify-center shadow-lg shadow-[#04564f]/40 active:scale-95 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5 fill-white" />
                  ) : (
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  )}
                </button>

                {/* Next */}
                <button
                  type="button"
                  onClick={handleNext}
                  title="Next track"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  <SkipForward className="h-5 w-5 fill-current" />
                </button>

                {/* Volume Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMuted((prev) => !prev)}
                  title="Toggle mute"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4 text-red-400" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Card: "Listen Again" */}
        <div className="rounded-3xl bg-[#10151E] border border-white/[0.08] p-5 shadow-xl space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Listen Again
            </h3>
            <span className="text-[11px] font-mono text-gray-500 uppercase">
              Queue ({listenAgainBeats.length})
            </span>
          </div>

          <div className="space-y-2.5">
            {listenAgainBeats.map((beat) => {
              const isCurrent = currentBeat?.id === beat.id;
              const isPlayingNow = isCurrent && isPlaying;

              return (
                <div
                  key={beat.id}
                  onClick={() => handlePlayToggle(beat)}
                  className={`flex items-center justify-between gap-3 p-2 rounded-xl transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-[#04564f]/25 border border-[#2dd4bf]/30'
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  {/* Thumbnail & Title */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-lg overflow-hidden bg-black/60 shrink-0 relative">
                      <img
                        src={beat.coverUrl}
                        alt={beat.title}
                        className="h-full w-full object-cover"
                      />
                      {isPlayingNow && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="h-2 w-2 rounded-full bg-[#2dd4bf] animate-ping" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs font-bold truncate ${isCurrent ? 'text-[#2dd4bf]' : 'text-white'}`}>
                        {beat.title}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium truncate">
                        {beat.producerName}
                      </span>
                    </div>
                  </div>

                  {/* Play State Indicator */}
                  <div className="shrink-0 text-gray-400">
                    {isPlayingNow ? (
                      <Pause className="h-4 w-4 text-[#2dd4bf] fill-current" />
                    ) : (
                      <Play className="h-4 w-4 hover:text-white" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
