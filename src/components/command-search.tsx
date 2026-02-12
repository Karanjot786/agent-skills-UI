'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import {
    Search, Terminal, Package, Upload, Wrench, X,
    Download, Sparkles, MessageSquare, BarChart3,
    Hammer, Star, Users, Zap, Clock, Layers
} from 'lucide-react';

// All 52 CLI commands organized by category
const commands = [
    // Install & Add
    { name: 'install', alias: 'i', category: 'Install & Add', description: 'Install skills from marketplace, GitHub, URLs, or local' },
    { name: 'add', alias: null, category: 'Install & Add', description: 'Alias for install' },
    // Search
    { name: 'search', alias: 's', category: 'Search', description: 'Interactive skill search with FZF-style filtering' },
    // Export & Convert
    { name: 'export', alias: null, category: 'Export & Convert', description: 'Export skills to agent formats' },
    { name: 'convert', alias: 'cv', category: 'Export & Convert', description: 'Convert between agent formats' },
    { name: 'bootstrap', alias: 'bs', category: 'Export & Convert', description: 'Auto-generate agent instruction files' },
    // Core Commands
    { name: 'list', alias: null, category: 'Core', description: 'List all discovered skills' },
    { name: 'show', alias: null, category: 'Core', description: 'Display detailed skill information' },
    { name: 'validate', alias: null, category: 'Core', description: 'Validate a skill against spec' },
    { name: 'prompt', alias: null, category: 'Core', description: 'Generate system prompt XML' },
    { name: 'init', alias: null, category: 'Core', description: 'Create a new skill from template' },
    // Marketplace
    { name: 'market-list', alias: 'ml', category: 'Marketplace', description: 'List marketplace skills' },
    { name: 'market-search', alias: 'ms', category: 'Marketplace', description: 'Search marketplace by keyword' },
    { name: 'market-install', alias: 'mi', category: 'Marketplace', description: 'Install from marketplace' },
    { name: 'install-url', alias: 'iu', category: 'Marketplace', description: 'Install from GitHub URL' },
    { name: 'market-uninstall', alias: 'mu', category: 'Marketplace', description: 'Uninstall marketplace skill' },
    { name: 'market-installed', alias: 'mind', category: 'Marketplace', description: 'List installed marketplace skills' },
    { name: 'market-sources', alias: null, category: 'Marketplace', description: 'List marketplace sources' },
    { name: 'market-add-source', alias: null, category: 'Marketplace', description: 'Add custom marketplace source' },
    { name: 'market-update-check', alias: 'muc', category: 'Marketplace', description: 'Check for skill updates' },
    // Utilities
    { name: 'doctor', alias: null, category: 'Utilities', description: 'Diagnose installation issues' },
    { name: 'check', alias: null, category: 'Utilities', description: 'Check installed skills and updates' },
    { name: 'update', alias: null, category: 'Utilities', description: 'Update installed skills' },
    { name: 'exec', alias: null, category: 'Utilities', description: 'Execute bundled script' },
    { name: 'run', alias: null, category: 'Utilities', description: 'Run skill script with timeout' },
    { name: 'remove', alias: 'rm', category: 'Utilities', description: 'Remove installed skills' },
    { name: 'assets', alias: null, category: 'Utilities', description: 'Fetch skill assets from GitHub' },
    // Interactive Wizards
    { name: 'install-wizard', alias: 'iw', category: 'Interactive', description: 'Interactive skill installation wizard' },
    { name: 'export-interactive', alias: 'ei', category: 'Interactive', description: 'Interactive export with agent selection' },
    { name: 'setup', alias: null, category: 'Interactive', description: 'Full interactive setup wizard' },
    // Context & Prompt
    { name: 'context', alias: null, category: 'Context', description: 'Generate AI context in XML/JSON/Markdown' },
    { name: 'preview', alias: null, category: 'Context', description: 'Open skill in browser' },
    { name: 'scripts', alias: null, category: 'Context', description: 'List skill scripts with safety analysis' },
    { name: 'info', alias: null, category: 'Context', description: 'Show installation status and paths' },
    { name: 'completion', alias: null, category: 'Context', description: 'Generate shell completions' },
    // Project Analysis
    { name: 'suggest', alias: 'sg', category: 'Analysis', description: 'Get skill suggestions for your project' },
    { name: 'audit', alias: null, category: 'Analysis', description: 'Security audit for skills' },
    { name: 'mine', alias: 'mn', category: 'Analysis', description: 'Extract patterns from git history' },
    { name: 'insight', alias: 'in', category: 'Analysis', description: 'Analyze skill patterns and gaps' },
    // Skill Creation
    { name: 'craft', alias: null, category: 'Creation', description: 'Create skill with full directory structure' },
    { name: 'forge', alias: 'fg', category: 'Creation', description: 'AI-generate skill from description' },
    { name: 'capture', alias: 'cp', category: 'Creation', description: 'Capture URL/file as a skill' },
    { name: 'submit', alias: null, category: 'Creation', description: 'Submit skill to marketplace' },
    { name: 'submit-repo', alias: null, category: 'Creation', description: 'Submit GitHub repo for indexing' },
    // Quality & Scoring
    { name: 'score', alias: null, category: 'Quality', description: 'Score skill quality (0-100)' },
    // Team & Collaboration
    { name: 'collab', alias: 'cl', category: 'Team', description: 'Team skill collaboration' },
    { name: 'lockspec', alias: 'ls', category: 'Team', description: 'Generate/apply skill manifest' },
    { name: 'grid', alias: 'gd', category: 'Team', description: 'P2P skill sharing on local network' },
    // Automation & Rules
    { name: 'trigger', alias: 'tr', category: 'Automation', description: 'Auto-trigger skills on events' },
    { name: 'rule', alias: 'rl', category: 'Automation', description: 'Manage always-on coding rules' },
    { name: 'blueprint', alias: 'bp', category: 'Automation', description: 'Structured development plans' },
    { name: 'ci', alias: null, category: 'Automation', description: 'Generate CI/CD workflow' },
    // Session Management
    { name: 'track', alias: 'tk', category: 'Session', description: 'Save and restore session state' },
    { name: 'recall', alias: 'rc', category: 'Session', description: 'Store/recall context across sessions' },
    { name: 'method', alias: 'mt', category: 'Session', description: 'Apply development methodology packs' },
];

