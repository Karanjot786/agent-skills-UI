import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePlacement, safeHttpsUrl } from './sponsors.ts';

test('parsePlacement accepts known placements and category:<slug>', () => {
  for (const p of ['home', 'mcp', 'agents', 'plugins', 'newsletter', 'category:devops', 'category:ai-ml'])
    assert.equal(parsePlacement(p), p);
});
test('parsePlacement rejects junk', () => {
  for (const p of [null, '', 'HOME', 'category:', 'category:Dev Ops', "home' OR 1=1", 'category:' + 'a'.repeat(41)])
    assert.equal(parsePlacement(p), null);
});
test('safeHttpsUrl only allows https', () => {
  assert.equal(safeHttpsUrl('https://railway.com/x?a=1'), 'https://railway.com/x?a=1');
  assert.equal(safeHttpsUrl('http://x.com'), null);
  assert.equal(safeHttpsUrl('javascript:alert(1)'), null);
  assert.equal(safeHttpsUrl('nope'), null);
});
test('founding discount is 30% rounded to whole dollars', async () => {
  const { foundingPrice } = await import('./sponsors.ts');
  assert.equal(foundingPrice(149), 104);
  assert.equal(foundingPrice(299), 209);
  assert.equal(foundingPrice(499), 349);
});
