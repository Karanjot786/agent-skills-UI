'use client';

import { motion } from "framer-motion";
import { ArrowRight, Terminal, Globe, Zap, Box, Code2, Search, Download, Share2, Star, TrendingUp, Users, Package, ChevronRight, Sparkles, Crown, Clock } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState, useRef } from "react";
import CountUp from 'react-countup';
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

interface Skill {
  id: string;
  name: string;
  description: string;
  author: string;
  stars: number;
  authorAvatar?: string;
  scopedName?: string;
}

interface Stats {
  totalSkills: number;
  uniqueAuthors: number;
}

interface Author {
  name: string;
  skillCount: number;
  avatar?: string;
}

const categories = [
  { name: 'Development', icon: Code2, color: 'from-blue-500 to-cyan-500', slug: 'development', count: '15K+' },
  { name: 'Testing', icon: Box, color: 'from-green-500 to-emerald-500', slug: 'testing', count: '8K+' },
  { name: 'DevOps', icon: Globe, color: 'from-orange-500 to-amber-500', slug: 'devops', count: '5K+' },
  { name: 'AI & ML', icon: Sparkles, color: 'from-purple-500 to-pink-500', slug: 'ai', count: '10K+' },
  { name: 'Security', icon: Zap, color: 'from-red-500 to-rose-500', slug: 'security', count: '3K+' },
  { name: 'All Skills', icon: Package, color: 'from-zinc-500 to-zinc-400', slug: '', count: '55K+' },
];

