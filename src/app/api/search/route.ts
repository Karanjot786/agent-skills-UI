import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { limitByIp } from '@/lib/rate-limit';
import { buildSkillsSql, parseSkillsQuery } from '@/lib/skills-sql';
import { buildItemSearchSql, isItemType, itemPath, LIVE_ITEM_TYPES, type ItemType } from '@/lib/items-sql';
import { absoluteUrl, skillPath } from '@/lib/site';

export const dynamic = 'force-dynamic';
const PER_TYPE_IN_ALL = 5;

interface Hit { type: string; name: string; author: string; description: string | null; stars: number; url: string }
type SkillRow = { name: string; author: string; description: string | null; stars: number; scoped_name: string | null };
type ItemRow = { type: ItemType; slug: string; name: string; author: string; description: string | null; stars: number };

export async function GET(request: Request) {
    if (!(await limitByIp(getCloudflareContext().env.SEARCH_LIMITER, request))) {
        return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'private, no-store' } });
    }
    const sp = new URL(request.url).searchParams;
    const q = (sp.get('q') ?? '').replace(/\0/g, '').trim().slice(0, 200);
    const t = sp.get('type') ?? 'all';
    if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 });
    if (t !== 'all' && t !== 'skill' && !isItemType(t)) return NextResponse.json({ error: 'unknown type' }, { status: 400 });
    const limit = Math.min(50, Math.max(1, Number.parseInt(sp.get('limit') ?? '', 10) || 20));
    const types: string[] = t === 'all' ? ['skill', ...LIVE_ITEM_TYPES] : [t];
    const per = t === 'all' ? PER_TYPE_IN_ALL : limit;
    // Skills: trigram FTS only (1-2 char LIKE would scan 222K rows).
    const active = types.filter((ty) => ty !== 'skill' || [...q].length >= 3);

    try {
        const db = getDb();
        const stmts = active.map((ty) => {
            if (ty === 'skill') {
                const s = buildSkillsSql(parseSkillsQuery(new URLSearchParams({ search: q })));
                return db.prepare(s.sql).bind(...s.binds, per, 0);
            }
            const s = buildItemSearchSql(q, ty as ItemType, per)!;
            return db.prepare(s.sql).bind(...s.binds);
        });
        const batches = stmts.length ? await db.batch(stmts) : [];
        const results: Record<string, Hit[]> = Object.fromEntries(types.map((ty) => [ty, []]));
        active.forEach((ty, i) => {
            results[ty] = ty === 'skill'
                ? (batches[i].results as SkillRow[]).map((r) => ({ type: 'skill', name: r.name, author: r.author, description: r.description, stars: r.stars,
                    url: absoluteUrl(skillPath(r.scoped_name ?? r.name)) }))
                : (batches[i].results as ItemRow[]).map((r) => ({ type: r.type, name: r.name, author: r.author, description: r.description, stars: r.stars,
                    url: absoluteUrl(itemPath(r.type, r.slug)) }));
        });
        return NextResponse.json({ query: q, results }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' } });
    } catch (error) {
        console.error('search API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
