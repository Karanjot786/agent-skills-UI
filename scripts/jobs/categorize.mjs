#!/usr/bin/env node
// Backfill skills.category where NULL, via Gemini Batch API.
// node --env-file=.env.local scripts/jobs/categorize.mjs [--limit N] [--apply] [--local]
// Smoke = a real batch on --limit 20 without --apply (results printed, nothing written to D1).
import { parseArgs } from 'node:util';
import { query } from './lib/d1-query.mjs';
import { writeSqlChunks, applySqlFiles, sqlValue } from './lib/d1.mjs';
import { runBatches, DEFAULT_MODEL } from './lib/gemini-batch.mjs';
import { categoryPrompt, parseCategory } from './lib/job-util.mjs';

const { values: o } = parseArgs({ options: { limit: { type: 'string' }, apply: { type: 'boolean' }, local: { type: 'boolean' } } });
const remote = !o.local;
const limit = Number(o.limit ?? Infinity);

const cats = await query('SELECT id, name, keywords FROM categories ORDER BY sort_order', { remote });
const ids = cats.map((c) => c.id);
const catLines = cats.map((c) => {
  let kw = []; try { kw = JSON.parse(c.keywords).slice(0, 5); } catch { /* keywords are optional */ }
  return `${c.id}: ${c.name}${kw.length ? ` (${kw.join(', ')})` : ''}`;
}).join('\n');

// keyset on rowid: reads only the rows it returns
const rows = [];
let last = 0;
while (rows.length < limit) {
  const n = Math.min(5000, limit - rows.length);
  const page = await query(`SELECT seq, name, substr(coalesce(description,''),1,240) AS d FROM skills WHERE seq > ${last} AND category IS NULL ORDER BY seq LIMIT ${n}`, { remote });
  if (!page.length) break;
  rows.push(...page);
  last = page.at(-1).seq;
}
console.log(`${rows.length} rows with NULL category; model ${DEFAULT_MODEL}; ${remote ? 'remote' : 'local'} D1`);
if (!rows.length) process.exit(0);

const items = rows.map((r) => ({ key: `s${r.seq}`, prompt: categoryPrompt(catLines, r) }));
const answers = await runBatches(items, { name: 'categorize', maxOutputTokens: 32, stateFile: 'scripts/jobs/.state/categorize.json' });

const bySeqs = new Map();
let unparsed = 0;
for (const r of rows) {
  const c = parseCategory(answers.get(`s${r.seq}`) ?? '', ids);
  if (!c) { unparsed++; continue; }
  if (!bySeqs.has(c)) bySeqs.set(c, []);
  bySeqs.get(c).push(r.seq);
  if (rows.length <= 50) console.log(`${r.name.slice(0, 40).padEnd(40)} -> ${c}`);
}
console.log('assigned', Object.fromEntries([...bySeqs].map(([c, s]) => [c, s.length])), 'unparsed', unparsed);

const stmts = [];
for (const [c, seqs] of bySeqs) {
  for (let i = 0; i < seqs.length; i += 500) stmts.push(`UPDATE skills SET category = ${sqlValue(c)} WHERE category IS NULL AND seq IN (${seqs.slice(i, i + 500).join(',')});`);
}
stmts.push('UPDATE categories SET skill_count = (SELECT count(*) FROM skills WHERE skills.category = categories.id);');
const files = writeSqlChunks(stmts, 'scripts/jobs/.out/categorize');
console.log(`wrote ${files.length} sql file(s) to scripts/jobs/.out/categorize`);

if (o.apply) {
  applySqlFiles(files, { remote });
  console.log('applied');
} else {
  console.log('not applied (add --apply; rerun resumes the stored batches, no second charge)');
}
