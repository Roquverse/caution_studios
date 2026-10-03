'use client';

import React from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import { Download, FileText, Music2, ShieldCheck, ExternalLink } from 'lucide-react';
import { SEEDED_BEATS } from '../../lib/seedBeats';

export default function LibraryPage() {
  const licensedItems = [
    {
      licenseId: 'lic-8491-01',
      beat: SEEDED_BEATS[0],
      type: 'Premium Beat Plan',
      issuedDate: 'Today, 2:15 PM',
      streamCap: 500000,
      streamsUsed: 12400,
      hasStems: true
    },
    {
      licenseId: 'lic-8491-02',
      beat: SEEDED_BEATS[1],
      type: 'Starter Lease',
      issuedDate: 'Sep 28, 2026',
      streamCap: 100000,
      streamsUsed: 38200,
      hasStems: false
    }
  ];

  const handleDownloadAgreement = (lic: typeof licensedItems[0]) => {
    // Generate standard HTML agreement in new window
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head><title>Caution Studio License - ${lic.licenseId}</title></head>
          <body style="font-family: system-ui; background: #0B0C0C; color: #F5F5F2; padding: 40px;">
            <h1 style="color: #3DBFA8;">CAUTION STUDIO // OFFICIAL LICENSE CERTIFICATE</h1>
            <p><strong>License Reference:</strong> ${lic.licenseId}</p>
            <p><strong>Composition:</strong> ${lic.beat.title}</p>
            <p><strong>Producer:</strong> ${lic.beat.producer?.display_name}</p>
            <p><strong>Tier:</strong> ${lic.type}</p>
            <p><strong>Issued:</strong> ${lic.issuedDate}</p>
            <hr style="border-color: #26292A; margin: 20px 0;" />
            <p>This certified electronic instrument grants non-exclusive commercial streaming, synchronization and broadcast rights according to Caution Studio Master Terms v2.4.</p>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col pb-24">
      <TopNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="pb-6 border-b border-border mb-8">
          <div className="text-xs font-bold uppercase tracking-wider text-accent-live">
            Artist Portal
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-text tracking-[-0.03em] mt-1">
            My library &amp; downloads
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Access your uncompressed WAV master files, separated stems, and official signed license agreements
          </p>
        </div>

        <div className="space-y-4">
          {licensedItems.map((item) => (
            <div
              key={item.licenseId}
              className="p-5 rounded-sm bg-surface border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              {/* Left: Beat info */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-sm overflow-hidden bg-surface-2 border border-border shrink-0">
                  {item.beat.cover_url && (
                    <img src={item.beat.cover_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text truncate">
                      {item.beat.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-surface-2 border border-border text-[10px] font-bold text-accent-live">
                      {item.type}
                    </span>
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    By {item.beat.producer?.display_name} · Issued {item.issuedDate}
                  </div>
                  <div className="text-[11px] font-mono text-text-faint mt-1">
                    Ref: {item.licenseId}
                  </div>
                </div>
              </div>

              {/* Center: Stream usage */}
              <div className="w-full md:w-56 space-y-1.5">
                <div className="flex justify-between text-[11px] text-text-muted">
                  <span>Stream cap</span>
                  <span className="font-mono">
                    {item.streamsUsed.toLocaleString()} / {item.streamCap.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-accent-live rounded-full"
                    style={{ width: `${(item.streamsUsed / item.streamCap) * 100}%` }}
                  />
                </div>
              </div>

              {/* Right: Download Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => alert(`Downloading 24-bit Master WAV for "${item.beat.title}"...`)}
                  className="h-9 px-3.5 rounded-pill bg-accent hover:bg-[#135d56] text-text text-xs font-medium border border-accent flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download WAV</span>
                </button>

                {item.hasStems && (
                  <button
                    type="button"
                    onClick={() => alert(`Downloading Stems .ZIP for "${item.beat.title}"...`)}
                    className="h-9 px-3.5 rounded-pill bg-surface-2 hover:bg-border text-text text-xs font-medium border border-border flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Stems (.ZIP)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDownloadAgreement(item)}
                  className="h-9 px-3 rounded-pill bg-surface hover:bg-surface-2 text-text text-xs font-medium border border-border flex items-center gap-1.5"
                >
                  <FileText className="h-3.5 w-3.5 text-accent-live" />
                  <span>PDF License</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <HomeFooter />
      <CartDrawer />
      <NowPlayingPanel />
    </div>
  );
}
