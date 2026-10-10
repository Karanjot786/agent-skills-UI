import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { parseSkillsQuery, buildSkillsSql } from '@/lib/skills-sql';
import { isLimited, tooMany, V1_HEADERS } from '@/lib/v1';

export const dynamic = 'force-dynamic';

type Row = { id: string; name: string; description: string | null; author: string; stars: number; github_url: string;
  scoped_name: string | null; repo_full_name: string | null; path: string | null; category: string | null };

export async function GET(request: Request) {
  if (await isLimited(request)) return tooMany();
  const sp = new URL(request.url).searchParams;
  const q = parseSkillsQuery(new URLSearchParams({ search: sp.get('q') ?? '', category: sp.get('category') ?? '', sortBy: 'stars',
    limit: String(Math.min(25, Number(sp.get('limit')) || 10)), offset: '0' }));
  // 1-2 character queries would run an unindexed LIKE over every skill; the trigram FTS path needs 3+.
  if ([...q.search].length < 3) return NextResponse.json({ error: 'q must be at least 3 characters' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  try {
    const { sql, binds } = buildSkillsSql(q); // stars order only; paid placements never enter this query
    const { results } = await getDb().prepare(sql).bind(...binds, q.limit, 0).all<Row>();
    return NextResponse.json({
      query: q.search,
      results: results.map((r) => ({ id: r.id, name: r.name, description: r.description, author: r.author, stars: r.stars,
        category: r.category, repo: r.repo_full_name, path: r.path, url: r.github_url, scopedName: r.scoped_name })),
    }, { headers: V1_HEADERS });
  } catch (e) {
    console.error('v1 search', e);
    return NextResponse.json({ error: 'internal error' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
