'use client';

import { useState, useEffect } from 'react';
import { Pause, Play } from 'lucide-react';

interface OutputLine {
    text: string;
    className?: string;
}

interface TerminalScene {
    command: string;
    description: string;
    stages: OutputLine[][];  // Multiple stages for one command
}

export function TerminalAnimation() {
    const [currentScene, setCurrentScene] = useState(0);
    const [typedCommand, setTypedCommand] = useState('');
    const [currentStage, setCurrentStage] = useState(0);
    const [visibleLines, setVisibleLines] = useState(0);
    const [phase, setPhase] = useState<'typing' | 'output' | 'stage-done' | 'done'>('typing');
    const [isPaused, setIsPaused] = useState(false);

    const scenes: TerminalScene[] = [
        {
            command: 'skills',
            description: 'Interactive skill browser with multi-select.',
            stages: [
                // Stage 1: Agent Selection
                [
                    { text: '' },
                    { text: '┌   Agent Skills CLI', className: 'text-cyan-400' },
                    { text: '│', className: 'text-zinc-600' },
                    { text: '◆  Select AI agents to install skills for:', className: 'text-zinc-300' },
                    { text: '│  ◼ Cursor (.cursor/skills)', className: 'text-zinc-400' },
                    { text: '│  ◼ Claude Code (.claude/skills)', className: 'text-zinc-400' },
                    { text: '│  ◼ GitHub Copilot (.github/skills)', className: 'text-zinc-400' },
                    { text: '│  ◻ Codex', className: 'text-zinc-600' },
                    { text: '│  ◼ Antigravity (.agent/skills)', className: 'text-zinc-400' },
                    { text: '│  ◻ OpenCode', className: 'text-zinc-600' },
                    { text: '│  ◻ Amp', className: 'text-zinc-600' },
                    { text: '│  ◻ Kilo Code', className: 'text-zinc-600' },
                    { text: '│  ◻ Roo Code', className: 'text-zinc-600' },
                    { text: '│  ◻ Goose', className: 'text-zinc-600' },
                ],
                // Stage 2: Skill Selection
                [
                    { text: '' },
                    { text: '┌   Agent Skills CLI', className: 'text-cyan-400' },
                    { text: '│', className: 'text-zinc-600' },
                    { text: '◇  Select AI agents to install skills for:', className: 'text-zinc-300' },
                    { text: '│  Cursor, Claude Code, GitHub Copilot, Antigravity', className: 'text-zinc-500' },
                    { text: '✔ Found 51,718 skills (showing top 100 by stars)', className: 'text-green-400' },
                    { text: '? Select skills to install (Space to select, Enter to confirm):', className: 'text-zinc-300' },
                    { text: '❯◉ frontend-code-review (⭐124,995) - Trigger when the user requests a review...', className: 'text-cyan-400' },
                    { text: ' ◉ skill-creator (⭐124,995) - Guide for creating effective skills...', className: 'text-cyan-400' },
                    { text: ' ◉ component-refactoring (⭐124,995) - Refactor high-complexity React...', className: 'text-cyan-400' },
                    { text: ' ◉ frontend-testing (⭐124,995) - Generate Vitest + React Testing Library...', className: 'text-cyan-400' },
                    { text: ' ◯ electron-chromium-upgrade (⭐119,652) - Guide for performing Chromium...', className: 'text-zinc-500' },
                    { text: '' },
                    { text: '↑↓ navigate • space select • a all • i invert • ⏎ submit', className: 'text-zinc-600' },
                ],
                // Stage 3: Installation
                [
                    { text: '' },
                    { text: '┌   Agent Skills CLI', className: 'text-cyan-400' },
                    { text: '│', className: 'text-zinc-600' },
                    { text: '◇  Select AI agents to install skills for:', className: 'text-zinc-300' },
                    { text: '│  Cursor, Claude Code, GitHub Copilot, Antigravity', className: 'text-zinc-500' },
                    { text: '✔ Found 51,718 skills (showing top 100 by stars)', className: 'text-green-400' },
                    { text: '✔ Select skills to install: frontend-code-review, skill-creator, component-refactoring, frontend-testing', className: 'text-green-400' },
                    { text: '' },
                    { text: '📦 Installing 4 skill(s) in parallel...', className: 'text-zinc-300' },
                    { text: '' },
                    { text: '✔ Downloaded 4/4 skills', className: 'text-green-400' },
                    { text: '' },
                    { text: '✔ frontend-code-review', className: 'text-green-400' },
                    { text: '  @langgenius/frontend-code-review', className: 'text-zinc-500' },
                    { text: '✔ skill-creator', className: 'text-green-400' },
                    { text: '  @langgenius/skill-creator', className: 'text-zinc-500' },
                    { text: '✔ component-refactoring', className: 'text-green-400' },
                    { text: '  @langgenius/component-refactoring', className: 'text-zinc-500' },
                    { text: '✔ frontend-testing', className: 'text-green-400' },
                    { text: '  @langgenius/frontend-testing', className: 'text-zinc-500' },
                    { text: '' },
                    { text: '✨ Successfully installed 4 skill(s) to: cursor, antigravity, claude, copilot', className: 'text-green-400' },
                ],
            ],
        },
        {
            command: 'npx agent-skills-cli install @langgenius/frontend-code-review -t claude',
            description: 'Install skills from the marketplace.',
            stages: [
                [
                    { text: '' },
                    { text: '📦 Searching for "@langgenius/frontend-code-review"...', className: 'text-zinc-300' },
                    { text: '' },
                    { text: 'Found: frontend-code-review by langgenius', className: 'text-zinc-300' },
                    { text: 'Stars: 124,995', className: 'text-zinc-500' },
                    { text: 'URL: https://github.com/langgenius/dify/tree/main/.claude/skills/frontend-code-review', className: 'text-zinc-500' },
                    { text: '' },
                    { text: 'Installing to: claude', className: 'text-zinc-500' },
                    { text: '' },
                    { text: '✔ Downloaded frontend-code-review', className: 'text-green-400' },
                    { text: '✔ Installed to .claude/skills/frontend-code-review', className: 'text-green-400' },
                    { text: '' },
                    { text: '✨ Successfully installed: frontend-code-review', className: 'text-green-400' },
                    { text: '   Scoped name: @langgenius/frontend-code-review', className: 'text-zinc-500' },
                    { text: '   Platforms: claude', className: 'text-zinc-500' },
                ],
            ],
        },
        {
            command: 'skills add vercel-labs/agent-skills --list',
            description: 'List skills in a GitHub repository.',
            stages: [
                [
                    { text: '' },
                    { text: '📦 add-skill', className: 'text-zinc-300' },
                    { text: '' },
                    { text: 'Source: https://github.com/vercel-labs/agent-skills.git', className: 'text-zinc-500' },
                    { text: '✔ Repository cloned', className: 'text-green-400' },
                    { text: '✔ Found 2 skills', className: 'text-green-400' },
                    { text: '' },
                    { text: 'Available Skills:', className: 'text-white font-bold' },
                    { text: '  vercel-react-best-practices', className: 'text-cyan-400' },
                    { text: '    React and Next.js performance optimization guidelines...', className: 'text-zinc-500' },
                    { text: '  web-design-guidelines', className: 'text-cyan-400' },
                    { text: '    Review UI code for Web Interface Guidelines compliance...', className: 'text-zinc-500' },
                    { text: '' },
                    { text: 'Use --skill <name> to install specific skills', className: 'text-zinc-500' },
                ],
            ],
        },
    ];

    const scene = scenes[currentScene];
    const currentLines = scene.stages[currentStage] || [];

    // Reset on scene change
    useEffect(() => {
        setTypedCommand('');
        setCurrentStage(0);
        setVisibleLines(0);
        setPhase('typing');
    }, [currentScene]);

    // Typing animation
    useEffect(() => {
        if (isPaused) return;
        if (phase !== 'typing') return;

        if (typedCommand.length < scene.command.length) {
            const timer = setTimeout(() => {
                setTypedCommand(scene.command.slice(0, typedCommand.length + 1));
            }, 25);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => setPhase('output'), 400);
            return () => clearTimeout(timer);
        }
    }, [typedCommand, phase, scene.command, isPaused]);

    // Output lines animation
    useEffect(() => {
        if (isPaused) return;
        if (phase !== 'output') return;

        if (visibleLines < currentLines.length) {
            const timer = setTimeout(() => {
                setVisibleLines(v => v + 1);
            }, 50);
            return () => clearTimeout(timer);
        } else {
            const timer = setTimeout(() => setPhase('stage-done'), 300);
            return () => clearTimeout(timer);
        }
    }, [visibleLines, phase, currentLines.length, isPaused]);

    // Move to next stage or next scene
    useEffect(() => {
        if (isPaused) return;
        if (phase !== 'stage-done') return;

        const timer = setTimeout(() => {
            if (currentStage < scene.stages.length - 1) {
                // Move to next stage within same scene
                setCurrentStage(s => s + 1);
                setVisibleLines(0);
                setPhase('output');
            } else {
                // All stages done, move to next scene
                setPhase('done');
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [phase, currentStage, scene.stages.length, isPaused]);

    // Move to next scene
    useEffect(() => {
        if (isPaused) return;
        if (phase !== 'done') return;

        const timer = setTimeout(() => {
            setCurrentScene((s) => (s + 1) % scenes.length);
        }, 2000);
        return () => clearTimeout(timer);
    }, [phase, isPaused, scenes.length]);

    return (
        <div>
            <div className="container mx-auto px-4 mb-6">
                {/* Command Header */}
                <h2 className="text-center font-mono text-2xl md:text-3xl font-normal mb-2">
                    <span className="text-cyan-400 mr-2">$</span>
                    <span className="text-white">{scene.command.split(' ').slice(0, 2).join(' ')}</span>
                </h2>
                <p className="text-center text-zinc-400 text-lg mb-6">
                    {scene.description}
                </p>

                {/* Terminal Window with Glow */}
                <div className="relative max-w-4xl mx-auto">
                    {/* Glow effect */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 blur-2xl rounded-3xl opacity-60" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 blur-xl rounded-2xl" />

                    {/* Terminal */}
                    <div
                        className="relative bg-black rounded-lg shadow-2xl overflow-hidden"
                        style={{ minHeight: '480px', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                    >
                        {/* Window Header */}
                        <div className="py-3 px-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex gap-2">
                                <div className="size-3 rounded-full bg-white/10" />
                                <div className="size-3 rounded-full bg-white/10" />
                                <div className="size-3 rounded-full bg-white/10" />
                            </div>
                            <button
                                onClick={() => setIsPaused(!isPaused)}
                                className="p-1 text-white/40 hover:text-white/80 transition-colors"
                            >
                                {isPaused ? <Play className="size-5" /> : <Pause className="size-5" />}
                            </button>
                        </div>

                        {/* Terminal Body */}
                        <div className="p-5 font-mono text-sm md:text-base text-left leading-relaxed">
                            {/* Command prompt */}
                            <div>
                                <span className="text-zinc-500">$ </span>
                                <span className="text-white">{typedCommand}</span>
                                {phase === 'typing' && (
                                    <span className="inline-block w-2 h-5 bg-white ml-0.5 animate-pulse" />
                                )}
                            </div>

                            {/* Output lines */}
                            {currentLines.slice(0, visibleLines).map((line, i) => (
                                <div key={`${currentScene}-${currentStage}-${i}`} className={line.className || 'text-zinc-300'}>
                                    {line.text === '' ? '\u00A0' : line.text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
