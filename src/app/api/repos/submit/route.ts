import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { limitByIp } from '@/lib/rate-limit';

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

interface GhRepo {
    full_name: string;
    html_url: string;
    description?: string | null;
    stargazers_count?: number;
    forks_count?: number;
    language?: string | null;
    license?: { spdx_id?: string; name?: string } | null;
    default_branch?: string;
}

const NO_STORE = { 'Cache-Control': 'private, no-store' };
// GitHub 403s API requests without a User-Agent.
const GH_USER_AGENT = 'agentskills-in/1.0 (+https://www.agentskills.in)';

function ghHeaders(token?: string): Record<string, string> {
    const h: Record<string, string> = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': GH_USER_AGENT };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
}

class GithubHttpError extends Error {
    constructor(public status: number) { super(`GitHub API ${status}`); }
}

// 403/429 = GitHub rate limit (retryable), 404 = no such repo, anything else = upstream failure.
function mapGithubStatus(status: number): { status: number; error: string } {
    if (status === 403 || status === 429) return { status: 503, error: 'GitHub rate-limited, retry later' };
    if (status === 404) return { status: 404, error: 'Repository not found' };
    return { status: 502, error: `GitHub returned ${status}` };
}

async function fetchRepoMetadata(fullName: string, token?: string): Promise<RepoMetadata> {
    const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers: ghHeaders(token) });
    if (!res.ok) throw new GithubHttpError(res.status);
    const data = await res.json() as GhRepo;
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

/** Scan a repo for SKILL.md files using the Git Trees API (single call). */
async function scanRepoSkillPaths(fullName: string, branch: string, token?: string): Promise<string[]> {
    const res = await fetch(
        `https://api.github.com/repos/${fullName}/git/trees/${branch}?recursive=1`,
        { headers: ghHeaders(token) }
    );
    if (res.status === 404 || res.status === 409) return []; // empty repo / missing branch
    if (!res.ok) throw new GithubHttpError(res.status);
    const data = await res.json() as { tree: Array<{ type: string; path: string }> };
    return (data.tree || [])
        .filter(f => f.type === 'blob' && f.path.toLowerCase().endsWith('skill.md'))
        .map(f => f.path);
}

// =============================================================
//  POST /api/repos/submit
//  Client sends only { full_name } -> validate, record 'pending', return 202, index in waitUntil
// =============================================================

export async function POST(request: Request) {
    const { env, ctx } = getCloudflareContext();
    if (!(await limitByIp(env.SUBMIT_LIMITER, request))) {
        return NextResponse.json(
            { error: 'Too many submissions. Please try again later.' },
            { status: 429, headers: { 'Retry-After': '60', ...NO_STORE } }
        );
    }
    const token = env.GITHUB_TOKEN;

    try {
        const body = await request.json() as { full_name?: string };
        let { full_name } = body;

        if (!full_name) {
            return NextResponse.json({ error: 'Missing required field: full_name' }, { status: 400, headers: NO_STORE });
        }
        full_name = String(full_name).trim();
        // '.'/'..' segments would turn the GitHub URL into a different API path.
        if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(full_name) || full_name.split('/').some((p) => p === '.' || p === '..')) {
            return NextResponse.json({ error: 'Invalid format. Expected: owner/repo' }, { status: 400, headers: NO_STORE });
        }

        const db = getDb();
        const existing = await db.prepare('SELECT status FROM repo_submissions WHERE full_name = ?').bind(full_name).first<{ status: string }>();
        if (existing) {
            return NextResponse.json(
                { error: 'This repository has already been submitted', status: existing.status },
                { status: 409, headers: NO_STORE }
            );
        }

        let metadata: RepoMetadata;
        let skillPaths: string[];
        try {
            metadata = await fetchRepoMetadata(full_name, token);
            skillPaths = await scanRepoSkillPaths(metadata.full_name, metadata.default_branch, token);
        } catch (err) {
            if (err instanceof GithubHttpError) {
                const m = mapGithubStatus(err.status);
                return NextResponse.json({ error: m.error }, { status: m.status, headers: NO_STORE });
            }
            throw err;
        }

        if (skillPaths.length === 0) {
            return NextResponse.json({ error: 'No SKILL.md files found in this repository' }, { status: 422, headers: NO_STORE });
        }

        const submissionId = crypto.randomUUID();
        await db.prepare(`INSERT INTO repo_submissions (id, full_name, html_url, description, stars, language, license, default_branch, skills_count, skill_paths, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`)
            .bind(submissionId, metadata.full_name, metadata.html_url, metadata.description?.slice(0, 500) || null, metadata.stars,
                metadata.language, metadata.license, metadata.default_branch, skillPaths.length, JSON.stringify(skillPaths.slice(0, 200)))
            .run();

        ctx.waitUntil(finishIndexing(submissionId, metadata, skillPaths));

        return NextResponse.json({
            success: true,
            id: submissionId,
            repo: metadata.full_name,
            status: 'pending',
            skills_found: skillPaths.length,
            message: `Accepted: indexing ${skillPaths.length} skills from ${metadata.full_name}. Check GET /api/repos/submit?repo=${metadata.full_name}`,
        }, { status: 202, headers: NO_STORE });
    } catch (error) {
        console.error('Repo submission error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: NO_STORE });
    }
}

