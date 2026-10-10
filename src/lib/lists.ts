import { cache } from 'react';
import { getDb } from './db';
import { PAGE_SIZE } from './structure';

export interface ListSkill {
  seq: number; id: string; name: string; description: string | null; author: string;
  stars: number; scoped_name: string; category: string | null; updated_at: string | null;
}
const LIST_COLS = 'seq, id, name, description, author, stars, scoped_name, category, updated_at';

// INDEXED BY pins the (stars|category,stars|author,stars) index so ORDER BY needs no sort over 222K rows.
export async function listSkills(o: { category?: string; author?: string; page: number; limit?: number }): Promise<ListSkill[]> {
  const where = ['indexable = 1', 'scoped_name IS NOT NULL'];
  const binds: (string | number)[] = [];
  if (o.category) { where.push('category = ?'); binds.push(o.category); }
  if (o.author) { where.push('author = ?'); binds.push(o.author); }
  const index = o.category ? 'idx_skills_cat_stars' : o.author ? 'idx_skills_author' : 'idx_skills_stars';
  const limit = o.limit ?? PAGE_SIZE;
  const { results } = await getDb()
    .prepare(`SELECT ${LIST_COLS} FROM skills INDEXED BY ${index} WHERE ${where.join(' AND ')} ORDER BY stars DESC, seq LIMIT ${limit} OFFSET ?`)
    .bind(...binds, (o.page - 1) * limit).all<ListSkill>();
  return results;
}

export interface CategoryRow { id: string; name: string; icon: string; skill_count: number }
export const getCategories = cache(async (): Promise<CategoryRow[]> =>
  (await getDb().prepare('SELECT id, name, icon, skill_count FROM categories ORDER BY sort_order').all<CategoryRow>()).results);
// ponytail: reuse the cached full list (14 rows) instead of a second query.
export const getCategory = async (id: string) => (await getCategories()).find((c) => c.id === id) ?? null;

export const getTotalSkills = cache(async () =>
  (await getDb().prepare("SELECT total_skills FROM skill_stats WHERE id = 'global'").first<{ total_skills: number }>())?.total_skills ?? 0);

export const getAuthorStats = cache(async (author: string) =>
  getDb().prepare('SELECT count(*) AS n, coalesce(sum(stars), 0) AS stars FROM skills INDEXED BY idx_skills_author WHERE author = ? AND indexable = 1')
    .bind(author).first<{ n: number; stars: number }>());

// Deterministic variety: each skill links to a different 8-slice of its category's top 200 (spreads internal links).
export async function getRelatedByCategory(category: string, seq: number, n = 8): Promise<ListSkill[]> {
  const q = (offset: number) => getDb()
    .prepare(`SELECT ${LIST_COLS} FROM skills INDEXED BY idx_skills_cat_stars WHERE category = ? AND indexable = 1 AND scoped_name IS NOT NULL AND seq <> ? ORDER BY stars DESC, seq LIMIT ${n} OFFSET ?`)
    .bind(category, seq, offset).all<ListSkill>();
  const first = (await q((seq % 25) * n)).results;
  return first.length ? first : (await q(0)).results;
}

export async function getBestList(topic: string) {
  const row = await getDb().prepare("SELECT topic, title, item_refs, updated_at FROM best_lists WHERE topic = ? AND locale = 'en'")
    .bind(topic).first<{ topic: string; title: string; item_refs: string; updated_at: string }>();
  return row ? { ...row, refs: JSON.parse(row.item_refs) as { type: string; ref: string }[] } : null;
}

export async function getBestSkills(ids: string[]): Promise<ListSkill[]> {
  if (!ids.length) return [];
  const { results } = await getDb().prepare(`SELECT ${LIST_COLS} FROM skills WHERE id IN (${ids.map(() => '?').join(',')})`).bind(...ids).all<ListSkill>();
  const byId = new Map(results.map((r) => [r.id, r]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

export async function getSummaries(seqs: number[]): Promise<Map<number, string>> {
  if (!seqs.length) return new Map();
  const { results } = await getDb().prepare(`SELECT skill_seq, summary FROM skill_summaries WHERE skill_seq IN (${seqs.map(() => '?').join(',')})`)
    .bind(...seqs).all<{ skill_seq: number; summary: string }>();
  return new Map(results.map((r) => [r.skill_seq, r.summary]));
}
