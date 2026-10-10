import { getDb } from '@/lib/db';
import { SITE_URL, skillPath } from '@/lib/site';
import { buildLlmsTxt } from '@/lib/llms';
import { clip } from '@/lib/structure';
import { TOOLS } from '@/lib/topics.mjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const [stats, cats, best, top] = await db.batch([
    db.prepare("SELECT total_skills FROM skill_stats WHERE id = 'global'"),
    db.prepare('SELECT id, name, skill_count FROM categories ORDER BY sort_order'),
    db.prepare("SELECT topic, title FROM best_lists WHERE locale = 'en' AND topic NOT LIKE 'tool-%' ORDER BY topic"),
    db.prepare('SELECT scoped_name, name, description FROM skills INDEXED BY idx_skills_stars WHERE indexable = 1 AND scoped_name IS NOT NULL ORDER BY stars DESC, seq LIMIT 200'),
  ]);
  const body = buildLlmsTxt({
    base: SITE_URL,
    total: (stats.results[0] as { total_skills: number } | undefined)?.total_skills ?? 0,
    categories: (cats.results as { id: string; name: string; skill_count: number }[]).map((c) => ({ id: c.id, name: c.name, count: c.skill_count })),
    best: best.results as { topic: string; title: string }[],
    tools: TOOLS.map((t) => ({ id: t.id, name: t.name })),
    top: (top.results as { scoped_name: string; name: string; description: string | null }[]).map((s) => ({
      path: skillPath(s.scoped_name), name: s.name, description: clip(s.description ?? '', 140),
    })),
  });
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' },
  });
}
