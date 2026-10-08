import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { parseSkillsQuery, buildSkillsSql } from '@/lib/skills-sql';
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
    const q = parseSkillsQuery(searchParams);
    const { search, limit, offset, sortBy } = q;

    try {
        const db = getDb();
        const { sql, countSql, binds } = buildSkillsSql(q);
        const [page, count] = await db.batch([
            db.prepare(sql).bind(...binds, limit, offset),
            db.prepare(countSql).bind(...binds),
        ]);
        const total = (count.results[0] as { total: number } | undefined)?.total ?? 0;

        type Row = { id: string; name: string; description: string | null; author: string; stars: number; forks: number;
            github_url: string; scoped_name: string | null; author_avatar: string | null; repo_full_name: string | null;
            path: string | null; category: string | null; has_content: number };

        let skills: Skill[] = (page.results as Row[]).map((skill) => ({
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
            hasContent: !!skill.has_content,
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
