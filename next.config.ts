import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import { locales, defaultLocale } from './src/i18n/config';

// Prefixed locales only: a bare `:locale` would also match single-segment files like /advisories.json or /llms.txt.
const L = `:locale(${locales.filter((l) => l !== defaultLocale).join('|')})`;

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
        source: `/${L}/marketplace/:path+`,
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/marketplace/:path+',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=86400, stale-while-revalidate=604800' }],
      },
      // Home, marketplace listing and other per-request list pages — 1h CDN cache
      ...['/', '/marketplace', '/categories', '/tools', `/${L}`, `/${L}/marketplace`].map((source) => ({
        source,
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' }],
      })),
    ];
  },
  // Middleware passes .md paths through, so rewrite <skill-url>.md to the markdown route here.
  async rewrites() {
    return { beforeFiles: [{ source: '/marketplace/:owner/:name.md', destination: '/api/md/:owner/:name' }] };
  },
};

export default withNextIntl(nextConfig);

// Lets `next dev` reach Cloudflare bindings (D1, R2) via getCloudflareContext(); no-op in production builds.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
