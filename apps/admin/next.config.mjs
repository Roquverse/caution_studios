/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@caution/ui', '@caution/types', '@caution/tailwind-config'],
  images: {
    unoptimized: true
  }
};

export default nextConfig;
