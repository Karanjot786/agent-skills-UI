'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Code2, Box, Globe, Sparkles, Zap, Package, ChevronRight, ArrowRight, Shield, Database, Cpu } from 'lucide-react';

interface CategoryCounts {
    [key: string]: number;
}

interface CategoriesShowcaseProps {
    totalSkills: number;
    categoryCounts?: CategoryCounts;
}

const categoryConfig = [
    { name: 'Development', icon: Code2, color: 'from-blue-500 to-cyan-500', slug: 'development', hoverBorder: 'hover:border-blue-500/30', textColor: 'text-blue-400' },
    { name: 'Testing', icon: Box, color: 'from-green-500 to-emerald-500', slug: 'testing', hoverBorder: 'hover:border-green-500/30', textColor: 'text-green-400' },
    { name: 'DevOps', icon: Globe, color: 'from-orange-500 to-amber-500', slug: 'devops', hoverBorder: 'hover:border-orange-500/30', textColor: 'text-orange-400' },
    { name: 'AI & ML', icon: Sparkles, color: 'from-purple-500 to-pink-500', slug: 'ai', hoverBorder: 'hover:border-purple-500/30', textColor: 'text-purple-400' },
    { name: 'Security', icon: Shield, color: 'from-red-500 to-rose-500', slug: 'security', hoverBorder: 'hover:border-red-500/30', textColor: 'text-red-400' },
    { name: 'Data', icon: Database, color: 'from-indigo-500 to-violet-500', slug: 'data', hoverBorder: 'hover:border-indigo-500/30', textColor: 'text-indigo-400' },
    { name: 'Infrastructure', icon: Cpu, color: 'from-cyan-500 to-blue-500', slug: 'infrastructure', hoverBorder: 'hover:border-cyan-500/30', textColor: 'text-cyan-400' },
];

function formatCount(count: number): string {
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
    }
    return count.toString();
}

