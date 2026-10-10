import { CategoryListing, categoryMetadata } from '@/components/category-listing';

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type P = { params: Promise<{ locale: string; cat: string }> };
export async function generateMetadata({ params }: P) { const { locale, cat } = await params; return categoryMetadata(cat, 1, locale); }
export default async function Page({ params }: P) { return <CategoryListing cat={(await params).cat} page={1} />; }
