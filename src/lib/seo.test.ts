import { test } from 'node:test';
import assert from 'node:assert/strict';
import { absoluteUrl } from './site.ts';
import { buildAlternates, ogLocale } from './seo.ts';

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
