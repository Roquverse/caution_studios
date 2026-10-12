'use client';

import React, { useState } from 'react';
import { Button } from '@caution/ui';
import {
  ArrowRight,
  Sparkles,
  Disc3,
  Search,
  Play,
  Radio,
  Volume2,
  Menu,
  X,
  Layers,
  Calendar,
  Music,
  ShoppingBag,
  ShieldCheck,
  Lock,
  Headphones,
  Check
} from 'lucide-react';

interface HeroSectionProps {
  onAnalyze?: (link: string) => void;
  onSearch?: (query: string) => void;
  onBookCall?: () => void;
  onSignIn?: () => void;
  onGetStarted?: () => void;
  onOpenAssessment?: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onAnalyze,
  onSearch,
  onBookCall,
  onSignIn,
  onGetStarted,
  onOpenAssessment,
  cartCount = 0,
  onOpenCart
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        window.location.href = `/beats?q=${encodeURIComponent(searchQuery.trim())}`;
      }
    } else {
      window.location.href = '/beats';
    }
  };

  const navLinks = [
    { label: 'Home', href: '/' },
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

  const featureBadges = [
    'SPOTIFY-STYLE BEAT STREAMING',
    'MONTHLY ₦3,000 SUBSCRIPTIONS',
    'PREMIUM MASTER WAV & STEMS',
    '100% EXCLUSIVE ATOMIC LOCK',
    'LOSSLESS CLOUD AUDIO STREAMING',
    'PAYSTACK VERIFIED CHECKOUT'
  ];

  return (
    <section id="hero" className="relative overflow-hidden bg-[#07090D] text-white">
      {/* Background with Ambient Concert/City Billboard Glow */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Deep ambient gradients simulating billboard atmosphere */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[580px] bg-gradient-to-b from-[#04564f]/30 via-emerald-950/20 to-transparent blur-[120px] rounded-full" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[400px] bg-teal-500/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/3 left-0 w-[450px] h-[350px] bg-[#04564f]/15 blur-[120px] rounded-full" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
            backgroundSize: '36px 36px'
          }}
        />
        {/* Top to bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#07090D]" />
      </div>

      {/* Top Navbar Header inside Hero */}
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
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 bg-white/5 border border-white/10 px-6 py-2 rounded-full backdrop-blur-md shadow-inner">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-xs lg:text-sm font-medium text-gray-300 hover:text-white transition-colors py-1 relative group"
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
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#04564f] text-white font-bold text-[10px] flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
            )}

            <a
              href="/sign-in"
              onClick={(e) => {
                if (onSignIn) {
                  e.preventDefault();
                  onSignIn();
                }
              }}
              className="hidden md:inline-flex text-xs sm:text-sm font-medium text-gray-300 hover:text-white px-2 sm:px-3 py-1.5 transition-colors"
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
                  window.location.href = '/sign-up';
                }
              }}
              className="hidden md:inline-flex text-xs font-bold uppercase tracking-wider px-4 sm:px-5 py-2 sm:py-2.5 bg-[#04564f] hover:bg-[#03453f] text-white transition-all shadow-md shadow-[#04564f]/30"
            >
              Get Started
            </Button>

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
          <div className="md:hidden absolute top-20 left-4 right-4 z-50 rounded-3xl bg-[#0B0F17]/95 border border-white/15 p-6 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-3">
            <div className="flex flex-col space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#2dd4bf]">
                Navigation Menu
              </span>

              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="flex items-center justify-between py-2 text-base font-medium text-gray-200 hover:text-white hover:bg-white/5 px-3 rounded-xl transition-colors"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="h-4 w-4 text-gray-500" />
                </a>
              ))}

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
                      window.location.href = '/sign-up';
                    }
                  }}
                  className="w-full text-xs font-bold uppercase tracking-wider py-3 bg-[#04564f] hover:bg-[#03453f] text-white"
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
                      window.location.href = '/sign-in';
                    }
                  }}
                  className="w-full text-xs font-bold uppercase tracking-wider py-3 border-white/20 text-white hover:bg-white hover:text-black"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-20 sm:pt-14 sm:pb-24 text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-gray-200 mb-6">
          <span className="h-2 w-2 rounded-full bg-[#2dd4bf] animate-pulse" />
          <span>The Beat Streaming &amp; Licensing Marketplace</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-white">
          Stream Quality Beats. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#2dd4bf] to-teal-200">
            Buy Premium &amp; Exclusive Rights.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-base text-gray-300 max-w-3xl mx-auto leading-relaxed">
          The ultimate beat streaming and licensing marketplace for recording artists. Stream thousands of untagged beats on demand with our monthly subscription, or download industry-grade 24-bit WAV masters and full trackout stems. Mixed with pristine vocal headroom and balanced dynamics, our production lets you arrange, record, and mix billboard-quality tracks ready for commercial release on all major streaming platforms.
        </p>

        {/* Beat Discovery Search Form */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-8 max-w-2xl mx-auto relative flex items-center bg-white rounded-full p-1.5 shadow-2xl shadow-black/80 border border-white/20"
        >
          <div className="pl-4 text-gray-400 pointer-events-none">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search beats by genre, mood, tempo, producer (e.g. Afrobeats, 105 BPM)..."
            className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            pill
            className="shrink-0 text-xs uppercase font-bold tracking-wider px-6 py-2.5 bg-[#04564f] hover:bg-[#03453f] shadow-md text-white"
          >
            Find Beats
          </Button>
        </form>

        {/* Trending Genre Quick Filters */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-gray-400 font-medium mr-1">Trending:</span>
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
              href={tag.genre === 'Exclusive' ? '/beats?genre=Exclusive' : `/beats?genre=${encodeURIComponent(tag.genre)}`}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-gray-300 hover:text-white transition-all backdrop-blur-sm"
            >
              {tag.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
