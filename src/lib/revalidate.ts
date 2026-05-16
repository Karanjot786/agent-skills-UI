import { revalidateTag } from 'next/cache';

export const CACHE_TAGS = {
    stats: 'global-stats',
    categories: 'categories',
    skill: 'skill',
} as const;

// expire: 3600 = re-cache for 1hr after purge (Next.js 16 revalidateTag requires a profile)
export function revalidateStats() {
    revalidateTag(CACHE_TAGS.stats, { expire: 3600 });
    revalidateTag(CACHE_TAGS.categories, { expire: 3600 });
}

// Call after re-indexing a repo to invalidate all skill detail page caches
export function revalidateSkills() {
    revalidateTag(CACHE_TAGS.skill, { expire: 86400 });
}
