import { getCloudflareContext } from '@opennextjs/cloudflare';

// Bindings are request-scoped on Workers: call this inside a request/render, never cache the result
// at module level (the old global pg Pool caused ~10% "code had hung" errors).
export function getDb(): D1Database {
    return getCloudflareContext().env.DB;
}
