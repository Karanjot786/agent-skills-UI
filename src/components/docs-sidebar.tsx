'use client';

import React, { useState, useRef } from 'react';
import { Link } from '@/i18n/navigation';
import {
    BookOpen,
    Terminal,
    Package,
    Upload,
    Wrench,
    ChevronDown,
    Search,
    Download,
    Sparkles,
    MessageSquare,
    BarChart3,
    Hammer,
    Star,
    Users,
    Zap,
    Clock,
    Layers,
    Menu,
    type LucideIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from '@/components/ui/sheet';
import type { DocSectionMeta } from '@/lib/mdx';

interface SidebarSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    items: { id: string; label: string; alias?: string }[];
}

interface SidebarCategory {
    label: string;
    description: string;
    sections: SidebarSection[];
}

interface DocsSidebarProps {
    onSearchOpen: () => void;
    activeSlug?: string;
    allSections?: DocSectionMeta[];
}

const iconComponents: Record<string, LucideIcon> = {
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

// Grouped sections for better navigation
const sidebarCategories: SidebarCategory[] = [
    {
        label: 'Getting Started',
        description: 'Install and learn the basics',
        sections: [
            {
                id: 'getting-started',
                title: 'Getting Started',
                icon: <BookOpen className="size-4" />,
                items: [
                    { id: 'installation', label: 'Installation' },
                ]
            },
            {
                id: 'install',
                title: 'Install & Add',
                icon: <Download className="size-4" />,
                items: [
                    { id: 'install--add', label: 'install / add', alias: 'i' },
                ]
            },
            {
                id: 'search',
                title: 'Search',
                icon: <Search className="size-4" />,
                items: [
                    { id: 'search-cmd', label: 'search', alias: 's' },
                ]
            },
        ],
    },
    {
        label: 'Core',
        description: 'Essential daily commands',
        sections: [
            {
                id: 'core-commands',
                title: 'Core Commands',
                icon: <Terminal className="size-4" />,
                items: [
                    { id: 'list', label: 'list' },
                    { id: 'show', label: 'show' },
                    { id: 'validate', label: 'validate' },
                    { id: 'prompt', label: 'prompt' },
                    { id: 'init', label: 'init' },
                ]
            },
            {
                id: 'export-convert',
                title: 'Export & Convert',
                icon: <Upload className="size-4" />,
                items: [
                    { id: 'export', label: 'export' },
                    { id: 'convert', label: 'convert', alias: 'cv' },
                    { id: 'bootstrap', label: 'bootstrap', alias: 'bs' },
                ]
            },
            {
                id: 'marketplace',
                title: 'Marketplace',
                icon: <Package className="size-4" />,
                items: [
                    { id: 'market-list', label: 'market-list', alias: 'ml' },
                    { id: 'market-search', label: 'market-search', alias: 'ms' },
                    { id: 'market-install', label: 'market-install', alias: 'mi' },
                    { id: 'install-url', label: 'install-url', alias: 'iu' },
                    { id: 'market-uninstall', label: 'market-uninstall', alias: 'mu' },
                    { id: 'market-installed', label: 'market-installed', alias: 'mind' },
                    { id: 'market-sources', label: 'market-sources' },
                    { id: 'market-add-source', label: 'market-add-source' },
                    { id: 'market-update-check', label: 'market-update-check', alias: 'muc' },
                ]
            },
            {
                id: 'utilities',
                title: 'Utilities',
                icon: <Wrench className="size-4" />,
                items: [
                    { id: 'doctor', label: 'doctor' },
                    { id: 'check', label: 'check' },
                    { id: 'update', label: 'update' },
                    { id: 'exec', label: 'exec' },
                    { id: 'run', label: 'run' },
                    { id: 'remove', label: 'remove', alias: 'rm' },
                    { id: 'assets', label: 'assets' },
                ]
            },
        ],
    },
    {
        label: 'Advanced',
        description: 'Power-user features',
        sections: [
            {
                id: 'interactive-wizards',
                title: 'Interactive Wizards',
                icon: <Sparkles className="size-4" />,
                items: [
                    { id: 'install-wizard', label: 'install-wizard', alias: 'iw' },
                    { id: 'export-interactive', label: 'export-interactive', alias: 'ei' },
                    { id: 'setup', label: 'setup' },
                ]
            },
            {
                id: 'context-prompt',
                title: 'Context & Prompt',
                icon: <MessageSquare className="size-4" />,
                items: [
                    { id: 'context', label: 'context' },
                    { id: 'preview', label: 'preview' },
                    { id: 'scripts', label: 'scripts' },
                    { id: 'info', label: 'info' },
                    { id: 'completion', label: 'completion' },
                ]
            },
            {
                id: 'project-analysis',
                title: 'Project Analysis',
                icon: <BarChart3 className="size-4" />,
                items: [
                    { id: 'suggest', label: 'suggest', alias: 'sg' },
                    { id: 'audit', label: 'audit' },
                    { id: 'mine', label: 'mine', alias: 'mn' },
                    { id: 'insight', label: 'insight', alias: 'in' },
                ]
            },
            {
                id: 'skill-creation',
                title: 'Skill Creation',
                icon: <Hammer className="size-4" />,
                items: [
                    { id: 'craft', label: 'craft' },
                    { id: 'forge', label: 'forge', alias: 'fg' },
                    { id: 'capture', label: 'capture', alias: 'cp' },
                    { id: 'submit', label: 'submit' },
                    { id: 'submit-repo', label: 'submit-repo' },
                ]
            },
            {
                id: 'quality-scoring',
                title: 'Quality & Scoring',
                icon: <Star className="size-4" />,
                items: [
                    { id: 'score', label: 'score' },
                ]
            },
        ],
    },
    {
        label: 'Team & Automation',
        description: 'Collaboration and CI/CD',
        sections: [
            {
                id: 'team-collaboration',
                title: 'Team & Collaboration',
                icon: <Users className="size-4" />,
                items: [
                    { id: 'collab', label: 'collab', alias: 'cl' },
                    { id: 'lockspec', label: 'lockspec', alias: 'ls' },
                    { id: 'grid', label: 'grid', alias: 'gd' },
                ]
            },
            {
                id: 'automation-rules',
                title: 'Automation & Rules',
                icon: <Zap className="size-4" />,
                items: [
                    { id: 'trigger', label: 'trigger', alias: 'tr' },
                    { id: 'rule', label: 'rule', alias: 'rl' },
                    { id: 'blueprint', label: 'blueprint', alias: 'bp' },
                    { id: 'ci', label: 'ci' },
                ]
            },
            {
                id: 'session-management',
                title: 'Session Management',
                icon: <Clock className="size-4" />,
                items: [
                    { id: 'track', label: 'track', alias: 'tk' },
                    { id: 'recall', label: 'recall', alias: 'rc' },
                    { id: 'method', label: 'method', alias: 'mt' },
                ]
            },
            {
                id: 'adapter-pattern',
                title: 'Adapter Pattern',
                icon: <Layers className="size-4" />,
                items: []
            },
        ],
    },
];

// Flatten for quick lookup
const allSidebarSections = sidebarCategories.flatMap(c => c.sections);

export function DocsSidebar({ onSearchOpen, activeSlug, allSections }: DocsSidebarProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(allSidebarSections.map(s => s.id))
    );
    const [mobileOpen, setMobileOpen] = useState(false);
    const navRef = useRef<HTMLElement>(null);

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    };

    // Find current section name for mobile button
    const currentSection = allSidebarSections.find(s => s.id === activeSlug);

    const sidebarContent = (
        <>
            {/* Search Button */}
            <button
                onClick={onSearchOpen}
                className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-cyan-500/30 transition-all group mb-4 shrink-0"
            >
                <Search className="size-4" />
                <span className="flex-1 text-left text-sm">Search commands...</span>
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded text-xs text-zinc-500 group-hover:text-zinc-300">
                    ⌘K
                </kbd>
            </button>

            {/* All Docs link */}
            <Link
                href="/docs"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all mb-3 ${
                    !activeSlug
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setMobileOpen(false)}
            >
                <BookOpen className="size-4" />
                <span className="font-medium">All Documentation</span>
            </Link>

            {/* Scrollable Navigation with Category Groups */}
            <nav ref={navRef} className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-600">
                {sidebarCategories.map((category) => (
                    <div key={category.label}>
                        {/* Category Label */}
                        <div className="px-3 mb-2">
                            <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-600">
                                {category.label}
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            {category.sections.map((section) => {
                                const isExpanded = expandedSections.has(section.id);
                                const isActive = activeSlug === section.id;

                                return (
                                    <div
                                        key={section.id}
                                        className={`rounded-xl border transition-all ${isActive
                                            ? 'bg-zinc-900/70 border-cyan-500/20'
                                            : 'bg-zinc-900/50 border-white/5 hover:border-white/15'
                                            }`}
                                    >
                                        {/* Section Header — navigates to doc page */}
                                        <div className="flex items-center">
                                            <Link
                                                href={`/docs/${section.id}`}
                                                onClick={() => setMobileOpen(false)}
                                                className="flex-1 flex items-center gap-2 px-3 py-2.5 text-left"
                                            >
                                                <span className={`${isActive ? 'text-cyan-400' : 'text-zinc-500'}`}>
                                                    {section.icon}
                                                </span>
                                                <span className={`font-medium text-sm flex-1 ${isActive ? 'text-white' : 'text-zinc-400'
                                                    }`}>
                                                    {section.title}
                                                </span>
                                                {section.items.length > 0 && (
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] px-1.5 py-0 ${isActive
                                                            ? 'text-cyan-400 border-cyan-500/30'
                                                            : 'text-zinc-600 border-zinc-800'
                                                            }`}
                                                    >
                                                        {section.items.length}
                                                    </Badge>
                                                )}
                                            </Link>
                                            {section.items.length > 0 && (
                                                <button
                                                    onClick={() => toggleSection(section.id)}
                                                    className="px-2 py-2.5 text-zinc-600 hover:text-zinc-400 transition-colors"
                                                >
                                                    <ChevronDown
                                                        className={`size-3.5 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'
                                                            }`}
                                                    />
                                                </button>
                                            )}
                                        </div>

                                        {/* Section Items — link to page with hash */}
                                        {isExpanded && section.items.length > 0 && (
                                            <ul className="px-2 pb-2 space-y-0.5">
                                                {section.items.map((item) => (
                                                    <li key={item.id}>
                                                        <Link
                                                            href={`/docs/${section.id}#${item.id}`}
                                                            onClick={() => setMobileOpen(false)}
                                                            className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 font-mono text-xs ${
                                                                isActive
                                                                    ? 'text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                                                                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                                            }`}
                                                        >
                                                            <span className={`w-1 h-1 rounded-full transition-colors shrink-0 ${
                                                                isActive ? 'bg-cyan-500/50' : 'bg-zinc-700'
                                                            }`} />
                                                            <span className="flex-1 truncate">{item.label}</span>
                                                            {item.alias && (
                                                                <span className="text-zinc-700 text-[10px]">
                                                                    {item.alias}
                                                                </span>
                                                            )}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Quick Links */}
            <div className="pt-4 mt-4 border-t border-white/10 shrink-0">
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <a
                        href="https://github.com/Karanjot786/agent-skills-cli"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-cyan-400 transition-colors"
                    >
                        GitHub
                    </a>
                    <span>•</span>
                    <Link href="/marketplace" className="hover:text-cyan-400 transition-colors">
                        Marketplace
                    </Link>
                    <span>•</span>
                    <span className="text-zinc-600">v1.1.4</span>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Floating Sidebar Button */}
            <div className="lg:hidden fixed bottom-6 left-4 z-50">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                    <SheetTrigger asChild>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/95 border border-white/10 rounded-full shadow-lg shadow-black/30 backdrop-blur-sm text-sm text-zinc-300 hover:text-white hover:border-cyan-500/30 transition-all">
                            <Menu className="size-4" />
                            <span className="max-w-[120px] truncate">{currentSection?.title || 'Navigation'}</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 bg-zinc-950 border-white/10 p-4 flex flex-col">
                        <div className="flex flex-col h-full">
                            {sidebarContent}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Sidebar */}
            <aside className="w-full lg:w-72 shrink-0 hidden lg:block">
                <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] flex flex-col">
                    {sidebarContent}
                </div>
            </aside>
        </>
    );
}
