#!/usr/bin/env node
// Nightly: official MCP registry -> items(type='mcp'). Spec §7.2 step 1, §7.3.
//   node scripts/jobs/ingest-mcp.mjs [--remote] [--full] [--limit N] [--dry-run]
// Needs GITHUB_TOKEN (GraphQL repo metadata). Never prints secrets.
import { parseArgs } from 'node:util';
import { sqlValue } from './lib/d1.mjs';
import { repoMeta, raw, pool, UA } from './lib/github.mjs';
import { applyStatements, getState, loadCategories, loadTools } from './lib/items-db.mjs';
import {
  registryToItem, gateReadme, categorize, matchTools, upsertItemSql, itemToolsSql, skillToolsSql, setStateSql,
} from './lib/items-parse.mjs';

const REGISTRY = 'https://registry.modelcontextprotocol.io/v0/servers';
const STATE_KEY = 'mcp_registry_since';
const { values: args } = parseArgs({ options: {
  remote: { type: 'boolean', default: false }, full: { type: 'boolean', default: false },
  'dry-run': { type: 'boolean', default: false }, limit: { type: 'string' },
} });
const remote = args.remote, dryRun = args['dry-run'];
const limit = args.limit ? Number(args.limit) : Infinity;
const outDir = '.jobs-out/ingest-mcp';

async function fetchRegistry(since) {
  const entries = [];
  let cursor;
  do {
    const u = new URL(REGISTRY);
    u.searchParams.set('limit', '100');
    u.searchParams.set('version', 'latest');
    if (since) u.searchParams.set('updated_since', since);
    if (cursor) u.searchParams.set('cursor', cursor);
    const res = await fetch(u, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`MCP registry ${res.status} at cursor ${cursor ?? '(start)'}`);
    const page = await res.json();
    for (const e of page.servers ?? []) {
      if (e._meta?.['io.modelcontextprotocol.registry/official']?.isLatest !== false) entries.push(e);
    }
    cursor = page.metadata?.nextCursor;
  } while (cursor && entries.length < limit);
  return entries.slice(0, limit);
}

async function main() {
  const startedAt = new Date().toISOString();
  const since = args.full ? null : await getState(STATE_KEY, { remote });
  console.log(`registry: ${since ? `updated since ${since}` : 'full crawl'}`);
  // Malformed entries map to null and are skipped (Review Focus #2); ON CONFLICT(type, slug) lets later duplicates win.
  const rows = (await fetchRegistry(since)).map(registryToItem).filter(Boolean);
  console.log(`registry: ${rows.length} latest servers`);

  const repos = [...new Set(rows.map((r) => r.repo_full_name).filter(Boolean))];
  const meta = await repoMeta(repos);
  const categories = await loadCategories({ remote });
  const tools = loadTools();

  await pool(rows, 8, async (row) => {
    const m = row.repo_full_name ? meta.get(row.repo_full_name) : null;
    if (m) {
      const ref = m.headSha ?? 'HEAD';
      Object.assign(row, { stars: m.stars, license: m.license, pushed_at: m.pushedAt, branch: m.branch });
      if (await raw(row.repo_full_name, ref, '.agentskills-ignore') !== null) row.status = 'removed'; // opt-out (spec §7.2.7)
      const readmePath = row.path ? `${row.path.replace(/\/+$/, '')}/README.md` : 'README.md';
      row.readme = gateReadme(await raw(row.repo_full_name, ref, readmePath), m.license);
    } else if (row.repo_full_name) {
      row.repo_full_name = null; // repo deleted/private: keep the registry listing, drop the dead link
    }
    row.category = categorize(`${row.name} ${row.description ?? ''} ${(row.readme ?? '').slice(0, 2000)}`, categories);
    row.toolIds = matchTools(`${row.name} ${row.description ?? ''}`, tools);
  });

  // Tools rows are seeded by ingest-trees (ponytail: one place); here only matching + skill->tool edges.
  const statements = [...skillToolsSql(tools)]; // ~70 FTS-backed INSERTs, idempotent
  for (const repo of repos) statements.push(`INSERT OR IGNORE INTO repo_scan (repo_full_name, hint) VALUES (${sqlValue(repo)}, 'mcp');`);
  for (const row of rows) statements.push(upsertItemSql(row), ...itemToolsSql('mcp', row.slug, row.toolIds));
  if (limit === Infinity) statements.push(setStateSql(STATE_KEY, startedAt)); // partial runs must not advance the cursor

  if (dryRun && rows[0]) console.log(JSON.stringify({ ...rows[0], readme: rows[0].readme?.slice(0, 120) ?? null }, null, 2));
  await applyStatements(statements, { remote, outDir, dryRun });
  const withSpec = rows.filter((r) => r.install_json).length;
  console.log(`ingest-mcp: ${rows.length} upserts, ${withSpec} with install spec, ${rows.filter((r) => r.status !== 'active').length} removed`);
}

main().catch((e) => { console.error(`ingest-mcp failed: ${e.message}`); process.exit(1); });
