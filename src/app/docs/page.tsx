'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Terminal,
    ChevronRight,
    Search,
    Download,
    Upload,
    Settings,
    Play,
    FileText,
    Info,
    Wrench,
    BookOpen,
    Package,
    Check,
    AlertTriangle,
    ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/code-block";
import { InstallTabs } from "@/components/code-tabs";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CommandSearch } from "@/components/command-search";
import { DocsSidebar } from "@/components/docs-sidebar";

// Command data structure
interface Command {
    name: string;
    alias?: string;
    description: string;
    usage: string[];
    options?: { flag: string; description: string }[];
    example?: { input: string; output?: string };
    status: 'pass' | 'api-issue' | 'interactive';
}

// All CLI commands organized by category
const commandCategories: Record<string, {
    title: string;
    icon: typeof Terminal;
    description: string;
    commands: Command[];
}> = {
    core: {
        title: "Core Commands",
        icon: Terminal,
        description: "Essential commands for managing skills",
        commands: [
            {
                name: "list",
                description: "List all discovered skills from multiple directories.",
                usage: [
                    "skills list",
                    "skills list --json",
                    "skills list --table",
                    "skills list --quiet",
                    "skills list -v"
                ],
                options: [
                    { flag: "-p, --paths <paths...>", description: "Custom search paths" },
                    { flag: "-v, --verbose", description: "Show detailed information" },
                    { flag: "--json", description: "Output as JSON" },
                    { flag: "--table", description: "Output as ASCII table" },
                    { flag: "-q, --quiet", description: "Names only (for scripting)" }
                ],
                status: 'pass' as const
            },
            {
                name: "show",
                alias: undefined,
                description: "Display detailed information about a specific skill.",
                usage: ["skills show <name>"],
                example: {
                    input: "skills show xlsx",
                    output: `xlsx
────────────────────────────────────────
Description: Comprehensive spreadsheet creation...
Path: /Users/.antigravity/skills/xlsx
License: Proprietary`
                },
                status: 'pass' as const
            },
            {
                name: "validate",
                description: "Validate a skill against the Agent Skills specification.",
                usage: ["skills validate <path>"],
                example: {
                    input: "skills validate ~/.antigravity/skills/xlsx",
                    output: `Validating: xlsx
Metadata: ✓ Valid
Body Content: ✓ Valid
────────────────────────────────────────
✓ Skill is valid`
                },
                status: 'pass' as const
            },
            {
                name: "init",
                description: "Create a new skill from template.",
                usage: [
                    "skills init <name>",
                    "skills init my-skill -d /custom/path"
                ],
                options: [
                    { flag: "-d, --directory <dir>", description: "Target directory (default: ./skills)" }
                ],
                status: 'pass' as const
            },
            {
                name: "prompt",
                description: "Generate system prompt XML for discovered skills.",
                usage: [
                    "skills prompt",
                    "skills prompt --output json"
                ],
                status: 'pass' as const
            }
        ]
    },
    marketplace: {
        title: "Marketplace",
        icon: Package,
        description: "Browse, search, and install skills from the marketplace",
        commands: [
            {
                name: "market-list",
                alias: "ml",
                description: "List skills from the marketplace (40k+ skills).",
                usage: [
                    "skills market-list",
                    "skills ml --limit 10",
                    "skills ml --page 2"
                ],
                options: [
                    { flag: "-l, --limit <number>", description: "Number of skills to show" },
                    { flag: "-p, --page <number>", description: "Page number" }
                ],
                status: 'pass' as const
            },
            {
                name: "market-search",
                alias: "ms",
                description: "Search skills in the marketplace.",
                usage: [
                    "skills market-search <query>",
                    "skills ms python --limit 5"
                ],
                options: [
                    { flag: "-l, --limit <number>", description: "Number of results (default: 20)" }
                ],
                status: 'pass' as const
            },
            {
                name: "install",
                alias: "i",
                description: "Install a skill by @author/name with platform targeting.",
                usage: [
                    "skills install <name>",
                    "skills install @anthropic/xlsx",
                    "skills install pdf claude cursor",
                    "skills i pdf -t claude,copilot",
                    "skills i pdf -p cursor,claude",
                    "skills i pdf --all"
                ],
                options: [
                    { flag: "-p, --platform <platforms>", description: "Target platforms (comma-separated)" },
                    { flag: "-t, --target <platforms>", description: "Target platforms (alias for --platform)" },
                    { flag: "--all", description: "Install to all platforms" }
                ],
                status: 'pass' as const
            },
            {
                name: "install-url",
                alias: "iu",
                description: "Install a skill from GitHub URL.",
                usage: [
                    "skills install-url <github-url>",
                    "skills iu https://github.com/user/skill-repo"
                ],
                status: 'pass' as const
            },
            {
                name: "market-installed",
                alias: "mind",
                description: "List skills installed from marketplaces.",
                usage: ["skills market-installed"],
                example: {
                    input: "skills market-installed",
                    output: `Installed marketplace skills:
  pdf
    Path: ~/.antigravity/skills/pdf
    Source: Anthropic Official Skills`
                },
                status: 'pass' as const
            },
            {
                name: "market-uninstall",
                alias: "mu",
                description: "Uninstall a marketplace-installed skill.",
                usage: ["skills market-uninstall <name>"],
                status: 'pass' as const
            },
            {
                name: "market-sources",
                description: "List registered marketplace sources.",
                usage: ["skills market-sources"],
                example: {
                    input: "skills market-sources",
                    output: `🌐 Primary Marketplace:
  Skills Database ✓
    Skills: 50,000+`
                },
                status: 'pass' as const
            },
            {
                name: "market-add-source",
                description: "Add a custom marketplace source.",
                usage: ["skills market-add-source --name <name> --owner <owner> --repo <repo>"],
                options: [
                    { flag: "--name <name>", description: "Source display name" },
                    { flag: "--owner <owner>", description: "GitHub owner" },
                    { flag: "--repo <repo>", description: "GitHub repository" }
                ],
                status: 'pass' as const
            },
            {
                name: "market-update-check",
                alias: "muc",
                description: "Check for updates to installed skills.",
                usage: ["skills market-update-check"],
                status: 'pass' as const
            }
        ]
    },
    export: {
        title: "Export",
        icon: Upload,
        description: "Export skills to different AI agent formats",
        commands: [
            {
                name: "export",
                description: "Export skills to different AI agent formats.",
                usage: [
                    "skills export",
                    "skills export -t cursor",
                    "skills export -t copilot -d /project",
                    "skills export -n xlsx"
                ],
                options: [
                    { flag: "-t, --target <agent>", description: "copilot, cursor, claude, codex, antigravity, all" },
                    { flag: "-d, --directory <dir>", description: "Project directory (default: .)" },
                    { flag: "-n, --name <name>", description: "Export specific skill only" }
                ],
                status: 'pass' as const
            },
            {
                name: "sync",
                description: "Sync skills to .agent/workflows/ for auto-discovery.",
                usage: ["skills sync"],
                status: 'pass' as const
            },
            {
                name: "setup",
                description: "Interactive setup wizard - install skills and export to agents.",
                usage: ["skills setup"],
                status: 'interactive' as const
            },
            {
                name: "export-interactive",
                alias: "ei",
                description: "Interactive export wizard with platform selection.",
                usage: ["skills export-interactive"],
                status: 'interactive' as const
            }
        ]
    },
    utilities: {
        title: "Utilities",
        icon: Wrench,
        description: "Helpful utility commands",
        commands: [
            {
                name: "run",
                description: "Execute a script from an installed skill.",
                usage: [
                    "skills run <skill> <script>",
                    "skills run pdf extract_form.py",
                    "skills run pdf check.py -a input.pdf"
                ],
                options: [
                    { flag: "-a, --args <args...>", description: "Arguments to pass to the script" },
                    { flag: "--timeout <ms>", description: "Timeout in milliseconds (default: 30000)" }
                ],
                status: 'pass' as const
            },
            {
                name: "scripts",
                description: "List available scripts in an installed skill.",
                usage: ["skills scripts <skill-name>"],
                example: {
                    input: "skills scripts pdf",
                    output: `📜 Scripts in pdf:
  ✓ fill_pdf_form.py
  ✓ extract_form_field_info.py
  ✓ convert_pdf_to_images.py`
                },
                status: 'pass' as const
            },
            {
                name: "context",
                description: "Generate system prompt context for AI agents.",
                usage: [
                    "skills context",
                    "skills context --format json",
                    "skills context --format markdown"
                ],
                status: 'pass' as const
            },
            {
                name: "preview",
                description: "Open skill detail page in browser.",
                usage: [
                    "skills preview <skill-name>",
                    "skills preview xlsx --url-only"
                ],
                status: 'pass' as const
            },
            {
                name: "assets",
                description: "List and fetch assets for a skill from GitHub.",
                usage: [
                    "skills assets <skill-name>",
                    "skills assets pdf --manifest",
                    "skills assets pdf --get <path>"
                ],
                options: [
                    { flag: "-l, --list", description: "List available assets" },
                    { flag: "-m, --manifest", description: "Show asset manifest" },
                    { flag: "-g, --get <path>", description: "Fetch specific asset content" }
                ],
                status: 'pass' as const
            },
            {
                name: "info",
                description: "Show skills installation status and paths.",
                usage: ["skills info"],
                example: {
                    input: "skills info",
                    output: `📦 Skills CLI Info
📁 Paths:
  ✓ Global: ~/.antigravity/skills
  ✓ Config: ~/.antigravity/marketplace.json
📊 Stats:
  Installed skills: 16`
                },
                status: 'pass' as const
            },
            {
                name: "update",
                description: "Update installed skills to latest versions.",
                usage: [
                    "skills update",
                    "skills update <skill-name>",
                    "skills update --check"
                ],
                status: 'pass' as const
            },
            {
                name: "doctor",
                description: "Diagnose and fix common installation issues.",
                usage: [
                    "skills doctor",
                    "skills doctor --fix"
                ],
                example: {
                    input: "skills doctor",
                    output: `🩺 Skills Doctor
  ✓ Skills directory exists
  ✓ Node.js version: v20+
  ✓ Git installed
  ✓ All 16 skills valid
✓ All checks passed!`
                },
                status: 'pass' as const
            },
            {
                name: "completion",
                description: "Generate shell completion script.",
                usage: [
                    "skills completion bash",
                    "skills completion zsh",
                    "skills completion fish"
                ],
                status: 'pass' as const
            }
        ]
    }
};

