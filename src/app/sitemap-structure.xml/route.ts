import { getDb } from '@/lib/db';
import { absoluteUrl } from '@/lib/site';
import { urlsetXml, type Entry } from '@/lib/sitemap';
import { AUTHOR_RE, pageCount, pageHref } from '@/lib/structure';

export const dynamic = 'force-dynamic';

// Hubs, category pages, best/for lists and top authors (en only). lastmod only where real (best_lists.updated_at).
export async function GET() {
  const db = getDb();
  const [cats, best, stats] = await db.batch([
    db.prepare('SELECT id, skill_count FROM categories ORDER BY sort_order'),
    db.prepare("SELECT topic, updated_at FROM best_lists WHERE locale = 'en'"),
    db.prepare("SELECT total_skills, top_authors FROM skill_stats WHERE id = 'global'"),
  ]);
  const s = stats.results[0] as { total_skills: number; top_authors: string } | undefined;
  const u = (p: string, lastmod?: string): Entry => ({ loc: absoluteUrl(p), lastmod });
  const urls = [u('/marketplace'), u('/categories')];
  for (let n = 2; n <= pageCount(s?.total_skills ?? 0); n++) urls.push(u(pageHref('/marketplace', n)));
  for (const c of cats.results as { id: string; skill_count: number }[]) {
    for (let n = 1; n <= pageCount(c.skill_count); n++) urls.push(u(pageHref(`/categories/${c.id}`, n)));
  }
  for (const b of best.results as { topic: string; updated_at: string }[]) {
    urls.push(u(b.topic.startsWith('tool-') ? `/for/${b.topic.slice(5)}` : `/best/${b.topic}`, b.updated_at));
  }
  try {
    for (const a of JSON.parse(s?.top_authors ?? '[]') as { name: string; skillCount: number }[]) {
      if (a.skillCount >= 3 && AUTHOR_RE.test(a.name)) urls.push(u(`/authors/${a.name}`));
    }
  } catch { /* top_authors is optional */ }
  return new Response(urlsetXml(urls), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=86400' },
  });
}
