'use client';

import React, { useState, useEffect, useRef } from 'react';
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
    type LucideIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SidebarSection {
    id: string;
    title: string;
    icon: React.ReactNode;
    items: { id: string; label: string; alias?: string }[];
}

interface DocsSidebarProps {
    onSearchOpen: () => void;
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

const sections: SidebarSection[] = [
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
];

export function DocsSidebar({ onSearchOpen }: DocsSidebarProps) {
    const [activeId, setActiveId] = useState<string>('installation');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(sections.map(s => s.id))
    );
    const navRef = useRef<HTMLElement>(null);
    const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    // Scroll spy - track which section is in view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-20% 0% -70% 0%', threshold: 0 }
        );

        // Observe all section and item elements
        const allIds = [
            ...sections.map(s => s.id),
            ...sections.flatMap(s => s.items.map(i => i.id)),
            'installation',
        ];
        allIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, []);

    // Auto-scroll sidebar to keep active item visible
    useEffect(() => {
        const activeItem = itemRefs.current.get(activeId);
        if (activeItem && navRef.current) {
            const nav = navRef.current;
            const itemTop = activeItem.offsetTop;
            const itemBottom = itemTop + activeItem.offsetHeight;
            const navScrollTop = nav.scrollTop;
            const navHeight = nav.clientHeight;

            if (itemTop < navScrollTop + 60) {
                nav.scrollTo({ top: itemTop - 60, behavior: 'smooth' });
            } else if (itemBottom > navScrollTop + navHeight - 60) {
                nav.scrollTo({ top: itemBottom - navHeight + 60, behavior: 'smooth' });
            }
        }
    }, [activeId]);

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

    const handleItemClick = (itemId: string) => {
        setActiveId(itemId);
        const element = document.getElementById(itemId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleSectionClick = (sectionId: string) => {
        setActiveId(sectionId);
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <aside className="w-full lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] flex flex-col">
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

                {/* Scrollable Navigation Sections */}
                <nav ref={navRef} className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-600">
                    {sections.map((section) => {
                        const isExpanded = expandedSections.has(section.id);
                        const hasActiveItem = section.items.some(item => item.id === activeId) || activeId === section.id;

                        return (
                            <div
                                key={section.id}
                                className={`rounded-xl border transition-all ${hasActiveItem
                                    ? 'bg-zinc-900/70 border-cyan-500/20'
                                    : 'bg-zinc-900/50 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                {/* Section Header */}
                                <button
                                    onClick={() => {
                                        if (section.items.length > 0) {
                                            toggleSection(section.id);
                                        }
                                        handleSectionClick(section.id);
                                    }}
                                    className="w-full flex items-center gap-2 p-4 text-left"
                                >
                                    <span className={`${hasActiveItem ? 'text-cyan-400' : 'text-zinc-400'}`}>
                                        {section.icon}
                                    </span>
                                    <span className={`font-semibold text-sm flex-1 ${hasActiveItem ? 'text-white' : 'text-zinc-300'
                                        }`}>
                                        {section.title}
                                    </span>
                                    {section.items.length > 0 && (
                                        <>
                                            <Badge
                                                variant="outline"
                                                className={`text-xs ${hasActiveItem
                                                    ? 'text-cyan-400 border-cyan-500/30'
                                                    : 'text-zinc-500 border-zinc-700'
                                                    }`}
                                            >
                                                {section.items.length}
                                            </Badge>
                                            <ChevronDown
                                                className={`size-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'
                                                    }`}
                                            />
                                        </>
                                    )}
                                </button>

                                {/* Section Items */}
                                {isExpanded && section.items.length > 0 && (
                                    <ul className="px-2 pb-3 space-y-0.5">
                                        {section.items.map((item) => {
                                            const isActive = activeId === item.id;

                                            return (
                                                <li key={item.id}>
                                                    <button
                                                        ref={(el) => { if (el) itemRefs.current.set(item.id, el); }}
                                                        onClick={() => handleItemClick(item.id)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 font-mono text-xs ${isActive
                                                            ? 'bg-cyan-500/20 text-cyan-400'
                                                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-cyan-400' : 'bg-transparent'
                                                            }`} />
                                                        <span className="flex-1">{item.label}</span>
                                                        {item.alias && (
                                                            <span className="text-zinc-600 text-[10px]">
                                                                {item.alias}
                                                            </span>
                                                        )}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
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
                        <a href="/marketplace" className="hover:text-cyan-400 transition-colors">
                            Marketplace
                        </a>
                        <span>•</span>
                        <span className="text-zinc-600">v1.0.9</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
