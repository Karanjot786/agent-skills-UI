import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getCategory, getCategories, listSkills } from '@/lib/lists';
import { Listing, rangeStats } from '@/components/listing';
import { buildAlternates } from '@/lib/seo';
import { skillPath } from '@/lib/site';
import { PAGE_SIZE, pageCount, pageHref } from '@/lib/structure';

export async function categoryMetadata(cat: string, page: number, locale: string): Promise<Metadata> {
  const c = await getCategory(cat);
  if (!c) return { title: 'Category not found', robots: { index: false } };
  return {
    title: `${c.name} Skills for AI Coding Agents${page > 1 ? `, Page ${page}` : ''}`,
    description: `${c.skill_count.toLocaleString('en-US')} open-source ${c.name.toLowerCase()} skills for Claude Code, Cursor, Copilot and Codex, ranked by GitHub stars. Install with one npx command.`,
    alternates: buildAlternates(pageHref(`/categories/${c.id}`, page), ['en'], locale),
  };
}

export async function CategoryListing({ cat, page }: { cat: string; page: number }) {
  const c = await getCategory(cat);
  if (!c) notFound();
  const [skills, cats] = await Promise.all([listSkills({ category: c.id, page }), getCategories()]);
  if (!skills.length) notFound();
  const base = `/categories/${c.id}`;
  const path = pageHref(base, page);
  const title = `${c.name} skills${page > 1 ? `, page ${page}` : ''}`;
  return (
    <Listing
      title={title}
      intro={`${c.skill_count.toLocaleString('en-US')} ${c.name.toLowerCase()} skills for Claude Code, Cursor, GitHub Copilot, Codex and other AI coding agents, most starred first. Each links to the SKILL.md source and an install command.`}
      stats={rangeStats(page, skills.length)}
      crumbs={[{ name: 'Home', path: '/' }, { name: 'Categories', path: '/categories' }, { name: c.name, path: base }]}
      ld={{
        name: title, path, start: (page - 1) * PAGE_SIZE + 1,
        description: `Most starred ${c.name.toLowerCase()} skills for AI coding agents.`,
        items: skills.map((s) => ({ name: s.name, path: skillPath(s.scoped_name) })),
      }}
      skills={skills}
      pagination={{ base, page, pages: pageCount(c.skill_count) }}
    >
      <div className="flex flex-wrap gap-2 mb-8" aria-label="Other categories">
        {cats.filter((o) => o.id !== c.id).map((o) => <Link key={o.id} href={`/categories/${o.id}`} className="px-3 py-1 rounded-full bg-zinc-800/60 text-sm text-zinc-300 hover:text-cyan-400">{o.name}</Link>)}
      </div>
    </Listing>
  );
}
