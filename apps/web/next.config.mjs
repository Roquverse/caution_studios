/** @type {import('next').NextConfig} */
const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'https://auth.cautionstudioz.com';

const nextConfig = {
  transpilePackages: ['@caution/ui', '@caution/types', '@caution/tailwind-config'],
  images: {
    unoptimized: true
  },
  async redirects() {
    return [
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
