'use client';

import React from 'react';
import { Music2, Compass, ShieldCheck, CreditCard, ExternalLink, LogOut } from 'lucide-react';
import { Avatar, Badge } from '@caution/ui';

export function UserNav({ activePath = '/' }: { activePath?: string }) {
  const links = [
    { label: 'Overview', href: '/', icon: <Music2 className="h-4 w-4" /> },
    { label: 'Music Catalog', href: '/library', icon: <Compass className="h-4 w-4" /> },
    { label: 'Licenses & Clearances', href: '/licenses', icon: <ShieldCheck className="h-4 w-4" /> },
    { label: 'Subscription & Billing', href: '/billing', icon: <CreditCard className="h-4 w-4" /> }
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2.5 font-bold text-gray-950 group">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-9 w-auto max-w-[150px] object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <Badge variant="brand" size="sm">
              Creator App
            </Badge>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = activePath === link.href;
              return (
                <a
                  key={link.label}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-[#1E50FF]'
                      : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Right: User Profile & Portals */}
        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3000"
            className="hidden sm:flex items-center gap-1 text-xs text-gray-500 hover:text-black"
          >
            <span>Landing Page</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <div className="h-4 w-px bg-gray-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <Avatar name="Alex Rivers" size="sm" indicator="online" />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-gray-900 leading-tight">Alex Rivers</span>
              <span className="text-[10px] text-gray-400 font-medium">Pro Creator Plan</span>
            </div>
          </div>

          <a
            href="http://localhost:3001/login"
            title="Sign Out"
            className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg transition-colors ml-1"
          >
            <LogOut className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
