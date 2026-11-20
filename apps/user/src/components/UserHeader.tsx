'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Upload, Menu, X } from 'lucide-react';
import { UserDropdown } from './UserDropdown';

export interface UserHeaderProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}

export function UserHeader({
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  onToggleMobileMenu,
  mobileMenuOpen = false
}: UserHeaderProps) {
  const router = useRouter();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(e);
    } else if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="h-16 border-b border-white/[0.06] bg-[#121316] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
      {/* Brand Logo with exact image */}
      <div className="flex items-center shrink-0">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="Caution Studio"
            className="h-7 sm:h-8 w-auto object-contain brightness-0 invert"
          />
        </Link>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex flex-1 max-w-xl mx-4">
        <form onSubmit={handleFormSubmit} className="relative flex items-center w-full">
          <Search className="h-4 w-4 text-gray-400 absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search beats, producers, genres..."
            className="w-full h-10 pl-11 pr-9 rounded-full bg-[#0d0e12] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e53935] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="absolute right-3.5 text-gray-400 hover:text-white cursor-pointer"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Upload Button in Caution Red */}
        <a
          href="https://creator.cautionstudioz.com/beats/upload"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#e53935] hover:bg-[#d32f2f] text-white text-xs font-bold transition-all shadow-md shadow-red-500/20 active:scale-95 cursor-pointer"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Upload</span>
        </a>

        {/* Hamburger Menu Trigger (Mobile only) */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="flex md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
          </button>
        )}

        {/* User Profile Dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
}
