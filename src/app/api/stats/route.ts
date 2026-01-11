import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cache response for 1 hour
export const revalidate = 3600;

interface CachedStats {
    total_skills: number;
    unique_authors: number;
    top_authors: Array<{ name: string; skillCount: number; avatar: string }>;
}

export async function GET() {
    try {
        // Start all queries in parallel for speed
        const [cacheResult, trendingResult, recentResult] = await Promise.all([
            // Get cached stats (sub-millisecond - just 1 row)
            supabase
                .from('skill_stats')
                .select('total_skills, unique_authors, top_authors')
                .eq('id', 'global')
                .single(),

            // Get trending skills - uses idx_skills_stars index
            supabase
                .from('skills')
                .select('id, name, description, author, stars, scoped_name, author_avatar')
                .order('stars', { ascending: false })
                .limit(6),

            // Get recent skills - uses idx_skills_updated_at index
            supabase
                .from('skills')
                .select('id, name, description, author, stars, scoped_name, author_avatar')
                .order('updated_at', { ascending: false, nullsFirst: false })
                .limit(6),
        ]);

        const trending = trendingResult.data || [];
        const recent = recentResult.data || [];

        // Use cached stats - if cache miss, use defaults (will be updated by background job)
        let totalSkills = 50000; // Approximate fallback
        let uniqueAuthors = 5000;
        let topAuthors: Array<{ name: string; skillCount: number; avatar: string }> = [];

        if (cacheResult.data && !cacheResult.error) {
            const cache = cacheResult.data as CachedStats;
            totalSkills = cache.total_skills;
            uniqueAuthors = cache.unique_authors;
            topAuthors = cache.top_authors || [];
        }

        return NextResponse.json({
            stats: {
                totalSkills,
                uniqueAuthors,
                totalStars: 0,
            },
            trending: trending.map(s => ({
                id: s.id,
                name: s.name,
                description: s.description,
                author: s.author,
                stars: s.stars,
                scopedName: s.scoped_name,
                authorAvatar: s.author_avatar,
            })),
            recent: recent.map(s => ({
                id: s.id,
                name: s.name,
                description: s.description,
                author: s.author,
                stars: s.stars,
                scopedName: s.scoped_name,
                authorAvatar: s.author_avatar,
            })),
            topAuthors,
        });
    } catch (error) {
        console.error('Stats API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
