import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { rateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';

// Never prerender at build (no DB at build time); edge caches the JSON for an hour.
export const dynamic = 'force-dynamic';

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
        const db = getDb();
        const PREVIEW = 'id, name, description, author, stars, scoped_name, author_avatar';
        const [statsR, trendingR, recentR, catsR] = await db.batch([
            db.prepare(`SELECT total_skills, unique_authors, top_authors FROM skill_stats WHERE id = 'global'`),
            db.prepare(`SELECT ${PREVIEW} FROM skills ORDER BY stars DESC LIMIT 6`),
            db.prepare(`SELECT ${PREVIEW} FROM skills ORDER BY updated_at DESC LIMIT 6`),
            db.prepare(`SELECT category, count(*) AS n FROM skills WHERE category IS NOT NULL GROUP BY category`),
        ]);
        const cachedStats = statsR.results[0] as { total_skills: number; unique_authors: number; top_authors: string } | undefined;
        const trending = trendingR.results as unknown as SkillPreview[];
        const recent = recentR.results as unknown as SkillPreview[];
        const categoryCounts = catsR.results as unknown as { category: string; n: number }[];

        const totalSkills = cachedStats?.total_skills ?? 50000;
        const uniqueAuthors = cachedStats?.unique_authors ?? 5000;
        const topAuthors: TopAuthor[] = cachedStats ? JSON.parse(cachedStats.top_authors) : [];

        const categoryMap: Record<string, number> = {};
        for (const cat of categoryCounts) {
            if (cat.category) {
                categoryMap[cat.category.toLowerCase()] = cat.n;
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
        }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
    } catch (error) {
        console.error('Stats API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

