#!/usr/bin/env node
// Generate 40-60 word what/when/how summaries into skill_summaries via Gemini Batch API.
// node --env-file=.env.local scripts/jobs/summaries.mjs [--limit 5000] [--min-stars 10] [--apply] [--local]
// Smoke = a real batch on --limit 20 without --apply (summaries printed, nothing written to D1).
import { parseArgs } from 'node:util';
import { query } from './lib/d1-query.mjs';
import { writeSqlChunks, applySqlFiles, sqlValue } from './lib/d1.mjs';
import { runBatches, DEFAULT_MODEL } from './lib/gemini-batch.mjs';
import { summaryPrompt, validSummary, sourceHash } from './lib/job-util.mjs';

const { values: o } = parseArgs({ options: { limit: { type: 'string', default: '5000' }, 'min-stars': { type: 'string', default: '10' }, apply: { type: 'boolean' }, local: { type: 'boolean' } } });
const remote = !o.local;
const limit = Number(o.limit);
const minStars = Number(o['min-stars']);

const rows = [];
let last = 0;
while (rows.length < limit) {
  const n = Math.min(2000, limit - rows.length);
  const page = await query(
    `SELECT s.seq, s.name, s.scoped_name, s.description AS d, substr(s.content,1,1500) AS head
     FROM skills s LEFT JOIN skill_summaries ss ON ss.skill_seq = s.seq
     WHERE s.seq > ${last} AND s.indexable = 1 AND s.scoped_name IS NOT NULL AND s.stars >= ${minStars} AND ss.skill_seq IS NULL
     ORDER BY s.seq LIMIT ${n}`, { remote });
  if (!page.length) break;
  rows.push(...page);
  last = page.at(-1).seq;
}
console.log(`${rows.length} skills to summarise (stars >= ${minStars}); model ${DEFAULT_MODEL}`);
if (!rows.length) process.exit(0);

const items = rows.map((r) => ({ key: `s${r.seq}`, prompt: summaryPrompt(r) }));
const answers = await runBatches(items, { name: 'summaries', maxOutputTokens: 200, stateFile: 'scripts/jobs/.state/summaries.json' });

const now = new Date().toISOString();
const stmts = [];
let bad = 0;
for (const r of rows) {
  const text = (answers.get(`s${r.seq}`) ?? '').replace(/\s+/g, ' ').trim();
  const ok = validSummary(text, r.scoped_name);
  if (rows.length <= 50) console.log(`[${ok ? 'ok ' : 'BAD'}] ${r.scoped_name}\n      ${text}`);
  if (!ok) { bad++; continue; }
  stmts.push(`INSERT OR REPLACE INTO skill_summaries (skill_seq, summary, source_hash, model, created_at) VALUES (${r.seq}, ${sqlValue(text)}, ${sqlValue(sourceHash(r))}, ${sqlValue(DEFAULT_MODEL)}, ${sqlValue(now)});`);
}
console.log(`${stmts.length} valid, ${bad} rejected (retried on the next run)`);
const files = writeSqlChunks(stmts, 'scripts/jobs/.out/summaries');
console.log(`wrote ${files.length} sql file(s)`);
if (o.apply) { applySqlFiles(files, { remote }); console.log('applied'); }
else console.log('not applied (add --apply)');
