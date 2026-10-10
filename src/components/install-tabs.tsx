'use client';

import { useState } from 'react';
import { CopyButton } from './copy-button';
import type { InstallTab } from '@/lib/install-snippets';

// Every panel is server-rendered into the HTML (inactive ones `hidden`): crawlers, AI answer engines and
// no-JS readers see all client configs; the tabs only toggle visibility.
export function InstallTabs({ tabs }: { tabs: InstallTab[] }) {
    const [active, setActive] = useState(0);
    // APG tabs: arrow keys move between tabs (roving tabindex), Home/End jump to the ends.
    const onKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        const last = tabs.length - 1;
        const next = e.key === 'ArrowRight' ? (active === last ? 0 : active + 1) : e.key === 'ArrowLeft' ? (active === 0 ? last : active - 1)
            : e.key === 'Home' ? 0 : e.key === 'End' ? last : null;
        if (next === null) return;
        e.preventDefault();
        setActive(next);
        document.getElementById(`tab-${tabs[next].id}`)?.focus();
    };
    return (
        <div className="rounded-xl border border-white/10 overflow-hidden bg-black/60">
            <div role="tablist" aria-label="Install for" className="flex flex-wrap border-b border-white/10 bg-zinc-900/50">
                {tabs.map((t, i) => (
                    <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={active === i} aria-controls={`panel-${t.id}`}
                        tabIndex={active === i ? 0 : -1} onClick={() => setActive(i)} onKeyDown={onKey}
                        className={`px-4 py-2.5 text-xs font-medium transition-colors ${active === i
                            ? 'text-cyan-400 border-b-2 border-cyan-400 -mb-[1px] bg-zinc-900/50'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}>
                        {t.label}
                    </button>
                ))}
            </div>
            {tabs.map((t, i) => (
                <div key={t.id} role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} hidden={active !== i} className="p-4">
                    {t.file && <div className="mb-2 text-xs text-zinc-500 font-mono">{t.file}</div>}
                    <div className="flex items-start gap-3">
                        <pre className="flex-1 overflow-x-auto font-mono text-sm text-zinc-100 whitespace-pre"><code>{t.code}</code></pre>
                        <CopyButton text={t.code} />
                    </div>
                    {t.note && <p className="mt-2 text-xs text-zinc-500">{t.note}</p>}
                </div>
            ))}
        </div>
    );
}
