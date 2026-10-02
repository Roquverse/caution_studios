'use client';

import React from 'react';
import { Music2, LayoutDashboard, Sliders, ShieldCheck, Users, ExternalLink, LogOut } from 'lucide-react';
import { Avatar, Badge } from '@caution/ui';

export function AdminNav({ activePath = '/' }: { activePath?: string }) {
  const links = [
    { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Catalog Manager', href: '/tracks', icon: <Sliders className="h-4 w-4" /> },
    { label: 'Content ID & Licenses', href: '/licenses', icon: <ShieldCheck className="h-4 w-4" /> },
    { label: 'Subscribers', href: '/users', icon: <Users className="h-4 w-4" /> }
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-[#090A0F] text-white border-b border-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-6">
          <a href="/" className="flex items-center gap-2.5 font-bold text-white group">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-9 w-auto max-w-[150px] object-contain brightness-0 invert transition-transform duration-200 group-hover:scale-105"
            />
            <span className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Admin
            </span>
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
                      ? 'bg-white/10 text-white font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Right: Portals & Admin Profile */}
        <div className="flex items-center gap-3">
          <a
            href="http://localhost:3000"
            className="hidden sm:flex items-center gap-1 text-xs text-gray-400 hover:text-white"
          >
            <span>Landing Site</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <a
            href="http://localhost:3002"
            className="hidden sm:flex items-center gap-1 text-xs text-gray-400 hover:text-white"
          >
            <span>User Portal</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <div className="h-4 w-px bg-gray-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <Avatar name="Admin Officer" size="sm" indicator="online" />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight">Admin Master</span>
              <span className="text-[10px] text-gray-400 font-medium">Super Admin</span>
            </div>
          </div>

          <a
            href="http://localhost:3001/login"
            title="Sign Out"
            className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg transition-colors ml-1"
          >
            <LogOut className="h-4 w-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
