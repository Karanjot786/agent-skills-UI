import { getDb } from '@/lib/db';
import { SKILLS_PER_SITEMAP } from '@/lib/skills-sql';

export const dynamic = 'force-dynamic';
const BASE = 'https://www.agentskills.in';

export async function GET() {
    const row = await getDb()
        .prepare('SELECT count(DISTINCT scoped_name) AS n FROM skills WHERE indexable = 1 AND scoped_name IS NOT NULL')
        .first<{ n: number }>();
    const files = [`${BASE}/sitemap.xml`,
        ...Array.from({ length: Math.ceil((row?.n ?? 0) / SKILLS_PER_SITEMAP) }, (_, i) => `${BASE}/sitemap-skills/${i}.xml`)];
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.map((f) => `  <sitemap><loc>${f}</loc></sitemap>`).join('\n')}\n</sitemapindex>`;
    return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400' } });
}
