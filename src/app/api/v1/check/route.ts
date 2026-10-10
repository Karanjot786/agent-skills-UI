import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { parseRepo, repoUrlRange, summarizeFindings, type FindingAgg } from '@/lib/v1-parse';
import { isLimited, tooMany, V1_HEADERS } from '@/lib/v1';

export const dynamic = 'force-dynamic';
const NOTE = 'Scanned means our rules ran on the date shown. Findings are automated signals, not a verdict, and an empty list does not mean an item is safe.';

export async function GET(request: Request) {
  if (await isLimited(request)) return tooMany();
  const repo = parseRepo(new URL(request.url).searchParams.get('repo'));
  if (!repo) return NextResponse.json({ error: 'repo must look like owner/name' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  const db = getDb();
  try {
    const [lo, hi] = repoUrlRange(repo.owner, repo.repo);
    const { results: skills } = await db.prepare(
      'SELECT id, name, path, github_url, stars FROM skills WHERE github_url >= ? AND github_url < ? ORDER BY stars DESC LIMIT 50'
    ).bind(lo, hi).all<{ id: string; name: string; path: string | null; github_url: string; stars: number }>();

    let counts: ReturnType<typeof summarizeFindings> = {};
    let scannedIds = new Set<string>();
    if (skills.length) {
        const ph = skills.map(() => '?').join(',');
        const ids = skills.map((s) => s.id);
        const [f, m] = await db.batch([
          db.prepare(`SELECT item_ref, severity, count(*) AS n, max(scanned_at) AS scanned_at FROM findings
                      WHERE item_type = 'skill' AND item_ref IN (${ph}) AND status != 'false_positive' GROUP BY item_ref, severity`).bind(...ids),
          db.prepare(`SELECT item_ref FROM item_metrics WHERE item_type = 'skill' AND item_ref IN (${ph})`).bind(...ids),
        ]);
        counts = summarizeFindings(f.results as unknown as FindingAgg[]);
        scannedIds = new Set((m.results as { item_ref: string }[]).map((r) => r.item_ref));
    }
    return NextResponse.json({
      repo: `${repo.owner}/${repo.repo}`, found: skills.length > 0,
      skills: skills.map((s) => ({ id: s.id, name: s.name, path: s.path, url: s.github_url, stars: s.stars,
        scan: scannedIds.has(s.id)
          ? { status: 'scanned', counts: counts[s.id] ?? { critical: 0, high: 0, medium: 0, low: 0, scannedAt: null } }
          : { status: 'not_scanned' } })),
      note: NOTE,
    }, { headers: V1_HEADERS });
  } catch (e) {
    console.error('v1 check', e);
    return NextResponse.json({ error: 'internal error' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
