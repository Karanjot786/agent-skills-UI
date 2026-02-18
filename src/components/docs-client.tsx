'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    Search,
    ExternalLink,
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
    Copy,
    Check,
    ChevronRight,
    Rocket,
    Code2,
    type LucideIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InstallTabs } from '@/components/code-tabs';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { CommandSearch } from '@/components/command-search';
import { DocsSidebar } from '@/components/docs-sidebar';
import { mdxComponents } from '@/components/mdx-components';
import type { DocSection } from '@/lib/mdx';

// ── Icon map ─────────────────────────────────────────────────────────────

const iconMap: Record<string, LucideIcon> = {
    'book-open': BookOpen,
    'download': Download,
    'search': Search,
    'upload': Upload,
    'terminal': Terminal,
    'package': Package,
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

// ── Quick Copy Button ────────────────────────────────────────────────────

function QuickCopyCommand({ command }: { command: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [command]);

    return (
        <button
            onClick={handleCopy}
            className="group/copy flex items-center gap-3 w-full max-w-xl bg-zinc-900/80 border border-white/10 hover:border-cyan-500/30 rounded-xl px-5 py-3.5 transition-all hover:bg-zinc-900"
        >
            <span className="text-zinc-600 font-mono text-sm">$</span>
            <code className="flex-1 text-left text-sm font-mono text-zinc-300 group-hover/copy:text-white transition-colors">
                {command}
            </code>
            {copied ? (
                <Check className="size-4 text-emerald-400 shrink-0" />
            ) : (
                <Copy className="size-4 text-zinc-600 group-hover/copy:text-cyan-400 shrink-0 transition-colors" />
            )}
        </button>
    );
}

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

// ── Quick Start Card ─────────────────────────────────────────────────────

function QuickStartCard({ step, title, description, command, icon: Icon }: {
    step: number;
    title: string;
    description: string;
    command: string;
    icon: LucideIcon;
}) {
    const [copied, setCopied] = useState(false);

    return (
        <div className="group relative bg-zinc-900/50 border border-white/10 hover:border-cyan-500/20 rounded-xl p-5 transition-all hover:bg-zinc-900/80">
            <div className="flex items-center gap-3 mb-3">
                <div className="size-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold">
                    {step}
                </div>
                <div className="size-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Icon className="size-4 text-zinc-400" />
                </div>
                <h3 className="font-semibold text-white text-sm">{title}</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-3 leading-relaxed">{description}</p>
            <button
                onClick={() => {
                    navigator.clipboard.writeText(command);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-2 w-full bg-zinc-950 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-zinc-400 hover:text-white hover:border-cyan-500/20 transition-all"
            >
                <span className="text-zinc-600">$</span>
                <span className="flex-1 text-left truncate">{command}</span>
                {copied ? (
                    <Check className="size-3 text-emerald-400 shrink-0" />
                ) : (
                    <Copy className="size-3 text-zinc-600 shrink-0" />
                )}
            </button>
        </div>
    );
}

// ── Props ────────────────────────────────────────────────────────────────

interface DocsClientProps {
    sections: DocSection[];
}

// ── Main component ───────────────────────────────────────────────────────

export function DocsClient({ sections }: DocsClientProps) {
    const [searchOpen, setSearchOpen] = useState(false);

    const totalCommands = sections.reduce(
        (acc, sec) => acc + sec.commands.length, 0
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 flex flex-col">
            <ReadingProgressBar />
            <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
            <Navbar />
            <BackToTop />

            <div className="container mx-auto px-4 sm:px-6 py-8 lg:py-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    <DocsSidebar onSearchOpen={() => setSearchOpen(true)} />

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* Hero Section */}
                        <div className="mb-12">
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                    v1.1.4
                                </Badge>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                    {totalCommands > 0 ? totalCommands : 52} Commands
                                </Badge>
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                    42+ Agents
                                </Badge>
                                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                    Open Source
                                </Badge>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                                CLI Documentation
                            </h1>
                            <p className="text-lg text-zinc-400 max-w-2xl mb-6">
                                Complete reference for the Agent Skills CLI. Install, manage, and sync AI skills
                                across 42+ agents including Cursor, Claude Code, GitHub Copilot, Windsurf, Cline, Zed, and more.
                            </p>

                            {/* Quick Install Command */}
                            <div className="mb-8">
                                <p className="text-xs uppercase tracking-wider text-zinc-600 mb-2 font-medium">Quick Install</p>
                                <QuickCopyCommand command="npm install -g agent-skills-cli" />
                                <p className="text-xs text-zinc-600 mt-2 flex items-center gap-1.5">
                                    <Zap className="size-3" />
                                    Or use instantly with <code className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">npx agent-skills-cli</code> — no install needed
                                </p>
                            </div>

                            {/* Quick Start Guide — 3 Steps */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <Rocket className="size-4 text-cyan-400" />
                                    <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Quick Start in 3 Steps</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <QuickStartCard
                                        step={1}
                                        title="Install CLI"
                                        description="Install globally via npm, or use npx to run without installing"
                                        command="npm install -g agent-skills-cli"
                                        icon={Download}
                                    />
                                    <QuickStartCard
                                        step={2}
                                        title="Search Skills"
                                        description="Browse 175,000+ skills from the marketplace"
                                        command="skills search typescript"
                                        icon={Search}
                                    />
                                    <QuickStartCard
                                        step={3}
                                        title="Install a Skill"
                                        description="Auto-detects your agents and installs instantly"
                                        command="skills install @anthropic/xlsx"
                                        icon={Code2}
                                    />
                                </div>
                            </div>

                            {/* Keyboard shortcut hint */}
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="flex items-center gap-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                            >
                                <Search className="size-3" />
                                Press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] mx-0.5">⌘K</kbd> to search all {totalCommands > 0 ? totalCommands : 52} commands
                                <ChevronRight className="size-3" />
                            </button>
                        </div>

                        {/* Installation */}
                        <section id="installation" className="mb-16 scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Download className="size-6 text-cyan-400" />
                                Installation
                            </h2>
                            <InstallTabs />
                            <div className="mt-4 space-y-2">
                                <p className="text-zinc-400">
                                    Requires Node.js 18 or higher. After installation, the <code className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">skills</code> command will be available globally.
                                </p>
                                <div className="flex items-start gap-3 p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl text-sm">
                                    <Zap className="size-4 text-purple-400 mt-0.5 shrink-0" />
                                    <div>
                                        <span className="font-semibold text-purple-400">Don&apos;t want to install?</span>
                                        <span className="text-zinc-400"> Use </span>
                                        <code className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded text-xs">npx agent-skills-cli</code>
                                        <span className="text-zinc-400"> to run any command instantly without global installation. For example: </span>
                                        <code className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded text-xs">npx agent-skills-cli search react</code>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <div className="border-t border-white/10 my-12" />

                        {/* MDX Content Sections */}
                        {sections.map((section) => {
                            if (section.slug === 'getting-started') return null; // Already rendered above

                            const Icon = iconMap[section.icon] || Terminal;

                            return (
                                <section
                                    key={section.slug}
                                    id={section.slug}
                                    className="mb-16 scroll-mt-24"
                                >
                                    {/* Section Header */}
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="size-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                            <Icon className="size-5 text-cyan-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">
                                                {section.title}
                                            </h2>
                                            <p className="text-sm text-zinc-400">
                                                {section.description}
                                            </p>
                                        </div>
                                        {section.commands.length > 0 && (
                                            <Badge variant="outline" className="ml-auto text-zinc-500">
                                                {section.commands.length} command{section.commands.length !== 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* MDX Content rendered via react-markdown */}
                                    <div className="docs-content">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={mdxComponents as unknown as Record<string, React.ComponentType>}
                                        >
                                            {section.content}
                                        </ReactMarkdown>
                                    </div>
                                </section>
                            );
                        })}

                        {/* Footer CTA */}
                        <section className="mt-16 p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl text-center">
                            <h3 className="text-2xl font-bold mb-3">Ready to get started?</h3>
                            <p className="text-zinc-400 mb-4">Browse 175,000+ skills in our marketplace or install your first skill right now.</p>
                            <div className="mb-6">
                                <QuickCopyCommand command="npx agent-skills-cli search react" />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/marketplace"
                                    className="rounded-full font-semibold relative cursor-pointer hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center justify-center gap-2 text-center bg-gradient-to-b from-cyan-400 to-cyan-600 text-black shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-6 py-3"
                                >
                                    <Search className="size-4" />
                                    Browse Marketplace
                                </Link>
                                <a
                                    href="https://github.com/Karanjot786/agent-skills-cli"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="rounded-full font-semibold relative cursor-pointer hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center justify-center gap-2 text-center border border-white/20 hover:bg-white/5 text-white px-6 py-3"
                                >
                                    <ExternalLink className="size-4" />
                                    View on GitHub
                                </a>
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            <Footer />
        </div>
    );
}
