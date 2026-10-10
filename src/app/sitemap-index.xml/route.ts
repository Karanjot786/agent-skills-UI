import { getDb } from '@/lib/db';
import { absoluteUrl } from '@/lib/site';
import { indexXml } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';

// sitemap_pages.name -> URL path. Section E extends this for mcp/agents/plugins families, D for locale skill files.
const sitemapPath = (name: string) => {
    const item = /^(mcp|agents|plugins|tools)-(\d+)$/.exec(name);
    if (item) return `/sitemap-${item[1]}/${item[2]}.xml`;
    return name === 'pages' ? '/sitemap.xml' : name === 'structure' ? '/sitemap-structure.xml' : name.startsWith('skills-') ? `/sitemap-skills/${name.slice('skills-'.length)}.xml` : null;
};

export async function GET() {
    const { results } = await getDb().prepare('SELECT name, lastmod FROM sitemap_pages ORDER BY name').all<{ name: string; lastmod: string }>();
    const entries = results.flatMap((r) => { const p = sitemapPath(r.name); return p ? [{ loc: absoluteUrl(p), lastmod: r.lastmod }] : []; });
    return new Response(indexXml(entries), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400' } });
}
