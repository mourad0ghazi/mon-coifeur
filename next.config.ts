import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  allowedDevOrigins: ['*.e2b.app'],
};
export default nextConfig;
