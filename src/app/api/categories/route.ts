import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cache for 24 hours (categories rarely change)
export const revalidate = 86400;

export async function GET() {
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('id, name, icon, skill_count, sort_order')
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Categories error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ categories: categories || [] });
    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
