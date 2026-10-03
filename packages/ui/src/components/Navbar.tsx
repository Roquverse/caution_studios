'use client';

import React, { useState } from 'react';
import { Button } from './Button';
import { Menu, X, User as UserIcon, Music2, ExternalLink } from 'lucide-react';
import { cn } from '../utils/cn';

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

export interface NavbarProps {
  brandName?: string;
  items?: NavItem[];
  currentPath?: string;
  onNavigate?: (href: string) => void;
  onStartFree?: () => void;
  onSignIn?: () => void;
  userPortalUrl?: string;
  adminPortalUrl?: string;
  className?: string;
}

const DEFAULT_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Credit', href: '/#credits' },
  { label: 'Contact Us', href: '/contact' }
];

export const Navbar: React.FC<NavbarProps> = ({
  brandName = 'Caution Studio',
  items = DEFAULT_ITEMS,
  currentPath = '/',
  onNavigate,
  onStartFree,
  onSignIn,
  userPortalUrl,
  adminPortalUrl,
  className
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(href);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-gray-100/80 bg-white/90 backdrop-blur-md transition-all',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <a
            href="/"
            onClick={(e) => handleLinkClick(e, '/')}
            className="flex items-center"
          >
            <img
              src="/logo.png"
              alt={brandName}
              style={{ width: 150 }}
            />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7">
            {items.map((item) => {
              const isActive = currentPath === item.href || (item.href !== '/' && currentPath.startsWith(item.href));
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item.href)}
                  className={cn(
                    'relative text-sm font-medium transition-colors py-2',
                    isActive
                      ? 'text-[#04564f] font-semibold'
                      : 'text-gray-600 hover:text-gray-950'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#04564f] rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Right CTA / Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Button
            variant="primary"
            size="md"
            pill
            onClick={onStartFree}
            className="text-xs font-bold tracking-wide uppercase px-6 py-2.5 shadow-md hover:shadow-lg"
          >
            GET STARTED
          </Button>

          <button
            type="button"
            onClick={onSignIn}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-950 px-3 py-2 rounded-lg transition-colors"
          >
            <UserIcon className="h-4 w-4 text-gray-400" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            pill
            onClick={onStartFree}
            className="text-xs font-bold px-3 py-1.5"
          >
            GET STARTED
          </Button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white px-4 pt-2 pb-6 space-y-3 animate-fadeIn">
          <div className="flex flex-col space-y-2">
            {items.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleLinkClick(e, item.href)}
                className="px-3 py-2 text-base font-medium text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={onSignIn}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50"
            >
              <UserIcon className="h-4 w-4" />
              <span>Sign In</span>
            </button>
            <Button
              variant="primary"
              size="md"
              pill
              onClick={onStartFree}
              className="w-full text-xs font-bold uppercase tracking-wider py-3"
            >
              GET STARTED
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
