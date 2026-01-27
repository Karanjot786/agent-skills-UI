'use client';

import Link from 'next/link';
import { Terminal, Search, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavGitHubStars } from '@/components/nav-github-stars';
import { useState, useEffect } from 'react';

interface NavbarProps {
    showGetStarted?: boolean;
}

export function Navbar({ showGetStarted = false }: NavbarProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleMobileNavClick = (id: string) => {
        setIsMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            const headerOffset = 120;
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerOffset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth',
            });
        }
    };

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
                className={`sticky top-4 z-[9999] mx-auto hidden w-full flex-row items-center justify-between self-start rounded-full bg-background/80 md:flex backdrop-blur-sm border border-border/50 shadow-lg transition-all duration-300 ${isScrolled ? "max-w-3xl px-2" : "max-w-5xl px-4"
                    } py-2`}
                style={{
                    willChange: "transform",
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                    perspective: "1000px",
                }}
            >
                <Link
                    className={`z-50 flex items-center justify-center gap-2 transition-all duration-300 mr-8 ${isScrolled ? "ml-2" : ""
                        }`}
                    href="/"
                >
                    <img
                        src="/logo.svg"
                        alt="Agent Skills"
                        className="size-8 rounded-lg shadow-lg shadow-cyan-500/25"
                    />
                    <span className={`bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-bold text-lg transition-all duration-300 ${isScrolled ? "hidden" : ""
                        }`}>
                        Agent Skills
                    </span>
                </Link>

                <nav className="flex flex-1 flex-row items-center justify-center gap-1 text-sm font-medium">
                    <Link
                        className="relative px-4 py-2 text-zinc-400 hover:text-cyan-400 transition-colors"
                        href="/marketplace"
                    >
                        <span className="relative z-20">Browse</span>
                    </Link>
                    <Link
                        className="relative px-4 py-2 text-zinc-400 hover:text-cyan-400 transition-colors"
                        href="/docs"
                    >
                        <span className="relative z-20">Docs</span>
                    </Link>
                    <Link
                        className="relative px-4 py-2 text-zinc-400 hover:text-cyan-400 transition-colors"
                        href="/faq"
                    >
                        <span className="relative z-20">FAQ</span>
                    </Link>
                    {/* <Link
                        className="relative px-4 py-2 text-zinc-400 hover:text-cyan-400 transition-colors"
                        href="/stats"
                    >
                        <span className="relative z-20">Stats</span>
                    </Link> */}
                </nav>

                <div className="flex items-center gap-4 ml-8">
                    <NavGitHubStars />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-cyan-400 hover:bg-white/5"
                        asChild
                    >
                        <Link href="/marketplace">
                            <Search className="size-4" />
                        </Link>
                    </Button>
                    {showGetStarted && (
                        <Link
                            href="#install"
                            className="rounded-full font-semibold relative cursor-pointer hover:-translate-y-0.5 transition-all duration-200 inline-block text-center bg-gradient-to-b from-cyan-400 to-cyan-600 text-black shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-4 py-2 text-sm"
                        >
                            Get Started
                        </Link>
                    )}
                </div>
            </header>

            {/* Mobile Header */}
            <header className="fixed top-4 left-4 right-4 z-[9999] flex md:hidden flex-row items-center justify-between rounded-full bg-black/80 backdrop-blur-md border border-white/10 shadow-lg shadow-black/20 px-4 py-3">
                <Link
                    className="flex items-center justify-center gap-2"
                    href="/"
                >
                    <img
                        src="/logo.svg"
                        alt="Agent Skills"
                        className="size-7 rounded-lg shadow-lg shadow-cyan-500/25"
                    />
                    <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent font-bold">
                        Agent Skills
                    </span>
                </Link>

                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 transition-colors hover:bg-white/10"
                    aria-label="Toggle menu"
                >
                    <div className="flex flex-col items-center justify-center w-5 h-5 space-y-1">
                        <span
                            className={`block w-4 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`}
                        ></span>
                        <span
                            className={`block w-4 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}
                        ></span>
                        <span
                            className={`block w-4 h-0.5 bg-white transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
                        ></span>
                    </div>
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="sticky top-4 z-[9999] mx-4 flex w-auto flex-row items-center justify-between rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg md:hidden px-4 py-3fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm md:hidden">
                    <div className="absolute top-20 left-4 right-4 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-6">
                        <nav className="flex flex-col space-y-2">
                            <Link
                                href="/marketplace"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 text-lg font-medium text-zinc-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-white/5"
                            >
                                Browse
                            </Link>
                            <Link
                                href="/docs"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 text-lg font-medium text-zinc-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-white/5"
                            >
                                Docs
                            </Link>
                            <Link
                                href="/faq"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 text-lg font-medium text-zinc-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-white/5"
                            >
                                FAQ
                            </Link>
                            {/* <Link
                                href="/stats"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 text-lg font-medium text-zinc-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-white/5"
                            >
                                Stats
                            </Link> */}
                            <div className="border-t border-white/10 pt-4 mt-4 flex flex-col space-y-3">
                                <a
                                    href="https://github.com/Karanjot786/agent-skills-cli"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-3 text-lg font-medium text-zinc-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-white/5 flex items-center gap-2"
                                >
                                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                    </svg>
                                    GitHub
                                </a>
                                {showGetStarted && (
                                    <Link
                                        href="#install"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="px-4 py-3 text-lg font-bold text-center bg-gradient-to-b from-cyan-400 to-cyan-600 text-black rounded-lg shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        Get Started
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
