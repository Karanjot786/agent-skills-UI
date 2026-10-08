import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSkillsQuery, buildSkillsSql, MAX_LIMIT } from './skills-sql.ts';

const q = (s: string) => parseSkillsQuery(new URLSearchParams(s));

test('limits and offsets are clamped', () => {
  assert.equal(q('limit=100000').limit, MAX_LIMIT);
  assert.equal(q('limit=-5').limit, 1);
  assert.equal(q('limit=abc').limit, 30);
  assert.equal(q('offset=-1').offset, 0);
  assert.equal(q('sortBy=evil;drop').sortBy, 'stars');
});

test('3+ char search uses FTS phrase, quotes escaped', () => {
  const s = buildSkillsSql(q('search=re"act'));
  assert.match(s.sql, /skills_fts MATCH \?/);
  assert.deepEqual(s.binds, ['"re""act"']);
});

test('1-2 char search falls back to name LIKE', () => {
  const s = buildSkillsSql(q('search=ai'));
  assert.doesNotMatch(s.sql, /MATCH/);
  assert.deepEqual(s.binds, ['%ai%']);
});

test('NUL bytes are stripped from search and name', () => {
  assert.deepEqual(buildSkillsSql(q('search=ab%00c')).binds, ['"abc"']);
  assert.equal(q('name=Fo%00o').name, 'Foo');
});

test('FTS operators in input stay literal', () => {
  assert.deepEqual(buildSkillsSql(q('search=a* NEAR -b')).binds, ['"a* NEAR -b"']);
});

test('exact name lookup wins over search and is case-insensitive', () => {
  const s = buildSkillsSql(q('name=Foo&search=bar'));
  assert.match(s.sql, /s\.name = \? COLLATE NOCASE/);
  assert.deepEqual(s.binds, ['Foo']);
});

test('filters combine and count uses same where', () => {
  const s = buildSkillsSql(q('category=devops&author=x&minStars=5&hasContent=true&sortBy=recent'));
  assert.deepEqual(s.binds, ['devops', 'x', 5]);
  assert.match(s.sql, /content IS NOT NULL/);
  assert.match(s.sql, /ORDER BY s\.updated_at DESC/);
  assert.equal(s.countSql.split('WHERE')[1], s.sql.split('WHERE')[1].split(' ORDER BY')[0]);
});

test('category=all is ignored; never selects content', () => {
  const s = buildSkillsSql(q('category=all'));
  assert.deepEqual(s.binds, []);
  assert.doesNotMatch(s.sql, /s\.content,/); // only `(s.content IS NOT NULL) AS has_content` is allowed
});
