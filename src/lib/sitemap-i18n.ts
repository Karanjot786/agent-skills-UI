// Pure builder for per-locale skill sitemaps (spec 4.4/6.3).
import { skillPath } from './site.ts';

export interface LocaleSitemapRow { scoped_name: string; updated_at: string | null; locales: string | null }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** `rows[].locales` = comma list of every locale that has a translation row for that skill (includes `locale`). */
export function localeUrlsetXml(locale: string, rows: LocaleSitemapRow[], opts: { base: string; defaultLocale: string; order: readonly string[] }): string {
    const url = (loc: string, scoped: string) => `${opts.base}${loc === opts.defaultLocale ? '' : `/${loc}`}${skillPath(scoped)}`;
    const body = rows.map((r) => {
        const have = new Set((r.locales ?? locale).split(','));
        have.add(locale);
        const alts = opts.order.filter((l) => l === opts.defaultLocale || have.has(l));
        const links = [...alts.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(url(l, r.scoped_name))}"/>`),
            `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(url(opts.defaultLocale, r.scoped_name))}"/>`];
        const lastmod = r.updated_at && /^\d{4}-\d\d-\d\d/.test(r.updated_at) ? `<lastmod>${r.updated_at.slice(0, 10)}</lastmod>` : '';
        return `  <url><loc>${esc(url(locale, r.scoped_name))}</loc>${lastmod}${links.join('')}</url>`;
    });
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body.join('\n')}\n</urlset>`;
}
