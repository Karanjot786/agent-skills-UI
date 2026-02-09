import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { rateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';

interface Skill {
    id: string;
    name: string;
    description: string | null;
    author: string;
    stars: number;
    forks: number;
    githubUrl: string;
    scopedName: string | null;
    authorAvatar: string | null;
    repoFullName: string | null;
    path: string | null;
    category: string | null;
    hasContent: boolean;
}

export async function GET(request: Request) {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`skills:${ip}`, RATE_LIMITS.search);

    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: rateLimitHeaders(rateLimitResult),
            }
        );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '30');
    const sortBy = searchParams.get('sortBy') || 'stars';
    const category = searchParams.get('category');
    const author = searchParams.get('author');
    const offset = parseInt(searchParams.get('offset') || '0');
    const minStars = parseInt(searchParams.get('minStars') || '0');
    const hasContent = searchParams.get('hasContent') === 'true';

    try {
        // Build where clause
        const where: {
            OR?: { name?: object; description?: object; author?: object }[];
            category?: string;
            author?: string;
            stars?: object;
            content?: object;
        } = {};

        // Search filter
        if (search && search.trim()) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Category filter
        if (category && category !== 'all') {
            where.category = category;
        }

        // Author filter
        if (author) {
            where.author = author;
        }

        // Minimum stars filter
        if (minStars > 0) {
            where.stars = { gte: minStars };
        }

        // Has content filter
        if (hasContent) {
            where.content = { not: null };
        }

        // Build orderBy
        let orderBy: { stars?: 'desc' | 'asc'; updated_at?: 'desc' | 'asc'; name?: 'asc' | 'desc' } = { stars: 'desc' };
        if (sortBy === 'recent') {
            orderBy = { updated_at: 'desc' };
        } else if (sortBy === 'name') {
            orderBy = { name: 'asc' };
        }

        // Execute queries in parallel
        const [data, total] = await Promise.all([
            prisma.skills.findMany({
                where,
                orderBy,
                skip: offset,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    author: true,
                    stars: true,
                    forks: true,
                    github_url: true,
                    scoped_name: true,
                    author_avatar: true,
                    repo_full_name: true,
                    path: true,
                    category: true,
                    content: true,
                },
            }),
            prisma.skills.count({ where }),
        ]);

        // Transform to response format
        let skills: Skill[] = data.map((skill: typeof data[number]) => ({
            id: skill.id,
            name: skill.name,
            description: skill.description,
            author: skill.author,
            stars: skill.stars,
            forks: skill.forks,
            githubUrl: skill.github_url,
            scopedName: skill.scoped_name,
            authorAvatar: skill.author_avatar,
            repoFullName: skill.repo_full_name,
            path: skill.path,
            category: skill.category,
            hasContent: !!skill.content,
        }));

        // If searching, re-sort to prioritize name matches
        if (search && search.trim() && sortBy !== 'name') {
            const searchLower = search.toLowerCase();
            skills = skills.sort((a: Skill, b: Skill) => {
                const aNameMatch = a.name.toLowerCase().includes(searchLower) ? 1 : 0;
                const bNameMatch = b.name.toLowerCase().includes(searchLower) ? 1 : 0;
                const aExactMatch = a.name.toLowerCase() === searchLower ? 2 : 0;
                const bExactMatch = b.name.toLowerCase() === searchLower ? 2 : 0;

                const aScore = aExactMatch + aNameMatch;
                const bScore = bExactMatch + bNameMatch;

                if (aScore !== bScore) {
                    return bScore - aScore;
                }
                return 0;
            });
        }

        return NextResponse.json({
            skills,
            total,
            limit,
            offset,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
