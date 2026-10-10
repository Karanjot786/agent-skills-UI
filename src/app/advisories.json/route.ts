import { getDb } from '@/lib/db';
import { buildAdvisories, type AdvisoryRow } from '@/lib/advisories';

// Only human-confirmed findings with an ASKL id are published.
const SQL = `SELECT f.advisory_id, f.item_type, f.item_ref, f.severity, f.content_hash, f.scanned_at,
  coalesce(s.scoped_name, i.name) AS name
FROM findings f
LEFT JOIN skills s ON f.item_type = 'skill' AND s.id = f.item_ref
LEFT JOIN items i ON f.item_type <> 'skill' AND i.seq = CAST(f.item_ref AS INTEGER)
WHERE f.status = 'confirmed' AND f.advisory_id IS NOT NULL
ORDER BY f.advisory_id`;

export async function GET() {
  const { results } = await getDb().prepare(SQL).all<AdvisoryRow>();
  return Response.json(buildAdvisories(results ?? [], new Date().toISOString()), {
    headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600', 'Access-Control-Allow-Origin': '*' },
  });
}
