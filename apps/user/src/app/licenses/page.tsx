'use client';

import React, { useState } from 'react';
import { UserNav } from '../../components/UserNav';
import { Button, Badge, LicenseCertificateModal, MOCK_TRACKS } from '@caution/ui';
import { Track } from '@caution/types';
import { ShieldCheck, Download, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';

export default function UserLicensesPage() {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const downloadedLicenses = [
    {
      id: 'LIC-BEAT-881920',
      track: MOCK_TRACKS[1], // Beat Blitz
      downloadedAt: 'Oct 01, 2026',
      project: 'Summer Tech Vlog Ep. 4',
      coverage: 'YouTube, TikTok, Instagram',
      status: 'Active & Whitelisted'
    },
    {
      id: 'LIC-SUNR-449102',
      track: MOCK_TRACKS[0], // The Morning Sunrise
      downloadedAt: 'Sep 28, 2026',
      project: 'Iceland Travel Documentary',
      coverage: 'Commercial Worldwide, Cinema',
      status: 'Active & Whitelisted'
    },
    {
      id: 'LIC-HOOD-102934',
      track: MOCK_TRACKS[5], // Hoodie Season
      downloadedAt: 'Sep 22, 2026',
      project: 'Streetwear Brand Promo',
      coverage: 'Broadcast & Social',
      status: 'Active & Whitelisted'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <UserNav activePath="/licenses" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-950 tracking-tight">
              Cleared Licenses & Certificates
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Every track you download receives a perpetual legal synchronization license that protects your video forever.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            pill
            onClick={() => (window.location.href = '/library')}
          >
            Download New Track
          </Button>
        </div>

        {/* Licenses List */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-xs space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Track</th>
                  <th className="pb-3">License ID</th>
                  <th className="pb-3">Registered Project</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Clearance Status</th>
                  <th className="pb-3 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {downloadedLicenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={lic.track.coverUrl}
                          alt={lic.track.title}
                          className="h-10 w-10 rounded-lg object-cover shadow-2xs"
                        />
                        <div>
                          <span className="font-bold text-gray-900 block">{lic.track.title}</span>
                          <span className="text-[11px] text-gray-400">{lic.track.artist}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 font-mono font-semibold text-gray-700">
                      {lic.id}
                    </td>

                    <td className="py-4 font-medium text-gray-800">
                      {lic.project}
                    </td>

                    <td className="py-4 text-gray-400">
                      {lic.downloadedAt}
                    </td>

                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        {lic.status}
                      </span>
                    </td>

                    <td className="py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTrack(lic.track)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E50FF] hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>View Certificate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <LicenseCertificateModal
        isOpen={!!selectedTrack}
        onClose={() => setSelectedTrack(null)}
        track={selectedTrack}
        userName="Alex Rivers (PixelCraft Studios)"
      />
    </div>
  );
}
