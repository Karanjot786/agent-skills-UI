import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDocSection, getAllDocSlugs, getAdjacentSections, getAllDocSectionsMeta } from '@/lib/mdx';
import { DocPageClient } from '@/components/doc-page-client';
import { locales, defaultLocale } from '@/i18n/config';

const siteUrl = 'https://agentskills.in';

const getLocalizedUrl = (path: string, locale: string) => {
    if (locale === defaultLocale) return `${siteUrl}${path}`;
    return `${siteUrl}/${locale}${path}`;
};

export async function generateStaticParams() {
    const slugs = getAllDocSlugs();
    return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
    const { locale, slug } = await params;
    const section = getDocSection(slug);

    if (!section) {
        return { title: 'Not Found' };
    }

    const title = `${section.title} — Agent Skills CLI Docs`;
    const description = section.description || `Documentation for ${section.title} in the Agent Skills CLI.`;
    const docPath = `/docs/${slug}`;

    const languages: Record<string, string> = {};
    locales.forEach(loc => {
        languages[loc] = getLocalizedUrl(docPath, loc);
    });

    return {
        title,
        description,
        alternates: {
            canonical: getLocalizedUrl(docPath, locale),
            languages,
        },
        openGraph: {
            title,
            description,
            url: getLocalizedUrl(docPath, locale),
            siteName: 'Agent Skills',
            type: 'article',
            images: [{
                url: `${siteUrl}/og-image.png`,
                width: 1200,
                height: 630,
                alt: `${section.title} — Agent Skills CLI`,
            }],
        },
    };
}

export default async function DocPage({
    params,
}: {
    params: Promise<{ locale: string; slug: string }>
}) {
    const { slug } = await params;
    const section = getDocSection(slug);

    if (!section) {
        notFound();
    }

    const { prev, next } = getAdjacentSections(slug);
    const allSections = getAllDocSectionsMeta();

    return (
        <DocPageClient
            section={section}
            prev={prev}
            next={next}
            allSections={allSections}
        />
    );
}
