import type { MetadataRoute } from 'next';
import { getAllDocSlugs } from '@/lib/mdx';
import { locales, defaultLocale } from '@/i18n/config';
import { absoluteUrl } from '@/lib/site';

const url = (path: string, loc: string) => absoluteUrl(`${loc === defaultLocale ? '' : `/${loc}`}${path}`);

// Translated UI pages only: every locale + full hreflang set incl. x-default. Skills live in /sitemap-skills/*.
export default function sitemap(): MetadataRoute.Sitemap {
    const routes = ['', '/docs', '/marketplace', '/faq', '/stats', ...getAllDocSlugs().map((s) => `/docs/${s}`)];
    return routes.flatMap((path) => locales.map((loc) => ({
        url: url(path, loc),
        alternates: { languages: { ...Object.fromEntries(locales.map((l) => [l, url(path, l)])), 'x-default': url(path, defaultLocale) } },
    })));
}
