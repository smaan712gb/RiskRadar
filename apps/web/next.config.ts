import type { NextConfig } from 'next';

const API_URL = process.env['API_INTERNAL_URL'] ?? 'https://riskradar-api-680928579719.us-central1.run.app';

const nextConfig: NextConfig = {
  transpilePackages: ['@riskradar/shared'],
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  async rewrites() {
    return [
      {
        // Proxy all /api/v1/* requests to the Fastify backend
        source: '/api/v1/:path*',
        destination: `${API_URL}/api/v1/:path*`,
      },
      {
        // Proxy Swagger docs
        source: '/docs',
        destination: `${API_URL}/docs`,
      },
      {
        source: '/docs/:path*',
        destination: `${API_URL}/docs/:path*`,
      },
    ];
  },
};

export default nextConfig;
