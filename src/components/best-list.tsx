import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getBestList, getBestSkills, getSummaries } from '@/lib/lists';
import { Listing } from '@/components/listing';
import { skillPath } from '@/lib/site';
import { clip } from '@/lib/structure';

// One body for /best/[topic] and /for/[entity]: a ranked list from best_lists with summaries and install commands.
export async function BestListPage(p: { topic: string; path: string; title: string; intro: string; crumb: string; agent?: string; children?: ReactNode }) {
  const l = await getBestList(p.topic);
  const items = l ? await getBestSkills(l.refs.filter((r) => r.type === 'skill').map((r) => r.ref)) : [];
  if (!l || !items.length) notFound();
  const summaries = await getSummaries(items.map((s) => s.seq));
  return (
    <Listing
      title={p.title}
      intro={p.intro}
      stats={`Last updated ${l.updated_at.slice(0, 10)}. Rankings never include paid placement.`}
      crumbs={[{ name: 'Home', path: '/' }, { name: p.crumb, path: p.path }]}
      ld={{ name: p.title, path: p.path, description: p.title, items: items.map((s) => ({ name: s.name, path: skillPath(s.scoped_name) })), extra: { dateModified: l.updated_at } }}
    >
      <ol className="space-y-5">
        {items.map((s, i) => (
          <li key={s.id} className="p-5 rounded-xl bg-zinc-900/30 border border-white/5">
            <h2 className="text-lg font-semibold">
              <span className="text-zinc-500 mr-2">{i + 1}.</span>
              <Link href={skillPath(s.scoped_name)} className="text-cyan-100 hover:text-cyan-400">{s.name}</Link>
            </h2>
            <p className="text-sm text-zinc-300 mt-2">{summaries.get(s.seq) ?? clip(s.description ?? '', 220)}</p>
            <p className="text-xs text-zinc-500 mt-2">
              @{s.author} · {s.stars.toLocaleString('en-US')} stars
              {s.updated_at ? <> · updated <time dateTime={s.updated_at}>{s.updated_at.slice(0, 10)}</time></> : null}
            </p>
            <code className="block mt-3 text-xs bg-black/50 p-2 rounded text-zinc-300">
              {`npx agent-skills-cli install ${s.scoped_name}${p.agent ? ` -a ${p.agent}` : ''}`}
            </code>
          </li>
        ))}
      </ol>
      {p.children}
    </Listing>
  );
}
