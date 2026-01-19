'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    BookOpen,
    Terminal,
    Package,
    Upload,
    Wrench,
    ChevronDown,
    Search
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

const sections: SidebarSection[] = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: <BookOpen className="size-4" />,
        items: [
            { id: 'installation', label: 'Installation' },
            { id: 'quickstart', label: 'Quick Start' },
            { id: 'platforms', label: 'Platform Support' },
        ]
    },
    {
        id: 'core',
        title: 'Core Commands',
        icon: <Terminal className="size-4" />,
        items: [
            { id: 'list', label: 'list' },
            { id: 'show', label: 'show' },
            { id: 'validate', label: 'validate' },
            { id: 'init', label: 'init' },
            { id: 'prompt', label: 'prompt' },
            { id: 'search', label: 'search', alias: 's' },
        ]
    },
    {
        id: 'marketplace',
        title: 'Marketplace',
        icon: <Package className="size-4" />,
        items: [
            { id: 'market-list', label: 'market-list', alias: 'ml' },
            { id: 'market-search', label: 'market-search', alias: 'ms' },
            { id: 'install', label: 'install', alias: 'i' },
            { id: 'install-url', label: 'install-url', alias: 'iu' },
            { id: 'market-installed', label: 'market-installed', alias: 'mind' },
            { id: 'market-uninstall', label: 'market-uninstall', alias: 'mu' },
            { id: 'market-sources', label: 'market-sources' },
            { id: 'market-add-source', label: 'market-add-source' },
            { id: 'market-update-check', label: 'market-update-check', alias: 'muc' },
        ]
    },
    {
        id: 'export',
        title: 'Export',
        icon: <Upload className="size-4" />,
        items: [
            { id: 'export', label: 'export' },
            { id: 'sync', label: 'sync' },
            { id: 'setup', label: 'setup' },
            { id: 'export-interactive', label: 'export-interactive', alias: 'ei' },
        ]
    },
    {
        id: 'utilities',
        title: 'Utilities',
        icon: <Wrench className="size-4" />,
        items: [
            { id: 'run', label: 'run' },
            { id: 'scripts', label: 'scripts' },
            { id: 'context', label: 'context' },
            { id: 'preview', label: 'preview' },
            { id: 'assets', label: 'assets' },
            { id: 'info', label: 'info' },
            { id: 'update', label: 'update' },
            { id: 'doctor', label: 'doctor' },
            { id: 'completion', label: 'completion' },
        ]
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

        // Observe all section elements
        const allIds = sections.flatMap(s => s.items.map(i => i.id));
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
            // Check if the item is outside the visible area of the nav
            const nav = navRef.current;
            const itemTop = activeItem.offsetTop;
            const itemBottom = itemTop + activeItem.offsetHeight;
            const navScrollTop = nav.scrollTop;
            const navHeight = nav.clientHeight;

            if (itemTop < navScrollTop + 60) {
                // Item is above visible area
                nav.scrollTo({ top: itemTop - 60, behavior: 'smooth' });
            } else if (itemBottom > navScrollTop + navHeight - 60) {
                // Item is below visible area
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
                        const hasActiveItem = section.items.some(item => item.id === activeId);

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
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full flex items-center gap-2 p-4 text-left"
                                >
                                    <span className={`${hasActiveItem ? 'text-cyan-400' : 'text-zinc-400'}`}>
                                        {section.icon}
                                    </span>
                                    <span className={`font-semibold text-sm flex-1 ${hasActiveItem ? 'text-white' : 'text-zinc-300'
                                        }`}>
                                        {section.title}
                                    </span>
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
                                </button>

                                {/* Section Items */}
                                {isExpanded && (
                                    <ul className="px-2 pb-3 space-y-0.5">
                                        {section.items.map((item) => {
                                            const isActive = activeId === item.id;
                                            const isCommand = section.id !== 'getting-started';

                                            return (
                                                <li key={item.id}>
                                                    <button
                                                        ref={(el) => { if (el) itemRefs.current.set(item.id, el); }}
                                                        onClick={() => handleItemClick(item.id)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${isActive
                                                            ? 'bg-cyan-500/20 text-cyan-400'
                                                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                                            } ${isCommand ? 'font-mono text-xs' : ''}`}
                                                    >
                                                        {/* Active indicator */}
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
                        <span className="text-zinc-600">v1.0.2</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
