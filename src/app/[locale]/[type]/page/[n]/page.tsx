import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { MAX_PAGE, typeFromSegment } from '@/lib/items-sql';
import { listCategories, listItems } from '@/lib/items';
import { ItemListView, itemListMetadata } from '@/components/items/item-list-view';

export const revalidate = 3600;
export async function generateStaticParams() { return []; }

type P = { params: Promise<{ locale: string; type: string; n: string }> };
const pageNum = (s: string) => (/^\d{1,3}$/.test(s) ? Number(s) : NaN);

export async function generateMetadata({ params }: P): Promise<Metadata> {
    const p = await params;
    const type = typeFromSegment(p.type);
    const n = pageNum(p.n);
    if (!type || !(n >= 2 && n <= MAX_PAGE)) return {};
    const { items } = await listItems({ type, page: n });
    return itemListMetadata(type, n, null, items.length === 0);
}

export default async function ItemTypePage({ params }: P) {
    const { locale, type: seg, n: raw } = await params;
    const type = typeFromSegment(seg);
    const n = pageNum(raw);
    if (!type || !(n >= 1 && n <= MAX_PAGE)) notFound();
    if (n === 1) permanentRedirect(`/${seg}`);
    if (locale !== 'en') permanentRedirect(`/${seg}/page/${n}`);
    const [{ items, hasNext }, categories] = await Promise.all([listItems({ type, page: n }), listCategories()]);
    if (items.length === 0) notFound();
    return <ItemListView type={type} page={n} category={null} items={items} hasNext={hasNext} categories={categories} />;
}
