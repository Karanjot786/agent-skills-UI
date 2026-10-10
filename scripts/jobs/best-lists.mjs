#!/usr/bin/env node
// Build best_lists (30 topics + one per tool) from D1. No AI, no cost. Nightly.
// node scripts/jobs/best-lists.mjs [--only code-review,debugging] [--apply] [--local]
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { query } from './lib/d1-query.mjs';
import { writeSqlChunks, applySqlFiles, sqlValue } from './lib/d1.mjs';
import { BEST_TOPICS, TOOLS } from '../../src/lib/topics.mjs';

const { values: o } = parseArgs({ options: { only: { type: 'string', default: '' }, apply: { type: 'boolean' }, local: { type: 'boolean' } } });
const remote = !o.local;
const only = o.only.split(',').filter(Boolean);
const KEEP = 12, MIN = 5;
const since = new Date(Date.now() - 365 * 864e5).toISOString();
const now = new Date().toISOString();

const lists = [
  ...BEST_TOPICS.map((t) => ({ topic: t.slug, title: `Best AI Agent Skills for ${t.label}`, terms: t.terms })),
  ...TOOLS.map((t) => ({ topic: `tool-${t.id}`, title: `Best Skills for ${t.name}`, terms: t.terms })),
].filter((l) => !only.length || only.includes(l.topic));

const stmts = [];
for (const l of lists) {
  const match = l.terms.map((t) => `"${t.replace(/"/g, '""')}"`).join(' OR ');
  // -- ponytail: F adds `AND NOT EXISTS (open high/critical finding)` once the findings table exists.
  const rows = await query(
    `SELECT s.id, s.name, substr(s.content,1,3000) AS head
     FROM skills_fts JOIN skills s ON s.seq = skills_fts.rowid
     WHERE skills_fts MATCH ${sqlValue(match)} AND s.indexable = 1 AND s.scoped_name IS NOT NULL AND s.updated_at >= ${sqlValue(since)}
     ORDER BY s.stars DESC LIMIT 80`, { remote });
  const hashes = new Set(), names = new Set(), picked = [];
  for (const r of rows) {
    const h = createHash('sha1').update(r.head ?? '').digest('hex');
    const n = r.name.toLowerCase();
    if (hashes.has(h) || names.has(n)) continue;
    hashes.add(h); names.add(n); picked.push(r);
    if (picked.length === KEEP) break;
  }
  if (picked.length < MIN) { console.log(`skip ${l.topic}: only ${picked.length}`); continue; }
  console.log(`${l.topic}: ${picked.length} items (top: ${picked.slice(0, 3).map((p) => p.name).join(', ')})`);
  const refs = JSON.stringify(picked.map((p) => ({ type: 'skill', ref: p.id })));
  stmts.push(`INSERT OR REPLACE INTO best_lists (topic, locale, title, item_refs, updated_at) VALUES (${sqlValue(l.topic)}, 'en', ${sqlValue(l.title)}, ${sqlValue(refs)}, ${sqlValue(now)});`);
}
const files = writeSqlChunks(stmts, 'scripts/jobs/.out/best-lists');
console.log(`${stmts.length} lists -> ${files.length} sql file(s)`);
if (o.apply) { applySqlFiles(files, { remote }); console.log('applied'); }
else console.log('not applied (add --apply)');
