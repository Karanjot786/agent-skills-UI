import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { rateLimit, getClientIp, rateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';

// Cache for 24 hours (categories rarely change)
export const revalidate = 86400;

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
        const categories = await prisma.categories.findMany({
            select: {
                id: true,
                name: true,
                icon: true,
                skill_count: true,
                sort_order: true,
            },
            orderBy: { sort_order: 'asc' },
        });

        return NextResponse.json({ categories });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
