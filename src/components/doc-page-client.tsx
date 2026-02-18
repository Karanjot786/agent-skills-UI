'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    BookOpen,
    Download,
    Terminal,
    Package,
    Upload,
    Wrench,
    Sparkles,
    MessageSquare,
    BarChart3,
    Hammer,
    Star,
    Users,
    Zap,
    Clock,
    Layers,
    ArrowUp,
    ArrowLeft,
    ArrowRight,
    ChevronRight,
    Search,
    type LucideIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CommandSearch } from '@/components/command-search';
import { DocsSidebar } from '@/components/docs-sidebar';
import { mdxComponents } from '@/components/mdx-components';
import type { DocSection, DocSectionMeta } from '@/lib/mdx';

// ── Icon map ─────────────────────────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
    'book-open': BookOpen,
    'download': Download,
    'search': Search,
    'terminal': Terminal,
    'package': Package,
    'upload': Upload,
    'wrench': Wrench,
    'sparkles': Sparkles,
    'message-square': MessageSquare,
    'bar-chart': BarChart3,
    'hammer': Hammer,
    'star': Star,
    'users': Users,
    'zap': Zap,
    'clock': Clock,
    'layers': Layers,
};

// ── Reading Progress Bar ─────────────────────────────────────────────────

function ReadingProgressBar() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = window.scrollY;
            setProgress(scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0);
        };

        window.addEventListener('scroll', updateProgress, { passive: true });
        return () => window.removeEventListener('scroll', updateProgress);
    }, []);

    return (
        <div className="fixed top-0 left-0 right-0 z-[10000] h-0.5">
            <div
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-[width] duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

// ── Back to Top Button ───────────────────────────────────────────────────

function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const toggle = () => setVisible(window.scrollY > 500);
        window.addEventListener('scroll', toggle, { passive: true });
        return () => window.removeEventListener('scroll', toggle);
    }, []);

    if (!visible) return null;

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-50 size-11 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/30 hover:scale-110 transition-all shadow-lg shadow-cyan-500/10 backdrop-blur-sm"
            aria-label="Back to top"
        >
            <ArrowUp className="size-5" />
        </button>
    );
}

// ── Prev/Next Navigation ─────────────────────────────────────────────────

function DocPageNav({ prev, next }: { prev: DocSectionMeta | null; next: DocSectionMeta | null }) {
    const PrevIcon = prev ? (iconMap[prev.icon] || Terminal) : Terminal;
    const NextIcon = next ? (iconMap[next.icon] || Terminal) : Terminal;

    return (
        <nav className="mt-16 pt-8 border-t border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {prev ? (
                    <Link
                        href={`/docs/${prev.slug}`}
                        className="group flex items-center gap-4 p-5 bg-zinc-900/50 border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all hover:bg-zinc-900/80"
                    >
                        <ArrowLeft className="size-5 text-zinc-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                        <div className="text-left min-w-0">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 font-medium">Previous</p>
                            <div className="flex items-center gap-2">
                                <PrevIcon className="size-4 text-zinc-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
                                <p className="font-semibold text-sm text-zinc-300 group-hover:text-white transition-colors truncate">
                                    {prev.title}
                                </p>
                            </div>
                        </div>
                    </Link>
                ) : (
                    <Link
                        href="/docs"
                        className="group flex items-center gap-4 p-5 bg-zinc-900/50 border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all hover:bg-zinc-900/80"
                    >
                        <ArrowLeft className="size-5 text-zinc-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                        <div className="text-left min-w-0">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 font-medium">Back</p>
                            <div className="flex items-center gap-2">
                                <BookOpen className="size-4 text-zinc-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
                                <p className="font-semibold text-sm text-zinc-300 group-hover:text-white transition-colors">
                                    All Documentation
                                </p>
                            </div>
                        </div>
                    </Link>
                )}

                {next ? (
                    <Link
                        href={`/docs/${next.slug}`}
                        className="group flex items-center gap-4 p-5 bg-zinc-900/50 border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all hover:bg-zinc-900/80 text-right sm:text-right"
                    >
                        <div className="flex-1 text-right min-w-0">
                            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 font-medium">Next</p>
                            <div className="flex items-center justify-end gap-2">
                                <p className="font-semibold text-sm text-zinc-300 group-hover:text-white transition-colors truncate">
                                    {next.title}
                                </p>
                                <NextIcon className="size-4 text-zinc-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
                            </div>
                        </div>
                        <ArrowRight className="size-5 text-zinc-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                    </Link>
                ) : (
                    <div />
                )}
            </div>
        </nav>
    );
}

// ── Breadcrumb ───────────────────────────────────────────────────────────

function Breadcrumb({ title }: { title: string }) {
    return (
        <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
            <Link href="/docs" className="hover:text-cyan-400 transition-colors">
                Docs
            </Link>
            <ChevronRight className="size-3 text-zinc-700" />
            <span className="text-zinc-300 truncate">{title}</span>
        </nav>
    );
}

// ── Props ────────────────────────────────────────────────────────────────

interface DocPageClientProps {
    section: DocSection;
    prev: DocSectionMeta | null;
    next: DocSectionMeta | null;
    allSections: DocSectionMeta[];
}

// ── Main component ───────────────────────────────────────────────────────

export function DocPageClient({ section, prev, next, allSections }: DocPageClientProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    const Icon = iconMap[section.icon] || Terminal;

    return (
        <>
            <ReadingProgressBar />
            <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
            <BackToTop />

            <div className="container mx-auto px-4 sm:px-6 py-8 lg:py-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    <DocsSidebar
                        onSearchOpen={() => setSearchOpen(true)}
                        activeSlug={section.slug}
                        allSections={allSections}
                    />

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        <Breadcrumb title={section.title} />

                        {/* Section Header */}
                        <div className="flex items-start gap-4 mb-10">
                            <div className="size-12 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                                <Icon className="size-6 text-cyan-400" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                                    {section.title}
                                </h1>
                                <p className="text-zinc-400">
                                    {section.description}
                                </p>
                                {section.commands.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {section.commands.map((cmd) => (
                                            <Badge
                                                key={cmd}
                                                variant="outline"
                                                className="text-xs text-zinc-500 border-zinc-800 font-mono"
                                            >
                                                {cmd}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* MDX Content */}
                        <div className="docs-content">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={mdxComponents as unknown as Record<string, React.ComponentType>}
                            >
                                {section.content}
                            </ReactMarkdown>
                        </div>

                        {/* Prev/Next Navigation */}
                        <DocPageNav prev={prev} next={next} />
                    </main>
                </div>
            </div>
        </>
    );
}
