import React from 'react';
import { Music2 } from 'lucide-react';
import { cn } from '../utils/cn';

export interface FooterProps {
  brandName?: string;
  onNavigate?: (href: string) => void;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({
  brandName = 'Music Website',
  onNavigate,
  className
}) => {
  const handleLink = (e: React.MouseEvent, href: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(href);
    }
  };

  return (
    <footer
      className={cn(
        'w-full bg-[#08090C] text-gray-400 pt-16 pb-12 border-t border-gray-900',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 pb-12 border-b border-gray-800/80">
          {/* Brand & Mission column (takes 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-white font-extrabold text-xl tracking-tight">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E50FF] text-white">
                <Music2 className="h-4 w-4 stroke-[2.5]" />
              </div>
              <span>{brandName}</span>
            </div>

            <p className="text-sm font-semibold text-white">
              Creative tools built for creators
            </p>

            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Our mission is to empower creators worldwide to tell their stories
              through music. We bring authentic taste-curated sounds through
              powerful audio editing software, professional digital assets for video
              creators & accessible licensing models to support your achieving your vision.
            </p>
          </div>

          {/* Column 2: Products */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Products
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/#library"
                  onClick={(e) => handleLink(e, '/#library')}
                  className="hover:text-white transition-colors"
                >
                  Royalty-Free Music
                </a>
              </li>
              <li>
                <a
                  href="/#sfx"
                  onClick={(e) => handleLink(e, '/#sfx')}
                  className="hover:text-white transition-colors"
                >
                  Sound Effects
                </a>
              </li>
              <li>
                <a
                  href="/#stock"
                  onClick={(e) => handleLink(e, '/#stock')}
                  className="hover:text-white transition-colors"
                >
                  Stock Footage
                </a>
              </li>
              <li>
                <a
                  href="/#templates"
                  onClick={(e) => handleLink(e, '/#templates')}
                  className="hover:text-white transition-colors"
                >
                  Video Templates
                </a>
              </li>
              <li>
                <a
                  href="/#plugins"
                  onClick={(e) => handleLink(e, '/#plugins')}
                  className="hover:text-white transition-colors"
                >
                  Plugins
                </a>
              </li>
              <li>
                <a
                  href="/#software"
                  onClick={(e) => handleLink(e, '/#software')}
                  className="hover:text-white transition-colors"
                >
                  Software
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: About */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              About
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleLink(e, '/about')}
                  className="hover:text-white transition-colors"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="/business"
                  onClick={(e) => handleLink(e, '/business')}
                  className="hover:text-white transition-colors"
                >
                  Business Solutions
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  onClick={(e) => handleLink(e, '/pricing')}
                  className="hover:text-white transition-colors"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Resources & Help */}
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Resources
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="/blog"
                    onClick={(e) => handleLink(e, '/blog')}
                    className="hover:text-white transition-colors"
                  >
                    Artlist Blog
                  </a>
                </li>
                <li>
                  <a
                    href="/academy"
                    onClick={(e) => handleLink(e, '/academy')}
                    className="hover:text-white transition-colors"
                  >
                    Artlist Academy
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Help
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="/faq"
                    onClick={(e) => handleLink(e, '/faq')}
                    className="hover:text-white transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    onClick={(e) => handleLink(e, '/contact')}
                    className="hover:text-white transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 5: License & Terms */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              License & Terms
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="/license"
                  onClick={(e) => handleLink(e, '/license')}
                  className="hover:text-white transition-colors"
                >
                  Artlist License
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleLink(e, '/terms')}
                  className="hover:text-white transition-colors"
                >
                  Terms of Use
                </a>
              </li>
              <li>
                <a
                  href="/copyright"
                  onClick={(e) => handleLink(e, '/copyright')}
                  className="hover:text-white transition-colors"
                >
                  Copyright Policy
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => handleLink(e, '/privacy')}
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & social icons */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-gray-400">
            © 2026 <strong className="text-white font-medium">{brandName}</strong>. All Rights Reserved.
          </p>

          <div className="flex items-center gap-2">
            {/* Facebook */}
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors"
              aria-label="Facebook"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors"
              aria-label="Instagram"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>

            {/* YouTube */}
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors"
              aria-label="YouTube"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>

            {/* TikTok */}
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors"
              aria-label="TikTok"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>

            {/* Twitter / X */}
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="flex h-7 w-7 items-center justify-center rounded border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-colors"
              aria-label="Twitter"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
