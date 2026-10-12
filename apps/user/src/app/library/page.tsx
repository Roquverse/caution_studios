'use client';

import React, { useState } from 'react';
import { UserNav } from '../../components/UserNav';
import {
  TrackRow,
  FilterSidebar,
  SearchInput,
  AudioPlayer,
  LicenseCertificateModal,
  audioSynth,
  MOCK_TRACKS
} from '@caution/ui';
import { Track, FilterState } from '@caution/types';
import { useUserSubscription, FREE_PREVIEW_LIMIT_SECONDS } from '../../lib/subscription';

export default function UserLibraryPage() {
  const { isSubscribed } = useUserSubscription();
  const [tracks] = useState<Track[]>(MOCK_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [licenseModalTrack, setLicenseModalTrack] = useState<Track | null>(null);
  const [favorites, setFavorites] = useState<string[]>(['track-1', 'track-2']);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedMoods: [],
    selectedThemes: [],
    selectedGenres: [],
    selectedInstruments: [],
    spotlightOnly: false,
    sortBy: 'popular'
  });

  const handlePlayToggle = (track: Track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
    } else {
      if (!isSubscribed && currentTrack?.id === track.id && currentTime >= FREE_PREVIEW_LIMIT_SECONDS) {
        setCurrentTime(0);
      }
      setCurrentTrack(track);
      setIsPlaying(true);
      if (currentTrack?.id !== track.id) {
        setCurrentTime(0);
      }
      const limit = isSubscribed ? track.duration : Math.min(FREE_PREVIEW_LIMIT_SECONDS, track.duration);
      audioSynth.playTrack(track.id, (secs) => {
        setCurrentTime((prev) => {
          if (prev >= limit) {
            audioSynth.stop();
            setIsPlaying(false);
            return limit;
          }
          return prev + 0.25;
        });
      }, isSubscribed ? undefined : FREE_PREVIEW_LIMIT_SECONDS);
    }
  };

  const filteredTracks = tracks.filter((track) => {
    if (
      filters.searchQuery &&
      !track.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
      !track.artist.toLowerCase().includes(filters.searchQuery.toLowerCase())
    ) {
      return false;
    }
    if (filters.spotlightOnly && !track.isSpotlight) return false;
    if (
      filters.selectedGenres.length > 0 &&
      !track.genre.some((g) => filters.selectedGenres.includes(g))
    )
      return false;
    if (
      filters.selectedMoods.length > 0 &&
      !track.mood.some((m) => filters.selectedMoods.includes(m))
    )
      return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      <UserNav activePath="/library" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <FilterSidebar
            filters={filters}
            onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
            onStartFree={() => {}}
            onPricingClick={() => {}}
          />

          <div className="flex-1 w-full space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
              <div className="w-80">
                <SearchInput
                  value={filters.searchQuery}
                  onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                  onClear={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                  placeholder="Filter by song or artist..."
                />
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {filteredTracks.length} tracks available for instant download
              </span>
            </div>

            <div className="space-y-2 bg-white rounded-3xl border border-gray-100 p-4 shadow-xs">
              {filteredTracks.map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  isPlaying={isPlaying}
                  isCurrent={currentTrack?.id === track.id}
                  currentTime={currentTrack?.id === track.id ? currentTime : 0}
                  isFavorited={favorites.includes(track.id)}
                  onPlayToggle={handlePlayToggle}
                  onSeek={(r) => setCurrentTime(r * track.duration)}
                  onDownload={(t) => setLicenseModalTrack(t)}
                  onFavoriteToggle={(t) =>
                    setFavorites((prev) =>
                      prev.includes(t.id) ? prev.filter((id) => id !== t.id) : [...prev, t.id]
                    )
                  }
                  onShare={(t) => alert(`Link for ${t.title} copied!`)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        onPlayToggle={() => {
          if (!currentTrack) return;
          handlePlayToggle(currentTrack);
        }}
        onSeek={(r) => {
          if (currentTrack) {
            const raw = r * currentTrack.duration;
            const targetSec = !isSubscribed ? Math.min(FREE_PREVIEW_LIMIT_SECONDS, raw) : raw;
            setCurrentTime(targetSec);
          }
        }}
        onDownload={(t) => setLicenseModalTrack(t)}
      />

      <LicenseCertificateModal
        isOpen={!!licenseModalTrack}
        onClose={() => setLicenseModalTrack(null)}
        track={licenseModalTrack}
        userName="Alex Rivers (PixelCraft Studios)"
      />
    </div>
  );
}
