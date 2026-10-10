import { test } from 'node:test';
import assert from 'node:assert/strict';
import { disputeUrl, itemScan } from './scan.ts';

test('dispute link targets the issue template with a title', () => {
  assert.equal(
    disputeUrl('skill', 'abc', '@a/b'),
    'https://github.com/Karanjot786/agent-skills-UI/issues/new?template=scan-dispute.yml&title=Scan+dispute%3A+%40a%2Fb+%28skill%2Fabc%29',
  );
});

test('itemScan maps the scan row and finding count to the CLI shape', () => {
  assert.deepEqual(itemScan(null, 0), { status: 'not_scanned' });
  assert.deepEqual(itemScan('2026-10-01T00:00:00Z', 0), { status: 'scanned', findings: 0, scannedAt: '2026-10-01T00:00:00Z' });
  assert.deepEqual(itemScan('2026-10-01T00:00:00Z', 3), { status: 'findings', findings: 3, scannedAt: '2026-10-01T00:00:00Z' });
});
