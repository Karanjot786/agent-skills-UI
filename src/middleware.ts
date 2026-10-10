import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';
import { NextRequest, NextResponse } from 'next/server';

// Commercial SEO audit tools — pure cost, drive zero real user traffic
// Do NOT include Googlebot/Bingbot/Applebot — they drive organic search traffic
const RATE_LIMITED_BOT_PATTERN = /SemrushBot|AhrefsBot|MJ12bot|DotBot|DataForSeoBot|BrightEdge|Screaming|serpstatbot|seokicks|linkdexbot|PetalBot|BaiduspiderBot|YandexBot/i;

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'as-needed',
    localeDetection: false,
    localeCookie: false,
    alternateLinks: false, // hreflang comes only from page metadata (buildAlternates)
});

export default function middleware(request: NextRequest) {
    const ua = request.headers.get('user-agent') || '';
    const { pathname } = request.nextUrl;

    // zh-TW was retired for zh-CN: permanent 301, path and query kept.
    if (/^\/zh-TW(\/|$)/.test(pathname)) {
        return NextResponse.redirect(new URL(pathname.replace('/zh-TW', '/zh-CN') + request.nextUrl.search, request.url), {
            status: 301,
            headers: { 'Cache-Control': 'private, no-store' },
        });
    }

    // Only apply bot logic to skill detail pages (the 31K invocation route)
    const isSkillPage = /\/marketplace\/.+/.test(pathname);

    if (isSkillPage) {
        // SEO bots: return 429 with Retry-After to enforce crawl budget
        // They will back off and re-crawl later — won't drive continuous function invocations
        if (RATE_LIMITED_BOT_PATTERN.test(ua)) {
            const response = new NextResponse(null, { status: 429 });
            response.headers.set('Retry-After', '3600');
            response.headers.set('X-Robots-Tag', 'noarchive');
            response.headers.set('Cache-Control', 'private, no-store');
            return response;
        }
    }

    const res = intlMiddleware(request);
    if (res.status >= 300 && res.status < 400) res.headers.set('Cache-Control', 'private, no-store');
    return res;
}

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)'],
};