export default function Home() {
  const [stats, setStats] = useState<Stats>({ totalSkills: 0, uniqueAuthors: 0 });
  const [trending, setTrending] = useState<Skill[]>([]);
  const [recent, setRecent] = useState<Skill[]>([]);
  const [topAuthors, setTopAuthors] = useState<Author[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setStats(data.stats);
        if (data.trending) setTrending(data.trending);
        if (data.recent) setRecent(data.recent);
        if (data.topAuthors) setTopAuthors(data.topAuthors);
      })
      .catch(console.error);
  }, []);

  const copyInstall = () => {
    navigator.clipboard.writeText('npm install -g agent-skills-cli');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">

      <Navbar showGetStarted />

      <main>
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 overflow-hidden">
          {/* Animated grid background */}
          <div className="absolute inset-0 hero-grid" />

          {/* Floating gradient orbs */}
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/30 blur-[128px] rounded-full float-orb" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-blue-500/20 blur-[128px] rounded-full float-orb-delayed" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-gradient-to-t from-cyan-500/10 to-transparent blur-3xl" />

          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center gap-2 mb-6"
              >
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-400 px-4 py-1.5 text-sm backdrop-blur-sm glow-pulse">
                  <TrendingUp className="size-3 mr-1.5" />
                  <CountUp end={stats.totalSkills} duration={2} separator="," />+ Skills Available
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]"
              >
                <span className="bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">The Package Manager</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">for AI Agent Skills</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-zinc-400 mb-10 max-w-2xl leading-relaxed"
              >
                Install, share, and discover skills for Claude, Cursor, Copilot, and more.
                Like npm, but for AI coding assistants.
              </motion.p>

              {/* Install Command */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                id="install"
                className="w-full max-w-xl mb-8"
              >
                <div
                  onClick={copyInstall}
                  className="flex items-center gap-3 bg-zinc-900/80 border border-white/10 rounded-xl px-5 py-4 cursor-pointer group hover:border-cyan-500/50 hover:bg-zinc-900 transition-all"
                >
                  <span className="text-cyan-500 font-mono">$</span>
                  <code className="flex-1 text-zinc-300 font-mono">npm install -g agent-skills-cli</code>
                  <span className={`text-xs px-2 py-1 rounded ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-zinc-500 group-hover:text-cyan-400'} transition-colors`}>
                    {copied ? 'Copied!' : 'Click to copy'}
                  </span>
                </div>
              </motion.div>

              {/* Quick actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-4"
              >
                <Button size="lg" className="bg-white text-black hover:bg-zinc-200 font-bold gap-2" asChild>
                  <Link href="/marketplace">
                    <Search className="size-4" />
                    Browse Skills
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/5 gap-2" asChild>
                  <Link href="/docs">
                    Read Docs
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-white/5 bg-zinc-900/30 py-10">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center group cursor-default"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Package className="size-5 text-cyan-400" />
                  <span className="text-3xl font-bold text-cyan-400">
                    <CountUp end={stats.totalSkills} duration={2.5} separator="," />+
                  </span>
                </div>
                <div className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">Skills Available</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-center group cursor-default"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="size-5 text-purple-400" />
                  <span className="text-3xl font-bold text-white">
                    <CountUp end={stats.uniqueAuthors} duration={2.5} separator="," />+
                  </span>
                </div>
                <div className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">Contributors</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-center group cursor-default"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Terminal className="size-5 text-green-400" />
                  <span className="text-3xl font-bold text-white">4</span>
                </div>
                <div className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">Agent Platforms</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-center group cursor-default"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="size-5 text-yellow-400" />
                  <span className="text-3xl font-bold text-white">100%</span>
                </div>
                <div className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors">Open Source</div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold mb-2">Browse by Category</h2>
                <p className="text-zinc-400">Find skills organized by use case</p>
              </div>
              <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300" asChild>
                <Link href="/marketplace">
                  View All <ChevronRight className="size-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={cat.slug ? `/marketplace?category=${cat.slug}` : '/marketplace'}
                    className="block p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 hover:bg-zinc-900 transition-all group"
                  >
                    <div className={`size-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <cat.icon className="size-6 text-white" />
                    </div>
                    <div className="font-semibold mb-1">{cat.name}</div>
                    <div className="text-sm text-zinc-500">{cat.count} skills</div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Skills */}
        <section className="py-20 bg-zinc-900/30">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                  <TrendingUp className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Trending Skills</h2>
                  <p className="text-zinc-400 text-sm">Most popular this week</p>
                </div>
              </div>
              <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300" asChild>
                <Link href="/marketplace?sortBy=stars">
                  See More <ChevronRight className="size-4 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trending.map((skill, i) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="relative"
                >
                  {/* Rank Badge for top 3 */}
                  {i < 3 && (
                    <div className={`absolute -top-2 -left-2 z-10 size-8 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black rank-gold' :
                      i === 1 ? 'bg-gradient-to-br from-zinc-300 to-zinc-400 text-black' :
                        'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                      }`}>
                      {i === 0 ? <Crown className="size-4" /> : `#${i + 1}`}
                    </div>
                  )}
                  <Link
                    href={`/marketplace/${skill.scopedName || skill.name}`}
                    className={`block p-5 rounded-xl bg-black border transition-all group shimmer ${i === 0 ? 'border-yellow-500/30 hover:border-yellow-400/50' :
                      'border-white/5 hover:border-cyan-500/30'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="font-semibold text-cyan-100 group-hover:text-cyan-400 transition-colors">{skill.name}</div>
                      <div className="flex items-center gap-1 text-yellow-400 text-sm group-hover:scale-110 transition-transform">
                        <Star className="size-3.5 fill-yellow-400" />
                        {skill.stars?.toLocaleString()}
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                      {skill.description || 'A useful skill for AI development.'}
                    </p>
                    <div className="flex items-center gap-2">
                      <img
                        src={skill.authorAvatar || `https://github.com/${skill.author}.png`}
                        alt={skill.author}
                        className="size-5 rounded-full"
                      />
                      <span className="text-xs text-zinc-500">{skill.author}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Authors */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                  <Users className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Top Contributors</h2>
                  <p className="text-zinc-400 text-sm">Most active skill creators</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {topAuthors.map((author, i) => (
                <motion.div
                  key={author.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={`/marketplace?author=${author.name}`}
                    className="flex flex-col items-center p-4 rounded-xl bg-zinc-900/50 border border-white/5 hover:border-purple-500/30 hover:bg-zinc-900 transition-all group"
                  >
                    {/* Gradient ring around avatar */}
                    <div className="avatar-ring p-[2px] rounded-full mb-3 group-hover:scale-110 transition-transform">
                      <img
                        src={author.avatar || `https://github.com/${author.name}.png`}
                        alt={author.name}
                        className="size-12 rounded-full bg-black"
                      />
                    </div>
                    <div className="text-sm font-medium truncate w-full text-center group-hover:text-purple-300 transition-colors">{author.name}</div>
                    <div className="text-xs text-zinc-500 flex items-center gap-1">
                      <Package className="size-3" />
                      {author.skillCount} skills
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Recently Added */}
        {recent.length > 0 && (
          <section className="py-20 bg-zinc-900/30">
            <div className="container mx-auto px-6">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                    <Sparkles className="size-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Recently Added</h2>
                    <p className="text-zinc-400 text-sm">Latest skills from the community</p>
                  </div>
                </div>
                <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300" asChild>
                  <Link href="/marketplace?sortBy=recent">
                    See More <ChevronRight className="size-4 ml-1" />
                  </Link>
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recent.map((skill, i) => (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={`/marketplace/${skill.scopedName || skill.name}`}
                      className="block p-5 rounded-xl bg-black border border-white/5 hover:border-green-500/30 transition-all group relative overflow-hidden"
                    >
                      {/* Animated NEW badge */}
                      <div className="absolute -top-1 -right-1">
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs badge-new shadow-lg shadow-green-500/25">
                          ✨ NEW
                        </Badge>
                      </div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="font-semibold text-zinc-100 group-hover:text-green-400 transition-colors">{skill.name}</div>
                      </div>
                      <p className="text-sm text-zinc-400 line-clamp-2 mb-4">
                        {skill.description || 'A useful skill for AI development.'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img
                            src={skill.authorAvatar || `https://github.com/${skill.author}.png`}
                            alt={skill.author}
                            className="size-5 rounded-full"
                          />
                          <span className="text-xs text-zinc-500">{skill.author}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Clock className="size-3" />
                          <span>Just added</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          {/* Animated grid background */}
          <div className="absolute inset-0 hero-grid opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />

          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {/* Social proof */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="size-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 border-2 border-black" />
                  ))}
                </div>
                <span className="text-sm text-zinc-400 ml-2">Join <span className="text-white font-semibold">{stats.uniqueAuthors.toLocaleString()}+</span> developers</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to supercharge your{' '}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">AI workflow</span>?
              </h2>
              <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
                Install skills in seconds. Share your own. Join the fastest-growing AI skills ecosystem.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold gap-2 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow" asChild>
                  <Link href="/marketplace">
                    <Package className="size-5" />
                    Explore Skills
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 gap-2" asChild>
                  <a href="https://github.com/Karanjot786/agent-skills-cli" target="_blank">
                    <Star className="size-4" />
                    Star on GitHub
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </main>
    </div >
  );
}
