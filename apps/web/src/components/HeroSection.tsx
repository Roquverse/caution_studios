'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@caution/ui';
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Search,
  Menu,
  X,
  Music,
  ShoppingBag,
  Headphones,
  Users,
  Sliders,
  Activity,
  Mic,
  Disc3,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { APP_URL, AUTH_LOGIN_URL, AUTH_SIGNUP_URL } from '../lib/urls';
import { useUserSubscription } from '../lib/subscription';
import { UserDropdown } from './UserDropdown';
import { supabase } from '../lib/supabaseClient';

interface HeroSectionProps {
  onAnalyze?: (link: string) => void;
  onSearch?: (query: string) => void;
  onBookCall?: () => void;
  onSignIn?: () => void;
  onGetStarted?: () => void;
  onOpenAssessment?: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenSoundstage?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onAnalyze,
  onSearch,
  onBookCall,
  onSignIn,
  onGetStarted,
  onOpenAssessment,
  cartCount = 0,
  onOpenCart,
  onOpenSoundstage
}) => {
  const { isLoggedIn, userProfile } = useUserSubscription();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<'Discover Beats' | 'Bring Ideas To Life' | 'Direct Producer Chat' | 'Release & Distribute'>('Bring Ideas To Life');
  const [activeTab, setActiveTab] = useState<'wave' | 'eq' | 'music' | 'collab'>('wave');
  const [isRecording, setIsRecording] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(24.36);

  // Subtle live timer increment to give the studio controller device a living feeling
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        const next = prev + 0.05;
        return next > 99.99 ? 0 : parseFloat(next.toFixed(2));
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTimer = (val: number) => {
    const mins = Math.floor(val / 60);
    const secs = (val % 60).toFixed(2);
    const padMins = mins.toString().padStart(2, '0');
    const [wholeSecs, fraction] = secs.split('.');
    const padSecs = wholeSecs.padStart(2, '0');
    return `${padMins}:${padSecs}.${fraction || '00'}`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        window.location.href = `${APP_URL}?tab=marketplace&q=${encodeURIComponent(searchQuery.trim())}`;
      }
    } else {
      window.location.href = `${APP_URL}?tab=marketplace`;
    }
  };

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about' },
    { label: 'Beat Store', href: `${APP_URL}?tab=marketplace` },
    { label: 'Pricing', href: '/pricing' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Credit', href: '/#credits' },
    { label: 'Contact Us', href: '/contact' }
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === '/') {
      e.preventDefault();
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (href.startsWith('/#')) {
      const id = href.replace('/#', '');
      const element = document.getElementById(id);
      if (element) {
        e.preventDefault();
        setMobileMenuOpen(false);
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    if (href.startsWith('#')) {
      e.preventDefault();
      setMobileMenuOpen(false);
      const id = href.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    setMobileMenuOpen(false);
  };

  const workflowSteps: Array<{ name: 'Discover Beats' | 'Bring Ideas To Life' | 'Direct Producer Chat' | 'Release & Distribute' }> = [
    { name: 'Discover Beats' },
    { name: 'Bring Ideas To Life' },
    { name: 'Direct Producer Chat' },
    { name: 'Release & Distribute' }
  ];

  // Simulated 32 audio waveform bars with app green (#2dd4bf / emerald) peak in the center
  const waveformHeights = [
    14, 18, 22, 28, 20, 32, 40, 36, 52, 68, 85, 95, 100, 92, 78, 62,
    58, 74, 90, 98, 100, 88, 70, 50, 38, 42, 30, 24, 26, 18, 15, 12
  ];

  return (
    <section id="hero" className="relative overflow-hidden bg-[#07090D] text-white min-h-[920px]">
      {/* Ambient Floor and Dome Backlight Glow in App Green */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep emerald-teal studio spotlight centered behind the capsule */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[620px] bg-gradient-to-b from-[#04564f]/35 via-emerald-950/20 to-transparent blur-[140px] rounded-full" />
        
        {/* Soft ground reflection glow under the capsule in app green */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[540px] h-[190px] bg-[#04564f]/35 blur-[95px] rounded-full" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[320px] h-[100px] bg-[#2dd4bf]/15 blur-[60px] rounded-full" />
        
        {/* Secondary ambient green accents on the flanks */}
        <div className="absolute top-1/4 left-10 w-[420px] h-[420px] bg-[#04564f]/20 blur-[140px] rounded-full" />
        <div className="absolute top-1/3 right-10 w-[420px] h-[420px] bg-[#2dd4bf]/10 blur-[150px] rounded-full" />

        {/* Fine background grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Top Navbar Header */}
      <header className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Brand Logo */}
          <a href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-10 sm:h-12 w-auto object-contain brightness-0 invert"
              style={{ width: 150 }}
            />
          </a>

          {/* Desktop Navigation Menu */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 bg-white/5 border border-white/10 px-6 py-2 rounded-full backdrop-blur-xl shadow-inner">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-xs lg:text-sm font-medium text-neutral-300 hover:text-white transition-colors py-1 relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#2dd4bf] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Right Action & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            {onOpenCart && cartCount > 0 && (
              <button
                type="button"
                onClick={onOpenCart}
                className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors"
                aria-label="View Cart"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#04564f] text-white font-bold text-[10px] flex items-center justify-center border border-[#2dd4bf]/30">
                  {cartCount}
                </span>
              </button>
            )}

            {isLoggedIn && userProfile ? (
              <div className="hidden md:flex items-center gap-3">
                <a
                  href={APP_URL}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 text-white text-xs font-semibold transition-all group"
                  title="Open App Dashboard"
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-black border border-[#2dd4bf]/50 flex items-center justify-center shrink-0">
                    {userProfile.avatar_url ? (
                      <img src={userProfile.avatar_url} alt={userProfile.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-[#2dd4bf]">
                        {userProfile.display_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="max-w-[130px] truncate text-neutral-200 group-hover:text-white">
                    {userProfile.display_name}
                  </span>
                </a>

                <a
                  href={APP_URL}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white transition-all shadow-md shadow-[#04564f]/40 border border-[#2dd4bf]/30"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#2dd4bf]" />
                </a>

                <UserDropdown initialProfile={userProfile as any} />
              </div>
            ) : (
              <>
                <a
                  href={AUTH_LOGIN_URL}
                  onClick={(e) => {
                    if (onSignIn) {
                      e.preventDefault();
                      onSignIn();
                    }
                  }}
                  className="hidden md:inline-flex text-xs sm:text-sm font-medium text-neutral-300 hover:text-white px-2 sm:px-3 py-1.5 transition-colors"
                >
                  Sign In
                </a>

                <Button
                  variant="primary"
                  size="sm"
                  pill
                  onClick={() => {
                    if (onGetStarted) {
                      onGetStarted();
                    } else {
                      window.location.href = AUTH_SIGNUP_URL;
                    }
                  }}
                  className="hidden md:inline-flex text-xs font-bold uppercase tracking-wider px-4 sm:px-5 py-2 sm:py-2.5 bg-[#04564f] hover:bg-[#03453f] text-white transition-all shadow-md shadow-[#04564f]/40 border border-[#2dd4bf]/20"
                >
                  Get Started
                </Button>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-colors focus:outline-none"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-4 right-4 z-50 rounded-3xl bg-[#0e1014]/95 border border-white/15 p-6 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-3">
            <div className="flex flex-col space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#2dd4bf]">
                Navigation Menu
              </span>

              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="flex items-center justify-between py-2 text-base font-medium text-neutral-200 hover:text-white hover:bg-white/5 px-3 rounded-xl transition-colors"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="h-4 w-4 text-neutral-500" />
                </a>
              ))}

              {isLoggedIn && userProfile ? (
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-black border border-[#2dd4bf]/40 shrink-0 flex items-center justify-center">
                      {userProfile.avatar_url ? (
                        <img src={userProfile.avatar_url} alt={userProfile.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-[#2dd4bf]">
                          {userProfile.display_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{userProfile.display_name}</p>
                      <p className="text-[11px] text-[#2dd4bf] truncate">@{userProfile.handle}</p>
                    </div>
                  </div>

                  <a
                    href={APP_URL}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider py-3 bg-[#04564f] hover:bg-[#03453f] text-white rounded-full shadow-md shadow-[#04564f]/30"
                  >
                    <span>Open App Dashboard</span>
                    <ArrowRight className="h-4 w-4 text-[#2dd4bf]" />
                  </a>

                  <button
                    type="button"
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await supabase.auth.signOut();
                      if (typeof document !== 'undefined') {
                        const isProd = window.location.hostname.includes('cautionstudioz.com');
                        const domainStr = isProd ? '; domain=.cautionstudioz.com' : '';
                        document.cookie = `sb-token=; path=/; max-age=0${domainStr}`;
                        document.cookie = `sb-refresh=; path=/; max-age=0${domainStr}`;
                      }
                      window.location.href = '/';
                    }}
                    className="w-full flex items-center justify-center gap-2 text-xs font-semibold py-2.5 border border-white/15 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-colors cursor-pointer"
                  >
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-white/10 space-y-2.5">
                  <Button
                    variant="primary"
                    size="md"
                    pill
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onGetStarted) {
                        onGetStarted();
                      } else {
                        window.location.href = AUTH_SIGNUP_URL;
                      }
                    }}
                    className="w-full text-xs font-bold uppercase tracking-wider py-3 bg-[#04564f] hover:bg-[#03453f] text-white font-semibold shadow-md shadow-[#04564f]/30"
                  >
                    Get Started
                  </Button>

                  <Button
                    variant="outline"
                    size="md"
                    pill
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onSignIn) {
                        onSignIn();
                      } else {
                        window.location.href = AUTH_LOGIN_URL;
                      }
                    }}
                    className="w-full text-xs font-bold uppercase tracking-wider py-3 border-white/20 text-white hover:bg-white hover:text-black"
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Redesigned Hero Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-20 sm:pb-28">
        
        {/* Top Eyebrow Badge with Commercial Royalty-Free License info */}
        <div className="mb-6 flex justify-center lg:justify-start">
          <a
            href={`${APP_URL}?tab=marketplace`}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-[#2dd4bf]/30 text-xs text-neutral-200 backdrop-blur-xl shadow-lg transition-all hover:scale-105"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#2dd4bf]" />
            <span className="font-semibold text-white">Commercial Royalty-Free License</span>
            <span className="hidden sm:inline text-neutral-400">·</span>
            <span className="hidden sm:inline text-neutral-300">Download, record, monetize &amp; distribute worldwide</span>
            <ArrowRight className="w-3 h-3 text-[#2dd4bf]" />
          </a>
        </div>

        {/* Desktop 3-Column Split Layout / Mobile Responsive Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Huge "Music" + Subtitle + 2 Glass Cards      */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 flex flex-col justify-center order-2 lg:order-1 text-center lg:text-left z-20">
            {/* Huge Headline: "Music" */}
            <h1 className="text-6xl sm:text-7xl lg:text-[104px] font-black tracking-tight leading-none text-white drop-shadow-[0_4px_30px_rgba(255,255,255,0.15)]">
              Music
            </h1>

            {/* Subtitle description tailored to artists bringing music ideas to life with premium beats */}
            <p className="mt-4 sm:mt-6 text-sm sm:text-base text-neutral-300 max-w-md mx-auto lg:mx-0 leading-relaxed font-normal">
              Bring your music ideas to life. Caution Studio connects recording artists with premium, industry-ready beats crafted by top music producers.
            </p>

            {/* Commercial Royalty-Free License Highlight Card (User Requested Specification) */}
            <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-[#0B1E1C]/90 via-[#0B1516]/90 to-[#121418]/90 border border-[#2dd4bf]/40 backdrop-blur-xl shadow-xl max-w-md mx-auto lg:mx-0 text-left relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#2dd4bf]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 text-xs font-bold text-[#2dd4bf] uppercase tracking-wider mb-1.5">
                <div className="p-1 rounded-md bg-[#2dd4bf]/20 text-[#2dd4bf]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Commercial Royalty-Free License</span>
              </div>
              <p className="text-xs sm:text-[13px] text-neutral-200 leading-relaxed font-normal">
                Commercial Royalty-Free License that allows upcoming artists to download beats, record their songs, monetize their music, and distribute their releases worldwide without unnecessary complications.
              </p>
              <div className="mt-3 flex items-center gap-2.5 text-[11px] font-semibold text-neutral-300 pt-2 border-t border-white/5">
                <span className="flex items-center gap-1 text-teal-300">
                  <CheckCircle2 className="w-3 h-3 text-teal-400" />
                  100% Monetization
                </span>
                <span>•</span>
                <span>Worldwide DSP Clearance</span>
                <span>•</span>
                <span>Keep Your Rights</span>
              </div>
            </div>

            {/* Stacked Glassmorphic Feature Cards */}
            <div className="mt-6 sm:mt-8 space-y-3.5 max-w-md mx-auto lg:mx-0 w-full">
              
              {/* Feature Card 1: Top Producer Beats */}
              <a
                href={`${APP_URL}?tab=marketplace`}
                className="group relative flex items-center justify-between p-4 rounded-2xl bg-[#121418]/80 hover:bg-[#161a20]/90 border border-white/[0.08] hover:border-[#2dd4bf]/40 backdrop-blur-xl transition-all duration-300 shadow-lg shadow-black/40 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#04564f]/30 border border-[#2dd4bf]/20 flex items-center justify-center text-[#2dd4bf] group-hover:bg-[#04564f]/50 transition-colors">
                    <Disc3 className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xs sm:text-sm font-semibold text-white tracking-wide group-hover:text-[#2dd4bf] transition-colors">
                      Top Producer Beats
                    </h2>
                    <p className="text-[11px] sm:text-xs text-neutral-400 line-clamp-1">
                      Stream untagged beats and license exclusive rights with master stems.
                    </p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:bg-[#04564f]/40 group-hover:border-[#2dd4bf]/40 transition-all shrink-0 ml-2">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </a>

              {/* Feature Card 2: Artist & Producer Collabs */}
              <a
                href="/producers"
                className="group relative flex items-center justify-between p-4 rounded-2xl bg-[#121418]/80 hover:bg-[#161a20]/90 border border-white/[0.08] hover:border-[#2dd4bf]/40 backdrop-blur-xl transition-all duration-300 shadow-lg shadow-black/40 hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#04564f]/30 border border-[#2dd4bf]/20 flex items-center justify-center text-[#2dd4bf] group-hover:bg-[#04564f]/50 transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xs sm:text-sm font-semibold text-white tracking-wide group-hover:text-[#2dd4bf] transition-colors">
                      Artist &amp; Producer Collabs
                    </h2>
                    <p className="text-[11px] sm:text-xs text-neutral-400 line-clamp-1">
                      Directly connect with verified producers to arrange and record.
                    </p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:bg-[#04564f]/40 group-hover:border-[#2dd4bf]/40 transition-all shrink-0 ml-2">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </a>

            </div>
          </div>

          {/* ======================================================== */}
          {/* CENTER COLUMN: Central Hardware Capsule with Artist Image */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 flex justify-center order-1 lg:order-2 z-10 my-4 lg:my-0">
            <div className="relative w-full max-w-[340px] sm:max-w-[370px]">
              
              {/* Outer Capsule Frame with App Green Accent Glow */}
              <div className="relative rounded-t-[120px] rounded-b-[40px] p-[3px] bg-gradient-to-b from-[#1b3532] via-[#102422] to-[#0c1414] shadow-[0_0_80px_rgba(4,86,79,0.45),0_0_30px_rgba(45,212,191,0.2),0_25px_60px_rgba(0,0,0,0.9)] border border-[#2dd4bf]/25">
                
                {/* Inner Capsule Body */}
                <div className="relative rounded-t-[118px] rounded-b-[38px] bg-[#0c0e11] overflow-hidden flex flex-col">
                  
                  {/* --- UPPER SECTION: Arched Glass Dome enclosing the Artist on Mic --- */}
                  <div className="relative h-[280px] sm:h-[310px] w-full overflow-hidden bg-black rounded-t-[116px]">
                    <img
                      src="/images/artist_on_mic_capsule.jpg"
                      alt="Artist on microphone in Caution Studio capsule"
                      className="w-full h-full object-cover object-center scale-[1.03] transition-transform duration-700 hover:scale-105"
                    />

                    {/* Subtle Emerald-Teal studio ambiance tint */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e11] via-transparent to-[#04564f]/15 pointer-events-none" />
                    
                    {/* Inner metallic dome rim reflection */}
                    <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-[116px]" />
                    
                    {/* Studio Condenser Mic Badge */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-[#2dd4bf]/25 text-[9px] font-mono tracking-widest text-[#2dd4bf] uppercase flex items-center gap-1.5 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-ping" />
                      <span>CAUTION SOUNDSTAGE</span>
                    </div>
                  </div>

                  {/* Horizontal metallic divider bar in app green */}
                  <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#2dd4bf]/50 to-transparent" />

                  {/* --- LOWER SECTION: Studio Controller & Waveform Interface --- */}
                  <div className="p-4 sm:p-5 bg-gradient-to-b from-[#111419] to-[#0a0d10] flex flex-col space-y-4">
                    
                    {/* Status Row: Red Recording Indicator & Running Timer */}
                    <div className="flex items-center justify-between px-1">
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href = APP_URL;
                        }}
                        className="flex items-center gap-2 group cursor-pointer focus:outline-none"
                        title="Open User Dashboard"
                      >
                        <span
                          className={`w-3 h-3 rounded-full ${
                            isRecording
                              ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse'
                              : 'bg-neutral-600'
                          }`}
                        />
                        <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 group-hover:text-white transition-colors">
                          {isRecording ? 'REC' : 'PAUSED'}
                        </span>
                      </button>

                      {/* Studio Timer (00:24.36 style) */}
                      <span className="text-xs sm:text-sm font-mono font-medium tracking-wider text-neutral-300 bg-black/50 px-2 py-0.5 rounded border border-white/5">
                        {formatTimer(timerSeconds)}
                      </span>
                    </div>

                    {/* Active Audio Waveform Graph with App Green Center Peak */}
                    <div className="relative h-14 sm:h-16 w-full bg-black/60 rounded-xl border border-white/[0.06] px-3 flex items-center justify-between gap-[2px] overflow-hidden">
                      {/* Subtle center line */}
                      <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/[0.04] pointer-events-none" />

                      {/* 32 Dynamic Waveform Bars with App Green / Teal Center Peak */}
                      {waveformHeights.map((heightPercent, idx) => {
                        const isCenterPeak = idx >= 10 && idx <= 21;
                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center justify-center h-full"
                          >
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full max-w-[4px] rounded-full transition-all duration-300 ${
                                isCenterPeak
                                  ? 'bg-gradient-to-b from-[#2dd4bf] via-emerald-400 to-[#04564f] shadow-[0_0_8px_rgba(45,212,191,0.7)]'
                                  : 'bg-neutral-600/70'
                              } ${isRecording ? 'animate-pulse' : ''}`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* 4 Tactile Controller Buttons (2x2 Grid) */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      {/* Button 1: Waveform / Audio */}
                      <button
                        type="button"
                        onClick={() => setActiveTab('wave')}
                        className={`h-14 rounded-xl flex items-center justify-center transition-all duration-200 border ${
                          activeTab === 'wave'
                            ? 'bg-[#04564f]/35 border-[#2dd4bf]/50 text-[#2dd4bf] shadow-[0_0_15px_rgba(4,86,79,0.35)]'
                            : 'bg-[#14181c] border-white/[0.06] text-neutral-400 hover:text-white hover:bg-[#1a2026]'
                        }`}
                        title="Waveform Visualizer"
                      >
                        <Activity className="w-5 h-5" />
                      </button>

                      {/* Button 2: Equalizer / Sliders */}
                      <button
                        type="button"
                        onClick={() => setActiveTab('eq')}
                        className={`h-14 rounded-xl flex items-center justify-center transition-all duration-200 border ${
                          activeTab === 'eq'
                            ? 'bg-[#04564f]/35 border-[#2dd4bf]/50 text-[#2dd4bf] shadow-[0_0_15px_rgba(4,86,79,0.35)]'
                            : 'bg-[#14181c] border-white/[0.06] text-neutral-400 hover:text-white hover:bg-[#1a2026]'
                        }`}
                        title="Studio Equalizer"
                      >
                        <Sliders className="w-5 h-5" />
                      </button>

                      {/* Button 3: Musical Note */}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('music');
                          window.location.href = APP_URL;
                        }}
                        className={`h-14 rounded-xl flex items-center justify-center transition-all duration-200 border ${
                          activeTab === 'music'
                            ? 'bg-[#04564f]/35 border-[#2dd4bf]/50 text-[#2dd4bf] shadow-[0_0_15px_rgba(4,86,79,0.35)]'
                            : 'bg-[#14181c] border-white/[0.06] text-neutral-400 hover:text-white hover:bg-[#1a2026]'
                        }`}
                        title="Open User Dashboard"
                      >
                        <Music className="w-5 h-5" />
                      </button>

                      {/* Button 4: Community / Collaborators */}
                      <button
                        type="button"
                        onClick={() => setActiveTab('collab')}
                        className={`h-14 rounded-xl flex items-center justify-center transition-all duration-200 border ${
                          activeTab === 'collab'
                            ? 'bg-[#04564f]/35 border-[#2dd4bf]/50 text-[#2dd4bf] shadow-[0_0_15px_rgba(4,86,79,0.35)]'
                            : 'bg-[#14181c] border-white/[0.06] text-neutral-400 hover:text-white hover:bg-[#1a2026]'
                        }`}
                        title="Collaborative Session"
                      >
                        <Users className="w-5 h-5" />
                      </button>
                    </div>

                  </div>
                </div>
              </div>

              {/* Floating Circular Action Button: "START ↗" in App Green */}
              <button
                type="button"
                onClick={() => {
                  window.location.href = APP_URL;
                }}
                className="absolute top-[48%] -right-4 sm:-right-6 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#0F4F49] via-[#04564f] to-[#033430] border border-[#2dd4bf]/50 hover:border-[#2dd4bf] shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_30px_rgba(45,212,191,0.4)] flex flex-col items-center justify-center text-white transition-all duration-300 hover:scale-105 group z-30"
                title="Go to User Dashboard"
              >
                <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#2dd4bf] group-hover:text-white transition-colors transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                <span className="text-[10px] sm:text-xs font-bold tracking-wider mt-0.5 text-white">
                  START
                </span>
              </button>

            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Studio Card + Huge "Studio" + Stepper      */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 flex flex-col justify-between order-3 text-center lg:text-left z-20">
            
            {/* Top Glassmorphic Card: Studio-Grade Sound */}
            <div className="max-w-md mx-auto lg:mx-0 w-full mb-6 lg:mb-10">
              <div className="group relative flex items-center justify-between p-4 rounded-2xl bg-[#121418]/80 hover:bg-[#161a20]/90 border border-white/[0.08] hover:border-[#2dd4bf]/40 backdrop-blur-xl transition-all duration-300 shadow-lg shadow-black/40">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#04564f]/30 border border-[#2dd4bf]/20 flex items-center justify-center text-[#2dd4bf] group-hover:bg-[#04564f]/50 transition-colors">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xs sm:text-sm font-semibold text-white tracking-wide group-hover:text-[#2dd4bf] transition-colors">
                      Studio-Grade Sound
                    </h2>
                    <p className="text-[11px] sm:text-xs text-neutral-400 line-clamp-1">
                      Record, mix, and master with industry-grade vocal headroom.
                    </p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-400 group-hover:text-white transition-all shrink-0 ml-2">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Huge Headline: "Studio" */}
            <h1 className="text-6xl sm:text-7xl lg:text-[104px] font-black tracking-tight leading-none text-white drop-shadow-[0_4px_30px_rgba(255,255,255,0.15)]">
              Studio
            </h1>

            {/* Vertical Workflow Stepper Indicator */}
            <div className="mt-8 sm:mt-10 pl-2 max-w-xs mx-auto lg:mx-0">
              <div className="relative flex flex-col space-y-5">
                
                {/* Vertical Dotted Line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-[1px] border-l border-dashed border-neutral-700 pointer-events-none" />

                {workflowSteps.map((step) => {
                  const isActive = activeWorkflow === step.name;
                  return (
                    <button
                      key={step.name}
                      type="button"
                      onClick={() => setActiveWorkflow(step.name)}
                      className="flex items-center gap-4 text-left group focus:outline-none cursor-pointer"
                    >
                      {/* Node Bullet in App Green */}
                      <div className="relative z-10 flex items-center justify-center w-4 h-4">
                        {isActive ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#2dd4bf] bg-black flex items-center justify-center shadow-[0_0_12px_rgba(45,212,191,0.8)]">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]" />
                          </div>
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-neutral-600 group-hover:bg-neutral-400 transition-colors" />
                        )}
                      </div>

                      {/* Step Label */}
                      <span
                        className={`text-sm sm:text-base tracking-wide transition-all ${
                          isActive
                            ? 'text-white font-semibold'
                            : 'text-neutral-500 hover:text-neutral-300 font-normal'
                        }`}
                      >
                        {step.name}
                      </span>
                    </button>
                  );
                })}

              </div>
            </div>

          </div>

        </div>

        {/* Integrated Quick Discovery Search Bar below Hero */}
        <div className="mt-14 sm:mt-16 max-w-2xl mx-auto">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center bg-[#101318]/90 rounded-full p-1.5 shadow-2xl shadow-black/80 border border-white/10 hover:border-[#2dd4bf]/40 transition-all backdrop-blur-md"
          >
            <div className="pl-4 text-neutral-400 pointer-events-none">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search beats by genre, mood, tempo (e.g. Afrobeats, 105 BPM, Amapiano)..."
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              pill
              className="shrink-0 text-xs uppercase font-bold tracking-wider px-5 py-2.5 bg-[#04564f] hover:bg-[#03453f] text-white shadow-md shadow-[#04564f]/40 border border-[#2dd4bf]/20"
            >
              Find Beats
            </Button>
          </form>

          {/* Quick Trending Tags */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-neutral-500 font-medium mr-1">Trending:</span>
            {[
              { label: '🔥 Afrobeats', genre: 'Afrobeats' },
              { label: '🎹 Amapiano', genre: 'Amapiano' },
              { label: '🥁 Trap', genre: 'Trap' },
              { label: '🎷 R&B', genre: 'R&B' },
              { label: '⚡ Drill', genre: 'Drill' },
              { label: '🔒 Exclusive Only', genre: 'Exclusive' }
            ].map((tag) => (
              <a
                key={tag.label}
                href={tag.genre === 'Exclusive' ? `${APP_URL}?tab=marketplace&filter=exclusive` : `${APP_URL}?tab=marketplace&genre=${encodeURIComponent(tag.genre)}`}
                className="px-3 py-0.5 rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/[0.06] hover:border-[#2dd4bf]/40 text-neutral-400 hover:text-white transition-all text-[11px]"
              >
                {tag.label}
              </a>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
