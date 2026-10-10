// de and pt-BR join in D7 together with their UI message files.
export const locales = ['en', 'ja', 'zh-CN', 'vi', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

// Locales whose per-locale skill sitemap is published. Add a locale here ONLY after the native review in D12.
export const sitemapLocales: readonly Locale[] = [];

export const localeNames: Record<Locale, string> = {
  'en': 'English',
  'ja': '日本語',
  'zh-CN': '简体中文',
  'vi': 'Tiếng Việt',
  'es': 'Español'
};

export const localeFlags: Record<Locale, string> = {
  'en': '🇺🇸',
  'ja': '🇯🇵',
  'zh-CN': '🇨🇳',
  'vi': '🇻🇳',
  'es': '🇪🇸'
};
