import prisma from '@/lib/db';
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://agentskills.in';

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/docs`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/marketplace`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        },
        {
            url: `${baseUrl}/faq`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/stats`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.6,
        },
    ];

    // Dynamic skill pages from database
    let skillPages: MetadataRoute.Sitemap = [];

    try {
        // Fetch all skill scoped names (paginated for large datasets)
        const skills = await prisma.skills.findMany({
            select: { scoped_name: true, updated_at: true },
            orderBy: { stars: 'desc' },
            take: 10000, // Top 10k most popular skills for sitemap
        });

        skillPages = skills
            .filter(skill => skill.scoped_name) // Only include skills with scoped_name
            .map((skill) => ({
                url: `${baseUrl}/marketplace/${encodeURIComponent(skill.scoped_name!)}`,
                lastModified: skill.updated_at ? new Date(skill.updated_at) : new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            }));
    } catch (error) {
        console.error('Error fetching skills for sitemap:', error);
    }

    return [...staticPages, ...skillPages];
}
