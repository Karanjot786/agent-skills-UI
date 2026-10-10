import type { Metadata } from 'next';
import { getAllDocSectionsMeta } from '@/lib/mdx';
import { DocsOverview } from '@/components/docs-overview';
import { buildAlternates, ogLocale } from '@/lib/seo';
import { SITE_URL as siteUrl } from '@/lib/site';

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;

    const titles: Record<string, string> = {
        en: 'CLI Documentation — Agent Skills | 62 Commands for 42+ AI Agents',
        ja: 'CLIドキュメント — Agent Skills | 42+のAIエージェント用62コマンド',
        'zh-CN': 'CLI文档 — Agent Skills | 42+个AI代理的62个命令',
        'zh-TW': 'CLI文檔 — Agent Skills | 42+個AI代理的62個命令',
        vi: 'Tài liệu CLI — Agent Skills | 62 lệnh cho 42+ tác tử AI',
        es: 'Documentación CLI — Agent Skills | 62 comandos para 42+ agentes IA',
    };

    const descriptions: Record<string, string> = {
        en: 'Complete reference for the Agent Skills CLI. Install, search, update, and manage 175,000+ AI coding skills across Cursor, Claude Code, GitHub Copilot, Gemini CLI, Windsurf, and Cline.',
        ja: 'Agent Skills CLIの完全リファレンス。Cursor、Claude Code、GitHub Copilot、Gemini CLI、Windsurf、Cline用の175,000+AIコーディングスキルをインストール、検索、管理。',
        'zh-CN': 'Agent Skills CLI完整参考。安装、搜索、更新和管理Cursor、Claude Code、GitHub Copilot、Gemini CLI、Windsurf和Cline的175,000+AI编码技能。',
        'zh-TW': 'Agent Skills CLI完整參考。安裝、搜尋、更新和管理Cursor、Claude Code、GitHub Copilot、Gemini CLI、Windsurf和Cline的175,000+AI編碼技能。',
        vi: 'Tham chiếu đầy đủ cho Agent Skills CLI. Cài đặt, tìm kiếm, cập nhật và quản lý 175,000+ kỹ năng lập trình AI cho Cursor, Claude Code, GitHub Copilot, Gemini CLI, Windsurf và Cline.',
        es: 'Referencia completa para Agent Skills CLI. Instala, busca, actualiza y gestiona 175,000+ habilidades de codificación IA para Cursor, Claude Code, GitHub Copilot, Gemini CLI, Windsurf y Cline.',
    };

    const alt = buildAlternates('/docs', ['en'], locale);

    return {
        title: titles[locale] || titles.en,
        description: descriptions[locale] || descriptions.en,
        alternates: alt,
        openGraph: {
            title: titles[locale] || titles.en,
            description: descriptions[locale] || descriptions.en,
            url: alt.canonical,
            locale: ogLocale(locale),
            siteName: 'Agent Skills',
            type: 'website',
            images: [{
                url: `${siteUrl}/og-image.png`,
                width: 1200,
                height: 630,
                alt: 'Agent Skills CLI Documentation',
            }],
        },
    };
}

export default function DocsPage() {
    const sections = getAllDocSectionsMeta();

    return <DocsOverview sections={sections} />;
}
