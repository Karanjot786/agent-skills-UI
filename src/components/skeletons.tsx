'use client';

import { motion } from "framer-motion";

// Skill Card Skeleton for Marketplace Grid
export function SkillCardSkeleton() {
    return (
        <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 animate-pulse">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div className="h-6 bg-zinc-800 rounded w-32"></div>
                <div className="h-5 bg-zinc-800 rounded w-16"></div>
            </div>

            {/* Description */}
            <div className="space-y-2 mb-4">
                <div className="h-4 bg-zinc-800 rounded w-full"></div>
                <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <div className="size-5 bg-zinc-800 rounded-full"></div>
                    <div className="h-3 bg-zinc-800 rounded w-16"></div>
                </div>
                <div className="h-8 bg-zinc-800 rounded w-20"></div>
            </div>
        </div>
    );
}

// Skeleton Grid for Marketplace
export function SkillGridSkeleton({ count = 12 }: { count?: number }) {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                >
                    <SkillCardSkeleton />
                </motion.div>
            ))}
        </div>
    );
}

// Skill Detail Page Skeleton
export function SkillDetailSkeleton() {
    return (
        <div className="min-h-screen bg-black text-white animate-pulse">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-zinc-900/50 to-black py-16">
                <div className="container mx-auto px-6 max-w-5xl">
                    {/* Title & Meta */}
                    <div className="mb-6">
                        <div className="h-10 bg-zinc-800 rounded w-64 mb-4"></div>
                        <div className="flex items-center gap-4">
                            <div className="h-5 bg-zinc-800 rounded w-24"></div>
                            <div className="h-5 bg-zinc-800 rounded w-16"></div>
                            <div className="h-5 bg-zinc-800 rounded w-20"></div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="h-6 bg-zinc-800 rounded w-3/4 mb-8"></div>

                    {/* Install Box */}
                    <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 mb-8">
                        <div className="h-5 bg-zinc-800 rounded w-32 mb-4"></div>
                        <div className="h-12 bg-zinc-800 rounded w-full"></div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto px-6 max-w-5xl py-12">
                <div className="space-y-4">
                    <div className="h-8 bg-zinc-800 rounded w-48 mb-6"></div>
                    <div className="h-4 bg-zinc-800 rounded w-full"></div>
                    <div className="h-4 bg-zinc-800 rounded w-full"></div>
                    <div className="h-4 bg-zinc-800 rounded w-5/6"></div>
                    <div className="h-4 bg-zinc-800 rounded w-full"></div>
                    <div className="h-4 bg-zinc-800 rounded w-2/3"></div>
                </div>
            </div>
        </div>
    );
}

// Homepage Featured Skills Skeleton
export function FeaturedSkillsSkeleton() {
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-zinc-900/50 border border-white/10 rounded-xl p-5 animate-pulse">
                    <div className="flex items-start justify-between mb-3">
                        <div className="h-6 bg-zinc-800 rounded w-28"></div>
                        <div className="h-5 bg-zinc-800 rounded w-14"></div>
                    </div>
                    <div className="space-y-2 mb-4">
                        <div className="h-4 bg-zinc-800 rounded w-full"></div>
                        <div className="h-4 bg-zinc-800 rounded w-4/5"></div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="size-5 bg-zinc-800 rounded-full"></div>
                        <div className="h-3 bg-zinc-800 rounded w-20"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Stats Skeleton
export function StatsSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center animate-pulse">
                    <div className="h-10 bg-zinc-800 rounded w-20 mx-auto mb-2"></div>
                    <div className="h-4 bg-zinc-800 rounded w-16 mx-auto"></div>
                </div>
            ))}
        </div>
    );
}
