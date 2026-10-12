'use client';

import React, { useState } from 'react';
import { AdminShell } from '../../components/AdminShell';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  ExternalLink
} from 'lucide-react';

export default function AdminLicensesPage() {
  const [search, setSearch] = useState('');
  const [claims, setClaims] = useState([
    {
      id: 'CLM-901',
      platform: 'YouTube',
      videoId: 'v=dQw4w9WgXcQ',
      channel: '@mrbeast_gaming',
      track: 'Neon Overdrive',
      status: 'Auto-Cleared',
      claimedAt: '10 mins ago'
    },
    {
      id: 'CLM-902',
      platform: 'TikTok',
      videoId: '@hypehouse/7291039401',
      channel: '@hypehouse',
      track: 'Neon Overdrive',
      status: 'Auto-Cleared',
      claimedAt: '1 hour ago'
    },
    {
      id: 'CLM-903',
      platform: 'YouTube',
      videoId: 'v=83x19ZqaP1',
      channel: '@indiefilm_co',
      track: 'Neon Overdrive',
      status: 'Under Review',
      claimedAt: '3 hours ago'
    }
  ]);

  const handleResolve = (id: string) => {
    setClaims(
      claims.map((c) => (c.id === id ? { ...c, status: 'Auto-Cleared' } : c))
    );
  };

  const filtered = claims.filter(
    (c) =>
      c.channel.toLowerCase().includes(search.toLowerCase()) ||
      c.track.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminShell activePath="/licenses">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Content ID & Commercial Licenses
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Automated copyright whitelist dispatch, digital fingerprinting, and claim dispute resolution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alert('Syncing Content ID whitelist queue...')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-medium text-zinc-300 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
              <span>Sync Clearance API</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search claims by channel, track, ID..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>

          <span className="text-xs text-zinc-500 font-medium">
            {filtered.length} claims registered
          </span>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-medium uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Claim ID</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Channel / Handle</th>
                  <th className="py-3 px-4">Track Recording</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-zinc-300">
                      {c.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {c.platform}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {c.channel}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {c.track}
                    </td>
                    <td className="py-3 px-4">
                      {c.status === 'Auto-Cleared' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> Auto-Cleared
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle className="h-3 w-3" /> Under Review
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                      {c.claimedAt}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {c.status === 'Under Review' ? (
                        <button
                          type="button"
                          onClick={() => handleResolve(c.id)}
                          className="px-2.5 py-1 rounded bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 font-semibold text-[11px]"
                        >
                          Clear Claim
                        </button>
                      ) : (
                        <span className="text-zinc-500 text-xs">Cleared</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
