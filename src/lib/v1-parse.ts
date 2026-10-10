const PART = /^[A-Za-z0-9_.-]{1,100}$/;

export function parseRepo(raw: string | null): { owner: string; repo: string } | null {
  if (!raw) return null;
  const s = raw.trim().replace(/^https:\/\/github\.com\//i, '');
  const [owner, repoRaw] = s.split('/');
  const repo = repoRaw?.replace(/\.git$/, '');
  if (!owner || !repo || !PART.test(owner) || !PART.test(repo)) return null;
  if (owner === '.' || owner === '..' || repo === '.' || repo === '..') return null;
  if (s.split('/').length > 2 && !/^https:\/\/github\.com\//i.test(raw.trim()) ) return null;
  return { owner, repo };
}

// Root match for a SKILL.md at the repo root; '0' is the character after '/', so [lo, hi) covers every URL
// under the repo. Lowercase, compared against lower(github_url) (idx_skills_github_url_lower): GitHub names are
// case-insensitive.
export function repoUrlRange(owner: string, repo: string): [string, string, string] {
  const root = `https://github.com/${owner}/${repo}`.toLowerCase();
  return [root, `${root}/`, `${root}0`];
}

export interface FindingAgg { item_ref: string; severity: string; n: number; scanned_at: string }
export type Counts = { critical: number; high: number; medium: number; low: number; scannedAt: string };

export function summarizeFindings(rows: FindingAgg[]): Record<string, Counts> {
  const out: Record<string, Counts> = {};
  for (const r of rows) {
    const c = (out[r.item_ref] ??= { critical: 0, high: 0, medium: 0, low: 0, scannedAt: r.scanned_at });
    if (r.severity in c) (c as Record<string, number | string>)[r.severity] = (c[r.severity as 'high'] as number) + r.n;
    if (r.scanned_at > c.scannedAt) c.scannedAt = r.scanned_at;
  }
  return out;
}
