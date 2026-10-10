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

test('second request inside the window is refused by a windowed limiter (Review Focus #5)', async () => {
  const seen = new Map<string, number>();
  const limiter = { limit: async ({ key }: { key: string }) => { const n = (seen.get(key) ?? 0) + 1; seen.set(key, n); return { success: n <= 1 }; } };
  const req = () => new Request('https://x.test/api/search?q=abc', { headers: { 'cf-connecting-ip': '9.9.9.9', 'x-forwarded-for': `${Math.random()}` } });
  assert.equal(await limitByIp(limiter, req()), true);
  assert.equal(await limitByIp(limiter, req()), false); // a rotated x-forwarded-for does not reset the window
});
