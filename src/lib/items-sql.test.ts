import { test } from 'node:test';
import assert from 'node:assert/strict';
import { typeFromSegment, isItemType, isValidSlug, itemPath, buildListSql, buildItemSearchSql, itemMetaDescription, PAGE_SIZE } from './items-sql.ts';

test('segments <-> types; rules not live yet', () => {
  assert.equal(typeFromSegment('mcp'), 'mcp');
  assert.equal(typeFromSegment('agents'), 'agent');
  assert.equal(typeFromSegment('plugins'), 'plugin');
  assert.equal(typeFromSegment('rules'), null);
  assert.equal(typeFromSegment('docs'), null);
  assert.equal(isItemType('agent'), true);
  assert.equal(isItemType('skill'), false);
  assert.equal(itemPath('agent', 'a--b--rev'), '/agents/a--b--rev');
});

test('slugs: no dots, no uppercase, no leading/trailing dash', () => {
  assert.ok(isValidSlug('io-github-foo--bar'));
  for (const bad of ['io.github.foo', 'Foo', '-a', 'a-', '', 'a/b', 'x'.repeat(201)]) assert.equal(isValidSlug(bad), false, bad);
});

test('list SQL: live rows only, stars order, fetches one extra row for hasNext, clamps page', () => {
  const s = buildListSql({ type: 'mcp', page: 3, pageSize: PAGE_SIZE });
  assert.match(s.sql, /i\.type = \? AND i\.status = 'active' AND i\.canonical_seq IS NULL ORDER BY i\.stars DESC, i\.seq ASC LIMIT \? OFFSET \?$/);
  assert.deepEqual(s.binds, ['mcp', PAGE_SIZE + 1, 2 * PAGE_SIZE]);
  const c = buildListSql({ type: 'agent', category: 'devops', page: 0, pageSize: 1000 });
  assert.match(c.sql, /AND i\.category = \?/);
  assert.deepEqual(c.binds, ['agent', 'devops', 101, 0]);
  assert.equal(buildListSql({ type: 'mcp', page: 99999, pageSize: 10 }).binds.at(-1), 199 * 10);
});

test('search SQL: trigram phrase for 3+ chars, LIKE for 1-2, null when empty', () => {
  const s = buildItemSearchSql('st"ripe', 'mcp', 5)!;
  assert.match(s.sql, /items_fts MATCH \?/);
  assert.deepEqual(s.binds, ['"st""ripe"', 'mcp', 5]);
  const l = buildItemSearchSql('ai', null, 5)!;
  assert.doesNotMatch(l.sql, /MATCH/);
  assert.deepEqual(l.binds, ['%ai%', 5]);
  assert.equal(buildItemSearchSql(' \0 ', null, 5), null);
});

test('meta description: <=155 chars with ellipsis, fallback when short', () => {
  assert.equal(itemMetaDescription('Stripe', 'MCP Server', 'tiny'),
    'Install Stripe (MCP Server) in Claude Code, Cursor, VS Code, Codex and more with one command.');
  const d = itemMetaDescription('X', 'Subagent', 'word '.repeat(80));
  assert.ok(d.length <= 155 && d.endsWith('…'));
});
