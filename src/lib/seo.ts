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
