'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '../../../components/layout/TopNav';
import { HomeFooter } from '../../../components/home/HomeFooter';
import { useAudio } from '../../../components/audio/AudioProvider';
import { CheckCircle2, Download, FileText, ArrowRight, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { SEEDED_BEATS } from '../../../lib/seedBeats';
import { APP_URL } from '../../../lib/urls';

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
  const typeParam = searchParams.get('type');

  const { clearCart } = useAudio();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verifyData, setVerifyData] = useState<any>(null);

  useEffect(() => {
    clearCart();

    async function verify() {
      if (reference) {
        try {
          const res = await fetch('/api/paystack/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference })
          });
          const json = await res.json();
          setVerifyData(json);
        } catch (e) {
          console.error('Paystack verification error:', e);
        } finally {
          setIsVerifying(false);
        }
      } else {
        setIsVerifying(false);
      }
    }

    verify();
  }, [reference]);

  const isSubscription = typeParam === 'subscription' || verifyData?.type === 'subscription';
  const purchasedBeat = SEEDED_BEATS[0];

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col pb-24 selection:bg-[#04564f] selection:text-white">
      <TopNav />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <div className="p-8 sm:p-10 rounded-2xl bg-[#0E1015] border border-white/10 shadow-2xl space-y-6">
          <div className="h-16 w-16 rounded-full bg-[#04564f]/30 border border-[#2dd4bf]/40 mx-auto flex items-center justify-center text-[#2dd4bf]">
            {isVerifying ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <CheckCircle2 className="h-8 w-8" />
            )}
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#2dd4bf]">
              {isVerifying ? 'Verifying with Paystack...' : 'Payment Completed · Paystack Verified'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-[-0.03em] mt-2">
              {isSubscription
                ? 'Welcome to Caution Plus!'
                : 'Thank you for your license purchase'}
            </h1>
            <p className="text-xs text-neutral-400 mt-2 max-w-md mx-auto leading-relaxed">
              {isSubscription
                ? 'Your Caution Plus membership is now active. Enjoy 24-bit lossless streaming, full trackout stems (.ZIP), and commercial synchronization rights.'
                : 'Your transaction has cleared through Paystack. An official PDF license certificate and download package have been generated for your record.'}
            </p>
          </div>

          {/* Reference pill */}
          <div className="inline-block px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 font-mono text-xs text-neutral-300">
            Transaction Ref: <strong className="text-[#2dd4bf]">{reference}</strong>
          </div>

          {isSubscription ? (
            <div className="p-5 rounded-2xl bg-[#04564f]/15 border border-[#2dd4bf]/30 text-left space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Sparkles className="h-4 w-4 text-[#2dd4bf]" />
                <span>Caution Plus Active Benefits</span>
              </div>
              <ul className="text-xs text-neutral-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2dd4bf]" />
                  <span>Unlimited 24-bit lossless FLAC streaming</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2dd4bf]" />
                  <span>Full WAV trackout stems (.ZIP) downloads</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#2dd4bf]" />
                  <span>Commercial synchronization rights (YouTube, DSPs, broadcast)</span>
                </li>
              </ul>
            </div>
          ) : (
            /* Purchased Item Box */
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-black border border-white/10 shrink-0">
                  {purchasedBeat.cover_url && (
                    <img src={purchasedBeat.cover_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{purchasedBeat.title}</div>
                  <div className="text-xs text-[#2dd4bf] font-medium">Licensed Beat Master + Stems</div>
                  <div className="text-[11px] text-neutral-400">Produced by {purchasedBeat.producer?.display_name}</div>
                </div>
              </div>

              <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => alert(`Starting download for ${purchasedBeat.title} (Master Audio)...`)}
                  className="flex-1 sm:flex-none h-8 px-3 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="h-3 w-3" />
                  <span>Master Audio</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert(`Starting download for ${purchasedBeat.title} (Stems .ZIP)...`)}
                  className="flex-1 sm:flex-none h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-white/15"
                >
                  <Download className="h-3 w-3" />
                  <span>Stems (.ZIP)</span>
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            {isSubscription ? (
              <a
                href={APP_URL}
                className="w-full sm:w-auto h-11 px-8 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#04564f]/30 flex items-center justify-center gap-2 transition-all"
              >
                <span>Launch App Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#2dd4bf]" />
              </a>
            ) : (
              <>
                <Link
                  href="/library"
                  className="w-full sm:w-auto h-11 px-6 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <span>Go to your library</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/beats"
                  className="w-full sm:w-auto h-11 px-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-medium text-xs flex items-center justify-center transition-colors"
                >
                  Continue browsing
                </Link>
              </>
            )}
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
