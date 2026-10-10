/**
 * MDX Utilities — Server-side MDX processing
 * 
 * Reads .mdx files from content/docs/, serializes them,
 * and extracts heading structure for sidebar generation.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

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

// ── Paths ────────────────────────────────────────────────────────────────

// English at content/docs/*.mdx; translations at content/docs/<locale>/<slug>.mdx (+ faq.json).
const ROOT = path.join(process.cwd(), 'content', 'docs');

// ── Functions ────────────────────────────────────────────────────────────

/** Translated file if present, otherwise the English file (spec 6.3: en fallback). */
function fileFor(slug: string, locale?: string): string | null {
    if (locale && locale !== 'en') {
        const p = path.join(ROOT, locale, `${slug}.mdx`);
        if (fs.existsSync(p)) return p;
    }
    const en = path.join(ROOT, `${slug}.mdx`);
    return fs.existsSync(en) ? en : null;
}

function read(slug: string, locale?: string): DocSection | null {
    const file = fileFor(slug, locale);
    if (!file) return null;
    const { data, content } = matter(fs.readFileSync(file, 'utf-8'));
    return {
        slug,
        title: data.title || slug,
        order: data.order || 0,
        icon: data.icon || 'terminal',
        description: data.description || '',
        commands: data.commands || [],
        content,
    };
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
    return fs.existsSync(ROOT) ? fs.readdirSync(ROOT).filter((f) => f.endsWith('.mdx')).map((f) => f.slice(0, -4)) : [];
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

const localeDirs = () =>
    fs.existsSync(ROOT) ? fs.readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : [];

/** Locales that have a translated file for this doc (always includes en). Feeds hreflang and sitemaps. */
export function docLocales(slug: string): string[] {
    return ['en', ...localeDirs().filter((l) => fs.existsSync(path.join(ROOT, l, `${slug}.mdx`)))];
}

export interface FaqData {
    hero: { badge: string; title: string; subtitle: string };
    cta: { title: string; body: string; docs: string; issue: string };
    categories: { title: string; icon: string; questions: { question: string; answer: string }[] }[];
}

/** FAQ strings for a locale; icons always come from the English file, so translated files may omit them. */
export function getFaq(locale: string): FaqData {
    const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'faq.json'), 'utf-8'));
    const p = path.join(ROOT, locale, 'faq.json');
    if (locale === 'en' || !fs.existsSync(p)) return en;
    const t = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return { ...t, categories: t.categories.map((c: FaqData['categories'][number], i: number) => ({ ...c, icon: en.categories[i]?.icon ?? c.icon })) };
}

export const faqLocales = (): string[] => ['en', ...localeDirs().filter((l) => fs.existsSync(path.join(ROOT, l, 'faq.json')))];

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
