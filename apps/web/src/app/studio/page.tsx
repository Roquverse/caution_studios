'use client';

import React from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { StatBlock } from '../../components/studio/StatBlock';
import { EarningsChart } from '../../components/studio/EarningsChart';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import { formatNaira } from '../../lib/paystack';
import { Upload, Music, DollarSign, Layers, ArrowRight } from 'lucide-react';

export default function StudioDashboardPage() {
  const recentSales = [
    {
      id: 'ord-101',
      beat: 'Lagos Nights',
      buyer: 'david_tracks',
      tier: 'Exclusive Rights',
      amountNgn: 100000,
      payoutNgn: 80000,
      date: '2 hours ago'
    },
    {
      id: 'ord-102',
      beat: 'Piano Fever',
      buyer: 'afro_melodies',
      tier: 'Premium Beat Plan',
      amountNgn: 30000,
      payoutNgn: 24000,
      date: 'Yesterday'
    },
    {
      id: 'ord-103',
      beat: 'Midnight Drift',
      buyer: 'kroma_sound',
      tier: 'Starter Lease',
      amountNgn: 3000,
      payoutNgn: 2400,
      date: '3 days ago'
    }
  ];

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col pb-24">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Studio Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent-live" />
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Producer Studio // Caution Partner Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-text tracking-[-0.03em] mt-1">
              Studio overview
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/studio/beats"
              className="h-9 px-4 rounded-pill border border-border text-text text-xs font-semibold hover:bg-surface flex items-center gap-1.5"
            >
              <Music className="h-3.5 w-3.5" />
              <span>Manage beats</span>
            </Link>

            <Link
              href="/studio/upload"
              className="h-9 px-4 rounded-pill bg-accent hover:bg-[#135d56] text-text text-xs font-semibold border border-accent flex items-center gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload new beat</span>
            </Link>
          </div>
        </div>

        {/* 4 Stat Blocks */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-8">
          <StatBlock
            label="Total earnings (80%)"
            value={formatNaira(730000)}
            trend="+48%"
            subtext="Available for Paystack payout"
          />
          <StatBlock
            label="Live beats"
            value="18"
            subtext="2 beats sold exclusively"
          />
          <StatBlock
            label="Total streams"
            value="142,800"
            trend="+12%"
            subtext="Across all preview players"
          />
          <StatBlock
            label="Licenses sold"
            value="43"
            subtext="32 Starter · 9 Premium · 2 Exclusive"
          />
        </div>

        {/* Earnings Chart */}
        <div className="my-8">
          <EarningsChart />
        </div>

        {/* Recent Sales Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text">Recent beat sales</h2>
            <Link href="/studio/sales" className="text-xs text-accent-live hover:underline">
              View all sales →
            </Link>
          </div>

          <div className="rounded-sm bg-surface border border-border overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 border-b border-border text-text-muted font-mono uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Beat Title</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">License</th>
                  <th className="py-3 px-4 text-right">Sale Price</th>
                  <th className="py-3 px-4 text-right">Your Payout (80%)</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-surface-2 transition-colors">
                    <td className="py-3 px-4 font-semibold text-text">{sale.beat}</td>
                    <td className="py-3 px-4 text-text-muted">{sale.buyer}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-sm bg-surface-2 border border-border text-[11px] text-accent-live">
                        {sale.tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-right text-text">
                      {formatNaira(sale.amountNgn)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-right text-accent-live">
                      {formatNaira(sale.payoutNgn)}
                    </td>
                    <td className="py-3 px-4 text-right text-text-muted">{sale.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <HomeFooter />
      <CartDrawer />
      <NowPlayingPanel />
    </div>
  );
}
