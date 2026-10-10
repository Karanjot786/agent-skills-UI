import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { Star } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { InstallTabs } from '@/components/install-tabs';
import { PlatformInstallTabs } from '@/components/platform-install-tabs';
import { ItemCard } from '@/components/items/item-card';
import { getItem, getTool, listItemsForTool, listSkillsForTool } from '@/lib/items';
import { TYPE_LABELS } from '@/lib/items-sql';
import { buildInstallTabs, parseInstall } from '@/lib/install-snippets';
import { absoluteUrl } from '@/lib/site';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 86400;
export async function generateStaticParams() { return []; }

type P = { params: Promise<{ locale: string; entity: string }> };
const ORDER = ['mcp', 'agent', 'plugin'] as const;

async function load(entity: string) {
    if (!/^[a-z0-9-]{1,64}$/.test(entity)) return null;
    const tool = await getTool(entity);
    if (!tool) return null;
    const [skills, byType] = await Promise.all([listSkillsForTool(tool.id), listItemsForTool(tool.id)]);
    return { tool, skills, byType, total: skills.length + ORDER.reduce((n, t) => n + byType[t].length, 0) };
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
    const d = await load((await params).entity);
    if (!d) return { title: 'Not found | Agent Skills', robots: { index: false, follow: false } };
    const title = `${d.tool.name} MCP Server, Agent Skills & Subagents | Agent Skills`;
    const description = `Connect ${d.tool.name} to Claude Code, Cursor, VS Code, Codex and more: MCP servers, agent skills, subagents and plugins with one-command install.`.slice(0, 155);
    return {
        title, description,
        robots: d.total >= 3 ? { index: true, follow: true } : { index: false, follow: true },
        alternates: buildAlternates(`/tools/${d.tool.id}`, ['en'], 'en'),
        openGraph: { title, description, url: absoluteUrl(`/tools/${d.tool.id}`), siteName: 'Agent Skills', type: 'website', locale: 'en_US' },
    };
}

export default async function ToolPage({ params }: P) {
    const { locale, entity } = await params;
    const d = await load(entity);
    if (!d) notFound();
    if (locale !== 'en') permanentRedirect(`/tools/${d.tool.id}`);
    const { tool, skills, byType } = d;
    const topMcp = byType.mcp[0] ? await getItem('mcp', byType.mcp[0].slug) : null;
    const mcpTabs = topMcp ? buildInstallTabs('mcp', topMcp.slug, parseInstall(topMcp.install_json)) : [];
    const topSkill = skills.find((s) => s.scoped_name);
    const jsonLd = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: `${tool.name} for AI coding agents`, url: absoluteUrl(`/tools/${tool.id}`),
        about: { '@type': 'Thing', name: tool.name, ...(tool.homepage ? { url: tool.homepage } : {}) } };
    return (
        <div className="min-h-screen bg-black text-white">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <Navbar />
            <main className="container mx-auto px-6 py-12 max-w-5xl">
                <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 mb-4">
                    <Link href="/" className="hover:text-cyan-400">Home</Link> / <Link href="/tools" className="hover:text-cyan-400">Tools</Link>
                </nav>
                <h1 className="text-3xl md:text-4xl font-bold text-cyan-50 mb-3">{tool.name} for AI coding agents</h1>
                <p className="text-zinc-400 max-w-3xl mb-8">
                    {byType.mcp.length} MCP servers, {skills.length} skills, {byType.agent.length} subagents and {byType.plugin.length} plugins that work with {tool.name}
                    {tool.homepage && <> (<a href={tool.homepage} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{tool.homepage.replace(/^https?:\/\//, '')}</a>)</>}.
                </p>

                {(mcpTabs.length > 0 || topSkill) && (
                    <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border-cyan-500/30 p-6 mb-10">
                        <h2 className="text-sm font-medium text-cyan-400 mb-4 uppercase tracking-wider">
                            {mcpTabs.length ? `Connect ${tool.name} (${topMcp!.name})` : `Install ${topSkill!.name}`}
                        </h2>
                        {mcpTabs.length ? <InstallTabs tabs={mcpTabs} /> : <PlatformInstallTabs scopedName={topSkill!.scoped_name!} />}
                    </Card>
                )}

                {skills.length > 0 && (
                    <section className="mt-12">
                        <h2 className="text-xl font-bold mb-6">{tool.name} agent skills</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {skills.map((s) => (
                                <Link key={s.id} href={`/marketplace/${(s.scoped_name ?? s.name).split('/').map(encodeURIComponent).join('/')}`}
                                    className="block p-4 rounded-xl bg-zinc-900/30 border border-white/5 hover:border-cyan-500/30">
                                    <div className="flex justify-between gap-3 mb-2">
                                        <span className="font-medium text-cyan-100 truncate">{s.name}</span>
                                        <span className="flex items-center gap-1 text-xs text-zinc-400"><Star className="size-3 text-yellow-500 fill-yellow-500" />{s.stars.toLocaleString('en-US')}</span>
                                    </div>
                                    <p className="text-sm text-zinc-500 line-clamp-2">{s.description || 'No description provided.'}</p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {ORDER.filter((t) => byType[t].length).map((t) => (
                    <section key={t} className="mt-12">
                        <h2 className="text-xl font-bold mb-6">{tool.name} {TYPE_LABELS[t].plural.replace('Claude Code ', '')}</h2>
                        <div className="grid md:grid-cols-2 gap-4">{byType[t].map((it) => <ItemCard key={it.seq} item={it} />)}</div>
                    </section>
                ))}
            </main>
            <Footer />
        </div>
    );
}
