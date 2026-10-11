import { Link } from '@/i18n/navigation';
import { listSkills } from '@/lib/lists';
import { getDb } from '@/lib/db';
import { skillPath } from '@/lib/site';

export async function HomeLinks() {
  // Categories are covered by the "Browse by category" showcase above, whose "View all" links to /categories.
  const [top, best] = await Promise.all([
    listSkills({ page: 1, limit: 50 }),
    getDb().prepare("SELECT topic, title FROM best_lists WHERE locale = 'en' AND topic NOT LIKE 'tool-%' ORDER BY updated_at DESC, topic LIMIT 12")
      .all<{ topic: string; title: string }>().then((r) => r.results),
  ]);
  const h2 = 'text-2xl font-bold mb-6';
  return (
    <section className="py-16 border-t border-white/5">
      <div className="container mx-auto px-6 max-w-7xl space-y-14">
        {best.length > 0 && (
          <div>
            <h2 className={h2}>Best-of guides</h2>
            <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
              {best.map((b) => <li key={b.topic}><Link href={`/best/${b.topic}`} className="text-zinc-300 hover:text-cyan-400">{b.title}</Link></li>)}
            </ul>
          </div>
        )}
        <div>
          <h2 className={h2}>Top 50 skills by GitHub stars</h2>
          <ol className="columns-1 md:columns-2 lg:columns-3 gap-8 list-decimal list-inside text-sm">
            {top.map((s) => (
              <li key={s.id} className="mb-2 break-inside-avoid">
                <Link href={skillPath(s.scoped_name)} className="text-cyan-100 hover:text-cyan-400">{s.name}</Link>
                <span className="text-zinc-500"> by @{s.author}, {s.stars.toLocaleString('en-US')} stars</span>
              </li>
            ))}
          </ol>
          <Link href="/marketplace" className="inline-block mt-6 text-cyan-400 hover:underline">Browse all skills</Link>
        </div>
        {/* newest-mcp: E adds <NewestMcp/> here */}
      </div>
    </section>
  );
}
