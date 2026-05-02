import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/db';
import { rateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';
import { CACHE_TAGS } from '@/lib/revalidate';

// Time-based fallback — on-demand revalidation via revalidateTag(CACHE_TAGS.stats) takes priority
export const revalidate = 3600;

interface TopAuthor {
    name: string;
    skillCount: number;
    avatar: string;
}

interface SkillPreview {
    id: string;
    name: string;
    description: string | null;
    author: string;
    stars: number;
    scoped_name: string | null;
    author_avatar: string | null;
}

export async function GET(request: Request) {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`stats:${ip}`, RATE_LIMITS.stats);

    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: rateLimitHeaders(rateLimitResult),
            }
        );
    }

    try {
        const getStatsData = unstable_cache(
            async () => {
                const [cachedStats, trending, recent, categoryCounts] = await Promise.all([
                    prisma.skill_stats.findUnique({ where: { id: 'global' } }),
                    prisma.skills.findMany({
                        select: { id: true, name: true, description: true, author: true, stars: true, scoped_name: true, author_avatar: true },
                        orderBy: { stars: 'desc' },
                        take: 6,
                    }),
                    prisma.skills.findMany({
                        select: { id: true, name: true, description: true, author: true, stars: true, scoped_name: true, author_avatar: true },
                        orderBy: { updated_at: 'desc' },
                        take: 6,
                    }),
                    prisma.skills.groupBy({ by: ['category'], _count: { id: true } }),
                ]);
                return { cachedStats, trending, recent, categoryCounts };
            },
            ['stats-data'],
            { tags: [CACHE_TAGS.stats], revalidate: 3600 }
        );

        const { cachedStats, trending, recent, categoryCounts } = await getStatsData();

        const totalSkills = cachedStats?.total_skills ?? 50000;
        const uniqueAuthors = cachedStats?.unique_authors ?? 5000;
        const topAuthors = (cachedStats?.top_authors as unknown as TopAuthor[]) ?? [];

        const categoryMap: Record<string, number> = {};
        for (const cat of categoryCounts) {
            if (cat.category) {
                categoryMap[cat.category.toLowerCase()] = cat._count.id;
            }
        }

        return NextResponse.json({
            stats: { totalSkills, uniqueAuthors, totalStars: 0 },
            categoryCounts: categoryMap,
            trending: trending.map((s: SkillPreview) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                author: s.author,
                stars: s.stars,
                scopedName: s.scoped_name,
                authorAvatar: s.author_avatar,
            })),
            recent: recent.map((s: SkillPreview) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                author: s.author,
                stars: s.stars,
                scopedName: s.scoped_name,
                authorAvatar: s.author_avatar,
            })),
            topAuthors,
        });
    } catch (error) {
        console.error('Stats API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

