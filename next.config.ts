import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  poweredByHeader: false,
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
      // Skill/item pages: CDN 24h, stale 7d while revalidating. Plain Cache-Control: Cloudflare ignores Vercel-CDN-Cache-Control.
      {
        source: '/:locale/marketplace/:path+',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' }],
      },
      // Marketplace listing and home — 1h CDN cache
      ...['/', '/:locale/marketplace', '/:locale'].map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' }],
      })),
    ];
  },
  // Middleware skips dotted paths, so rewrite <skill-url>.md to the markdown route here.
  async rewrites() {
    return { beforeFiles: [{ source: '/marketplace/:owner/:name.md', destination: '/api/md/:owner/:name' }] };
  },
};

export default withNextIntl(nextConfig);

// Lets `next dev` reach Cloudflare bindings (D1, R2) via getCloudflareContext(); no-op in production builds.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
