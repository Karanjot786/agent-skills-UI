'use client';

import { useState } from 'react';
import { CopyButton } from './copy-button';

interface PlatformInstallTabsProps {
    scopedName: string;
}

const platforms = [
    { id: 'auto', label: 'Auto-detect', command: (name: string) => `skills install ${name}` },
    { id: 'all', label: 'All Platforms', command: (name: string) => `skills install ${name} --all` },
    { id: 'claude', label: 'Claude', command: (name: string) => `skills install ${name} -t claude` },
    { id: 'cursor', label: 'Cursor', command: (name: string) => `skills install ${name} -t cursor` },
    { id: 'copilot', label: 'Copilot', command: (name: string) => `skills install ${name} -t copilot` },
    { id: 'codex', label: 'Codex', command: (name: string) => `skills install ${name} -t codex` },
    { id: 'antigravity', label: 'Antigravity', command: (name: string) => `skills install ${name} -t antigravity` },
];

export function PlatformInstallTabs({ scopedName }: PlatformInstallTabsProps) {
    const [activeTab, setActiveTab] = useState(0);
    const currentCommand = platforms[activeTab].command(scopedName);

    return (
        <div className="rounded-xl border border-white/10 overflow-hidden bg-black/60">
            {/* Tab headers */}
            <div className="flex flex-wrap border-b border-white/10 bg-zinc-900/50">
                {platforms.map((platform, index) => (
                    <button
                        key={platform.id}
                        onClick={() => setActiveTab(index)}
                        className={`px-4 py-2.5 text-xs font-medium transition-colors ${activeTab === index
                            ? 'text-cyan-400 border-b-2 border-cyan-400 -mb-[1px] bg-zinc-900/50'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {platform.label}
                    </button>
                ))}
            </div>

            {/* Command content */}
            <div className="flex items-center gap-3 p-4 font-mono text-sm">
                <span className="text-cyan-500 select-none">$</span>
                <span className="flex-1 text-zinc-100">{currentCommand}</span>
                <CopyButton text={currentCommand} />
            </div>
        </div>
    );
}
