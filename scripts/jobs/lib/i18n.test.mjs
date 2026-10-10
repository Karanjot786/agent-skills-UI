import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mask, unmask, isLang, checkField, sourceHash, alreadyIn, estimateUsd, langName } from './i18n.mjs';

test('mask hides fences, inline code, urls, scoped names and round-trips', () => {
  const src = '---\nname: x\n---\nRun `npx foo` then see https://a.dev/x and @acme/tool.\n```bash\nnpm i\n```\n';
  const { text, tokens } = mask(src);
  assert.doesNotMatch(text, /npx|https|@acme|npm i|name: x/);
  assert.equal(tokens.length, 5);
  const r = unmask(text, tokens);
  assert.equal(r.text, src);
  assert.ok(r.ok);
});

test('unmask flags dropped, duplicated and mangled placeholders', () => {
  const { tokens } = mask('`a` and `b`');
  assert.equal(unmask('⟦0⟧ only', tokens).ok, false);
  assert.equal(unmask('⟦0⟧ ⟦0⟧ ⟦1⟧', tokens).ok, false);
  assert.equal(unmask('⟦ 1 ⟧ und ⟦0⟧', tokens).ok, false);
  assert.equal(unmask('⟦1⟧ und ⟦0⟧', tokens).ok, true);
});

test('isLang separates target languages from English', () => {
  assert.ok(isLang('このスキルはReactのコードレビューを自動化します。', 'ja'));
  assert.ok(!isLang('This skill automates code review for React projects.', 'ja'));
  assert.ok(isLang('这个技能可以自动审查 React 项目的代码。', 'zh-CN'));
  assert.ok(!isLang('このスキルはコードレビューを自動化します。', 'zh-CN'));
  assert.ok(isLang('Kỹ năng này tự động xem xét mã cho các dự án React của bạn.', 'vi'));
  assert.ok(isLang('Diese Skill automatisiert die Code-Review für Ihre React-Projekte und ist einfach zu nutzen.', 'de'));
  assert.ok(!isLang('This skill automates the code review for your React projects and is easy to use.', 'de'));
  assert.ok(isLang('Esta skill automatiza a revisão de código para os seus projetos React e não precisa de configuração.', 'pt-BR'));
});

const base = { dnt: ['SKILL.md', 'Claude Code'], locale: 'ja' };
test('checkField passes a good ja translation and fails each bad one', () => {
  const src = mask('Creates a SKILL.md for Claude Code agents. Use `skills init` first.');
  const good = 'Claude Code エージェント用の SKILL.md を作成します。最初に ⟦0⟧ を実行してください。';
  assert.deepEqual(checkField({ srcMasked: src.text, outMasked: good, tokens: src.tokens, ...base }), []);
  const bad = (out) => checkField({ srcMasked: src.text, outMasked: out, tokens: src.tokens, ...base });
  assert.match(bad('Claude Code エージェント用の SKILL.md を作成します。')[0], /placeholders/);
  assert.ok(bad('Creates a SKILL.md for Claude Code agents. Use ⟦0⟧ first.').some((p) => /language-ID/.test(p)));
  assert.ok(bad('エージェント用のファイルを作成します。最初に ⟦0⟧ を実行してください。').some((p) => /do-not-translate/.test(p)));
  assert.ok(bad('⟦0⟧ Claude Code SKILL.md のスキル。'.repeat(8)).some((p) => /length ratio/.test(p)));
});

test('code fence count must not change', () => {
  const src = mask('Install:\n```bash\nnpm i foo\n```\nDone, this works for you and your team today.');
  const out = 'Installieren:\n⟦0⟧\n```\nFertig, das funktioniert für Sie und Ihr Team heute und ist einfach.';
  assert.ok(checkField({ srcMasked: src.text, outMasked: out, tokens: src.tokens, dnt: [], locale: 'de' }).some((p) => /fence/.test(p)));
});

test('sourceHash changes with any field; alreadyIn skips target-language sources', () => {
  const a = sourceHash({ description: 'a', summary: 'b', body: 'c' });
  assert.notEqual(a, sourceHash({ description: 'a', summary: 'b', body: 'd' }));
  assert.notEqual(sourceHash({ description: 'ab', summary: '' }), sourceHash({ description: 'a', summary: 'b' }));
  assert.ok(alreadyIn('これはすでに日本語で書かれたスキルの説明文です。', 'ja'));
  assert.ok(!alreadyIn('An English description of five words or more.', 'ja'));
});

test('mask extra pattern hides ICU placeholders; langName comes from Intl', () => {
  const { text, tokens } = mask('{count}+ Skills Available', /\{[^}]+\}/g);
  assert.equal(text, '⟦0⟧+ Skills Available');
  assert.equal(unmask(text, tokens).text, '{count}+ Skills Available');
  assert.equal(langName('ja'), 'Japanese');
});

test('estimateUsd: wave 1 (500 skills x ja, zh-CN) costs well under a dollar', () => {
  const reqs = ['ja', 'zh-CN'].flatMap((locale) => Array.from({ length: 500 }, () => ({ chars: 600, locale })));
  const e = estimateUsd(reqs, 'gemini-3.1-flash-lite');
  assert.ok(e.usd > 0.05 && e.usd < 1, String(e.usd));
});
