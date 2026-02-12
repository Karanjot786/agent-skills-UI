import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import prisma from '@/lib/db';
import { rateLimit, getClientIp, rateLimitHeaders } from '@/lib/rate-limit';

// =============================================================
//  GitHub API helper — fetch repo metadata server-side
// =============================================================

interface RepoMetadata {
    full_name: string;
    html_url: string;
    description: string | null;
    stars: number;
    forks: number;
    language: string | null;
    license: string | null;
    default_branch: string;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function fetchRepoMetadata(fullName: string): Promise<RepoMetadata> {
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
    };
    if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;

    const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers });
    if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status} — repo "${fullName}" not found`);
    }

    const data = await res.json();
    return {
        full_name: data.full_name,
        html_url: data.html_url,
        description: data.description || null,
        stars: data.stargazers_count || 0,
        forks: data.forks_count || 0,
        language: data.language || null,
        license: data.license?.spdx_id || data.license?.name || null,
        default_branch: data.default_branch || 'main',
    };
}

/**
 * Scan a repo for SKILL.md files using the Git Trees API (single call)
 */
async function scanRepoSkillPaths(fullName: string, branch: string): Promise<string[]> {
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github+json',
    };
    if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;

    const res = await fetch(
        `https://api.github.com/repos/${fullName}/git/trees/${branch}?recursive=1`,
        { headers }
    );
    if (!res.ok) return [];

    const data = await res.json() as { tree: Array<{ type: string; path: string }> };
    return (data.tree || [])
        .filter(f => f.type === 'blob' && f.path.toLowerCase().endsWith('skill.md'))
        .map(f => f.path);
}

// =============================================================
//  POST /api/repos/submit
//  Client sends only { full_name } → we fetch everything from GitHub
// =============================================================

