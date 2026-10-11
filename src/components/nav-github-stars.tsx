'use client';

import { useState, useEffect } from 'react';
import { GitHubStars } from "@/components/github-stars";
import { TooltipProvider } from "@/components/ui/tooltip";

const GITHUB_REPO = "Karanjot786/agent-skills-cli";

export function NavGitHubStars() {
    // No made-up fallback: show the icon alone until the real count arrives (or if GitHub rate-limits us).
    const [stargazersCount, setStargazersCount] = useState<number | null>(null);

    useEffect(() => {
        // Fetch latest star count
        fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
            headers: {
                Accept: "application/vnd.github+json",
            },
        })
            .then(res => res.ok ? res.json<{ stargazers_count?: number }>() : null)
            .then(data => {
                if (data?.stargazers_count) {
                    setStargazersCount(data.stargazers_count);
                }
            })
            .catch(() => {
                // Keep fallback
            });
    }, []);

    return (
        <TooltipProvider>
            <GitHubStars repo={GITHUB_REPO} stargazersCount={stargazersCount} />
        </TooltipProvider>
    );
}
