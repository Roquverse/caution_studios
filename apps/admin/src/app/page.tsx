'use client';

import React, { useState } from 'react';
import { AdminNav } from '../components/AdminNav';
import {
  StatsCard,
  Button,
  Badge,
  Card,
  MOCK_TRACKS
} from '@caution/ui';
import {
  Music,
  DollarSign,
  Users,
  Download,
  Plus,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16">
      <AdminNav activePath="/" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-gray-950 tracking-tight">
              Platform Analytics & Overview
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Real-time synchronization metrics, audio catalog growth, and subscriber telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              pill
              onClick={() => (window.location.href = '/licenses')}
            >
              Claims Monitor
            </Button>
            <Button
              variant="primary"
              size="sm"
              pill
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => (window.location.href = '/tracks')}
            >
              Upload Track
            </Button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Catalog Audio"
            value="12,480"
            change="+340 this week"
            isPositive={true}
            icon={<Music className="h-4 w-4" />}
          />
          <StatsCard
            title="Monthly Revenue"
            value="$184,200"
            change="+14.8%"
            isPositive={true}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <StatsCard
            title="Active Creators"
            value="42,910"
            change="+1,250"
            isPositive={true}
            icon={<Users className="h-4 w-4" />}
          />
          <StatsCard
            title="Monthly Streams"
            value="3.2M"
            change="+22.4%"
            isPositive={true}
            icon={<Download className="h-4 w-4" />}
          />
        </div>

        {/* 2-column Grid: Top Tracks & Recent Clearances */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Downloaded Tracks */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-950">Top Downloaded Tracks</h3>
                <p className="text-xs text-gray-500">Highest commercial synchronization volume this month</p>
              </div>
              <a href="/tracks" className="text-xs text-[#1E50FF] font-semibold hover:underline flex items-center gap-1">
                View Catalog <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Track</th>
                    <th className="pb-3">Genre</th>
                    <th className="pb-3">BPM</th>
                    <th className="pb-3">Downloads</th>
                    <th className="pb-3 text-right">Plays</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {MOCK_TRACKS.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={t.coverUrl}
                            alt={t.title}
                            className="h-9 w-9 rounded-lg object-cover shadow-2xs"
                          />
                          <div>
                            <span className="font-bold text-gray-900 block">{t.title}</span>
                            <span className="text-[11px] text-gray-400">{t.artist}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-gray-600 font-medium">
                        {t.genre.join(', ')}
                      </td>
                      <td className="py-3 font-mono text-gray-700">
                        {t.bpm}
                      </td>
                      <td className="py-3 font-semibold text-gray-900">
                        {t.downloadsCount?.toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-mono text-gray-500">
                        {t.playsCount?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Clearances */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-base font-bold text-gray-950">Live Clearances</h3>
              <p className="text-xs text-gray-500">Automated Content ID clearances</p>
            </div>

            <div className="space-y-3">
              {[
                { channel: '@mrbeast_gaming', track: 'Beat Blitz', time: '2m ago' },
                { channel: '@mkbhd_studios', track: 'The Morning Sunrise', time: '12m ago' },
                { channel: '@caseyneistat_vlogs', track: 'Hoodie Season', time: '34m ago' },
                { channel: '@peter_mckinnon', track: 'Open Air Kiss', time: '1h ago' },
                { channel: '@samkolder_travel', track: 'Galaxy Groove', time: '2h ago' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-slate-50/50 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-gray-900 block">{item.channel}</span>
                      <span className="text-[10px] text-gray-400">{item.track}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
