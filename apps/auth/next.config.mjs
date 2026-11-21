/** @type {import('next').NextConfig} */
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
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
        ]
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/signup',
        destination: '/register',
        permanent: false
      },
      {
        source: '/sign-up',
        destination: '/register',
        permanent: false
      },
      {
        source: '/signin',
        destination: '/login',
        permanent: false
      },
      {
        source: '/sign-in',
        destination: '/login',
        permanent: false
      }
    ];
  }
};

export default nextConfig;
