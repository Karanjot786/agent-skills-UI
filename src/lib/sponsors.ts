// Pure helpers for sponsor slots. No framework imports so `node --test` can run them.
const FIXED = new Set(['home', 'mcp', 'agents', 'plugins', 'newsletter']);

export function parsePlacement(raw: string | null): string | null {
  if (!raw) return null;
  if (FIXED.has(raw)) return raw;
  return /^category:[a-z0-9-]{1,40}$/.test(raw) ? raw : null;
}

export function safeHttpsUrl(u: string): string | null {
  try { return new URL(u).protocol === 'https:' ? u : null; } catch { return null; }
}

// Binds: placement, now, now, locale. Separate table, never joined into skill queries (sponsors never affect ranking).
export const SPONSOR_SQL =
  `SELECT id, placement, item_type, item_ref, title, url, image, blurb
   FROM sponsor_slots
   WHERE placement = ? AND status = 'active' AND starts_at <= ? AND ends_at > ?
     AND (locale = '*' OR locale = ?)
   ORDER BY starts_at ASC, id ASC LIMIT 3`;

// Spec §9: first 5 sponsors get 30% off, rounded to whole dollars.
export const foundingPrice = (usd: number) => Math.round(usd * 0.7);
