import { notFound } from 'next/navigation';
import { listSkills, getTotalSkills, getCategories } from '@/lib/lists';
import { Listing, rangeStats } from '@/components/listing';
import { Link } from '@/i18n/navigation';
import { skillPath } from '@/lib/site';
import { PAGE_SIZE, pageCount, pageHref } from '@/lib/structure';

export async function MarketplaceListing({ page }: { page: number }) {
  const [skills, total, cats] = await Promise.all([listSkills({ page }), getTotalSkills(), getCategories()]);
  if (!skills.length) notFound();
  const path = pageHref('/marketplace', page);
  const title = page > 1 ? `AI agent skills, page ${page}` : 'Browse AI agent skills';
  return (
    <Listing
      title={title}
      intro={`Browse ${total.toLocaleString('en-US')} open-source skills for Claude Code, Cursor, GitHub Copilot, Codex and 40+ AI coding agents, ranked by GitHub stars. Install any skill with one npx command.`}
      stats={rangeStats(page, skills.length)}
      crumbs={[{ name: 'Home', path: '/' }, { name: 'Marketplace', path: '/marketplace' }, ...(page > 1 ? [{ name: `Page ${page}`, path }] : [])]}
      ld={{
        name: title, path, start: (page - 1) * PAGE_SIZE + 1,
        description: 'Open-source SKILL.md skills for Claude Code, Cursor, GitHub Copilot, Codex and 40+ AI coding agents, ranked by GitHub stars.',
        items: skills.map((s) => ({ name: s.name, path: skillPath(s.scoped_name) })),
      }}
      skills={skills}
      pagination={{ base: '/marketplace', page, pages: pageCount(total) }}
    >
      <div className="flex flex-wrap gap-2 mb-8" aria-label="Categories">
        {cats.map((c) => <Link key={c.id} href={`/categories/${c.id}`} className="px-3 py-1 rounded-full bg-zinc-800/60 text-sm text-zinc-300 hover:text-cyan-400">{c.name}</Link>)}
      </div>
    </Listing>
  );
}
