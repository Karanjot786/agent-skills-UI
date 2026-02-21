import type { Metadata } from 'next';
import { locales, defaultLocale } from '@/i18n/config';
import StatsClient from './stats-client';

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
        en: "Agent Skills CLI Statistics — 175,000+ Skills, 42+ AI Agents",
        ja: "Agent Skills CLI統計 — 175,000+スキル、29のAIエージェント",
        "zh-CN": "Agent Skills CLI统计 — 175,000+技能，29个AI代理",
        "zh-TW": "Agent Skills CLI統計 — 175,000+技能，29個AI代理",
        vi: "Thống kê Agent Skills CLI — 175,000+ kỹ năng, 29 tác tử AI",
        es: "Estadísticas de Agent Skills CLI — 175,000+ habilidades, 29 agentes IA",
    };

    const descriptions: Record<string, string> = {
        en: "Real-time statistics for Agent Skills CLI ecosystem. 175,000+ skills, 5,000+ contributors, 42+ AI coding agents supported. Free and open-source.",
        ja: "Agent Skills CLIエコシステムのリアルタイム統計。175,000+スキル、5,000+コントリビューター、29のAIコーディングエージェント。",
        "zh-CN": "Agent Skills CLI生态系统的实时统计。175,000+技能、5,000+贡献者、29个AI编码代理。",
        "zh-TW": "Agent Skills CLI生態系統的即時統計。175,000+技能、5,000+貢獻者、29個AI編碼代理。",
        vi: "Thống kê thời gian thực cho hệ sinh thái Agent Skills CLI. 175,000+ kỹ năng, 5,000+ đóng góp viên, 29 tác tử AI.",
        es: "Estadísticas en tiempo real del ecosistema Agent Skills CLI. 175,000+ habilidades, 5,000+ contribuidores, 29 agentes IA.",
    };

    const languages: Record<string, string> = {};
    locales.forEach(loc => {
        languages[loc] = getLocalizedUrl('/stats', loc);
    });

    return {
        title: titles[locale] || titles.en,
        description: descriptions[locale] || descriptions.en,
        alternates: {
            canonical: getLocalizedUrl('/stats', locale),
            languages,
        },
        openGraph: {
            title: titles[locale] || titles.en,
            description: descriptions[locale] || descriptions.en,
            url: getLocalizedUrl('/stats', locale),
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
