import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getCategories } from '@/lib/lists';
import { Listing } from '@/components/listing';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return {
    title: 'AI Agent Skill Categories',
    description: 'Browse AI agent skills by category: development, DevOps, testing, data and ML, documentation and more.',
    alternates: buildAlternates('/categories', ['en'], (await params).locale),
  };
}
export default async function Page() {
  const cats = await getCategories();
  return (
    <Listing title="Skill categories" intro="Every skill in the directory sits in one category. Pick one to see its most starred skills."
      crumbs={[{ name: 'Home', path: '/' }, { name: 'Categories', path: '/categories' }]}>
      <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cats.map((c) => (
          <li key={c.id}><Link href={`/categories/${c.id}`} className="block p-5 rounded-xl bg-zinc-900/30 border border-white/5 hover:border-cyan-500/30">
            <span className="font-semibold text-cyan-100">{c.name}</span>
            <span className="block text-sm text-zinc-400 mt-1">{c.skill_count.toLocaleString('en-US')} skills</span>
          </Link></li>
        ))}
      </ul>
    </Listing>
  );
}
