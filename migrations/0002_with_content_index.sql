-- Partial index: serves `WHERE content IS NOT NULL` (marketplace "has content" filter) for both
-- the count and the stars-ordered page without scanning 2 GB of rows.
CREATE INDEX idx_skills_with_content ON skills(stars DESC) WHERE content IS NOT NULL;
