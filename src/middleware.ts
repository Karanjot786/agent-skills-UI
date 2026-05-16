import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';
import { NextRequest, NextResponse } from 'next/server';

// Commercial SEO audit tools — pure cost, drive zero real user traffic
// Do NOT include Googlebot/Bingbot/Applebot — they drive organic search traffic
const RATE_LIMITED_BOT_PATTERN = /SemrushBot|AhrefsBot|MJ12bot|DotBot|DataForSeoBot|BrightEdge|Screaming|serpstatbot|seokicks|linkdexbot|PetalBot|BaiduspiderBot|YandexBot/i;

// AI crawlers — serve llms.txt instead of full pages (no user traffic value)
const AI_BOT_PATTERN = /GPTBot|Claude-Web|anthropic-ai|CCBot|PerplexityBot|cohere-ai|YouBot|BraveBot|GoogleOther|Google-Extended/i;

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'as-needed',
    localeDetection: true,
});

export default function middleware(request: NextRequest) {
    const ua = request.headers.get('user-agent') || '';
    const { pathname } = request.nextUrl;

    // Only apply bot logic to skill detail pages (the 31K invocation route)
    const isSkillPage = /\/marketplace\/.+/.test(pathname);

    if (isSkillPage) {
        // AI bots: redirect to llms.txt (they don't need rendered HTML)
        if (AI_BOT_PATTERN.test(ua)) {
            return NextResponse.redirect(new URL('/llms.txt', request.url), {
                status: 301,
                headers: { 'Cache-Control': 'public, max-age=86400' },
            });
        }

        // SEO bots: return 429 with Retry-After to enforce crawl budget
        // They will back off and re-crawl later — won't drive continuous function invocations
        if (RATE_LIMITED_BOT_PATTERN.test(ua)) {
            const response = new NextResponse(null, { status: 429 });
            response.headers.set('Retry-After', '3600');
            response.headers.set('X-Robots-Tag', 'noarchive');
            return response;
        }
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: ['/((?!api|_next|.*\\..*).*)'],
};
