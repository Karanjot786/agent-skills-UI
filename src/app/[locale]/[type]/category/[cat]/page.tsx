import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { typeFromSegment } from '@/lib/items-sql';
import { listCategories, listItems } from '@/lib/items';
import { ItemListView, itemListMetadata } from '@/components/items/item-list-view';

export const revalidate = 3600;
export async function generateStaticParams() { return []; }

const CATEGORY_PAGE_SIZE = 96;
const MIN_INDEXABLE = 3; // thin category pages stay noindex
type P = { params: Promise<{ locale: string; type: string; cat: string }> };

async function load(p: Awaited<P['params']>) {
    const type = typeFromSegment(p.type);
    const category = type ? (await listCategories()).find((c) => c.id === p.cat) ?? null : null;
    return { type, category };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
    const { type, category } = await load(await params);
    if (!type || !category) return {};
    const { items } = await listItems({ type, category: category.id, page: 1, pageSize: CATEGORY_PAGE_SIZE });
    return itemListMetadata(type, 1, category, items.length < MIN_INDEXABLE);
}

export default async function ItemCategoryPage({ params }: P) {
    const p = await params;
    const { type, category } = await load(p);
    if (!type || !category) notFound();
    if (p.locale !== 'en') permanentRedirect(`/${p.type}/category/${category.id}`);
    const [{ items }, categories] = await Promise.all([
        listItems({ type, category: category.id, page: 1, pageSize: CATEGORY_PAGE_SIZE }), listCategories(),
    ]);
    return <ItemListView type={type} page={1} category={category} items={items} hasNext={false} categories={categories} locale={p.locale} />;
}
