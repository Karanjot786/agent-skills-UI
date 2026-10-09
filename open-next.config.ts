import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache, // ISR pages (revalidate=false) live in R2 (NEXT_INC_CACHE_R2_BUCKET)
  // No tagCache: nothing calls revalidateTag/revalidatePath, so skip the per-request D1 lookup ("dummy").
  enableCacheInterception: true, // serve cached ISR pages from R2 without booting NextServer
});
