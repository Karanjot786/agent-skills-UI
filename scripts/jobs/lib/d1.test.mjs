import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeSqlChunks } from './d1.mjs';
import { parseWranglerJson } from './d1-query.mjs';

test('writeSqlChunks keeps every file under 100KB and ≤1000 statements, in order', () => {
  const stmts = Array.from({ length: 250 }, (_, i) => `INSERT INTO t VALUES (${i}, '${'x'.repeat(1000)}');`);
  const files = writeSqlChunks(stmts, mkdtempSync(join(tmpdir(), 'd1-')));
  assert.ok(files.length > 1);
  const all = [];
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    assert.ok(Buffer.byteLength(text) < 100_000, f);
    all.push(...text.trim().split('\n'));
  }
  assert.deepEqual(all, stmts);
});

test('parseWranglerJson skips any banner before the JSON array', () => {
  const rows = parseWranglerJson(' ⛅️ wrangler 4\n[{"results":[{"n":3}],"success":true}]\n');
  assert.deepEqual(rows, [{ n: 3 }]);
});
