import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '30');
    const sortBy = searchParams.get('sortBy') || 'stars';
    const category = searchParams.get('category');
    const author = searchParams.get('author');
    const offset = parseInt(searchParams.get('offset') || '0');
    const minStars = parseInt(searchParams.get('minStars') || '0');
    const hasContent = searchParams.get('hasContent') === 'true';

    try {
        // If searching, try to use the ranked search RPC first
        if (search && search.trim()) {
            const { data: rpcData, error: rpcError } = await supabase.rpc('search_skills_ranked', {
                search_query: search.trim(),
                result_limit: limit,
                result_offset: offset,
                filter_category: category && category !== 'all' ? category : null,
                filter_author: author || null,
                filter_min_stars: minStars,
                filter_has_content: hasContent,
                sort_by: sortBy === 'stars' ? 'stars' : sortBy === 'recent' ? 'recent' : sortBy === 'name' ? 'name' : 'rank'
            });

            if (!rpcError && rpcData) {
                const skills = rpcData.map((skill: any) => ({
                    id: skill.id,
                    name: skill.name,
                    description: skill.description,
                    author: skill.author,
                    stars: skill.stars,
                    forks: skill.forks,
                    githubUrl: skill.github_url,
                    scopedName: skill.scoped_name,
                    authorAvatar: skill.author_avatar,
                    repoFullName: skill.repo_full_name,
                    path: skill.path,
                    category: skill.category,
                    hasContent: skill.has_content,
                }));

                return NextResponse.json({
                    skills,
                    total: skills.length, // RPC doesn't return total, estimate
                    limit,
                    offset,
                });
            }

            // Fallback: Use ILIKE but ORDER by exact name match first
            console.log('RPC not available, falling back to ILIKE with ordering');
        }

        // No search or RPC failed - use standard query
        let query = supabase
            .from('skills')
            .select('id, name, description, author, stars, forks, github_url, scoped_name, author_avatar, repo_full_name, path, category, content', { count: 'exact' });

        // Search with prioritized ILIKE (name first)
        if (search && search.trim()) {
            // Use textSearch if available, fallback to ILIKE
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,author.ilike.%${search}%`);
        }

        // Category filter
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        // Author filter
        if (author) {
            query = query.eq('author', author);
        }

        // Star range filter
        if (minStars > 0) {
            query = query.gte('stars', minStars);
        }

        // Has content filter
        if (hasContent) {
            query = query.not('content', 'is', null);
        }

        // Sorting
        if (sortBy === 'stars') {
            query = query.order('stars', { ascending: false });
        } else if (sortBy === 'recent') {
            query = query.order('updated_at', { ascending: false, nullsFirst: false });
        } else if (sortBy === 'name') {
            query = query.order('name', { ascending: true });
        }

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform and sort: if searching, put exact name matches first
        let skills = data?.map(skill => ({
            id: skill.id,
            name: skill.name,
            description: skill.description,
            author: skill.author,
            stars: skill.stars,
            forks: skill.forks,
            githubUrl: skill.github_url,
            scopedName: skill.scoped_name,
            authorAvatar: skill.author_avatar,
            repoFullName: skill.repo_full_name,
            path: skill.path,
            category: skill.category,
            hasContent: !!skill.content,
        })) || [];

        // If searching, re-sort to prioritize name matches
        if (search && search.trim() && sortBy !== 'name') {
            const searchLower = search.toLowerCase();
            skills = skills.sort((a, b) => {
                const aNameMatch = a.name.toLowerCase().includes(searchLower) ? 1 : 0;
                const bNameMatch = b.name.toLowerCase().includes(searchLower) ? 1 : 0;
                const aExactMatch = a.name.toLowerCase() === searchLower ? 2 : 0;
                const bExactMatch = b.name.toLowerCase() === searchLower ? 2 : 0;

                // Higher score = earlier position
                const aScore = aExactMatch + aNameMatch;
                const bScore = bExactMatch + bNameMatch;

                if (aScore !== bScore) {
                    return bScore - aScore; // Higher score first
                }
                // If same match type, keep original order (by stars/recent)
                return 0;
            });
        }

        return NextResponse.json({
            skills,
            total: count,
            limit,
            offset,
        });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
