import { absoluteUrl } from './site.ts';

export type Alternates = { canonical: string; languages?: Record<string, string> };

const DEFAULT = 'en';
const at = (path: string, locale: string) => absoluteUrl(locale === DEFAULT ? path : `/${locale}${path}`);

// Translated locale => self canonical + hreflang among availableLocales + x-default (en).
// Untranslated locale => canonical to en, no hreflang (spec 6.3).
export function buildAlternates(path: string, availableLocales: readonly string[], currentLocale: string): Alternates {
    const translated = availableLocales.includes(currentLocale);
    const canonical = at(path, translated ? currentLocale : DEFAULT);
    if (!translated || availableLocales.length < 2) return { canonical };
    return {
        canonical,
        languages: { ...Object.fromEntries(availableLocales.map((l) => [l, at(path, l)])), 'x-default': at(path, DEFAULT) },
    };
}

const OG: Record<string, string> = {
    en: 'en_US', ja: 'ja_JP', 'zh-CN': 'zh_CN', 'zh-TW': 'zh_TW', vi: 'vi_VN', es: 'es_ES', de: 'de_DE', 'pt-BR': 'pt_BR',
};
export const ogLocale = (locale: string) => OG[locale] ?? 'en_US';

export function skillTitle(name: string, author: string): string {
    const full = `${name} by @${author} — Agent Skill | Agent Skills`;
    return full.length <= 60 ? full : `${full.slice(0, 59)}…`; // ponytail: plain slice, no shorter variant
}

export function skillDescription(name: string, description: string | null): string {
    const d = (description ?? '').replace(/\s+/g, ' ').trim();
    if (d.length < 50) return `Install ${name} for Claude Code, Cursor, Codex and 40+ agents.`;
    return d.length <= 155 ? d : `${d.slice(0, 154).trimEnd()}…`;
}
