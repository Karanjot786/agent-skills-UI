import { NextResponse } from 'next/server';
import { getItem } from '@/lib/items';
import { isItemType, isValidSlug, itemPath } from '@/lib/items-sql';
import { parseInstall } from '@/lib/install-snippets';
import { absoluteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';
const NOT_FOUND = { status: 404, headers: { 'Cache-Control': 'public, s-maxage=300' } };

// Public read-only item record for the CLI (`install <slug> --type <type>`) and integrators.
export async function GET(_req: Request, { params }: { params: Promise<{ type: string; slug: string }> }) {
    const { type, slug } = await params;
    if (!isItemType(type) || !isValidSlug(slug)) return NextResponse.json({ error: 'not found' }, NOT_FOUND);
    try {
        const item = await getItem(type, slug);
        if (!item) return NextResponse.json({ error: 'not found' }, NOT_FOUND);
        return NextResponse.json({
            type: item.type, slug: item.slug, name: item.name, author: item.author, description: item.description,
            repo: item.repo_full_name, sourceUrl: item.source_url, license: item.license, stars: item.stars,
            updatedAt: item.updated_at, url: absoluteUrl(itemPath(item.type, item.slug)), install: parseInstall(item.install_json),
        }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
    } catch (error) {
        console.error('items API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
