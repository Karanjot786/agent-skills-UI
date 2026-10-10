import { test } from 'node:test';
import assert from 'node:assert/strict';
import { absoluteUrl, skillPath } from './site.ts';
import { buildAlternates, ogLocale, skillTitle, skillDescription, slugAction } from './seo.ts';

test('absoluteUrl always uses the www host', () => {
  assert.equal(absoluteUrl(''), 'https://www.agentskills.in');
  assert.equal(absoluteUrl('/docs'), 'https://www.agentskills.in/docs');
  assert.equal(absoluteUrl('docs'), 'https://www.agentskills.in/docs');
});

test('translated locale: self canonical + hreflang among available + x-default=en', () => {
  assert.deepEqual(buildAlternates('/marketplace', ['en', 'ja'], 'ja'), {
    canonical: 'https://www.agentskills.in/ja/marketplace',
    languages: {
      en: 'https://www.agentskills.in/marketplace',
      ja: 'https://www.agentskills.in/ja/marketplace',
      'x-default': 'https://www.agentskills.in/marketplace',
    },
  });
});

test('untranslated locale: canonical to en, no hreflang', () => {
  assert.deepEqual(buildAlternates('/docs', ['en'], 'ja'), { canonical: 'https://www.agentskills.in/docs' });
  assert.deepEqual(buildAlternates('/docs', ['en'], 'en'), { canonical: 'https://www.agentskills.in/docs' });
});

test('home path is empty string and en has no prefix', () => {
  assert.equal(buildAlternates('', ['en', 'ja'], 'en').canonical, 'https://www.agentskills.in');
  assert.equal(buildAlternates('', ['en', 'ja'], 'ja').canonical, 'https://www.agentskills.in/ja');
});

test('ogLocale uses underscore form', () => {
  assert.equal(ogLocale('en'), 'en_US');
  assert.equal(ogLocale('zh-CN'), 'zh_CN');
  assert.equal(ogLocale('pt-BR'), 'pt_BR');
  assert.equal(ogLocale('xx'), 'en_US');
});

test('skillTitle: full form when it fits in 60 chars, shortened otherwise', () => {
  assert.equal(skillTitle('xlsx', 'anthropics'), 'xlsx by @anthropics — Agent Skill | Agent Skills');
  const t = skillTitle('a-very-long-skill-name-that-keeps-going', 'some-long-author');
  assert.ok(t.length <= 60, t);
  assert.ok(t.includes('by @some-long-author') || t.endsWith('…'));
});

test('skillDescription: ≤155 chars with ellipsis, fallback under 50 chars', () => {
  assert.equal(skillDescription('xlsx', 'short'), 'Install xlsx for Claude Code, Cursor, Codex and 40+ agents.');
  assert.equal(skillDescription('xlsx', null), 'Install xlsx for Claude Code, Cursor, Codex and 40+ agents.');
  const long = 'word '.repeat(60);
  const d = skillDescription('x', long);
  assert.ok(d.length <= 155 && d.endsWith('…'));
  const ok = 'A skill that reads and writes spreadsheets for agents quickly.';
  assert.equal(skillDescription('x', ok), ok);
});

test('skillPath encodes each segment once (@ -> %40), keeps dots and case', () => {
  assert.equal(skillPath('@a.b/Skill.Name'), '/marketplace/%40a.b/Skill.Name');
  assert.equal(skillPath('@owner/naïve skill'), '/marketplace/%40owner/na%C3%AFve%20skill');
});

const row = { scoped_name: '@majiayu000/jira-search', author: 'majiayu000' };

test('slugAction: exact match is ok', () => {
  assert.equal(slugAction('@majiayu000/jira-search', row), 'ok');
});
test('slugAction: case-only difference redirects to canonical', () => {
  assert.equal(slugAction('@MajiaYu000/Jira-Search', row), 'redirect');
});
test('slugAction: bare name redirects to the top-starred owner', () => {
  assert.equal(slugAction('jira-search', row), 'redirect');
});
test('slugAction: wrong author or extra segments is a 404', () => {
  assert.equal(slugAction('@random-author/jira-search', row), 'notfound');
  assert.equal(slugAction('nonexistent/foo/jira-search', row), 'notfound');
});
test('slugAction: row without scoped_name is left alone', () => {
  assert.equal(slugAction('@a/b', { scoped_name: null, author: 'a' }), 'ok');
});
test('slugAction: decoded %40 form of a dotted name is ok', () => {
  assert.equal(slugAction(decodeURIComponent('%40a.b/Skill.Name'), { scoped_name: '@a.b/Skill.Name', author: 'a.b' }), 'ok');
});
