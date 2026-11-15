'use client';

import React from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import { APP_URL } from '../../lib/urls';
import {
  Sparkles,
  TrendingUp,
  Award,
  Disc3,
  ShieldCheck,
  Radio,
  ArrowRight,
  CheckCircle2,
  Headphones,
  Zap,
  Play,
  Users
} from 'lucide-react';

export default function CaseStudiesPage() {
  const caseStudies = [
    {
      id: 'bedroom-to-streaming',
      tag: 'Artist Growth',
      badge: '2.4M Streams',
      badgeColor: 'teal',
      title: 'From Unsigned Bedroom Vocalist to 2.4M Global DSP Streams',
      artist: 'Tunde "VibeKid" Adams • Lagos, Nigeria',
      genre: 'Afro-Fusion / R&B',
      heroImage: '/images/african_vocal_session.jpg',
      problem: 'Struggling with low-quality tagged MP3 beats found on YouTube that caused immediate copyright strikes and disqualified his songs from official Spotify editorial playlisting.',
      solution: 'Licensed a ₦30,000 Premium Beat Plan on Caution Studio, giving him full 24-bit uncompressed WAV stems, 100% royalty-keeping rights, and automated Content ID clearance.',
      results: [
        '2,400,000+ total streams across Spotify & Apple Music in 6 months',
        'Featured on Spotify’s official “Afro Pop” and “Radar Africa” playlists',
        '₦1.8M in streaming royalties earned directly without publisher splits',
        'Zero copyright claims or takedown disputes'
      ],
      quote: '“Caution Studio changed everything for me. Getting the full trackout stems allowed my mix engineer to carve space for my voice, and having the legal clearance in writing gave my distributor instant confidence.”'
    },
    {
      id: 'producer-passive-income',
      tag: 'Producer Economy',
      badge: '₦620k/mo Revenue',
      badgeColor: 'amber',
      title: 'Scaling Producer Revenue: Generating ₦620,000 Monthly from Lagos',
      artist: 'Producer BeatMaster X • Verified Creator',
      genre: 'Amapiano & Afrobeats',
      heroImage: '/images/african_mixing_engineer.jpg',
      problem: 'Relying exclusively on unreliable DM sales, delayed client bank transfers, and unpaid production royalties with zero automated distribution infrastructure.',
      solution: 'Onboarded to the Caution Creator Portal, uploading 45 catalog instrumentals with standardized license pricing and automated Paystack checkout.',
      results: [
        '₦620,000 average monthly revenue from digital lease purchases',
        '14 exclusive buyout licenses sold in 2026',
        'Consistent weekly Paystack automated withdrawals to his Nigerian bank',
        'Earns passive revenue share from Caution Studio’s ad-supported streaming pool'
      ],
      quote: '“I used to chase artists for months to collect ₦30k. On Caution Studio, artists from the US, UK, and Lagos buy my leases while I sleep, and the money lands straight in my bank account via Paystack.”'
    },
    {
      id: 'nollywood-sync-clearance',
      tag: 'Film & Cinema Sync',
      badge: 'Cleared in 24h',
      badgeColor: 'purple',
      title: 'Nollywood Blockbuster Soundtrack Clearance in Under 24 Hours',
      artist: 'Lagos Filmworks & Cinema Productions',
      genre: 'Street-Hop & Cinematic Afro-Percussion',
      heroImage: '/images/african_producer_beats.jpg',
      problem: 'A major feature film destined for nationwide cinema and global Netflix distribution needed 3 high-energy urban tracks on an emergency 48-hour post-production deadline.',
      solution: 'Discovered beats on Caution Studio, auditioned stem trackouts, and executed an Exclusive Rights license agreement with custom sync clauses in under 24 hours.',
      results: [
        '100% full master and stem ownership acquired with zero third-party sample liability',
        'Soundtrack cleared for worldwide theatrical, television, and streaming broadcast',
        'Zero production delays, meeting the distributor’s international QC deadline',
        'Producer received an immediate 6-figure buyout fee + sync performance royalties'
      ],
      quote: '“In film production, copyright ambiguity will sink a distribution deal. Caution Studio delivered clean masters, separated stems for surround-sound mixing, and watertight legal paperwork overnight.”'
    },
    {
      id: 'viral-audio-ads-campaign',
      tag: 'Track Promotion',
      badge: '38,000 Listens',
      badgeColor: 'teal',
      title: 'Breaking a Debut Single with 10s Caution Audio Ads',
      artist: 'Amaka Ray • Abuja, Nigeria',
      genre: 'Afro-Soul & Acoustic Melodies',
      heroImage: '/images/golden_clef.jpg',
      problem: 'Zero social media ad budget to compete against major label marketing spend on Instagram and TikTok.',
      solution: 'Uploaded a punchy 10-second snippet of her chorus into the Caution Audio Ad engine, targeting music listeners and recording artists while they audition beats.',
      results: [
        '38,000+ verified audio impressions inside the Caution streaming player',
        '4,200 direct click-throughs to her Apple Music pre-save link',
        'Single debuted in the Apple Music Nigeria Top 100 on launch week',
        '5x higher conversion rate than traditional social media video ads'
      ],
      quote: '“Listeners on Caution Studio are already listening to music with headphones on. When my 10s ad played right before their beat preview, the conversion to my Apple Music was unbelievable.”'
    }
  ];

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col selection:bg-[#E8B896] selection:text-black">
      <TopNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 sm:pt-24 pb-16 sm:pb-20 border-b border-white/5">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[750px] h-[400px] bg-gradient-to-tr from-[#04564f]/30 via-teal-500/15 to-transparent blur-3xl opacity-70" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-teal-300 mb-6 backdrop-blur-md">
            <Award className="h-3.5 w-3.5 text-teal-400" />
            <span className="uppercase tracking-wider">Creator Proof &amp; Case Studies</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Real Stories from the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-[#2dd4bf] to-[#E8B896]">
              Frontlines of African Music.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Discover how independent artists, music producers, and cinema creators leverage Caution Studio’s beats, stems, and legal infrastructure to achieve breakout success.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={APP_URL}
              className="h-11 px-7 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#04564f]/30 transition-all hover:scale-105 border border-[#2dd4bf]/30"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <Link
              href="/assessment"
              className="h-11 px-6 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all"
            >
              <Sparkles className="h-4 w-4 text-teal-400" />
              <span>Get Free Artist Assessment</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Case Studies Detailed Cards */}
      <section className="py-16 sm:py-24 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {caseStudies.map((cs, idx) => (
            <div
              key={cs.id}
              className="rounded-3xl bg-[#0F131C] border border-white/10 overflow-hidden shadow-2xl p-6 sm:p-10 transition-all hover:border-[#2dd4bf]/40"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left Media Capsule */}
                <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-[4/3] bg-black/60 border border-white/5 group">
                  <img
                    src={cs.heroImage}
                    alt={cs.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                      {cs.tag}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-xs font-mono text-gray-300 bg-black/70 px-2.5 py-1 rounded-md border border-white/10">
                      {cs.genre}
                    </span>
                    <span className="text-xs font-bold text-teal-300 bg-[#04564f]/90 px-3 py-1 rounded-full shadow-md">
                      {cs.badge}
                    </span>
                  </div>
                </div>

                {/* Right Content */}
                <div className="lg:col-span-7 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-mono text-gray-400">{cs.artist}</span>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mt-1 leading-snug">
                      {cs.title}
                    </h2>

                    {/* Problem / Solution Grid */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="font-bold text-red-400 uppercase tracking-wider block mb-1">
                          The Challenge
                        </span>
                        <p className="text-gray-400 leading-relaxed">{cs.problem}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="font-bold text-teal-400 uppercase tracking-wider block mb-1">
                          Caution Studio Solution
                        </span>
                        <p className="text-gray-400 leading-relaxed">{cs.solution}</p>
                      </div>
                    </div>

                    {/* Key Results */}
                    <div className="mt-5 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                        Verified Results:
                      </span>
                      {cs.results.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                          <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>

                    {/* Testimonial Quote */}
                    <div className="mt-6 p-4 rounded-xl bg-teal-500/[0.04] border border-teal-500/20 text-xs text-gray-300 italic leading-relaxed">
                      {cs.quote}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0F1A1B] via-[#0A1314] to-[#121620] border border-[#2dd4bf]/30 shadow-2xl relative">
            <TrendingUp className="h-10 w-10 text-teal-400 mx-auto mb-4" />
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Ready to write your own success story?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-gray-300 max-w-xl mx-auto">
              Access over 10,000 royalty-free beats, full stem trackouts, and direct legal clearance today.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href={APP_URL}
                className="h-11 px-7 rounded-full bg-[#04564f] hover:bg-[#03453f] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-[#04564f]/30 transition-transform hover:scale-105 border border-[#2dd4bf]/30"
              >
                <span>Explore Beats Catalog</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/services"
                className="h-11 px-6 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold text-xs sm:text-sm border border-white/10 transition-colors"
              >
                <span>View All Services</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HomeFooter />
      <CartDrawer />
      <NowPlayingPanel />
    </div>
  );
}

