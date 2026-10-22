'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopNav } from '../../components/layout/TopNav';
import { HomeFooter } from '../../components/home/HomeFooter';
import { CartDrawer } from '../../components/cart/CartDrawer';
import { NowPlayingPanel } from '../../components/audio/NowPlayingPanel';
import { CREATOR_URL } from '../../lib/urls';
import {
  DollarSign,
  TrendingUp,
  Gift,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building,
  Printer,
  Share2,
  ArrowRight,
  Sparkles,
  PieChart,
  HelpCircle
} from 'lucide-react';

export default function PaymentPolicyPage() {
  const [copied, setCopied] = useState(false);
  const [sampleSale, setSampleSale] = useState<number>(10000);

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
    { id: 'purpose', title: '1. Purpose' },
    { id: 'revenue-sharing', title: '2. 80/20 Paid Beat Split' },
    { id: 'download-incentives', title: '3. Free Download Incentives' },
    { id: 'premium-licenses', title: '4. Premium Licenses' },
    { id: 'earnings-dashboard', title: '5. Producer Dashboard' },
    { id: 'payout-eligibility', title: '6. Payout Schedule' },
    { id: 'refunds-disputes', title: '7. Refunds & Chargebacks' },
    { id: 'exclusive-sales', title: '8. Exclusive Sales' },
    { id: 'taxes', title: '9. Taxes & Compliance' },
    { id: 'disputes-support', title: '10. Disputes & Support' },
    { id: 'policy-changes', title: '11. Changes to Terms' },
    { id: 'acceptance', title: '12. Acceptance' }
  ];

  const incentiveMilestones = [
    { downloads: '10,000', reward: '₦30,000', description: 'Base monthly incentive milestone' },
    { downloads: '20,000', reward: '₦60,000', description: 'Double tier milestone payout' },
    { downloads: '30,000', reward: '₦90,000', description: 'Triple tier milestone payout' },
    { downloads: '50,000', reward: '₦150,000', description: 'Major catalog breakout incentive' },
    { downloads: '100,000', reward: '₦300,000', description: 'Superstar creator volume bonus' }
  ];

  const producerShare = Math.round(sampleSale * 0.8);
  const platformShare = Math.round(sampleSale * 0.2);

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col selection:bg-[#E8B896] selection:text-black">
      <TopNav />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-14 pb-12 sm:pt-20 sm:pb-16 border-b border-white/5 bg-gradient-to-b from-[#121A18]/80 via-[#07090E] to-[#07090E]">
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-emerald-500/15 via-[#2dd4bf]/10 to-transparent blur-3xl opacity-70" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-emerald-400 mb-5 backdrop-blur-md">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            <span className="uppercase tracking-wider">Official Financial Policy</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Payment &amp;{' '}
            <span className="text-[#E8B896] block sm:inline">Revenue-Sharing Policy</span>
          </h1>

          <p className="mt-3 text-lg sm:text-xl font-bold text-teal-300">
            Fair Earnings. Transparent Transactions. Sustainable Growth.
          </p>

          <p className="mt-4 text-xs sm:text-sm text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Caution Studio is committed to creating a fair marketplace where producers earn transparently from paid sales and free commercial download incentives, while artists gain access to affordable music production resources.
          </p>

          {/* Quick Action Toolbar */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="h-9 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Printer className="h-3.5 w-3.5 text-[#E8B896]" />
              <span>Print Policy</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="h-9 px-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5 text-teal-400" />
              <span>{copied ? 'Link Copied!' : 'Share Policy URL'}</span>
            </button>

            <a
              href={`${CREATOR_URL}/payouts`}
              target="_blank"
              rel="noreferrer"
              className="h-9 px-4 rounded-full bg-teal-400 hover:bg-teal-300 text-black text-xs font-black flex items-center gap-1.5 transition-transform hover:scale-105"
            >
              <Building className="h-3.5 w-3.5" />
              <span>Producer Payout Dashboard</span>
            </a>
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

        {/* Section 1: Purpose */}
        <section id="purpose" className="scroll-mt-32 rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Purpose</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Caution Studio is committed to creating a fair marketplace where producers can earn money from their instrumentals while artists gain access to affordable music production resources.
          </p>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            This policy explains how revenue is calculated, how producers earn from paid beat sales and free commercial beat downloads, how commissions are applied, and when payments are issued.
          </p>
        </section>

        {/* Section 2: Revenue Sharing for Paid Beat Sales */}
        <section id="revenue-sharing" className="scroll-mt-32 rounded-2xl bg-gradient-to-br from-[#121A1A] to-[#0D1217] border border-emerald-500/30 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Revenue Sharing for Paid Beat Sales</h2>
                <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                  80% Producer / 20% Caution Studio
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            For standard paid beat sales, Caution Studio operates an industry-leading <strong>80/20 revenue-sharing model</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <div className="text-3xl font-black text-emerald-400">80%</div>
              <div className="text-sm font-bold text-white">To the Producer</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Directly credited to your verified Paystack payout ledger on every successful sale.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
              <div className="text-3xl font-black text-gray-300">20%</div>
              <div className="text-sm font-bold text-white">To Caution Studio</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Covers platform hosting, 24-bit lossless storage, customer support, and streaming infrastructure.
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            The split is calculated on the eligible sale amount after applicable discounts and excluding separately identifiable taxes collected for remittance. Payment processing fees, refunds, chargebacks, and other transaction adjustments are handled according to the fee schedule disclosed to producers.
          </p>

          {/* Interactive Split Calculator */}
          <div className="p-5 rounded-2xl bg-[#090C12] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Interactive Example Calculator</span>
              <span className="text-xs font-mono text-emerald-400 font-bold">Try different amounts</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-400">Sale Amount: ₦</span>
              <input
                type="number"
                step="1000"
                min="1000"
                value={sampleSale}
                onChange={(e) => setSampleSale(Math.max(0, parseInt(e.target.value) || 0))}
                className="h-10 px-3 rounded-lg bg-white/5 border border-white/15 text-white font-mono text-sm w-36 focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-[11px] font-mono uppercase">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Calculation</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr>
                    <td className="py-2.5 font-semibold text-white">Customer payment</td>
                    <td className="py-2.5 text-right font-mono text-gray-400">Gross sale</td>
                    <td className="py-2.5 text-right font-mono font-bold text-white">₦{sampleSale.toLocaleString()}</td>
                  </tr>
                  <tr className="bg-emerald-500/5">
                    <td className="py-2.5 font-semibold text-emerald-300">Producer earnings (80%)</td>
                    <td className="py-2.5 text-right font-mono text-emerald-300/80">80% split</td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-300">₦{producerShare.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-gray-400">Caution Studio commission (20%)</td>
                    <td className="py-2.5 text-right font-mono text-gray-500">20% fee</td>
                    <td className="py-2.5 text-right font-mono text-gray-400">₦{platformShare.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 3: Free Commercial Beat Download Incentive Program */}
        <section id="download-incentives" className="scroll-mt-32 rounded-2xl bg-gradient-to-br from-[#121B26] to-[#0A1017] border border-teal-500/30 p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Free Commercial Beat Download Incentive Program</h2>
              <span className="text-xs text-teal-300 font-semibold uppercase tracking-wider">
                Earn ₦30,000 for Every 10,000 Qualifying Downloads
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Caution Studio aims to support upcoming artists by providing selected beats that can be downloaded and used commercially without an upfront license fee. To reward producers who contribute to this initiative, Caution Studio operates a Free Commercial Beat Download Incentive Program.
          </p>

          {/* 3.1 Producer Earnings Milestone Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Gift className="h-4 w-4 text-teal-400" />
              <span>3.1 Monthly Milestone Reward Schedule</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#070A0F]">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-gray-400 text-[11px] font-mono uppercase">
                    <th className="p-3">Qualifying Downloads Per Month</th>
                    <th className="p-3">Producer Reward</th>
                    <th className="p-3 hidden sm:table-cell">Milestone Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {incentiveMilestones.map((m) => (
                    <tr key={m.downloads} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-bold text-white">{m.downloads}</td>
                      <td className="p-3 font-bold text-teal-300">{m.reward}</td>
                      <td className="p-3 font-sans text-xs text-gray-400 hidden sm:table-cell">{m.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-200">
              💡 <em>These rewards are completely separate from earnings generated by your paid beat sales.</em>
            </div>
          </div>

          {/* 3.2 Qualifying Downloads */}
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-bold text-white">3.2 Qualifying Downloads Criteria</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span>The beat must be approved and listed under Caution Studio&apos;s Free Commercial Royalty-Free License.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span>The download must be completed through Caution Studio&apos;s official platform.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span>Downloads must be genuine and generated by legitimate users. Automated, duplicated, fraudulent, artificially generated, or manipulated downloads will not qualify.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                <span>Producers must comply with the platform&apos;s copyright, licensing, and no-producer-tag policies.</span>
              </li>
            </ul>
          </div>

          {/* 3.3 Monthly Calculation & Rollover */}
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-bold text-white">3.3 Monthly Calculation & Rollover Policy</h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Qualifying downloads are counted during each calendar month, from the first day through the last day. Each complete block of 10,000 qualifying downloads earns ₦30,000.
            </p>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-gray-300 space-y-1">
              <span className="text-[#E8B896] font-bold block uppercase tracking-wider text-[11px]">Rollover Example:</span>
              <p>
                If a producer generates <strong>25,000 qualifying downloads</strong> during a calendar month, the producer earns <strong>₦60,000</strong> for the first 20,000 downloads. The remaining <strong>5,000 qualifying downloads will roll over</strong> toward the next 10,000-download milestone in the following month!
              </p>
            </div>
          </div>

          {/* 3.4 & 3.5 & 3.6 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300">3.4 Payment of Download Incentives</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Eligible incentives are calculated monthly after download activity verification and paid directly to the producer&apos;s verified Paystack account.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300">3.5 Producer Responsibilities</h4>
              <p className="text-xs text-gray-300 leading-relaxed">
                Producers must upload original beats, maintain clean tag-free files, avoid download manipulation, and keep payout details accurate.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Premium Licenses */}
        <section id="premium-licenses" className="scroll-mt-32 rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              4
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Premium Licenses &amp; Additional Products</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Producers may offer additional products and licenses, including:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-300">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              <span>Premium MP3 & 24-bit WAV licenses</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              <span>Trackout or stem packages (.ZIP)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              <span>Higher-tier commercial sync licenses</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              <span>Exclusive master ownership buyouts</span>
            </li>
          </ul>
          <p className="text-xs sm:text-sm text-gray-400 pt-1">
            Unless a separate written agreement states otherwise, the standard 80% producer / 20% platform split applies to all eligible paid beat-license sales.
          </p>
        </section>

        {/* Section 5: Producer Earnings Dashboard */}
        <section id="earnings-dashboard" className="scroll-mt-32 rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              5
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Producer Earnings Dashboard</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Caution Studio provides every producer with real-time analytics and transparent statements in the Creator Dashboard showing:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300">
              ✓ Paid beat sales & license logs
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300">
              ✓ Qualifying free download milestones
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300">
              ✓ Monthly incentive rewards (₦30k per 10k)
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300">
              ✓ Net revenue after commissions
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300">
              ✓ Pending & completed Paystack payouts
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-gray-300">
              ✓ Real-time streaming RPM & play counts
            </div>
          </div>
        </section>

        {/* Section 6: Payout Eligibility & Schedule */}
        <section id="payout-eligibility" className="scroll-mt-32 rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              6
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Payout Eligibility and Schedule</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Producers must configure verified Paystack bank payout details (GTBank, Access, Zenith, Kuda, OPay, etc.) before receiving withdrawals. Payments are cleared with instant transfer upon request or automated schedule for milestone incentives.
          </p>
          <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/30 text-xs sm:text-sm text-teal-200">
            ₦ <strong>Minimum Withdrawal Threshold:</strong> Payouts can be initiated once available earnings meet the minimum settlement threshold, subject to normal anti-fraud verification.
          </div>
        </section>

        {/* Section 7 to 11 in clean informative layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 7 */}
          <section id="refunds-disputes" className="rounded-2xl bg-[#0F131C] border border-white/10 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-teal-400">7.</span>
              <h3 className="text-base font-bold text-white">Refunds &amp; Chargebacks</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Refunds and reversed transactions result in adjustments to associated paid-sale earnings. Free download incentives are reviewed separately from paid-sale revenue; a refund on a paid license will not cancel unrelated qualifying free downloads.
            </p>
          </section>

          {/* Section 8 */}
          <section id="exclusive-sales" className="rounded-2xl bg-[#0F131C] border border-white/10 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-teal-400">8.</span>
              <h3 className="text-base font-bold text-white">Exclusive Sales &amp; Prior Beats</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Producers must disclose whether a beat has already been licensed non-exclusively to other artists before offering it for exclusive buyout. Subsequent exclusive licenses permanently retire the beat while respecting previous non-exclusive customer rights.
            </p>
          </section>

          {/* Section 9 */}
          <section id="taxes" className="rounded-2xl bg-[#0F131C] border border-white/10 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-teal-400">9.</span>
              <h3 className="text-base font-bold text-white">Taxes &amp; Compliance</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Producers are responsible for applicable personal or business tax obligations in their jurisdiction, subject to any withholding, reporting, or duties imposed on Caution Studio by law.
            </p>
          </section>

          {/* Section 10 */}
          <section id="disputes-support" className="rounded-2xl bg-[#0F131C] border border-white/10 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-teal-400">10.</span>
              <h3 className="text-base font-bold text-white">Payment Disputes &amp; Support</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Producers may contact Caution Studio regarding missing payouts, download incentive discrepancies, or transaction calculations with transaction references and beat titles. Dedicated resolution support is provided.
            </p>
          </section>
        </div>

        {/* Section 11: Policy Changes */}
        <section id="policy-changes" className="scroll-mt-32 rounded-2xl bg-[#0F131C] border border-white/10 p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              11
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Changes to Revenue-Sharing Terms &amp; Incentive Rates</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Caution Studio may review its commissions, transaction fees, incentive rates, payout procedures, and supported payment methods as the marketplace grows. Material changes will be communicated to affected producers before taking effect. Changes will not retroactively alter completed transactions or verified rewards already earned.
          </p>
        </section>

        {/* Section 12: Acceptance */}
        <section id="acceptance" className="scroll-mt-32 rounded-2xl bg-[#0F131C] border border-teal-500/30 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              12
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Acceptance</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            By registering as a producer, selling beats, or participating in the Free Commercial Beat Download Incentive Program, the producer acknowledges and agrees to comply with this policy and all applicable platform terms.
          </p>

          <div className="pt-6 border-t border-white/10 text-center">
            <div className="text-xs font-mono uppercase tracking-widest text-[#E8B896] font-bold">
              CAUTION STUDIO — SUPPORTING ARTISTS. EMPOWERING PRODUCERS. REWARDING CREATIVITY.
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
