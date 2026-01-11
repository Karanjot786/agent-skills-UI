'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CopyButtonProps {
    text: string;
    className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <Button
            size="sm"
            variant="ghost"
            className={className || "text-zinc-400 hover:text-cyan-400"}
            onClick={handleCopy}
        >
            {copied ? (
                <Check className="size-4 text-green-400" />
            ) : (
                <Copy className="size-4" />
            )}
        </Button>
    );
}
