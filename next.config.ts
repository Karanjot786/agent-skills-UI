import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: '/sitemap/:locale/:type/:value/:chunk.xml',
        destination: '/sitemap/:locale---:type---:value---:chunk.xml',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/llms.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' },
        ],
      },
      {
        source: '/llms-full.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=86400' },
        ],
      },
      // Skill detail pages — CDN caches for 24h, serves stale for 7 days while revalidating
      {
        source: '/:locale/marketplace/:path+',
        headers: [
          { key: 'Vercel-CDN-Cache-Control', value: 's-maxage=86400, stale-while-revalidate=604800' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      // Marketplace listing — 1hr CDN cache
      {
        source: '/:locale/marketplace',
        headers: [
          { key: 'Vercel-CDN-Cache-Control', value: 's-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      // Home page — 1hr CDN cache
      {
        source: '/:locale',
        headers: [
          { key: 'Vercel-CDN-Cache-Control', value: 's-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
