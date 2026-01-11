'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, Terminal, Package, Upload, Wrench, X } from 'lucide-react';

// Command data for search
const commands = [
    // Core commands
    { name: 'list', alias: null, category: 'Core', description: 'List all discovered skills' },
    { name: 'show', alias: null, category: 'Core', description: 'Display detailed skill information' },
    { name: 'validate', alias: null, category: 'Core', description: 'Validate a skill' },
    { name: 'init', alias: null, category: 'Core', description: 'Create a new skill from template' },
    { name: 'prompt', alias: null, category: 'Core', description: 'Generate system prompt XML' },
    // Marketplace
    { name: 'market-list', alias: 'ml', category: 'Marketplace', description: 'List marketplace skills' },
    { name: 'market-search', alias: 'ms', category: 'Marketplace', description: 'Search marketplace' },
    { name: 'install', alias: 'i', category: 'Marketplace', description: 'Install a skill' },
    { name: 'install-url', alias: 'iu', category: 'Marketplace', description: 'Install from GitHub URL' },
    { name: 'market-installed', alias: 'mind', category: 'Marketplace', description: 'List installed skills' },
    { name: 'market-uninstall', alias: 'mu', category: 'Marketplace', description: 'Uninstall a skill' },
    { name: 'market-sources', alias: null, category: 'Marketplace', description: 'List marketplace sources' },
    { name: 'market-add-source', alias: null, category: 'Marketplace', description: 'Add marketplace source' },
    { name: 'market-update-check', alias: 'muc', category: 'Marketplace', description: 'Check for updates' },
    // Export
    { name: 'export', alias: null, category: 'Export', description: 'Export skills to agents' },
    { name: 'sync', alias: null, category: 'Export', description: 'Sync to .agent/workflows' },
    { name: 'setup', alias: null, category: 'Export', description: 'Interactive setup wizard' },
    { name: 'export-interactive', alias: 'ei', category: 'Export', description: 'Interactive export wizard' },
    // Utilities
    { name: 'run', alias: null, category: 'Utilities', description: 'Execute skill script' },
    { name: 'scripts', alias: null, category: 'Utilities', description: 'List skill scripts' },
    { name: 'context', alias: null, category: 'Utilities', description: 'Generate AI context' },
    { name: 'preview', alias: null, category: 'Utilities', description: 'Open skill in browser' },
    { name: 'assets', alias: null, category: 'Utilities', description: 'List skill assets' },
    { name: 'info', alias: null, category: 'Utilities', description: 'Show installation status' },
    { name: 'update', alias: null, category: 'Utilities', description: 'Update installed skills' },
    { name: 'doctor', alias: null, category: 'Utilities', description: 'Diagnose issues' },
    { name: 'completion', alias: null, category: 'Utilities', description: 'Shell completions' },
];

const categoryIcons: Record<string, React.ReactNode> = {
    Core: <Terminal className="size-4" />,
    Marketplace: <Package className="size-4" />,
    Export: <Upload className="size-4" />,
    Utilities: <Wrench className="size-4" />,
};

interface CommandSearchProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
    const router = useRouter();
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
        // Navigate to the command section
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
                            placeholder="Search commands..."
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

                        {['Core', 'Marketplace', 'Export', 'Utilities'].map((category) => (
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
                    </div>
                </Command>
            </div>
        </div>
    );
}
