import type { ReactNode } from 'react';
import { Star } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { SITE_URL, skillPath } from '@/lib/site';
import { PAGE_SIZE, clip, collectionJsonLd, jsonLdString, pageHref, pageWindow } from '@/lib/structure';
import type { ListSkill } from '@/lib/lists';

type Card = Pick<ListSkill, 'id' | 'name' | 'description' | 'author' | 'stars' | 'scoped_name'>;
type Crumb = { name: string; path: string };

export function SkillList({ skills }: { skills: Card[] }) {
  return (
    <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {skills.map((s) => (
        <li key={s.id}>
          <Link href={skillPath(s.scoped_name)} className="block h-full p-5 rounded-xl bg-zinc-900/30 border border-white/5 hover:border-cyan-500/30 transition-all">
            <div className="flex justify-between gap-3 mb-2">
              <span className="font-semibold text-cyan-100 truncate">{s.name}</span>
              <span className="flex items-center gap-1 text-xs text-zinc-400 shrink-0">
                <Star aria-hidden="true" className="size-3 text-yellow-500 fill-yellow-500" />
                <span className="sr-only">GitHub stars:</span>{s.stars.toLocaleString('en-US')}
              </span>
            </div>
            <p className="text-sm text-zinc-400 line-clamp-2">{clip(s.description ?? '', 140) || `A skill for ${s.name}.`}</p>
            <span className="text-xs text-zinc-500 mt-3 block">@{s.author}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const pcls = 'px-3 py-1.5 rounded-lg border border-white/10 text-sm text-zinc-300 hover:border-cyan-500/40';
export function Pagination({ base, page, pages }: { base: string; page: number; pages: number }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2 mt-10">
      {page > 1 && <Link rel="prev" href={pageHref(base, page - 1)} className={pcls}>Previous</Link>}
      {pageWindow(page, pages).map((n) => n === page
        ? <span key={n} aria-current="page" className={`${pcls} bg-cyan-500/20 text-cyan-300`}>{n}</span>
        : <Link key={n} href={pageHref(base, n)} className={pcls}>{n}</Link>)}
      {page < pages && <Link rel="next" href={pageHref(base, page + 1)} className={pcls}>Next</Link>}
    </nav>
  );
}

// One page shell for every crawlable list (marketplace, categories, authors, best-of, E's item lists).
export function Listing(p: {
  title: string; intro: string; stats?: string; crumbs: Crumb[];
  ld?: { name: string; description: string; path: string; items: { name: string; path: string }[]; start?: number; extra?: Record<string, unknown> };
  skills?: Card[]; pagination?: { base: string; page: number; pages: number }; children?: ReactNode;
}) {
  const ld = p.ld && collectionJsonLd({ base: SITE_URL, crumbs: p.crumbs, start: 1, ...p.ld });
  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />}
      <Navbar />
      <main className="container mx-auto px-6 py-10 max-w-7xl">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 mb-4 flex flex-wrap gap-2">
          {p.crumbs.map((c, i) => <span key={c.path}>{i > 0 && '/ '}<Link href={c.path} className="hover:text-cyan-400">{c.name}</Link></span>)}
        </nav>
        <h1 className="text-3xl font-bold mb-3">{p.title}</h1>
        <p className="text-zinc-300 max-w-3xl mb-2">{p.intro}</p>
        {p.stats && <p className="text-sm text-zinc-500 mb-8">{p.stats}</p>}
        {p.children}
        {p.skills && <SkillList skills={p.skills} />}
        {p.pagination && <Pagination {...p.pagination} />}
      </main>
      <Footer />
    </div>
  );
}

export const rangeStats = (page: number, n: number, what = 'most starred first') =>
  `Showing ${(page - 1) * PAGE_SIZE + 1}-${(page - 1) * PAGE_SIZE + n}, ${what}.`;
