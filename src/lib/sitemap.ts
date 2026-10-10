import { absoluteUrl, skillPath } from './site.ts';

export interface Entry { loc: string; lastmod?: string }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lm = (e: Entry) => (e.lastmod ? `<lastmod>${esc(e.lastmod)}</lastmod>` : '');
const iso = (v: string | null) => (v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : undefined);

export const urlsetXml = (es: Entry[]) =>
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${es.map((e) => `  <url><loc>${esc(e.loc)}</loc>${lm(e)}</url>`).join('\n')}\n</urlset>`;

export const indexXml = (es: Entry[]) =>
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${es.map((e) => `  <sitemap><loc>${esc(e.loc)}</loc>${lm(e)}</sitemap>`).join('\n')}\n</sitemapindex>`;

// Rows arrive ordered by scoped_name, so duplicates (29K scoped_names are duplicated) are adjacent.
export function skillEntries(rows: { scoped_name: string; updated_at: string | null }[]): Entry[] {
    const out: Entry[] = [];
    let prev = '';
    for (const r of rows) {
        const lastmod = iso(r.updated_at);
        if (r.scoped_name === prev) {
            const last = out[out.length - 1];
            if (lastmod && (!last.lastmod || lastmod > last.lastmod)) last.lastmod = lastmod;
            continue;
        }
        prev = r.scoped_name;
        out.push({ loc: absoluteUrl(skillPath(r.scoped_name)), lastmod });
    }
    return out;
}
