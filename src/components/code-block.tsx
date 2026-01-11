'use client';

import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';
import { CopyButton } from '@/components/copy-button';

interface CodeBlockProps {
    code: string;
    language?: string;
    showLineNumbers?: boolean;
}

export function CodeBlock({ code, language = 'bash', showLineNumbers = false }: CodeBlockProps) {
    const [html, setHtml] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function highlight() {
            try {
                const highlighted = await codeToHtml(code, {
                    lang: language,
                    theme: 'github-dark-default',
                });
                setHtml(highlighted);
            } catch {
                // Fallback for unsupported languages
                setHtml(`<pre><code>${code}</code></pre>`);
            } finally {
                setIsLoading(false);
            }
        }
        highlight();
    }, [code, language]);

    return (
        <div className="group relative rounded-lg overflow-hidden border border-white/10 bg-zinc-950">
            {/* Copy button */}
            <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyButton text={code} />
            </div>

            {/* Code content */}
            {isLoading ? (
                <div className="p-4 animate-pulse">
                    <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                </div>
            ) : (
                <div
                    className="p-4 overflow-x-auto text-sm [&_pre]:!bg-transparent [&_code]:!bg-transparent"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            )}
        </div>
    );
}
