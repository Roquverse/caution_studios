'use client';

import React from 'react';
import { TopNav } from '../components/layout/TopNav';
import { HeroStitch } from '../components/home/HeroStitch';
import { FeaturedBeatsSection } from '../components/home/FeaturedBeatsSection';
import { LicensePlatformSection } from '../components/home/LicensePlatformSection';
import { WorkflowProcessSection } from '../components/home/WorkflowProcessSection';
import { FaqSection } from '../components/home/FaqSection';
import { HomeFooter } from '../components/home/HomeFooter';
import { CartDrawer } from '../components/cart/CartDrawer';
import { NowPlayingPanel } from '../components/audio/NowPlayingPanel';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg text-text flex flex-col pb-20">
      {/* 1. Pill Top Navigation */}
      <TopNav />

      {/* 2. Stitch Hero Section */}
      <HeroStitch />

      {/* 3. Featured Beats Catalog (List & Grid) */}
      <FeaturedBeatsSection />

      {/* 4. Transparent Licensing Tiers */}
      <LicensePlatformSection />

      {/* 5. How It Works (Workflow) */}
      <WorkflowProcessSection />

      {/* 6. FAQ Section */}
      <FaqSection />

      {/* 7. Flat Footer */}
      <HomeFooter />

      {/* Global Slideout Drawers */}
      <CartDrawer />
      <NowPlayingPanel />
    </div>
  );
}
