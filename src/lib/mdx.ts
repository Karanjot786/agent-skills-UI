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

const CONTENT_DIR = path.join(process.cwd(), 'content', 'docs');

// ── Functions ────────────────────────────────────────────────────────────

/**
 * Get all doc sections, sorted by order.
 */
export function getAllDocSections(): DocSection[] {
    if (!fs.existsSync(CONTENT_DIR)) return [];

    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.mdx'));

    return files
        .map(file => {
            const slug = file.replace('.mdx', '');
            const filePath = path.join(CONTENT_DIR, file);
            const raw = fs.readFileSync(filePath, 'utf-8');
            const { data, content } = matter(raw);

            return {
                slug,
                title: data.title || slug,
                order: data.order || 0,
                icon: data.icon || 'terminal',
                description: data.description || '',
                commands: data.commands || [],
                content,
            };
        })
        .sort((a, b) => a.order - b.order);
}

/**
 * Get metadata for all doc sections (without content, for sidebar/index).
 */
export function getAllDocSectionsMeta(): DocSectionMeta[] {
    if (!fs.existsSync(CONTENT_DIR)) return [];

    const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.mdx'));

    return files
        .map(file => {
            const slug = file.replace('.mdx', '');
            const filePath = path.join(CONTENT_DIR, file);
            const raw = fs.readFileSync(filePath, 'utf-8');
            const { data } = matter(raw);

            return {
                slug,
                title: data.title || slug,
                order: data.order || 0,
                icon: data.icon || 'terminal',
                description: data.description || '',
                commands: data.commands || [],
            };
        })
        .sort((a, b) => a.order - b.order);
}

/**
 * Get all doc slugs (for generateStaticParams).
 */
export function getAllDocSlugs(): string[] {
    if (!fs.existsSync(CONTENT_DIR)) return [];
    return fs.readdirSync(CONTENT_DIR)
        .filter(f => f.endsWith('.mdx'))
        .map(f => f.replace('.mdx', ''));
}

/**
 * Get a single doc section by slug.
 */
export function getDocSection(slug: string): DocSection | null {
    const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);

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

/**
 * Get prev/next sections for navigation.
 */
export function getAdjacentSections(slug: string): { prev: DocSectionMeta | null; next: DocSectionMeta | null } {
    const allMeta = getAllDocSectionsMeta();
    const index = allMeta.findIndex(s => s.slug === slug);
    
    return {
        prev: index > 0 ? allMeta[index - 1] : null,
        next: index < allMeta.length - 1 ? allMeta[index + 1] : null,
    };
}

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
