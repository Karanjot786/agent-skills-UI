'use client';

import { Link, usePathname } from '@/i18n/navigation';
import NextLink from 'next/link';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavGitHubStars } from '@/components/nav-github-stars';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';

// Main browse pages; FAQ, legal and the rest live in the footer. en: English-only page (see NavLink).
const NAV_LINKS = [
    { href: '/marketplace', key: 'marketplace' },
    { href: '/mcp', key: 'mcp', en: true },
    { href: '/agents', key: 'agents', en: true },
    { href: '/plugins', key: 'plugins', en: true },
    { href: '/tools', key: 'tools', en: true },
    { href: '/docs', key: 'docs' },
] as const;

const MOBILE_LINKS = [...NAV_LINKS, { href: '/categories', key: 'categories' } as const, { href: '/faq', key: 'faq' } as const];

// English-only pages (items, tools) use a plain next/link so translated pages link to /mcp, not /en/mcp -> 307.
export function NavLink({ en, href, ...props }: Omit<React.ComponentProps<'a'>, 'href'> & { href: string; en?: boolean }) {
    return en ? <NextLink href={href} {...props} /> : <Link href={href} {...props} />;
}

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

// Neutral links; the cyan accent is reserved for the call to action.
const linkClass =
    'rounded-full text-zinc-400 transition-colors duration-150 hover:text-white aria-[current=page]:bg-white/[0.06] aria-[current=page]:text-white';

const ctaClass =
    'inline-block shrink-0 cursor-pointer whitespace-nowrap rounded-full bg-gradient-to-b from-cyan-400 to-cyan-600 text-center font-semibold text-black shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] transition-[translate,scale] duration-150 ease-out hover:-translate-y-0.5 active:scale-[0.96]';

interface NavbarProps {
    showGetStarted?: boolean;
}

