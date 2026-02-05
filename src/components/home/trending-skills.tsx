'use client';

import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { Star, Crown, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Skill {
    id: string;
    name: string;
    description: string;
    author: string;
    stars: number;
    authorAvatar?: string;
    scopedName?: string;
}

interface TrendingSkillsProps {
    skills: Skill[];
}

export function TrendingSkills({ skills }: TrendingSkillsProps) {
    const t = useTranslations('home');
    const tc = useTranslations('common');
    const top3 = skills.slice(0, 3);
    const remaining = skills.slice(3);

    // Reorder for podium: [2nd, 1st, 3rd]
    const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;

    return (
        <section className="py-24 relative overflow-hidden bg-zinc-950">
            {/* Background effects */}
            <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10 blur-[100px] rounded-full" />
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
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
                            <TrendingUp className="size-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                {t('sections.trending')}{' '}
                                <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">

                                </span>
                            </h2>
                            <p className="text-zinc-400 mt-1">{t('sections.trendingDesc')}</p>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <Link
                            href="/marketplace?sortBy=stars"
                            className="hidden md:flex items-center gap-2 text-zinc-400 hover:text-amber-400 transition-colors group"
                        >
                            {tc('viewAll')}
                            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>

                {/* Podium Layout */}
                {top3.length >= 3 && (
                    <div className="flex items-end justify-center gap-4 mb-16">
                        {podiumOrder.map((skill, index) => {
                            const actualRank = index === 0 ? 2 : index === 1 ? 1 : 3;
                            const isFirst = actualRank === 1;
                            const isSecond = actualRank === 2;
                            const isThird = actualRank === 3;

                            return (
                                <motion.div
                                    key={skill.id}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className={`${isFirst ? 'order-2 z-10' : isSecond ? 'order-1' : 'order-3'}`}
                                >
                                    <Link
                                        href={`/marketplace/${skill.scopedName || skill.name}`}
                                        className={`block relative group ${isFirst ? 'w-72' : 'w-56'}`}
                                    >
                                        {/* Podium base */}
                                        <div
                                            className={`rounded-t-2xl ${isFirst
                                                ? 'h-40 bg-gradient-to-t from-amber-500/20 to-transparent border-t border-x border-amber-500/30'
                                                : isSecond
                                                    ? 'h-28 bg-gradient-to-t from-zinc-400/20 to-transparent border-t border-x border-zinc-400/30'
                                                    : 'h-20 bg-gradient-to-t from-amber-700/20 to-transparent border-t border-x border-amber-700/30'
                                                }`}
                                        />

                                        {/* Card */}
                                        <div
                                            className={`absolute bottom-full left-0 right-0 p-5 rounded-2xl border bg-zinc-900/90 backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-2 ${isFirst
                                                ? 'border-amber-500/30 shadow-lg shadow-amber-500/10'
                                                : 'border-white/10'
                                                }`}
                                        >
                                            {/* Rank badge */}
                                            <div
                                                className={`absolute -top-3 -left-3 size-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ${isFirst
                                                    ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black'
                                                    : isSecond
                                                        ? 'bg-gradient-to-br from-zinc-300 to-zinc-400 text-black'
                                                        : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                                                    }`}
                                            >
                                                {isFirst ? <Crown className="size-5" /> : `#${actualRank}`}
                                            </div>

                                            {/* Star particles for #1 */}
                                            {isFirst && (
                                                <>
                                                    <Sparkles className="absolute -top-1 -right-1 size-4 text-amber-400 animate-pulse" />
                                                    <Sparkles className="absolute top-4 -right-2 size-3 text-amber-300 animate-pulse delay-150" />
                                                </>
                                            )}

                                            {/* Content */}
                                            <div className="mb-3">
                                                <div className="font-semibold text-lg mb-1 group-hover:text-amber-400 transition-colors line-clamp-1">
                                                    {skill.name}
                                                </div>
                                                <p className="text-sm text-zinc-400 line-clamp-2">
                                                    {skill.description || 'A powerful skill for AI development.'}
                                                </p>
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={skill.authorAvatar || `https://github.com/${skill.author}.png`}
                                                        alt={skill.author}
                                                        className="size-5 rounded-full ring-1 ring-white/10"
                                                    />
                                                    <span className="text-xs text-zinc-500">{skill.author}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-amber-400 text-sm font-medium">
                                                    <Star className="size-4 fill-amber-400" />
                                                    {skill.stars?.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Remaining skills - Horizontal scroll */}
                {remaining.length > 0 && (
                    <div className="relative">
                        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

                        <div className="overflow-hidden">
                            <motion.div
                                className="flex gap-4"
                                animate={{ x: [0, -1000] }}
                                transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                            >
                                {[...remaining, ...remaining].map((skill, i) => (
                                    <Link
                                        key={`${skill.id}-${i}`}
                                        href={`/marketplace/${skill.scopedName || skill.name}`}
                                        className="flex-shrink-0 w-72 p-4 rounded-xl border border-white/5 bg-zinc-900/50 hover:border-white/20 transition-all group"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="font-medium group-hover:text-cyan-400 transition-colors line-clamp-1 flex-1">
                                                {skill.name}
                                            </div>
                                            <div className="flex items-center gap-1 text-yellow-400 text-sm ml-2">
                                                <Star className="size-3.5 fill-yellow-400" />
                                                {skill.stars?.toLocaleString()}
                                            </div>
                                        </div>
                                        <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
                                            {skill.description || 'A useful skill for AI development.'}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={skill.authorAvatar || `https://github.com/${skill.author}.png`}
                                                alt={skill.author}
                                                className="size-4 rounded-full"
                                            />
                                            <span className="text-xs text-zinc-600">{skill.author}</span>
                                        </div>
                                    </Link>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* Mobile link */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-8 md:hidden"
                >
                    <Link
                        href="/marketplace?sortBy=stars"
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-xl border border-white/10 text-zinc-400 hover:text-amber-400 hover:border-amber-500/30 transition-all"
                    >
                        {tc('viewAll')}
                        <ArrowRight className="size-4" />
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
