-- Catalog expansion (spec §7.1): MCP servers, subagents, plugins (rules later).
-- Separate from `skills` so /marketplace URLs, skills_fts and sitemaps stay untouched.
CREATE TABLE items (
  seq            INTEGER PRIMARY KEY,          -- stable rowid for items_fts
  type           TEXT NOT NULL CHECK (type IN ('mcp','agent','plugin','rule')),
  slug           TEXT NOT NULL,                -- [a-z0-9-], '--' between parts, never '.' (middleware skips dotted paths)
  name           TEXT NOT NULL,
  author         TEXT NOT NULL,
  description    TEXT,
  repo_full_name TEXT,
  source_url     TEXT NOT NULL UNIQUE,
  path           TEXT,
  branch         TEXT,
  stars          INTEGER NOT NULL DEFAULT 0,
  license        TEXT,                         -- SPDX id from GitHub
  homepage       TEXT,
  author_avatar  TEXT,
  category       TEXT,
  tags           TEXT,                         -- JSON array
  install_json   TEXT,                         -- per-type install spec (spec §7.3)
  readme         TEXT,                         -- full text only for permissive licenses, else 500-char excerpt
  summary        TEXT,                         -- 40-60 word block (Section C batch job)
  content_hash   TEXT,
  canonical_seq  INTEGER,                      -- dedupe: points at the upstream copy
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','removed','takedown')),
  pushed_at      TEXT,
  indexed_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at     TEXT,
  indexable      INTEGER GENERATED ALWAYS AS (
    length(coalesce(readme, description, '')) >= 300 AND canonical_seq IS NULL AND status = 'active'
  ) STORED,
  UNIQUE (type, slug)
);
CREATE INDEX idx_items_type_stars    ON items(type, stars DESC);
CREATE INDEX idx_items_type_cat      ON items(type, category, stars DESC);
CREATE INDEX idx_items_author        ON items(author, stars DESC);
CREATE INDEX idx_items_type_idx_slug ON items(type, indexable, slug);
CREATE INDEX idx_items_repo          ON items(repo_full_name);
CREATE INDEX idx_items_hash          ON items(type, content_hash) WHERE content_hash IS NOT NULL;

CREATE VIRTUAL TABLE items_fts USING fts5(
  name, description, author, tags,
  content='items', content_rowid='seq', tokenize='trigram'
);
CREATE TRIGGER items_ai AFTER INSERT ON items BEGIN
  INSERT INTO items_fts(rowid, name, description, author, tags) VALUES (new.seq, new.name, new.description, new.author, new.tags);
END;
CREATE TRIGGER items_ad AFTER DELETE ON items BEGIN
  INSERT INTO items_fts(items_fts, rowid, name, description, author, tags) VALUES ('delete', old.seq, old.name, old.description, old.author, old.tags);
END;
CREATE TRIGGER items_au AFTER UPDATE OF name, description, author, tags ON items BEGIN
  INSERT INTO items_fts(items_fts, rowid, name, description, author, tags) VALUES ('delete', old.seq, old.name, old.description, old.author, old.tags);
  INSERT INTO items_fts(rowid, name, description, author, tags) VALUES (new.seq, new.name, new.description, new.author, new.tags);
END;

CREATE TABLE tools (id TEXT PRIMARY KEY, name TEXT NOT NULL, aliases TEXT, homepage TEXT, description TEXT);
CREATE TABLE item_tools (
  item_type TEXT NOT NULL, item_ref TEXT NOT NULL, tool_id TEXT NOT NULL,
  PRIMARY KEY (item_type, item_ref, tool_id)
); -- item_type 'skill' uses item_ref = skills.id, others use CAST(items.seq AS TEXT)
CREATE INDEX idx_item_tools_tool ON item_tools(tool_id, item_type);

-- Rescan state for the tree job: rescan a repo only when its default-branch head sha changes.
CREATE TABLE repo_scan (
  repo_full_name TEXT PRIMARY KEY,
  hint           TEXT,            -- 'mcp' when found via MCP search (enables package.json check)
  head_sha       TEXT,            -- last scanned commit; '-' = repo gone/private
  created_at     TEXT,            -- dedupe: earliest-created repo is canonical
  stars          INTEGER,
  scanned_at     TEXT
);
-- Only two keys: mcp_registry_since, drip_cursor.
CREATE TABLE job_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);

-- Seed with the 25,798 repos we already index (one-off scan at migration time, never on a request path).
INSERT OR IGNORE INTO repo_scan (repo_full_name)
  SELECT DISTINCT repo_full_name FROM skills WHERE repo_full_name IS NOT NULL;
