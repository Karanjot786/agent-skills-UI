import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { rateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';

// Cache response for 1 hour
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
        // Start all queries in parallel for speed
        const [cachedStats, trending, recent, categoryCounts] = await Promise.all([
            // Get cached stats from skill_stats table (fast - just 1 row)
            prisma.skill_stats.findUnique({
                where: { id: 'global' },
            }),

            // Get trending skills by stars
            prisma.skills.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    author: true,
                    stars: true,
                    scoped_name: true,
                    author_avatar: true,
                },
                orderBy: { stars: 'desc' },
                take: 6,
            }),

            // Get recent skills
            prisma.skills.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    author: true,
                    stars: true,
                    scoped_name: true,
                    author_avatar: true,
                },
                orderBy: { updated_at: 'desc' },
                take: 6,
            }),

            // Get category counts
            prisma.skills.groupBy({
                by: ['category'],
                _count: { id: true },
            }),
        ]);

        // Use cached stats or fallback values
        const totalSkills = cachedStats?.total_skills ?? 50000;
        const uniqueAuthors = cachedStats?.unique_authors ?? 5000;
        const topAuthors = (cachedStats?.top_authors as unknown as TopAuthor[]) ?? [];

        // Transform category counts to a map
        const categoryMap: Record<string, number> = {};
        for (const cat of categoryCounts) {
            if (cat.category) {
                categoryMap[cat.category.toLowerCase()] = cat._count.id;
            }
        }

        return NextResponse.json({
            stats: {
                totalSkills,
                uniqueAuthors,
                totalStars: 0,
            },
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

