import { Metadata } from 'next';
import { buildAlternates, ogLocale } from '@/lib/seo';
import { getFaq, faqLocales, type FaqData } from '@/lib/mdx';
import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ChevronDown, Terminal, HelpCircle, Zap, Shield, Globe } from 'lucide-react';

// Metadata is now handled by generateMetadata in layout or we use dynamic metadata here
export async function generateMetadata({
    params
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale } = await params;

    const titles: Record<string, string> = {
        en: 'FAQ - Frequently Asked Questions | Agent Skills CLI',
        ja: 'よくある質問 — Agent Skills CLI',
        'zh-CN': '常见问题 — Agent Skills CLI',
        vi: 'Câu hỏi thường gặp — Agent Skills CLI',
        es: 'Preguntas frecuentes — Agent Skills CLI',
    };

    const descriptions: Record<string, string> = {
        en: 'Common questions about Agent Skills CLI: installation, usage, supported AI agents (Cursor, Claude, Copilot), skill creation, and troubleshooting.',
        ja: 'Agent Skills CLIに関するよくある質問：インストール、使用方法、サポートされているAIエージェント、スキル作成、トラブルシューティング。',
        'zh-CN': '关于Agent Skills CLI的常见问题：安装、使用、支持的AI代理（Cursor、Claude、Copilot）、技能创建和故障排除。',
        vi: 'Câu hỏi thường gặp về Agent Skills CLI: cài đặt, sử dụng, tác tử AI được hỗ trợ, tạo kỹ năng và khắc phục sự cố.',
        es: 'Preguntas frecuentes sobre Agent Skills CLI: instalación, uso, agentes IA compatibles, creación de habilidades y solución de problemas.',
    };

    const alt = buildAlternates('/faq', faqLocales(), locale); // self-canonical only where a translated faq.json exists

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
        },
    };
}

const ICONS = { Zap, Terminal, HelpCircle, Globe, Shield } as const;

// Generate FAQ Schema for SEO
function generateFAQSchema(categories: FaqData['categories']) {
    const allQuestions = categories.flatMap(category =>
        category.questions.map(q => ({
            '@type': 'Question',
            name: q.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: q.answer.replace(/`/g, ''), // Remove markdown for schema
            },
        }))
    );

    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: allQuestions,
    };
}

export default async function FAQPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const faq = getFaq(locale);
    const faqSchema = generateFAQSchema(faq.categories);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
            {/* FAQ Schema for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            <Navbar />

            <main className="relative py-16">
                {/* Hero Section */}
                <div className="relative overflow-hidden border-b border-white/5 pb-12">
                    <div className="absolute inset-0 hero-grid opacity-30" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[128px] rounded-full" />

                    <div className="container mx-auto px-6 max-w-4xl relative z-10">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-6">
                                <HelpCircle className="size-4" />
                                {faq.hero.badge}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                {faq.hero.title}
                            </h1>
                            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                                {faq.hero.subtitle}
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Content */}
                <div className="container mx-auto px-6 max-w-4xl py-12">
                    {faq.categories.map((category, categoryIndex) => (
                        <section key={categoryIndex} className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                    {(() => { const Icon = ICONS[category.icon as keyof typeof ICONS] ?? HelpCircle; return <Icon aria-hidden="true" className="size-5 text-cyan-400" />; })()}
                                </div>
                                <h2 className="text-2xl font-bold">{category.title}</h2>
                            </div>

                            <div className="space-y-4">
                                {category.questions.map((q, faqIndex) => (
                                    <details
                                        key={faqIndex}
                                        className="group bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden"
                                    >
                                        <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors">
                                            <h3 className="font-medium text-left pr-4">{q.question}</h3>
                                            <ChevronDown className="size-5 text-zinc-500 group-open:rotate-180 transition-transform shrink-0" />
                                        </summary>
                                        <div className="px-5 pb-5 text-zinc-400 leading-relaxed">
                                            <p className="whitespace-pre-line">{q.answer}</p>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </section>
                    ))}

                    {/* CTA Section */}
                    <section className="mt-16 p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl text-center">
                        <h3 className="text-2xl font-bold mb-3">{faq.cta.title}</h3>
                        <p className="text-zinc-400 mb-6">
                            {faq.cta.body}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/docs"
                                className="rounded-full font-semibold relative cursor-pointer hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center justify-center gap-2 text-center bg-gradient-to-b from-cyan-400 to-cyan-600 text-black shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-6 py-3"
                            >
                                <Terminal className="size-4" />
                                {faq.cta.docs}
                            </Link>
                            <a
                                href="https://github.com/Karanjot786/agent-skills-cli/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full font-semibold relative cursor-pointer hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center justify-center gap-2 text-center border border-white/20 hover:bg-white/5 text-white px-6 py-3"
                            >
                                {faq.cta.issue}
                            </a>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
