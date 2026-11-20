'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { UserHeader } from './UserHeader';
import { UserSidebar } from './UserSidebar';

interface UserShellProps {
  children: React.ReactNode;
  activePath?: string;
}

export function UserShell({ children, activePath }: UserShellProps) {
  const pathname = usePathname() || activePath || '/';
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Derive activeNav based on route
  let activeNav = 'discover';
  if (pathname === '/library' || pathname.startsWith('/library/')) activeNav = 'purchased';
  else if (pathname === '/promote' || pathname.startsWith('/promote/')) activeNav = 'promote';
  else if (pathname === '/studio' || pathname.startsWith('/studio/')) activeNav = 'studio';
  else if (pathname.includes('tab=browse')) activeNav = 'browse';
  else if (pathname.includes('tab=charts')) activeNav = 'charts';
  else if (pathname.includes('tab=genres')) activeNav = 'genres';
  else if (pathname.includes('tab=playlists')) activeNav = 'playlists';
  else if (pathname.includes('tab=fav') || pathname.includes('tab=favorites')) activeNav = 'fav';
  else if (pathname.includes('tab=history')) activeNav = 'history';

  return (
    <div className="min-h-screen w-full bg-[#0d0e12] text-white flex flex-col font-sans selection:bg-[#e53935] selection:text-white">
      <UserHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        mobileMenuOpen={mobileMenuOpen}
      />

      <div className="flex-1 flex w-full relative">
        <UserSidebar activeNav={activeNav} />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
