import prisma from '@/lib/db';
import { MetadataRoute } from 'next';
import { locales, defaultLocale, type Locale } from '@/i18n/config';

// Constants
const BASE_URL = 'https://agentskills.in';
const CHUNK_SIZE = 5000;

// Helper to generate localized paths
const getUrl = (path: string, locale: Locale) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    if (locale === defaultLocale) {
        return `${BASE_URL}${cleanPath}`;
    }
    return `${BASE_URL}/${locale}${cleanPath}`;
};

// Helper to generate alternates for a path
const getAlternates = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const languages: Record<string, string> = {};

    locales.forEach(loc => {
        if (loc === defaultLocale) {
            languages[loc] = `${BASE_URL}${cleanPath}`;
        } else {
            languages[loc] = `${BASE_URL}/${loc}${cleanPath}`;
        }
    });

    return {
        languages,
    };
};

// ID structure: locale---type---value---chunk
// Types: 'static', 'category', 'misc'
interface SitemapId {
    locale: Locale;
    type: 'static' | 'category' | 'misc';
    value: string; // categoryId or 'static'/'misc'
    chunk: number;
}

export async function generateSitemaps(): Promise<{ id: string }[]> {
    console.log('Generating sitemaps IDs...');
    const sitemaps: { id: string }[] = [];

    // 1. Static Pages (Home, Docs, etc.) - One per locale
    for (const locale of locales) {
        sitemaps.push({ id: `${locale}---static---base---0` });
    }

    // 2. Categories
    try {
        const categories = await prisma.categories.findMany({
            select: { id: true }
        });

        for (const cat of categories) {
            const count = await prisma.skills.count({
                where: { category: cat.id }
            });
            const chunks = Math.ceil(count / CHUNK_SIZE);
            if (count > 0) {
                for (const locale of locales) {
                    for (let i = 0; i < chunks; i++) {
                        sitemaps.push({ id: `${locale}---category---${cat.id}---${i}` });
                    }
                }
            }
        }

        // 3. Misc (Uncategorized)
        const miscCount = await prisma.skills.count({
            where: { category: null }
        });
        if (miscCount > 0) {
            const miscChunks = Math.ceil(miscCount / CHUNK_SIZE);
            for (const locale of locales) {
                for (let i = 0; i < miscChunks; i++) {
                    sitemaps.push({ id: `${locale}---misc---uncategorized---${i}` });
                }
            }
        }

    } catch (error) {
        console.error('Error generating sitemap IDs:', error);
    }

    console.log(`Generated ${sitemaps.length} sitemap IDs.`);
    return sitemaps;
}

export default async function sitemap(props: { id: string | Promise<string> }): Promise<MetadataRoute.Sitemap> {
    const id = await props.id;
    console.log(`Generating sitemap for ID: ${id}`);

    if (!id || typeof id !== 'string') {
        console.error(`Invalid sitemap ID format: ${id} (type: ${typeof id})`);
        return [];
    }

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // Parse ID
    const parts = id.split('---');
    if (parts.length !== 4) {
        console.error(`Invalid sitemap ID structure: ${id}`);
        return [];
    }

    const [localeStr, type, value, chunkStr] = parts;
    const locale = localeStr as Locale;
    const chunk = parseInt(chunkStr, 10);
    const skip = chunk * CHUNK_SIZE;

    // Handle Static Pages
    if (type === 'static') {
        const routes = [
            '',
            '/docs',
            '/marketplace',
            '/faq',
            '/stats'
        ];

        routes.forEach(route => {
            sitemapEntries.push({
                url: getUrl(route, locale),
                lastModified: new Date(),
                changeFrequency: route === '' ? 'daily' : route === '/marketplace' ? 'daily' : 'weekly',
                priority: route === '' ? 1.0 : route === '/marketplace' ? 0.9 : 0.7,
                alternates: getAlternates(route)
            });
        });
        return sitemapEntries;
    }

    // Handle Dynamic Skills (Category or Misc)
    try {
        let whereClause: any = {};

        if (type === 'category') {
            whereClause = { category: value };
        } else if (type === 'misc') {
            whereClause = { category: null };
        }

        const skills = await prisma.skills.findMany({
            where: whereClause,
            select: { scoped_name: true, updated_at: true },
            orderBy: { stars: 'desc' },
            skip: skip,
            take: CHUNK_SIZE,
        });

        skills
            .filter(skill => skill.scoped_name)
            .forEach(skill => {
                const skillPath = `/marketplace/${skill.scoped_name}`;

                sitemapEntries.push({
                    url: getUrl(skillPath, locale),
                    lastModified: skill.updated_at ? new Date(skill.updated_at) : new Date(),
                    changeFrequency: 'weekly',
                    priority: 0.7,
                    alternates: getAlternates(skillPath)
                });
            });

    } catch (error) {
        console.error(`Error generating sitemap for ${id}:`, error);
    }

    return sitemapEntries;
}
