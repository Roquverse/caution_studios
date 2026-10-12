import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Caution Studio Auth | Creator Sign In & Registration',
  description: 'Sign in to access your royalty-free music downloads and licenses.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#07090D] text-white selection:bg-[#04564f] selection:text-white">
        {children}
      </body>
    </html>
  );
}
