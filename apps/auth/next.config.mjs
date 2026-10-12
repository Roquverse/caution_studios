/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@caution/ui', '@caution/types', '@caution/tailwind-config'],
  images: {
    unoptimized: true
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
