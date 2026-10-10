import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pct, toCsv } from './lib.mjs';

test('pct', () => {
  assert.equal(pct(1, 4), '25.0%');
  assert.equal(pct(1, 3, 2), '33.33%');
  assert.equal(pct(5, 0), 'n/a');
});
test('toCsv quotes commas, quotes and newlines', () => {
  const out = toCsv([{ a: 'x,y', b: 'say "hi"', c: 3 }, { a: 'l1\nl2', b: '', c: 0 }], ['a', 'b', 'c']);
  assert.equal(out, 'a,b,c\n"x,y","say ""hi""",3\n"l1\nl2",,0\n');
});
