import { Terminal, Star, ArrowLeft, Github, Copy, ExternalLink, Package, Clock, User, FileText, FolderOpen, CheckCircle, AlertTriangle, Info, Lightbulb } from "lucide-react";
import { Link } from '@/i18n/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PlatformInstallTabs } from "@/components/platform-install-tabs";
import { notFound, permanentRedirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/config';
import { getSkillBySlug, getSkillContent, getRelatedSkills, getSkillSummary, type SkillRow } from '@/lib/skills';
import { getCategory, getRelatedByCategory } from '@/lib/lists';
import { SkillList } from '@/components/listing';
import { buildAlternates, ogLocale, skillTitle, skillDescription, slugAction } from '@/lib/seo';
import { SITE_URL, absoluteUrl, skillPath } from '@/lib/site';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import type { Metadata } from 'next';

// ISR: pages are cached in R2 and refreshed at most once a day so stars/dates/badges do not go stale.
export const revalidate = 86400;

// Allow on-demand ISR for skills not pre-rendered at build time
export const dynamicParams = true;
// Empty list = build nothing (no DB at build time) but render each skill once on first visit,
// then serve it from the R2 ISR cache. Without this export Next renders the route dynamically.
export async function generateStaticParams() {
    return [];
}

// Generate dynamic metadata for SEO
const safeDecode = (s: string) => { try { return decodeURIComponent(s); } catch { return null; } };

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string[] }> }): Promise<Metadata> {
    const { locale, slug } = await params;
    const parts = slug.map(safeDecode);
    const scopedName = parts.join('/');
    const skill = parts.includes(null) ? null : await getSkillBySlug(scopedName);

    if (!skill || slugAction(scopedName, skill) === 'notfound') {
        return { title: 'Skill not found', description: 'The requested skill could not be found.', robots: { index: false, follow: false } };
    }

    // Skill content is English-only until WS3: every locale variant canonicalises to en, no hreflang.
    const alt = buildAlternates(skillPath(skill.scoped_name ?? scopedName), ['en'], locale);
    const title = skillTitle(skill.name, skill.author);
    const description = skillDescription(skill.name, skill.description);
    const ogImageUrl = absoluteUrl(`/api/og?title=${encodeURIComponent(skill.name)}&description=${encodeURIComponent((skill.description || '').slice(0, 100))}`);

    return {
        title: { absolute: title },
        description,
        robots: skill.indexable ? { index: true, follow: true } : { index: false, follow: true },
        alternates: { ...alt, types: { 'text/markdown': `${alt.canonical}.md` } },
        openGraph: {
            title,
            description,
            type: 'website',
            url: alt.canonical,
            locale: ogLocale(locale),
            siteName: 'Agent Skills',
            images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${skill.name} - Agent Skill for Claude Code, Cursor, Copilot` }],
        },
        twitter: { card: 'summary_large_image', title, description, images: [ogImageUrl] },
    };
}

interface Asset {
    name: string;
    rawUrl: string;
    size: number;
}

interface Skill {
    id: string;
    name: string;
    description: string;
    author: string;
    stars: number;
    forks: number;
    github_url: string;
    raw_url: string;
    repo_full_name: string;
    path: string;
    branch: string;
    author_avatar: string;
    updated_at: string;
    scoped_name: string;
    content?: string;
    assets?: Asset[];
    has_assets?: boolean;
    folder_url?: string;
}

function toSkill(row: SkillRow, content: string | null): Skill {
    return {
        id: row.id,
        name: row.name,
        description: row.description || '',
        author: row.author,
        stars: row.stars,
        forks: row.forks,
        github_url: row.github_url,
        raw_url: row.raw_url || '',
        repo_full_name: row.repo_full_name || '',
        path: row.path || '',
        branch: row.branch,
        author_avatar: row.author_avatar || '',
        updated_at: row.updated_at || '',
        scoped_name: row.scoped_name || '',
        content: content || undefined,
        folder_url: row.folder_url || undefined,
    };
}

export default async function SkillPage({ params }: { params: Promise<{ locale: string; slug: string[] }> }) {
    const { locale, slug } = await params;
    const parts = slug.map(safeDecode);
    if (parts.includes(null)) notFound();
    const scopedName = parts.join('/');
    const row = await getSkillBySlug(scopedName);
    if (!row) notFound(); // real 404: stops junk URLs from being rendered + cached with 200
    const action = slugAction(scopedName, row);
    if (action === 'notfound') notFound();
    if (action === 'redirect') permanentRedirect(`${locale === defaultLocale ? '' : `/${locale}`}${skillPath(row.scoped_name!)}`);
    const skill = toSkill(row, await getSkillContent(scopedName));
    // ponytail: hard 25K cut; an unclosed code fence only affects the tail, add line/fence-aware cut if it shows up.
    const BODY_MAX = 25_000;
    const truncated = (skill.content?.length ?? 0) > BODY_MAX;

    const relatedSkills = (await getRelatedSkills(row.author, row.id)).map((r) => toSkill(r, null));
    const [summary, category, byCategory] = await Promise.all([
        getSkillSummary(row.seq),
        row.category ? getCategory(row.category) : null,
        row.category ? getRelatedByCategory(row.category, row.seq) : [],
    ]);

    const skillUrl = absoluteUrl(skillPath(skill.scoped_name || scopedName));
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL },
                    { "@type": "ListItem", "position": 2, "name": "Marketplace", "item": absoluteUrl('/marketplace') },
                    { "@type": "ListItem", "position": 3, "name": skill.name, "item": skillUrl },
                ],
            },
            {
                "@type": "SoftwareSourceCode",
                "name": skill.name,
                "description": skill.description || `${skill.scoped_name} - A skill for AI coding assistants`,
                "url": skillUrl,
                "codeRepository": skill.repo_full_name ? `https://github.com/${skill.repo_full_name}` : skill.github_url,
                "dateModified": skill.updated_at ? new Date(skill.updated_at).toISOString() : undefined,
                "inLanguage": "en",
                "author": { "@type": "Person", "name": skill.author, "url": `https://github.com/${skill.author}` },
            },
        ],
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
            {/* JSON-LD for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Navbar />

            <main className="relative">
                {/* Hero with grid background */}
                <div className="relative overflow-hidden border-b border-white/5 py-12">
                    <div className="absolute inset-0 hero-grid opacity-30" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[128px] rounded-full" />

                    <div className="container mx-auto px-6 max-w-5xl relative z-10">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                    {/* Author avatar with gradient ring */}
                                    <Link href={`/authors/${skill.author}`} className="avatar-ring p-[2px] rounded-full hover:scale-105 transition-transform">
                                        <img
                                            src={skill.author_avatar || `https://github.com/${skill.author}.png`}
                                            alt={skill.author}
                                            className="size-12 rounded-full bg-black"
                                        />
                                    </Link>
                                    <div>
                                        <h1 className="text-3xl md:text-4xl font-bold text-cyan-50">{skill.name}</h1>
                                        <div className="text-sm text-zinc-500 font-mono">{skill.scoped_name}</div>
                                    </div>
                                </div>

                                {/* Stats row */}
                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                    <Link
                                        href={`/authors/${skill.author}`}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 rounded-full text-zinc-300 hover:text-cyan-400 hover:bg-zinc-800 transition-colors"
                                    >
                                        <User className="size-3.5" />
                                        <span className="font-medium">{skill.author}</span>
                                    </Link>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 rounded-full text-yellow-400">
                                        <Star className="size-3.5 fill-yellow-400" />
                                        <span className="font-medium">{skill.stars?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 rounded-full text-zinc-400">
                                        <Github className="size-3.5" />
                                        <span>{skill.forks || 0} forks</span>
                                    </div>
                                    {skill.updated_at && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 rounded-full text-zinc-400">
                                            <Clock className="size-3.5" />
                                            <span>Updated <time dateTime={skill.updated_at}>{skill.updated_at.slice(0, 10)}</time></span>
                                        </div>
                                    )}
                                    {category && (
                                        <Link href={`/categories/${category.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 rounded-full text-zinc-300 hover:text-cyan-400 transition-colors">
                                            <Package aria-hidden="true" className="size-3.5" />
                                            <span>{category.name}</span>
                                        </Link>
                                    )}
                                    {/* scan-badge: F adds <ScanBadge itemType="skill" itemRef={row.id} /> here */}
                                </div>
                            </div>
                            {skill.github_url && (
                                <Button variant="outline" asChild className="border-white/10 hover:bg-white/10 shrink-0 gap-2">
                                    <a href={skill.github_url} target="_blank" rel="noopener noreferrer">
                                        <Github className="size-4" />
                                        View on GitHub
                                    </a>
                                </Button>
                            )}
                        </div>

                        <p className="text-lg text-zinc-300 leading-relaxed max-w-3xl">
                            {skill.description || 'A useful skill for AI development.'}
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-6 py-12 max-w-5xl">

                    {summary && (
                        <section className="mb-10" aria-labelledby="what-it-does">
                            <h2 id="what-it-does" className="text-xl font-bold text-cyan-50 mb-3">What is {skill.name} and when should you use it?</h2>
                            <p className="text-zinc-200 leading-relaxed max-w-3xl">{summary}</p>
                        </section>
                    )}

                    {/* Install Section */}
                    <Card className="bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 border-cyan-500/30 mb-10 overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-sm font-medium text-cyan-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <Package className="size-4" />
                                Installation
                            </h3>

                            <PlatformInstallTabs scopedName={skill.scoped_name} />

                            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <span className="size-2 rounded-full bg-green-500"></span>
                                    Claude Code
                                </div>
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <span className="size-2 rounded-full bg-green-500"></span>
                                    Cursor
                                </div>
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <span className="size-2 rounded-full bg-green-500"></span>
                                    Copilot
                                </div>
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <span className="size-2 rounded-full bg-green-500"></span>
                                    Codex
                                </div>
                                <div className="flex items-center gap-2 text-zinc-400">
                                    <span className="size-2 rounded-full bg-green-500"></span>
                                    Antigravity
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Details Grid */}
                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                        <Card className="bg-zinc-900/40 border-white/5 p-6">
                            <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Details</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Repository</span>
                                    <a href={`https://github.com/${skill.repo_full_name}`} target="_blank" className="text-cyan-400 hover:underline flex items-center gap-1">
                                        {skill.repo_full_name}
                                        <ExternalLink className="size-3" />
                                    </a>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Path</span>
                                    <span className="text-zinc-300 font-mono text-xs">{skill.path || '.claude/skills'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Branch</span>
                                    <span className="text-zinc-300">{skill.branch || 'main'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Scoped Name</span>
                                    <span className="text-zinc-300 font-mono text-xs">{skill.scoped_name}</span>
                                </div>
                            </div>
                        </Card>

                        <Card className="bg-zinc-900/40 border-white/5 p-6">
                            <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">Usage</h3>
                            <div className="space-y-4 text-sm text-zinc-400">
                                <p>After installing, this skill will be available to your AI coding assistant.</p>
                                <p>Verify installation:</p>
                                <code className="block bg-black/50 p-3 rounded font-mono text-xs text-zinc-300">
                                    npx agent-skills-cli list
                                </code>
                            </div>
                        </Card>
                    </div>

                    {/* Skill Content */}
                    {skill.content && (
                        <Card className="bg-zinc-900/40 border-white/5 p-6 mb-10">
                            <h3 className="text-sm font-medium text-cyan-400 mb-6 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="size-4" />
                                Skill Instructions
                            </h3>
                            <div className="prose prose-invert prose-lg max-w-none 
                            prose-headings:text-cyan-50 prose-headings:font-bold prose-headings:border-b prose-headings:border-white/10 prose-headings:pb-2 prose-headings:mb-4
                            prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                            prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:my-4
                            prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                            prose-code:text-cyan-300 prose-code:bg-cyan-950/50 prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                            prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-0 prose-pre:overflow-hidden
                            prose-li:text-zinc-300 prose-li:my-1
                            prose-ul:my-4 prose-ol:my-4
                            prose-strong:text-white prose-strong:font-semibold
                            prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-cyan-950/30 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                            prose-table:border-collapse prose-th:bg-zinc-800/50 prose-th:px-4 prose-th:py-2 prose-th:border prose-th:border-white/10 prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-white/10
                            prose-hr:border-white/10 prose-hr:my-8
                            prose-img:rounded-xl prose-img:border prose-img:border-white/10">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight]}
                                    components={{
                                        // Custom code block with copy button
                                        pre: ({ children, ...props }) => (
                                            <div className="relative group">
                                                <pre className="!bg-zinc-950 !p-4 !rounded-xl !border !border-white/10 overflow-x-auto" {...props}>
                                                    {children}
                                                </pre>
                                            </div>
                                        ),
                                        // Custom inline code
                                        code: ({ className, children, ...props }) => {
                                            const isInline = !className;
                                            if (isInline) {
                                                return (
                                                    <code className="text-cyan-300 bg-cyan-950/50 px-1.5 py-0.5 rounded-md font-mono text-sm" {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            }
                                            return <code className={className} {...props}>{children}</code>;
                                        },
                                        // Enhanced blockquote for tips/notes
                                        blockquote: ({ children }) => (
                                            <div className="flex gap-3 bg-cyan-950/30 border-l-4 border-cyan-500 px-4 py-3 rounded-r-xl my-4">
                                                <Info className="size-5 text-cyan-400 shrink-0 mt-0.5" />
                                                <div className="text-zinc-300 [&>p]:my-0">{children}</div>
                                            </div>
                                        ),
                                        // Enhanced headers
                                        h1: ({ children, ...props }) => (
                                            <h2 className="text-2xl font-bold text-white border-b border-cyan-500/30 pb-3 mb-6 mt-8" {...props}>
                                                {children}
                                            </h2>
                                        ),
                                        h2: ({ children, ...props }) => (
                                            <h3 className="text-xl font-bold text-cyan-50 border-b border-white/10 pb-2 mb-4 mt-8 flex items-center gap-2" {...props}>
                                                <span className="size-1.5 rounded-full bg-cyan-500" />
                                                {children}
                                            </h3>
                                        ),
                                        h3: ({ children, ...props }) => (
                                            <h4 className="text-lg font-semibold text-cyan-100 mb-3 mt-6" {...props}>
                                                {children}
                                            </h4>
                                        ),
                                        // Enhanced list items
                                        li: ({ children, ...props }) => (
                                            <li className="text-zinc-300 marker:text-cyan-500" {...props}>
                                                {children}
                                            </li>
                                        ),
                                        // Enhanced links
                                        a: ({ href, children, ...props }) => (
                                            <a
                                                href={href}
                                                target={href?.startsWith('http') ? '_blank' : undefined}
                                                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                                                className="text-cyan-400 hover:text-cyan-300 hover:underline font-medium transition-colors"
                                                {...props}
                                            >
                                                {children}
                                            </a>
                                        ),
                                        // Enhanced table
                                        table: ({ children, ...props }) => (
                                            <div className="overflow-x-auto my-6 rounded-xl border border-white/10">
                                                <table className="w-full" {...props}>{children}</table>
                                            </div>
                                        ),
                                        th: ({ children, ...props }) => (
                                            <th className="bg-zinc-800/80 px-4 py-3 text-left text-sm font-semibold text-cyan-100 border-b border-white/10" {...props}>
                                                {children}
                                            </th>
                                        ),
                                        td: ({ children, ...props }) => (
                                            <td className="px-4 py-3 text-sm text-zinc-300 border-b border-white/5" {...props}>
                                                {children}
                                            </td>
                                        ),
                                    }}
                                >
                                    {skill.content.slice(0, BODY_MAX)}
                                </ReactMarkdown>
                            </div>
                            {truncated && (
                                <a href={skill.github_url} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-4 text-sm text-cyan-400 hover:underline">
                                    View full SKILL.md on GitHub <ExternalLink className="size-3" />
                                </a>
                            )}
                        </Card>
                    )}

                    {/* Assets List */}
                    {skill.has_assets && skill.assets && skill.assets.length > 0 && (
                        <Card className="bg-zinc-900/40 border-white/5 p-6 mb-10">
                            <h3 className="text-sm font-medium text-purple-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                                <FolderOpen className="size-4" />
                                Skill Assets ({skill.assets.length} files)
                            </h3>
                            <div className="space-y-2">
                                {skill.assets.map((asset, i) => (
                                    <a
                                        key={i}
                                        href={asset.rawUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 bg-black/40 rounded-lg hover:bg-black/60 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="size-4 text-zinc-500" />
                                            <span className="text-zinc-300 font-mono text-sm">{asset.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-zinc-500">
                                                {asset.size > 1024
                                                    ? `${(asset.size / 1024).toFixed(1)} KB`
                                                    : `${asset.size} B`}
                                            </span>
                                            <ExternalLink className="size-3 text-zinc-500 group-hover:text-cyan-400" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                            {skill.folder_url && (
                                <a
                                    href={skill.folder_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 mt-4 text-sm text-cyan-400 hover:underline"
                                >
                                    <Github className="size-4" />
                                    View all files on GitHub
                                </a>
                            )}
                        </Card>
                    )}
                    {relatedSkills.length > 0 && (
                        <div className="mt-16">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <User className="size-5 text-cyan-400" />
                                    More by {skill.author}
                                </h2>
                                <Button variant="ghost" size="sm" className="text-cyan-400" asChild>
                                    <Link href={`/authors/${skill.author}`}>
                                        View all
                                    </Link>
                                </Button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                {relatedSkills.map((related) => (
                                    <Link
                                        key={related.id}
                                        href={skillPath(related.scoped_name || related.name)}
                                        className="block p-4 rounded-xl bg-zinc-900/30 border border-white/5 hover:border-cyan-500/30 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-medium text-cyan-100">{related.name}</div>
                                            <Badge variant="secondary" className="bg-white/5 text-zinc-400 text-xs gap-1">
                                                <Star className="size-3 text-yellow-500 fill-yellow-500" />
                                                {related.stars?.toLocaleString()}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-zinc-500 line-clamp-1">
                                            {related.description || 'A useful skill.'}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                    {byCategory.length > 0 && category && (
                        <section className="mt-16">
                            <h2 className="text-xl font-bold mb-6">More {category.name} skills</h2>
                            <SkillList skills={byCategory} />
                        </section>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
