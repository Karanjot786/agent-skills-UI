import type { Metadata } from 'next';
import { locales, defaultLocale, type Locale } from '@/i18n/config';
import MarketplaceClient from './marketplace-client';

const siteUrl = 'https://agentskills.in';

const getLocalizedUrl = (path: string, locale: string) => {
    if (locale === defaultLocale) return `${siteUrl}${path}`;
    return `${siteUrl}/${locale}${path}`;
};

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;

    const titles: Record<string, string> = {
        en: "AI Skills Marketplace — Browse 175,000+ Skills for Cursor, Claude, Copilot",
        ja: "AIスキルマーケットプレイス — Cursor、Claude、Copilot用175,000+スキルを探す",
        "zh-CN": "AI技能市场 — 浏览175,000+个Cursor、Claude、Copilot技能",
        "zh-TW": "AI技能市場 — 瀏覽175,000+個Cursor、Claude、Copilot技能",
        vi: "Chợ kỹ năng AI — Duyệt 175,000+ kỹ năng cho Cursor, Claude, Copilot",
        es: "Marketplace de habilidades IA — Explora 175,000+ skills para Cursor, Claude, Copilot",
    };

    const descriptions: Record<string, string> = {
        en: "Discover, search, and install 175,000+ AI coding skills for 42+ agents including Cursor, Claude Code, GitHub Copilot, Gemini CLI, Windsurf, and Cline. Free and open-source.",
        ja: "Cursor、Claude Code、GitHub Copilot、Gemini CLI、Windsurf、Clineなど42以上のエージェント用の175,000+AIコーディングスキルを発見、検索、インストール。",
        "zh-CN": "发现、搜索和安装175,000+个AI编码技能，支持Cursor、Claude Code、GitHub Copilot、Gemini CLI、Windsurf和Cline等42+个代理。",
        "zh-TW": "發現、搜尋和安裝175,000+個AI編碼技能，支援Cursor、Claude Code、GitHub Copilot、Gemini CLI、Windsurf和Cline等42+個代理。",
        vi: "Khám phá, tìm kiếm và cài đặt 175,000+ kỹ năng lập trình AI cho 42+ tác tử bao gồm Cursor, Claude Code, GitHub Copilot, Gemini CLI, Windsurf và Cline.",
        es: "Descubre, busca e instala 175,000+ habilidades de codificación IA para 42+ agentes incluyendo Cursor, Claude Code, GitHub Copilot, Gemini CLI, Windsurf y Cline.",
    };

    const languages: Record<string, string> = {};
    locales.forEach(loc => {
        languages[loc] = getLocalizedUrl('/marketplace', loc);
    });

    return {
        title: titles[locale] || titles.en,
        description: descriptions[locale] || descriptions.en,
        alternates: {
            canonical: getLocalizedUrl('/marketplace', locale),
            languages,
        },
        openGraph: {
            title: titles[locale] || titles.en,
            description: descriptions[locale] || descriptions.en,
            url: getLocalizedUrl('/marketplace', locale),
            siteName: "Agent Skills",
            type: "website",
            locale: locale === "en" ? "en_US" : locale,
            images: [{
                url: `${siteUrl}/og-image.png`,
                width: 1200,
                height: 630,
                alt: "Agent Skills Marketplace — Browse 175,000+ AI Coding Skills",
            }],
        },
        twitter: {
            card: "summary_large_image",
            title: titles[locale] || titles.en,
            description: descriptions[locale] || descriptions.en,
            images: [`${siteUrl}/og-image.png`],
        },
        keywords: [
            "ai skills marketplace", "cursor skills", "claude code skills", "copilot skills",
            "ai coding assistant", "agent skills", "windsurf skills", "cline skills",
            "gemini cli skills", "coding automation", "ai developer tools", "skill manager",
            "open source ai tools", "coding skills", "ai workflow automation",
        ],
    };
}

// CollectionPage + ItemList structured data for SEO/GEO
const marketplaceJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "AI Skills Marketplace",
    "description": "Browse, search, and install 175,000+ AI coding skills for 42+ agents including Cursor, Claude Code, GitHub Copilot, Gemini CLI, Windsurf, and Cline.",
    "url": `${siteUrl}/marketplace`,
    "isPartOf": {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
    },
    "breadcrumb": {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": siteUrl,
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Marketplace",
                "item": `${siteUrl}/marketplace`,
            },
        ],
    },
    "mainEntity": {
        "@type": "ItemList",
        "name": "AI Coding Skills",
        "description": "175,000+ skills for AI coding agents",
        "numberOfItems": 100000,
        "itemListOrder": "https://schema.org/ItemListOrderDescending",
    },
    "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", ".text-zinc-400"]
    },
};

export default function MarketplacePage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(marketplaceJsonLd) }}
            />
            <MarketplaceClient />
        </>
    );
}
