import { getDb } from '@/lib/db';
import { INDEXABLE_SITEMAP_WHERE, SKILLS_PER_SITEMAP } from '@/lib/skills-sql';
import { skillEntries, urlsetXml } from '@/lib/sitemap';
import { localeUrlsetXml, type LocaleSitemapRow } from '@/lib/sitemap-i18n';
import { SITE_URL } from '@/lib/site';
import { locales, defaultLocale, sitemapLocales } from '@/i18n/config';

export const dynamic = 'force-dynamic';
const XML = { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400' };
const notFound = () => new Response('Not found', { status: 404 });

// File boundaries live in sitemap_pages (scripts/jobs/refresh-derived.mjs): keyset read, no DISTINCT/OFFSET on the request path.
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
    const file = (await params).file;
    const db = getDb();

    // Translated locales: <locale>-<n>.xml, only after native review (sitemapLocales, D12), only rows with a translation.
    const lm = /^([A-Za-z]{2}(?:-[A-Za-z]{2})?)-(\d{1,3})\.xml$/.exec(file);
    if (lm && lm[1] !== defaultLocale) {
        if (!(sitemapLocales as readonly string[]).includes(lm[1])) return notFound();
        // ponytail: OFFSET over the (locale, skill_seq) index; translated rows are <= ~25K per locale. Keyset if a locale passes one file.
        const { results } = await db.prepare(`
            SELECT s.scoped_name, s.updated_at,
                   (SELECT group_concat(x.locale) FROM skill_i18n x WHERE x.skill_seq = s.seq) AS locales
            FROM skill_i18n i JOIN skills s ON s.seq = i.skill_seq
            WHERE i.locale = ? AND ${INDEXABLE_SITEMAP_WHERE.replace(/(indexable|scoped_name)/g, 's.$1')}
            ORDER BY i.skill_seq LIMIT ? OFFSET ?`)
            .bind(lm[1], SKILLS_PER_SITEMAP, Number(lm[2]) * SKILLS_PER_SITEMAP).all<LocaleSitemapRow>();
        if (!results.length) return notFound();
        return new Response(localeUrlsetXml(lm[1], results, { base: SITE_URL, defaultLocale, order: locales }), { headers: XML });
    }

    const m = /^(en)-(\d{1,3})\.xml$/.exec(file);
    if (!m) return notFound();
    const page = await db.prepare('SELECT start_key, url_count FROM sitemap_pages WHERE name = ?')
        .bind(`skills-${m[1]}-${Number(m[2])}`).first<{ start_key: string; url_count: number }>();
    if (!page) return notFound();
    const { results } = await db
        .prepare(`SELECT scoped_name, updated_at FROM skills WHERE ${INDEXABLE_SITEMAP_WHERE} AND scoped_name > ? ORDER BY scoped_name LIMIT ?`)
        .bind(page.start_key, page.url_count)
        .all<{ scoped_name: string; updated_at: string | null }>();
    return new Response(urlsetXml(skillEntries(results)), { headers: XML });
}