export function Navbar({ showGetStarted = false }: NavbarProps) {
    const t = useTranslations('nav');
    const tc = useTranslations('common');
    const pathname = usePathname();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const menuButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Escape closes the mobile menu and returns focus to the button that opened it.
    useEffect(() => {
        if (!isMobileMenuOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            setIsMobileMenuOpen(false);
            menuButtonRef.current?.focus();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isMobileMenuOpen]);

    const closeMenu = () => setIsMobileMenuOpen(false);

    return (
        <>
            {/* Background Gradient */}
            <div
                className="fixed inset-x-0 top-0 z-40 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(6, 182, 212, 0.12), transparent 60%)",
                    height: '200px',
                }}
            />

            {/* Desktop Header */}
            <header
                className={`sticky top-4 z-[9999] mx-auto hidden w-full max-w-6xl flex-row items-center gap-4 self-start rounded-full border border-border/50 bg-background/80 py-2 shadow-lg backdrop-blur-sm transition-[padding] duration-300 lg:flex ${isScrolled ? 'px-2' : 'px-4'}`}
                style={{
                    willChange: "transform",
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                    perspective: "1000px",
                }}
            >
                {/* Logo only below xl and once scrolled, so six links fit in every locale; the name stays on one line. */}
                <Link className="z-50 flex shrink-0 items-center gap-2 rounded-full" href="/" aria-label="Agent Skills">
                    <img src="/logo.svg" alt="" className="size-8 rounded-lg shadow-lg shadow-cyan-500/25" />
                    <span
                        className={`hidden whitespace-nowrap bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-lg font-bold text-transparent ${isScrolled ? '' : 'xl:inline'}`}
                    >
                        Agent Skills
                    </span>
                </Link>

                <nav className="flex min-w-0 flex-1 flex-row items-center justify-center gap-1 whitespace-nowrap text-sm font-medium">
                    {NAV_LINKS.map((l) => (
                        <NavLink
                            key={l.href}
                            en={'en' in l}
                            href={l.href}
                            aria-current={isActive(pathname, l.href) ? 'page' : undefined}
                            className={`${linkClass} px-2.5 py-2`}
                        >
                            {t(l.key)}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex shrink-0 items-center gap-1">
                    <div className="hidden xl:block"><NavGitHubStars /></div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-zinc-400 hover:bg-white/5 hover:text-white"
                        asChild
                    >
                        <Link href="/marketplace" aria-label={t('search')}>
                            <Search className="size-4" aria-hidden="true" />
                        </Link>
                    </Button>
                    <LanguageSwitcher />
                    {showGetStarted && (
                        <Link href="#install" className={`${ctaClass} ms-2 px-4 py-2 text-sm`}>
                            {tc('getStarted')}
                        </Link>
                    )}
                </div>
            </header>

            {/* Mobile Header */}
            <header className="fixed top-4 left-4 right-4 z-[9999] flex lg:hidden flex-row items-center justify-between rounded-full bg-black/80 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20 px-4 py-3">
                <Link className="flex items-center gap-2" href="/" aria-label="Agent Skills">
                    <img src="/logo.svg" alt="" className="size-7 rounded-lg shadow-lg shadow-cyan-500/25" />
                    <span className="whitespace-nowrap bg-gradient-to-r from-white to-zinc-400 bg-clip-text font-bold text-transparent">
                        Agent Skills
                    </span>
                </Link>

                <button
                    ref={menuButtonRef}
                    type="button"
                    onClick={() => setIsMobileMenuOpen((open) => !open)}
                    className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors duration-150 hover:bg-white/10"
                    aria-label={t('menu')}
                    aria-expanded={isMobileMenuOpen}
                    aria-controls="mobile-menu"
                >
                    <span className="flex size-5 flex-col items-center justify-center space-y-1" aria-hidden="true">
                        <span className={`block h-0.5 w-4 bg-white transition-[transform,opacity] duration-200 ease-out ${isMobileMenuOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
                        <span className={`block h-0.5 w-4 bg-white transition-[transform,opacity] duration-200 ease-out ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
                        <span className={`block h-0.5 w-4 bg-white transition-[transform,opacity] duration-200 ease-out ${isMobileMenuOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
                    </span>
                </button>
            </header>

            {/* Mobile Menu: tapping the backdrop closes it */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[9998] overscroll-contain bg-black/50 backdrop-blur-sm lg:hidden" onClick={closeMenu}>
                    <div
                        id="mobile-menu"
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-20 left-4 right-4 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-md transition-[opacity,translate] duration-200 ease-out starting:-translate-y-2 starting:opacity-0 motion-reduce:starting:translate-y-0"
                    >
                        <nav className="flex flex-col space-y-2">
                            {MOBILE_LINKS.map((l) => (
                                <NavLink
                                    key={l.href}
                                    href={l.href}
                                    en={'en' in l}
                                    onClick={closeMenu}
                                    aria-current={isActive(pathname, l.href) ? 'page' : undefined}
                                    className={`${linkClass} rounded-lg px-4 py-3 text-lg font-medium hover:bg-white/5`}
                                >
                                    {t(l.key)}
                                </NavLink>
                            ))}
                            <div className="border-t border-white/10 pt-4 mt-4 flex flex-col space-y-3">
                                <a
                                    href="https://github.com/Karanjot786/agent-skills-cli"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${linkClass} flex items-center gap-2 rounded-lg px-4 py-3 text-lg font-medium hover:bg-white/5`}
                                >
                                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                    </svg>
                                    {t('github')}
                                </a>
                                {showGetStarted && (
                                    <Link href="#install" onClick={closeMenu} className={`${ctaClass} rounded-lg px-4 py-3 text-lg font-bold`}>
                                        {tc('getStarted')}
                                    </Link>
                                )}
                            </div>
                        </nav>
                    </div>
                </div>
            )}

            {/* Spacer for fixed header */}
            <div className="h-20" />
        </>
    );
}
