import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDocSection, getAllDocSectionsMeta, getAllDocSlugs, docLocales, getFaq, faqLocales } from './mdx.ts';

const slug = getAllDocSlugs()[0];

test('a locale without a translated file falls back to the English doc, in English order', () => {
  assert.ok(slug);
  assert.deepEqual(getDocSection(slug, 'xx'), getDocSection(slug));
  assert.deepEqual(getAllDocSectionsMeta('xx').map((s) => s.slug), getAllDocSectionsMeta().map((s) => s.slug));
  assert.equal(getDocSection('zzz-no-such-doc', 'ja'), null);
});

test('docLocales/faqLocales always start with en; FAQ falls back to English', () => {
  assert.equal(docLocales(slug)[0], 'en');
  assert.equal(faqLocales()[0], 'en');
  assert.deepEqual(getFaq('xx'), getFaq('en'));
  assert.ok(getFaq('en').categories.length > 0);
});
