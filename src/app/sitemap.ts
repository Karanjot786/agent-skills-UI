import { createClient } from '@supabase/supabase-js';
import { MetadataRoute } from 'next';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

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
    ];

    // Dynamic skill pages from database
    let skillPages: MetadataRoute.Sitemap = [];

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch all skill scoped names (paginated for large datasets)
        const { data: skills, error } = await supabase
            .from('skills')
            .select('scoped_name, updated_at')
            .order('stars', { ascending: false })
            .limit(10000); // Top 10k most popular skills for sitemap

        if (!error && skills) {
            skillPages = skills.map((skill) => ({
                url: `${baseUrl}/marketplace/${encodeURIComponent(skill.scoped_name)}`,
                lastModified: skill.updated_at ? new Date(skill.updated_at) : new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            }));
        }
    } catch (error) {
        console.error('Error fetching skills for sitemap:', error);
    }

    return [...staticPages, ...skillPages];
}
