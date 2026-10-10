import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePage, collectionJsonLd, jsonLdString, MAX_PAGE } from './structure.ts';

test('parsePage accepts 1..MAX_PAGE only, no leading zeros', () => {
  assert.equal(parsePage(undefined), 1);
  assert.equal(parsePage('2'), 2);
  assert.equal(parsePage('100'), MAX_PAGE);
  for (const bad of ['0', '01', '-1', '101', '1e2', 'abc', '', '2.5', '1000']) assert.equal(parsePage(bad), null, bad);
});

test('collectionJsonLd emits absolute urls, positions and breadcrumbs', () => {
  const ld = collectionJsonLd({
    base: 'https://www.agentskills.in', name: 'N', description: 'D', path: '/marketplace/page/2',
    crumbs: [{ name: 'Home', path: '/' }, { name: 'Marketplace', path: '/marketplace' }],
    items: [{ name: 'x', path: '/marketplace/%40a/x' }, { name: 'y', path: '/marketplace/%40a/y' }], start: 49,
  }) as any;
  const list = ld['@graph'][0].mainEntity;
  assert.equal(list['@type'], 'ItemList');
  assert.equal(list.itemListElement[0].position, 49);
  assert.equal(list.itemListElement[1].url, 'https://www.agentskills.in/marketplace/%40a/y');
  assert.equal(ld['@graph'][1].itemListElement[1].item, 'https://www.agentskills.in/marketplace');
});

test('jsonLdString cannot close the script tag', () => {
  assert.ok(!jsonLdString({ a: '</script><b>' }).includes('<'));
});
