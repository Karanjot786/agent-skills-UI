import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { limitByIp } from '@/lib/rate-limit';
import { parseTelemetry } from '@/lib/telemetry-events';

const NO_STORE = { 'Cache-Control': 'private, no-store' };

export async function GET(request: Request) {
    if (!(await limitByIp(getCloudflareContext().env.TELEMETRY_LIMITER, request))) {
        return new Response(null, { status: 429, headers: NO_STORE });
    }
    const rows = parseTelemetry(new URL(request.url).searchParams);
    if (!rows) return new Response(null, { status: 400, headers: NO_STORE });
    if (rows.length) {
        try {
            const db = getDb();
            const day = new Date().toISOString().slice(0, 10);
            await db.batch(rows.map(([event, key]) =>
                db.prepare(`INSERT INTO telemetry_daily (day, event, item_key, count) VALUES (?, ?, ?, 1)
                    ON CONFLICT(day, event, item_key) DO UPDATE SET count = count + 1`).bind(day, event, key)));
        } catch (err) {
            console.error('telemetry write failed:', err);
        }
    }
    return new Response(null, { status: 204, headers: NO_STORE });
}
