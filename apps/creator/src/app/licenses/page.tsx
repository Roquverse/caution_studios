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
  FileCheck2
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
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadLicenses() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;

        if (!userId) {
          if (isMounted) setLoading(false);
          return;
        }

        // Query order items for this producer
        const { data: items } = await supabase
          .from('order_items')
          .select(`
            id,
            price_cents,
            producer_amount_cents,
            license,
            order:order_id (
              id,
              status,
              created_at,
              buyer:buyer_id (
                display_name,
                handle
              )
            ),
            beat:beat_id (
              title
            )
          `)
          .eq('producer_id', userId)
          .order('id', { ascending: false });

        if (items && isMounted) {
          const paidItems = items.filter((item: any) => item.order?.status === 'paid');
          const mapped: LicenseRecord[] = paidItems.map((item: any) => {
            const tierStr = (item.license || 'basic').toLowerCase();
            let coverage = 'Social Media Sync & Streaming';
            let tierName = 'Starter MP3 Lease';

            if (tierStr === 'premium') {
              coverage = 'Commercial Video Sync & Streaming (Up to 500,000 streams)';
              tierName = 'Premium Lease (WAV + Stems)';
            } else if (tierStr === 'exclusive') {
              coverage = 'Perpetual Worldwide · Unlimited Distribution · Master Ownership';
              tierName = '100% Exclusive Rights Buyout';
            }

            const buyerHandle = item.order?.buyer?.handle ? `@${item.order.buyer.handle}` : '@artist';
            const buyerName = item.order?.buyer?.display_name || 'Verified Artist';
            const dateStr = item.order?.created_at
              ? new Date(item.order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Recent';

            return {
              id: item.id,
              licenseNumber: `CS-LIC-${item.id.slice(0, 8).toUpperCase()}`,
              beatTitle: item.beat?.title || 'Studio Instrumental',
              buyerName,
              buyerHandle,
              tier: tierName,
              priceNgn: Math.round((item.price_cents || 0) / 100),
              creatorPayoutNgn: Math.round((item.producer_amount_cents || 0) / 100),
              issuedAt: dateStr,
              coverage,
              status: 'Active & Whitelisted'
            };
          });

          setLicenses(mapped);
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
            Commercial Licenses & Clearances
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

      {/* Search Filter */}
      <div className="flex items-center gap-3 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by beat, buyer name, or license number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 pl-9 pr-3 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>
        <span className="text-xs text-zinc-500 font-mono">
          {filteredLicenses.length} {filteredLicenses.length === 1 ? 'License' : 'Licenses'} Issued
        </span>
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
                    <th className="py-3 px-4">License ID</th>
                    <th className="py-3 px-4">Beat Title</th>
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
                        {lic.licenseNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-white max-w-[200px] truncate">
                        {lic.beatTitle}
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
                <span>LICENSE ID:</span>
                <span className="text-[#2dd4bf] font-bold">{selectedLicense.licenseNumber}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>LICENSED BEAT:</span>
                <span className="text-white font-sans font-semibold">{selectedLicense.beatTitle}</span>
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

            <div className="pt-2 flex justify-end gap-2">
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
