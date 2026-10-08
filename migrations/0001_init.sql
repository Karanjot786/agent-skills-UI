-- seq = stable rowid alias: FTS5 external-content tables need rowids that never change.
CREATE TABLE skills (
  seq              INTEGER PRIMARY KEY,
  id               TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  author           TEXT NOT NULL,
  scoped_name      TEXT,
  description      TEXT,
  author_avatar    TEXT,
  github_url       TEXT NOT NULL UNIQUE,
  raw_url          TEXT,
  repo_full_name   TEXT,
  stars            INTEGER NOT NULL DEFAULT 0,
  forks            INTEGER NOT NULL DEFAULT 0,
  path             TEXT,
  branch           TEXT NOT NULL DEFAULT 'main',
  has_marketplace  INTEGER NOT NULL DEFAULT 0,
  indexed_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT,
  content          TEXT,
  folder_url       TEXT,
  from_manifest    INTEGER NOT NULL DEFAULT 0,
  manifest_version TEXT,
  category         TEXT,
  -- ponytail: char-length proxy for the old ">=100 words" noindex rule; one source of truth for page robots + sitemap.
  indexable        INTEGER GENERATED ALWAYS AS (coalesce(length(content), 0) >= 600) STORED
);
CREATE INDEX idx_skills_scoped     ON skills(scoped_name, stars DESC);
CREATE INDEX idx_skills_name_nc    ON skills(name COLLATE NOCASE, stars DESC);
CREATE INDEX idx_skills_stars      ON skills(stars DESC);
CREATE INDEX idx_skills_cat_stars  ON skills(category, stars DESC);
CREATE INDEX idx_skills_updated    ON skills(updated_at DESC);
CREATE INDEX idx_skills_author     ON skills(author, stars DESC);
CREATE INDEX idx_skills_indexable  ON skills(indexable, scoped_name);

CREATE VIRTUAL TABLE skills_fts USING fts5(
  name, description, author,
  content='skills', content_rowid='seq', tokenize='trigram'
);
-- No delete trigger: the app never deletes skills (add one with the first DELETE).
CREATE TRIGGER skills_ai AFTER INSERT ON skills BEGIN
  INSERT INTO skills_fts(rowid, name, description, author) VALUES (new.seq, new.name, new.description, new.author);
END;
CREATE TRIGGER skills_au AFTER UPDATE OF name, description, author ON skills BEGIN
  INSERT INTO skills_fts(skills_fts, rowid, name, description, author) VALUES ('delete', old.seq, old.name, old.description, old.author);
  INSERT INTO skills_fts(rowid, name, description, author) VALUES (new.seq, new.name, new.description, new.author);
END;

CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL,
  keywords    TEXT NOT NULL DEFAULT '[]',   -- JSON array (was text[])
  skill_count INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE skill_stats (
  id             TEXT PRIMARY KEY DEFAULT 'global',
  total_skills   INTEGER NOT NULL DEFAULT 0,
  unique_authors INTEGER NOT NULL DEFAULT 0,
  top_authors    TEXT NOT NULL DEFAULT '[]',  -- JSON
  updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE repo_submissions (
  id             TEXT PRIMARY KEY,
  full_name      TEXT NOT NULL UNIQUE,
  html_url       TEXT,
  description    TEXT,
  stars          INTEGER NOT NULL DEFAULT 0,
  language       TEXT,
  license        TEXT,
  skills_count   INTEGER NOT NULL DEFAULT 0,
  skill_paths    TEXT NOT NULL DEFAULT '[]',  -- JSON array (was text[])
  default_branch TEXT NOT NULL DEFAULT 'main',
  status         TEXT NOT NULL DEFAULT 'pending',
  reviewed_at    TEXT,
  submitted_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
