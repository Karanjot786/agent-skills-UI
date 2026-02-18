'use client';

import React from 'react';
import { CopyButton } from '@/components/copy-button';
import { Info, Lightbulb, AlertTriangle, AlertCircle, Zap } from 'lucide-react';

/**
 * MDX Components — Custom-styled components for rendering MDX content
 * in the docs page. Matches the existing dark theme with cyan accents.
 */

// ── Callout Component ────────────────────────────────────────────────────

type CalloutType = 'note' | 'tip' | 'warning' | 'important' | 'npx';

const calloutConfig: Record<CalloutType, { icon: React.ReactNode; bgClass: string; borderClass: string; iconColor: string; titleColor: string; title: string }> = {
    note: {
        icon: <Info className="size-4" />,
        bgClass: 'bg-blue-500/5',
        borderClass: 'border-blue-500/30',
        iconColor: 'text-blue-400',
        titleColor: 'text-blue-400',
        title: 'Note',
    },
    tip: {
        icon: <Lightbulb className="size-4" />,
        bgClass: 'bg-emerald-500/5',
        borderClass: 'border-emerald-500/30',
        iconColor: 'text-emerald-400',
        titleColor: 'text-emerald-400',
        title: 'Tip',
    },
    warning: {
        icon: <AlertTriangle className="size-4" />,
        bgClass: 'bg-amber-500/5',
        borderClass: 'border-amber-500/30',
        iconColor: 'text-amber-400',
        titleColor: 'text-amber-400',
        title: 'Warning',
    },
    important: {
        icon: <AlertCircle className="size-4" />,
        bgClass: 'bg-red-500/5',
        borderClass: 'border-red-500/30',
        iconColor: 'text-red-400',
        titleColor: 'text-red-400',
        title: 'Important',
    },
    npx: {
        icon: <Zap className="size-4" />,
        bgClass: 'bg-purple-500/5',
        borderClass: 'border-purple-500/30',
        iconColor: 'text-purple-400',
        titleColor: 'text-purple-400',
        title: 'npx — No Install Needed',
    },
};

export function Callout({ type = 'note', title, children }: { type?: CalloutType; title?: string; children: React.ReactNode }) {
    const config = calloutConfig[type];
    return (
        <div className={`my-6 rounded-xl border ${config.borderClass} ${config.bgClass} p-4`}>
            <div className="flex items-center gap-2 mb-2">
                <span className={config.iconColor}>{config.icon}</span>
                <span className={`text-sm font-semibold ${config.titleColor}`}>{title || config.title}</span>
            </div>
            <div className="text-sm text-zinc-300 leading-relaxed [&>p]:my-1 [&>p]:text-sm">
                {children}
            </div>
        </div>
    );
}

// ── Heading with anchor link ─────────────────────────────────────────────

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[`]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function createHeading(level: number) {
    const HeadingComponent = ({ children }: { children: React.ReactNode }) => {
        const text = typeof children === 'string'
            ? children
            : React.Children.toArray(children)
                .map(child => {
                    if (typeof child === 'string') return child;
                    if (React.isValidElement(child)) {
                        const props = child.props as Record<string, unknown>;
                        if (props.children) return String(props.children);
                    }
                    return '';
                })
                .join('');

        const id = slugify(text);

        const sizes: Record<number, string> = {
            1: 'text-3xl sm:text-4xl font-bold mt-12 mb-6 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent',
            2: 'text-2xl font-bold mt-12 mb-6 text-white border-b border-white/10 pb-4',
            3: 'text-xl font-bold mt-8 mb-4 text-cyan-400 font-mono',
            4: 'text-lg font-semibold mt-6 mb-3 text-zinc-200',
        };

        const Tag = `h${level}` as React.ElementType;

        return (
            <Tag
                id={id}
                className={`scroll-mt-24 group ${sizes[level] || sizes[4]}`}
            >
                {children}
                <a
                    href={`#${id}`}
                    className="ml-2 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-cyan-400"
                    aria-label={`Link to ${text}`}
                >
                    #
                </a>
            </Tag>
        );
    };
    HeadingComponent.displayName = `Heading${level}`;
    return HeadingComponent;
}

// ── Code block with syntax highlighting ──────────────────────────────────

function CodeBlockMDX({ children, className, ...props }: React.HTMLAttributes<HTMLElement>) {
    const language = className?.replace('language-', '') || 'bash';
    const code = typeof children === 'string' ? children.trim() : '';

    return (
        <div className="group relative rounded-lg overflow-hidden border border-white/10 bg-zinc-950 my-4">
            {/* Language badge */}
            <div className="absolute left-3 top-2 z-10">
                <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-mono">
                    {language}
                </span>
            </div>

            {/* Copy button */}
            <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={code} />
            </div>

            <pre className="p-4 pt-8 overflow-x-auto text-sm !bg-transparent" {...props}>
                <code className={`${className || ''} !bg-transparent`}>
                    {children}
                </code>
            </pre>
        </div>
    );
}

