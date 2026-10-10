import type { Metadata } from 'next';
import { locales } from '@/i18n/config';
import { buildAlternates, ogLocale } from '@/lib/seo';
import { SITE_URL as siteUrl } from '@/lib/site';
import MarketplaceClient from './marketplace-client';
import { MarketplaceListing } from '@/components/marketplace-listing';

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;

    const titles: Record<string, string> = {
        en: "AI Skills Marketplace — Browse 220,000+ Skills for Cursor, Claude, Copilot",
        ja: "AIスキルマーケットプレイス — Cursor、Claude、Copilot用220,000+スキルを探す",
        "zh-CN": "AI技能市场 — 浏览220,000+个Cursor、Claude、Copilot技能",
        "zh-TW": "AI技能市場 — 瀏覽220,000+個Cursor、Claude、Copilot技能",
        vi: "Chợ kỹ năng AI — Duyệt 220,000+ kỹ năng cho Cursor, Claude, Copilot",
        es: "Marketplace de habilidades IA — Explora 220,000+ skills para Cursor, Claude, Copilot",
    };

    const descriptions: Record<string, string> = {
        en: "Discover, search, and install 220,000+ AI coding skills for 42+ agents including Cursor, Claude Code, GitHub Copilot, Gemini CLI, Windsurf, and Cline. Free and open-source.",
        ja: "Cursor、Claude Code、GitHub Copilot、Gemini CLI、Windsurf、Clineなど42以上のエージェント用の220,000+AIコーディングスキルを発見、検索、インストール。",
        "zh-CN": "发现、搜索和安装220,000+个AI编码技能，支持Cursor、Claude Code、GitHub Copilot、Gemini CLI、Windsurf和Cline等42+个代理。",
        "zh-TW": "發現、搜尋和安裝220,000+個AI編碼技能，支援Cursor、Claude Code、GitHub Copilot、Gemini CLI、Windsurf和Cline等42+個代理。",
        vi: "Khám phá, tìm kiếm và cài đặt 220,000+ kỹ năng lập trình AI cho 42+ tác tử bao gồm Cursor, Claude Code, GitHub Copilot, Gemini CLI, Windsurf và Cline.",
        es: "Descubre, busca e instala 220,000+ habilidades de codificación IA para 42+ agentes incluyendo Cursor, Claude Code, GitHub Copilot, Gemini CLI, Windsurf y Cline.",
    };

    const alt = buildAlternates('/marketplace', locales, locale);

    return {
        title: titles[locale] || titles.en,
        description: descriptions[locale] || descriptions.en,
        alternates: alt,
        openGraph: {
            title: titles[locale] || titles.en,
            description: descriptions[locale] || descriptions.en,
            url: alt.canonical,
            siteName: "Agent Skills",
            type: "website",
            locale: ogLocale(locale),
            images: [{
                url: `${siteUrl}/og-image.png`,
                width: 1200,
                height: 630,
                alt: "Agent Skills Marketplace — Browse 220,000+ AI Coding Skills",
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

export const revalidate = 3600;
export async function generateStaticParams() { return []; }

export default function MarketplacePage() {
    return (
        <MarketplaceClient>
            <MarketplaceListing page={1} />
        </MarketplaceClient>
    );
}
