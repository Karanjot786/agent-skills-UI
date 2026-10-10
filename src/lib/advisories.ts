// OSV-style advisories from human-confirmed findings (spec §8). Consumed by `skills audit` (CLI F9).
export interface AdvisoryRow {
  advisory_id: string; item_type: string; item_ref: string; severity: string;
  content_hash: string; scanned_at: string; name: string | null;
}
export interface Advisory {
  id: string; summary: string; severity: string; published: string;
  affected: { item_type: string; item_ref: string; content_hashes: string[] }[];
}

const ID = /^ASKL-\d{4}-\d{4,}$/;
const RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export function buildAdvisories(rows: AdvisoryRow[], now: string) {
  const byId = new Map<string, Advisory>();
  for (const r of rows) {
    if (!ID.test(r.advisory_id)) continue;
    let a = byId.get(r.advisory_id);
    if (!a) {
      a = { id: r.advisory_id, summary: `Confirmed scan finding in ${r.name ?? r.item_ref}`, severity: r.severity, published: r.scanned_at, affected: [] };
      byId.set(r.advisory_id, a);
    }
    if ((RANK[r.severity] ?? 9) < (RANK[a.severity] ?? 9)) a.severity = r.severity;
    if (r.scanned_at < a.published) a.published = r.scanned_at;
    let aff = a.affected.find((x) => x.item_type === r.item_type && x.item_ref === r.item_ref);
    if (!aff) a.affected.push(aff = { item_type: r.item_type, item_ref: r.item_ref, content_hashes: [] });
    if (!aff.content_hashes.includes(r.content_hash)) aff.content_hashes.push(r.content_hash);
  }
  return { schema_version: '1', generated_at: now, advisories: [...byId.values()].sort((x, y) => x.id.localeCompare(y.id)) };
}