function Pre({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
    // Extract code element from pre
    if (React.isValidElement(children) && children.type === 'code') {
        return <CodeBlockMDX {...(children.props as React.HTMLAttributes<HTMLElement>)} />;
    }

    return (
        <pre className="p-4 overflow-x-auto rounded-lg bg-zinc-950 border border-white/10 text-sm my-4" {...props}>
            {children}
        </pre>
    );
}

// ── Inline code ──────────────────────────────────────────────────────────

function InlineCode({ children, ...props }: React.HTMLAttributes<HTMLElement>) {
    return (
        <code
            className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded text-sm font-mono"
            {...props}
        >
            {children}
        </code>
    );
}

// ── Table ────────────────────────────────────────────────────────────────

function Table({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) {
    return (
        <div className="overflow-x-auto my-6 rounded-lg border border-white/10">
            <table className="w-full text-sm" {...props}>
                {children}
            </table>
        </div>
    );
}

function Thead({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return (
        <thead className="bg-zinc-900/80 border-b border-white/10" {...props}>
            {children}
        </thead>
    );
}

function Th({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
    return (
        <th className="text-left px-4 py-3 font-semibold text-zinc-300 text-xs uppercase tracking-wider" {...props}>
            {children}
        </th>
    );
}

function Td({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) {
    return (
        <td className="px-4 py-3 text-zinc-400 border-t border-white/5" {...props}>
            {children}
        </td>
    );
}

function Tr({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr className="hover:bg-white/[0.03] transition-colors" {...props}>
            {children}
        </tr>
    );
}

// ── Blockquote (auto-detects callout patterns) ───────────────────────────

function Blockquote({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) {
    // Extract text content to detect callout patterns
    const textContent = React.Children.toArray(children)
        .map(child => {
            if (typeof child === 'string') return child;
            if (React.isValidElement(child)) {
                const childProps = child.props as { children?: React.ReactNode };
                if (childProps.children) {
                    const inner = React.Children.toArray(childProps.children);
                    return inner.map(c => {
                        if (typeof c === 'string') return c;
                        if (React.isValidElement(c)) {
                            const cProps = c.props as { children?: React.ReactNode };
                            return typeof cProps.children === 'string' ? cProps.children : '';
                        }
                        return '';
                    }).join('');
                }
            }
            return '';
        })
        .join('')
        .trim();

    // Auto-detect callout type from content
    const calloutPatterns: [RegExp, CalloutType][] = [
        [/^\*?\*?(?:💡\s*)?tip:?\*?\*?\s*/i, 'tip'],
        [/^\*?\*?(?:📝\s*)?note:?\*?\*?\s*/i, 'note'],
        [/^\*?\*?(?:⚠️\s*)?warning:?\*?\*?\s*/i, 'warning'],
        [/^\*?\*?(?:🚨\s*)?important:?\*?\*?\s*/i, 'important'],
        [/^\*?\*?(?:⚡\s*)?npx:?\*?\*?\s*/i, 'npx'],
    ];

    for (const [pattern, type] of calloutPatterns) {
        if (pattern.test(textContent)) {
            return (
                <Callout type={type}>
                    {children}
                </Callout>
            );
        }
    }

    return (
        <blockquote
            className="border-l-4 border-cyan-500/40 pl-4 py-2 my-6 bg-cyan-500/5 rounded-r-lg text-zinc-300 italic"
            {...props}
        >
            {children}
        </blockquote>
    );
}

// ── Lists ────────────────────────────────────────────────────────────────

function UnorderedList({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) {
    return (
        <ul className="space-y-2 my-4 ml-1" {...props}>
            {children}
        </ul>
    );
}

function OrderedList({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) {
    return (
        <ol className="space-y-2 my-4 ml-1 list-decimal list-inside" {...props}>
            {children}
        </ol>
    );
}

function ListItem({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) {
    return (
        <li className="text-zinc-400 pl-2 flex gap-2" {...props}>
            <span className="text-cyan-500/60 mt-1.5 shrink-0">•</span>
            <span>{children}</span>
        </li>
    );
}

// ── Links ────────────────────────────────────────────────────────────────

function Anchor({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
    return (
        <a
            href={href}
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-400/30 hover:decoration-cyan-400/60 transition-colors"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            {...props}
        >
            {children}
        </a>
    );
}

// ── Horizontal rule ──────────────────────────────────────────────────────

function HorizontalRule() {
    return (
        <hr className="my-10 border-none h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    );
}

// ── Paragraph ────────────────────────────────────────────────────────────

function Paragraph({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p className="text-zinc-400 leading-relaxed my-4" {...props}>
            {children}
        </p>
    );
}

// ── Strong / Bold ────────────────────────────────────────────────────────

function Strong({ children, ...props }: React.HTMLAttributes<HTMLElement>) {
    return (
        <strong className="text-white font-semibold" {...props}>
            {children}
        </strong>
    );
}

// ── Component Map ────────────────────────────────────────────────────────

export const mdxComponents = {
    h1: createHeading(1),
    h2: createHeading(2),
    h3: createHeading(3),
    h4: createHeading(4),
    p: Paragraph,
    a: Anchor,
    pre: Pre,
    code: InlineCode,
    table: Table,
    thead: Thead,
    th: Th,
    td: Td,
    tr: Tr,
    blockquote: Blockquote,
    ul: UnorderedList,
    ol: OrderedList,
    li: ListItem,
    hr: HorizontalRule,
    strong: Strong,
};
