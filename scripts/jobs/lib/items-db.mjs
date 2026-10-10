// D1 glue for item jobs. Uses Section A's helpers (d1.mjs, d1-query.mjs).
import { readFileSync, rmSync } from 'node:fs';
import { query } from './d1-query.mjs';
import { writeSqlChunks, applySqlFiles } from './d1.mjs';
import { itemSitemapPages, sitemapPagesSql } from './items-parse.mjs';

export async function applyStatements(statements, { remote, outDir, dryRun }) {
  rmSync(outDir, { recursive: true, force: true });
  const files = writeSqlChunks(statements, outDir);
  if (dryRun) { console.log(`dry run: ${statements.length} statements in ${files.length} file(s) under ${outDir}`); return files; }
  await applySqlFiles(files, { remote });
  console.log(`applied ${statements.length} statements (${files.length} files, ${remote ? 'remote' : 'local'})`);
  return files;
}

export async function refreshItemSitemaps({ remote, outDir, dryRun = false }) {
  const rows = await query(`SELECT type, slug, updated_at FROM items WHERE indexable = 1 AND type IN ('mcp','agent','plugin')`, { remote });
  const pages = itemSitemapPages(rows, new Date().toISOString());
  console.log(`item sitemaps: ${pages.map((p) => `${p.name}=${p.url_count}`).join(' ') || 'none'}`);
  return applyStatements(sitemapPagesSql(pages), { remote, outDir, dryRun });
}

export async function loadCategories({ remote }) {
  const rows = await query('SELECT id, keywords FROM categories ORDER BY sort_order', { remote });
  return rows.map((r) => { try { return { id: r.id, keywords: JSON.parse(r.keywords) }; } catch { return { id: r.id, keywords: [] }; } });
}

export const loadTools = () => JSON.parse(readFileSync(new URL('../data/tools.json', import.meta.url), 'utf8'));

export async function getState(key, { remote }) {
  const rows = await query(`SELECT value FROM job_state WHERE key = '${key.replace(/'/g, "''")}'`, { remote });
  return rows[0]?.value ?? null;
}
