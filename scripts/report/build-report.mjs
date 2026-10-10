// Run: node scripts/report/build-report.mjs   (reads REMOTE D1; needs CLOUDFLARE_API_TOKEN in env for wrangler)
import { writeFileSync, mkdirSync } from 'node:fs';
import { query } from '../jobs/lib/d1-query.mjs';
import { pct, toCsv } from './lib.mjs';

const R = { remote: !process.argv.includes("--local") }; // --local: dry run against local D1, do not commit its output
const one = async (sql) => (await query(sql, R))[0];
const today = new Date().toISOString().slice(0, 10);

const totals = await one(`SELECT count(*) AS skills, sum(indexable) AS indexable, count(DISTINCT repo_full_name) AS repos, count(DISTINCT author) AS authors FROM skills`);
const scanned = await one(`SELECT count(*) AS n, round(avg(token_count)) AS avg_tokens FROM item_metrics WHERE item_type='skill'`);
const dup = await one(`SELECT coalesce(sum(c),0) AS dup_skills, count(*) AS groups FROM (SELECT count(*) c FROM item_metrics WHERE item_type='skill' AND content_hash IS NOT NULL GROUP BY content_hash HAVING c > 1)`);
const bySev = await query(`SELECT severity, status, count(*) AS findings, count(DISTINCT item_ref) AS skills FROM findings WHERE item_type='skill' AND status != 'false_positive' GROUP BY severity, status ORDER BY severity, status`, R);
const byRule = await query(`SELECT rule_id, severity, count(DISTINCT item_ref) AS skills FROM findings WHERE item_type='skill' AND status != 'false_positive' GROUP BY rule_id, severity ORDER BY skills DESC LIMIT 15`, R);
const flagged = await one(`SELECT count(DISTINCT item_ref) AS n FROM findings WHERE item_type='skill' AND status != 'false_positive' AND severity IN ('high','critical')`);
const confirmed = await one(`SELECT count(DISTINCT item_ref) AS n FROM findings WHERE item_type='skill' AND status = 'confirmed'`);
const cats = await query(`SELECT coalesce(category,'uncategorized') AS category, count(*) AS skills FROM skills GROUP BY 1 ORDER BY skills DESC LIMIT 12`, R);

const perRepo = await query(`
  SELECT s.repo_full_name AS repo, count(*) AS skills, max(s.stars) AS stars,
         sum(CASE WHEN d.c > 1 THEN 1 ELSE 0 END) AS duplicate_skills,
         coalesce(sum(f.n),0) AS findings_open_or_confirmed,
         CASE max(f.sevn) WHEN 4 THEN 'critical' WHEN 3 THEN 'high' WHEN 2 THEN 'medium' WHEN 1 THEN 'low' ELSE 'none' END AS max_severity
  FROM skills s
  LEFT JOIN item_metrics m ON m.item_type='skill' AND m.item_ref = s.id
  LEFT JOIN (SELECT content_hash, count(*) c FROM item_metrics WHERE item_type='skill' GROUP BY content_hash) d ON d.content_hash = m.content_hash
  LEFT JOIN (SELECT item_ref, count(*) n,
               max(CASE severity WHEN 'critical' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END) AS sevn
             FROM findings WHERE item_type='skill' AND status != 'false_positive' GROUP BY item_ref) f ON f.item_ref = s.id
  WHERE s.repo_full_name IS NOT NULL
  GROUP BY s.repo_full_name ORDER BY skills DESC`, R);

const report = {
  generatedAt: today,
  totals: { skills: totals.skills, indexable: totals.indexable, repos: totals.repos, authors: totals.authors },
  scan: { scannedSkills: scanned.n, scannedShare: pct(scanned.n, totals.skills), avgTokens: scanned.avg_tokens },
  duplicates: { skillsInDuplicateGroups: dup.dup_skills, groups: dup.groups, share: pct(dup.dup_skills, scanned.n) },
  findings: { highOrCriticalSkills: flagged.n, highOrCriticalShare: pct(flagged.n, scanned.n), confirmedSkills: confirmed.n, bySeverityStatus: bySev, topRules: byRule },
  categories: cats,
};
mkdirSync('content/report', { recursive: true });
mkdirSync('public/data', { recursive: true });
writeFileSync('content/report/state-of-agent-skills.json', JSON.stringify(report, null, 2) + '\n');
writeFileSync('public/data/state-of-agent-skills-2026-10.csv',
  toCsv(perRepo, ['repo', 'skills', 'stars', 'duplicate_skills', 'findings_open_or_confirmed', 'max_severity']));
console.log(`report ok: ${report.totals.skills} skills, ${perRepo.length} repos, ${report.duplicates.share} duplicates`);
