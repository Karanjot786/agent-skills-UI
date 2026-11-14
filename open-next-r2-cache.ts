import r2 from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// Next's IncrementalCache only knows a route's `revalidate` from the prerender manifest or from an in-memory map filled
// by set() in the same isolate. Our ISR pages (generateStaticParams() => []) are not in the manifest, so on any isolate
// that has not rendered the page itself Next assumes revalidate = 1s: every R2 entry older than 1s is STALE, served with
// `s-maxage=2` and regenerated in the background (an R2 put each time). The entry stores its real `revalidate`, so
// report it as fresh until that many seconds have passed since it was written.
const cache = Object.create(r2) as typeof r2; // class instance: keep set/delete/getR2Key via the prototype
cache.get = async (key, cacheType) => {
  const entry = await r2.get(key, cacheType);
  const revalidate = (entry?.value as { revalidate?: number | false } | undefined)?.revalidate;
  if (entry && typeof entry.lastModified === "number" && typeof revalidate === "number" && revalidate > 0) {
    if (Date.now() - entry.lastModified < revalidate * 1000) return { ...entry, lastModified: Date.now() };
  }
  return entry;
};

export default cache;
