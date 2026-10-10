-- Case-insensitive repo lookup for /api/v1/check (GitHub owner/repo names are case-insensitive).
CREATE INDEX IF NOT EXISTS idx_skills_github_url_lower ON skills(lower(github_url));
