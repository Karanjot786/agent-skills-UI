import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRepo, repoUrlRange, summarizeFindings } from './v1-parse.ts';

test('parseRepo variants', () => {
  assert.deepEqual(parseRepo('vercel-labs/skills'), { owner: 'vercel-labs', repo: 'skills' });
  assert.deepEqual(parseRepo('https://github.com/Karanjot786/agent-skills-cli.git'), { owner: 'Karanjot786', repo: 'agent-skills-cli' });
  assert.deepEqual(parseRepo('https://github.com/a/b/tree/main/x'), { owner: 'a', repo: 'b' });
});
test('parseRepo rejects junk', () => {
  for (const r of [null, '', 'a', 'a/b/c d', "a/b'; DROP", '../etc/passwd', 'a/' + 'x'.repeat(101)])
    assert.equal(parseRepo(r as string | null), null);
});
test('repoUrlRange brackets the repo prefix on the unique index', () => {
  assert.deepEqual(repoUrlRange('a', 'b'), ['https://github.com/a/b/', 'https://github.com/a/b0']);
});
test('summarizeFindings groups by skill and severity, tracks latest scan', () => {
  const out = summarizeFindings([
    { item_ref: 's1', severity: 'high', n: 2, scanned_at: '2026-10-01' },
    { item_ref: 's1', severity: 'low', n: 1, scanned_at: '2026-10-03' },
    { item_ref: 's2', severity: 'critical', n: 1, scanned_at: '2026-10-02' },
  ]);
  assert.deepEqual(out.s1, { critical: 0, high: 2, medium: 0, low: 1, scannedAt: '2026-10-03' });
  assert.equal(out.s2.critical, 1);
});
