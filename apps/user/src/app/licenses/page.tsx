'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserShell } from '../../components/UserShell';
import { Button, Badge, LicenseCertificateModal, MOCK_TRACKS } from '@caution/ui';
import { Track } from '@caution/types';
import { ShieldCheck, Download, ExternalLink, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

export default function UserLicensesPage() {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  const downloadedLicenses = [
    {
      id: 'LIC-BEAT-881920',
      track: MOCK_TRACKS[1],
      downloadedAt: 'Oct 01, 2026',
      project: 'Commercial Streaming & YouTube',
      coverage: 'YouTube, TikTok, Instagram, DSPs',
      status: 'Active & Whitelisted'
    },
    {
      id: 'LIC-SUNR-449102',
      track: MOCK_TRACKS[0],
      downloadedAt: 'Sep 28, 2026',
      project: 'Global Commercial Campaign',
      coverage: 'Worldwide Commercial Sync, Streaming',
      status: 'Active & Whitelisted'
    },
    {
      id: 'LIC-HOOD-102934',
      track: MOCK_TRACKS[5],
      downloadedAt: 'Sep 22, 2026',
      project: 'Brand Commercial & Promo',
      coverage: 'Broadcast & Social',
      status: 'Active & Whitelisted'
    }
  ];

  return (
    <UserShell activePath="/library">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <Link href="/" className="hover:text-white transition-colors">
                Caution
              </Link>
              <span>/</span>
              <Link href="/library" className="hover:text-white transition-colors">
                Library
              </Link>
              <span>/</span>
              <span className="text-[#e53935] font-semibold">Licenses</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Cleared Licenses & Certificates
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Every track you download receives a perpetual legal synchronization license that protects your release forever.
            </p>
          </div>

          <Link
            href="/library"
            className="px-4 py-2 rounded-full bg-[#e53935] hover:bg-[#d32f2f] text-white text-xs font-bold transition-all shadow-md shadow-red-500/20"
          >
            Go to Library
          </Link>
        </div>

        {/* Licenses List */}
        <div className="bg-[#121316] rounded-2xl border border-white/[0.06] p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-gray-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3">Track</th>
                  <th className="pb-3">License ID</th>
                  <th className="pb-3">Registered Project</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Clearance Status</th>
                  <th className="pb-3 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {downloadedLicenses.map((lic) => (
                  <tr key={lic.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={lic.track.coverUrl}
                          alt={lic.track.title}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div>
                          <span className="font-bold text-white block">{lic.track.title}</span>
                          <span className="text-[11px] text-gray-400">{lic.track.artist}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 font-mono font-semibold text-gray-300">
                      {lic.id}
                    </td>

                    <td className="py-4 font-medium text-gray-300">
                      {lic.project}
                    </td>

                    <td className="py-4 text-gray-400">
                      {lic.downloadedAt}
                    </td>

                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        {lic.status}
                      </span>
                    </td>

                    <td className="py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTrack(lic.track)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#e53935] hover:text-[#ff5252] cursor-pointer"
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
      </div>

      <LicenseCertificateModal
        isOpen={!!selectedTrack}
        onClose={() => setSelectedTrack(null)}
        track={selectedTrack}
        userName="Verified Artist"
      />
    </UserShell>
  );
}
