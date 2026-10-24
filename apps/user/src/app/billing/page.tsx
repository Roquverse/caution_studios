'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Check,
  Download,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Search,
  Cast
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { UserDropdown, UserProfileData } from '../../components/UserDropdown';
import { useUserSubscription } from '../../lib/subscription';

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  rawDate: string;
  amountNgn: number;
  formattedAmount: string;
  status: string;
  items?: any[];
  pdfUrl?: string;
}

export default function UserBillingPage() {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadBillingData() {
      try {
        setLoading(true);
        let userId: string | undefined;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          userId = session.user.id;
        }

        const url = userId ? `/api/billing?userId=${encodeURIComponent(userId)}` : '/api/billing';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile(data.profile);
          }
          if (data.invoices) {
            setInvoices(data.invoices);
          }
        }
      } catch (err) {
        console.warn('Failed to load real billing data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBillingData();
  }, []);

  const isPlus = profile?.plan === 'plus';

  return (
    <div className="min-h-screen bg-[#08090B] text-white flex flex-col font-sans selection:bg-[#04564f] selection:text-white pb-20">
      {/* 1. TOP HEADER */}
      <header className="h-16 border-b border-white/[0.06] bg-[#0A0B0E] px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center shrink-0">
          <Link href="/" className="inline-flex items-center">
            <img
              src="/logo.png"
              alt="Caution Studio"
              className="h-7 sm:h-8 w-auto object-contain brightness-0 invert max-w-[130px] sm:max-w-[190px]"
            />
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-xl mx-4">
          <div className="relative flex items-center w-full">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by artists, songs or albums"
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#141518] border border-white/[0.06] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/subscriptions"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/20 hover:border-white/40 text-xs font-semibold text-white/90 transition-colors cursor-pointer"
          >
            <span>Change Plan</span>
            <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          </Link>

          <button
            type="button"
            className="hidden md:flex p-2 text-gray-400 hover:text-white transition-colors"
            title="Airplay / Cast"
          >
            <Cast className="h-4 w-4" />
          </button>

          {/* User Profile Dropdown */}
          <UserDropdown />
        </div>
      </header>

      {/* 2. MAIN BILLING CONTAINER */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb / Back button */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors group"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors" />
            <span>Back to Studio Dashboard</span>
          </Link>

          <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
            ACCOUNT / BILLING
          </span>
        </div>

        {/* Hero Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>Subscription & Billing</span>
            {isPlus ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/40">
                PLUS ACTIVE
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-gray-400 border border-white/10">
                FREE CREATOR
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-400">
            Real-time billing telemetry and official tax receipts synchronized with the database.
          </p>
        </div>

        {/* Current Plan Overview Card */}
        <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 z-10">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#2dd4bf]" />
              <h2 className="text-lg font-bold text-white">
                {isPlus ? 'Caution Plus Tier' : 'Free Creator Tier'}
              </h2>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed max-w-lg">
              {isPlus
                ? 'Full studio license clearance enabled with unlimited 24-bit lossless streaming, full trackout WAV stems, and automated synchronization clearance.'
                : 'Free tier with standard listening previews and single-track beat store checkout. Upgrade anytime to unlock stems and unlimited playback.'}
            </p>
            <div className="pt-2 flex items-center gap-3 font-mono text-xs">
              <span className="text-xl font-black text-white">
                {isPlus ? '₦3,000' : '₦0'}
              </span>
              <span className="text-gray-400">
                {isPlus ? '/ month (auto-renews via Paystack)' : '/ forever'}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-3 z-10">
            <Link
              href="/subscriptions"
              className="px-5 py-2.5 rounded-full bg-[#04564f] hover:bg-[#03453f] text-[#2dd4bf] text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-[#2dd4bf]/30 transition-colors shadow-lg cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isPlus ? 'Manage Tier' : 'Upgrade to Plus'}</span>
            </Link>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-64 bg-gradient-to-l from-[#04564f]/10 to-transparent pointer-events-none" />
        </div>

        {/* Invoices History Table */}
        <div className="p-6 rounded-2xl bg-[#121316] border border-white/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">
                Billing History & Tax Receipts
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                All invoices retrieved directly from the database
              </p>
            </div>
            <span className="text-xs text-gray-500 font-mono">Currency: NGN (₦)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-gray-400 font-mono uppercase tracking-wider">
                  <th className="pb-3">Invoice</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 font-mono">
                      Fetching real database orders...
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 font-mono">
                      No invoices found in database.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 font-mono text-gray-300 font-medium">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 text-gray-400">{inv.date}</td>
                      <td className="py-3.5 font-bold text-white font-mono">
                        {inv.formattedAmount}
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          inv.status === 'PAID'
                            ? 'bg-[#04564f]/50 text-[#2dd4bf] border-[#2dd4bf]/30'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <a
                          href={inv.pdfUrl || `/api/billing/receipt?id=${inv.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#2dd4bf] hover:text-[#5eead4] hover:underline font-semibold cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>PDF</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
