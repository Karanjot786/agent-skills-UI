'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Clock, ArrowRight, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Skill {
    id: string;
    name: string;
    description: string;
    author: string;
    authorAvatar?: string;
    scopedName?: string;
    createdAt?: string;
}

interface RecentSkillsProps {
    skills: Skill[];
}

function getTimeAgo(date?: string): string {
    if (!date) return 'Just now';
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
}

export function RecentSkills({ skills }: RecentSkillsProps) {
    if (skills.length === 0) return null;

    return (
        <section className="py-24 relative overflow-hidden bg-zinc-950">
            {/* Background */}
            <div className="absolute inset-0">
                <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-gradient-to-r from-green-500/10 to-emerald-500/10 blur-[150px] rounded-full -translate-y-1/2" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Header */}
                <div className="flex items-end justify-between mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-4"
                    >
                        <div className="relative">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/25">
                                <Sparkles className="size-6 text-white" />
                            </div>
                            {/* Pulse dot */}
                            <span className="absolute -top-1 -right-1 flex size-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full size-3 bg-green-500" />
                            </span>
                        </div>
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                Recently{' '}
                                <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                    Added
                                </span>
                            </h2>
                            <p className="text-zinc-400 mt-1">Fresh skills from the community</p>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <Link
                            href="/marketplace?sortBy=recent"
                            className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-green-400 transition-colors group"
                        >
                            View All
                            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>

                {/* Timeline Layout */}
                <div className="relative">
                    {/* Vertical timeline line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-green-500/50 via-green-500/20 to-transparent hidden lg:block" />

                    {/* Skills */}
                    <div className="space-y-8 lg:space-y-12">
                        {skills.slice(0, 6).map((skill, i) => {
                            const isLeft = i % 2 === 0;

                            return (
                                <motion.div
                                    key={skill.id}
                                    initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`relative lg:w-1/2 ${isLeft ? 'lg:pr-12 lg:ml-0' : 'lg:pl-12 lg:ml-auto'}`}
                                >
                                    {/* Timeline dot */}
                                    <div className={`absolute top-6 hidden lg:flex items-center justify-center ${isLeft ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'}`}>
                                        <div className="size-4 rounded-full bg-green-500 shadow-lg shadow-green-500/50">
                                            <div className="size-full rounded-full bg-green-400 animate-ping opacity-75" />
                                        </div>
                                    </div>

                                    {/* Connector line */}
                                    <div className={`absolute top-8 hidden lg:block h-px w-8 bg-gradient-to-r ${isLeft ? 'right-4 from-transparent to-green-500/50' : 'left-4 from-green-500/50 to-transparent'}`} />

                                    {/* Card */}
                                    <Link
                                        href={`/marketplace/${skill.scopedName || skill.name}`}
                                        className="block p-6 rounded-2xl border border-white/5 bg-zinc-900/50 hover:border-green-500/30 hover:bg-zinc-900/80 transition-all duration-300 group relative overflow-hidden"
                                    >
                                        {/* Gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        {/* NEW badge */}
                                        {i < 2 && (
                                            <div className="absolute -top-1 -right-1">
                                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs shadow-lg shadow-green-500/25 border-0">
                                                    <Zap className="size-3 mr-1" />
                                                    NEW
                                                </Badge>
                                            </div>
                                        )}

                                        {/* Content */}
                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg mb-1 group-hover:text-green-400 transition-colors line-clamp-1">
                                                        {skill.name}
                                                    </h3>
                                                    <p className="text-sm text-zinc-400 line-clamp-2">
                                                        {skill.description || 'A useful skill for AI development.'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={skill.authorAvatar || `https://github.com/${skill.author}.png`}
                                                        alt={skill.author}
                                                        className="size-6 rounded-full ring-2 ring-white/10"
                                                    />
                                                    <span className="text-sm text-zinc-400">{skill.author}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-zinc-500">
                                                    <Clock className="size-3" />
                                                    <span>{getTimeAgo(skill.createdAt)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Mobile link */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-12 md:hidden"
                >
                    <Link
                        href="/marketplace?sortBy=recent"
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border border-white/10 text-zinc-400 hover:text-green-400 hover:border-green-500/30 transition-all"
                    >
                        View All Recent
                        <ArrowRight className="size-4" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
