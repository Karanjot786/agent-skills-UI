'use client';

import { useState, useEffect } from 'react';
import { GitHubStars } from "@/components/github-stars";
import { TooltipProvider } from "@/components/ui/tooltip";

const GITHUB_REPO = "Karanjot786/agent-skills-cli";

export function NavGitHubStars() {
    const [stargazersCount, setStargazersCount] = useState(2100); // Default fallback

    useEffect(() => {
        // Fetch latest star count
        fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
            headers: {
                Accept: "application/vnd.github+json",
            },
        })
            .then(res => res.ok ? res.json() : null)
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
