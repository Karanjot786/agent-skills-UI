import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categoryPrompt, parseCategory, summaryPrompt, validSummary, sourceHash } from './job-util.mjs';

test('parseCategory accepts only known ids, tolerates quotes and case', () => {
  const ids = ['devops', 'data-ml'];
  assert.equal(parseCategory(' "DevOps". ', ids), 'devops');
  assert.equal(parseCategory('data-ml\n', ids), 'data-ml');
  assert.equal(parseCategory('I think devops', ids), null);
  assert.equal(parseCategory('', ids), null);
});

test('categoryPrompt lists categories and the skill', () => {
  const p = categoryPrompt('devops: DevOps (ci, docker)', { name: 'deploy-helper', d: 'Ship\n  it' });
  assert.match(p, /devops: DevOps/);
  assert.match(p, /Skill: deploy-helper/);
  assert.match(p, /Description: Ship it/);
});

test('validSummary needs 35-75 words, the install command, no markdown', () => {
  const ok = 'Foo does a thing for teams that need it. '.repeat(4) + 'Install with npx agent-skills-cli install @a/foo.';
  assert.equal(validSummary(ok, '@a/foo'), true);
  assert.equal(validSummary('Too short. Install with npx agent-skills-cli install @a/foo.', '@a/foo'), false);
  assert.equal(validSummary(ok, '@a/other'), false);
  assert.equal(validSummary('**' + ok, '@a/foo'), false);
});

test('summaryPrompt embeds the exact install sentence; sourceHash is stable', () => {
  const r = { name: 'foo', scoped_name: '@a/foo', d: 'D', head: 'H' };
  assert.match(summaryPrompt(r), /Install with npx agent-skills-cli install @a\/foo\./);
  assert.equal(sourceHash(r), sourceHash({ ...r }));
  assert.notEqual(sourceHash(r), sourceHash({ ...r, head: 'H2' }));
});
