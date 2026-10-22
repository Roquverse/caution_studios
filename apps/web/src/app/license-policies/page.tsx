'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import {
  ShieldCheck,
  FileText,
  VolumeX,
  Copyright,
  AlertTriangle,
  Award,
  CheckCircle2,
  Download,
  Share2,
  Printer,
  Sparkles,
  Music2,
  Radio,
  ArrowRight,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

export default function LicensePoliciesPage() {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sections = [
    { id: 'commercial-rights', title: '1. Commercial Usage Rights' },
    { id: 'no-producer-tags', title: '2. No Producer Tags Policy' },
    { id: 'copyright-ownership', title: '3. Copyright and Ownership' },
    { id: 'content-id-protection', title: '4. Copyright Claims & Content ID' },
    { id: 'restrictions', title: '5. Restrictions' },
    { id: 'royalty-free-usage', title: '6. Royalty-Free Usage' },
    { id: 'license-verification', title: '7. License Verification' },
    { id: 'acceptance-terms', title: '8. Acceptance of Terms' }
  ];

  const streamingPlatforms = [
    'Spotify',
    'Apple Music',
    'Audiomack',
    'YouTube Music',
    'Boomplay',
    'Deezer',
    'Amazon Music',
    'TikTok',
    'Instagram',
    'Tidal'
  ];

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col selection:bg-[#E8B896] selection:text-black">
      <TopNav />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-12 sm:pt-20 sm:pb-16 border-b border-white/5 bg-gradient-to-b from-[#0F1420]/80 via-[#07090E] to-[#07090E]">
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-[#2dd4bf]/15 via-[#E8B896]/10 to-transparent blur-3xl opacity-70" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-[#2dd4bf] mb-5 backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-[#2dd4bf]" />
            <span className="uppercase tracking-wider">Official Legal Agreement</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Commercial Royalty-Free{' '}
            <span className="text-[#E8B896] block sm:inline">Beat License Agreement</span>
          </h1>

          <p className="mt-3 text-lg sm:text-xl font-bold text-teal-300">
            Make Music Freely. Release Confidently.
          </p>

          <p className="mt-4 text-xs sm:text-sm text-gray-300 max-w-2xl mx-auto leading-relaxed">
            At Caution Studio, our mission is to make music production accessible and affordable for upcoming artists. This license allows artists to download beats, create original songs, and release their music commercially, subject to the terms below.
          </p>

          {/* Quick Action Toolbar */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="h-9 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-[#E8B896]" />
              <span>Print Agreement</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="h-9 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5 text-teal-400" />
              <span>{copied ? 'Link Copied!' : 'Share License URL'}</span>
            </button>

            <Link
              href="/beats"
              className="h-9 px-4 rounded-full bg-[#E8B896] hover:bg-[#d8a886] text-black text-xs font-black flex items-center gap-1.5 transition-transform hover:scale-105"
            >
              <Music2 className="h-3.5 w-3.5" />
              <span>Browse Cleared Beats</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Jump Bar */}
      <div className="sticky top-16 z-20 bg-[#07090E]/95 backdrop-blur-md border-b border-white/5 py-3">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-gray-500 font-mono text-[11px] shrink-0 uppercase tracking-wider mr-1">Jump to:</span>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white shrink-0 transition-colors"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">

        {/* Section 1 */}
        <section id="commercial-rights" className="scroll-mt-32 rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Commercial Usage Rights</h2>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Upon downloading or purchasing a beat under an eligible Commercial Royalty-Free License, the artist is granted a <strong>non-exclusive, worldwide license</strong> to use the beat to create an original song, including songs featuring vocals, lyrics, rap, or other original performances.
          </p>

          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-3">
              The artist may explicitly:
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Record and release original songs</strong> using the licensed beat.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Distribute songs across all major DSPs:</strong> Spotify, Apple Music, Audiomack, YouTube Music, Boomplay, Deezer, Amazon Music, and other digital streaming platforms.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Monetize eligible releases</strong> through streaming royalties and digital sales.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Promote their songs</strong> on TikTok, Instagram, Facebook, YouTube, and other social media platforms.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Use the resulting song</strong> in music videos, promotional campaigns, and live performances.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Earn revenue from their original song</strong> without paying ongoing beat-use royalties to Caution Studio or the producer, provided the applicable license explicitly includes royalty-free commercial usage.</span>
              </li>
            </ul>
          </div>

          {/* Platform Pills */}
          <div className="pt-3 border-t border-white/5">
            <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider block mb-2">
              Worldwide Cleared DSPs & Networks:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {streamingPlatforms.map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-[11px] font-medium text-gray-300"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: No Producer Tags Policy */}
        <section id="no-producer-tags" className="scroll-mt-32 rounded-2xl bg-gradient-to-br from-[#121820] to-[#0D1017] border border-amber-500/30 p-6 sm:p-8 space-y-4 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">No Producer Tags Policy</h2>
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                100% Clean Master Files Guaranteed
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-200 space-y-1">
            <strong>Commercial Royalty-Free Beats must be delivered and used without producer tags.</strong>
            <p className="text-xs text-amber-200/80">
              Producers must provide Commercial Royalty-Free Beats without producer tags, voice tags, audio watermarks, or other spoken branding embedded in the instrumental.
            </p>
          </div>

          <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
            <li className="flex items-start gap-2.5">
              <VolumeX className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Producers are prohibited</strong> from adding, reintroducing, or requiring a producer tag on a beat covered by this license after it has been licensed to an artist.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <VolumeX className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Artists must not add</strong> producer tags, third-party tags, or other unauthorized branding to the licensed instrumental.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <VolumeX className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span><strong>Permanent clean delivery:</strong> Once a beat is designated and delivered under the Commercial Royalty-Free License, the instrumental must remain free of producer tags for the artist&apos;s authorized commercial use.</span>
            </li>
          </ul>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-300">
            💡 <em>This policy ensures that artists can release professional, clean-sounding music without unwanted interruptions or branding.</em>
          </div>
        </section>

        {/* Section 3 */}
        <section id="copyright-ownership" className="scroll-mt-32 rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Copyright and Ownership</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E8B896]">Producer Rights</span>
              <p className="text-xs sm:text-sm text-gray-300">
                The producer retains ownership of the original instrumental and its underlying composition unless a separate written agreement states otherwise.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Artist Rights</span>
              <p className="text-xs sm:text-sm text-gray-300">
                The artist retains ownership of their original lyrics, vocals, and other original contributions, subject to applicable agreements with collaborators.
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed pt-2">
            A standard non-exclusive license grants commercial usage rights but does not transfer exclusive ownership of the original beat to the artist. (For 1-of-1 master ownership buyout, artists should select the <strong>Exclusive Buyout</strong> tier).
          </p>
        </section>

        {/* Section 4 */}
        <section id="content-id-protection" className="scroll-mt-32 rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              4
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Copyright Claims & Content ID Protection</h2>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Caution Studio requires producers to confirm that they own or have the necessary rights to license every beat they upload, including any samples, loops, and third-party materials.
          </p>

          <div className="space-y-2.5 text-xs sm:text-sm text-gray-300">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <strong>No False Claims:</strong> Producers must not knowingly submit false copyright claims against artists who are using properly licensed beats within the agreed terms.
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <strong>Digital Distribution:</strong> Artists may distribute their licensed songs through digital distributors (DistroKid, TuneCore, CD Baby, Amuse, etc.), subject to each distributor&apos;s requirements.
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <strong>Sample Disclosure:</strong> Producers must disclose samples or third-party materials that may affect commercial use. Beats containing uncleared samples or materials that cannot be commercially licensed must not be advertised as fully cleared for commercial use.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-500/30 text-xs sm:text-sm text-teal-200">
            🛡️ <strong>Caution Studio Resolution Assistance:</strong> Caution Studio cannot guarantee that automated copyright claims will never occur. If an automated claim arises on YouTube, TikTok, or Meta, Caution Studio will make reasonable efforts to assist in resolving it when the artist provides proof of their license and the use is authorized.
          </div>
        </section>

        {/* Section 5: Restrictions */}
        <section id="restrictions" className="scroll-mt-32 rounded-2xl bg-[#0F131C] border border-red-500/20 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
              5
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Restrictions</h2>
          </div>

          <p className="text-xs sm:text-sm text-gray-300">
            To preserve the integrity of the ecosystem, the artist may <strong>not</strong>:
          </p>

          <ul className="space-y-2 text-xs sm:text-sm text-red-200">
            <li className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>Resell, redistribute, or share</strong> the original beat as a standalone instrumental.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>Claim sole ownership or authorship</strong> of the original beat composition.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>Register the original beat itself</strong> in YouTube Content ID or another exclusive rights-management system without written authorization.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>Transfer or resell the license</strong> to another person or third party.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>Use the beat outside</strong> the permissions granted by the applicable license tier.</span>
            </li>
          </ul>
        </section>

        {/* Section 6 */}
        <section id="royalty-free-usage" className="scroll-mt-32 rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              6
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Royalty-Free Usage</h2>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            For beats specifically marked <strong>Commercial Royalty-Free</strong>, no recurring beat-use royalty or additional producer payment is due for authorized commercial exploitation of the released song.
          </p>

          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            This does not automatically eliminate separately agreed songwriting, publishing, performance-rights, or collaborator shares. Any such shares must be clearly disclosed and agreed upon before purchase.
          </p>
        </section>

        {/* Section 7 */}
        <section id="license-verification" className="scroll-mt-32 rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              7
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">License Verification</h2>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Artists should retain their purchase receipt, license certificate, beat title, producer name, and transaction details as proof of authorization.
          </p>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Caution Studio may request these details when assisting with copyright disputes or verifying licensed use across streaming services and social media platforms.
          </p>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Need a copy of your license certificate?</div>
              <div className="text-xs text-gray-400">Available instantly in your account downloads.</div>
            </div>
            <Link
              href="/library"
              className="text-xs font-bold text-[#E8B896] hover:underline flex items-center gap-1"
            >
              <span>View My Library</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Section 8 */}
        <section id="acceptance-terms" className="scroll-mt-32 rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              8
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Acceptance of Terms</h2>
          </div>

          <ul className="space-y-3 text-xs sm:text-sm text-gray-300">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
              <span><strong>For Artists:</strong> By downloading or purchasing a beat under this license, the artist agrees to comply with these terms.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
              <span><strong>For Producers:</strong> Producers who upload beats to Caution Studio agree to comply with the platform&apos;s licensing, copyright, disclosure, and no-producer-tag requirements for all beats designated as Commercial Royalty-Free.</span>
            </li>
          </ul>

          <div className="pt-6 border-t border-white/10 text-center">
            <div className="text-xs font-mono uppercase tracking-widest text-[#E8B896] font-bold">
              CAUTION STUDIO — MAKING QUALITY MUSIC PRODUCTION ACCESSIBLE TO EVERY ARTIST.
            </div>
          </div>
        </section>

      </main>

      <HomeFooter />
      <CartDrawer />
      <NowPlayingPanel />
    </div>
  );
}
