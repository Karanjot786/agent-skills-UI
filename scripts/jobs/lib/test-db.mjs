// In-memory SQLite with the real D1 migrations, for job/unit tests (node:sqlite has FTS5 trigram + generated columns).
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const mig = (f) => readFileSync(new URL(`../../../migrations/${f}`, import.meta.url), 'utf8');

export function freshDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(mig('0001_init.sql'));
  db.exec(mig('0002_with_content_index.sql'));
  db.exec(`INSERT INTO skills (id, name, author, github_url, repo_full_name) VALUES
    ('s1', 'x', 'acme', 'https://github.com/acme/tools/tree/main/x', 'acme/tools'),
    ('s2', 'y', 'acme', 'https://github.com/acme/tools/tree/main/y', 'acme/tools');`);
  db.exec(mig('0003_seo.sql'));
  db.exec(mig('0007_items.sql'));
  return db;
}

export const plain = (rows) => rows.map((r) => ({ ...r })); // node:sqlite rows have a null prototype
