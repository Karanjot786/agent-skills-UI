-- Sitemap file boundaries, precomputed offline (scripts/jobs/refresh-derived.mjs).
-- name: 'pages' | 'skills-en-<N>' (D adds 'skills-<locale>-<N>', E adds item families).
-- start_key: exclusive lower bound of skills.scoped_name for that file; url_count: rows in the file (before de-duplication).
CREATE TABLE IF NOT EXISTS sitemap_pages (
  name      TEXT PRIMARY KEY,
  start_key TEXT NOT NULL,
  url_count INTEGER NOT NULL,
  lastmod   TEXT NOT NULL
);
