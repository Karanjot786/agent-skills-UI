import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { locales } from '@/i18n/config';

const CHUNK_SIZE = 5000;

export async function GET() {
    const baseUrl = 'https://agentskills.in';
    const lastMod = new Date().toISOString();

    try {
        const sitemaps = [];

        // 1. Static Pages
        for (const locale of locales) {
            sitemaps.push(`${baseUrl}/sitemap/${locale}/static/base/0.xml`);
        }

        // 2. Categories
        const categories = await prisma.categories.findMany({
            select: { id: true }
        });

        for (const cat of categories) {
            const count = await prisma.skills.count({
                where: { category: cat.id }
            });
            const chunks = Math.ceil(count / CHUNK_SIZE);

            if (count > 0) {
                for (const locale of locales) {
                    for (let i = 0; i < chunks; i++) {
                        // Points to sitemap.ts generated paths
                        sitemaps.push(`${baseUrl}/sitemap/${locale}/category/${cat.id}/${i}.xml`);
                    }
                }
            }
        }

        // 3. Misc
        const miscCount = await prisma.skills.count({
            where: { category: null }
        });
        if (miscCount > 0) {
            const miscChunks = Math.ceil(miscCount / CHUNK_SIZE);
            for (const locale of locales) {
                for (let i = 0; i < miscChunks; i++) {
                    sitemaps.push(`${baseUrl}/sitemap/${locale}/misc/uncategorized/${i}.xml`);
                }
            }
        }

        const sitemapEntries = sitemaps
            .map(loc => `  <sitemap>
    <loc>${loc}</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>`)
            .join('\n');

        const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;

        return new NextResponse(sitemapIndex, {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
            },
        });

    } catch (error) {
        console.error('Error serving sitemap index', error);
        return new NextResponse('Error serving sitemap index', { status: 500 });
    }
}
