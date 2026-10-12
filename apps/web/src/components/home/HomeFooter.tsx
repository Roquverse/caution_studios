import React from 'react';
import Link from 'next/link';

export const HomeFooter: React.FC = () => {
  return (
    <footer className="bg-surface border-t border-border text-text py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-border">
          {/* Brand */}
          <div className="md:col-span-5 space-y-3">
            <Link href="/" className="inline-block">
              <img
                src="/logo.png"
                alt="Caution Studio"
                className="h-8 w-auto object-contain brightness-0 invert"
                style={{ width: 140 }}
              />
            </Link>
            <p className="text-xs text-text-muted max-w-sm leading-relaxed">
              Beat streaming and licensing marketplace connecting independent producers and recording artists worldwide.
            </p>
            <div className="text-[11px] font-mono text-text-faint">
              High-fidelity lossless audio storage · Direct Paystack clearance.
            </div>
          </div>

          {/* Column 1: Marketplace */}
          <div className="md:col-span-2 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Marketplace
            </div>
            <ul className="space-y-2 text-xs text-text-muted">
              <li>
                <Link href="/beats" className="hover:text-text transition-colors">Browse beats</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-text transition-colors">Pricing & plans</Link>
              </li>
              <li>
                <Link href="/beats?genre=Afrobeats" className="hover:text-text transition-colors">Afrobeats</Link>
              </li>
              <li>
                <Link href="/beats?genre=Amapiano" className="hover:text-text transition-colors">Amapiano</Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Producers */}
          <div className="md:col-span-2 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
              For producers
            </div>
            <ul className="space-y-2 text-xs text-text-muted">
              <li>
                <Link href="/studio" className="hover:text-text transition-colors">Producer studio</Link>
              </li>
              <li>
                <Link href="/studio/upload" className="hover:text-text transition-colors">Upload beats</Link>
              </li>
              <li>
                <Link href="/studio/payouts" className="hover:text-text transition-colors">Paystack payouts</Link>
              </li>
              <li>
                <Link href="/studio/sales" className="hover:text-text transition-colors">Sales & earnings</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Account & Support */}
          <div className="md:col-span-3 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Account & licenses
            </div>
            <ul className="space-y-2 text-xs text-text-muted">
              <li>
                <Link href="/library" className="hover:text-text transition-colors">My library & downloads</Link>
              </li>
              <li>
                <Link href="/likes" className="hover:text-text transition-colors">Liked beats</Link>
              </li>
              <li>
                <Link href="/settings/plan" className="hover:text-text transition-colors">Subscription plan</Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-text transition-colors">FAQ & legal agreements</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-text-faint gap-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-live" />
            <span className="font-mono text-text-muted">CAUTION STUDIO // LIVE MARKETPLACE</span>
          </div>
          <div>
            © {new Date().getFullYear()} Caution Studio Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
