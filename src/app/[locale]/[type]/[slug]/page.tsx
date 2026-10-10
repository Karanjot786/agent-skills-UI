import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Star, Github, Scale, Clock, Package, User, FileText, KeyRound, Boxes, Wrench } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InstallTabs } from '@/components/install-tabs';
import { ScanBadge } from '@/components/scan-badge';
import { ItemCard } from '@/components/items/item-card';
import { getItem, getItemBySeq, getItemTools, getRelatedItems } from '@/lib/items';
import { isValidSlug, itemMetaDescription, itemPath, PERMISSIVE_LICENSES, TYPE_LABELS, TYPE_SEGMENT, typeFromSegment } from '@/lib/items-sql';
import { buildInstallTabs, parseInstall } from '@/lib/install-snippets';
import { absoluteUrl } from '@/lib/site';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 86400; // daily: stars/badges refresh (spec §4.5)
export async function generateStaticParams() { return []; }

type P = { params: Promise<{ locale: string; type: string; slug: string }> };
const README_CAP = 25_000;

async function load(params: P['params']) {
    const { locale, type: seg, slug } = await params;
    const type = typeFromSegment(seg);
    if (!type || !isValidSlug(slug)) return { locale, type: null, item: null };
    return { locale, type, item: await getItem(type, slug) }; // React cache(): one D1 read for metadata + page
}

export async function generateMetadata({ params }: P): Promise<Metadata> {
    const { type, item } = await load(params);
    if (!type || !item) return { title: 'Not found | Agent Skills', robots: { index: false, follow: false } };
    const L = TYPE_LABELS[type];
    const path = itemPath(type, item.slug);
    const upstream = item.canonical_seq ? await getItemBySeq(item.canonical_seq) : null;
    const title = `${item.name} by ${item.author} — ${L.singular} | Agent Skills`;
    const description = itemMetaDescription(item.name, L.singular, item.description);
    const og = absoluteUrl(`/api/og?title=${encodeURIComponent(item.name)}&description=${encodeURIComponent((item.description ?? '').slice(0, 100))}`);
    return {
        title, description,
        robots: item.indexable ? { index: true, follow: true } : { index: false, follow: true },
        alternates: upstream ? { canonical: absoluteUrl(itemPath(upstream.type, upstream.slug)) } : buildAlternates(path, ['en'], 'en'),
        openGraph: { title, description, url: absoluteUrl(path), siteName: 'Agent Skills', type: 'website', locale: 'en_US',
            images: [{ url: og, width: 1200, height: 630, alt: item.name }] },
        twitter: { card: 'summary_large_image', title, description, images: [og] },
    };
}

// One <h1> per page: rendered README headings shift down a level; external links nofollow (user content).
const md: Components = {
    h1: ({ node: _n, ...p }) => <h2 className="text-xl font-bold text-cyan-50 mt-8 mb-4" {...p} />,
    h2: ({ node: _n, ...p }) => <h3 className="text-lg font-semibold text-cyan-100 mt-6 mb-3" {...p} />,
    h3: ({ node: _n, ...p }) => <h4 className="font-semibold text-cyan-100 mt-4 mb-2" {...p} />,
    h4: ({ node: _n, ...p }) => <h5 className="font-semibold mt-4 mb-2" {...p} />,
    a: ({ node: _n, ...p }) => <a {...p} target="_blank" rel="noopener noreferrer nofollow" className="text-cyan-400 hover:underline" />,
};

