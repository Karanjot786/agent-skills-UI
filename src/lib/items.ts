import { cache } from 'react';
import { getDb } from './db';
import { buildListSql, ITEM_LIST_COLS, PAGE_SIZE, type ItemType } from './items-sql';

export type { ItemType } from './items-sql';

export interface Item {
    seq: number; type: ItemType; slug: string; name: string; author: string; description: string | null;
    repo_full_name: string | null; source_url: string; path: string | null; branch: string | null; stars: number;
    license: string | null; homepage: string | null; author_avatar: string | null; category: string | null;
    tags: string | null; install_json: string | null; readme: string | null; summary: string | null;
    content_hash: string | null; canonical_seq: number | null; status: 'active' | 'removed' | 'takedown';
    pushed_at: string | null; indexed_at: string; updated_at: string | null; indexable: number;
}
export type ItemListRow = Pick<Item, 'seq' | 'type' | 'slug' | 'name' | 'author' | 'description' | 'stars' | 'category' | 'author_avatar' | 'license' | 'updated_at'>;
export interface CategoryRow { id: string; name: string }

export const getItem = cache(async (type: ItemType, slug: string): Promise<Item | null> =>
    getDb().prepare(`SELECT * FROM items WHERE type = ? AND slug = ? AND status = 'active'`).bind(type, slug).first<Item>());

export async function getItemBySeq(seq: number) {
    return getDb().prepare(`SELECT type, slug FROM items WHERE seq = ? AND status = 'active'`).bind(seq).first<{ type: ItemType; slug: string }>();
}

const listCached = cache(async (type: ItemType, category: string | null, page: number, pageSize: number) => {
    const { sql, binds, size } = buildListSql({ type, category, page, pageSize });
    const { results } = await getDb().prepare(sql).bind(...binds).all<ItemListRow>();
    return { items: results.slice(0, size), hasNext: results.length > size };
});
// Primitive args so React cache() dedupes generateMetadata + page calls.
export function listItems(q: { type: ItemType; category?: string | null; page: number; pageSize?: number }) {
    return listCached(q.type, q.category ?? null, q.page, q.pageSize ?? PAGE_SIZE);
}

export const listCategories = cache(async (): Promise<CategoryRow[]> =>
    (await getDb().prepare('SELECT id, name FROM categories ORDER BY sort_order').all<CategoryRow>()).results);

export async function getRelatedItems(item: Item, limit = 8): Promise<ItemListRow[]> {
    const [cond, value] = item.category ? ['i.category = ?', item.category] : ['i.author = ?', item.author];
    const { results } = await getDb().prepare(
        `SELECT ${ITEM_LIST_COLS} FROM items i WHERE i.type = ? AND ${cond} AND i.seq <> ? AND i.status = 'active' AND i.canonical_seq IS NULL ORDER BY i.stars DESC LIMIT ?`,
    ).bind(item.type, value, item.seq, limit).all<ItemListRow>();
    return results;
}

export async function getItemTools(item: Pick<Item, 'type' | 'seq'>) {
    const { results } = await getDb().prepare(
        'SELECT t.id, t.name FROM item_tools it JOIN tools t ON t.id = it.tool_id WHERE it.item_type = ? AND it.item_ref = ? ORDER BY t.name',
    ).bind(item.type, String(item.seq)).all<{ id: string; name: string }>();
    return results;
}

export async function listItemsForTool(toolId: string, perType = 12): Promise<Record<'mcp' | 'agent' | 'plugin', ItemListRow[]>> {
    const db = getDb();
    const stmt = (t: ItemType) => db.prepare(
        `SELECT ${ITEM_LIST_COLS} FROM item_tools it JOIN items i ON i.seq = CAST(it.item_ref AS INTEGER)
         WHERE it.tool_id = ? AND it.item_type = ? AND i.status = 'active' AND i.canonical_seq IS NULL ORDER BY i.stars DESC LIMIT ?`,
    ).bind(toolId, t, perType);
    const [m, a, p] = await db.batch([stmt('mcp'), stmt('agent'), stmt('plugin')]);
    return { mcp: m.results as ItemListRow[], agent: a.results as ItemListRow[], plugin: p.results as ItemListRow[] };
}
