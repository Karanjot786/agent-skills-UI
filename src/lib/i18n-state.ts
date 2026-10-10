// Pure locale-state rules (spec 6.3). No imports so `node --test` can run it.
export type LocaleState = 'source' | 'translated' | 'redirect-to-source';
export interface Translation { description?: string | null; summary?: string | null; body?: string | null }

// default locale -> source; translation row exists -> translated (self-canonical); otherwise permanent redirect to English.
// hreflang: the source locale plus translated locales we actually serve, in site order.
// Text falls back field by field, so a row with an empty summary/body still shows the English body.
export function resolveLocale(
  locale: string, all: readonly string[], defaultLocale: string, have: readonly string[],
  tr: Translation | null, src: { description: string | null; content: string | null },
) {
  const state: LocaleState = locale === defaultLocale ? 'source' : have.includes(locale) ? 'translated' : 'redirect-to-source';
  const t = state === 'translated' ? tr : null;
  return {
    state,
    hreflang: all.filter((l) => l === defaultLocale || have.includes(l)),
    description: t?.description || src.description || '',
    summary: t?.summary || null,
    body: t?.body || src.content || null,
    translated: !!t,
  };
}
