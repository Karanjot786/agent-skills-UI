// Pure SQL builders for D1. No framework imports so `node --test` can run them.
export const MAX_LIMIT = 100;
export const SKILLS_PER_SITEMAP = 45_000;

export interface SkillsQuery {
    search: string; name: string; category: string | null; author: string | null;
    minStars: number; hasContent: boolean; sortBy: 'stars' | 'recent' | 'name';
    limit: number; offset: number;
}

const int = (v: string | null, d: number) => { const n = Number.parseInt(v ?? '', 10); return Number.isFinite(n) ? n : d; };

export function parseSkillsQuery(sp: URLSearchParams): SkillsQuery {
    const sortBy = sp.get('sortBy');
    return {
        search: (sp.get('search') ?? '').trim().slice(0, 200),
        name: (sp.get('name') ?? '').trim(),
        category: sp.get('category'),
        author: sp.get('author'),
        minStars: Math.max(0, int(sp.get('minStars'), 0)),
        hasContent: sp.get('hasContent') === 'true',
        sortBy: sortBy === 'recent' || sortBy === 'name' ? sortBy : 'stars',
        limit: Math.min(MAX_LIMIT, Math.max(1, int(sp.get('limit'), 30))),
        offset: Math.min(100_000, Math.max(0, int(sp.get('offset'), 0))),
    };
}

const COLS = 's.id, s.name, s.description, s.author, s.stars, s.forks, s.github_url, s.scoped_name, s.author_avatar, s.repo_full_name, s.path, s.category, (s.content IS NOT NULL) AS has_content';
const ORDER = { stars: 's.stars DESC', recent: 's.updated_at DESC', name: 's.name ASC' } as const;

export function buildSkillsSql(q: SkillsQuery) {
    const where: string[] = [];
    const binds: (string | number)[] = [];
    let from = 'skills s';
    if (q.name) {
        where.push('s.name = ? COLLATE NOCASE'); binds.push(q.name);
    } else if ([...q.search].length >= 3) {
        // trigram FTS: whole input as one phrase => substring match, operators stay literal
        from = 'skills_fts JOIN skills s ON s.seq = skills_fts.rowid';
        where.push('skills_fts MATCH ?'); binds.push(`"${q.search.replace(/"/g, '""')}"`);
    } else if (q.search) {
        // ponytail: 1-2 char queries can't use trigrams; full scan on name only (rare). Upgrade: prefix index if it shows in D1 rows-read.
        where.push('s.name LIKE ?'); binds.push(`%${q.search}%`);
    }
    if (q.category && q.category !== 'all') { where.push('s.category = ?'); binds.push(q.category); }
    if (q.author) { where.push('s.author = ?'); binds.push(q.author); }
    if (q.minStars > 0) { where.push('s.stars >= ?'); binds.push(q.minStars); }
    if (q.hasContent) where.push('s.content IS NOT NULL');
    const w = where.length ? ` WHERE ${where.join(' AND ')}` : '';
    return {
        sql: `SELECT ${COLS} FROM ${from}${w} ORDER BY ${ORDER[q.sortBy]} LIMIT ? OFFSET ?`,
        countSql: `SELECT count(*) AS total FROM ${from}${w}`,
        binds,
    };
}
