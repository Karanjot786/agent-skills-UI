import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Cache for 24 hours (categories rarely change)
export const revalidate = 86400;

export async function GET() {
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
