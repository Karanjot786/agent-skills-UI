import { getDb } from './db';
import { itemPath, typeFromSegment } from './items-sql';
import { absoluteUrl } from './site';

const PER_FILE = 45_000;
const XML = { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400' };
const notFound = () => new Response('Not found', { status: 404 });
const urlset = (urls: string[]) => new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`, { headers: XML });

// Keyset page; start_key precomputed into sitemap_pages by the ingestion jobs (no OFFSET/count on request).
export async function itemSitemapResponse(seg: 'mcp' | 'agents' | 'plugins' | 'tools', file: string): Promise<Response> {
    const m = /^(\d{1,3})\.xml$/.exec(file);
    if (!m) return notFound();
    const db = getDb();
    const page = await db.prepare('SELECT start_key FROM sitemap_pages WHERE name = ?').bind(`${seg}-${Number(m[1])}`).first<{ start_key: string }>();
    if (!page) return notFound();
    if (seg === 'tools') {
        const { results } = await db.prepare(
            'SELECT id FROM tools WHERE id >= ? AND EXISTS (SELECT 1 FROM item_tools it WHERE it.tool_id = tools.id) ORDER BY id LIMIT ?',
        ).bind(page.start_key, PER_FILE).all<{ id: string }>();
        return urlset(results.map((r) => `  <url><loc>${absoluteUrl(`/tools/${r.id}`)}</loc></url>`));
    }
    const type = typeFromSegment(seg)!;
    const { results } = await db.prepare('SELECT slug, updated_at FROM items WHERE type = ? AND indexable = 1 AND slug >= ? ORDER BY slug LIMIT ?')
        .bind(type, page.start_key, PER_FILE).all<{ slug: string; updated_at: string | null }>();
    return urlset(results.map((r) => `  <url><loc>${absoluteUrl(itemPath(type, r.slug))}</loc>${r.updated_at ? `<lastmod>${r.updated_at.slice(0, 10)}</lastmod>` : ''}</url>`));
}
