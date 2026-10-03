'use client';

import React from 'react';
import { Play, Pause, Disc3, Sparkles, Volume2 } from 'lucide-react';
import { Track } from '@caution/types';

interface FreshFromStudioProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
}

export const FreshFromStudioSection: React.FC<FreshFromStudioProps> = ({
  currentTrack,
  isPlaying,
  onPlayTrack
}) => {
  const tracks: Track[] = [
    {
      id: 'track-studio-1',
      title: 'Jolly (Afro Banger)',
      artist: 'Sarah Dylan',
      duration: 142,
      formattedDuration: '2:22',
      genre: ['Afrobeats', 'Dancehall'],
      mood: ['Energetic', 'Vibrant'],
      theme: ['Party', 'Summer'],
      instruments: ['Percussion', 'Synth Bass'],
      bpm: 108,
      coverUrl: '/images/album_neon_dj.jpg',
      audioUrl: '',
      waveform: [0.3, 0.6, 0.8, 0.9, 0.7, 0.5, 0.8, 0.9, 0.6, 0.4],
      isFeatured: true,
      downloadsCount: 4210,
      playsCount: 29500
    },
    {
      id: 'track-studio-2',
      title: 'Love On Me',
      artist: 'David Drake',
      duration: 164,
      formattedDuration: '2:44',
      genre: ['Pop', 'R&B'],
      mood: ['Uplifting', 'Romantic'],
      theme: ['Radio', 'Commercial'],
      instruments: ['Acoustic Guitar', 'Drums'],
      bpm: 115,
      coverUrl: '/images/album_sunrise.jpg',
      audioUrl: '',
      waveform: [0.2, 0.5, 0.7, 0.8, 0.9, 0.8, 0.7, 0.5, 0.3, 0.4],
      isFeatured: true,
      downloadsCount: 5120,
      playsCount: 38200
    },
    {
      id: 'track-studio-3',
      title: 'Mirrors (Club Mix)',
      artist: 'The Beat Lab',
      duration: 135,
      formattedDuration: '2:15',
      genre: ['Amapiano', 'Deep House'],
      mood: ['Club', 'Hypnotic'],
      theme: ['Nightlife', 'Dance'],
      instruments: ['Log Drum', 'Rhodes'],
      bpm: 112,
      coverUrl: '/images/hero_boombox.jpg',
      audioUrl: '',
      waveform: [0.4, 0.7, 0.9, 0.8, 0.7, 0.9, 0.8, 0.6, 0.5, 0.3],
      isFeatured: true,
      downloadsCount: 6890,
      playsCount: 52100
    },
    {
      id: 'track-studio-4',
      title: 'Fuck Up The Friendship',
      artist: 'Leah Kate',
      duration: 156,
      formattedDuration: '2:36',
      genre: ['Alt Pop', 'Rock'],
      mood: ['Rebellious', 'High Energy'],
      theme: ['Viral', 'TikTok'],
      instruments: ['Distorted Guitar', 'Punchy Drums'],
      bpm: 130,
      coverUrl: '/images/golden_clef.jpg',
      audioUrl: '',
      waveform: [0.5, 0.8, 0.95, 0.9, 0.7, 0.8, 0.9, 0.85, 0.6, 0.4],
      isFeatured: true,
      downloadsCount: 8430,
      playsCount: 71400
    }
  ];

  return (
    <section id="tracks" className="bg-white py-16 sm:py-20 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-10 sm:mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 tracking-tight">
              Fresh from the Studio
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Listen to the latest charted releases produced & licensed through Caution Studio
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-950">
            <Disc3 className="h-6 w-6 text-[#04564f]" />
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {tracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id;
            const isThisPlaying = isCurrent && isPlaying;

            return (
              <div
                key={track.id}
                className="group relative flex flex-col cursor-pointer"
                onClick={() => onPlayTrack(track)}
              >
                {/* Artwork Container */}
                <div className="relative aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-900 shadow-md group-hover:shadow-xl transition-all duration-300">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Subtle dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />

                  {/* Top Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/10">
                      {track.genre[0]}
                    </span>
                  </div>

                  {/* Play Button Overlay (Bottom-Left or Center) */}
                  <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack(track);
                      }}
                      className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                        isThisPlaying
                          ? 'bg-[#04564f] text-white scale-105 ring-4 ring-white/30'
                          : 'bg-black/70 hover:bg-[#04564f] text-white backdrop-blur-md border border-white/20 group-hover:scale-105'
                      }`}
                      aria-label={isThisPlaying ? 'Pause' : 'Play'}
                    >
                      {isThisPlaying ? (
                        <Pause className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
                      ) : (
                        <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Active playing indicator badge */}
                  {isThisPlaying && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#04564f] text-white px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-ping" />
                      PLAYING
                    </div>
                  )}
                </div>

                {/* Meta details below artwork */}
                <div className="mt-3">
                  <h3 className="font-bold text-gray-950 text-sm sm:text-base leading-snug truncate group-hover:text-[#04564f] transition-colors">
                    {track.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-4 w-4 rounded-full bg-gray-200 overflow-hidden shrink-0">
                      <img
                        src={track.coverUrl}
                        alt={track.artist}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-gray-500 font-medium truncate">
                      {track.artist}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
