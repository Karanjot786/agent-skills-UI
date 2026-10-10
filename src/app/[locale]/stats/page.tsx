import type { Metadata } from 'next';
import { buildAlternates, ogLocale } from '@/lib/seo';
import { SITE_URL as siteUrl } from '@/lib/site';
import StatsClient from './stats-client';

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;

    const titles: Record<string, string> = {
        en: "Agent Skills CLI Statistics — 220,000+ Skills, 42+ AI Agents",
        ja: "Agent Skills CLI統計 — 220,000+スキル、42+のAIエージェント",
        "zh-CN": "Agent Skills CLI统计 — 220,000+技能，42+个AI代理",
        "zh-TW": "Agent Skills CLI統計 — 220,000+技能，42+個AI代理",
        vi: "Thống kê Agent Skills CLI — 220,000+ kỹ năng, 42+ tác tử AI",
        es: "Estadísticas de Agent Skills CLI — 220,000+ habilidades, 42+ agentes IA",
    };

    const descriptions: Record<string, string> = {
        en: "Real-time statistics for Agent Skills CLI ecosystem. 220,000+ skills, 20,000+ contributors, 42+ AI coding agents supported. Free and open-source.",
        ja: "Agent Skills CLIエコシステムのリアルタイム統計。220,000+スキル、20,000+コントリビューター、42+のAIコーディングエージェント。",
        "zh-CN": "Agent Skills CLI生态系统的实时统计。220,000+技能、20,000+贡献者、42+个AI编码代理。",
        "zh-TW": "Agent Skills CLI生態系統的即時統計。220,000+技能、20,000+貢獻者、42+個AI編碼代理。",
        vi: "Thống kê thời gian thực cho hệ sinh thái Agent Skills CLI. 220,000+ kỹ năng, 20,000+ đóng góp viên, 42+ tác tử AI.",
        es: "Estadísticas en tiempo real del ecosistema Agent Skills CLI. 220,000+ habilidades, 20,000+ contribuidores, 42+ agentes IA.",
    };

    const alt = buildAlternates('/stats', ['en'], locale);

    return {
        title: titles[locale] || titles.en,
        description: descriptions[locale] || descriptions.en,
        alternates: alt,
        openGraph: {
            title: titles[locale] || titles.en,
            description: descriptions[locale] || descriptions.en,
            url: alt.canonical,
            locale: ogLocale(locale),
            siteName: "Agent Skills",
            type: "website",
            images: [{
                url: `${siteUrl}/og-image.png`,
                width: 1200,
                height: 630,
                alt: "Agent Skills CLI Statistics",
            }],
        },
    };
}

export default function StatsPage() {
    return <StatsClient />;
}
