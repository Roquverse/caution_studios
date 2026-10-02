'use client';

import React, { useState } from 'react';
import { AdminNav } from '../../components/AdminNav';
import { Button, Badge, SearchInput } from '@caution/ui';
import { ShieldCheck, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminLicensesPage() {
  const [claims, setClaims] = useState([
    {
      id: 'CLM-901',
      platform: 'YouTube',
      videoId: 'v=dQw4w9WgXcQ',
      channel: '@mrbeast_gaming',
      track: 'Beat Blitz',
      status: 'Auto-Cleared',
      claimedAt: '10 mins ago'
    },
    {
      id: 'CLM-902',
      platform: 'TikTok',
      videoId: '@hypehouse/7291039401',
      channel: '@hypehouse',
      track: 'Hoodie Season',
      status: 'Auto-Cleared',
      claimedAt: '1 hour ago'
    },
    {
      id: 'CLM-903',
      platform: 'YouTube',
      videoId: 'v=83x19ZqaP1',
      channel: '@indiefilm_co',
      track: 'The Morning Sunrise',
      status: 'Under Review',
      claimedAt: '3 hours ago'
    }
  ]);

  const handleResolve = (id: string) => {
    setClaims(
      claims.map((c) => (c.id === id ? { ...c, status: 'Auto-Cleared' } : c))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16">
      <AdminNav activePath="/licenses" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-950 tracking-tight">
              YouTube Content ID & Claims Monitor
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Automated copyright whitelist dispatch and manual dispute clearance queue.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            pill
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={() => alert('Syncing Content ID API...')}
          >
            Sync YouTube API
          </Button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Claim ID</th>
                  <th className="pb-3">Platform</th>
                  <th className="pb-3">Channel / Handle</th>
                  <th className="pb-3">Track Name</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {claims.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 font-mono font-semibold text-gray-700">
                      {c.id}
                    </td>
                    <td className="py-3.5 font-bold text-gray-800">
                      {c.platform}
                    </td>
                    <td className="py-3.5 font-semibold text-gray-900">
                      {c.channel}
                    </td>
                    <td className="py-3.5 text-gray-600">
                      {c.track}
                    </td>
                    <td className="py-3.5">
                      {c.status === 'Auto-Cleared' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Auto-Cleared
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="h-3 w-3" /> Under Review
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-gray-400">
                      {c.claimedAt}
                    </td>
                    <td className="py-3.5 text-right">
                      {c.status === 'Under Review' ? (
                        <Button
                          variant="primary"
                          size="sm"
                          pill
                          onClick={() => handleResolve(c.id)}
                          className="text-[11px] py-1 px-3"
                        >
                          Clear Claim
                        </Button>
                      ) : (
                        <span className="text-gray-400 text-xs">Cleared</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
