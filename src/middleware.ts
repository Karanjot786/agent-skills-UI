import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'as-needed', // English stays at root, others get prefix
    localeDetection: true // Auto-detect from Accept-Language header
});

export const config = {
    // Match all paths except API routes, static files, and Next.js internals
    matcher: ['/((?!api|_next|.*\\..*).*)']
};
