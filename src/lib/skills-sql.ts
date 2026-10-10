// Pure SQL builders for D1. No framework imports so `node --test` can run them.
export const MAX_LIMIT = 100;
export const SKILLS_PER_SITEMAP = 45_000;
// Rows eligible for sitemaps (same filter the old routes used). Shared with scripts/jobs/refresh-derived.mjs.
export const INDEXABLE_SITEMAP_WHERE = "indexable = 1 AND scoped_name IS NOT NULL AND instr(scoped_name, '.') = 0 AND instr(scoped_name, '//') = 0";

export interface SkillsQuery {
    search: string; name: string; category: string | null; author: string | null;
    minStars: number; hasContent: boolean; sortBy: 'stars' | 'recent' | 'name';
    limit: number; offset: number; locale: string;
}

const int = (v: string | null, d: number) => { const n = Number.parseInt(v ?? '', 10); return Number.isFinite(n) ? n : d; };

export function parseSkillsQuery(sp: URLSearchParams): SkillsQuery {
    const sortBy = sp.get('sortBy');
    return {
        search: (sp.get('search') ?? '').replace(/\0/g, '').trim().slice(0, 200),
        name: (sp.get('name') ?? '').replace(/\0/g, '').trim(),
        category: sp.get('category'),
        author: sp.get('author'),
        minStars: Math.max(0, int(sp.get('minStars'), 0)),
        hasContent: sp.get('hasContent') === 'true',
        sortBy: sortBy === 'recent' || sortBy === 'name' ? sortBy : 'stars',
        limit: Math.min(MAX_LIMIT, Math.max(1, int(sp.get('limit'), 30))),
        offset: Math.min(100_000, Math.max(0, int(sp.get('offset'), 0))),
        locale: /^[a-z]{2}(-[A-Z]{2})?$/.test(sp.get('locale') ?? '') ? sp.get('locale')! : 'en',
    };
}

const COLS = 's.id, s.name, s.description, s.author, s.stars, s.forks, s.github_url, s.scoped_name, s.author_avatar, s.repo_full_name, s.path, s.category, (s.content IS NOT NULL) AS has_content';
const ORDER = { stars: 's.stars DESC', recent: 's.updated_at DESC', name: 's.name COLLATE NOCASE ASC' } as const;

export function buildSkillsSql(q: SkillsQuery) {
    const where: string[] = [];
    const binds: (string | number)[] = [];
    let from = 'skills s';
    let cols = COLS;
    const loc = q.locale !== 'en' ? q.locale : null;
    if (loc) {
        // join `?` appears before every WHERE `?`, so its bind goes first
        from += ' LEFT JOIN skill_i18n t ON t.skill_seq = s.seq AND t.locale = ?';
        binds.push(loc);
        cols = COLS.replace('s.description', 'COALESCE(t.description, s.description) AS description');
    }
    if (q.name) {
        where.push('s.name = ? COLLATE NOCASE'); binds.push(q.name);
    } else if ([...q.search].length >= 3) {
        const phrase = `"${q.search.replace(/"/g, '""')}"`;
        if (loc) {
            // FTS MATCH cannot be OR-ed with other terms directly, so wrap it in a subselect; LIKE runs on this locale's rows only
            where.push('(s.seq IN (SELECT rowid FROM skills_fts WHERE skills_fts MATCH ?) OR s.seq IN (SELECT skill_seq FROM skill_i18n WHERE locale = ? AND description LIKE ?))');
            binds.push(phrase, loc, `%${q.search}%`);
        } else {
            // trigram FTS: whole input as one phrase => substring match, operators stay literal
            from = 'skills_fts JOIN skills s ON s.seq = skills_fts.rowid';
            where.push('skills_fts MATCH ?'); binds.push(phrase);
        }
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
        sql: `SELECT ${cols} FROM ${from}${w} ORDER BY ${ORDER[q.sortBy]} LIMIT ? OFFSET ?`,
        countSql: `SELECT count(*) AS total FROM ${from}${w}`,
        binds,
    };
}
