import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { typeFromSegment } from '@/lib/items-sql';
import { listCategories, listItems } from '@/lib/items';
import { ItemListView, itemListMetadata } from '@/components/items/item-list-view';

export const revalidate = 3600;
export async function generateStaticParams() { return []; } // no DB at build: render on first hit, then ISR

type P = { params: Promise<{ locale: string; type: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
    const type = typeFromSegment((await params).type);
    if (!type) return {};
    const { items } = await listItems({ type, page: 1 });
    return itemListMetadata(type, 1, null, items.length === 0);
}

export default async function ItemTypeIndex({ params }: P) {
    const { locale, type: seg } = await params;
    const type = typeFromSegment(seg);
    if (!type) notFound();
    if (locale !== 'en') permanentRedirect(`/${seg}`); // §6.3: no item translations yet -> English URL
    const [{ items, hasNext }, categories] = await Promise.all([listItems({ type, page: 1 }), listCategories()]);
    return <ItemListView type={type} page={1} category={null} items={items} hasNext={hasNext} categories={categories} />;
}
