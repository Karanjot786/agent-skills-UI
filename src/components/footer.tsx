import Link from 'next/link';
import { Terminal } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t border-white/10 py-12 bg-black">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 transition-opacity">
                        <div className="size-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                            <Terminal className="size-5 text-white" />
                        </div>
                        <span>Agent Skills</span>
                    </Link>

                    <div className="flex gap-8 text-sm text-zinc-400">
                        <Link href="/marketplace" className="hover:text-white transition-colors">Browse</Link>
                        <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
                        <a href="https://github.com/Karanjot786/agent-skills-cli" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
                    </div>

                    <div className="text-sm text-zinc-600">
                        © {new Date().getFullYear()} Agent Skills. Open Source.
                    </div>
                </div>
            </div>
        </footer>
    );
}
