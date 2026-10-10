import HomeClient from './home-client';
import { HomeLinks } from '@/components/home-links';

// DB-backed server component inside a client page: pass it as children. No own dynamic segment and no D1 at build,
// so render per request; the CDN caches it via the 1h s-maxage header in next.config.
export const dynamic = 'force-dynamic';

export default function Page() {
  return <HomeClient><HomeLinks /></HomeClient>;
}