export async function POST(request: Request) {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`repo-submit:${ip}`, {
        limit: 10,
        windowSeconds: 3600,
    });

    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many submissions. Please try again later.' },
            { status: 429, headers: rateLimitHeaders(rateLimitResult) }
        );
    }

    try {
        const body = await request.json();
        let { full_name } = body;

        if (!full_name) {
            return NextResponse.json({ error: 'Missing required field: full_name' }, { status: 400 });
        }

        full_name = String(full_name).trim();

        // Validate format: owner/repo
        if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(full_name)) {
            return NextResponse.json({ error: 'Invalid format. Expected: owner/repo' }, { status: 400 });
        }

        // Check for duplicate
        const existing = await prisma.repo_submissions.findUnique({
            where: { full_name },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'This repository has already been submitted', status: existing.status },
                { status: 409 }
            );
        }

        // ─── Fetch all metadata from GitHub ───
        let metadata: RepoMetadata;
        try {
            metadata = await fetchRepoMetadata(full_name);
        } catch (err: any) {
            return NextResponse.json(
                { error: `Could not fetch repository: ${err.message}` },
                { status: 404 }
            );
        }

        // ─── Scan for SKILL.md files ───
        const skillPaths = await scanRepoSkillPaths(metadata.full_name, metadata.default_branch);

        if (skillPaths.length === 0) {
            return NextResponse.json(
                { error: 'No SKILL.md files found in this repository' },
                { status: 422 }
            );
        }

        // ─── Save the submission ───
        const submission = await prisma.repo_submissions.create({
            data: {
                full_name: metadata.full_name,
                html_url: metadata.html_url,
                description: metadata.description?.slice(0, 500) || null,
                stars: metadata.stars,
                language: metadata.language,
                license: metadata.license,
                default_branch: metadata.default_branch,
                skills_count: skillPaths.length,
                skill_paths: skillPaths.slice(0, 200),
                status: 'approved',
            },
        });

        // ─── Index all skills NOW ───
        const indexResult = await indexRepoSkills(
            metadata.full_name,
            metadata.default_branch,
            skillPaths,
            metadata.stars,
            metadata.forks,
        );

        // Update with actual indexed count
        await prisma.repo_submissions.update({
            where: { id: submission.id },
            data: { skills_count: indexResult.indexed },
        });

        // Refresh global stats cache
        try {
            await refreshStats();
        } catch { /* non-critical */ }

        return NextResponse.json({
            success: true,
            id: submission.id,
            repo: metadata.full_name,
            description: metadata.description,
            stars: metadata.stars,
            forks: metadata.forks,
            language: metadata.language,
            license: metadata.license,
            message: `Indexed ${indexResult.indexed} skills from ${metadata.full_name}`,
            indexed: indexResult.indexed,
            errors: indexResult.errors,
        }, { status: 201 });

    } catch (error) {
        console.error('Repo submission error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// =============================================================
//  Core indexing logic — mirrors indexer/src logic
// =============================================================

function generateSkillId(githubUrl: string): string {
    return createHash('sha256').update(githubUrl).digest('hex').slice(0, 16);
}

function extractSkillName(path: string): string {
    const parts = path.split('/');
    const skillsIndex = parts.findIndex(p => p === 'skills');

    if (skillsIndex >= 0 && parts[skillsIndex + 1]) {
        const skillFolder = parts[skillsIndex + 1];
        if (skillFolder.toLowerCase().includes('skill') && skillFolder.endsWith('.md')) {
            const baseName = skillFolder.replace(/\.skill\.md$/i, '').replace(/\.md$/i, '').replace(/^skill$/i, '');
            if (baseName && baseName.toLowerCase() !== 'skill') return baseName;
            return 'unknown';
        }
        return skillFolder;
    }

    const fileIndex = parts.findIndex(p => p.toLowerCase().includes('skill') && p.endsWith('.md'));
    if (fileIndex > 0) {
        const parentFolder = parts[fileIndex - 1];
        if (!parentFolder.startsWith('.')) return parentFolder;
    }
    return 'unknown';
}

function parseFrontmatter(content: string, fallbackName: string): { name: string; description: string } {
    try {
        let name = fallbackName;
        let description = '';

        if (content.startsWith('---\n') || content.startsWith('---\r\n')) {
            const endIdx = content.indexOf('\n---', 4);
            if (endIdx > 0) {
                const fm = content.substring(content.indexOf('\n') + 1, endIdx);
                for (const line of fm.split('\n')) {
                    const colonIdx = line.indexOf(':');
                    if (colonIdx > 0) {
                        const key = line.substring(0, colonIdx).trim();
                        const val = line.substring(colonIdx + 1).trim();
                        if (key === 'name' && val) name = val;
                        if (key === 'description' && val) description = val;
                    }
                }
            }
        }

        if (!description) {
            // Extract first meaningful paragraph
            const lines = content.split('\n')
                .map(l => l.trim())
                .filter(l => l && !l.startsWith('#') && !l.startsWith('---'));
            description = (lines[0] || '').slice(0, 300);
        }

        // Try heading if no name from frontmatter
        if (name === fallbackName) {
            const headingMatch = content.match(/^#\s+(.+)$/m);
            if (headingMatch) name = headingMatch[1].trim();
        }

        return { name, description };
    } catch {
        return { name: fallbackName, description: '' };
    }
}

/**
 * Index all skills from a single repo into the skills table
 */
async function indexRepoSkills(
    repoFullName: string,
    branch: string,
    skillPaths: string[],
    stars: number,
    forks: number,
): Promise<{ indexed: number; errors: number }> {
    const [owner] = repoFullName.split('/');
    let indexed = 0;
    let errors = 0;

    // If no skill paths provided, scan the repo
    if (skillPaths.length === 0) {
        try {
            const treeRes = await fetch(
                `https://api.github.com/repos/${repoFullName}/git/trees/${branch}?recursive=1`,
                { headers: { 'Accept': 'application/vnd.github.v3+json' } }
            );
            if (treeRes.ok) {
                const treeData = await treeRes.json() as { tree: Array<{ type: string; path: string }> };
                skillPaths = (treeData.tree || [])
                    .filter(f => f.type === 'blob' && f.path.toLowerCase().endsWith('skill.md'))
                    .map(f => f.path);
            }
        } catch { /* skip */ }
    }

    // Process each SKILL.md
    for (const path of skillPaths) {
        try {
            const skillName = extractSkillName(path);

            // Fetch raw SKILL.md content (raw.githubusercontent.com has no rate limit)
            const rawUrl = `https://raw.githubusercontent.com/${repoFullName}/${branch}/${path}`;
            const rawRes = await fetch(rawUrl);
            if (!rawRes.ok) {
                errors++;
                continue;
            }
            const content = await rawRes.text();
            const parsed = parseFrontmatter(content, skillName);

            // Build URLs
            const folderPath = path.replace(/\/SKILL\.md$/i, '');
            const githubUrl = `https://github.com/${repoFullName}/tree/${branch}/${folderPath}`;

            // Upsert into skills table
            const skillId = generateSkillId(githubUrl);
            await prisma.skills.upsert({
                where: { github_url: githubUrl },
                create: {
                    id: skillId,
                    name: skillName,
                    author: owner,
                    description: parsed.name !== skillName
                        ? `${parsed.name}: ${parsed.description}`
                        : parsed.description,
                    author_avatar: `https://github.com/${owner}.png`,
                    github_url: githubUrl,
                    raw_url: rawUrl,
                    repo_full_name: repoFullName,
                    stars,
                    forks,
                    path,
                    branch,
                    has_marketplace: false,
                    content: content.slice(0, 10000), // Store content for search
                    folder_url: `https://github.com/${repoFullName}/tree/${branch}/${folderPath}`,
                    updated_at: new Date(),
                },
                update: {
                    name: skillName,
                    description: parsed.name !== skillName
                        ? `${parsed.name}: ${parsed.description}`
                        : parsed.description,
                    author_avatar: `https://github.com/${owner}.png`,
                    raw_url: rawUrl,
                    stars,
                    forks,
                    content: content.slice(0, 10000),
                    updated_at: new Date(),
                },
            });

            indexed++;
        } catch (err) {
            errors++;
        }
    }

    return { indexed, errors };
}

/**
 * Refresh the global skill_stats cache
 */
async function refreshStats() {
    const [totalSkills, authorsData] = await Promise.all([
        prisma.skills.count(),
        prisma.$queryRaw<Array<{ name: string; skillCount: bigint; avatar: string | null }>>`
            SELECT author as name, COUNT(*) as "skillCount", MAX(author_avatar) as avatar
            FROM skills
            GROUP BY author
            ORDER BY COUNT(*) DESC
            LIMIT 10
        `,
    ]);

    const uniqueAuthors = await prisma.skills.groupBy({
        by: ['author'],
        _count: true,
    }).then(r => r.length);

    const topAuthors = authorsData.map(a => ({
        name: a.name,
        skillCount: Number(a.skillCount),
        avatar: a.avatar || '',
    }));

    await prisma.skill_stats.upsert({
        where: { id: 'global' },
        create: {
            id: 'global',
            total_skills: totalSkills,
            unique_authors: uniqueAuthors,
            top_authors: topAuthors,
            updated_at: new Date(),
        },
        update: {
            total_skills: totalSkills,
            unique_authors: uniqueAuthors,
            top_authors: topAuthors,
            updated_at: new Date(),
        },
    });
}

// =============================================================
//  GET /api/repos/submit?repo=owner/repo — check status
// =============================================================

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fullName = searchParams.get('repo');

    if (fullName) {
        const submission = await prisma.repo_submissions.findUnique({
            where: { full_name: fullName },
            select: { full_name: true, status: true, skills_count: true, submitted_at: true },
        });
        if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(submission);
    }

    // List recent approved
    const repos = await prisma.repo_submissions.findMany({
        where: { status: 'approved' },
        orderBy: { submitted_at: 'desc' },
        take: 20,
        select: { full_name: true, description: true, stars: true, skills_count: true, html_url: true, submitted_at: true },
    });

    return NextResponse.json({ repos });
}
