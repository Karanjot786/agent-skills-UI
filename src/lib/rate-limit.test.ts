import { test } from 'node:test';
import assert from 'node:assert/strict';
import { limitByIp } from './rate-limit.ts';

test('limitByIp keys on cf-connecting-ip, not a spoofable x-forwarded-for; fails open without a binding', async () => {
  const seen: string[] = [];
  const limiter = { limit: async ({ key }: { key: string }) => { seen.push(key); return { success: false }; } };
  const req = new Request('https://x.test/', { headers: { 'x-forwarded-for': '6.6.6.6', 'cf-connecting-ip': '1.2.3.4' } });
  assert.equal(await limitByIp(limiter, req), false);
  assert.deepEqual(seen, ['1.2.3.4']);
  assert.equal(await limitByIp(undefined, req), true);
});