// =============================================================
//  Core indexing logic — mirrors indexer/src logic
// =============================================================

function generateSkillId(githubUrl: string): string {
    return createHash('sha256').update(githubUrl).digest('hex').slice(0, 16);
}

function extractSkillName(path: string, repoFullName?: string): string {
    const parts = path.split('/');
    const skillsIndex = parts.findIndex(p => p === 'skills');

    if (skillsIndex >= 0 && parts[skillsIndex + 1]) {
        const skillFolder = parts[skillsIndex + 1];
        if (skillFolder.toLowerCase().includes('skill') && skillFolder.endsWith('.md')) {
            const baseName = skillFolder.replace(/\.skill\.md$/i, '').replace(/\.md$/i, '').replace(/^skill$/i, '');
            if (baseName && baseName.toLowerCase() !== 'skill') return baseName;
        } else {
            return skillFolder;
        }
    }

    const fileIndex = parts.findIndex(p => p.toLowerCase().includes('skill') && p.endsWith('.md'));
    if (fileIndex > 0) {
        const parentFolder = parts[fileIndex - 1];
        if (!parentFolder.startsWith('.')) return parentFolder;
    }

    // Root SKILL.md (e.g. path = "SKILL.md"): fall back to repo name
    if (repoFullName) {
        return repoFullName.split('/')[1] || 'unknown';
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
 * Index all skills from a single repo into the skills table: 10 concurrent raw fetches, db.batch chunks of <=100.
 */
async function indexRepoSkills(
    repoFullName: string,
    branch: string,
    skillPaths: string[],
    stars: number,
    forks: number,
): Promise<{ indexed: number; errors: number }> {
    const [owner] = repoFullName.split('/');
    const db = getDb();
    const paths = skillPaths.slice(0, 200);
    const stmts: D1PreparedStatement[] = [];
    let errors = 0;
    let next = 0;

    const worker = async () => {
        while (next < paths.length) {
            const path = paths[next++];
            try {
                const skillName = extractSkillName(path, repoFullName);
                const rawUrl = `https://raw.githubusercontent.com/${repoFullName}/${branch}/${path}`;
                const rawRes = await fetch(rawUrl, { headers: { 'User-Agent': GH_USER_AGENT } });
                if (!rawRes.ok) { errors++; continue; }
                const content = await rawRes.text();
                const parsed = parseFrontmatter(content, skillName);
                const folderPath = path.replace(/\/SKILL\.md$/i, '');
                const githubUrl = `https://github.com/${repoFullName}/tree/${branch}/${folderPath}`;
                const skillId = generateSkillId(githubUrl);
                const description = parsed.name !== skillName ? `${parsed.name}: ${parsed.description}` : parsed.description;
                stmts.push(db.prepare(`INSERT INTO skills (id, name, author, scoped_name, description, author_avatar, github_url, raw_url, repo_full_name, stars, forks, path, branch, content, folder_url, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(github_url) DO UPDATE SET name = excluded.name, scoped_name = excluded.scoped_name, description = excluded.description,
                        author_avatar = excluded.author_avatar, raw_url = excluded.raw_url, stars = excluded.stars, forks = excluded.forks,
                        content = excluded.content, updated_at = excluded.updated_at`)
                    .bind(skillId, skillName, owner, `@${owner}/${skillName}`, description, `https://github.com/${owner}.png`, githubUrl, rawUrl,
                        repoFullName, stars, forks, path, branch, content.slice(0, 10000), `https://github.com/${repoFullName}/tree/${branch}/${folderPath}`,
                        new Date().toISOString()));
            } catch {
                errors++;
            }
        }
    };
    await Promise.all(Array.from({ length: Math.min(10, paths.length) }, worker));

    for (let i = 0; i < stmts.length; i += 100) await db.batch(stmts.slice(i, i + 100));
    return { indexed: stmts.length, errors };
}

async function finishIndexing(id: string, m: RepoMetadata, paths: string[]): Promise<void> {
    const db = getDb();
    try {
        const r = await indexRepoSkills(m.full_name, m.default_branch, paths, m.stars, m.forks);
        await db.prepare("UPDATE repo_submissions SET status = 'approved', skills_count = ?, reviewed_at = ? WHERE id = ?")
            .bind(r.indexed, new Date().toISOString(), id).run();
    } catch (err) {
        console.error('Repo indexing error:', err);
        // drop the pending row so the user can retry
        await db.prepare('DELETE FROM repo_submissions WHERE id = ?').bind(id).run().catch(() => { });
    }
}

// =============================================================
//  GET /api/repos/submit?repo=owner/repo — check status
// =============================================================

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fullName = searchParams.get('repo');
        const db = getDb();
        if (fullName) {
            const submission = await db.prepare('SELECT full_name, status, skills_count, submitted_at FROM repo_submissions WHERE full_name = ?').bind(fullName).first();
            if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE });
            return NextResponse.json(submission, { headers: NO_STORE });
        }
        const { results: repos } = await db.prepare(`SELECT full_name, description, stars, skills_count, html_url, submitted_at
            FROM repo_submissions WHERE status = 'approved' ORDER BY submitted_at DESC LIMIT 20`).all();
        return NextResponse.json({ repos }, { headers: NO_STORE });
    } catch (error) {
        console.error('Repo submit GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: NO_STORE });
    }
}
