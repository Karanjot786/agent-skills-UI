import type { MetadataRoute } from 'next';
import { getAllDocSlugs, docLocales, faqLocales } from '@/lib/mdx';
import { locales, defaultLocale } from '@/i18n/config';
import { absoluteUrl } from '@/lib/site';

const url = (path: string, loc: string) => absoluteUrl(`${loc === defaultLocale ? '' : `/${loc}`}${path}`);

// UI pages: each locale URL is listed only where that locale is self-canonical (spec 6.3), with hreflang among those.
// Skills live in /sitemap-skills/*.
export default function sitemap(): MetadataRoute.Sitemap {
    const avail = (path: string): readonly string[] =>
        path.startsWith('/docs/') ? docLocales(path.slice(6)) : path === '/faq' ? faqLocales() : path === '/docs' || path === '/stats' ? ['en'] : locales;
    const routes = ['', '/docs', '/marketplace', '/faq', '/stats', ...getAllDocSlugs().map((s) => `/docs/${s}`)];
    return routes.flatMap((path) => avail(path).map((loc) => ({
        url: url(path, loc),
        alternates: { languages: { ...Object.fromEntries(avail(path).map((l) => [l, url(path, l)])), 'x-default': url(path, defaultLocale) } },
    })));
}
