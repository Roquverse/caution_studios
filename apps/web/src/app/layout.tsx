import type { Metadata } from 'next';
import './globals.css';
import { AudioProvider } from '../components/audio/AudioProvider';
import { MiniPlayer } from '../components/audio/MiniPlayer';

export const metadata: Metadata = {
  title: 'Caution Studio | Beat Streaming & Licensing Marketplace',
  description:
    'Original beats from independent producers. Preview every track, lease it or buy exclusively, and get your files and a signed license the moment you pay.',
  keywords: [
    'beat marketplace',
    'buy beats',
    'lease beats',
    'afrobeats',
    'exclusive beat license',
    'music producer marketplace',
    'caution studio'
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
      <body className="min-h-screen bg-bg text-text selection:bg-accent selection:text-text antialiased">
        <AudioProvider>
          {children}
          <MiniPlayer />
        </AudioProvider>
      </body>
    </html>
  );
}
