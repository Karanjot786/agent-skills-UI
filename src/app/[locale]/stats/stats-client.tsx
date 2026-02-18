'use client';

import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { BarChart3, Users, Package, Star, TrendingUp, Globe, Terminal, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import CountUp from 'react-countup';

// Stats data structure
const staticStats = {
    supportedAgents: 42,
    cliVersion: '1.0.8',
    platforms: ['Cursor', 'Claude Code', 'GitHub Copilot', 'OpenAI Codex', 'Gemini CLI', 'Windsurf', 'Cline', 'Antigravity', 'OpenCode', 'Amp'],
    features: 25,
};

export default function StatsClient() {
    const [stats, setStats] = useState({
        totalSkills: 100000,
        totalAuthors: 5000,
        totalCategories: 50,
        recentSkills: 1000,
    });

    useEffect(() => {
        fetch('/api/stats')
            .then(res => res.json())
            .then(data => {
                if (data.totalSkills) {
                    setStats({
                        totalSkills: data.totalSkills,
                        totalAuthors: data.uniqueAuthors || 5000,
                        totalCategories: data.totalCategories || 50,
                        recentSkills: data.recentSkills || 1000,
                    });
                }
            })
            .catch(console.error);
    }, []);

    // Generate structured data for AI citations
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": "Agent Skills CLI Statistics",
        "description": `Statistics for Agent Skills CLI: ${stats.totalSkills.toLocaleString()}+ skills, ${staticStats.supportedAgents} AI agents supported`,
        "creator": {
            "@type": "Organization",
            "name": "Agent Skills",
            "url": "https://agentskills.in"
        },
        "dateModified": new Date().toISOString().split('T')[0],
        "keywords": ["AI skills", "AI agents", "Cursor", "Claude", "Copilot", "skill manager"],
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
            {/* Structured Data for AI Citations */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <Navbar />

            <main className="relative py-16">
                {/* Hero Section */}
                <div className="relative overflow-hidden border-b border-white/5 pb-12">
                    <div className="absolute inset-0 hero-grid opacity-30" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[128px] rounded-full" />

                    <div className="container mx-auto px-6 max-w-5xl relative z-10">
                        <div className="text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-6">
                                <BarChart3 className="size-4" />
                                Live Statistics
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                Agent Skills by the Numbers
                            </h1>
                            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                                Real-time statistics from the Agent Skills CLI ecosystem
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <section className="border-b border-white/5 bg-zinc-900/30 py-10">
                    <div className="container mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center group cursor-default">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Package className="size-5 text-cyan-400" />
                                    <span className="text-3xl font-bold text-cyan-400">
                                        <CountUp end={stats.totalSkills} duration={2.5} separator="," />+
                                    </span>
                                </div>
                                <div className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">Skills Available</div>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-center group cursor-default">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Users className="size-5 text-purple-400" />
                                    <span className="text-3xl font-bold text-white">
                                        <CountUp end={stats.totalAuthors} duration={2.5} separator="," />+
                                    </span>
                                </div>
                                <div className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">Contributors</div>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="text-center group cursor-default">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Terminal className="size-5 text-green-400" />
                                    <span className="text-3xl font-bold text-white">42+</span>
                                </div>
                                <div className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">Agent Platforms</div>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="text-center group cursor-default">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Sparkles className="size-5 text-yellow-400" />
                                    <span className="text-3xl font-bold text-white">100%</span>
                                </div>
                                <div className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">Open Source</div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Detailed Stats */}
                <div className="container mx-auto px-6 max-w-5xl py-12">
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Globe className="size-6 text-cyan-400" />
                            Supported AI Agents
                        </h2>
                        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6">
                            <p className="text-zinc-400 mb-4">
                                Agent Skills CLI works with <strong className="text-white">{staticStats.supportedAgents} AI coding agents</strong>, including:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {staticStats.platforms.map((platform) => (
                                    <span key={platform} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-sm text-cyan-400">
                                        {platform}
                                    </span>
                                ))}
                                <span className="px-3 py-1 bg-zinc-800 border border-white/10 rounded-full text-sm text-zinc-400">
                                    +32 more
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <TrendingUp className="size-6 text-cyan-400" />
                            Recent Activity
                        </h2>
                        <div className="grid md:grid-cols-2 gap-6">
                            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-zinc-900/50 border border-white/10 rounded-xl p-6">
                                <h3 className="font-semibold mb-2">Skills Added (Last 30 Days)</h3>
                                <p className="text-3xl font-bold text-cyan-400">
                                    <CountUp end={stats.recentSkills} duration={2} separator="," />
                                </p>
                                <p className="text-sm text-zinc-500 mt-1">New skills this month</p>
                            </motion.div>
                            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-zinc-900/50 border border-white/10 rounded-xl p-6">
                                <h3 className="font-semibold mb-2">CLI Version</h3>
                                <p className="text-3xl font-bold text-cyan-400">v{staticStats.cliVersion}</p>
                                <p className="text-sm text-zinc-500 mt-1">Latest stable release</p>
                            </motion.div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold mb-6">Quick Facts</h2>
                        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6">
                            <ul className="space-y-3 text-zinc-300">
                                <li className="flex items-start gap-3">
                                    <span className="text-cyan-400 mt-1">•</span>
                                    <span>Agent Skills CLI has <strong className="text-white">{stats.totalSkills.toLocaleString()}+ skills</strong> available for installation</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-cyan-400 mt-1">•</span>
                                    <span>Supports <strong className="text-white">{staticStats.supportedAgents} different AI coding agents</strong> including Cursor, Claude, and Copilot</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-cyan-400 mt-1">•</span>
                                    <span>Skills are contributed by <strong className="text-white">{stats.totalAuthors.toLocaleString()}+ authors</strong> from the community</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-cyan-400 mt-1">•</span>
                                    <span>Install any skill with one command: <code className="bg-zinc-800 px-2 py-0.5 rounded text-cyan-400">npx agent-skills-cli install @author/skill</code></span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-cyan-400 mt-1">•</span>
                                    <span>Open source and free to use under MIT license</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section className="p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl text-center">
                        <h3 className="text-2xl font-bold mb-3">Start Using Agent Skills</h3>
                        <p className="text-zinc-400 mb-6">
                            Install the CLI and browse {stats.totalSkills.toLocaleString()}+ skills
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/marketplace" className="rounded-full font-semibold relative cursor-pointer hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center justify-center gap-2 text-center bg-gradient-to-b from-cyan-400 to-cyan-600 text-black shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-6 py-3">
                                <Package className="size-4" />
                                Browse Skills
                            </Link>
                            <Link href="/docs" className="rounded-full font-semibold relative cursor-pointer hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center justify-center gap-2 text-center border border-white/20 hover:bg-white/5 text-white px-6 py-3">
                                Get Started
                            </Link>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
