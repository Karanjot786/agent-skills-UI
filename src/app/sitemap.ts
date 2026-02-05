import prisma from '@/lib/db';
import { MetadataRoute } from 'next';
import { locales, defaultLocale, type Locale } from '@/i18n/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://agentskills.in';

    // Helper to generate localized paths
    const getUrl = (path: string, locale: Locale) => {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        if (locale === defaultLocale) {
            return `${baseUrl}${cleanPath}`;
        }
        return `${baseUrl}/${locale}${cleanPath}`;
    };

    // Helper to generate alternates for a path
    const getAlternates = (path: string) => {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        const languages: Record<string, string> = {};

        locales.forEach(loc => {
            if (loc === defaultLocale) {
                languages[loc] = `${baseUrl}${cleanPath}`;
            } else {
                languages[loc] = `${baseUrl}/${loc}${cleanPath}`;
            }
        });

        return {
            languages,
        };
    };

    const routes = [
        '',
        '/docs',
        '/marketplace',
        '/faq',
        '/stats'
    ];

    const sitemapEntries: MetadataRoute.Sitemap = [];

    // Generate entries for static pages
    routes.forEach(route => {
        locales.forEach(locale => {
            sitemapEntries.push({
                url: getUrl(route, locale),
                lastModified: new Date(),
                changeFrequency: route === '' ? 'daily' : route === '/marketplace' ? 'daily' : 'weekly',
                priority: route === '' ? 1.0 : route === '/marketplace' ? 0.9 : 0.7,
                alternates: getAlternates(route)
            });
        });
    });

    try {
        // Fetch top skills for sitemap
        const skills = await prisma.skills.findMany({
            select: { scoped_name: true, updated_at: true },
            orderBy: { stars: 'desc' },
            take: 10000,
        });

        // Add dynamic skill pages
        skills
            .filter(skill => skill.scoped_name)
            .forEach(skill => {
                const skillPath = `/marketplace/${encodeURIComponent(skill.scoped_name!)}`;

                locales.forEach(locale => {
                    sitemapEntries.push({
                        url: getUrl(skillPath, locale),
                        lastModified: skill.updated_at ? new Date(skill.updated_at) : new Date(),
                        changeFrequency: 'weekly',
                        priority: 0.7,
                        alternates: getAlternates(skillPath)
                    });
                });
            });

    } catch (error) {
        console.error('Error fetching skills for sitemap:', error);
    }

    return sitemapEntries;
}
