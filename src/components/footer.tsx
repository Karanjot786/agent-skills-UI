'use client';

import { Link } from '@/i18n/navigation';
import { NavLink } from '@/components/navbar';
import { Terminal } from 'lucide-react';
import { useTranslations } from 'next-intl';

const GH = 'https://github.com/Karanjot786/agent-skills-cli';
// en: English-only page, linked without a locale prefix (see NavLink).
const COLUMNS: { title: string; links: { href: string; label: string; en?: true }[] }[] = [
    { title: 'browse', links: [
        { href: '/marketplace', label: 'nav.marketplace' },
        { href: '/mcp', label: 'nav.mcp', en: true },
        { href: '/agents', label: 'nav.agents', en: true },
        { href: '/plugins', label: 'nav.plugins', en: true },
        { href: '/tools', label: 'nav.tools', en: true },
        { href: '/categories', label: 'nav.categories' },
    ] },
    { title: 'product', links: [
        { href: '/docs', label: 'nav.docs' },
        { href: '/faq', label: 'nav.faq' },
        { href: '/#submit', label: 'submit' },
        { href: '/advertise', label: 'advertise' },
    ] },
    { title: 'resources', links: [
        { href: GH, label: 'nav.github' },
        { href: 'https://www.npmjs.com/package/agent-skills-cli', label: 'npm' },
        { href: `${GH}/blob/main/CHANGELOG.md`, label: 'changelog' },
        { href: '/advisories.json', label: 'advisories' },
        { href: `${GH}/issues`, label: 'issue' },
    ] },
    { title: 'legal', links: [
        { href: '/terms', label: 'terms' },
        { href: '/privacy', label: 'privacy' },
        { href: '/takedown', label: 'takedown' },
    ] },
];

export function Footer() {
    const t = useTranslations('footer');
    const tn = useTranslations('nav');
    // 'nav.x' keys come from the navbar namespace, the rest from footer.
    const label = (k: string) => (k.startsWith('nav.') ? tn(k.slice(4)) : t(k));

    return (
        <footer className="border-t border-white/10 py-16 bg-black">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity mb-4">
                            <div className="size-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                                <Terminal className="size-5 text-white" />
                            </div>
                            <span>Agent Skills</span>
                        </Link>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            The universal skill manager for 42+ AI coding agents. Install 220,000+ skills with one command.
                        </p>
                    </div>

                    {COLUMNS.map((col) => (
                        <nav key={col.title} aria-labelledby={`footer-${col.title}`}>
                            <h3 id={`footer-${col.title}`} className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider">{t(col.title)}</h3>
                            <ul className="space-y-3 text-sm text-zinc-400">
                                {col.links.map((l) => (
                                    <li key={l.href}>
                                        {l.href.startsWith('http')
                                            ? <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">{label(l.label)}</a>
                                            : l.href.endsWith('.json') // not a localized page: no locale prefix
                                                ? <a href={l.href} className="hover:text-cyan-400 transition-colors">{label(l.label)}</a>
                                                : <NavLink href={l.href} en={l.en} className="hover:text-cyan-400 transition-colors">{label(l.label)}</NavLink>}
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-zinc-600">
                        {t('copyright', { year: new Date().getFullYear() })}
                    </div>
                    <div className="flex gap-6 text-xs text-zinc-600">
                        <span>Sponsored and affiliate links are labelled. Payment never changes ranking.</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
