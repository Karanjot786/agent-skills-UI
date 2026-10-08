import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sqlValue, insertStatement, MAX_STATEMENT_BYTES } from './pg-to-d1.mjs';

test('sqlValue encodes every Postgres type we have', () => {
  assert.equal(sqlValue(null), 'NULL');
  assert.equal(sqlValue(undefined), 'NULL');
  assert.equal(sqlValue(true), '1');
  assert.equal(sqlValue(false), '0');
  assert.equal(sqlValue(42), '42');
  assert.equal(sqlValue("it's"), "'it''s'");
  assert.equal(sqlValue(new Date('2026-07-04T02:36:47.772Z')), "'2026-07-04T02:36:47.772Z'");
  assert.equal(sqlValue(['a', "b'c"]), `'["a","b''c"]'`);
  assert.equal(sqlValue({ x: 1 }), `'{"x":1}'`);
});

test('insertStatement drops oversized content instead of breaking the 100KB limit', () => {
  const row = { id: 'x', name: 'n', content: 'z'.repeat(150_000) };
  const sql = insertStatement('skills', row);
  assert.ok(Buffer.byteLength(sql) < MAX_STATEMENT_BYTES);
  assert.match(sql, /NULL\);$/);
});

test('insertStatement throws when even without content it is too big', () => {
  assert.throws(() => insertStatement('skills', { id: 'x', description: 'd'.repeat(150_000) }));
});

test('sqlValue never emits the literal BEGIN TRANSACTION (wrangler refuses such files)', () => {
  const sql = sqlValue("a BEGIN TRANSACTION; b");
  assert.ok(!sql.includes('BEGIN TRANSACTION'));
  assert.equal(sql, "'a BEGIN TRANS'||'ACTION; b'");
});
