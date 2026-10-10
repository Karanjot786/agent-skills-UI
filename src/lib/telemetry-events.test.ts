import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTelemetry } from './telemetry-events.ts';

const p = (s: string) => parseTelemetry(new URLSearchParams(s));

test('parseTelemetry: event + agent rows only; drops query text, bad keys, unknown events and CI', () => {
  assert.deepEqual(p('event=install&skill=@a/b&agent=claude&v=1.2.0'), [['install', '@a/b'], ['agent', 'claude']]);
  assert.deepEqual(p('event=command&command=list&args=secret&query=hello'), [['command', 'list']]);
  assert.deepEqual(p('event=install&skill=' + 'a'.repeat(200)), [['install', '']]);
  assert.equal(p('event=drop_table'), null);
  assert.equal(p(''), null);
  assert.deepEqual(p('event=install&skill=x&ci=1'), []);
});
