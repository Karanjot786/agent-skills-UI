import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skillEntries, urlsetXml, indexXml } from './sitemap.ts';

test('skillEntries de-duplicates consecutive names, keeps the newest lastmod, encodes @', () => {
  const e = skillEntries([
    { scoped_name: '@a/x', updated_at: '2026-01-01T00:00:00.000Z' },
    { scoped_name: '@a/x', updated_at: '2026-03-01T00:00:00.000Z' },
    { scoped_name: '@b/y z', updated_at: null },
  ]);
  assert.deepEqual(e, [
    { loc: 'https://www.agentskills.in/marketplace/%40a/x', lastmod: '2026-03-01T00:00:00.000Z' },
    { loc: 'https://www.agentskills.in/marketplace/%40b/y%20z', lastmod: undefined },
  ]);
});

test('urlsetXml omits lastmod when absent and escapes &', () => {
  const xml = urlsetXml([{ loc: 'https://x/?a=1&b=2' }, { loc: 'https://x/b', lastmod: '2026-01-01T00:00:00.000Z' }]);
  assert.match(xml, /<loc>https:\/\/x\/\?a=1&amp;b=2<\/loc><\/url>/);
  assert.match(xml, /<lastmod>2026-01-01T00:00:00.000Z<\/lastmod>/);
  assert.equal((xml.match(/<lastmod>/g) ?? []).length, 1);
});

test('indexXml lists sitemaps with lastmod', () => {
  assert.match(indexXml([{ loc: 'https://x/s.xml', lastmod: '2026-01-01T00:00:00.000Z' }]), /<sitemap><loc>https:\/\/x\/s\.xml<\/loc><lastmod>2026-01-01T00:00:00.000Z<\/lastmod><\/sitemap>/);
});