// Platform support data
const platforms = [
    { name: "Cursor", directory: ".cursor/skills/", status: true },
    { name: "Claude Code", directory: ".claude/skills/", status: true },
    { name: "GitHub Copilot", directory: ".github/skills/", status: true },
    { name: "OpenAI Codex", directory: ".codex/skills/", status: true },
    { name: "Antigravity", directory: ".agent/workflows/", status: true }
];

// Status badge component
function StatusBadge({ status }: { status: 'pass' | 'api-issue' | 'interactive' }) {
    if (status === 'pass') {
        return (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <Check className="size-3 mr-1" /> Tested
            </Badge>
        );
    }
    if (status === 'interactive') {
        return (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <Terminal className="size-3 mr-1" /> Interactive
            </Badge>
        );
    }
    return (
        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <AlertTriangle className="size-3 mr-1" /> API Issue
        </Badge>
    );
}

// Command card component
function CommandCard({ command }: { command: Command }) {
    return (
        <div id={command.name} className="scroll-mt-24 group">
            <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6 hover:border-cyan-500/30 transition-all duration-300">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-mono font-bold text-cyan-400">
                                {command.name}
                            </h3>
                            {command.alias && (
                                <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                                    alias: {command.alias}
                                </Badge>
                            )}
                        </div>
                        <p className="text-zinc-400">{command.description}</p>
                    </div>
                    <StatusBadge status={command.status} />
                </div>

                {/* Usage */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Usage</h4>
                    <div className="space-y-2">
                        {command.usage.map((usage, idx) => (
                            <CodeBlock key={idx} code={`$ ${usage}`} />
                        ))}
                    </div>
                </div>

                {/* Options */}
                {command.options && command.options.length > 0 && (
                    <div className="mt-6 space-y-3">
                        <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Options</h4>
                        <div className="bg-black/30 rounded-lg border border-white/5 divide-y divide-white/5">
                            {command.options.map((opt, idx) => (
                                <div key={idx} className="flex gap-4 p-3">
                                    <code className="text-cyan-400 font-mono text-sm whitespace-nowrap">{opt.flag}</code>
                                    <span className="text-zinc-400 text-sm">{opt.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Example */}
                {command.example && (
                    <div className="mt-6 space-y-3">
                        <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Example</h4>
                        <CodeBlock code={`$ ${command.example.input}${command.example.output ? `\n\n${command.example.output}` : ''}`} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function DocsPage() {
    const [searchOpen, setSearchOpen] = useState(false);

    const totalCommands = Object.values(commandCategories).reduce(
        (acc, cat) => acc + cat.commands.length, 0
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 flex flex-col">
            <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
            <Navbar />
            <div className="container mx-auto px-4 sm:px-6 py-8 lg:py-12">
                <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                    <DocsSidebar onSearchOpen={() => setSearchOpen(true)} />

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* Hero Section */}
                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                    v1.0.2
                                </Badge>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                    {totalCommands} Commands
                                </Badge>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                                CLI Documentation
                            </h1>
                            <p className="text-lg text-zinc-400 max-w-2xl">
                                Complete reference for the Agent Skills CLI. Install, manage, and sync AI skills
                                across Cursor, Claude Code, GitHub Copilot, and more.
                            </p>
                        </div>

                        {/* Installation */}
                        <section id="installation" className="mb-16 scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Download className="size-6 text-cyan-400" />
                                Installation
                            </h2>
                            <InstallTabs />
                            <p className="mt-4 text-zinc-400">
                                Requires Node.js 18 or higher. After installation, the <code className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">skills</code> command will be available globally.
                            </p>
                        </section>

                        {/* Quick Start */}
                        <section id="quickstart" className="mb-16 scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Play className="size-6 text-cyan-400" />
                                Quick Start
                            </h2>
                            <div className="space-y-6">
                                {[
                                    { step: 1, title: "Search for a skill", code: "skills market-search react" },
                                    { step: 2, title: "Install it", code: "skills install react-best-practices" },
                                    { step: 3, title: "Export to your project", code: "skills export" }
                                ].map((item) => (
                                    <div key={item.step} className="flex gap-4">
                                        <div className="size-10 shrink-0 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                                            {item.step}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                                            <CodeBlock code={`$ ${item.code}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Platform Support */}
                        <section id="platforms" className="mb-16 scroll-mt-24">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Settings className="size-6 text-cyan-400" />
                                Platform Support
                            </h2>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {platforms.map((platform) => (
                                    <div
                                        key={platform.name}
                                        className="flex items-center justify-between p-4 bg-zinc-900/50 border border-white/10 rounded-xl"
                                    >
                                        <div>
                                            <div className="font-semibold text-white">{platform.name}</div>
                                            <code className="text-xs text-zinc-500">{platform.directory}</code>
                                        </div>
                                        <Check className="size-5 text-emerald-400" />
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="border-t border-white/10 my-12" />

                        {/* Command Reference */}
                        {Object.entries(commandCategories).map(([key, category]) => (
                            <section key={key} id={key} className="mb-16 scroll-mt-24">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="size-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                        <category.icon className="size-5 text-cyan-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{category.title}</h2>
                                        <p className="text-sm text-zinc-400">{category.description}</p>
                                    </div>
                                    <Badge variant="outline" className="ml-auto text-zinc-500">
                                        {category.commands.length} commands
                                    </Badge>
                                </div>
                                <div className="space-y-6">
                                    {category.commands.map((cmd) => (
                                        <CommandCard key={cmd.name} command={cmd} />
                                    ))}
                                </div>
                            </section>
                        ))}

                        {/* Footer CTA */}
                        <section className="mt-16 p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl text-center">
                            <h3 className="text-2xl font-bold mb-3">Ready to get started?</h3>
                            <p className="text-zinc-400 mb-6">Browse 50,000+ skills in our marketplace</p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button asChild className="bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                                    <Link href="/marketplace">
                                        <Search className="size-4 mr-2" />
                                        Browse Marketplace
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild className="border-white/20 hover:bg-white/5">
                                    <a href="https://github.com/Karanjot786/agent-skills-cli" target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="size-4 mr-2" />
                                        View on GitHub
                                    </a>
                                </Button>
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            <Footer />
        </div>
    );
}
