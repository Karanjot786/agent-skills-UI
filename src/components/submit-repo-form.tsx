'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Loader2, Check, X, Star, Code2, FileText, ExternalLink } from 'lucide-react';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

interface SubmitRepoTranslations {
    placeholder: string;
    submit: string;
    indexing: string;
    fetchHint: string;
    cliHint: string;
    submitted: string;
    liveMessage: string;
    submitAnother: string;
}

const defaultTranslations: SubmitRepoTranslations = {
    placeholder: 'owner/repo or GitHub URL',
    submit: 'Submit',
    indexing: 'Indexing...',
    fetchHint: "We'll fetch repo info & scan for SKILL.md files automatically.",
    cliHint: 'Also via CLI:',
    submitted: 'Submitted!',
    liveMessage: 'Skills are now live in the marketplace!',
    submitAnother: 'Submit another',
};

interface SubmitRepoFormProps {
    translations?: Partial<SubmitRepoTranslations>;
}

export function SubmitRepoForm({ translations: translationsProp }: SubmitRepoFormProps) {
    const t = { ...defaultTranslations, ...translationsProp };

    const [repoUrl, setRepoUrl] = useState('');
    const [state, setState] = useState<SubmitState>('idle');
    const [error, setError] = useState('');
    const [resultInfo, setResultInfo] = useState<{ name: string; skills: number } | null>(null);

    /**
     * Parse owner/repo from any GitHub URL or shorthand
     */
    function parseRepo(input: string): string | null {
        const cleaned = input.trim().replace(/\.git$/, '').replace(/\/$/, '');
        const urlMatch = cleaned.match(/github\.com\/([^/]+\/[^/]+)/);
        if (urlMatch) return urlMatch[1];
        const parts = cleaned.split('/');
        if (parts.length === 2 && parts[0] && parts[1] && !parts[0].includes('.')) return cleaned;
        return null;
    }

    /**
     * Submit the repo — server handles all GitHub fetching & indexing
     */
    async function handleSubmit() {
        const fullName = parseRepo(repoUrl);
        if (!fullName) {
            setError('Enter a valid GitHub repo (e.g. owner/repo or https://github.com/owner/repo)');
            return;
        }

        setState('submitting');
        setError('');

        try {
            const response = await fetch('/api/repos/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: fullName }),
            });

            if (response.ok) {
                const result = await response.json();
                setResultInfo({ name: result.repo || fullName, skills: result.indexed || 0 });
                setState('success');
            } else {
                const data = await response.json().catch(() => ({}));
                setError((data as any).error || 'Submission failed');
                setState('error');
            }
        } catch (err: any) {
            setError(err.message || 'Network error');
            setState('error');
        }
    }

    function handleReset() {
        setRepoUrl('');
        setState('idle');
        setError('');
        setResultInfo(null);
    }

    return (
        <div className="w-full max-w-lg mx-auto">
            <AnimatePresence mode="wait">
                {/* Success */}
                {state === 'success' && resultInfo && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="text-center py-6"
                    >
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 mb-4">
                            <Check className="w-7 h-7 text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{t.submitted}</h3>
                        <p className="text-zinc-400 text-sm mb-1">
                            <span className="text-white font-medium">{resultInfo.name}</span> — {resultInfo.skills} skill{resultInfo.skills !== 1 ? 's' : ''} indexed
                        </p>
                        <p className="text-zinc-500 text-xs mb-4">{t.liveMessage}</p>
                        <button onClick={handleReset} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                            {t.submitAnother}
                        </button>
                    </motion.div>
                )}

                {/* Input */}
                {(state === 'idle' || state === 'submitting' || state === 'error') && (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-3"
                    >
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <GitBranch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="text"
                                    value={repoUrl}
                                    onChange={(e) => { setRepoUrl(e.target.value); setError(''); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    placeholder={t.placeholder}
                                    className="w-full pl-10 pr-4 py-3 bg-zinc-800/60 border border-zinc-700/50 rounded-full text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                                    disabled={state === 'submitting'}
                                />
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={state === 'submitting' || !repoUrl.trim()}
                                className={`rounded-full font-bold relative cursor-pointer hover:-translate-y-0.5 transition-all duration-200 inline-flex items-center gap-2 text-center px-6 py-3 text-base whitespace-nowrap ${repoUrl.trim()
                                        ? 'bg-gradient-to-b from-cyan-400 to-cyan-600 text-black shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset]'
                                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                    } ${state === 'submitting' ? 'opacity-80' : ''}`}
                            >
                                {state === 'submitting' ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <GitBranch className="w-4 h-4" />
                                )}
                                {state === 'submitting' ? t.indexing : t.submit}
                            </button>
                        </div>

                        {error && (
                            <div className="text-sm text-red-400 flex items-center gap-2">
                                <X className="w-4 h-4 flex-shrink-0" /> {error}
                            </div>
                        )}

                        <p className="text-xs text-zinc-500 text-center">
                            {t.fetchHint}
                            {' '}{t.cliHint} <code className="text-zinc-400">skills submit-repo owner/repo</code>
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
