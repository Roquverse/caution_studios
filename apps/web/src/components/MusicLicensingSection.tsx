'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { audioSynth } from '@caution/ui';

interface CatalogTrack {
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
  isSpotlight?: boolean;
}

const CATALOG_TRACKS: CatalogTrack[] = [
  {
    id: 'track-1',
    title: 'The Warming Sunrise',
    artist: 'Maximilian Vance',
    genre: 'Cinematic',
    duration: 238,
    formattedDuration: '3:58',
    coverUrl: '/images/album_sunrise.jpg',
    mood: 'Epic',
    theme: 'Cinematic',
    instrument: 'Piano',
    waveform: [
      0.2, 0.35, 0.5, 0.7, 0.85, 0.9, 0.75, 0.6, 0.45, 0.55, 0.7, 0.85, 0.95,
      0.8, 0.65, 0.5, 0.4, 0.6, 0.75, 0.85, 0.9, 0.7, 0.55, 0.4, 0.6, 0.75, 0.6,
      0.45, 0.3, 0.45, 0.6, 0.4, 0.25, 0.15
    ]
  },
  {
    id: 'track-2',
    title: 'Beat Blitz',
    artist: 'Kroma Sound',
    genre: 'Electronic, Funk',
    duration: 91,
    formattedDuration: '1:31',
    coverUrl: '/images/album_neon_dj.jpg',
    mood: 'Energetic',
    theme: 'Gaming',
    instrument: 'Synthesizer',
    isSpotlight: true,
    waveform: [
      0.4, 0.7, 0.85, 0.95, 0.8, 0.65, 0.85, 1.0, 0.85, 0.7, 0.9, 0.8, 0.95,
      1.0, 0.75, 0.6, 0.8, 0.9, 0.75, 0.85, 0.9, 0.7, 0.8, 0.95, 0.85, 0.65,
      0.8, 0.9, 0.75, 0.6, 0.75, 0.55, 0.4, 0.25
    ]
  },
  {
    id: 'track-3',
    title: 'Open Air Kiss',
    artist: 'Luna Horizon',
    genre: 'Electronic, Hip Hop, Lofi...',
    duration: 159,
    formattedDuration: '2:39',
    coverUrl: '/images/golden_clef.jpg',
    mood: 'Chill',
    theme: 'Vlog',
    instrument: 'Guitar',
    waveform: [
      0.2, 0.3, 0.45, 0.6, 0.7, 0.65, 0.5, 0.4, 0.55, 0.65, 0.75, 0.7, 0.6,
      0.45, 0.35, 0.5, 0.65, 0.75, 0.7, 0.55, 0.4, 0.55, 0.7, 0.65, 0.5, 0.4,
      0.35, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15
    ]
  },
  {
    id: 'track-4',
    title: 'Mystery Box - Instrume',
    artist: 'Solstice Project',
    genre: 'Cinematic',
    duration: 80,
    formattedDuration: '1:20',
    coverUrl: '/images/album_sunrise.jpg',
    mood: 'Dramatic',
    theme: 'Cinematic',
    instrument: 'Strings',
    isSpotlight: true,
    waveform: [
      0.2, 0.35, 0.5, 0.65, 0.75, 0.8, 0.65, 0.5, 0.4, 0.55, 0.7, 0.85, 0.9,
      0.8, 0.65, 0.5, 0.4, 0.55, 0.7, 0.8, 0.7, 0.55, 0.4, 0.55, 0.7, 0.6,
      0.45, 0.35, 0.3, 0.4, 0.3, 0.2, 0.15
    ]
  },
  {
    id: 'track-5',
    title: 'Soothe My Mind',
    artist: 'Elysian Beats',
    genre: 'Electronic, Hip Hop, Lofi...',
    duration: 270,
    formattedDuration: '4:30',
    coverUrl: '/images/golden_clef.jpg',
    mood: 'Chill',
    theme: 'Podcast',
    instrument: 'Piano',
    waveform: [
      0.15, 0.25, 0.35, 0.5, 0.6, 0.55, 0.65, 0.5, 0.4, 0.45, 0.55, 0.65, 0.7,
      0.6, 0.45, 0.35, 0.3, 0.45, 0.55, 0.65, 0.6, 0.5, 0.4, 0.3, 0.45, 0.55,
      0.5, 0.4, 0.35, 0.3, 0.25, 0.2, 0.15
    ]
  },
  {
    id: 'track-6',
    title: 'Hoodie Season',
    artist: 'Metro Boom',
    genre: 'Hip Hop',
    duration: 195,
    formattedDuration: '3:15',
    coverUrl: '/images/hero_boombox.jpg',
    mood: 'Energetic',
    theme: 'Fashion',
    instrument: 'Drums',
    waveform: [
      0.3, 0.5, 0.7, 0.85, 0.95, 0.8, 0.7, 0.8, 0.9, 0.75, 0.85, 0.95, 1.0,
      0.85, 0.7, 0.6, 0.75, 0.9, 0.85, 0.75, 0.85, 0.95, 0.8, 0.7, 0.8, 0.9,
      0.75, 0.65, 0.7, 0.6, 0.5, 0.35, 0.2
    ]
  },
  {
    id: 'track-7',
    title: 'Galaxy Groove',
    artist: 'Astral Flow',
    genre: 'Pop, Funk',
    duration: 115,
    formattedDuration: '1:55',
    coverUrl: '/images/album_neon_dj.jpg',
    mood: 'Uplifting',
    theme: 'Commercial',
    instrument: 'Bass',
    isSpotlight: true,
    waveform: [
      0.25, 0.4, 0.6, 0.75, 0.9, 0.8, 0.7, 0.85, 0.95, 0.85, 0.7, 0.8, 0.9,
      0.85, 0.75, 0.6, 0.7, 0.85, 0.9, 0.8, 0.75, 0.9, 0.85, 0.7, 0.8, 0.75,
      0.65, 0.55, 0.6, 0.45, 0.35, 0.25, 0.15
    ]
  }
];

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
  // Pre-set track-2 as active playing or selected track matching the screenshot!
  const [activeTrackId, setActiveTrackId] = useState<string>('track-2');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(80); // 1:20 matching "1:20 / 1:31" in screenshot
  const [favorites, setFavorites] = useState<Record<string, boolean>>({ 'track-2': true });
  const [stars, setStars] = useState<Record<string, boolean>>({ 'track-2': true });

  // Sidebar filter category states
  const [activeFilterCategory, setActiveFilterCategory] = useState<string | null>(null);
  const [selectedFilterValue, setSelectedFilterValue] = useState<string>('All');
  const [spotlightOnly, setSpotlightOnly] = useState<boolean>(false);

  // Audio playback ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const current = CATALOG_TRACKS.find((t) => t.id === activeTrackId);
          const maxDur = current ? current.duration : 91;
          if (prev >= maxDur) {
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, activeTrackId]);

  const handlePlayToggle = (track: CatalogTrack) => {
    if (activeTrackId === track.id) {
      if (isPlaying) {
        audioSynth.stop();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        audioSynth.playTrack(track.id, () => {});
      }
    } else {
      audioSynth.stop();
      setActiveTrackId(track.id);
      setIsPlaying(true);
      setCurrentTime(0);
      audioSynth.playTrack(track.id, () => {});
    }
    if (onSelectTrack) onSelectTrack(track);
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
    Mood: ['All', 'Epic', 'Energetic', 'Chill', 'Dramatic', 'Uplifting'],
    'Video Theme': ['All', 'Cinematic', 'Gaming', 'Vlog', 'Podcast', 'Fashion', 'Commercial'],
    Genre: ['All', 'Cinematic', 'Electronic', 'Funk', 'Hip Hop', 'Pop'],
    Instrument: ['All', 'Piano', 'Synthesizer', 'Guitar', 'Strings', 'Drums', 'Bass']
  };

  const displayedTracks = CATALOG_TRACKS.filter((track) => {
    if (spotlightOnly && !track.isSpotlight) return false;
    if (selectedFilterValue !== 'All') {
      if (activeFilterCategory === 'Mood' && track.mood !== selectedFilterValue) return false;
      if (activeFilterCategory === 'Video Theme' && track.theme !== selectedFilterValue) return false;
      if (activeFilterCategory === 'Genre' && !track.genre.includes(selectedFilterValue)) return false;
      if (activeFilterCategory === 'Instrument' && track.instrument !== selectedFilterValue) return false;
    }
    return true;
  });

  return (
    <section className="bg-white py-20 lg:py-28 border-t border-gray-100 text-gray-900">
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

                      {/* Title & Genre */}
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {track.title}
                        </span>
                        <span className="text-[11px] text-gray-400 truncate">
                          {track.genre}
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
                            {formatTime(currentTime)} / {track.formattedDuration}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onStartFree) onStartFree();
                        }}
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
    </section>
  );
};
