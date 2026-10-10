// Recompute skill_stats and sitemap_pages (keyset boundaries). Usage: node scripts/jobs/refresh-derived.mjs [--remote]
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { query } from './lib/d1-query.mjs';
import { writeSqlChunks, applySqlFiles, sqlValue } from './lib/d1.mjs';
import { INDEXABLE_SITEMAP_WHERE as WHERE, SKILLS_PER_SITEMAP } from '../../src/lib/skills-sql.ts';

const remote = process.argv.includes('--remote');
const q = (sql) => query(sql, { remote });
const now = new Date().toISOString();

const [{ total, authors }] = q('SELECT count(*) AS total, count(DISTINCT author) AS authors FROM skills');
const top = q("SELECT author AS name, count(*) AS skillCount, 'https://github.com/' || author || '.png' AS avatar FROM skills GROUP BY author ORDER BY count(*) DESC LIMIT 10");

// Keyset boundaries: file N = rows with scoped_name in (start, end], where end is the key of the 45,000th row.
// Cutting on a key (not a row offset) keeps duplicate scoped_names in one file.
const pages = [];
let start = '';
for (let n = 0; ; n++) {
  const [{ end } = {}] = q(`SELECT scoped_name AS end FROM skills WHERE ${WHERE} AND scoped_name > ${sqlValue(start)} ORDER BY scoped_name LIMIT 1 OFFSET ${SKILLS_PER_SITEMAP - 1}`);
  const upper = end === undefined ? '' : ` AND scoped_name <= ${sqlValue(end)}`;
  const [{ cnt, lm }] = q(`SELECT count(*) AS cnt, max(updated_at) AS lm FROM skills WHERE ${WHERE} AND scoped_name > ${sqlValue(start)}${upper}`);
  if (!cnt) break;
  pages.push({ name: `skills-en-${n}`, start_key: start, url_count: cnt, lastmod: lm ?? now }); // updated_at is stored as ISO text
  if (end === undefined) break;
  start = end;
}
pages.push({ name: 'pages', start_key: '', url_count: 0, lastmod: now });

const stmts = [
  `INSERT OR REPLACE INTO skill_stats (id, total_skills, unique_authors, top_authors, updated_at) VALUES ('global', ${total}, ${authors}, ${sqlValue(JSON.stringify(top))}, ${sqlValue(now)});`,
  `DELETE FROM sitemap_pages WHERE name LIKE 'skills-en-%' AND name NOT IN (${pages.map((p) => sqlValue(p.name)).join(',')});`,
  ...pages.map((p) => `INSERT OR REPLACE INTO sitemap_pages (name, start_key, url_count, lastmod) VALUES (${sqlValue(p.name)}, ${sqlValue(p.start_key)}, ${p.url_count}, ${sqlValue(p.lastmod)});`),
];
applySqlFiles(writeSqlChunks(stmts, mkdtempSync(join(tmpdir(), 'refresh-derived-'))), { remote });
console.log(`skill_stats total=${total} authors=${authors}; sitemap_pages=${pages.map((p) => `${p.name}:${p.url_count}`).join(' ')}`);
