// Pure parsers/mappers/SQL builders for catalog ingestion (spec §7.1-7.3). No network, no wrangler.
import { createHash } from 'node:crypto';
import matter from 'gray-matter';
import { sqlValue } from './d1.mjs';

export const MAX_STATEMENT_BYTES = 100_000;   // D1 per-statement cap
export const MAX_README_BYTES = 90_000;       // leaves room for the other columns
export const EXCERPT_CHARS = 500;
export const PERMISSIVE = new Set(['MIT', 'Apache-2.0', 'CC0-1.0', 'BSD-2-Clause', 'BSD-3-Clause']);
export const TYPE_SEGMENT = { mcp: 'mcp', agent: 'agents', plugin: 'plugins' }; // sitemap page names + URL segments
export const SITEMAP_URLS_PER_FILE = 45_000;
const REGISTRY_V01 = 'https://registry.modelcontextprotocol.io/v0.1/servers';

export function slugify(...parts) {
  return parts
    .map((p) => String(p ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean).join('--').slice(0, 200).replace(/-+$/, '');
}
export const mcpSlug = (registryName) => slugify(...registryName.split('/'));

export function githubRepo(url) {
  const m = /^(?:git\+)?https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?(?:[/#?].*)?$/.exec(url ?? '');
  return m ? `${m[1]}/${m[2]}` : null;
}

// ---- MCP registry -> install_json (spec §7.3) ----
function argValues(list = []) {
  return list.flatMap((a) => {
    const v = a.value ?? a.default ?? (a.isRequired ? `<${a.valueHint ?? a.format ?? 'value'}>` : null);
    if (v == null) return [];
    return a.type === 'named' ? [a.name, String(v)] : [String(v)];
  });
}
const RUNNERS = {
  npm: (p) => {
    const command = p.runtimeHint === 'bunx' ? 'bunx' : 'npx';
    const rt = p.runtimeArguments?.length ? argValues(p.runtimeArguments) : command === 'npx' ? ['-y'] : [];
    return { command, args: [...rt, p.identifier, ...argValues(p.packageArguments)] };
  },
  pypi: (p) => ({ command: 'uvx', args: [...argValues(p.runtimeArguments), p.identifier, ...argValues(p.packageArguments)] }),
  oci: (p, envNames) => ({
    command: 'docker',
    args: ['run', '-i', '--rm', ...envNames.flatMap((n) => ['-e', n]), ...argValues(p.runtimeArguments), p.identifier, ...argValues(p.packageArguments)],
  }),
};
const REMOTE = { 'streamable-http': 'http', sse: 'sse' };
const isEmpty = (v) => v == null || (Array.isArray(v) ? v.length === 0 : typeof v === 'object' && Object.keys(v).length === 0);
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => !isEmpty(v)));

// Remote first (no local code execution), else the first stdio package we know how to run. mcpb/unknown -> null.
export function mcpInstall(server) {
  const vars = [];
  const remote = (server.remotes ?? []).find((r) => REMOTE[r.type]);
  if (remote) {
    const headers = {};
    for (const h of remote.headers ?? []) {
      vars.push({ kind: 'header', name: h.name, description: h.description ?? '', required: !!h.isRequired, secret: !!h.isSecret });
      if (h.isRequired) headers[h.name] = '<required>';
    }
    for (const [name, v] of Object.entries(remote.variables ?? {})) {
      vars.push({ kind: 'url', name, description: v.description ?? '', required: !!v.isRequired, secret: false });
    }
    return clean({ type: 'mcp', transport: REMOTE[remote.type], url: remote.url, headers, vars });
  }
  const pkg = (server.packages ?? []).find((p) => p.transport?.type === 'stdio' && RUNNERS[p.registryType]);
  if (!pkg) return null;
  const env = {};
  for (const e of pkg.environmentVariables ?? []) {
    vars.push({ kind: 'env', name: e.name, description: e.description ?? '', required: !!e.isRequired, secret: !!e.isSecret });
    if (e.isRequired) env[e.name] = '<required>';
  }
  const { command, args } = RUNNERS[pkg.registryType](pkg, Object.keys(env));
  return clean({ type: 'mcp', transport: 'stdio', command, args, env, vars });
}

export function registryToItem(entry) {
  const s = entry?.server ?? {};
  if (typeof s.name !== 'string' || !s.name.includes('/')) return null;
  const meta = entry._meta?.['io.modelcontextprotocol.registry/official'] ?? {};
  const repo = githubRepo(s.repository?.url);
  const owner = repo ? repo.split('/')[0] : s.name.split('/')[0];
  return {
    type: 'mcp', slug: mcpSlug(s.name), name: String(s.title || s.name.split('/').pop()).slice(0, 200),
    author: owner, description: s.description ?? null, repo_full_name: repo,
    source_url: `${REGISTRY_V01}/${encodeURIComponent(s.name)}/versions/latest`,
    path: s.repository?.subfolder ?? null, branch: null, stars: 0, license: null,
    homepage: s.websiteUrl ?? (repo ? `https://github.com/${repo}` : null),
    author_avatar: repo ? `https://github.com/${owner}.png` : null,
    category: null, tags: null, install_json: mcpInstall(s), readme: null, content_hash: null,
    status: meta.status && meta.status !== 'active' ? 'removed' : 'active',
    pushed_at: null, updated_at: meta.updatedAt ?? null,
  };
}

// ---- license gate, hashing, classification ----
function truncateBytes(s, max) {
  const b = Buffer.from(s);
  return b.length <= max ? s : b.subarray(0, max).toString('utf8').replace(/\uFFFD+$/, '');
}
export function gateReadme(text, spdx) {
  if (!text) return null;
  return PERMISSIVE.has(spdx) ? truncateBytes(text, MAX_README_BYTES) : text.slice(0, EXCERPT_CHARS);
}
export const contentHash = (text) =>
  createHash('sha256').update(String(text).replace(/\r/g, '').replace(/\s+/g, ' ').trim()).digest('hex').slice(0, 32);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordRe = (term) => new RegExp(`(^|[^a-z0-9])${esc(term.toLowerCase())}($|[^a-z0-9])`);
export function categorize(text, categories) {
  const t = String(text ?? '').toLowerCase();
  let best = null, bestScore = 0;
  for (const c of categories) {
    const score = (c.keywords ?? []).reduce((n, k) => n + (wordRe(String(k)).test(t) ? 1 : 0), 0);
    if (score > bestScore) { best = c.id; bestScore = score; }
  }
  return best;
}
// Match on name + description only (registry names like io.github.* would match "github" everywhere).
export function matchTools(text, tools) {
  const t = String(text ?? '').toLowerCase();
  return tools.filter((tool) => (tool.aliases ?? []).some((a) => wordRe(a).test(t))).map((tool) => tool.id);
}

// ---- sitemap_pages rows for /sitemap-<seg>-<n>.xml (A's index lists every sitemap_pages row) ----
export function itemSitemapPages(rows, now, perFile = SITEMAP_URLS_PER_FILE) {
  const out = [];
  for (const [type, seg] of Object.entries(TYPE_SEGMENT)) {
    const list = rows.filter((r) => r.type === type).sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
    for (let i = 0; i < list.length; i += perFile) {
      const chunk = list.slice(i, i + perFile);
      const lastmod = chunk.reduce((m, r) => (r.updated_at && r.updated_at > m ? r.updated_at : m), '') || now;
      out.push({ name: `${seg}-${i / perFile}`, start_key: chunk[0].slug, url_count: chunk.length, lastmod });
    }
  }
  return out;
}
export function sitemapPagesSql(pages) {
  return [
    `DELETE FROM sitemap_pages WHERE name GLOB 'mcp-[0-9]*' OR name GLOB 'agents-[0-9]*' OR name GLOB 'plugins-[0-9]*' OR name GLOB 'tools-[0-9]*';`,
    ...pages.map((p) => `INSERT INTO sitemap_pages (name, start_key, url_count, lastmod) VALUES (${[p.name, p.start_key, p.url_count, p.lastmod].map(sqlValue).join(', ')});`),
  ];
}

// ---- SQL ----
export const ITEM_COLUMNS = ['type', 'slug', 'name', 'author', 'description', 'repo_full_name', 'source_url', 'path', 'branch',
  'stars', 'license', 'homepage', 'author_avatar', 'category', 'tags', 'install_json', 'readme', 'content_hash', 'status',
  'pushed_at', 'updated_at'];
const UPSERT_SET = ITEM_COLUMNS.filter((c) => c !== 'type' && c !== 'slug').map((c) => (c === 'status'
  ? `status = CASE WHEN items.status = 'takedown' THEN 'takedown' ELSE excluded.status END` // manual takedowns survive nightly runs
  : `${c} = excluded.${c}`)).join(', ');

export function upsertItemSql(row) {
  const build = (r) => `INSERT INTO items (${ITEM_COLUMNS.join(', ')}) VALUES (${ITEM_COLUMNS.map((c) => sqlValue(r[c] ?? null)).join(', ')}) ON CONFLICT(type, slug) DO UPDATE SET ${UPSERT_SET};`;
  let sql = build(row);
  if (Buffer.byteLength(sql) >= MAX_STATEMENT_BYTES) sql = build({ ...row, readme: row.readme?.slice(0, EXCERPT_CHARS) ?? null });
  if (Buffer.byteLength(sql) >= MAX_STATEMENT_BYTES) throw new Error(`item ${row.type}/${row.slug} too big for one D1 statement`);
  return sql;
}
export const itemToolsSql = (type, slug, toolIds = []) => toolIds.map((id) =>
  `INSERT OR IGNORE INTO item_tools (item_type, item_ref, tool_id) SELECT ${sqlValue(type)}, CAST(seq AS TEXT), ${sqlValue(id)} FROM items WHERE type = ${sqlValue(type)} AND slug = ${sqlValue(slug)};`);
// OR IGNORE: Section C may curate tool descriptions; never overwrite them.
export const seedToolsSql = (tools) => tools.map((t) =>
  `INSERT OR IGNORE INTO tools (id, name, aliases, homepage, description) VALUES (${[t.id, t.name, JSON.stringify(t.aliases ?? []), t.homepage ?? null, t.description ?? null].map(sqlValue).join(', ')});`);
export const setStateSql = (key, value) =>
  `INSERT INTO job_state (key, value) VALUES (${sqlValue(key)}, ${sqlValue(value)}) ON CONFLICT(key) DO UPDATE SET value = excluded.value;`;

// Spec §7.2.6: same content_hash => earliest-created repo is canonical; copies point at it (not indexable).
export const DEDUPE_SQL = `UPDATE items SET canonical_seq = nullif((
  SELECT i2.seq FROM items i2 LEFT JOIN repo_scan r2 ON r2.repo_full_name = i2.repo_full_name
  WHERE i2.type = items.type AND i2.content_hash = items.content_hash AND i2.status = 'active'
  ORDER BY coalesce(r2.created_at, '9999') ASC, i2.seq ASC LIMIT 1), seq)
WHERE content_hash IS NOT NULL;`;

// Skills -> tools edges, computed inside D1: trigram FTS narrows candidates, GLOB enforces word boundaries.
export function skillToolsSql(tools) {
  return tools.flatMap((t) => (t.aliases ?? [])
    .filter((a) => [...a].length >= 3 && !/["*?[\]]/.test(a))
    .map((a) => `INSERT OR IGNORE INTO item_tools (item_type, item_ref, tool_id) SELECT 'skill', s.id, ${sqlValue(t.id)}
FROM skills_fts JOIN skills s ON s.seq = skills_fts.rowid
WHERE skills_fts MATCH ${sqlValue(`{name description}: "${a}"`)}
AND (' ' || lower(s.name || ' ' || coalesce(s.description, '')) || ' ') GLOB ${sqlValue(`*[^a-z0-9]${a}[^a-z0-9]*`)};`));
}
// ---- subagents / tree targets (spec §7.2 steps 2-4, 7) ----
export const MAX_AGENTS_PER_REPO = 200;
const AGENT_RE = /(?:^|\/)(?:\.claude\/agents|agents)\/(?:[^/]+\/)*[^/]+\.md$/i;
const NOT_AGENT = /(?:^|\/)(?:readme|claude|agents|changelog|license|contributing|index)\.md$|\.agent\.md$|(?:^|\/)node_modules\//i;
const SERVER_JSON_RE = /^(?:[^/]+\/)?server\.json$/;

export const agentSlug = (repo, path) => slugify(...repo.split('/'), ...path.replace(/^\.claude\/agents\//, '').replace(/\.md$/i, '').split('/'));

export function findTargets(paths) {
  const set = new Set(paths);
  return {
    ignore: set.has('.agentskills-ignore'),
    agents: paths.filter((p) => AGENT_RE.test(p) && !NOT_AGENT.test(p)).slice(0, MAX_AGENTS_PER_REPO),
    marketplace: set.has('.claude-plugin/marketplace.json') ? '.claude-plugin/marketplace.json' : null,
    serverJson: paths.filter((p) => SERVER_JSON_RE.test(p)).slice(0, 5),
    packageJson: set.has('package.json'),
    paths: set,
  };
}

export function parseAgentFile(text, { repo, path }) {
  let fm;
  try { fm = matter(text); } catch { return null; }
  const { name, description, tools, model } = fm.data ?? {};
  if (typeof name !== 'string' || typeof description !== 'string' || !name.trim() || !description.trim()) return null;
  const toolList = Array.isArray(tools) ? tools.map(String)
    : typeof tools === 'string' ? tools.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const owner = repo.split('/')[0];
  const install = { type: 'agent', file: path.split('/').pop(), path, rawUrl: `https://raw.githubusercontent.com/${repo}/HEAD/${path}` };
  if (toolList.length) install.tools = toolList;
  if (typeof model === 'string' && model) install.model = model;
  return {
    type: 'agent', slug: agentSlug(repo, path), name: name.trim().slice(0, 200), author: owner,
    description: description.replace(/\s+/g, ' ').trim().slice(0, 1000), repo_full_name: repo,
    source_url: `https://github.com/${repo}/blob/HEAD/${path}`, path, branch: null, stars: 0, license: null,
    homepage: `https://github.com/${repo}`, author_avatar: `https://github.com/${owner}.png`, category: null, tags: null,
    install_json: install, readme: fm.content.trim() || null, content_hash: contentHash(text), status: 'active',
    pushed_at: null, updated_at: null,
  };
}

export function packageJsonToMcp(text, repo) {
  let p;
  try { p = JSON.parse(text); } catch { return null; }
  const kw = Array.isArray(p?.keywords) ? p.keywords.map((k) => String(k).toLowerCase()) : [];
  if (!p || p.private || typeof p.name !== 'string' || !p.bin || !kw.some((k) => ['mcp', 'mcp-server', 'modelcontextprotocol'].includes(k))) return null;
  const owner = repo.split('/')[0];
  return {
    type: 'mcp', slug: slugify('npm', p.name.replace(/^@/, '')), name: p.name, author: owner,
    description: typeof p.description === 'string' ? p.description : null, repo_full_name: repo,
    source_url: `https://www.npmjs.com/package/${p.name}`, path: null, branch: null, stars: 0, license: null,
    homepage: typeof p.homepage === 'string' ? p.homepage : `https://github.com/${repo}`, author_avatar: `https://github.com/${owner}.png`,
    category: null, tags: kw.slice(0, 20), install_json: { type: 'mcp', transport: 'stdio', command: 'npx', args: ['-y', p.name] },
    readme: null, content_hash: null, status: 'active', pushed_at: null, updated_at: null,
  };
}

// Code search needs a search term besides qualifiers; size: slices get past the 1,000-result cap per query.
const CODE_QUERIES = [
  { q: 'plugins filename:marketplace.json path:.claude-plugin', hint: null },
  { q: 'description path:.claude/agents extension:md', hint: null },
  { q: 'modelcontextprotocol filename:server.json', hint: 'mcp' },
];
const SIZES = ['size:<1000', 'size:1000..2999', 'size:3000..7999', 'size:>=8000'];
export const CODE_PLAN = CODE_QUERIES.flatMap(({ q, hint }) => SIZES.flatMap((s) =>
  Array.from({ length: 10 }, (_, i) => ({ kind: 'code', q: `${q} ${s}`, page: i + 1, hint }))));

export function dripPlan(cursor, budget, today) {
  const day = (n) => new Date(Date.parse(today) - n * 86_400_000).toISOString().slice(0, 10);
  const daily = [
    { kind: 'repositories', q: `topic:mcp-server pushed:${day(2)}..${day(0)}`, page: 1, hint: 'mcp' },
    { kind: 'repositories', q: `topic:claude-code-subagents pushed:>=${day(7)}`, page: 1, hint: null },
    { kind: 'repositories', q: `topic:claude-code-plugin pushed:>=${day(7)}`, page: 1, hint: null },
  ];
  const start = ((cursor % CODE_PLAN.length) + CODE_PLAN.length) % CODE_PLAN.length;
  const n = Math.min(Math.max(0, budget - daily.length), CODE_PLAN.length);
  const code = Array.from({ length: n }, (_, i) => CODE_PLAN[(start + i) % CODE_PLAN.length]);
  return { queries: [...daily, ...code], nextCursor: (start + n) % CODE_PLAN.length };
}

export function removeMissingSql(repo, type, keepSourceUrls) {
  const notIn = keepSourceUrls.length ? ` AND source_url NOT IN (${keepSourceUrls.map(sqlValue).join(', ')})` : '';
  return `UPDATE items SET status = 'removed' WHERE repo_full_name = ${sqlValue(repo)} AND type = ${sqlValue(type)} AND status = 'active'${notIn};`;
}
// ponytail: fork status comes from live GraphQL, opt-out is re-derived from the tree, license lives on items.
export function repoScanSql(repo, m, now) {
  const v = [repo, m?.headSha ?? null, m?.createdAt ?? null, m?.stars ?? null, now].map(sqlValue).join(', ');
  return `INSERT INTO repo_scan (repo_full_name, head_sha, created_at, stars, scanned_at) VALUES (${v}) ON CONFLICT(repo_full_name) DO UPDATE SET head_sha = excluded.head_sha, created_at = excluded.created_at, stars = excluded.stars, scanned_at = excluded.scanned_at;`;
}
const removeRepoSql = (repo) => `UPDATE items SET status = 'removed' WHERE repo_full_name = ${sqlValue(repo)} AND status = 'active';`;
export const optOutSql = (repo, m, now) => [removeRepoSql(repo), repoScanSql(repo, m, now)];
export const goneSql = (repo, now) => [removeRepoSql(repo),
  `UPDATE repo_scan SET head_sha = '-', scanned_at = ${sqlValue(now)} WHERE repo_full_name = ${sqlValue(repo)};`];
export const starsSql = (repo, stars) => `UPDATE items SET stars = ${Number(stars) || 0} WHERE repo_full_name = ${sqlValue(repo)};`;
// ---- plugins (spec §7.2 step 4: manifests -> bundle edges) ----
export const MAX_PLUGINS_PER_REPO = 500;

export function pluginComponents(paths, dir) {
  const pre = dir ? `${dir}/` : '';
  const names = (re) => {
    const out = [];
    for (const p of paths) if (p.startsWith(pre)) { const m = re.exec(p.slice(pre.length)); if (m) out.push(m[1]); }
    return out;
  };
  return {
    skills: names(/^skills\/([^/]+)\/SKILL\.md$/),
    agents: names(/^agents\/([^/]+)\.md$/),
    commands: names(/^commands\/([^/]+)\.md$/),
    mcp: paths.has(`${pre}.mcp.json`),
    hooks: paths.has(`${pre}hooks/hooks.json`),
  };
}

export function parseMarketplace(text, { repo, paths }) {
  let m;
  try { m = JSON.parse(text); } catch { return []; }
  if (typeof m?.name !== 'string' || !Array.isArray(m.plugins)) return [];
  const owner = repo.split('/')[0];
  return m.plugins.slice(0, MAX_PLUGINS_PER_REPO).flatMap((p) => {
    if (typeof p?.name !== 'string' || !p.name.trim() || !p.source) return [];
    const dir = typeof p.source === 'string' ? p.source.replace(/^\.(?:\/|$)/, '').replace(/\/+$/, '') : null;
    if (dir?.split('/').includes('..')) return [];
    const kw = Array.isArray(p.keywords) ? p.keywords : Array.isArray(p.tags) ? p.tags : [];
    return [{
      type: 'plugin', slug: slugify(...repo.split('/'), p.name), name: p.name.slice(0, 200), author: owner,
      description: typeof p.description === 'string' ? p.description.slice(0, 1000) : null, repo_full_name: repo,
      source_url: `https://github.com/${repo}/blob/HEAD/.claude-plugin/marketplace.json#${encodeURIComponent(p.name)}`,
      path: dir, branch: null, stars: 0, license: null, homepage: `https://github.com/${repo}`,
      author_avatar: `https://github.com/${owner}.png`, category: null, // set by categorize() in the job; marketplace categories are free text
      tags: kw.length ? kw.map(String).slice(0, 20) : null,
      install_json: { type: 'plugin', marketplace: repo, marketplaceName: m.name, plugin: p.name,
        components: dir === null ? null : pluginComponents(paths, dir) },
      readme: null, content_hash: contentHash(JSON.stringify({ name: p.name, source: p.source, description: p.description ?? null })),
      status: 'active', pushed_at: null, updated_at: null,
    }];
  });
}
