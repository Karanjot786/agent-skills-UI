/**
 * Rate Limiter Utility
 * 
 * Simple in-memory rate limiter using sliding window algorithm.
 * For production with multiple serverless instances, consider using
 * Upstash Redis rate limiter (@upstash/ratelimit) instead.
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

// In-memory store (works for single instance, use Redis for multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    limit: number;
    /** Time window in seconds */
    windowSeconds: number;
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (IP address, API key, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function rateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const key = identifier;

    let entry = rateLimitStore.get(key);

    // If no entry or window has expired, create new entry
    if (!entry || entry.resetTime < now) {
        entry = {
            count: 1,
            resetTime: now + windowMs,
        };
        rateLimitStore.set(key, entry);

        return {
            success: true,
            limit: config.limit,
            remaining: config.limit - 1,
            reset: entry.resetTime,
        };
    }

    // Increment count
    entry.count++;

    // Check if over limit
    if (entry.count > config.limit) {
        return {
            success: false,
            limit: config.limit,
            remaining: 0,
            reset: entry.resetTime,
        };
    }

    return {
        success: true,
        limit: config.limit,
        remaining: config.limit - entry.count,
        reset: entry.resetTime,
    };
}

/**
 * Get client IP from request (works with Vercel, Cloudflare, etc.)
 */
export function getClientIp(request: Request): string {
    const headers = new Headers(request.headers);

    // Try various headers in order of preference
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    const cfConnectingIp = headers.get('cf-connecting-ip');
    if (cfConnectingIp) {
        return cfConnectingIp;
    }

    // Fallback
    return 'unknown';
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
    return {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
    };
}

// Default rate limit configurations
export const RATE_LIMITS = {
    // General API: 60 requests per minute
    api: { limit: 60, windowSeconds: 60 },
    // Search API: 30 requests per minute (more expensive)
    search: { limit: 30, windowSeconds: 60 },
    // Stats API: 20 requests per minute
    stats: { limit: 20, windowSeconds: 60 },
    // Telemetry: 100 requests per minute
    telemetry: { limit: 100, windowSeconds: 60 },
    // Sitemap: 10 requests per minute per sitemap
    sitemap: { limit: 10, windowSeconds: 60 },
} as const;
