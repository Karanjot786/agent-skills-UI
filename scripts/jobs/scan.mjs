// Nightly trust scan (spec §8). CLI: node scripts/jobs/scan.mjs [--remote] [--full]
// Nightly trust scan (spec §8): runs the CLI scanner over skills.content and items.readme(+install_json),
// writes findings + item_metrics. Off-Worker; loads D1 via wrangler files (lib/d1.mjs).
// Scanner = published agent-skills-cli dist (same code as `skills audit`). Local dev: SCANNER_DIST=../dist
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeSqlChunks, applySqlFiles, sqlValue } from './lib/d1.mjs';
import { query } from './lib/d1-query.mjs';

const dist = process.env.SCANNER_DIST ? pathToFileURL(resolve(process.env.SCANNER_DIST) + '/').href : null;
const load = (rel) => import(dist ? new URL(rel, dist).href : `agent-skills-cli/dist/${rel}`);
const { scanContent, scanInstallSpec } = await load('core/audit.js');
const { hashText } = await load('core/integrity.js');
export { hashText };

const PAGE = 200;

export function excerptOf(line) {
  return String(line ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
}

export function scanItem({ itemType, text, installJson }) {
  const body = text ?? '';
  const findings = [...scanContent(body, itemType === 'skill' ? 'SKILL.md' : 'README.md').findings];
  if (installJson) {
    let spec = null;
    try { spec = JSON.parse(installJson); } catch { /* malformed install_json: content scan only */ }
    if (spec?.type === 'mcp') findings.push(...scanInstallSpec(spec));
  }
  const seen = new Map();
  for (const f of findings) {
    const key = f.ruleId + '\0' + excerptOf(f.lineContent);
    if (!seen.has(key)) seen.set(key, f);
  }
  // Skills: hash == CLI lock contentHash of SKILL.md. Items include install_json so spec changes re-scan.
  const contentHash = hashText(installJson ? `${body}\n${installJson}` : body);
  return { findings: [...seen.values()], contentHash, tokenCount: Math.ceil(body.length / 4) };
}

export function itemStatements({ itemType, itemRef, findings, contentHash, tokenCount, now }) {
  const t = sqlValue(itemType), r = sqlValue(itemRef);
  const out = [`DELETE FROM findings WHERE item_type = ${t} AND item_ref = ${r} AND status = 'open';`];
  for (const f of findings) {
    const vals = [itemType, itemRef, f.ruleId, f.severity, excerptOf(f.lineContent), f.line ?? null, contentHash, now].map(sqlValue).join(', ');
    out.push(`INSERT INTO findings (item_type, item_ref, rule_id, severity, excerpt, line, content_hash, scanned_at) VALUES (${vals}) ON CONFLICT(item_type, item_ref, rule_id, excerpt) DO UPDATE SET severity = excluded.severity, line = excluded.line, scanned_at = excluded.scanned_at;`);
  }
  out.push(`INSERT INTO item_metrics (item_type, item_ref, token_count, content_hash, scanned_at) VALUES (${[itemType, itemRef, tokenCount, contentHash, now].map(sqlValue).join(', ')}) ON CONFLICT(item_type, item_ref) DO UPDATE SET token_count = excluded.token_count, content_hash = excluded.content_hash, scanned_at = excluded.scanned_at;`);
  return out;
}

const SOURCES = {
  skills: (after, full) => `SELECT s.seq AS seq, 'skill' AS item_type, s.id AS item_ref, s.content AS text, NULL AS install_json
    FROM skills s ${full ? '' : "LEFT JOIN item_metrics m ON m.item_type = 'skill' AND m.item_ref = s.id"}
    WHERE s.seq > ${Number(after)} AND s.content IS NOT NULL
    ${full ? '' : 'AND (m.scanned_at IS NULL OR coalesce(s.updated_at, s.indexed_at) > m.scanned_at)'}
    ORDER BY s.seq LIMIT ${PAGE}`,
  items: (after, full) => `SELECT i.seq AS seq, i.type AS item_type, CAST(i.seq AS TEXT) AS item_ref, coalesce(i.readme, i.description, '') AS text, i.install_json AS install_json
    FROM items i ${full ? '' : 'LEFT JOIN item_metrics m ON m.item_type = i.type AND m.item_ref = CAST(i.seq AS TEXT)'}
    WHERE i.seq > ${Number(after)}
    ${full ? '' : 'AND (m.scanned_at IS NULL OR coalesce(i.updated_at, i.indexed_at) > m.scanned_at)'}
    ORDER BY i.seq LIMIT ${PAGE}`,
};

async function main() {
  const remote = process.argv.includes('--remote');
  const full = process.argv.includes('--full');
  const now = new Date().toISOString();
  const outRoot = mkdtempSync(join(tmpdir(), 'scan-sql-'));
  const hits = new Map();
  let stmts = [];
  let batch = 0;
  let scanned = 0;

  const flush = async () => {
    if (!stmts.length) return;
    const dir = join(outRoot, String(batch++));
    mkdirSync(dir, { recursive: true });
    await applySqlFiles(writeSqlChunks(stmts, dir), { remote });
    stmts = [];
  };

  for (const [name, sql] of Object.entries(SOURCES)) {
    let after = 0;
    for (;;) {
      const rows = await query(sql(after, full), { remote });
      if (!rows.length) break;
      for (const row of rows) {
        const r = scanItem({ itemType: row.item_type, text: row.text, installJson: row.install_json });
        for (const f of r.findings) hits.set(f.ruleId, (hits.get(f.ruleId) ?? 0) + 1);
        stmts.push(...itemStatements({ itemType: row.item_type, itemRef: String(row.item_ref), findings: r.findings, contentHash: r.contentHash, tokenCount: r.tokenCount, now }));
        scanned++;
      }
      after = rows.at(-1).seq;
      if (stmts.length >= 5000) await flush();
      console.error(`${name}: scanned ${scanned} (seq ${after})`);
    }
  }
  await flush();

  console.log(`scanned ${scanned} item(s) at ${now}`);
  console.log('rule    hits   share');
  for (const [rule, n] of [...hits].sort((a, b) => b[1] - a[1])) {
    console.log(`${rule.padEnd(7)} ${String(n).padStart(6)}  ${((n / Math.max(scanned, 1)) * 100).toFixed(1)}%`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
