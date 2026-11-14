/**
 * MDX Utilities — Server-side MDX processing
 *
 * Serves the docs index generated from content/docs/ at build time
 * (scripts/gen-docs-index.mjs) and extracts heading structure for sidebar generation.
 * Nothing here touches the filesystem: Cloudflare Workers have none at runtime.
 */

import index from '../generated/docs-index.json'; // written by scripts/gen-docs-index.mjs before every build

// ── Types ────────────────────────────────────────────────────────────────

export interface DocSection {
    slug: string;
    title: string;
    order: number;
    icon: string;
    description: string;
    commands: string[];
    content: string;
}

export interface DocSectionMeta {
    slug: string;
    title: string;
    order: number;
    icon: string;
    description: string;
    commands: string[];
}

export interface TOCItem {
    id: string;
    text: string;
    level: number;
}

export interface FaqData {
    hero: { badge: string; title: string; subtitle: string };
    cta: { title: string; body: string; docs: string; issue: string };
    categories: { title: string; icon: string; questions: { question: string; answer: string }[] }[];
}

// ── Data ─────────────────────────────────────────────────────────────────

// English at content/docs/*.mdx; translations at content/docs/<locale>/<slug>.mdx (+ faq.json).
type Index = { slugs: string[]; docs: Record<string, Record<string, DocSection>>; faq: Record<string, FaqData> };
const IDX = index as unknown as Index;

// ── Functions ────────────────────────────────────────────────────────────

/** Translated section if present, otherwise the English one (spec 6.3: en fallback). */
function read(slug: string, locale?: string): DocSection | null {
    return (locale && locale !== 'en' ? IDX.docs[locale]?.[slug] : undefined) ?? IDX.docs.en[slug] ?? null;
}

/** Get all doc sections for a locale (en fallback per file), sorted by order. */
export function getAllDocSections(locale?: string): DocSection[] {
    return getAllDocSlugs().map((s) => read(s, locale)!).sort((a, b) => a.order - b.order);
}

/** Metadata for all doc sections (without content, for sidebar/index). */
export function getAllDocSectionsMeta(locale?: string): DocSectionMeta[] {
    return getAllDocSections(locale).map(({ content: _content, ...meta }) => meta);
}

/** All English doc slugs (for generateStaticParams). */
export function getAllDocSlugs(): string[] {
    return IDX.slugs;
}

/** Get a single doc section by slug. */
export function getDocSection(slug: string, locale?: string): DocSection | null {
    return read(slug, locale);
}

/** Get prev/next sections for navigation. */
export function getAdjacentSections(slug: string, locale?: string): { prev: DocSectionMeta | null; next: DocSectionMeta | null } {
    const allMeta = getAllDocSectionsMeta(locale);
    const index = allMeta.findIndex((s) => s.slug === slug);
    return {
        prev: index > 0 ? allMeta[index - 1] : null,
        next: index >= 0 && index < allMeta.length - 1 ? allMeta[index + 1] : null,
    };
}

/** Locales that have a translated file for this doc (always includes en). Feeds hreflang and sitemaps. */
export function docLocales(slug: string): string[] {
    return ['en', ...Object.keys(IDX.docs).filter((l) => l !== 'en' && IDX.docs[l][slug])];
}

/** FAQ strings for a locale; icons always come from the English file, so translated files may omit them. */
export function getFaq(locale: string): FaqData {
    const en = IDX.faq.en;
    const t = IDX.faq[locale];
    if (locale === 'en' || !t) return en;
    return { ...t, categories: t.categories.map((c: FaqData['categories'][number], i: number) => ({ ...c, icon: en.categories[i]?.icon ?? c.icon })) };
}

export const faqLocales = (): string[] => ['en', ...Object.keys(IDX.faq).filter((l) => l !== 'en')];

/**
 * Extract heading structure for TOC generation.
 */
export function extractTOC(markdown: string): TOCItem[] {
    const headingRegex = /^(#{1,4})\s+(.+)$/gm;
    const items: TOCItem[] = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
        const level = match[1].length;
        const text = match[2].replace(/`/g, '').trim();
        const id = text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-');

        items.push({ id, text, level });
    }

    return items;
}