export function CategoriesShowcase({ totalSkills, categoryCounts = {} }: CategoriesShowcaseProps) {
    // Map display slugs to actual database category names
    const categoryMapping: Record<string, string[]> = {
        'development': ['ai-development', 'skill-tools'],
        'testing': ['testing'],
        'devops': ['devops'],
        'ai': ['ai-development', 'ai-enhancers', 'ai-agents'],
        'security': ['utilities'], // Security tools are often in utilities
        'data': ['data-ml'],
        'infrastructure': ['devops', 'integrations'],
    };

    // Get count for a category, summing up all matching database categories
    const getCount = (slug: string): string => {
        const dbCategories = categoryMapping[slug] || [slug];
        let total = 0;
        for (const dbCat of dbCategories) {
            total += categoryCounts[dbCat] || 0;
        }
        // Also check direct match
        if (total === 0) {
            total = categoryCounts[slug] || categoryCounts[slug.toLowerCase()] || 0;
        }
        return total > 0 ? formatCount(total) : '—';
    };

    return (
        <section className="py-24 relative overflow-hidden">
            {/* Background gradient mesh */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 blur-[120px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="flex items-end justify-between mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="text-cyan-400 text-sm font-medium tracking-wider uppercase mb-2 block">
                            Explore
                        </span>
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                            Browse by{' '}
                            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                Category
                            </span>
                        </h2>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <Link
                            href="/marketplace"
                            className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-cyan-400 transition-colors group"
                        >
                            View All Categories
                            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>

                {/* Improved Bento Grid - 4 column layout */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Featured: All Skills - spans 2 columns and 2 rows */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="col-span-2 row-span-2 group"
                    >
                        <Link
                            href="/marketplace"
                            className="relative h-full min-h-[400px] flex flex-col justify-between p-8 rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50 hover:border-cyan-500/30 transition-all duration-500"
                        >
                            {/* Animated mesh gradient background */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-blue-500/20" />
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        background: 'radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.2) 0%, transparent 50%)',
                                    }}
                                />
                            </div>

                            {/* Animated grid pattern */}
                            <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity duration-500">
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                                        backgroundSize: '32px 32px'
                                    }}
                                />
                            </div>

                            {/* Floating particles */}
                            <div className="absolute top-10 right-10 size-2 rounded-full bg-cyan-400/40 animate-pulse" />
                            <div className="absolute top-20 right-20 size-1 rounded-full bg-blue-400/40 animate-pulse delay-300" />
                            <div className="absolute bottom-20 right-16 size-1.5 rounded-full bg-cyan-400/30 animate-pulse delay-500" />

                            {/* Content */}
                            <div className="relative z-10">
                                <div className="size-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-cyan-500/25">
                                    <Package className="size-8 text-white" />
                                </div>
                                <h3 className="text-3xl font-bold mb-3 group-hover:text-cyan-400 transition-colors">
                                    All Skills
                                </h3>
                                <p className="text-zinc-400 text-base leading-relaxed max-w-xs">
                                    Browse the complete collection of AI agent skills from the community
                                </p>
                            </div>

                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <span className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                        {formatCount(totalSkills)}
                                    </span>
                                    <p className="text-zinc-500 text-sm mt-1">Available skills</p>
                                </div>
                                <div className="size-14 rounded-full border-2 border-white/10 flex items-center justify-center group-hover:bg-cyan-500 group-hover:border-cyan-500 transition-all duration-300 group-hover:scale-110">
                                    <ArrowRight className="size-6 text-zinc-400 group-hover:text-black transition-colors" />
                                </div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Development - Wide card spanning 2 columns */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="col-span-2 group"
                    >
                        <Link
                            href="/marketplace?category=development"
                            className="relative h-full min-h-[190px] flex flex-col justify-between p-6 rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/30 hover:border-blue-500/30 hover:bg-zinc-900/60 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 flex items-start justify-between">
                                <div className="size-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <Code2 className="size-6 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-blue-400">{getCount('development')}</span>
                            </div>

                            <div className="relative z-10">
                                <div className="font-semibold text-lg mb-1 group-hover:text-blue-400 transition-colors">Development</div>
                                <div className="text-sm text-zinc-500">Build faster with code generation skills</div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Row 2: Testing + DevOps */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 }}
                        className="group"
                    >
                        <Link
                            href="/marketplace?category=testing"
                            className="relative h-full min-h-[190px] flex flex-col justify-between p-6 rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/30 hover:border-green-500/30 hover:bg-zinc-900/60 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10">
                                <div className="size-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                                    <Box className="size-5 text-white" />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="font-semibold mb-1 group-hover:text-green-400 transition-colors">Testing</div>
                                <div className="text-xs text-zinc-500">{getCount('testing')} skills</div>
                            </div>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="group"
                    >
                        <Link
                            href="/marketplace?category=devops"
                            className="relative h-full min-h-[190px] flex flex-col justify-between p-6 rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/30 hover:border-orange-500/30 hover:bg-zinc-900/60 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10">
                                <div className="size-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                                    <Globe className="size-5 text-white" />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="font-semibold mb-1 group-hover:text-orange-400 transition-colors">DevOps</div>
                                <div className="text-xs text-zinc-500">{getCount('devops')} skills</div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Row 3: AI & ML (tall) + Security + Data */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.25 }}
                        className="row-span-2 group"
                    >
                        <Link
                            href="/marketplace?category=ai"
                            className="relative h-full min-h-[400px] flex flex-col justify-between p-6 rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/30 hover:border-purple-500/30 hover:bg-zinc-900/60 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Decorative sparkles */}
                            <div className="absolute top-1/3 right-4 text-purple-400/30 group-hover:text-purple-400/60 transition-colors">
                                <Sparkles className="size-6" />
                            </div>

                            <div className="relative z-10">
                                <div className="size-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <Sparkles className="size-7 text-white" />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <span className="text-3xl font-bold text-purple-400 block mb-2">{getCount('ai')}</span>
                                <div className="font-semibold text-lg mb-1 group-hover:text-purple-400 transition-colors">AI & ML</div>
                                <div className="text-sm text-zinc-500">Machine learning & AI tools</div>
                            </div>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="group"
                    >
                        <Link
                            href="/marketplace?category=security"
                            className="relative h-full min-h-[190px] flex flex-col justify-between p-6 rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/30 hover:border-red-500/30 hover:bg-zinc-900/60 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10">
                                <div className="size-11 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300">
                                    <Shield className="size-5 text-white" />
                                </div>
                            </div>

                            <div className="relative z-10">
                                <div className="font-semibold mb-1 group-hover:text-red-400 transition-colors">Security</div>
                                <div className="text-xs text-zinc-500">{getCount('security')} skills</div>
                            </div>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.35 }}
                        className="col-span-2 group"
                    >
                        <Link
                            href="/marketplace?category=data"
                            className="relative h-full min-h-[190px] flex flex-col justify-between p-6 rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/30 hover:border-indigo-500/30 hover:bg-zinc-900/60 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 flex items-start justify-between">
                                <div className="size-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <Database className="size-6 text-white" />
                                </div>
                                <span className="text-2xl font-bold text-indigo-400">{getCount('data')}</span>
                            </div>

                            <div className="relative z-10">
                                <div className="font-semibold text-lg mb-1 group-hover:text-indigo-400 transition-colors">Data & Analytics</div>
                                <div className="text-sm text-zinc-500">Data processing, ETL, and analytics tools</div>
                            </div>
                        </Link>
                    </motion.div>

                    {/* Infrastructure - Wide card at bottom */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="col-span-2 md:col-span-3 group"
                    >
                        <Link
                            href="/marketplace?category=infrastructure"
                            className="relative h-full min-h-[120px] flex items-center justify-between p-6 rounded-2xl overflow-hidden border border-white/5 bg-zinc-900/30 hover:border-cyan-500/30 hover:bg-zinc-900/60 transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10 flex items-center gap-4">
                                <div className="size-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <Cpu className="size-6 text-white" />
                                </div>
                                <div>
                                    <div className="font-semibold text-lg group-hover:text-cyan-400 transition-colors">Infrastructure</div>
                                    <div className="text-sm text-zinc-500">Cloud, containers & automation</div>
                                </div>
                            </div>

                            <div className="relative z-10 flex items-center gap-4">
                                <span className="text-2xl font-bold text-cyan-400">{getCount('infrastructure')}</span>
                                <ChevronRight className="size-5 text-zinc-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>
                    </motion.div>
                </div>

                {/* Mobile view all link */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-8 md:hidden"
                >
                    <Link
                        href="/marketplace"
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border border-white/10 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all"
                    >
                        View All Categories
                        <ArrowRight className="size-4" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
