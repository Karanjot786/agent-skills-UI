import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache, // revalidate=false pages -> R2 (NEXT_INC_CACHE_R2_BUCKET)
  tagCache: d1NextTagCache,              // revalidateTag -> D1 (NEXT_TAG_CACHE_D1)
});
