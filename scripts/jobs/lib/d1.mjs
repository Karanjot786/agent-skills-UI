// Shared by every offline job: SQL encoding, file chunking, wrangler execution.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const MAX_STATEMENT_BYTES = 100_000;
const FILE_BYTES = 90_000;
const FILE_STATEMENTS = 1_000;

export function sqlValue(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number' || typeof v === 'bigint') return String(v);
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === 'object') return sqlValue(JSON.stringify(v)); // text[] and json -> JSON text
  // wrangler rejects any file containing the literal "BEGIN TRANSACTION" (even inside content): split it via ||
  return `'${String(v).replace(/'/g, "''").replaceAll('BEGIN TRANSACTION', "BEGIN TRANS'||'ACTION")}'`;
}

export function insertStatement(table, row) {
  const cols = Object.keys(row);
  const build = (r) => `INSERT OR IGNORE INTO ${table} (${cols.join(',')}) VALUES (${cols.map((c) => sqlValue(r[c])).join(',')});`;
  let sql = build(row);
  if (Buffer.byteLength(sql) >= MAX_STATEMENT_BYTES && 'content' in row) {
    sql = build({ ...row, content: null }); // ponytail: page falls back to raw_url for these 148 rows
  }
  if (Buffer.byteLength(sql) >= MAX_STATEMENT_BYTES) throw new Error(`row ${row.id} too big for one D1 statement`);
  return sql;
}

// Statements are joined by '\n' (wrangler splits on ';'), so a statement is one entry even if its content has newlines.
export function writeSqlChunks(statements, outDir) {
  mkdirSync(outDir, { recursive: true });
  const files = [];
  let buf = [], bytes = 0;
  const flush = () => {
    if (!buf.length) return;
    const f = join(outDir, `${String(files.length + 1).padStart(4, '0')}.sql`);
    writeFileSync(f, buf.join('\n') + '\n');
    files.push(f); buf = []; bytes = 0;
  };
  for (const s of statements) {
    const b = Buffer.byteLength(s) + 1;
    if (buf.length && (bytes + b > FILE_BYTES || buf.length >= FILE_STATEMENTS)) flush();
    buf.push(s); bytes += b;
  }
  flush();
  return files;
}

export function applySqlFiles(files, { remote = false } = {}) {
  for (const f of files) {
    execFileSync('npx', ['wrangler', 'd1', 'execute', 'agentskills-db', remote ? '--remote' : '--local', '--file', f], { stdio: 'inherit' });
  }
}
