import { cache } from 'react';
import { getDb } from './db';

export interface SkillRow {
    id: string; name: string; description: string | null; author: string; stars: number; forks: number;
    github_url: string; raw_url: string | null; repo_full_name: string | null; path: string | null; branch: string;
    author_avatar: string | null; updated_at: string | null; scoped_name: string | null; content: string | null;
    folder_url: string | null; indexable: number; seq: number; category: string | null;
}

const COLS = 'id, name, description, author, stars, forks, github_url, raw_url, repo_full_name, path, branch, author_avatar, updated_at, scoped_name, content, folder_url, indexable, seq, category';
const RELATED_COLS = 'id, name, description, author, stars, forks, github_url, raw_url, repo_full_name, path, branch, author_avatar, updated_at, scoped_name, NULL AS content, folder_url, indexable, seq, category';

// 29,579 scoped_names are duplicated: always take the highest-starred row.
// Fallback on bare name (old behaviour) but no more full-table "contains" scan.
export const getSkillBySlug = cache(async (scopedName: string): Promise<SkillRow | null> => {
    const db = getDb();
    return (await db.prepare(`SELECT ${COLS} FROM skills WHERE scoped_name = ? ORDER BY stars DESC, indexable DESC LIMIT 1`).bind(scopedName).first<SkillRow>())
        ?? (await db.prepare(`SELECT ${COLS} FROM skills WHERE name = ? COLLATE NOCASE ORDER BY (lower('@' || author) = lower(?)) DESC, stars DESC, indexable DESC LIMIT 1`).bind(scopedName.split('/').pop() ?? '', scopedName.split('/')[0]).first<SkillRow>());
});

// ponytail: GitHub raw only for the ~7.7K rows without stored content (GitHub rate-limits raw since 2025-05).
export const getSkillContent = cache(async (scopedName: string): Promise<string | null> => {
    const skill = await getSkillBySlug(scopedName);
    if (!skill) return null;
    if (skill.content) return skill.content;
    if (!skill.raw_url?.startsWith('https://raw.githubusercontent.com/')) return null;
    try {
        const res = await fetch(skill.raw_url, { signal: AbortSignal.timeout(3000) });
        return res.ok ? (await res.text()).slice(0, 200_000) : null;
    } catch {
        return null;
    }
});

export async function getRelatedSkills(author: string, excludeId: string): Promise<SkillRow[]> {
    const { results } = await getDb()
        .prepare(`SELECT ${RELATED_COLS} FROM skills WHERE author = ? AND id <> ? ORDER BY stars DESC LIMIT 4`)
        .bind(author, excludeId).all<SkillRow>();
    return results;
}

export const getSkillSummary = cache(async (seq: number): Promise<string | null> =>
    (await getDb().prepare('SELECT summary FROM skill_summaries WHERE skill_seq = ?').bind(seq).first<{ summary: string }>())?.summary ?? null);
