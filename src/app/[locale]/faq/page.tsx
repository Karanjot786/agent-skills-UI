import { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ChevronDown, Terminal, HelpCircle, Zap, Shield, Globe } from 'lucide-react';

export const metadata: Metadata = {
    title: 'FAQ - Frequently Asked Questions | Agent Skills CLI',
    description: 'Common questions about Agent Skills CLI: installation, usage, supported AI agents, skill creation, and troubleshooting.',
    openGraph: {
        title: 'Agent Skills CLI FAQ',
        description: 'Answers to common questions about installing and using AI skills for Cursor, Claude, Copilot, and more.',
    },
};

// FAQ data structure
const faqCategories = [
    {
        title: 'Getting Started',
        icon: Zap,
        questions: [
            {
                question: 'How do I install Agent Skills CLI?',
                answer: 'Install globally using npm: `npm install -g agent-skills-cli`. After installation, you can use the `skills` command from any directory. Verify installation with `skills --version`.',
            },
            {
                question: 'How do I install my first skill?',
                answer: 'Run `npx agent-skills-cli install @author/skill-name` to install any skill from the marketplace. For example: `npx agent-skills-cli install @anthropic/xlsx`. The CLI will auto-detect your installed AI agents and install the skill to all of them.',
            },
            {
                question: 'How do I search for skills?',
                answer: 'Use `skills search <query>` to search the marketplace. For example: `skills search "react components"` or `skills search pdf`. Results show skill name, author, description, and star count.',
            },
            {
                question: 'Where are skills installed?',
                answer: 'Skills are installed to agent-specific directories: `.cursor/skills/` for Cursor, `.claude/skills/` for Claude Code, `.github/skills/` for Copilot, `.codex/skills/` for Codex, and `.agent/workflows/` for Antigravity.',
            },
        ],
    },
    {
        title: 'Supported Agents',
        icon: Terminal,
        questions: [
            {
                question: 'What AI agents are supported?',
                answer: 'Agent Skills CLI supports 29 AI coding agents including: Cursor, Claude Code, GitHub Copilot, OpenAI Codex, Gemini CLI, Windsurf, Cline, Antigravity, OpenCode, Amp, Continue, Trae, Qwen Code, and 16 more.',
            },
            {
                question: 'How do I install to a specific agent?',
                answer: 'Use the `-t` or `--target` flag: `npx agent-skills-cli install @author/skill -t cursor` or `npx agent-skills-cli install @author/skill -t cursor,claude` for multiple agents.',
            },
            {
                question: 'Does the CLI auto-detect my agents?',
                answer: 'Yes! The CLI automatically detects which AI agents are installed in your project by checking for their configuration directories. Run `skills info` to see detected agents.',
            },
            {
                question: 'Can I install to all agents at once?',
                answer: 'Yes, use the `--all` flag: `npx agent-skills-cli install @author/skill --all`. This installs the skill to every supported agent directory.',
            },
        ],
    },
    {
        title: 'Managing Skills',
        icon: HelpCircle,
        questions: [
            {
                question: 'How do I list installed skills?',
                answer: 'Run `skills list` to see all installed skills. Use `skills list --json` for JSON output or `skills list --table` for a formatted table view.',
            },
            {
                question: 'How do I check for skill updates?',
                answer: 'Run `skills check` to see which installed skills have updates available. The command shows the current and available versions for each skill.',
            },
            {
                question: 'How do I update my skills?',
                answer: 'Run `skills update` to update all installed skills, or `skills update skill-name` to update a specific skill.',
            },
            {
                question: 'How do I uninstall a skill?',
                answer: 'Use `skills market-uninstall skill-name` to remove a skill that was installed from the marketplace.',
            },
        ],
    },
    {
        title: 'Creating Skills',
        icon: Globe,
        questions: [
            {
                question: 'How do I create my own skill?',
                answer: 'Run `skills init my-skill-name` to create a new skill from a template. This generates a SKILL.md file with the proper structure. Edit this file to add your instructions and examples.',
            },
            {
                question: 'What format should skills be in?',
                answer: 'Skills are Markdown files (SKILL.md) with YAML frontmatter containing metadata (name, description, author) followed by the skill instructions. See existing skills in the marketplace for examples.',
            },
            {
                question: 'How do I publish my skill?',
                answer: 'Skills are hosted on GitHub. Create a repository with your SKILL.md file, then submit it to the Agent Skills marketplace for inclusion.',
            },
        ],
    },
    {
        title: 'Troubleshooting',
        icon: Shield,
        questions: [
            {
                question: 'The CLI is not finding my skills',
                answer: 'Run `skills doctor` to diagnose issues. This checks your installation, agent detection, and skill directories. Use `skills doctor --fix` to automatically repair common problems.',
            },
            {
                question: 'Installation failed with permission error',
                answer: 'Try installing with sudo: `sudo npm install -g agent-skills-cli`, or use a Node version manager like nvm which doesn\'t require elevated permissions.',
            },
            {
                question: 'Can I disable telemetry?',
                answer: 'Yes, set the environment variable `DISABLE_TELEMETRY=1` or `DO_NOT_TRACK=1`. Telemetry is anonymous and only collects command usage statistics, never personal data.',
            },
        ],
    },
];

// Generate FAQ Schema for SEO
function generateFAQSchema() {
    const allQuestions = faqCategories.flatMap(category =>
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

export default function FAQPage() {
    const faqSchema = generateFAQSchema();

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
                                Frequently Asked Questions
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold mb-4">
                                How can we help?
                            </h1>
                            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                                Find answers to common questions about Agent Skills CLI,
                                from installation to skill creation.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Content */}
                <div className="container mx-auto px-6 max-w-4xl py-12">
                    {faqCategories.map((category, categoryIndex) => (
                        <section key={categoryIndex} className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                    <category.icon className="size-5 text-cyan-400" />
                                </div>
                                <h2 className="text-2xl font-bold">{category.title}</h2>
                            </div>

                            <div className="space-y-4">
                                {category.questions.map((faq, faqIndex) => (
                                    <details
                                        key={faqIndex}
                                        className="group bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden"
                                    >
                                        <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors">
                                            <h3 className="font-medium text-left pr-4">{faq.question}</h3>
                                            <ChevronDown className="size-5 text-zinc-500 group-open:rotate-180 transition-transform shrink-0" />
                                        </summary>
                                        <div className="px-5 pb-5 text-zinc-400 leading-relaxed">
                                            <p className="whitespace-pre-line">{faq.answer}</p>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </section>
                    ))}

                    {/* CTA Section */}
                    <section className="mt-16 p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl text-center">
                        <h3 className="text-2xl font-bold mb-3">Still have questions?</h3>
                        <p className="text-zinc-400 mb-6">
                            Check our documentation or open an issue on GitHub
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/docs"
                                className="rounded-full font-semibold relative cursor-pointer hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center justify-center gap-2 text-center bg-gradient-to-b from-cyan-400 to-cyan-600 text-black shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-6 py-3"
                            >
                                <Terminal className="size-4" />
                                Read the Docs
                            </Link>
                            <a
                                href="https://github.com/Karanjot786/agent-skills-cli/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full font-semibold relative cursor-pointer hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center justify-center gap-2 text-center border border-white/20 hover:bg-white/5 text-white px-6 py-3"
                            >
                                Open an Issue
                            </a>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
