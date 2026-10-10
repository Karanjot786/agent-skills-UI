import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { locales } from '@/i18n/config';
import { parsePlacement, safeHttpsUrl, SPONSOR_SQL } from '@/lib/sponsors';

export const dynamic = 'force-dynamic';

type Row = { id: number; title: string; url: string; image: string | null; blurb: string | null };

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const placement = parsePlacement(sp.get('placement'));
  if (!placement) {
    return NextResponse.json({ error: 'invalid placement' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
  const raw = sp.get('locale');
  const locale = raw && (locales as readonly string[]).includes(raw) ? raw : 'en'; // bounded cache keys
  try {
    const now = new Date().toISOString();
    const { results } = await getDb().prepare(SPONSOR_SQL).bind(placement, now, now, locale).all<Row>();
    const sponsors = results
      .map((r) => ({ id: r.id, title: r.title, url: safeHttpsUrl(r.url), image: r.image ? safeHttpsUrl(r.image) : null, blurb: r.blurb }))
      .filter((s) => s.url);
    return NextResponse.json({ sponsors }, { headers: { 'Cache-Control': 'public, s-maxage=300' } });
  } catch (e) {
    console.error('sponsors api', e);
    return NextResponse.json({ sponsors: [] }, { headers: { 'Cache-Control': 'public, s-maxage=60' } });
  }
}
