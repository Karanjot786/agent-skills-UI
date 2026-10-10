import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache, // ISR pages (revalidate=false) live in R2 (NEXT_INC_CACHE_R2_BUCKET)
  // No tagCache: nothing calls revalidateTag/revalidatePath, so skip the per-request D1 lookup ("dummy").
  // No cache interception: OpenNext 4.0.2's interceptor returns the middleware rewrite status (200, from next-intl's
  // /x -> /en/x rewrite) instead of the cached 404/308, turning notFound() and permanentRedirect() into soft 200s on repeat hits.
  enableCacheInterception: false,
});
