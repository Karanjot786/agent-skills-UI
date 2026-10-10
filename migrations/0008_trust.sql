-- Trust (spec §8). item_type 'skill' → item_ref = skills.id (Section G /api/v1/check and C best_lists rely on this);
-- other types → item_ref = CAST(items.seq AS TEXT).
CREATE TABLE findings (
  item_type    TEXT NOT NULL,
  item_ref     TEXT NOT NULL,
  rule_id      TEXT NOT NULL,
  severity     TEXT NOT NULL CHECK (severity IN ('critical','high','medium','low','info')),
  excerpt      TEXT NOT NULL,             -- matched line, whitespace-collapsed, ≤200 chars
  line         INTEGER,
  content_hash TEXT NOT NULL,             -- hashText() of the scanned text (same as CLI lock contentHash)
  scanned_at   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','confirmed','false_positive')),
  advisory_id  TEXT,                      -- ASKL-YYYY-NNNN, set by a human together with status='confirmed'
  PRIMARY KEY (item_type, item_ref, rule_id, excerpt)
);
CREATE INDEX idx_findings_status ON findings(status, severity);
CREATE INDEX idx_findings_advisory ON findings(advisory_id) WHERE advisory_id IS NOT NULL;

CREATE TABLE item_metrics (
  item_type    TEXT NOT NULL,
  item_ref     TEXT NOT NULL,
  token_count  INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  scanned_at   TEXT NOT NULL,
  PRIMARY KEY (item_type, item_ref)
);
