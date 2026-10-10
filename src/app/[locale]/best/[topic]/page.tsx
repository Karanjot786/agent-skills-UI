import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { getBestList } from '@/lib/lists';
import { BestListPage } from '@/components/best-list';
import { buildAlternates } from '@/lib/seo';
import { BEST_TOPICS } from '@/lib/topics.mjs';

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type P = { params: Promise<{ locale: string; topic: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, topic } = await params;
  const l = topic.startsWith('tool-') ? null : await getBestList(topic);
  if (!l) return { title: 'Not found', robots: { index: false } };
  return {
    title: l.title,
    description: `${l.refs.length} hand-ranked agent skills, picked by GitHub stars and recent activity, with install commands for Claude Code, Cursor, Copilot and Codex. Updated ${l.updated_at.slice(0, 10)}.`,
    alternates: buildAlternates(`/best/${topic}`, ['en'], locale),
  };
}

export default async function Page({ params }: P) {
  const { topic } = await params;
  if (topic.startsWith('tool-')) notFound(); // tool lists live at /for/[entity]
  const l = await getBestList(topic);
  const others = BEST_TOPICS.filter((t) => t.slug !== topic).slice(0, 8);
  return (
    <BestListPage topic={topic} path={`/best/${topic}`} title={l?.title ?? ''} crumb="Best skills"
      intro="Agent skills ranked by GitHub stars, limited to skills with a SKILL.md of real length that were updated in the last 12 months, one entry per distinct SKILL.md. Each card shows what the skill does and the one-line install command.">
      <h2 className="text-xl font-bold mt-14 mb-4">More best-of guides</h2>
      <ul className="flex flex-wrap gap-2">
        {others.map((t) => <li key={t.slug}><Link href={`/best/${t.slug}`} className="px-3 py-1 rounded-full bg-zinc-800/60 text-sm text-zinc-300 hover:text-cyan-400">{t.label}</Link></li>)}
      </ul>
    </BestListPage>
  );
}
