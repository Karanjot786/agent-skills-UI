import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { locales } from './config.ts';

const load = (l: string) => JSON.parse(readFileSync(new URL(`../../messages/${l}.json`, import.meta.url), 'utf8'));
const flat = (o: Record<string, unknown>, p = ''): [string, string][] =>
    Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v ? flat(v as Record<string, unknown>, `${p}${k}.`) : [[`${p}${k}`, String(v)] as [string, string]]));
const holders = (s: string) => (s.match(/\{[^}]+\}/g) ?? []).sort().join(',');

const en = new Map(flat(load('en')));

for (const l of locales.filter((x) => x !== 'en')) {
    test(`messages/${l}.json has every en key and the same placeholders`, () => {
        assert.ok(existsSync(new URL(`../../messages/${l}.json`, import.meta.url)), `messages/${l}.json missing`);
        const m = new Map(flat(load(l)));
        assert.deepEqual([...m.keys()].sort(), [...en.keys()].sort());
        for (const [k, v] of en) {
            // empty values are allowed: CJK/vi word order leaves some fragments (e.g. home.title1) blank on purpose
            assert.equal(holders(m.get(k)!), holders(v), `${l}: placeholders differ in ${k}`);
        }
    });
}
