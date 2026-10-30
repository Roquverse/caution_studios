'use client';

import React, { useState } from 'react';
import { HeroSection } from '../components/HeroSection';
import { PillarsSection } from '../components/PillarsSection';
import { GetHeardSection } from '../components/GetHeardSection';
import { TurningPassionSection } from '../components/TurningPassionSection';
import { PricingSection } from '../components/PricingSection';
import { MusicLicensingSection } from '../components/MusicLicensingSection';
import { ClientTestimonialsSection } from '../components/ClientTestimonialsSection';
import { FaqSection } from '../components/FaqSection';
import { JoinCreatorsSection } from '../components/JoinCreatorsSection';
import { HowWeMakeItHappenSection } from '../components/HowWeMakeItHappenSection';
import { FreshFromStudioSection } from '../components/FreshFromStudioSection';
import { LetsTalkSection } from '../components/LetsTalkSection';
import { LandingFooter } from '../components/LandingFooter';
import { ArtistAssessmentModal } from '../components/ArtistAssessmentModal';
import { BookCallModal } from '../components/BookCallModal';
import { CheckoutPlanModal } from '../components/CheckoutPlanModal';
import { CartDrawer } from '../components/cart/CartDrawer';
import { NowPlayingPanel } from '../components/audio/NowPlayingPanel';
import { SoundstageModal } from '../components/studio/SoundstageModal';
import { useAudio } from '../components/audio/AudioProvider';
import { AudioPlayer, audioSynth, MOCK_TRACKS } from '@caution/ui';
import { Track } from '@caution/types';
import { useUserSubscription, FREE_PREVIEW_LIMIT_SECONDS } from '../lib/subscription';
import { AUTH_LOGIN_URL, AUTH_SIGNUP_URL, APP_URL } from '../lib/urls';

export default function LandingPage() {
  const { isSubscribed } = useUserSubscription();
  // Modal states
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [assessmentLink, setAssessmentLink] = useState('');
  const [isBookCallOpen, setIsBookCallOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string } | null>(null);
  const [isSoundstageOpen, setIsSoundstageOpen] = useState(false);

  // Global Audio & Cart from AudioProvider
  const {
    cart,
    setIsCartOpen,
    currentBeat,
    isPlaying: isGlobalPlaying,
    currentTime: globalTime,
    duration: globalDuration,
    togglePlay: globalTogglePlay,
    seek: globalSeek
  } = useAudio();

  // Local track state for FreshFromStudio tracks
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Handle Play/Pause
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
      audioSynth.playTrack(track.id, () => {
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

  const handlePlayerPlayToggle = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
    } else {
      if (!isSubscribed && currentTime >= FREE_PREVIEW_LIMIT_SECONDS) {
        setCurrentTime(0);
      }
      setIsPlaying(true);
      const limit = isSubscribed ? currentTrack.duration : Math.min(FREE_PREVIEW_LIMIT_SECONDS, currentTrack.duration);
      audioSynth.playTrack(currentTrack.id, () => {
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

  const handleSeek = (ratio: number) => {
    if (!currentTrack) return;
    const rawTime = ratio * currentTrack.duration;
    const targetSec = !isSubscribed ? Math.min(FREE_PREVIEW_LIMIT_SECONDS, rawTime) : rawTime;
    setCurrentTime(targetSec);
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
      {/* 1. Hero Section (Billboard night concert atmosphere + header + search + partner tickers) */}
      <HeroSection
        onSearch={(q) => (window.location.href = `/beats?q=${encodeURIComponent(q)}`)}
        onAnalyze={handleAnalyze}
        onBookCall={() => setIsBookCallOpen(true)}
        onOpenAssessment={() => setIsAssessmentOpen(true)}
        onSignIn={() => (window.location.href = AUTH_LOGIN_URL)}
        onGetStarted={() => (window.location.href = APP_URL)}
        onOpenSoundstage={() => (window.location.href = APP_URL)}
        cartCount={cart.length}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* 7. Music Licensing & Interactive Beat Catalog (Matching Reference Design) */}
      <MusicLicensingSection
        onStartFree={() => (window.location.href = AUTH_SIGNUP_URL)}
      />

      <PricingSection
        onSelectPlan={handleSelectPlan}
      />

      {/* 8. Client Testimonials Carousel */}
      <ClientTestimonialsSection />

      {/* 9. Frequently Asked Questions Accordion */}
      <FaqSection />



      {/* 10. Join 40,000 Creators CTA Banner */}
      <JoinCreatorsSection
        onStartFree={() => (window.location.href = AUTH_SIGNUP_URL)}
      />

      {/* 11. Footer (Brand info, Explore, Insights, Follow) */}
      <LandingFooter
        onOpenAssessment={() => setIsAssessmentOpen(true)}
        onBookCall={() => setIsBookCallOpen(true)}
      />

      {/* Sticky Audio Player (appears whenever a studio track is selected) */}
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
      <CartDrawer />
      <NowPlayingPanel />

      {/* Caution Soundstage Modal */}
      <SoundstageModal
        isOpen={isSoundstageOpen}
        onClose={() => setIsSoundstageOpen(false)}
      />
    </div>
  );
}
