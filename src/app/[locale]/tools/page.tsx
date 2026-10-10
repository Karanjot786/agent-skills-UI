import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { listTools } from '@/lib/items';
import { buildAlternates } from '@/lib/seo';

// No own dynamic segment: the layout's locale params would prerender this at build, where D1 is unavailable.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Tools: MCP servers, skills and subagents by service | Agent Skills',
    description: 'Find the MCP server, Claude Code skills, subagents and plugins for GitHub, Stripe, Supabase, Postgres, Figma and more.',
    alternates: buildAlternates('/tools', ['en'], 'en'),
};

export default async function ToolsIndex({ params }: { params: Promise<{ locale: string }> }) {
    if ((await params).locale !== 'en') permanentRedirect('/tools');
    const tools = await listTools();
    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <main className="container mx-auto px-6 py-12 max-w-6xl">
                <h1 className="text-3xl md:text-4xl font-bold text-cyan-50 mb-3">Tools</h1>
                <p className="text-zinc-400 max-w-3xl mb-8">Everything for one service in one place: its MCP server, agent skills, subagents and plugins.</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {tools.map((t) => <Link key={t.id} href={`/tools/${t.id}`} className="p-4 rounded-xl bg-zinc-900/30 border border-white/5 hover:border-cyan-500/30">{t.name}</Link>)}
                </div>
            </main>
            <Footer />
        </div>
    );
}
