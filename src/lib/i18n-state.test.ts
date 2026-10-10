import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveLocale } from './i18n-state.ts';

const ALL = ['en', 'ja', 'zh-CN', 'vi', 'de', 'pt-BR', 'es'];
const src = { description: 'EN desc', content: 'EN body' };
const r = (locale: string, have: string[], tr: any = null) => resolveLocale(locale, ALL, 'en', have, tr, src);

test('resolveLocale follows the 6.3 table and lists hreflang only among existing translations', () => {
  assert.equal(r('en', ['ja']).state, 'source');
  assert.equal(r('ja', ['ja'], { description: 'JA', summary: null, body: null }).state, 'translated');
  assert.equal(r('de', ['ja']).state, 'redirect-to-source');
  assert.equal(r('ja', []).state, 'redirect-to-source');
  assert.deepEqual(r('ja', ['zh-CN', 'ja'], {}).hreflang, ['en', 'ja', 'zh-CN']);
  assert.deepEqual(r('en', ['fr']).hreflang, ['en']);
});

test('resolveLocale falls back field by field (empty summary/body never blank the page)', () => {
  const tr = { description: 'JA desc', summary: '', body: null };
  assert.deepEqual(r('ja', ['ja'], tr), { state: 'translated', hreflang: ['en', 'ja'], description: 'JA desc', summary: null, body: 'EN body', translated: true });
  assert.deepEqual(r('en', ['ja'], tr), { state: 'source', hreflang: ['en', 'ja'], description: 'EN desc', summary: null, body: 'EN body', translated: false });
});
