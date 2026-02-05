export const locales = ['en', 'ja', 'zh-CN', 'zh-TW', 'vi', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  'en': 'English',
  'ja': '日本語',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'vi': 'Tiếng Việt',
  'es': 'Español'
};

export const localeFlags: Record<Locale, string> = {
  'en': '🇺🇸',
  'ja': '🇯🇵',
  'zh-CN': '🇨🇳',
  'zh-TW': '🇹🇼',
  'vi': '🇻🇳',
  'es': '🇪🇸'
};
