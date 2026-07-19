import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'prime-layers-coatings.vercel.app' }],
        destination: 'https://www.primelayercoating.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'primelayercoating.com' }],
        destination: 'https://www.primelayercoating.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
