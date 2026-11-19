'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserShell } from '../../components/UserShell';
import {
  Download,
  FileText,
  Music2,
  ShieldCheck,
  Loader2,
  ShoppingBag,
  Disc,
  Play,
  Pause,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

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

export default function UserLibraryPage() {
  const [loading, setLoading] = useState(true);
  const [licensedItems, setLicensedItems] = useState<LicensedItem[]>([]);
  const [buyerName, setBuyerName] = useState<string>('Verified Artist');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

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
        console.error('Error fetching purchased beats in Artist Library:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPurchasedBeats();

    return () => {
      isMounted = false;
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, []);

  const handleDownloadFile = (url: string | null, fallbackFilename: string) => {
    if (!url) {
      alert('Master audio file is currently processing. Please check back in a few minutes or contact executive support.');
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
              }
              .card {
                background: #141618;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                padding: 32px;
                margin-bottom: 24px;
              }
              .row {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
              }
              .label {
                color: #8E9296;
                font-size: 14px;
              }
              .value {
                color: #FFFFFF;
                font-weight: 600;
                font-size: 14px;
              }
              .terms {
                font-size: 12px;
                color: #8E9296;
                line-height: 1.8;
                margin-top: 24px;
              }
              .footer {
                margin-top: 48px;
                padding-top: 24px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 11px;
                color: #555;
                text-align: center;
              }
              @media print {
                body { background: #fff; color: #000; }
                .card { background: #fff; border: 1px solid #ccc; }
                .label { color: #666; }
                .value { color: #000; }
                .terms { color: #444; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">CAUTION STUDIO</div>
              <div class="badge">${lic.type.toUpperCase()}</div>
            </div>

            <div class="card">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #fff;">Certificate of Musical Commercial License</h2>
              <div class="row">
                <span class="label">License Reference</span>
                <span class="value" style="font-family: monospace;">${lic.licenseId}</span>
              </div>
              <div class="row">
                <span class="label">Musical Work (Beat)</span>
                <span class="value">${lic.beat.title}</span>
              </div>
              <div class="row">
                <span class="label">Music Producer</span>
                <span class="value">${lic.beat.producer?.display_name || 'Studio Producer'} (@${lic.beat.producer?.handle || 'producer'})</span>
              </div>
              <div class="row">
                <span class="label">Licensee / Buyer</span>
                <span class="value">${buyerName}</span>
              </div>
              <div class="row">
                <span class="label">Issue Date</span>
                <span class="value">${lic.issuedDate}</span>
              </div>
              <div class="row">
                <span class="label">Allowed Commercial Stream Cap</span>
                <span class="value">${lic.streamCap ? lic.streamCap.toLocaleString() + ' Streams' : 'Unlimited (Exclusive)'}</span>
              </div>
              <div class="row">
                <span class="label">Included Master Audio</span>
                <span class="value">24-bit 48kHz Uncompressed WAV ${lic.hasStems ? '+ Full Track Stems (.ZIP)' : ''}</span>
              </div>
            </div>

            <div class="card">
              <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #2dd4bf;">Legal Terms & Grant of Rights</h3>
              <p class="terms">
                Caution Studio hereby certifies that the Licensee named above has purchased non-exclusive or exclusive commercial usage rights to the specified audio master recordings. The producer retains statutory moral rights unless an exclusive buyout was executed. The licensee is authorized to monetize derivative songs across digital streaming providers (Spotify, Apple Music, YouTube Music, Boomplay, Audiomack) and synchronized video broadcasts up to the agreed stream cap.
              </p>
            </div>

            <div class="footer">
              Authentic commercial certificate issued by Caution Studio Technologies. Powered by Paystack Secure Escrow.
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      win.document.close();
    }
  };

  const handlePlayPreview = (lic: LicensedItem) => {
    if (playingId === lic.licenseId) {
      if (audioElement) {
        audioElement.pause();
      }
      setPlayingId(null);
      return;
    }

    if (audioElement) {
      audioElement.pause();
    }

    const audioUrl = lic.masterWavUrl || `/api/media/${encodeURIComponent(lic.beat.id)}/stream`;
    const audio = new Audio(audioUrl);
    audio.play().catch((err) => console.warn('Preview play error:', err));
    audio.onended = () => setPlayingId(null);
    setAudioElement(audio);
    setPlayingId(lic.licenseId);
  };

  const filteredItems = licensedItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.beat.title.toLowerCase().includes(q) ||
      (item.beat.producer?.display_name && item.beat.producer.display_name.toLowerCase().includes(q)) ||
      (item.beat.genre && item.beat.genre.toLowerCase().includes(q))
    );
  });

  return (
    <UserShell activePath="/library">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                My Purchased Beats
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#2dd4bf]/15 text-[#2dd4bf] border border-[#2dd4bf]/30">
                {licensedItems.length} {licensedItems.length === 1 ? 'License' : 'Licenses'}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Access your uncompressed 24-bit Master WAV files, multi-track Stems (.ZIP), and official PDF license certificates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/?tab=marketplace"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#04564f] to-[#2dd4bf] text-white text-xs font-bold hover:brightness-110 transition-all shadow-lg shadow-[#04564f]/30"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Browse Beat Store</span>
            </Link>
          </div>
        </div>

        {/* Search Bar if beats exist */}
        {licensedItems.length > 0 && (
          <div className="relative max-w-md">
            <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter purchased beats by title or producer..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#2dd4bf] transition-colors"
            />
          </div>
        )}

        {/* Content State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="h-8 w-8 text-[#2dd4bf] animate-spin" />
            <p className="text-xs text-gray-400 font-mono tracking-wide">Loading your commercial licenses...</p>
          </div>
        ) : licensedItems.length === 0 ? (
          /* Empty State - NO dummy content */
          <div className="bg-[#16181c] border border-white/[0.06] rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#04564f]/20 border border-[#2dd4bf]/30 flex items-center justify-center mx-auto text-[#2dd4bf]">
              <Music2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No purchased beats found yet</h3>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                When you purchase beats on Caution Studio, your uncompressed Master WAV files, multi-track Stems ZIP, and signed commercial licenses will automatically appear here for instant download anytime.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/?tab=marketplace"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2dd4bf] text-black text-xs font-bold hover:bg-[#20b8a3] transition-all shadow-md"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Explore Beat Marketplace</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Real Purchased Beats Grid */
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <div
                key={item.licenseId}
                className="bg-[#16181c] border border-white/[0.08] hover:border-white/[0.15] rounded-2xl p-4 sm:p-6 transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* Left: Beat info with cover */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <div className="relative group shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black border border-white/10 shadow-md">
                        <img
                          src={item.beat.cover_url || '/images/studio_mixing_console.jpg'}
                          alt={item.beat.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePlayPreview(item)}
                        className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl cursor-pointer"
                        title="Preview Beat"
                      >
                        {playingId === item.licenseId ? (
                          <Pause className="h-6 w-6 text-white" />
                        ) : (
                          <Play className="h-6 w-6 text-white ml-0.5" />
                        )}
                      </button>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-white truncate">
                          {item.beat.title}
                        </h2>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#04564f] text-[#2dd4bf] border border-[#2dd4bf]/40">
                          {item.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        By <span className="text-white font-medium">{item.beat.producer?.display_name || 'Studio Producer'}</span>
                        {item.beat.genre && <span> • {item.beat.genre}</span>}
                        {item.beat.bpm && <span> • {item.beat.bpm} BPM</span>}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] font-mono text-gray-500">
                        <span>Ref: {item.licenseId}</span>
                        <span>•</span>
                        <span>Purchased: {item.issuedDate}</span>
                        {item.streamCap && (
                          <>
                            <span>•</span>
                            <span className="text-teal-400">{item.streamCap.toLocaleString()} Streams</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Download Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.06]">
                    {/* Master WAV Download */}
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(item.masterWavUrl, `${item.beat.title} - Master WAV.wav`)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-[#2dd4bf] border border-teal-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
                      title="Download 24-bit 48kHz uncompressed Master WAV"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download WAV</span>
                    </button>

                    {/* Stems ZIP Download */}
                    {item.hasStems && (
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(item.stemsZipUrl, `${item.beat.title} - Stems.zip`)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                        title="Download Multi-track Stems ZIP archive"
                      >
                        <Disc className="h-3.5 w-3.5 text-amber-400" />
                        <span>Stems (.ZIP)</span>
                      </button>
                    )}

                    {/* PDF License Certificate */}
                    <button
                      type="button"
                      onClick={() => handleDownloadAgreement(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/[0.08] text-xs font-medium transition-all cursor-pointer"
                      title="View & Print Official Legal Commercial License Certificate"
                    >
                      <FileText className="h-3.5 w-3.5 text-gray-400" />
                      <span>PDF License</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserShell>
  );
}
