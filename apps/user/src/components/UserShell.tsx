'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { UserHeader } from './UserHeader';
import { UserSidebar } from './UserSidebar';
import { UserBottomPlayer } from './UserBottomPlayer';

interface UserShellProps {
  children: React.ReactNode;
  activePath?: string;
  hideBottomPlayer?: boolean;
}

export function UserShell({ children, activePath, hideBottomPlayer = false }: UserShellProps) {
  const pathname = usePathname() || activePath || '/';
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derive activeNav based on route
  let activeNav = 'discover';
  if (pathname === '/settings' || pathname.startsWith('/settings/')) activeNav = 'settings';
  else if (pathname === '/library' || pathname.startsWith('/library/')) activeNav = 'purchased';
  else if (pathname === '/promote' || pathname.startsWith('/promote/')) activeNav = 'promote';
  else if (pathname === '/studio' || pathname.startsWith('/studio/')) activeNav = 'studio';
  else if (pathname === '/profile' || pathname.startsWith('/profile/')) activeNav = 'profile';
  else if (pathname.includes('tab=browse')) activeNav = 'browse';
  else if (pathname.includes('tab=charts')) activeNav = 'charts';
  else if (pathname.includes('tab=genres')) activeNav = 'genres';
  else if (pathname.includes('tab=playlists')) activeNav = 'playlists';
  else if (pathname.includes('tab=fav') || pathname.includes('tab=favorites')) activeNav = 'fav';
  else if (pathname.includes('tab=history')) activeNav = 'history';

  return (
    <div className="h-screen w-full max-w-[100vw] overflow-hidden bg-[#0d0e12] text-white flex flex-col font-sans selection:bg-[#e53935] selection:text-white">
      <UserHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
      />

      <div className="flex-1 flex w-full min-w-0 overflow-hidden relative pb-[72px]">
        {/* Fixed left sidebar */}
        <UserSidebar activeNav={activeNav} />

        {/* Scrollable center workspace */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 pb-16">
          {children}
        </main>
      </div>

      {/* Persistent Bottom Audio Player Bar */}
      {!hideBottomPlayer && <UserBottomPlayer />}
    </div>
  );
}
