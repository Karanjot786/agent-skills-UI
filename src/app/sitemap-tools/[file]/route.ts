import { itemSitemapResponse } from '@/lib/item-sitemap';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
    return itemSitemapResponse('tools', (await params).file);
}
