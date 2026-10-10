CREATE TABLE sponsor_slots (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  placement  TEXT NOT NULL,                -- home|mcp|agents|plugins|newsletter|category:<slug>
  item_type  TEXT,                         -- optional: skill|mcp|agent|plugin (sponsored listing)
  item_ref   TEXT,
  title      TEXT NOT NULL,
  url        TEXT NOT NULL,
  image      TEXT,
  blurb      TEXT,
  locale     TEXT NOT NULL DEFAULT '*',    -- '*' = all locales
  starts_at  TEXT NOT NULL,                -- ISO 8601 UTC
  ends_at    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended'))
);
CREATE INDEX idx_sponsor_lookup ON sponsor_slots(placement, status, ends_at);
