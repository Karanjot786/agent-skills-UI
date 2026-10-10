// One-off: copy RDS Postgres -> SQLite INSERT files for `wrangler d1 execute --file`.
// Usage: node scripts/pg-to-d1.mjs --out migrations-data/full [--limit 2000]
// Reads DATABASE_URL from .env. Never logs it.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { MAX_STATEMENT_BYTES, sqlValue, insertStatement } from './jobs/lib/d1.mjs';
export { MAX_STATEMENT_BYTES, sqlValue, insertStatement };

const SKILLS_PER_FILE = 25_000;
const PAGE = 2_000;

const SKILL_COLS = 'id,name,author,scoped_name,description,author_avatar,github_url,raw_url,repo_full_name,stars,forks,path,branch,has_marketplace,indexed_at,updated_at,content,folder_url,from_manifest,manifest_version,category';

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
  const out = args.out ?? 'migrations-data/full';
  const limit = args.limit ? Number(args.limit) : Infinity;
  mkdirSync(out, { recursive: true });

  const { default: dotenv } = await import('dotenv');
  dotenv.config({ quiet: true });
  const { default: pg } = await import('pg');
  const url = process.env.DATABASE_URL.replace(/sslmode=[^&]*/, 'sslmode=no-verify');
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  // meta tables (small): one file
  const meta = [];
  for (const table of ['categories', 'skill_stats', 'repo_submissions']) {
    const { rows } = await client.query(`SELECT * FROM ${table}`);
    for (const r of rows) meta.push(insertStatement(table, r));
  }
  writeFileSync(join(out, '00-meta.sql'), meta.join('\n') + '\n');

  // skills: keyset pagination by id, 25K rows per file
  let lastId = '', n = 0, file = 1, buf = [];
  const flush = () => { if (buf.length) writeFileSync(join(out, `${String(file++).padStart(2, '0')}-skills.sql`), buf.join('\n') + '\n'); buf = []; };
  while (n < limit) {
    const { rows } = await client.query(`SELECT ${SKILL_COLS} FROM skills WHERE id > $1 ORDER BY id LIMIT $2`, [lastId, Math.min(PAGE, limit - n)]);
    if (!rows.length) break;
    for (const r of rows) { buf.push(insertStatement('skills', r)); if (buf.length >= SKILLS_PER_FILE) flush(); }
    n += rows.length; lastId = rows.at(-1).id;
    process.stdout.write(`\rskills exported: ${n}`);
  }
  flush();
  console.log(`\ndone -> ${out}`);
  await client.end();
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
