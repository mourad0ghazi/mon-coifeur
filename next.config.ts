import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  allowedDevOrigins: [
    '*.e2b.app',
    '3000-' + (process.env.BASE44_PUBLIC_HOST_SUFFIX || ''),
  ].filter(Boolean),
};
export default nextConfig;
