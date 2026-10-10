-- Translations of skills (and, once WS4 lands, items). Source rows stay English in `skills` / `items`.
-- source_hash = sha256(description \0 summary \0 body source); a changed source => re-translate.
CREATE TABLE skill_i18n (
  skill_seq INTEGER NOT NULL, locale TEXT NOT NULL,
  description TEXT, summary TEXT, body TEXT,
  source_hash TEXT NOT NULL, model TEXT NOT NULL, prompt_version TEXT NOT NULL,
  translated_at TEXT NOT NULL,
  PRIMARY KEY (skill_seq, locale)
);
CREATE INDEX idx_skill_i18n_locale ON skill_i18n(locale, skill_seq);

CREATE TABLE item_i18n (
  item_seq INTEGER NOT NULL, locale TEXT NOT NULL,
  description TEXT, summary TEXT, body TEXT,
  source_hash TEXT NOT NULL, model TEXT NOT NULL, prompt_version TEXT NOT NULL,
  translated_at TEXT NOT NULL,
  PRIMARY KEY (item_seq, locale)
);
CREATE INDEX idx_item_i18n_locale ON item_i18n(locale, item_seq);
