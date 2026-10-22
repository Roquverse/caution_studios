'use client';

import React, { useState } from 'react';
import { CreatorShell } from '../../components/CreatorShell';
import {
  ShieldCheck,
  Download,
  ExternalLink,
  Search,
  CheckCircle2,
  FileText,
  X,
  UserCheck
} from 'lucide-react';

interface LicenseRecord {
  id: string;
  licenseNumber: string;
  beatTitle: string;
  buyerName: string;
  buyerHandle: string;
  tier: string;
  priceNgn: number;
  creatorPayoutNgn: number;
  issuedAt: string;
  coverage: string;
  status: string;
}

export default function CreatorLicensesPage() {
  const [selectedLicense, setSelectedLicense] = useState<LicenseRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const licenses: LicenseRecord[] = [
    {
      id: 'lic-1',
      licenseNumber: 'CS-LIC-2026-9901',
      beatTitle: 'Lagos Nights (Afrobeats Master)',
      buyerName: 'David Soundz Productions',
      buyerHandle: '@david_soundz',
      tier: '100% Exclusive Rights Buyout',
      priceNgn: 100000,
      creatorPayoutNgn: 80000,
      issuedAt: 'Oct 22, 2026',
      coverage: 'Perpetual Worldwide · Unlimited Distribution · Master Ownership',
      status: 'Active & Whitelisted'
    },
    {
      id: 'lic-2',
      licenseNumber: 'CS-LIC-2026-9844',
      beatTitle: 'Piano Fever - Amapiano Stems',
      buyerName: 'Kroma Sound Lab',
      buyerHandle: '@dj_kroma',
      tier: 'Premium Lease (WAV + Stems)',
      priceNgn: 30000,
      creatorPayoutNgn: 24000,
      issuedAt: 'Oct 21, 2026',
      coverage: 'YouTube, TikTok, Spotify (Up to 500,000 streams)',
      status: 'Active & Whitelisted'
    },
    {
      id: 'lic-3',
      licenseNumber: 'CS-LIC-2026-9721',
      beatTitle: 'Midnight Drift Chill Hop',
      buyerName: 'Summer Travel Vlogs',
      buyerHandle: '@film_vlogs',
      tier: 'Starter MP3 Lease',
      priceNgn: 3000,
      creatorPayoutNgn: 2400,
      issuedAt: 'Oct 19, 2026',
      coverage: 'Social Media Sync (YouTube, IG, TikTok monetization)',
      status: 'Active & Whitelisted'
    },
    {
      id: 'lic-4',
      licenseNumber: 'CS-LIC-2026-9650',
      beatTitle: 'Neon Overdrive Synthwave',
      buyerName: 'Tokyo Daze Studios',
      buyerHandle: '@tokyo_daze',
      tier: 'Premium Lease (WAV + Stems)',
      priceNgn: 30000,
      creatorPayoutNgn: 24000,
      issuedAt: 'Oct 17, 2026',
      coverage: 'Commercial Video Sync & Streaming',
      status: 'Active & Whitelisted'
    }
  ];

  const filteredLicenses = licenses.filter(
    (l) =>
      l.beatTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <CreatorShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            License Agreements & Sales Certificates
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Legal synchronization contracts and copyright clearance certificates issued to buyers
          </p>
        </div>

        <div className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md">
          {licenses.length} Total Contracts Issued
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by license #, beat, or buyer..."
          className="w-full bg-zinc-900/80 border border-zinc-800 rounded-md py-1.5 pl-8 pr-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
        />
      </div>

      {/* Licenses Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">License Certificate #</th>
                <th className="py-3 px-4">Beat Master</th>
                <th className="py-3 px-4">Licensed Buyer</th>
                <th className="py-3 px-4">Agreement Tier</th>
                <th className="py-3 px-4 text-right">Sale Price</th>
                <th className="py-3 px-4 text-right">Your Net (80%)</th>
                <th className="py-3 px-4">Issued Date</th>
                <th className="py-3 px-4 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredLicenses.map((lic) => (
                <tr key={lic.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-[#2dd4bf]">
                    {lic.licenseNumber}
                  </td>
                  <td className="py-3 px-4 font-medium text-white max-w-[200px] truncate">
                    {lic.beatTitle}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-zinc-200 block font-medium">{lic.buyerName}</span>
                    <span className="text-zinc-500 text-[10px] font-mono block">{lic.buyerHandle}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {lic.tier}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-zinc-400">
                    ₦{lic.priceNgn.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    ₦{lic.creatorPayoutNgn.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-zinc-400">{lic.issuedAt}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLicense(lic)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      <FileText className="h-3 w-3 text-[#2dd4bf]" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Modal */}
      {selectedLicense && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c0d10] border border-zinc-800 rounded-lg max-w-lg w-full p-6 text-zinc-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#2dd4bf]" />
                <h3 className="text-base font-bold text-white">
                  Official License Certificate
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLicense(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 rounded-md bg-zinc-950 border border-zinc-800/80 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">License ID:</span>
                <span className="text-[#2dd4bf] font-bold">{selectedLicense.licenseNumber}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Track:</span>
                <span className="text-white font-sans font-semibold">{selectedLicense.beatTitle}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Licensee:</span>
                <span className="text-zinc-200">{selectedLicense.buyerName} ({selectedLicense.buyerHandle})</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Tier:</span>
                <span className="text-amber-300 font-semibold">{selectedLicense.tier}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-500">Coverage:</span>
                <span className="text-zinc-300 text-right max-w-[260px] font-sans text-[11px]">
                  {selectedLicense.coverage}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-zinc-500">Issued On:</span>
                <span className="text-zinc-400">{selectedLicense.issuedAt}</span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 leading-relaxed">
              This certificate grants the licensee perpetual legal clearance to synchronize the musical composition in commercial recordings and video streams without Content ID claims.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => alert(`Downloading Certificate ${selectedLicense.licenseNumber}...`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Download Legal PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </CreatorShell>
  );
}
