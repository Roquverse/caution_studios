'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import {
  Download,
  FileText,
  Music2,
  ShieldCheck,
  ExternalLink,
  Loader2,
  ShoppingBag,
  Disc,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { APP_URL } from '../../lib/urls';

interface LicensedItem {
  licenseId: string;
  beat: {
    id: string;
    title: string;
    bpm?: number;
    genre?: string;
    cover_url?: string;
    producer?: {
      display_name: string;
      handle: string;
    };
  };
  type: string;
  rawType?: string;
  issuedDate: string;
  streamCap: number | null;
  streamsUsed: number;
  hasStems: boolean;
  masterWavUrl: string | null;
  stemsZipUrl: string | null;
  agreementPdfKey: string | null;
}

export default function LibraryPage() {
  const [loading, setLoading] = useState(true);
  const [licensedItems, setLicensedItems] = useState<LicensedItem[]>([]);
  const [buyerName, setBuyerName] = useState<string>('Verified Artist');

  useEffect(() => {
    let isMounted = true;

    async function loadPurchasedBeats() {
      try {
        setLoading(true);
        let { data: { session } } = await supabase.auth.getSession();

        if (!session?.user && typeof document !== 'undefined') {
          const matchToken = document.cookie.match(/(?:^|;\s*)sb-token=([^;]*)/);
          const matchRefresh = document.cookie.match(/(?:^|;\s*)sb-refresh=([^;]*)/);
          if (matchToken && matchRefresh) {
            try {
              const { data: restored } = await supabase.auth.setSession({
                access_token: decodeURIComponent(matchToken[1]),
                refresh_token: decodeURIComponent(matchRefresh[1])
              });
              if (restored?.session?.user) session = restored.session;
            } catch (e) {}
          }
        }

        const userId = session?.user?.id;
        const meta = session?.user?.user_metadata || {};
        const resolvedBuyer =
          meta.full_name || meta.name || meta.display_name || session?.user?.email?.split('@')[0] || 'Verified Artist';
        if (isMounted) setBuyerName(resolvedBuyer);

        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const url = userId ? `/api/library?userId=${encodeURIComponent(userId)}` : '/api/library';
        const res = await fetch(url, { headers, cache: 'no-store' });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.items)) {
            setLicensedItems(data.items);
          }
        }
      } catch (err) {
        console.error('Error fetching purchased beats in Library:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPurchasedBeats();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownloadFile = (url: string | null, fallbackFilename: string) => {
    if (!url) {
      alert(`Master audio file is currently processing. Please check back in a few minutes or contact executive support.`);
      return;
    }
    const link = document.createElement('a');
    link.href = url;
    link.download = fallbackFilename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAgreement = (lic: LicensedItem) => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Caution Studio License - ${lic.licenseId}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                background: #0B0C0C;
                color: #F5F5F2;
                padding: 48px;
                line-height: 1.6;
              }
              .header {
                border-bottom: 2px solid #2dd4bf;
                padding-bottom: 24px;
                margin-bottom: 32px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .logo {
                font-size: 24px;
                font-weight: 900;
                letter-spacing: -0.04em;
                color: #FFFFFF;
              }
              .badge {
                background: rgba(45, 212, 191, 0.15);
                color: #2dd4bf;
                border: 1px solid rgba(45, 212, 191, 0.4);
                padding: 6px 14px;
                border-radius: 9999px;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
              }
              .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                margin-bottom: 32px;
              }
              .card {
                background: #141618;
                border: 1px solid #26292A;
                padding: 20px;
                border-radius: 8px;
              }
              .label {
                font-size: 11px;
                text-transform: uppercase;
                color: #8E9296;
                letter-spacing: 0.05em;
                margin-bottom: 4px;
              }
              .value {
                font-size: 16px;
                font-weight: 700;
                color: #FFFFFF;
              }
              .terms {
                background: #141618;
                border: 1px solid #26292A;
                padding: 24px;
                border-radius: 8px;
                font-size: 13px;
                color: #C0C4C8;
              }
              .terms h3 {
                color: #2dd4bf;
                margin-top: 0;
              }
              .print-btn {
                background: #2dd4bf;
                color: #0B0C0C;
                font-weight: 700;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                margin-top: 24px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">CAUTION STUDIO // OFFICIAL LICENSE CERTIFICATE</div>
              <div class="badge">${lic.type}</div>
            </div>

            <div class="grid">
              <div class="card">
                <div class="label">License Reference Number</div>
                <div class="value font-mono">${lic.licenseId}</div>
              </div>
              <div class="card">
                <div class="label">Date Issued</div>
                <div class="value">${lic.issuedDate}</div>
              </div>
              <div class="card">
                <div class="label">Musical Composition (Beat Title)</div>
                <div class="value">${lic.beat.title}</div>
              </div>
              <div class="card">
                <div class="label">Original Producer / Creator</div>
                <div class="value">${lic.beat.producer?.display_name || 'Caution Studio Certified Producer'}</div>
              </div>
              <div class="card">
                <div class="label">Licensee / Authorized Artist</div>
                <div class="value">${buyerName}</div>
              </div>
              <div class="card">
                <div class="label">Commercial Stream Cap</div>
                <div class="value">${lic.streamCap ? `${lic.streamCap.toLocaleString()} Streams` : 'Unlimited Broadcast & Streaming Rights'}</div>
              </div>
            </div>

            <div class="terms">
              <h3>Grant of Commercial License</h3>
              <p>Caution Studio certifies that the Licensee named herein has legally acquired non-exclusive / exclusive distribution rights for the specified master audio recording and underlying composition under Caution Studio Master Licensing Terms v2.4.</p>
              <p>This license authorizes commercial monetization on Spotify, Apple Music, YouTube Music, TikTok, terrestrial and digital radio, synchronization in film/television, and live commercial performance within the agreed cap parameters.</p>
            </div>

            <button class="print-btn" onclick="window.print()">Print or Save as PDF</button>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col pb-24">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="pb-6 border-b border-border mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-accent-live">
              Artist Portal // Caution Studio
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-text tracking-[-0.03em] mt-1">
              My Library &amp; Purchased Beats
            </h1>
            <p className="text-xs text-text-muted mt-1">
              Access your uncompressed 24-bit WAV master files, separated stems, and official signed license certificates
            </p>
          </div>

          <Link
            href={`${APP_URL}?tab=marketplace`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-2 hover:bg-surface border border-border text-xs font-bold text-text transition-colors self-start sm:self-auto"
          >
            <ShoppingBag className="h-4 w-4 text-accent-live" />
            <span>Browse Beat Store</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-accent-live animate-spin" />
            <span className="text-xs font-mono text-text-muted">Loading your purchased beats &amp; master audio...</span>
          </div>
        ) : licensedItems.length > 0 ? (
          <div className="space-y-4">
            {licensedItems.map((item) => (
              <div
                key={item.licenseId}
                className="p-5 rounded-xl bg-surface border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-accent-live/40 transition-colors shadow-sm"
              >
                {/* Left: Beat info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-2 border border-border shrink-0">
                    {item.beat.cover_url ? (
                      <img src={item.beat.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                        <Disc className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text truncate">
                        {item.beat.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-accent-live/15 border border-accent-live/30 text-[10px] font-bold text-accent-live shrink-0">
                        {item.type}
                      </span>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      By {item.beat.producer?.display_name || 'Caution Producer'} · Issued {item.issuedDate}
                    </div>
                    <div className="text-[11px] font-mono text-text-faint mt-1 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-accent-live" />
                      <span>Ref: {item.licenseId}</span>
                    </div>
                  </div>
                </div>

                {/* Center: Stream usage */}
                <div className="w-full md:w-56 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-text-muted">
                    <span>Commercial Stream Cap</span>
                    <span className="font-mono text-text font-bold">
                      {item.streamCap ? `${item.streamCap.toLocaleString()} cap` : 'Unlimited'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-accent-live rounded-full transition-all duration-300"
                      style={{ width: item.streamCap ? '4%' : '100%' }}
                    />
                  </div>
                  <span className="text-[10px] text-text-faint block font-mono">
                    {item.streamCap ? 'Commercial distribution rights active' : 'Full exclusive ownership rights'}
                  </span>
                </div>

                {/* Right: Download Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadFile(item.masterWavUrl, `${item.beat.title} - Master WAV.wav`)
                    }
                    className="h-9 px-3.5 rounded-full bg-accent hover:bg-[#135d56] text-white text-xs font-semibold border border-accent flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download WAV</span>
                  </button>

                  {item.hasStems && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadFile(item.stemsZipUrl, `${item.beat.title} - Stems.zip`)
                      }
                      className="h-9 px-3.5 rounded-full bg-surface-2 hover:bg-border text-text text-xs font-semibold border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Stems (.ZIP)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDownloadAgreement(item)}
                    className="h-9 px-3.5 rounded-full bg-surface hover:bg-surface-2 text-text text-xs font-semibold border border-border flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5 text-accent-live" />
                    <span>PDF License</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-4 max-w-md mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center mx-auto text-accent-live">
              <Music2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">No Purchased Beats Yet</h2>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Beats and licenses you purchase will appear here with instant uncompressed Master WAV audio files, separated stem multi-tracks, and official signed license certificates.
              </p>
            </div>
            <Link
              href={`${APP_URL}?tab=marketplace`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-live hover:bg-[#20b8a4] text-zinc-950 text-xs font-bold transition-colors shadow-lg shadow-accent-live/20"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Explore Beat Store</span>
            </Link>
          </div>
        )}
      </main>

      <HomeFooter />
      <CartDrawer />
      <NowPlayingPanel />
    </div>
  );
}
