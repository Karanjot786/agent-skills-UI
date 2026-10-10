import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// ponytail: one group for every crawler. Named groups REPLACE the '*' group (RFC 9309), which is how
// 'Disallow: /api/' leaked for Googlebot/GPTBot before. AI-bot load is controlled at the Cloudflare edge, not here.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [{ userAgent: '*', allow: ['/', '/api/og', '/_next/static/'], disallow: ['/api/'] }],
        sitemap: `${SITE_URL}/sitemap-index.xml`,
    };
}
