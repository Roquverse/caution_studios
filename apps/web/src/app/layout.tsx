import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Music Website | Royalty Free Music for Video Creators',
  description:
    'Download high-quality, royalty-free music and sound effects for YouTube, TikTok, commercial videos, games, and films.',
  keywords: [
    'royalty free music',
    'youtube music licensing',
    'background music',
    'sound effects',
    'commercial music license'
  ]
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white text-slate-900 selection:bg-[#1E50FF] selection:text-white">
        {children}
      </body>
    </html>
  );
}
