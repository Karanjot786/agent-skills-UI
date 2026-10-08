import { getDb } from '@/lib/db';
import { SKILLS_PER_SITEMAP } from '@/lib/skills-sql';

export const dynamic = 'force-dynamic';
const BASE = 'https://www.agentskills.in';

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
    const m = /^(\d{1,3})\.xml$/.exec((await params).file);
    if (!m) return new Response('Not found', { status: 404 });
    // ponytail: OFFSET over the (indexable, scoped_name) index; fine for ~4 files fetched rarely. Keyset if files grow past ~20.
    const { results } = await getDb()
        .prepare(`SELECT scoped_name, max(updated_at) AS updated_at FROM skills
            WHERE indexable = 1 AND scoped_name IS NOT NULL GROUP BY scoped_name ORDER BY scoped_name LIMIT ? OFFSET ?`)
        .bind(SKILLS_PER_SITEMAP, Number(m[1]) * SKILLS_PER_SITEMAP)
        .all<{ scoped_name: string; updated_at: string | null }>();
    if (!results.length) return new Response('Not found', { status: 404 });
    const urls = results.map((r) => {
        const loc = `${BASE}/marketplace/${r.scoped_name.split('/').map(encodeURIComponent).join('/')}`;
        return `  <url><loc>${loc}</loc>${r.updated_at ? `<lastmod>${r.updated_at.slice(0, 10)}</lastmod>` : ''}</url>`;
    });
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400' } });
}
