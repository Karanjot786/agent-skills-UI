-- C: what/when/how summaries (batch AI, generated once) and curated best-of lists.
CREATE TABLE IF NOT EXISTS skill_summaries (
  skill_seq   INTEGER PRIMARY KEY,
  summary     TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  model       TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS best_lists (
  topic      TEXT NOT NULL,
  locale     TEXT NOT NULL,
  title      TEXT NOT NULL,
  item_refs  TEXT NOT NULL,   -- JSON [{"type":"skill","ref":"<skills.id>"}]; E adds mcp/agent/plugin with ref = items.seq
  updated_at TEXT NOT NULL,
  PRIMARY KEY (topic, locale)
);
