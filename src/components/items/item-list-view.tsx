import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ItemCard } from '@/components/items/item-card';
import { itemPath, PAGE_SIZE, TYPE_LABELS, TYPE_SEGMENT, type LiveItemType as ItemType } from '@/lib/items-sql';
import type { CategoryRow, ItemListRow } from '@/lib/items';
import { absoluteUrl } from '@/lib/site';
import { buildAlternates } from '@/lib/seo';

export function listPath(type: ItemType, page: number, category: string | null) {
    const base = `/${TYPE_SEGMENT[type]}`;
    if (category) return `${base}/category/${category}`;
    return page > 1 ? `${base}/page/${page}` : base;
}

export function itemListMetadata(type: ItemType, page: number, category: CategoryRow | null, thin: boolean): Metadata {
    const L = TYPE_LABELS[type];
    const what = category ? `${category.name} ${L.plural}` : L.plural;
    const title = `${what}${page > 1 ? ` — Page ${page}` : ''} | Agent Skills`;
    const description = L.blurb.slice(0, 155);
    const path = listPath(type, page, category?.id ?? null);
    return {
        title, description,
        robots: thin ? { index: false, follow: true } : { index: true, follow: true },
        alternates: buildAlternates(path, ['en'], 'en'),
        openGraph: { title, description, url: absoluteUrl(path), siteName: 'Agent Skills', type: 'website', locale: 'en_US' },
    };
}

export function ItemListView({ type, page, category, items, hasNext, categories }: {
    type: ItemType; page: number; category: CategoryRow | null; items: ItemListRow[]; hasNext: boolean; categories: CategoryRow[];
}) {
    const L = TYPE_LABELS[type];
    const seg = TYPE_SEGMENT[type];
    const heading = category ? `${category.name} ${L.plural}` : L.plural;
    const jsonLd = {
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: heading, url: absoluteUrl(listPath(type, page, category?.id ?? null)),
        breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: L.plural, item: absoluteUrl(`/${seg}`) },
        ] },
        mainEntity: { '@type': 'ItemList', itemListElement: items.map((it, i) => ({
            '@type': 'ListItem', position: (page - 1) * PAGE_SIZE + i + 1, url: absoluteUrl(itemPath(it.type, it.slug)), name: it.name,
        })) },
    };
    return (
        <div className="min-h-screen bg-black text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <Navbar />
            <main className="container mx-auto px-6 py-12 max-w-6xl">
                <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 mb-4">
                    <Link href="/" className="hover:text-cyan-400">Home</Link> / <Link href={`/${seg}`} className="hover:text-cyan-400">{L.plural}</Link>
                    {category && <> / <span className="text-zinc-300">{category.name}</span></>}
                </nav>
                <h1 className="text-3xl md:text-4xl font-bold text-cyan-50 mb-3">{heading}{page > 1 ? ` — page ${page}` : ''}</h1>
                <p className="text-zinc-400 max-w-3xl mb-8">{L.blurb}</p>
                <div className="flex flex-wrap gap-2 mb-8">
                    {categories.map((c) => (
                        <Link key={c.id} href={`/${seg}/category/${c.id}`}
                            className={`px-3 py-1 rounded-full text-xs border ${c.id === category?.id ? 'border-cyan-400 text-cyan-300' : 'border-white/10 text-zinc-400 hover:text-white'}`}>
                            {c.name}
                        </Link>
                    ))}
                </div>
                {items.length === 0
                    ? <p className="text-zinc-500">Nothing listed here yet.</p>
                    : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{items.map((it) => <ItemCard key={it.seq} item={it} />)}</div>}
                {!category && (page > 1 || hasNext) && (
                    <nav aria-label="Pagination" className="flex justify-between mt-10 text-sm">
                        {page > 1 ? <Link rel="prev" href={listPath(type, page - 1, null)} className="text-cyan-400 hover:underline">← Previous</Link> : <span />}
                        {hasNext ? <Link rel="next" href={listPath(type, page + 1, null)} className="text-cyan-400 hover:underline">Next →</Link> : <span />}
                    </nav>
                )}
            </main>
            <Footer />
        </div>
    );
}