export default async function ItemPage({ params }: P) {
    const { locale, type, item } = await load(params);
    if (!type || !item) notFound();
    const path = itemPath(type, item.slug);
    if (locale !== 'en') permanentRedirect(path); // §6.3 until Section D adds item_i18n rendering
    const L = TYPE_LABELS[type];
    const spec = parseInstall(item.install_json);
    const tabs = buildInstallTabs(type, item.slug, spec);
    const [related, tools] = await Promise.all([getRelatedItems(item), getItemTools(item)]);
    const repoUrl = item.repo_full_name ? `https://github.com/${item.repo_full_name}` : null;
    const fullText = !!item.license && PERMISSIVE_LICENSES.has(item.license);
    const readme = item.readme ? item.readme.slice(0, README_CAP) : null;
    const vars = spec?.type === 'mcp' ? spec.vars ?? [] : [];
    const avatar = item.author_avatar ?? (repoUrl ? `https://github.com/${item.author}.png` : null);

    const jsonLd = { '@context': 'https://schema.org', '@graph': [
        { '@type': 'BreadcrumbList', itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: L.plural, item: absoluteUrl(`/${TYPE_SEGMENT[type]}`) },
            { '@type': 'ListItem', position: 3, name: item.name, item: absoluteUrl(path) },
        ] },
        { '@type': 'SoftwareSourceCode', name: item.name, description: item.description ?? undefined, url: absoluteUrl(path),
            codeRepository: repoUrl ?? item.source_url, license: item.license ?? undefined, dateModified: item.updated_at ?? undefined,
            inLanguage: 'en', author: { '@type': 'Person', name: item.author, ...(repoUrl ? { url: `https://github.com/${item.author}` } : {}) } },
    ] };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <Navbar />
            <main>
                <div className="relative overflow-hidden border-b border-white/5 py-12">
                    <div className="absolute inset-0 hero-grid opacity-30" />
                    <div className="container mx-auto px-6 max-w-5xl relative z-10">
                        <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 mb-4">
                            <Link href="/" className="hover:text-cyan-400">Home</Link> / <Link href={`/${TYPE_SEGMENT[type]}`} className="hover:text-cyan-400">{L.plural}</Link>
                        </nav>
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="flex items-center gap-4">
                                {avatar && <img src={avatar} alt={item.author} className="size-12 rounded-full bg-black" />}
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-cyan-50">{item.name}</h1>
                                    <div className="text-sm text-zinc-500">{L.singular}</div>
                                </div>
                            </div>
                            {(repoUrl ?? item.homepage) && (
                                <Button variant="outline" asChild className="border-white/10 hover:bg-white/10 shrink-0 gap-2">
                                    <a href={repoUrl ?? item.homepage ?? undefined} target="_blank" rel="noopener noreferrer"><Github className="size-4" /> Source</a>
                                </Button>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm mb-6">
                            <Link href={`/authors/${encodeURIComponent(item.author)}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 rounded-full text-zinc-300 hover:text-cyan-400">
                                <User className="size-3.5" /> {item.author}
                            </Link>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 rounded-full text-yellow-400"><Star className="size-3.5 fill-yellow-400" /> {item.stars.toLocaleString('en-US')}</span>
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 rounded-full text-zinc-400"><Scale className="size-3.5" /> {item.license ?? 'No license'}</span>
                            {item.updated_at && <span className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 rounded-full text-zinc-400"><Clock className="size-3.5" /> Updated {item.updated_at.slice(0, 10)}</span>}
                            <ScanBadge itemType={item.type} itemRef={String(item.seq)} name={item.name} />
                        </div>
                        <p className="text-lg text-zinc-300 leading-relaxed max-w-3xl">{item.description || `${item.name} ${L.singular.toLowerCase()}.`}</p>
                    </div>
                </div>

                <div className="container mx-auto px-6 py-12 max-w-5xl">
                    {item.summary && (
                        <Card className="bg-zinc-900/40 border-white/5 p-6 mb-10">
                            <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">What it does</h2>
                            <p className="text-zinc-300">{item.summary}</p>
                        </Card>
                    )}

                    <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border-cyan-500/30 mb-10 p-6">
                        <h2 className="text-sm font-medium text-cyan-400 mb-4 uppercase tracking-wider flex items-center gap-2"><Package className="size-4" /> Install</h2>
                        {tabs.length
                            ? <InstallTabs tabs={tabs} />
                            : <p className="text-zinc-400">No machine-readable install spec was published. See the <a className="text-cyan-400 hover:underline" href={repoUrl ?? item.source_url} rel="noopener noreferrer nofollow" target="_blank">source</a>.</p>}
                    </Card>

                    {vars.length > 0 && (
                        <Card className="bg-zinc-900/40 border-white/5 p-6 mb-10">
                            <h2 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider flex items-center gap-2"><KeyRound className="size-4" /> Configuration</h2>
                            <table className="w-full text-sm">
                                <thead><tr className="text-left text-zinc-500"><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Kind</th><th className="py-2 pr-4">Required</th><th className="py-2">Description</th></tr></thead>
                                <tbody>{vars.map((v) => (
                                    <tr key={`${v.kind}:${v.name}`} className="border-t border-white/5">
                                        <td className="py-2 pr-4 font-mono text-cyan-300">{v.name}</td>
                                        <td className="py-2 pr-4 text-zinc-400">{v.kind === 'env' ? 'env var' : v.kind === 'header' ? 'HTTP header' : 'URL variable'}{v.secret ? ' · secret' : ''}</td>
                                        <td className="py-2 pr-4 text-zinc-400">{v.required ? 'yes' : 'no'}</td>
                                        <td className="py-2 text-zinc-400">{v.description}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </Card>
                    )}

                    {spec?.type === 'agent' && (spec.tools?.length || spec.model) && (
                        <Card className="bg-zinc-900/40 border-white/5 p-6 mb-10">
                            <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2"><Wrench className="size-4" /> Tools and model</h2>
                            {spec.tools?.length ? <p className="text-zinc-300 text-sm">Tools: <span className="font-mono">{spec.tools.join(', ')}</span></p> : <p className="text-zinc-300 text-sm">Tools: inherits all</p>}
                            {spec.model && <p className="text-zinc-300 text-sm mt-1">Model: <span className="font-mono">{spec.model}</span></p>}
                        </Card>
                    )}

                    {spec?.type === 'plugin' && spec.components && (
                        <Card className="bg-zinc-900/40 border-white/5 p-6 mb-10">
                            <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2"><Boxes className="size-4" /> What this plugin bundles</h2>
                            <ul className="text-sm text-zinc-300 space-y-1">
                                {spec.components.skills.length > 0 && <li>Skills: <span className="font-mono">{spec.components.skills.join(', ')}</span></li>}
                                {spec.components.agents.length > 0 && <li>Subagents: <span className="font-mono">{spec.components.agents.join(', ')}</span></li>}
                                {spec.components.commands.length > 0 && <li>Commands: <span className="font-mono">{spec.components.commands.map((c) => `/${c}`).join(', ')}</span></li>}
                                {spec.components.mcp && <li>MCP servers (.mcp.json)</li>}
                                {spec.components.hooks && <li>Hooks (hooks/hooks.json): runs code on events</li>}
                            </ul>
                        </Card>
                    )}

                    {tools.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-10">
                            {tools.map((t) => <Link key={t.id} href={`/tools/${t.id}`} className="px-3 py-1 rounded-full text-xs border border-white/10 text-zinc-300 hover:text-cyan-300">{t.name}</Link>)}
                        </div>
                    )}

                    {readme && (
                        <Card className="bg-zinc-900/40 border-white/5 p-6 mb-10">
                            <h2 className="text-sm font-medium text-cyan-400 mb-6 uppercase tracking-wider flex items-center gap-2"><FileText className="size-4" /> {type === 'agent' ? 'Agent prompt' : 'README'}</h2>
                            <div className="prose prose-invert max-w-none prose-p:text-zinc-300 prose-li:text-zinc-300 prose-pre:bg-zinc-950 prose-code:text-cyan-300">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>{readme}</ReactMarkdown>
                            </div>
                            {(!fullText || (item.readme?.length ?? 0) > README_CAP) && (
                                <p className="mt-6 text-sm text-zinc-500">
                                    {fullText ? 'Truncated.' : `Excerpt only (license: ${item.license ?? 'none'}).`}{' '}
                                    <a href={item.source_url.startsWith('https://github.com/') ? item.source_url : repoUrl ?? item.source_url} target="_blank" rel="noopener noreferrer nofollow" className="text-cyan-400 hover:underline">Read the full text at the source</a>
                                </p>
                            )}
                        </Card>
                    )}

                    {related.length > 0 && (
                        <section className="mt-16">
                            <h2 className="text-xl font-bold mb-6">Related {L.plural.toLowerCase()}</h2>
                            <div className="grid md:grid-cols-2 gap-4">{related.map((r) => <ItemCard key={r.seq} item={r} />)}</div>
                        </section>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
