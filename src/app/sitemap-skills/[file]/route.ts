import { getDb } from '@/lib/db';
import { INDEXABLE_SITEMAP_WHERE } from '@/lib/skills-sql';
import { skillEntries, urlsetXml } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';
const XML = { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400' };

// File boundaries live in sitemap_pages (scripts/jobs/refresh-derived.mjs): keyset read, no DISTINCT/OFFSET on the request path.
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
    const m = /^(en)-(\d{1,3})\.xml$/.exec((await params).file);
    if (!m) return new Response('Not found', { status: 404 });
    const db = getDb();
    const page = await db.prepare('SELECT start_key, url_count FROM sitemap_pages WHERE name = ?')
        .bind(`skills-${m[1]}-${Number(m[2])}`).first<{ start_key: string; url_count: number }>();
    if (!page) return new Response('Not found', { status: 404 });
    const { results } = await db
        .prepare(`SELECT scoped_name, updated_at FROM skills WHERE ${INDEXABLE_SITEMAP_WHERE} AND scoped_name > ? ORDER BY scoped_name LIMIT ?`)
        .bind(page.start_key, page.url_count)
        .all<{ scoped_name: string; updated_at: string | null }>();
    return new Response(urlsetXml(skillEntries(results)), { headers: XML });
}
