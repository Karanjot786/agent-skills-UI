// Pure naming + SQL builders for the items catalog (spec §7). No framework or alias imports: `node --test` runs it.
export type ItemType = 'mcp' | 'agent' | 'plugin' | 'rule';
export type LiveItemType = Exclude<ItemType, 'rule'>;
export const LIVE_ITEM_TYPES: readonly LiveItemType[] = ['mcp', 'agent', 'plugin']; // 'rule' after day 30
export const TYPE_SEGMENT: Record<ItemType, string> = { mcp: 'mcp', agent: 'agents', plugin: 'plugins', rule: 'rules' };
// ponytail: no 'rule' label until rules ship (LIVE_ITEM_TYPES excludes them).
export const TYPE_LABELS: Record<LiveItemType, { singular: string; plural: string; blurb: string }> = {
    mcp: { singular: 'MCP Server', plural: 'MCP Servers',
        blurb: 'MCP servers from the official registry and GitHub, with ready-to-paste config for Claude Code, Cursor, VS Code, Codex, Windsurf and Gemini.' },
    agent: { singular: 'Subagent', plural: 'Claude Code Subagents',
        blurb: 'Claude Code subagents from GitHub: what each one does, its tools and model, and a one-line install.' },
    plugin: { singular: 'Plugin', plural: 'Claude Code Plugins',
        blurb: 'Claude Code plugins from public marketplaces, with the skills, agents, commands and MCP servers each one bundles.' },
};
export const PAGE_SIZE = 48;
export const MAX_PAGE = 200;
export const PERMISSIVE_LICENSES: ReadonlySet<string> = new Set(['MIT', 'Apache-2.0', 'CC0-1.0', 'BSD-2-Clause', 'BSD-3-Clause']);

export function isItemType(v: string): v is LiveItemType { return (LIVE_ITEM_TYPES as readonly string[]).includes(v); }
export function typeFromSegment(seg: string): LiveItemType | null { return LIVE_ITEM_TYPES.find((t) => TYPE_SEGMENT[t] === seg) ?? null; }
export const isValidSlug = (s: string) => /^[a-z0-9](?:[a-z0-9-]{0,198}[a-z0-9])?$/.test(s);
export const itemPath = (type: ItemType, slug: string) => `/${TYPE_SEGMENT[type]}/${slug}`;

export const ITEM_LIST_COLS = 'i.seq, i.type, i.slug, i.name, i.author, i.description, i.stars, i.category, i.author_avatar, i.license, i.updated_at';
const LIVE = `i.status = 'active' AND i.canonical_seq IS NULL`;

export interface ListQuery { type: ItemType; category?: string | null; page: number; pageSize: number }

// LIMIT size+1: the extra row tells us whether a next page exists (no count(*) on the request path).
export function buildListSql(q: ListQuery) {
    const page = Math.min(MAX_PAGE, Math.max(1, Math.trunc(q.page) || 1));
    const size = Math.min(100, Math.max(1, Math.trunc(q.pageSize) || PAGE_SIZE));
    const binds: (string | number)[] = [q.type];
    let where = `i.type = ? AND ${LIVE}`;
    if (q.category) { where += ' AND i.category = ?'; binds.push(q.category); }
    binds.push(size + 1, (page - 1) * size);
    return { sql: `SELECT ${ITEM_LIST_COLS} FROM items i WHERE ${where} ORDER BY i.stars DESC, i.seq ASC LIMIT ? OFFSET ?`, binds, size };
}

export function buildItemSearchSql(raw: string, type: ItemType | null, limit: number) {
    const q = raw.replace(/\0/g, '').trim().slice(0, 200);
    if (!q) return null;
    const n = Math.min(50, Math.max(1, Math.trunc(limit) || 10));
    const binds: (string | number)[] = [];
    let from = 'items i';
    let where: string;
    if ([...q].length >= 3) {
        from = 'items_fts JOIN items i ON i.seq = items_fts.rowid';
        where = `items_fts MATCH ? AND ${LIVE}`; binds.push(`"${q.replace(/"/g, '""')}"`); // whole input = one trigram phrase
    } else {
        where = `i.name LIKE ? AND ${LIVE}`; binds.push(`%${q}%`);
    }
    if (type) { where += ' AND i.type = ?'; binds.push(type); }
    binds.push(n);
    return { sql: `SELECT ${ITEM_LIST_COLS} FROM ${from} WHERE ${where} ORDER BY i.stars DESC LIMIT ?`, binds };
}

export function itemMetaDescription(name: string, singular: string, description: string | null): string {
    const d = (description ?? '').replace(/\s+/g, ' ').trim();
    if (d.length < 50) return `Install ${name} (${singular}) in Claude Code, Cursor, VS Code, Codex and more with one command.`;
    return d.length > 155 ? `${d.slice(0, 154).trimEnd()}…` : d;
}
