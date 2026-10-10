import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Github } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getAuthorStats, listSkills } from '@/lib/lists';
import { Listing } from '@/components/listing';
import { buildAlternates } from '@/lib/seo';
import { skillPath } from '@/lib/site';
import { AUTHOR_RE } from '@/lib/structure';

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type P = { params: Promise<{ locale: string; author: string }> };

// Exact DB-cased author only (author = ? is case-sensitive), so casing variants 404 instead of rendering duplicates.
async function load(raw: string) {
  let author: string;
  try { author = decodeURIComponent(raw); } catch { return null; }
  if (!AUTHOR_RE.test(author)) return null;
  const stats = await getAuthorStats(author);
  return stats && stats.n > 0 ? { author, stats } : null;
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, author: raw } = await params;
  const d = await load(raw);
  if (!d) return { title: 'Author not found', robots: { index: false } };
  return {
    title: `${d.author}'s AI Agent Skills`,
    description: `${d.stats.n.toLocaleString('en-US')} agent skills by @${d.author} with ${d.stats.stars.toLocaleString('en-US')} GitHub stars in total. Install any of them with one npx command.`,
    robots: { index: d.stats.n >= 3, follow: true }, // thin-page guard
    alternates: buildAlternates(`/authors/${d.author}`, ['en'], locale),
  };
}

export default async function Page({ params }: P) {
  const d = await load((await params).author);
  if (!d) notFound();
  // ponytail: top 48 only; per-author pagination if big authors matter.
  const skills = await listSkills({ author: d.author, page: 1 });
  const path = `/authors/${d.author}`;
  const gh = `https://github.com/${d.author}`;
  return (
    <Listing
      title={`Agent skills by @${d.author}`}
      intro={`${d.stats.n.toLocaleString('en-US')} skills by @${d.author}, with ${d.stats.stars.toLocaleString('en-US')} GitHub stars across them. Top ${skills.length} by stars below.`}
      crumbs={[{ name: 'Home', path: '/' }, { name: 'Marketplace', path: '/marketplace' }, { name: d.author, path }]}
      ld={{
        name: `Agent skills by ${d.author}`, path, description: `Agent skills published by @${d.author} on GitHub.`,
        items: skills.map((s) => ({ name: s.name, path: skillPath(s.scoped_name) })),
        extra: { about: { '@type': 'Person', name: d.author, url: gh, sameAs: [gh] } },
      }}
      skills={skills}
    >
      <p className="mb-8 flex flex-wrap items-center gap-4 text-sm">
        <a href={gh} rel="noopener" className="inline-flex items-center gap-2 text-cyan-400 hover:underline"><Github aria-hidden="true" className="size-4" />github.com/{d.author}</a>
        {d.stats.n > skills.length && <Link href={`/marketplace?author=${encodeURIComponent(d.author)}`} className="text-zinc-400 hover:text-cyan-400">Search all {d.stats.n.toLocaleString('en-US')} skills</Link>}
      </p>
    </Listing>
  );
}
