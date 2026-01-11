'use client';

import Link from 'next/link';
import { Terminal, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavGitHubStars } from '@/components/nav-github-stars';

interface NavbarProps {
    showGetStarted?: boolean;
}

export function Navbar({ showGetStarted = false }: NavbarProps) {
    return (
        <nav className="border-b border-white/10 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight hover:opacity-90 transition-opacity">
                    <img
                        src="/logo.svg"
                        alt="Agent Skills"
                        className="size-8 rounded-lg shadow-lg shadow-cyan-500/25"
                    />
                    <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Agent Skills</span>
                </Link>

                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
                    <Link href="/marketplace" className="hover:text-cyan-400 transition-colors">Browse</Link>
                    <Link href="/docs" className="hover:text-cyan-400 transition-colors">Docs</Link>
                    <NavGitHubStars />
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" asChild>
                        <Link href="/marketplace">
                            <Search className="size-4" />
                        </Link>
                    </Button>
                    {showGetStarted && (
                        <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 font-semibold shadow-lg shadow-cyan-500/25" asChild>
                            <Link href="#install">Get Started</Link>
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    );
}

