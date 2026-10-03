'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '../../../components/layout/TopNav';
import { HomeFooter } from '../../../components/home/HomeFooter';
import { useAudio } from '../../../components/audio/AudioProvider';
import { CheckCircle2, Download, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { SEEDED_BEATS } from '../../../lib/seedBeats';

export default function CheckoutSuccessPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-bg" />}>
      <CheckoutSuccessContent />
    </React.Suspense>
  );
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || `CS_REF_${Date.now()}`;
  const orderId = searchParams.get('order_id') || `ord_${Date.now()}`;

  const { clearCart } = useAudio();

  useEffect(() => {
    clearCart();
  }, []);

  const purchasedBeat = SEEDED_BEATS[0];

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col pb-24">
      <TopNav />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <div className="p-8 rounded-sm bg-surface border border-border space-y-6">
          <div className="h-16 w-16 rounded-pill bg-surface-2 border border-accent-live mx-auto flex items-center justify-center text-accent-live">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-accent-live">
              Payment Completed · Paystack Verified
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-text tracking-[-0.03em] mt-1">
              Thank you for your license purchase
            </h1>
            <p className="text-xs text-text-muted mt-2 max-w-md mx-auto leading-relaxed">
              Your transaction has been cleared. An email receipt and download package have been sent to your inbox.
            </p>
          </div>

          {/* Reference pill */}
          <div className="inline-block px-3 py-1 rounded-sm bg-surface-2 border border-border font-mono text-xs text-text-muted">
            Transaction Ref: {reference}
          </div>

          {/* Purchased Item Box */}
          <div className="p-4 rounded-sm bg-surface-2 border border-border flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-sm overflow-hidden bg-surface border border-border shrink-0">
                {purchasedBeat.cover_url && (
                  <img src={purchasedBeat.cover_url} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-text">{purchasedBeat.title}</div>
                <div className="text-xs text-accent-live font-medium">Premium Beat Plan (WAV + Stems)</div>
                <div className="text-[11px] text-text-muted">Produced by {purchasedBeat.producer?.display_name}</div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => alert('Starting Master WAV download...')}
                className="h-8 px-3 rounded-pill bg-accent hover:bg-[#135d56] text-text text-xs font-medium border border-accent flex items-center gap-1.5"
              >
                <Download className="h-3 w-3" />
                <span>WAV Master</span>
              </button>
              <button
                type="button"
                onClick={() => alert('Starting Stems .ZIP download...')}
                className="h-8 px-3 rounded-pill bg-surface border border-border text-text text-xs font-medium hover:bg-border flex items-center gap-1.5"
              >
                <Download className="h-3 w-3" />
                <span>Stems (.ZIP)</span>
              </button>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/library"
              className="w-full sm:w-auto h-10 px-6 rounded-pill bg-accent hover:bg-[#135d56] text-text font-bold text-xs uppercase tracking-wider border border-accent flex items-center justify-center gap-2"
            >
              <span>Go to your library</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href="/beats"
              className="w-full sm:w-auto h-10 px-6 rounded-pill bg-surface hover:bg-surface-2 text-text font-bold text-xs uppercase tracking-wider border border-border flex items-center justify-center"
            >
              Browse more beats
            </Link>
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
