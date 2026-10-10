// Pure helpers for crawlable list pages. No imports so `node --test` can run them.
// Skill URLs come from skillPath() in site.ts and sitemap XML from urlsetXml() in sitemap.ts (one encoded form everywhere).
export const PAGE_SIZE = 48;
// ponytail: OFFSET <= 4,752 rows. Deeper skills are reached through categories/authors. Upgrade: keyset links.
export const MAX_PAGE = 100;
export const AUTHOR_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

export function parsePage(raw: string | undefined): number | null {
  if (raw === undefined) return 1;
  if (!/^[1-9]\d{0,2}$/.test(raw)) return null;
  const n = Number(raw);
  return n <= MAX_PAGE ? n : null;
}

export const pageCount = (total: number) => Math.min(MAX_PAGE, Math.max(1, Math.ceil(total / PAGE_SIZE)));
export const pageHref = (base: string, n: number) => (n <= 1 ? base : `${base}/page/${n}`);

// Neighbours + first three + every 10th + last: any page is <= ~10 clicks from page 1.
export function pageWindow(page: number, pages: number): number[] {
  const s = new Set<number>([1, 2, 3, page - 1, page, page + 1, pages]);
  for (let n = 10; n <= pages; n += 10) s.add(n);
  return [...s].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
}

export function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(' '), max / 2)).trimEnd() + '…';
}

export interface ListEntry { name: string; path: string }
export function collectionJsonLd(o: {
  base: string; name: string; description: string; path: string;
  crumbs: { name: string; path: string }[]; items: ListEntry[]; start: number; extra?: Record<string, unknown>;
}) {
  const abs = (p: string) => o.base + p;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage', name: o.name, description: o.description, url: abs(o.path), ...o.extra,
        mainEntity: {
          '@type': 'ItemList', numberOfItems: o.items.length,
          itemListOrder: 'https://schema.org/ItemListOrderDescending',
          itemListElement: o.items.map((it, i) => ({ '@type': 'ListItem', position: o.start + i, name: it.name, url: abs(it.path) })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: o.crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
      },
    ],
  };
}

export const jsonLdString = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c');
