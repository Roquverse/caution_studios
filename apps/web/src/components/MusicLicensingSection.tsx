'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  Play,
  Pause,
  Download,
  Heart,
  Star,
  MoreVertical,
  Volume2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  X,
  Lock,
  ArrowRight,
  ShieldCheck,
  Music2,
  Headphones
} from 'lucide-react';
import { audioSynth } from '@caution/ui';
import { useUserSubscription, FREE_PREVIEW_LIMIT_SECONDS } from '../lib/subscription';
import { SEEDED_BEATS } from '../lib/seedBeats';
import { supabase } from '../lib/supabaseClient';

export interface CatalogTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  formattedDuration: string;
  coverUrl: string;
  waveform: number[];
  mood: string;
  theme: string;
  instrument: string;
  audioUrl?: string;
  isSpotlight?: boolean;
}

// Transform seeded beats into initial catalog items
const FALLBACK_CATALOG_TRACKS: CatalogTrack[] = SEEDED_BEATS.slice(0, 10).map((b, idx) => {
  const dur = b.duration_seconds || 180;
  const mins = Math.floor(dur / 60);
  const secs = dur % 60;
  const audioKey = b.preview_clean_key || b.preview_tagged_key;
  return {
    id: b.id,
    title: b.title,
    artist: b.producer?.display_name || 'Caution Studio',
    genre: b.genre || 'Afrobeats',
    duration: dur,
    formattedDuration: `${mins}:${secs.toString().padStart(2, '0')}`,
    coverUrl: b.cover_url || '/images/album_neon_dj.jpg',
    waveform:
      b.waveform_peaks && b.waveform_peaks.length > 0
        ? b.waveform_peaks.slice(0, 34)
        : [0.2, 0.4, 0.6, 0.75, 0.85, 0.95, 0.8, 0.7, 0.6, 0.75, 0.9, 0.85, 0.95, 1.0, 0.8, 0.65, 0.5, 0.6, 0.75, 0.9, 0.85, 0.7, 0.8, 0.95, 0.85, 0.65, 0.5, 0.6, 0.4, 0.3, 0.2, 0.15],
    mood: (b.moods && b.moods[0]) || 'Vibrant',
    theme: (b.tags && b.tags[0]) || 'Commercial',
    instrument:
      b.tags.find((t) =>
        ['Guitar', 'Piano', 'Synthesizer', 'Strings', 'Drums', 'Bass', 'Log Drum'].includes(t)
      ) || 'Synthesizer',
    audioUrl: audioKey ? `/api/media/${audioKey}` : '',
    isSpotlight: idx % 3 === 0
  };
});

const PLATFORMS_GRID = [
  'YouTube', 'TikTok', 'Twitch', 'Websites', 'Applications', 'Film/festivals & cinema',
  'Facebook', 'Twitter', 'Commercials', 'Weddings', 'Podcasts', 'Worldwide coverage',
  'Instagram', 'Vimeo', 'Broadcast', 'Games', 'Presentations', 'Any future platform'
];

interface MusicLicensingSectionProps {
  onStartFree?: () => void;
  onSelectTrack?: (track: CatalogTrack) => void;
}

