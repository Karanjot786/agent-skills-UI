'use client';

import { useState } from 'react';
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
            <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
            <Navbar />
            <div className="container mx-auto px-4 sm:px-6 py-8 lg:py-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    <DocsSidebar onSearchOpen={() => setSearchOpen(true)} />

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* Hero Section */}
                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                    v1.1.1
                                </Badge>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                    {totalCommands > 0 ? totalCommands : 52} Commands
                                </Badge>
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                    42 Agents
                                </Badge>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                                CLI Documentation
                            </h1>
                            <p className="text-lg text-zinc-400 max-w-2xl">
                                Complete reference for the Agent Skills CLI. Install, manage, and sync AI skills
                                across 42 agents including Cursor, Claude Code, GitHub Copilot, Windsurf, Cline, Zed, and more.
                            </p>
                        </div>

                        {/* Installation */}
                        <section id="installation" className="mb-16 scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Download className="size-6 text-cyan-400" />
                                Installation
                            </h2>
                            <InstallTabs />
                            <p className="mt-4 text-zinc-400">
                                Requires Node.js 18 or higher. After installation, the <code className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">skills</code> command will be available globally.
                            </p>
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
                            <p className="text-zinc-400 mb-6">Browse 175,000+ skills in our marketplace</p>
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
