import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildAdvisories, type AdvisoryRow } from './advisories.ts';

const row = (o: Partial<AdvisoryRow>): AdvisoryRow => ({
  advisory_id: 'ASKL-2026-0001', item_type: 'skill', item_ref: 'id1', severity: 'high',
  content_hash: 'sha256-a', scanned_at: '2026-10-20T00:00:00.000Z', name: '@evil/skill', ...o,
});

test('groups rows by advisory id, highest severity and earliest date win, hashes deduped, bad ids dropped', () => {
  const out = buildAdvisories([
    row({}),
    row({ severity: 'critical', scanned_at: '2026-10-19T00:00:00.000Z' }),
    row({ content_hash: 'sha256-b' }),
    row({ advisory_id: 'ASKL-2026-0002', item_type: 'mcp', item_ref: '42', name: 'weather', content_hash: 'sha256-c' }),
    row({ advisory_id: 'bogus' }),
  ], '2026-10-22T00:00:00.000Z');
  assert.equal(out.advisories.length, 2);
  assert.deepEqual(out.advisories[0], {
    id: 'ASKL-2026-0001', summary: 'Confirmed scan finding in @evil/skill', severity: 'critical', published: '2026-10-19T00:00:00.000Z',
    affected: [{ item_type: 'skill', item_ref: 'id1', content_hashes: ['sha256-a', 'sha256-b'] }],
  });
  assert.equal(out.advisories[1].affected[0].item_ref, '42');
});
