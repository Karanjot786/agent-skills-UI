CREATE TABLE IF NOT EXISTS telemetry_daily (
  day      TEXT NOT NULL,
  event    TEXT NOT NULL,
  item_key TEXT NOT NULL DEFAULT '',
  count    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, event, item_key)
) WITHOUT ROWID;
