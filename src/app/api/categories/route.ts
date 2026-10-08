import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { rateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';

// Cache for 24 hours (categories rarely change)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`categories:${ip}`, RATE_LIMITS.api);

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
        const { results: categories } = await getDb()
            .prepare('SELECT id, name, icon, skill_count, sort_order FROM categories ORDER BY sort_order')
            .all();
        return NextResponse.json({ categories }, {
            headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
