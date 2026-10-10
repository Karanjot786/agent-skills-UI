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
test('repoUrlRange gives the repo root plus the bracketed prefix on the unique index', () => {
  const [root, lo, hi] = repoUrlRange('a', 'b');
  assert.deepEqual([root, lo, hi], ['https://github.com/a/b', 'https://github.com/a/b/', 'https://github.com/a/b0']);
  const hit = (u: string) => u === root || (u >= lo && u < hi);
  assert.ok(hit('https://github.com/a/b'), 'skill at repo root');
  assert.ok(hit('https://github.com/a/b/tree/main/x'));
  assert.ok(!hit('https://github.com/a/b-other/tree/main/x'));
  assert.ok(!hit('https://github.com/a/b.js'));
});
test('repoUrlRange is lowercase so lower(github_url) matches any casing', () => {
  assert.deepEqual(repoUrlRange('Karanjot786', 'Agent-Skills-CLI'),
    ['https://github.com/karanjot786/agent-skills-cli', 'https://github.com/karanjot786/agent-skills-cli/', 'https://github.com/karanjot786/agent-skills-cli0']);
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
