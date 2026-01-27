'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, Package, Star } from 'lucide-react';
import { useRef, useState } from 'react';

interface Author {
    name: string;
    avatar?: string;
    skillCount: number;
}

interface TopContributorsProps {
    authors: Author[];
}

export function TopContributors({ authors }: TopContributorsProps) {
    const [isPaused, setIsPaused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Double the array for seamless loop
    const extendedAuthors = [...authors, ...authors, ...authors];

    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-purple-500/10 to-transparent blur-[100px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                            <Users className="size-6 text-white" />
                        </div>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Meet the{' '}
                        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Community
                        </span>
                    </h2>
                    <p className="text-zinc-400 max-w-lg mx-auto">
                        Talented developers creating and sharing skills for the AI ecosystem
                    </p>
                </motion.div>

                {/* Marquee Container */}
                <div
                    ref={containerRef}
                    className="relative"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Gradient masks */}
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

                    {/* Marquee Track */}
                    <div className="overflow-hidden py-4">
                        <motion.div
                            className="flex gap-6"
                            animate={isPaused ? {} : { x: ['0%', '-33.333%'] }}
                            transition={isPaused ? {} : {
                                duration: 40,
                                repeat: Infinity,
                                ease: 'linear'
                            }}
                        >
                            {extendedAuthors.map((author, i) => (
                                <Link
                                    key={`${author.name}-${i}`}
                                    href={`/marketplace?author=${author.name}`}
                                    className="flex-shrink-0 group"
                                >
                                    <div className="relative flex flex-col items-center p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-purple-500/30 hover:bg-zinc-900/80 transition-all duration-300 w-36">
                                        {/* Animated gradient ring */}
                                        <div className="relative mb-4">
                                            <div
                                                className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                                style={{
                                                    background: 'conic-gradient(from 0deg, #a855f7, #ec4899, #a855f7)',
                                                    animation: 'spin 3s linear infinite',
                                                }}
                                            />
                                            <div className="absolute -inset-[3px] rounded-full bg-black" />
                                            <img
                                                src={author.avatar || `https://github.com/${author.name}.png`}
                                                alt={author.name}
                                                className="relative size-16 rounded-full bg-zinc-800 group-hover:scale-110 transition-transform duration-300"
                                            />
                                        </div>

                                        {/* Name */}
                                        <div className="font-medium text-sm truncate w-full text-center group-hover:text-purple-300 transition-colors mb-1">
                                            {author.name}
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                                            <Package className="size-3" />
                                            {author.skillCount} skills
                                        </div>

                                        {/* Hover reveal - skill count badge */}
                                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <div className="px-2 py-1 rounded-full bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/30">
                                                #{i % authors.length + 1}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </motion.div>
                    </div>

                    {/* Pause indicator */}
                    {isPaused && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-zinc-500 bg-zinc-900/80 px-3 py-1 rounded-full border border-white/10"
                        >
                            Hover to explore
                        </motion.div>
                    )}
                </div>

                {/* Featured stat */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-12 flex items-center justify-center gap-8 text-center"
                >
                    <div>
                        <div className="text-3xl font-bold text-purple-400">{authors.length}+</div>
                        <div className="text-sm text-zinc-500">Active Contributors</div>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div>
                        <div className="text-3xl font-bold text-white">
                            {authors.reduce((a, b) => a + b.skillCount, 0).toLocaleString()}+
                        </div>
                        <div className="text-sm text-zinc-500">Skills Created</div>
                    </div>
                </motion.div>
            </div>

            {/* CSS for spin animation */}
            <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </section>
    );
}