const categoryIcons: Record<string, React.ReactNode> = {
    'Install & Add': <Download className="size-4" />,
    'Search': <Search className="size-4" />,
    'Export & Convert': <Upload className="size-4" />,
    'Core': <Terminal className="size-4" />,
    'Marketplace': <Package className="size-4" />,
    'Utilities': <Wrench className="size-4" />,
    'Interactive': <Sparkles className="size-4" />,
    'Context': <MessageSquare className="size-4" />,
    'Analysis': <BarChart3 className="size-4" />,
    'Creation': <Hammer className="size-4" />,
    'Quality': <Star className="size-4" />,
    'Team': <Users className="size-4" />,
    'Automation': <Zap className="size-4" />,
    'Session': <Clock className="size-4" />,
};

const categoryOrder = [
    'Install & Add', 'Search', 'Export & Convert', 'Core', 'Marketplace',
    'Utilities', 'Interactive', 'Context', 'Analysis', 'Creation',
    'Quality', 'Team', 'Automation', 'Session'
];

interface CommandSearchProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (open) {
            inputRef.current?.focus();
        }
    }, [open]);

    // Keyboard shortcut to open
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onOpenChange(!open);
            }
            if (e.key === 'Escape') {
                onOpenChange(false);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [open, onOpenChange]);

    const handleSelect = (commandName: string) => {
        onOpenChange(false);
        const element = document.getElementById(commandName);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />

            {/* Dialog */}
            <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl">
                <Command className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                    <div className="flex items-center border-b border-white/10 px-4">
                        <Search className="size-4 text-zinc-500 mr-3" />
                        <Command.Input
                            ref={inputRef}
                            placeholder="Search 52 commands..."
                            className="flex-1 h-14 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
                        />
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    <Command.List className="max-h-[400px] overflow-y-auto p-2">
                        <Command.Empty className="py-8 text-center text-zinc-500">
                            No commands found.
                        </Command.Empty>

                        {categoryOrder.map((category) => (
                            <Command.Group
                                key={category}
                                heading={
                                    <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                        {categoryIcons[category]}
                                        {category}
                                    </div>
                                }
                            >
                                {commands
                                    .filter((cmd) => cmd.category === category)
                                    .map((cmd) => (
                                        <Command.Item
                                            key={cmd.name}
                                            value={`${cmd.name} ${cmd.alias || ''} ${cmd.description}`}
                                            onSelect={() => handleSelect(cmd.name)}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-zinc-300 data-[selected=true]:bg-cyan-500/20 data-[selected=true]:text-cyan-400 transition-colors"
                                        >
                                            <span className="font-mono font-medium">{cmd.name}</span>
                                            {cmd.alias && (
                                                <span className="text-xs text-zinc-600">({cmd.alias})</span>
                                            )}
                                            <span className="flex-1 text-sm text-zinc-500 truncate">
                                                {cmd.description}
                                            </span>
                                        </Command.Item>
                                    ))}
                            </Command.Group>
                        ))}
                    </Command.List>

                    <div className="border-t border-white/10 px-4 py-3 flex items-center justify-between text-xs text-zinc-500">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-zinc-400">↑↓</kbd>
                                navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-zinc-400">↵</kbd>
                                select
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-zinc-400">esc</kbd>
                                close
                            </span>
                        </div>
                        <span className="text-zinc-600">52 commands</span>
                    </div>
                </Command>
            </div>
        </div>
    );
}
