import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toJsonl, parseResultLines, textOf, stateOf } from './gemini-batch.mjs';

test('toJsonl writes one {key, request} per line', () => {
  const lines = toJsonl([{ key: 's1', prompt: 'p1' }, { key: 's2', prompt: 'p2' }], 20).trim().split('\n').map(JSON.parse);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].key, 's1');
  assert.equal(lines[0].request.contents[0].parts[0].text, 'p1');
  assert.equal(lines[0].request.generation_config.max_output_tokens, 20);
});

test('parseResultLines maps key to text and errors to empty string', () => {
  const jsonl = [
    JSON.stringify({ key: 's1', response: { candidates: [{ content: { parts: [{ text: ' devops ' }] } }] } }),
    JSON.stringify({ key: 's2', error: { code: 500 } }),
    '',
  ].join('\n');
  const m = parseResultLines(jsonl);
  assert.equal(m.get('s1'), 'devops');
  assert.equal(m.get('s2'), '');
});

test('textOf and stateOf tolerate both documented shapes', () => {
  assert.equal(textOf({}), '');
  assert.equal(stateOf({ metadata: { state: 'JOB_STATE_RUNNING' } }), 'JOB_STATE_RUNNING');
  assert.equal(stateOf({ state: 'JOB_STATE_SUCCEEDED' }), 'JOB_STATE_SUCCEEDED');
});
