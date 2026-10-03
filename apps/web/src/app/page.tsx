'use client';

import React, { useState } from 'react';
import { HeroSection } from '../components/HeroSection';
import { PillarsSection } from '../components/PillarsSection';
import { GetHeardSection } from '../components/GetHeardSection';
import { TurningPassionSection } from '../components/TurningPassionSection';
import { PricingSection } from '../components/PricingSection';
import { HowWeMakeItHappenSection } from '../components/HowWeMakeItHappenSection';
import { FreshFromStudioSection } from '../components/FreshFromStudioSection';
import { LetsTalkSection } from '../components/LetsTalkSection';
import { LandingFooter } from '../components/LandingFooter';
import { ArtistAssessmentModal } from '../components/ArtistAssessmentModal';
import { BookCallModal } from '../components/BookCallModal';
import { CheckoutPlanModal } from '../components/CheckoutPlanModal';
import { AudioPlayer, audioSynth, MOCK_TRACKS } from '@caution/ui';
import { Track } from '@caution/types';

export default function LandingPage() {
  // Modal states
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [assessmentLink, setAssessmentLink] = useState('');
  const [isBookCallOpen, setIsBookCallOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string } | null>(null);

  // Audio Playback states
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Handle Play/Pause
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
    const list = MOCK_TRACKS;
    if (!currentTrack) {
      if (list.length > 0) handlePlayToggle(list[0]);
      return;
    }
    const currentIdx = list.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = (currentIdx + 1) % list.length;
    handlePlayToggle(list[nextIdx]);
  };

  const handlePrevTrack = () => {
    const list = MOCK_TRACKS;
    if (!currentTrack) {
      if (list.length > 0) handlePlayToggle(list[0]);
      return;
    }
    const currentIdx = list.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = (currentIdx - 1 + list.length) % list.length;
    handlePlayToggle(list[prevIdx]);
  };

  const handleAnalyze = (link: string) => {
    setAssessmentLink(link);
    setIsAssessmentOpen(true);
  };

  const handleSelectPlan = (planName: string, price: string) => {
    setSelectedPlan({ name: planName, price });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col selection:bg-[#04564f] selection:text-white">
      {/* 1. Hero Section (Header + Search input + Partner ticker) */}
      <HeroSection
        onAnalyze={handleAnalyze}
        onBookCall={() => setIsBookCallOpen(true)}
        onOpenAssessment={() => setIsAssessmentOpen(true)}
      />

      {/* 2. 4 Pillars Row (Distribution, Marketing, Playlisting, Radio Promotion) */}
      <PillarsSection />

      {/* 3. Get Heard Where It Matters Most (4 Numbered Cards + Get Featured Banner) */}
      <GetHeardSection
        onGetFeatured={() => {
          setSelectedPlan({ name: 'Premium Beat Plan', price: '₦30,000' });
        }}
      />

      {/* 4. Turning Passion into Milestones (500M+ Streams, 100k+ Playlists, 300% Growth) */}
      <TurningPassionSection
        onQualify={() => setIsAssessmentOpen(true)}
        onLearnMore={() => {
          const el = document.getElementById('process');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* 5. Plans for Every Artist (Starter ₦3k, Premium Beat ₦30k, Exclusive ₦100k) */}
      <PricingSection
        onSelectPlan={handleSelectPlan}
      />

      {/* 6. How We Make It Happen? (01 Submit, 02 Precision Playlisting, 03 Growth + Mockup Cards) */}
      <HowWeMakeItHappenSection />

      {/* 7. Fresh from the Studio (4 Interactive Track Cards with Audio Synth Playback) */}
      <FreshFromStudioSection
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayTrack={handlePlayToggle}
      />

      {/* 8. Let's Talk About Your Music (Direct A&R Call + Interactive Calendar Widget) */}
      <LetsTalkSection
        onBookCall={() => setIsBookCallOpen(true)}
      />

      {/* 9. Footer (Brand info, Explore, Insights, Follow, and Navigation Pill Bar) */}
      <LandingFooter
        onOpenAssessment={() => setIsAssessmentOpen(true)}
        onBookCall={() => setIsBookCallOpen(true)}
      />

      {/* Sticky Audio Player (appears whenever a track is selected/playing) */}
      {currentTrack && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl animate-in slide-in-from-bottom-6 duration-300">
          <AudioPlayer
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onPlayToggle={handlePlayerPlayToggle}
            onSeek={handleSeek}
            onNext={handleNextTrack}
            onPrev={handlePrevTrack}
            onClose={() => {
              audioSynth.stop();
              setIsPlaying(false);
              setCurrentTrack(null);
            }}
          />
        </div>
      )}

      {/* Interactive Modals */}
      <ArtistAssessmentModal
        isOpen={isAssessmentOpen}
        onClose={() => setIsAssessmentOpen(false)}
        spotifyLink={assessmentLink}
        onSelectPlan={handleSelectPlan}
      />

      <BookCallModal
        isOpen={isBookCallOpen}
        onClose={() => setIsBookCallOpen(false)}
      />

      <CheckoutPlanModal
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        plan={selectedPlan}
      />
    </div>
  );
}
