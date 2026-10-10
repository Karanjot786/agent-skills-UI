import { notFound, permanentRedirect } from 'next/navigation';
import { CategoryListing, categoryMetadata } from '@/components/category-listing';
import { parsePage } from '@/lib/structure';

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type P = { params: Promise<{ locale: string; cat: string; n: string }> };
export async function generateMetadata({ params }: P) {
  const { locale, cat, n } = await params;
  return categoryMetadata(cat, parsePage(n) ?? 1, locale);
}
export default async function Page({ params }: P) {
  const { cat, n } = await params;
  const page = parsePage(n);
  if (!page) notFound();
  if (page === 1) permanentRedirect(`/categories/${cat}`);
  return <CategoryListing cat={cat} page={page} />;
}
