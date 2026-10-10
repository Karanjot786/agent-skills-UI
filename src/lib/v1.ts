import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse } from 'next/server';
import { limitByIp } from './rate-limit';

export const V1_HEADERS = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, s-maxage=300' };

// Same Workers Rate Limiting binding as /api/search (SEARCH_LIMITER, 60/min per cf-connecting-ip).
export async function isLimited(request: Request): Promise<boolean> {
  return !(await limitByIp(getCloudflareContext().env.SEARCH_LIMITER, request));
}

export const tooMany = () =>
  NextResponse.json({ error: 'rate limited, retry in a minute' }, { status: 429, headers: { 'Retry-After': '60', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } });
