#!/usr/bin/env node
// Nightly tree rescan of known repos (+ code-search drip for new ones): subagents, plugins (E12), MCP server.json.
// Spec §7.2 steps 2-9. Rescan only when the default-branch head sha changed (GraphQL, 100 repos/query).
//   node scripts/jobs/ingest-trees.mjs [--remote] [--dry-run] [--only owner/repo] [--max-trees 2500] [--searches 54]
import { parseArgs } from 'node:util';
import { sqlValue } from './lib/d1.mjs';
import { query } from './lib/d1-query.mjs';
import { repoMeta, treePaths, raw, search, pool } from './lib/github.mjs';
import { applyStatements, getState, loadCategories, loadTools, refreshItemSitemaps } from './lib/items-db.mjs';
import {
  findTargets, parseAgentFile, packageJsonToMcp, registryToItem, gateReadme, categorize, matchTools, seedToolsSql,
  upsertItemSql, itemToolsSql, setStateSql, dripPlan, removeMissingSql, repoScanSql, optOutSql, goneSql, starsSql, DEDUPE_SQL,
} from './lib/items-parse.mjs';

const { values: a } = parseArgs({ options: {
  remote: { type: 'boolean', default: false }, 'dry-run': { type: 'boolean', default: false }, only: { type: 'string' },
  'max-trees': { type: 'string', default: '2500' }, searches: { type: 'string', default: '54' },
} });
const remote = a.remote, dryRun = a['dry-run'];
const outDir = '.jobs-out/ingest-trees';

async function discover(repos, statements, now) {
  const cursor = Number(await getState('drip_cursor', { remote }) ?? 0);
  const { queries, nextCursor } = dripPlan(cursor, Number(a.searches), now);
  const known = new Set(repos.map((r) => r.repo_full_name));
  let added = 0;
  for (const s of queries) {
    let found;
    try { found = await search(s.kind, s.q, s.page); } catch (e) { console.warn(e.message); continue; }
    for (const name of found) {
      if (known.has(name)) continue;
      known.add(name); added++;
      repos.unshift({ repo_full_name: name, head_sha: null, hint: s.hint, stars: null });
      statements.push(`INSERT OR IGNORE INTO repo_scan (repo_full_name, hint) VALUES (${sqlValue(name)}, ${sqlValue(s.hint)});`);
    }
  }
  statements.push(setStateSql('drip_cursor', String(nextCursor)));
  console.log(`drip: ${queries.length} searches, ${added} new repos`);
}

async function scanRepo(r, ctx) {
  const repo = r.repo_full_name, m = r.m, ref = m.headSha;
  const list = await treePaths(repo, ref);
  if (!list) return [repoScanSql(repo, m, ctx.now)];
  const t = findTargets(list);
  if (t.ignore) return optOutSql(repo, m, ctx.now); // spec §7.2.7
  const rows = [];
  const agents = await pool(t.agents, 8, async (p) => {
    const text = await raw(repo, ref, p);
    return text ? parseAgentFile(text, { repo, path: p }) : null;
  });
  rows.push(...agents.filter(Boolean));
  for (const p of t.serverJson) {
    let json;
    try { json = JSON.parse(await raw(repo, ref, p) ?? ''); } catch { continue; }
    const row = registryToItem({ server: json });
    if (row) rows.push({ ...row, repo_full_name: row.repo_full_name ?? repo, readme: await raw(repo, ref, 'README.md') });
  }
  if (!t.serverJson.length && t.packageJson && r.hint === 'mcp' && !ctx.mcpRepos.has(repo)) {
    const row = packageJsonToMcp(await raw(repo, ref, 'package.json') ?? '', repo);
    if (row) rows.push({ ...row, readme: await raw(repo, ref, 'README.md') });
  }
  const out = [];
  const live = rows; // ON CONFLICT(type, slug) lets a later duplicate win
  for (const row of live) {
    Object.assign(row, { stars: m.stars, license: m.license, pushed_at: m.pushedAt, branch: m.branch,
      updated_at: row.updated_at ?? m.pushedAt, status: 'active', readme: gateReadme(row.readme, m.license) });
    row.category = categorize(`${row.name} ${row.description ?? ''} ${(row.readme ?? '').slice(0, 2000)}`, ctx.categories);
    out.push(upsertItemSql(row), ...itemToolsSql(row.type, row.slug, matchTools(`${row.name} ${row.description ?? ''}`, ctx.tools)));
  }
  for (const type of ['agent', 'plugin']) out.push(removeMissingSql(repo, type, live.filter((x) => x.type === type).map((x) => x.source_url)));
  out.push(repoScanSql(repo, m, ctx.now));
  return out;
}

async function main() {
  const now = new Date().toISOString();
  const statements = [...seedToolsSql(loadTools())]; // tools are seeded here only (ponytail: one place)
  const repos = a.only
    ? [{ repo_full_name: a.only, head_sha: null, hint: null, stars: null }]
    : await query('SELECT repo_full_name, head_sha, hint, stars FROM repo_scan ORDER BY scanned_at IS NOT NULL, scanned_at', { remote });
  if (!a.only) await discover(repos, statements, now);

  const meta = await repoMeta(repos.map((r) => r.repo_full_name));
  const candidates = [];
  let gone = 0;
  for (const r of repos) {
    const m = meta.get(r.repo_full_name);
    if (!m) { if (r.head_sha !== '-') { statements.push(...goneSql(r.repo_full_name, now)); gone++; } continue; }
    if (m.isFork || !m.headSha) { if (r.head_sha !== m.headSha) statements.push(repoScanSql(r.repo_full_name, m, now)); continue; }
    if (m.headSha === r.head_sha && !a.only) {
      if (m.stars !== r.stars) statements.push(starsSql(r.repo_full_name, m.stars), repoScanSql(r.repo_full_name, m, now));
      continue;
    }
    candidates.push({ ...r, m });
  }
  const batch = candidates.slice(0, Number(a['max-trees'])); // the rest keep their old sha -> first in line next night
  console.log(`trees: ${repos.length} repos, ${gone} gone, ${candidates.length} changed, scanning ${batch.length}`);

  const ctx = {
    now, categories: await loadCategories({ remote }), tools: loadTools(),
    mcpRepos: new Set((await query(`SELECT DISTINCT repo_full_name FROM items WHERE type = 'mcp' AND repo_full_name IS NOT NULL`, { remote })).map((x) => x.repo_full_name)),
  };
  let failed = 0;
  await pool(batch, 4, async (r) => {
    try { statements.push(...await scanRepo(r, ctx)); }
    catch (e) { failed++; console.warn(`${r.repo_full_name}: ${e.message}`); } // sha unchanged -> retried next night
  });
  statements.push(DEDUPE_SQL);
  await applyStatements(statements, { remote, outDir, dryRun });
  if (!dryRun) await refreshItemSitemaps({ remote, outDir: `${outDir}-sitemaps` });
  const upserts = statements.filter((s) => s.startsWith('INSERT INTO items')).length;
  console.log(`ingest-trees: ${batch.length - failed} repos scanned, ${failed} failed, ${upserts} item upserts`);
}

main().catch((e) => { console.error(`ingest-trees failed: ${e.message}`); process.exit(1); });
