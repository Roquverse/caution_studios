/** @type {import('next').NextConfig} */
const authUrl =
  process.env.NEXT_PUBLIC_AUTH_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://auth.cautionstudioz.com');
const appUrl =
  process.env.NEXT_PUBLIC_USER_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3002' : 'https://app.cautionstudioz.com');

const nextConfig = {
  transpilePackages: ['@caution/ui', '@caution/types', '@caution/tailwind-config'],
  images: {
    unoptimized: true
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' }
        ]
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: appUrl,
        permanent: false
      },
      {
        source: '/user',
        destination: appUrl,
        permanent: false
      },
      {
        source: '/login',
        destination: `${authUrl}/login`,
        permanent: false
      },
      {
        source: '/signin',
        destination: `${authUrl}/login`,
        permanent: false
      },
      {
        source: '/sign-in',
        destination: `${authUrl}/login`,
        permanent: false
      },
      {
        source: '/signup',
        destination: `${authUrl}/register`,
        permanent: false
      },
      {
        source: '/sign-up',
        destination: `${authUrl}/register`,
        permanent: false
      },
      {
        source: '/register',
        destination: `${authUrl}/register`,
        permanent: false
      }
    ];
  }
};

export default nextConfig;
