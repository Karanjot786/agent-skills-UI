'use client';

import { Link } from '@/i18n/navigation';
import { Terminal } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Footer() {
    const t = useTranslations('footer');
    const tn = useTranslations('nav');

    return (
        <footer className="border-t border-white/10 py-16 bg-black">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
                    {/* Brand */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity mb-4">
                            <div className="size-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                                <Terminal className="size-5 text-white" />
                            </div>
                            <span>Agent Skills</span>
                        </Link>
                        <p className="text-sm text-zinc-500 leading-relaxed">
                            The universal skill manager for 42+ AI coding agents. Install 175,000+ skills with one command.
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider">Product</h3>
                        <ul className="space-y-3 text-sm text-zinc-400">
                            <li><Link href="/marketplace" className="hover:text-cyan-400 transition-colors">{tn('marketplace')}</Link></li>
                            <li><Link href="/docs" className="hover:text-cyan-400 transition-colors">{tn('docs')}</Link></li>
                            <li><Link href="/faq" className="hover:text-cyan-400 transition-colors">{tn('faq')}</Link></li>
                            {/* <li><Link href="/stats" className="hover:text-cyan-400 transition-colors">Statistics</Link></li> */}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider">Resources</h3>
                        <ul className="space-y-3 text-sm text-zinc-400">
                            <li><a href="https://github.com/Karanjot786/agent-skills-cli" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">{tn('github')}</a></li>
                            <li><a href="https://www.npmjs.com/package/agent-skills-cli" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">npm Package</a></li>
                            <li><a href="https://github.com/Karanjot786/agent-skills-cli/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Changelog</a></li>
                            <li><a href="https://github.com/Karanjot786/agent-skills-cli/issues" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Report Issue</a></li>
                        </ul>
                    </div>

                    {/* Agents */}
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider">Supported Agents</h3>
                        <ul className="space-y-3 text-sm text-zinc-400">
                            <li><Link href="/docs" className="hover:text-cyan-400 transition-colors">Cursor</Link></li>
                            <li><Link href="/docs" className="hover:text-cyan-400 transition-colors">Claude Code</Link></li>
                            <li><Link href="/docs" className="hover:text-cyan-400 transition-colors">GitHub Copilot</Link></li>
                            <li><Link href="/docs" className="hover:text-cyan-400 transition-colors">Gemini CLI</Link></li>
                            <li><Link href="/docs" className="hover:text-cyan-400 transition-colors">Windsurf & Cline</Link></li>
                            <li><Link href="/docs" className="hover:text-cyan-400 transition-colors">+37 more agents</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-zinc-600">
                        {t('copyright', { year: new Date().getFullYear() })}
                    </div>
                    <div className="flex gap-6 text-xs text-zinc-600">
                        <span>Made with ♥ for the AI developer community</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
