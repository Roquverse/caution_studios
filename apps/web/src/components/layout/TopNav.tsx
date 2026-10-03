'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAudio } from '../audio/AudioProvider';
import { ShoppingBag, Menu, X } from 'lucide-react';

export const TopNav: React.FC = () => {
  const pathname = usePathname();
  const { cart, setIsCartOpen } = useAudio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Credit', href: '/#credits' },
    { label: 'Contact Us', href: '/contact' }
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-bg/95 border-b border-border backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Caution Studio"
            className="h-8 w-auto object-contain brightness-0 invert"
            style={{ width: 140 }}
          />
        </Link>

        {/* Pill Navigation (Section 10 Spec) */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-pill bg-surface border border-border">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname === link.href || (link.href !== '/' && !link.href.startsWith('/#') && pathname.startsWith(link.href));

            return (
              <Link
                key={link.label}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-pill text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-accent-live bg-surface-2 font-semibold'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Links & Cart */}
        <div className="flex items-center gap-3">
          {/* Cart Icon Button */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 rounded-sm text-text-muted hover:text-text border border-border bg-surface"
            aria-label="Cart"
          >
            <ShoppingBag className="h-4 w-4" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent-live text-bg font-bold text-[10px] flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>

          <Link
            href="/sign-in"
            className="hidden sm:inline-flex text-xs font-semibold text-text-muted hover:text-text px-3 py-1.5 transition-colors"
          >
            Sign in
          </Link>

          <Link
            href="/sign-up"
            className="hidden sm:inline-flex h-8 px-4 rounded-pill border border-border hover:border-text-faint text-text text-xs font-semibold items-center justify-center transition-colors"
          >
            Get started
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-sm border border-border text-text-muted hover:text-text"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface p-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-sm text-sm text-text hover:bg-surface-2"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-border flex gap-2">
            <Link
              href="/sign-in"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 h-9 rounded-sm border border-border text-center text-xs font-medium text-text flex items-center justify-center"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 h-9 rounded-sm bg-accent text-center text-xs font-medium text-text flex items-center justify-center"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
