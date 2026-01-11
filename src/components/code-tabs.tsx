'use client';

import { useState } from 'react';
import { CodeBlock } from './code-block';

interface Tab {
    label: string;
    code: string;
    language?: string;
}

interface CodeTabsProps {
    tabs: Tab[];
    defaultTab?: number;
}

export function CodeTabs({ tabs, defaultTab = 0 }: CodeTabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab);

    return (
        <div className="rounded-xl border border-white/10 overflow-hidden bg-zinc-950">
            {/* Tab headers */}
            <div className="flex border-b border-white/10 bg-zinc-900/50">
                {tabs.map((tab, index) => (
                    <button
                        key={tab.label}
                        onClick={() => setActiveTab(index)}
                        className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === index
                                ? 'text-cyan-400 border-b-2 border-cyan-400 -mb-[1px] bg-zinc-900/50'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="[&_.group]:rounded-none [&_.group]:border-0">
                <CodeBlock
                    code={tabs[activeTab].code}
                    language={tabs[activeTab].language || 'bash'}
                />
            </div>
        </div>
    );
}

// Pre-configured installation tabs for easy use
export function InstallTabs() {
    return (
        <CodeTabs
            tabs={[
                { label: 'npm', code: 'npm install -g agent-skills-cli' },
                { label: 'yarn', code: 'yarn global add agent-skills-cli' },
                { label: 'pnpm', code: 'pnpm add -g agent-skills-cli' },
                { label: 'bun', code: 'bun add -g agent-skills-cli' },
            ]}
        />
    );
}
