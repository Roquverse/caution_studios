'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@caution/ui';
import { APP_URL, AUTH_LOGIN_URL } from '../../lib/urls';
import { useUserSubscription } from '../../lib/subscription';
import { UserDropdown } from '../UserDropdown';
import { useAudio } from '../audio/AudioProvider';
import { supabase } from '../../lib/supabaseClient';

export interface TopNavProps {
  transparent?: boolean;
  onOpenCart?: () => void;
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  transparent = false,
  onOpenCart,
  onSignIn,
  onGetStarted
}) => {
  const pathname = usePathname();
  const { isLoggedIn, userProfile } = useUserSubscription();
  const audio = useAudio();
  const cart = audio?.cart || [];
  const setIsCartOpen = audio?.setIsCartOpen;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About Us', href: '/about' },
    { label: 'Beat Store', href: `${APP_URL}?tab=marketplace` },
    { label: 'Library', href: '/library' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Credit', href: '/#credits' },
    { label: 'Contact Us', href: '/contact' }
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileMenuOpen(false);

    if (href === '/') {
      if (pathname === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (href.startsWith('/#')) {
      if (pathname === '/') {
        e.preventDefault();
        const id = href.replace('/#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
      return;
    }
  };

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/#')) return false;
    return pathname === href || (href !== '/' && pathname?.startsWith(href));
  };

  const handleCartClick = () => {
    if (onOpenCart) {
      onOpenCart();
    } else if (setIsCartOpen) {
      setIsCartOpen(true);
    }
  };

  const handleSignInClick = (e: React.MouseEvent) => {
    if (onSignIn) {
      e.preventDefault();
      onSignIn();
    }
  };

  const handleGetStartedClick = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      window.location.href = APP_URL;
    }
  };

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await supabase.auth.signOut();
    if (typeof document !== 'undefined') {
      const isProd = window.location.hostname.includes('cautionstudioz.com');
      const domainStr = isProd ? '; domain=.cautionstudioz.com' : '';
      document.cookie = `sb-token=; path=/; max-age=0${domainStr}`;
      document.cookie = `sb-refresh=; path=/; max-age=0${domainStr}`;
    }
    window.location.href = '/';
  };

  return (
    <header
      className={
        transparent
          ? 'relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-transparent w-full'
          : 'sticky top-0 z-40 w-full bg-[#07090D]/95 border-b border-white/10 backdrop-blur-xl'
      }
    >
      <div
        className={
          transparent
            ? 'flex h-20 items-center justify-between'
            : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-20 items-center justify-between'
        }
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center">
          <img
            src="/logo.png"
            alt="Caution Studio"
            className="h-10 sm:h-12 w-auto object-contain brightness-0 invert"
            style={{ width: 150 }}
          />
        </Link>

        {/* Desktop Navigation Menu (Matching Home Navbar) */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 bg-white/5 border border-white/10 px-6 py-2 rounded-full backdrop-blur-xl shadow-inner">
          {navLinks.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`text-xs lg:text-sm font-medium transition-colors py-1 relative group ${
                  active ? 'text-white font-semibold' : 'text-neutral-300 hover:text-white'
                }`}
              >
                {link.label}
                <span
                  className={`absolute bottom-0 left-0 h-0.5 bg-[#2dd4bf] transition-all duration-300 ${
                    active ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right Action & Mobile Menu Toggle */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Cart Icon */}
          {cart.length > 0 && (
            <button
              type="button"
              onClick={handleCartClick}
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-colors"
              aria-label="View Cart"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#04564f] text-white font-bold text-[10px] flex items-center justify-center border border-[#2dd4bf]/30">
                {cart.length}
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
                onClick={handleSignInClick}
                className="hidden md:inline-flex text-xs sm:text-sm font-medium text-neutral-300 hover:text-white px-2 sm:px-3 py-1.5 transition-colors"
              >
                Sign In
              </a>

              <Button
                variant="primary"
                size="sm"
                pill
                onClick={handleGetStartedClick}
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
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="flex items-center justify-between py-2 text-base font-medium text-neutral-200 hover:text-white hover:bg-white/5 px-3 rounded-xl transition-colors"
              >
                <span>{link.label}</span>
                <ArrowRight className="h-4 w-4 text-neutral-500" />
              </Link>
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
                  onClick={handleSignOut}
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
                    handleGetStartedClick();
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
  );
};
