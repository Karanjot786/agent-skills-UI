import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshDb, plain } from './test-db.mjs';

const insert = (db, o) => db.prepare(
  `INSERT INTO items (type, slug, name, author, description, source_url, readme, canonical_seq, status)
   VALUES (?, ?, ?, 'acme', ?, ?, ?, ?, ?)`,
).run(o.type ?? 'mcp', o.slug, o.name ?? 'Stripe Payments', o.description ?? 'Payments', `https://x/${o.slug}`,
  o.readme ?? null, o.canonical_seq ?? null, o.status ?? 'active');

test('indexable = 300+ chars of readme/description, no canonical, active', () => {
  const db = freshDb();
  insert(db, { slug: 'a', readme: 'x'.repeat(300) });
  insert(db, { slug: 'b', readme: 'short' });
  insert(db, { slug: 'c', readme: 'x'.repeat(300), canonical_seq: 1 });
  insert(db, { slug: 'd', readme: 'x'.repeat(300), status: 'removed' });
  insert(db, { slug: 'e', readme: 'x'.repeat(300), status: 'takedown' });
  const got = Object.fromEntries(db.prepare('SELECT slug, indexable FROM items').all().map((r) => [r.slug, r.indexable]));
  assert.deepEqual(got, { a: 1, b: 0, c: 0, d: 0, e: 0 });
});

test('items_fts follows insert, update and delete', () => {
  const db = freshDb();
  insert(db, { slug: 'stripe' });
  const hits = (q) => db.prepare('SELECT rowid FROM items_fts WHERE items_fts MATCH ?').all(`"${q}"`).length;
  assert.equal(hits('tripe'), 1);
  db.exec(`UPDATE items SET name = 'Paddle Billing' WHERE slug = 'stripe'`);
  assert.equal(hits('tripe'), 0);
  assert.equal(hits('addle'), 1);
  db.exec(`DELETE FROM items WHERE slug = 'stripe'`);
  assert.equal(hits('addle'), 0);
});

test('repo_scan is seeded once per distinct skill repo', () => {
  const db = freshDb();
  assert.deepEqual(plain(db.prepare('SELECT repo_full_name FROM repo_scan').all()), [{ repo_full_name: 'acme/tools' }]);
});
