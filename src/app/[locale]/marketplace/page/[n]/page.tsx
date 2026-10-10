import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { MarketplaceListing } from '@/components/marketplace-listing';
import { buildAlternates } from '@/lib/seo';
import { pageHref, parsePage } from '@/lib/structure';

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type P = { params: Promise<{ locale: string; n: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, n } = await params;
  const page = parsePage(n);
  if (!page) return { title: 'Not found', robots: { index: false } };
  return {
    title: `AI Agent Skills, Page ${page}`,
    description: `Page ${page} of the agentskills.in directory: open-source skills for Claude Code, Cursor, Copilot and Codex, ranked by GitHub stars.`,
    alternates: buildAlternates(pageHref('/marketplace', page), ['en'], locale),
  };
}

export default async function Page({ params }: P) {
  const page = parsePage((await params).n);
  if (!page) notFound();
  if (page === 1) permanentRedirect('/marketplace');
  return <MarketplaceListing page={page} />;
}
