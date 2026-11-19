'use client';

import React, { useState, useEffect } from 'react';
import { CreatorShell } from '../../components/CreatorShell';
import { supabase } from '../../lib/supabaseClient';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  FileText,
  X,
  UserCheck,
  Loader2,
  FileCheck2,
  Download,
  Filter,
  Sparkles,
  Layers,
  Music
} from 'lucide-react';

interface LicenseRecord {
  id: string;
  licenseNumber: string;
  reference: string;
  beatId: string;
  beatTitle: string;
  beatCoverUrl?: string;
  buyerId?: string;
  buyerName: string;
  buyerHandle: string;
  producerId?: string;
  producerName?: string;
  producerHandle?: string;
  tier: string;
  rawTier?: string;
  priceNgn: number;
  creatorPayoutNgn: number;
  issuedAt: string;
  coverage: string;
  status: string;
  agreementPdfKey?: string | null;
  isOwnBeat?: boolean;
}

export default function CreatorLicensesPage() {
  const [selectedLicense, setSelectedLicense] = useState<LicenseRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [activeScope, setActiveScope] = useState<'all' | 'my'>('all');
  const [isExecutiveAdmin, setIsExecutiveAdmin] = useState(false);
  const [totalPlays, setTotalPlays] = useState(0);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadLicenses() {
      try {
        setLoading(true);
        let { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          const match = document.cookie.match(/(?:^|;\s*)sb-token=([^;]+)/);
          const matchRefresh = document.cookie.match(/(?:^|;\s*)sb-refresh=([^;]+)/);
          if (match && matchRefresh) {
            const { data } = await supabase.auth.setSession({
              access_token: decodeURIComponent(match[1]),
              refresh_token: decodeURIComponent(matchRefresh[1])
            });
            session = data.session;
          }
        }

        const userId = session?.user?.id;
        const accessToken = session?.access_token;

        const res = await fetch(
          `/api/creator/licenses${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`,
          {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            cache: 'no-store'
          }
        );

        if (res.ok) {
          const payload = await res.json();
          if (isMounted) {
            setTotalPlays(Number(payload.totalPlaysCount || 0));
            setTotalDownloads(Number(payload.totalDownloadsCount || 0));
            setIsExecutiveAdmin(Boolean(payload.isExecutiveAdmin));
            if (Array.isArray(payload.licenses)) {
              setLicenses(payload.licenses);
            }
          }
        } else {
          // Fallback to telemetry route if licenses route is warming up
          const fbRes = await fetch(
            `/api/creator/telemetry${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`,
            {
              headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
              cache: 'no-store'
            }
          );
          if (fbRes.ok) {
            const payload = await fbRes.json();
            if (isMounted) {
              setTotalPlays(Number(payload.totalPlaysCount || 0));
              setTotalDownloads(Number(payload.totalDownloadsCount || 0));
              if (Array.isArray(payload.orderItems)) {
                const mapped: LicenseRecord[] = payload.orderItems.map((item: any) => {
                  const rawTier = (item.license || 'premium').toLowerCase();
                  let tierName = 'Premium Lease (WAV + Stems)';
                  let coverage = 'Commercial Video Sync & Streaming (Up to 500,000 streams)';
                  if (rawTier === 'exclusive') {
                    tierName = '100% Exclusive Rights Buyout';
                    coverage = 'Perpetual Worldwide · Unlimited Distribution · Master Ownership';
                  } else if (rawTier === 'basic') {
                    tierName = 'Starter MP3 Lease';
                    coverage = 'Social Media Sync & Streaming (Up to 100,000 streams)';
                  }
                  return {
                    id: item.id,
                    licenseNumber: `CS-LIC-${item.id.slice(0, 8).toUpperCase()}`,
                    reference: item.order?.paystack_reference || `lic-${item.id.slice(0, 8)}`,
                    beatId: item.beat_id,
                    beatTitle: item.beat?.title || 'Studio Instrumental',
                    buyerName: item.order?.buyer?.display_name || 'Verified Artist',
                    buyerHandle: item.order?.buyer?.handle ? `@${item.order.buyer.handle}` : '@artist',
                    tier: tierName,
                    rawTier,
                    priceNgn: Math.round((item.price_cents || 0) / 100),
                    creatorPayoutNgn: Math.round((item.producer_amount_cents || 0) / 100),
                    issuedAt: item.order?.created_at ? new Date(item.order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
                    coverage,
                    status: 'Active & Whitelisted',
                    isOwnBeat: true
                  };
                });
                setLicenses(mapped);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error loading creator licenses:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadLicenses();
    return () => {
      isMounted = false;
    };
  }, []);

  const ownCount = licenses.filter((l) => l.isOwnBeat).length;
  const allCount = licenses.length;

  const scopedLicenses = licenses.filter((l) => {
    if (activeScope === 'my') return l.isOwnBeat;
    return true;
  });

  const filteredLicenses = scopedLicenses.filter(
    (l) =>
      l.beatTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.buyerHandle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.producerName && l.producerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <CreatorShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Commercial Licenses & Clearances</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#2dd4bf]/10 text-[#2dd4bf] border border-[#2dd4bf]/20">
              Live Sync Active
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Audit trail of legal licenses issued to buyers, copyright terms, and active DSP whitelist status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-semibold flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Automatic DSP Whitelisting Active</span>
          </span>
        </div>
      </div>

      {/* Scope Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-2">
          {/* View Scopes */}
          <div className="inline-flex rounded-md p-0.5 bg-zinc-950 border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveScope('all')}
              className={`px-3 py-1 rounded-sm font-medium transition-colors ${
                activeScope === 'all'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Licenses ({allCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveScope('my')}
              className={`px-3 py-1 rounded-sm font-medium transition-colors ${
                activeScope === 'my'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              My Beat Sales ({ownCount})
            </button>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search beat, buyer, producer, or ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 pl-9 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <span className="text-zinc-400">
            Plays: <strong className="text-[#2dd4bf]">{totalPlays.toLocaleString()}</strong>
          </span>
          <span className="text-zinc-400">
            Downloads: <strong className="text-emerald-400">{totalDownloads.toLocaleString()}</strong>
          </span>
          <span className="text-zinc-500">
            {filteredLicenses.length} {filteredLicenses.length === 1 ? 'License' : 'Licenses'} Issued
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="h-7 w-7 text-[#2dd4bf] animate-spin" />
          <span className="text-xs font-mono text-zinc-400">Loading commercial licenses & agreements...</span>
        </div>
      ) : (
        /* Licenses Table */
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 shadow-sm overflow-hidden">
          {filteredLicenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-950/60 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">License ID / Ref</th>
                    <th className="py-3 px-4">Beat Title</th>
                    <th className="py-3 px-4">Producer</th>
                    <th className="py-3 px-4">Licensee (Buyer)</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4 text-right">Sale Total</th>
                    <th className="py-3 px-4 text-right">Your Cut (80%)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredLicenses.map((lic) => (
                    <tr key={lic.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-[#2dd4bf]">
                        <div>{lic.licenseNumber}</div>
                        <div className="text-[10px] text-zinc-500 font-normal">{lic.reference}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-white max-w-[200px] truncate">
                        {lic.beatTitle}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-300">{lic.producerName || 'Caution Producer'}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{lic.producerHandle}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-zinc-200">{lic.buyerName}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{lic.buyerHandle}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {lic.tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-300">
                        ₦{lic.priceNgn.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        ₦{lic.creatorPayoutNgn.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Whitelisted</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLicense(lic)}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
                        >
                          View Agreement
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-20 text-center space-y-3 px-4">
              <FileCheck2 className="h-10 w-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No Licenses Issued Yet</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                When buyers and recording artists license beats from your catalog, full legal agreements and copyright clearances will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal: License Agreement Certificate */}
      {selectedLicense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[#0e1014] border border-zinc-800 rounded-xl p-6 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#2dd4bf]" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Caution Studio Copyright Clearance Certificate
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLicense(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3 text-xs font-mono">
              <div className="flex justify-between items-center text-zinc-400 pb-2 border-b border-zinc-800/80">
                <span>LICENSE NUMBER:</span>
                <span className="text-[#2dd4bf] font-bold">{selectedLicense.licenseNumber}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400 pb-2 border-b border-zinc-800/80">
                <span>TRANSACTION REF:</span>
                <span className="text-zinc-300 font-mono">{selectedLicense.reference}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>LICENSED BEAT:</span>
                <span className="text-white font-sans font-semibold">{selectedLicense.beatTitle}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>PRODUCER:</span>
                <span className="text-zinc-200 font-sans">{selectedLicense.producerName} ({selectedLicense.producerHandle})</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>LICENSEE (BUYER):</span>
                <span className="text-white font-sans">{selectedLicense.buyerName} ({selectedLicense.buyerHandle})</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>LICENSE TIER:</span>
                <span className="text-amber-300">{selectedLicense.tier}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>ISSUED DATE:</span>
                <span className="text-zinc-300">{selectedLicense.issuedAt}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400 pt-2 border-t border-zinc-800/80">
                <span>PRODUCER PAYOUT (80%):</span>
                <span className="text-emerald-400 font-bold text-sm">
                  ₦{selectedLicense.creatorPayoutNgn.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#2dd4bf]/5 border border-[#2dd4bf]/20 space-y-1">
              <span className="text-[11px] font-bold text-[#2dd4bf] block">
                Whitelisted Rights & Permitted Usages
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {selectedLicense.coverage}
              </p>
            </div>

            <div className="pt-2 flex justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-3 py-1.5 rounded-md bg-[#2dd4bf] hover:bg-[#20b8a4] text-zinc-950 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>Print Legal Certificate</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLicense(null)}
                className="px-4 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </CreatorShell>
  );
}
