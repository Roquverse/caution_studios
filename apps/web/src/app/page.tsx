'use client';

import React, { useState, useEffect } from 'react';
import {
  Navbar,
  HeroSection,
  BrandsRow,
  LicensingGrid,
  FilterSidebar,
  TrackRow,
  AudioPlayer,
  TestimonialsSection,
  FAQSection,
  CtaBanner,
  Footer,
  LicenseCertificateModal,
  SearchInput,
  audioSynth,
  MOCK_TRACKS
} from '@caution/ui';
import { Track, FilterState } from '@caution/types';
import { Sparkles, Music } from 'lucide-react';

export default function LandingPage() {
  const [tracks, setTracks] = useState<Track[]>(MOCK_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(MOCK_TRACKS[1]); // "Beat Blitz" pre-selected matching screenshot!
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(80); // 1:20 matching screenshot!
  const [favorites, setFavorites] = useState<string[]>(['track-2']);
  const [licenseModalTrack, setLicenseModalTrack] = useState<Track | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedMoods: [],
    selectedThemes: [],
    selectedGenres: [],
    selectedInstruments: [],
    spotlightOnly: false,
    sortBy: 'popular'
  });

  // Handle Play / Pause Toggle with real audio synthesizer
  const handlePlayToggle = (track: Track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setCurrentTime(0);
      audioSynth.playTrack(track.id, (secs) => {
        setCurrentTime((prev) => {
          if (prev >= track.duration) {
            audioSynth.stop();
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.25;
        });
      });
    }
  };

  const handlePlayerPlayToggle = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audioSynth.playTrack(currentTrack.id, (secs) => {
        setCurrentTime((prev) => {
          if (prev >= currentTrack.duration) {
            audioSynth.stop();
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.25;
        });
      });
    }
  };

  const handleSeek = (ratio: number) => {
    if (!currentTrack) return;
    const newTime = ratio * currentTrack.duration;
    setCurrentTime(newTime);
  };

  const handleNextTrack = () => {
    if (!currentTrack) return;
    const currentIdx = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = (currentIdx + 1) % tracks.length;
    handlePlayToggle(tracks[nextIdx]);
  };

  const handlePrevTrack = () => {
    if (!currentTrack) return;
    const currentIdx = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = (currentIdx - 1 + tracks.length) % tracks.length;
    handlePlayToggle(tracks[prevIdx]);
  };

  const toggleFavorite = (track: Track) => {
    setFavorites((prev) =>
      prev.includes(track.id) ? prev.filter((id) => id !== track.id) : [...prev, track.id]
    );
  };

  // Filter tracks based on search & category selections
  const filteredTracks = tracks.filter((track) => {
    if (
      filters.searchQuery &&
      !track.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
      !track.artist.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
      !track.genre.some((g) => g.toLowerCase().includes(filters.searchQuery.toLowerCase()))
    ) {
      return false;
    }
    if (filters.spotlightOnly && !track.isSpotlight) {
      return false;
    }
    if (
      filters.selectedGenres.length > 0 &&
      !track.genre.some((g) => filters.selectedGenres.includes(g))
    ) {
      return false;
    }
    if (
      filters.selectedMoods.length > 0 &&
      !track.mood.some((m) => filters.selectedMoods.includes(m))
    ) {
      return false;
    }
    if (
      filters.selectedThemes.length > 0 &&
      !track.theme.some((t) => filters.selectedThemes.includes(t))
    ) {
      return false;
    }
    if (
      filters.selectedInstruments.length > 0 &&
      !track.instruments.some((i) => filters.selectedInstruments.includes(i))
    ) {
      return false;
    }
    return true;
  });

  const scrollToPricing = () => {
    const el = document.getElementById('pricing-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    else window.location.href = '/pricing';
  };

  const handleStartFree = () => {
    // Navigate to auth app registration or portal
    window.location.href = 'http://localhost:3001/register';
  };

  const handleSignIn = () => {
    window.location.href = 'http://localhost:3001/login';
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* 1. Header Navigation */}
      <Navbar
        brandName="Caution Studio"
        currentPath="/"
        onStartFree={handleStartFree}
        onSignIn={handleSignIn}
        userPortalUrl="http://localhost:3002"
        adminPortalUrl="http://localhost:3003"
        onNavigate={(href) => {
          if (href === '/pricing') scrollToPricing();
          else if (href === '/faq') {
            const el = document.getElementById('faq-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          } else if (href.startsWith('#')) {
            const el = document.querySelector(href);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.location.href = href;
          }
        }}
      />

      <main className="flex-1">
        {/* 2. Hero Section with Floating Cassette Boombox & 3D Golden Clef */}
        <HeroSection
          onStartFree={handleStartFree}
          onPricing={scrollToPricing}
        />

        {/* 3. Brand Logos Row */}
        <BrandsRow />

        {/* 4. Music Licensing Platform Checklist Section */}
        <LicensingGrid onStartFree={handleStartFree} />

        {/* 5. Interactive Music Library / Audio Player Table Section */}
        <section id="library" className="py-16 lg:py-24 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Left Filters Sidebar */}
              <FilterSidebar
                filters={filters}
                onChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
                onStartFree={handleStartFree}
                onPricingClick={scrollToPricing}
              />

              {/* Main Track Table Container */}
              <div className="flex-1 w-full space-y-4">
                {/* Search & Results Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
                  <div className="w-full sm:w-80">
                    <SearchInput
                      value={filters.searchQuery}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
                      }
                      onClear={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                      placeholder="Search songs, artists, genres..."
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="font-medium text-gray-700">
                      Showing {filteredTracks.length} tracks
                    </span>
                    {isPlaying && (
                      <span className="flex items-center gap-1.5 text-[#1E50FF] font-semibold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                        <Music className="h-3 w-3 animate-spin" />
                        Now Playing Audio
                      </span>
                    )}
                  </div>
                </div>

                {/* Track Rows matching the reference image */}
                <div className="space-y-2 bg-white rounded-2xl border border-gray-100/90 p-3 sm:p-4 shadow-sm">
                  {filteredTracks.map((track) => {
                    const isCur = currentTrack?.id === track.id;
                    return (
                      <TrackRow
                        key={track.id}
                        track={track}
                        isPlaying={isPlaying}
                        isCurrent={isCur}
                        currentTime={isCur ? currentTime : 0}
                        isFavorited={favorites.includes(track.id)}
                        onPlayToggle={handlePlayToggle}
                        onSeek={handleSeek}
                        onDownload={(t) => setLicenseModalTrack(t)}
                        onFavoriteToggle={toggleFavorite}
                        onShare={(t) => {
                          navigator.clipboard?.writeText(window.location.href);
                          alert(`Share link for "${t.title}" copied to clipboard!`);
                        }}
                      />
                    );
                  })}

                  {filteredTracks.length === 0 && (
                    <div className="text-center py-12 text-gray-500 space-y-2">
                      <p className="text-sm font-semibold">No tracks match your current filters</p>
                      <button
                        type="button"
                        onClick={() =>
                          setFilters({
                            searchQuery: '',
                            selectedMoods: [],
                            selectedThemes: [],
                            selectedGenres: [],
                            selectedInstruments: [],
                            spotlightOnly: false,
                            sortBy: 'popular'
                          })
                        }
                        className="text-xs text-[#1E50FF] underline hover:no-underline font-medium"
                      >
                        Reset all filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Client Testimonials Section */}
        <TestimonialsSection />

        {/* 7. Frequently Asked Questions Section */}
        <div id="faq-section">
          <FAQSection />
        </div>

        {/* 8. Bottom CTA Banner */}
        <CtaBanner onStartFree={handleStartFree} />
      </main>

      {/* 9. Dark Mega Footer */}
      <Footer brandName="Caution Studio" />

      {/* 10. Sticky Bottom Audio Player Bar */}
      <AudioPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        onPlayToggle={handlePlayerPlayToggle}
        onSeek={handleSeek}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onDownload={(t) => setLicenseModalTrack(t)}
        onFavoriteToggle={toggleFavorite}
        isFavorited={currentTrack ? favorites.includes(currentTrack.id) : false}
      />

      {/* 11. Commercial License Certificate & Download Modal */}
      <LicenseCertificateModal
        isOpen={!!licenseModalTrack}
        onClose={() => setLicenseModalTrack(null)}
        track={licenseModalTrack}
      />
    </div>
  );
}
