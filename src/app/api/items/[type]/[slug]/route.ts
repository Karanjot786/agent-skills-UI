import { NextResponse } from 'next/server';
import { getItem } from '@/lib/items';
import { isItemType, isValidSlug, itemPath } from '@/lib/items-sql';
import { parseInstall } from '@/lib/install-snippets';
import { absoluteUrl } from '@/lib/site';
import { getDb } from '@/lib/db';
import { itemScan } from '@/lib/scan';

export const dynamic = 'force-dynamic';
const NOT_FOUND = { status: 404, headers: { 'Cache-Control': 'public, s-maxage=300' } };

// Public read-only item record for the CLI (`install <slug> --type <type>`) and integrators.
export async function GET(_req: Request, { params }: { params: Promise<{ type: string; slug: string }> }) {
    const { type, slug } = await params;
    if (!isItemType(type) || !isValidSlug(slug)) return NextResponse.json({ error: 'not found' }, NOT_FOUND);
    try {
        const item = await getItem(type, slug);
        if (!item) return NextResponse.json({ error: 'not found' }, NOT_FOUND);
        const ref = String(item.seq);
        const [metric, count] = await Promise.all([
            getDb().prepare('SELECT scanned_at FROM item_metrics WHERE item_type = ? AND item_ref = ?').bind(item.type, ref).first<{ scanned_at: string }>(),
            getDb().prepare(`SELECT count(*) AS n FROM findings WHERE item_type = ? AND item_ref = ? AND status <> 'false_positive'
                             AND severity IN ('critical','high','medium')`).bind(item.type, ref).first<{ n: number }>(),
        ]);
        return NextResponse.json({
            type: item.type, slug: item.slug, name: item.name, author: item.author, description: item.description,
            repo: item.repo_full_name, sourceUrl: item.source_url, license: item.license, stars: item.stars,
            updatedAt: item.updated_at, url: absoluteUrl(itemPath(item.type, item.slug)), install: parseInstall(item.install_json),
            scan: itemScan(metric?.scanned_at ?? null, count?.n ?? 0),
        }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } });
    } catch (error) {
        console.error('items API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
