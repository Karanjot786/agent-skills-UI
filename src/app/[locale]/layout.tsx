import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import "../globals.css";

const inter = Inter({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const siteUrl = "https://agentskills.in";

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: dark)", color: "#000000" },
        { media: "(prefers-color-scheme: light)", color: "#000000" },
    ],
    width: "device-width",
    initialScale: 1,
};

export async function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;

    const titles: Record<string, string> = {
        en: "Agent Skills CLI - The Universal Skill Manager for AI Agents",
        ja: "Agent Skills CLI - AIエージェント用ユニバーサルスキルマネージャー",
        "zh-CN": "Agent Skills CLI - AI代理的通用技能管理器",
        "zh-TW": "Agent Skills CLI - AI代理的通用技能管理器",
        vi: "Agent Skills CLI - Trình quản lý kỹ năng đa năng cho AI",
        es: "Agent Skills CLI - El gestor universal de habilidades para agentes de IA"
    };

    const descriptions: Record<string, string> = {
        en: "Install 100,000+ skills for 42 AI agents including Cursor, Claude, Copilot, Gemini CLI, Windsurf, and Cline. The #1 CLI for AI Agent workflows.",
        ja: "Cursor、Claude、Copilot、Gemini CLI、Windsurf、Clineを含む42のAIエージェント用の100,000+スキルをインストール。",
        "zh-CN": "为包括Cursor、Claude、Copilot、Gemini CLI、Windsurf和Cline在内的42个AI代理安装100,000+技能。",
        "zh-TW": "為包括Cursor、Claude、Copilot、Gemini CLI、Windsurf和Cline在內的42個AI代理安裝100,000+技能。",
        vi: "Cài đặt 100,000+ kỹ năng cho 42 tác tử AI bao gồm Cursor, Claude, Copilot, Gemini CLI, Windsurf và Cline.",
        es: "Instala 100,000+ habilidades para 42 agentes de IA incluyendo Cursor, Claude, Copilot, Gemini CLI, Windsurf y Cline."
    };

    return {
        title: {
            default: titles[locale] || titles.en,
            template: "%s | Agent Skills",
        },
        description: descriptions[locale] || descriptions.en,
        keywords: [
            "agent skills", "ai agents", "cursor", "claude code", "github copilot",
            "openai codex", "antigravity", "cli", "developer tools", "ai coding assistant",
            "skills marketplace", "llm tools", "ai workflow", "code generation",
        ],
        authors: [{ name: "Karanjot Singh", url: "https://github.com/Karanjot786" }],
        creator: "Karanjot Singh",
        publisher: "Agent Skills",
        metadataBase: new URL(siteUrl),
        alternates: {
            canonical: "/",
            languages: {
                en: "/",
                ja: "/ja",
                "zh-CN": "/zh-CN",
                "zh-TW": "/zh-TW",
                vi: "/vi",
                es: "/es"
            }
        },
        openGraph: {
            title: titles[locale] || titles.en,
            description: descriptions[locale] || descriptions.en,
            url: siteUrl,
            siteName: "Agent Skills",
            type: "website",
            locale: locale === "en" ? "en_US" : locale,
            images: [
                {
                    url: `${siteUrl}/og-image.png`,
                    width: 1200,
                    height: 630,
                    alt: "Agent Skills CLI - The Universal Skill Manager",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: titles[locale] || titles.en,
            description: descriptions[locale] || descriptions.en,
            creator: "@Karanjot786",
            images: [`${siteUrl}/og-image.png`],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
        applicationName: "Agent Skills CLI",
        category: "Developer Tools",
        formatDetection: {
            email: false,
            address: false,
            telephone: false,
        },
        icons: {
            icon: [
                { url: "/favicon.ico", sizes: "any" },
                { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
                { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
                { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
                { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
            ],
            shortcut: "/favicon-32x32.png",
            apple: "/apple-touch-icon.png",
        },
    };
}

// JSON-LD Structured Data
const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebSite",
            "@id": `${siteUrl}/#website`,
            url: siteUrl,
            name: "Agent Skills",
            description: "The Universal Skill Manager for AI Coding Agents",
            publisher: { "@id": `${siteUrl}/#organization` },
            potentialAction: {
                "@type": "SearchAction",
                target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${siteUrl}/marketplace?search={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
            },
        },
        {
            "@type": "Organization",
            "@id": `${siteUrl}/#organization`,
            name: "Agent Skills",
            url: siteUrl,
            logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` },
            sameAs: [
                "https://github.com/Karanjot786/agent-skills-cli",
                "https://www.npmjs.com/package/agent-skills-cli",
            ],
        },
        {
            "@type": "SoftwareApplication",
            "@id": `${siteUrl}/#software`,
            name: "Agent Skills CLI",
            description: "Command-line interface for managing AI coding skills across Cursor, Claude, Copilot, Codex, and Antigravity",
            applicationCategory: "DeveloperApplication",
            operatingSystem: "macOS, Windows, Linux",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            aggregateRating: { "@type": "AggregateRating", ratingValue: "5", ratingCount: "50" },
            softwareVersion: "1.0.8",
            downloadUrl: "https://www.npmjs.com/package/agent-skills-cli",
            author: {
                "@type": "Person",
                name: "Karanjot Singh",
                url: "https://github.com/Karanjot786",
                sameAs: ["https://github.com/Karanjot786", "https://www.linkedin.com/in/karanjot786"],
                jobTitle: "Software Developer",
            },
            publisher: {
                "@type": "Organization",
                name: "Agent Skills",
                url: "https://agentskills.in",
                logo: { "@type": "ImageObject", url: "https://agentskills.in/icon-512.png" },
            },
        },
    ],
};

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // Validate locale
    if (!locales.includes(locale as any)) {
        notFound();
    }

    // Enable static rendering
    setRequestLocale(locale);

    // Get messages for the locale
    const messages = await getMessages();

    return (
        <html lang={locale} className="dark" suppressHydrationWarning>
            <head>
                {/* Google Analytics */}
                <script
                    async
                    src="https://www.googletagmanager.com/gtag/js?id=G-V841ZBSTRC"
                />
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-V841ZBSTRC');
            `,
                    }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
                <link rel="manifest" href="/manifest.json" />
                {/* hreflang tags for SEO */}
                <link rel="alternate" hrefLang="en" href={siteUrl} />
                <link rel="alternate" hrefLang="ja" href={`${siteUrl}/ja`} />
                <link rel="alternate" hrefLang="zh-CN" href={`${siteUrl}/zh-CN`} />
                <link rel="alternate" hrefLang="zh-TW" href={`${siteUrl}/zh-TW`} />
                <link rel="alternate" hrefLang="vi" href={`${siteUrl}/vi`} />
                <link rel="alternate" hrefLang="es" href={`${siteUrl}/es`} />
                <link rel="alternate" hrefLang="x-default" href={siteUrl} />
            </head>
            <body
                className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans bg-black text-white`}
            >
                <NextIntlClientProvider messages={messages}>
                    {children}
                </NextIntlClientProvider>
                <Analytics />
            </body>
        </html>
    );
}
