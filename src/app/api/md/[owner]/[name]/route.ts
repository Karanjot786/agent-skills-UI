import { getSkillBySlug, getSkillContent, getSkillSummary } from '@/lib/skills';
import { skillMarkdown } from '@/lib/skill-md';
import { SITE_URL, skillPath } from '@/lib/site';

export const dynamic = 'force-dynamic';
const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'public, s-maxage=3600' } });

export async function GET(_req: Request, { params }: { params: Promise<{ owner: string; name: string }> }) {
  const p = await params;
  let scoped: string;
  try { scoped = `${decodeURIComponent(p.owner)}/${decodeURIComponent(p.name)}`; } catch { return notFound(); }
  const row = await getSkillBySlug(scoped);
  // exact match only: the name-only fallback in getSkillBySlug must not mint junk .md URLs
  if (!row?.scoped_name || row.scoped_name.toLowerCase() !== scoped.toLowerCase()) return notFound();
  const [content, summary] = await Promise.all([getSkillContent(row.scoped_name), getSkillSummary(row.seq)]);
  return new Response(skillMarkdown({ ...row, scoped_name: row.scoped_name, content }, summary, SITE_URL), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      'X-Robots-Tag': 'noindex',
      Link: `<${SITE_URL}${skillPath(row.scoped_name)}>; rel="canonical"`,
    },
  });
}
