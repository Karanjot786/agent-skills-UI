import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BestListPage } from '@/components/best-list';
import { buildAlternates } from '@/lib/seo';
import { TOOLS } from '@/lib/topics.mjs';

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type P = { params: Promise<{ locale: string; entity: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, entity } = await params;
  const t = TOOLS.find((x) => x.id === entity);
  if (!t) return { title: 'Not found', robots: { index: false } };
  return {
    title: `Agent Skills for ${t.name}`,
    description: `The most starred skills that mention ${t.name}, plus the exact command to install each one into ${t.dir}.`,
    alternates: buildAlternates(`/for/${t.id}`, ['en'], locale),
  };
}

export default async function Page({ params }: P) {
  const { entity } = await params;
  const t = TOOLS.find((x) => x.id === entity);
  if (!t) notFound();
  return (
    <BestListPage topic={`tool-${t.id}`} path={`/for/${t.id}`} title={`Agent skills for ${t.name}`} crumb={t.name} agent={t.id}
      intro={`${t.name} reads skills from ${t.dir}. Install any skill below with the Agent Skills CLI by adding -a ${t.id}; the CLI copies it into the right folder.`}>
      {/* items-by-tool: E renders mcp/agent/plugin rows here via item_tools WHERE tool_id = t.id */}
    </BestListPage>
  );
}