export const MusicLicensingSection: React.FC<MusicLicensingSectionProps> = ({
  onStartFree,
  onSelectTrack
}) => {
  const { isSubscribed } = useUserSubscription();
  const [tracks, setTracks] = useState<CatalogTrack[]>(FALLBACK_CATALOG_TRACKS);
  const [activeTrackId, setActiveTrackId] = useState<string>(FALLBACK_CATALOG_TRACKS[0]?.id || 'beat-1');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({ 'beat-1': true });
  const [stars, setStars] = useState<Record<string, boolean>>({ 'beat-1': true });

  // 15-second sign-up prompt modal state
  const [showSignUpPrompt, setShowSignUpPrompt] = useState<boolean>(false);
  const [promptTrack, setPromptTrack] = useState<CatalogTrack | null>(null);

  // Sidebar filter category states
  const [activeFilterCategory, setActiveFilterCategory] = useState<string | null>(null);
  const [selectedFilterValue, setSelectedFilterValue] = useState<string>('All');
  const [spotlightOnly, setSpotlightOnly] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch real songs from Supabase
  useEffect(() => {
    async function fetchRealTracks() {
      try {
        const { data: dbBeats, error } = await supabase
          .from('beats')
          .select(`
            id,
            title,
            bpm,
            genre,
            musical_key,
            duration_seconds,
            cover_url,
            master_wav_key,
            preview_clean_key,
            preview_tagged_key,
            moods,
            tags,
            producer:producer_id (
              display_name,
              handle
            )
          `)
          .eq('status', 'live')
          .order('created_at', { ascending: false })
          .limit(15);

        if (!error && dbBeats && dbBeats.length > 0) {
          const mapped: CatalogTrack[] = dbBeats.map((b: any, idx: number) => {
            const dur = b.duration_seconds || 180;
            const mins = Math.floor(dur / 60);
            const secs = dur % 60;
            const audioKey = b.preview_clean_key || b.preview_tagged_key || b.master_wav_key;
            return {
              id: b.id,
              title: b.title,
              artist: b.producer?.display_name || 'Caution Studio',
              genre: b.genre || 'Afrobeats',
              duration: dur,
              formattedDuration: `${mins}:${secs.toString().padStart(2, '0')}`,
              coverUrl: b.cover_url || '/images/album_neon_dj.jpg',
              waveform: [
                0.2, 0.4, 0.6, 0.75, 0.85, 0.95, 0.8, 0.7, 0.6, 0.75, 0.9, 0.85,
                0.95, 1.0, 0.8, 0.65, 0.5, 0.6, 0.75, 0.9, 0.85, 0.7, 0.8, 0.95,
                0.85, 0.65, 0.5, 0.6, 0.4, 0.3, 0.2, 0.15
              ],
              mood: (b.moods && b.moods[0]) || 'Vibrant',
              theme: (b.tags && b.tags[0]) || 'Commercial',
              instrument: 'Synthesizer',
              audioUrl: audioKey ? `/api/media/${audioKey}` : '',
              isSpotlight: idx % 3 === 0
            };
          });
          setTracks(mapped);
          if (mapped[0]) setActiveTrackId(mapped[0].id);
        }
      } catch (err) {
        console.warn('Real track fetch fallback:', err);
      }
    }

    fetchRealTracks();
  }, []);

  // HTML5 audio setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.85;

      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audioRef.current.addEventListener('ended', handleEnded);
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, []);

  // 15-second limiter ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const current = tracks.find((t) => t.id === activeTrackId);
          const fullDur = current ? current.duration : 180;
          const limit = isSubscribed ? fullDur : Math.min(FREE_PREVIEW_LIMIT_SECONDS, fullDur);

          if (prev >= limit) {
            // Cutoff reached!
            if (audioRef.current) audioRef.current.pause();
            audioSynth.stop();
            setIsPlaying(false);

            if (!isSubscribed) {
              setPromptTrack(current || null);
              setShowSignUpPrompt(true);
            }
            return limit;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, activeTrackId, isSubscribed, tracks]);

  const handlePlayToggle = (track: CatalogTrack) => {
    // If not subscribed and preview already exhausted for this session, prompt to sign up
    if (!isSubscribed && currentTime >= FREE_PREVIEW_LIMIT_SECONDS && activeTrackId === track.id) {
      setPromptTrack(track);
      setShowSignUpPrompt(true);
      return;
    }

    if (activeTrackId === track.id) {
      if (isPlaying) {
        if (audioRef.current) audioRef.current.pause();
        audioSynth.stop();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        if (track.audioUrl && audioRef.current) {
          audioRef.current.src = track.audioUrl;
          audioRef.current.currentTime = currentTime;
          audioRef.current.play().catch(() => {
            audioSynth.playTrack(track.id, () => {}, isSubscribed ? undefined : FREE_PREVIEW_LIMIT_SECONDS);
          });
        } else {
          audioSynth.playTrack(track.id, () => {}, isSubscribed ? undefined : FREE_PREVIEW_LIMIT_SECONDS);
        }
      }
    } else {
      if (audioRef.current) audioRef.current.pause();
      audioSynth.stop();

      setActiveTrackId(track.id);
      setIsPlaying(true);
      setCurrentTime(0);

      if (track.audioUrl && audioRef.current) {
        audioRef.current.src = track.audioUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          audioSynth.playTrack(track.id, () => {}, isSubscribed ? undefined : FREE_PREVIEW_LIMIT_SECONDS);
        });
      } else {
        audioSynth.playTrack(track.id, () => {}, isSubscribed ? undefined : FREE_PREVIEW_LIMIT_SECONDS);
      }
    }

    if (onSelectTrack) onSelectTrack(track);
  };

  const handleDownloadClick = (track: CatalogTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSubscribed) {
      setPromptTrack(track);
      setShowSignUpPrompt(true);
    } else if (onStartFree) {
      onStartFree();
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStars((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const filterOptions: Record<string, string[]> = {
    Mood: ['All', 'Vibrant', 'Energetic', 'Chill', 'Dark', 'Club', 'Uplifting'],
    'Video Theme': ['All', 'Commercial', 'Gaming', 'Vlog', 'Podcast', 'Fashion', 'Cinematic'],
    Genre: ['All', 'Afrobeats', 'Amapiano', 'Trap', 'R&B', 'Dancehall', 'Drill', 'Pop', 'Lofi'],
    Instrument: ['All', 'Synthesizer', 'Piano', 'Guitar', 'Strings', 'Drums', 'Bass', 'Log Drum']
  };

  const displayedTracks = tracks.filter((track) => {
    if (spotlightOnly && !track.isSpotlight) return false;
    if (selectedFilterValue !== 'All') {
      if (activeFilterCategory === 'Mood' && track.mood !== selectedFilterValue) return false;
      if (activeFilterCategory === 'Video Theme' && track.theme !== selectedFilterValue) return false;
      if (activeFilterCategory === 'Genre' && !track.genre.toLowerCase().includes(selectedFilterValue.toLowerCase())) return false;
      if (activeFilterCategory === 'Instrument' && track.instrument !== selectedFilterValue) return false;
    }
    return true;
  });

  return (
    <section className="bg-white py-20 lg:py-28 border-t border-gray-100 text-gray-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Headline */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 tracking-tight leading-tight">
            Music licensing for every video creator
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            From YouTube monetization to commercial use worldwide, we&apos;ve got the right plan for you
          </p>
        </div>

        {/* 18 Platforms Checklist Grid (3 rows x 6 columns) */}
        <div className="max-w-5xl mx-auto mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-3 gap-y-3.5 text-left">
            {PLATFORMS_GRID.map((platform, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-gray-700">
                <Check className="h-4 w-4 text-[#04564f] stroke-[2.5] shrink-0" />
                <span className="truncate">{platform}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top CTA Button */}
        <div className="flex justify-center mb-16">
          <button
            type="button"
            onClick={onStartFree ? onStartFree : () => (window.location.href = '/sign-up')}
            className="bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-md shadow-md shadow-[#04564f]/20 transition-all duration-200 active:scale-95"
          >
            START FREE NOW
          </button>
        </div>

        {/* Interactive Music Catalog Container */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xl shadow-gray-200/50 p-4 sm:p-7 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            {/* Left Sidebar Filter Column */}
            <aside className="w-full lg:w-48 shrink-0 flex flex-col justify-between self-stretch select-none border-b lg:border-b-0 lg:border-r border-gray-150 pb-6 lg:pb-0 lg:pr-6">
              <div className="space-y-3.5">
                {['Mood', 'Video Theme', 'Genre', 'Instrument'].map((cat) => {
                  const isOpen = activeFilterCategory === cat;
                  return (
                    <div key={cat} className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (isOpen) {
                            setActiveFilterCategory(null);
                          } else {
                            setActiveFilterCategory(cat);
                            setSelectedFilterValue('All');
                          }
                        }}
                        className={`flex items-center justify-between w-full text-xs font-semibold tracking-wide transition-colors py-1 ${
                          isOpen ? 'text-[#04564f] font-bold' : 'text-gray-600 hover:text-black'
                        }`}
                      >
                        <span>{cat}</span>
                        {isOpen ? (
                          <ChevronDown className="h-3.5 w-3.5 text-[#04564f]" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="pl-2 pt-1 flex flex-wrap gap-1">
                          {filterOptions[cat].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setSelectedFilterValue(opt)}
                              className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                                selectedFilterValue === opt
                                  ? 'bg-[#04564f] text-white font-medium'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Spotlight Toggle */}
                <button
                  type="button"
                  onClick={() => setSpotlightOnly((prev) => !prev)}
                  className={`flex items-center justify-between w-full text-xs font-semibold tracking-wide transition-colors py-1 ${
                    spotlightOnly ? 'text-[#04564f] font-bold' : 'text-gray-600 hover:text-black'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#04564f]" />
                    Spotlight
                  </span>
                  <div
                    className={`w-7 h-4 rounded-full transition-colors relative p-0.5 ${
                      spotlightOnly ? 'bg-[#04564f]' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${
                        spotlightOnly ? 'translate-x-3' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </button>
              </div>

              {/* Sidebar Action & Pricing */}
              <div className="pt-6 mt-4 border-t border-gray-100 space-y-2">
                <button
                  type="button"
                  onClick={onStartFree ? onStartFree : () => (window.location.href = '/sign-up')}
                  className="w-full bg-[#04564f] hover:bg-[#03453f] text-white text-[11px] font-bold uppercase tracking-wider py-2.5 rounded shadow-sm transition-colors text-center block"
                >
                  START FREE NOW
                </button>
                <a
                  href="#pricing"
                  className="block text-center text-xs text-gray-400 hover:text-gray-900 transition-colors font-medium py-1"
                >
                  Pricing
                </a>
              </div>
            </aside>

            {/* Right Track Listing Table */}
            <div className="flex-1 w-full space-y-1.5 overflow-x-auto">
              {displayedTracks.map((track) => {
                const isCurrent = track.id === activeTrackId;
                const isTrackPlaying = isCurrent && isPlaying;
                const progressRatio = isCurrent ? Math.min(1, currentTime / track.duration) : 0;
                const isLiked = !!favorites[track.id];
                const isStarred = !!stars[track.id];

                return (
                  <div
                    key={track.id}
                    onClick={() => handlePlayToggle(track)}
                    className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-gray-50/90 border-gray-200 shadow-sm'
                        : 'bg-white border-transparent hover:bg-gray-50/60 hover:border-gray-150'
                    }`}
                  >
                    {/* Left: Artwork, Play button, Title, Genre */}
                    <div className="flex items-center gap-3 min-w-[200px] sm:min-w-[280px]">
                      {/* Thumbnail Cover */}
                      <div className="relative h-10 w-10 shrink-0 rounded overflow-hidden bg-gray-100 shadow-sm">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Play/Pause Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayToggle(track);
                        }}
                        className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                          isTrackPlaying
                            ? 'text-[#04564f]'
                            : 'text-gray-500 group-hover:text-black'
                        }`}
                      >
                        {isTrackPlaying ? (
                          <Pause className="h-4 w-4 fill-current" />
                        ) : (
                          <Play className="h-4 w-4 fill-current ml-0.5" />
                        )}
                      </button>

                      {/* Title & Artist/Genre */}
                      <div className="flex flex-col min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                            {track.title}
                          </span>
                          {!isSubscribed && isCurrent && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                              15s
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-gray-400 truncate">
                          {track.artist} • {track.genre}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Live Waveform or Duration */}
                    <div className="flex-1 max-w-md hidden sm:flex items-center gap-3 px-2">
                      {isCurrent ? (
                        <div className="w-full flex items-center gap-2.5">
                          <Volume2 className="h-3.5 w-3.5 text-[#04564f] shrink-0 animate-pulse" />
                          <div className="flex-1 flex items-center gap-0.5 h-6">
                            {track.waveform.map((bar, bIdx) => {
                              const barRatio = bIdx / track.waveform.length;
                              const isFilled = barRatio <= progressRatio;
                              return (
                                <div
                                  key={bIdx}
                                  style={{ height: `${Math.max(15, bar * 100)}%` }}
                                  className={`w-[2.5px] rounded-full transition-colors ${
                                    isFilled ? 'bg-[#04564f]' : 'bg-gray-200'
                                  }`}
                                />
                              );
                            })}
                          </div>
                          <span className="text-[11px] font-mono font-medium text-gray-600 shrink-0">
                            {formatTime(currentTime)} / {!isSubscribed ? '0:15' : track.formattedDuration}
                          </span>
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-end">
                          <span className="text-xs font-mono text-gray-400">
                            {track.formattedDuration}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 text-gray-400">
                      {/* Mobile duration indicator */}
                      <span className="text-xs font-mono text-gray-400 sm:hidden">
                        {track.formattedDuration}
                      </span>

                      {/* Download */}
                      <button
                        type="button"
                        onClick={(e) => handleDownloadClick(track, e)}
                        title="Download / License"
                        className="p-1.5 rounded hover:text-black hover:bg-gray-100 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>

                      {/* Heart */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(track.id, e)}
                        title="Favorite"
                        className={`p-1.5 rounded transition-colors ${
                          isLiked
                            ? 'text-red-500 fill-red-500 hover:text-red-600'
                            : 'hover:text-black hover:bg-gray-100'
                        }`}
                      >
                        <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      </button>

                      {/* Star */}
                      <button
                        type="button"
                        onClick={(e) => toggleStar(track.id, e)}
                        title="Save track"
                        className={`p-1.5 rounded transition-colors ${
                          isStarred
                            ? 'text-amber-400 fill-amber-400 hover:text-amber-500'
                            : 'hover:text-black hover:bg-gray-100'
                        }`}
                      >
                        <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-current' : ''}`} />
                      </button>

                      {/* More */}
                      <button
                        type="button"
                        onClick={(e) => e.stopPropagation()}
                        title="More options"
                        className="p-1.5 rounded hover:text-black hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 15-SECOND SIGN-UP PROMPT MODAL */}
      {showSignUpPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0c0e14] border border-white/10 p-6 sm:p-7 shadow-2xl text-white text-center space-y-5">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowSignUpPrompt(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-full bg-white/[0.05] hover:bg-white/10 transition-colors"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Glowing Accent Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#04564f]/20 border border-[#2dd4bf]/40 text-[#2dd4bf] shadow-lg shadow-[#04564f]/30">
              <Headphones className="h-7 w-7" />
            </div>

            {/* Modal Heading */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20 inline-block mb-1">
                15-Second Free Preview Ended
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Sign Up to Keep Listening
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
                Create a free account to unlock uninterrupted full-length streaming, curate private playlists, and clear your social media channels for monetization.
              </p>
            </div>

            {/* Track Card Snippet */}
            {promptTrack && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-left">
                <img
                  src={promptTrack.coverUrl}
                  alt={promptTrack.title}
                  className="h-11 w-11 rounded-lg object-cover border border-white/10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">
                    {promptTrack.title}
                  </div>
                  <div className="text-[11px] text-gray-400 truncate">
                    {promptTrack.artist} • {promptTrack.genre}
                  </div>
                </div>
                <div className="text-[10px] font-mono text-gray-400 shrink-0">
                  {promptTrack.formattedDuration}
                </div>
              </div>
            )}

            {/* Value checklist */}
            <div className="space-y-2 text-left pt-1">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <Check className="h-3.5 w-3.5 text-[#2dd4bf] shrink-0 stroke-[3]" />
                <span>Full-length lossless audio on all devices</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <Check className="h-3.5 w-3.5 text-[#2dd4bf] shrink-0 stroke-[3]" />
                <span>100% royalty-free monetization clearance</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <Check className="h-3.5 w-3.5 text-[#2dd4bf] shrink-0 stroke-[3]" />
                <span>Download WAV stems and licensing certificates</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={() => (window.location.href = '/sign-up')}
                className="w-full py-3 rounded-xl bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#04564f]/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer border-0"
              >
                <span>Create Free Account</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => (window.location.href = '/sign-in')}
                className="w-full py-2 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                Already have an account? <span className="text-[#2dd4bf] font-semibold underline">Sign In</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
