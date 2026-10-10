import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  slugify, mcpSlug, githubRepo, mcpInstall, registryToItem, gateReadme, contentHash, categorize, matchTools,
  itemSitemapPages, sitemapPagesSql, upsertItemSql, itemToolsSql, seedToolsSql, setStateSql, DEDUPE_SQL,
} from './items-parse.mjs';
import { freshDb, plain } from './test-db.mjs';

const npm2kw = { name: 'ai.2kw/mcp-server', title: '2kw.ai', description: 'EU-hosted AI platform', packages: [{
  registryType: 'npm', identifier: '@2kw/ai-mcp-server', version: '6.3.0', transport: { type: 'stdio' },
  environmentVariables: [
    { name: 'AI_2KW_API_KEY', description: 'API key', isRequired: true, isSecret: true },
    { name: 'AI_2KW_BASE_URL', description: 'Override base URL' },
  ] }] };
const npmArgs = { name: 'ai.aquex/stage1', packages: [{ registryType: 'npm', identifier: '@aquex/stage1', runtimeHint: 'npx',
  transport: { type: 'stdio' },
  runtimeArguments: [{ value: '-y', type: 'positional' }, { value: '--package', type: 'positional' }],
  packageArguments: [{ value: 'stage1-mcp', type: 'positional' }, { isRequired: true, format: 'filepath', type: 'named', name: '--out' }] }] };
const pypi = { name: 'ai.armor/armor', packages: [{ registryType: 'pypi', identifier: 'armor-mcp', transport: { type: 'stdio' },
  environmentVariables: [{ name: 'ARMOR_API_KEY', isRequired: true, isSecret: true }] }] };
const oci = { name: 'ai.apithreshold/x', packages: [{ registryType: 'oci', identifier: 'ghcr.io/apithreshold/apithreshold:0.1.0',
  transport: { type: 'stdio' },
  packageArguments: [{ value: 'serve', type: 'positional' }, { value: '--transport', type: 'positional' }, { value: 'stdio', type: 'positional' }],
  environmentVariables: [{ name: 'APITHRESHOLD_LLM_PROVIDER', isRequired: true }, { name: 'OPENAI_API_KEY', isSecret: true }] }] };
const remoteHdr = { name: 'ae.propick/mcp', remotes: [{ type: 'streamable-http', url: 'https://propick.ae/mcp',
  headers: [{ name: 'Authorization', description: 'Bearer <key>', isRequired: true, isSecret: true }] }] };
const sse = { name: 'ai.agentrapay/mcp', remotes: [{ type: 'sse', url: 'https://api.agentrapay.ai/mcp' }] };
const mcpbOnly = { name: 'io.github.valentil/featureboard', packages: [{ registryType: 'mcpb', identifier: 'https://x/f.plugin', transport: { type: 'stdio' } }] };

test('slugs: lowercase, [a-z0-9-], "--" between parts, never a dot', () => {
  assert.equal(slugify('Foo', 'Bar_Baz', '.claude/agents'), 'foo--bar-baz--claude-agents');
  assert.equal(mcpSlug('io.github.Foo/Bar_Server'), 'io-github-foo--bar-server');
  assert.equal(mcpSlug('ai.2kw/mcp-server'), 'ai-2kw--mcp-server');
  assert.ok(!mcpSlug('a.b.c/d.e').includes('.'));
  assert.ok(slugify('x'.repeat(300)).length <= 200);
});

test('githubRepo parses common repository URLs', () => {
  assert.equal(githubRepo('https://github.com/dealfluence/adeu'), 'dealfluence/adeu');
  assert.equal(githubRepo('git+https://github.com/a/b.git'), 'a/b');
  assert.equal(githubRepo('https://github.com/a/b/tree/main/pkg'), 'a/b');
  assert.equal(githubRepo('https://gitlab.com/a/b'), null);
  assert.equal(githubRepo(undefined), null);
});

test('mcpInstall: npm stdio with required secret env', () => {
  assert.deepEqual(mcpInstall(npm2kw), {
    type: 'mcp', transport: 'stdio', command: 'npx', args: ['-y', '@2kw/ai-mcp-server'],
    env: { AI_2KW_API_KEY: '<required>' },
    vars: [
      { kind: 'env', name: 'AI_2KW_API_KEY', description: 'API key', required: true, secret: true },
      { kind: 'env', name: 'AI_2KW_BASE_URL', description: 'Override base URL', required: false, secret: false },
    ],
  });
});

test('mcpInstall: runtime + package arguments, required named arg gets a placeholder', () => {
  assert.deepEqual(mcpInstall(npmArgs).args, ['-y', '--package', '@aquex/stage1', 'stage1-mcp', '--out', '<filepath>']);
});

test('mcpInstall: pypi -> uvx, oci -> docker run -i --rm -e', () => {
  const p = mcpInstall(pypi);
  assert.equal(p.command, 'uvx');
  assert.deepEqual(p.args, ['armor-mcp']);
  const o = mcpInstall(oci);
  assert.equal(o.command, 'docker');
  assert.deepEqual(o.args, ['run', '-i', '--rm', '-e', 'APITHRESHOLD_LLM_PROVIDER', 'ghcr.io/apithreshold/apithreshold:0.1.0', 'serve', '--transport', 'stdio']);
});

test('mcpInstall: remotes (preferred over packages), sse, unsupported -> null', () => {
  assert.deepEqual(mcpInstall(remoteHdr), {
    type: 'mcp', transport: 'http', url: 'https://propick.ae/mcp', headers: { Authorization: '<required>' },
    vars: [{ kind: 'header', name: 'Authorization', description: 'Bearer <key>', required: true, secret: true }],
  });
  assert.equal(mcpInstall(sse).transport, 'sse');
  assert.equal(mcpInstall({ ...npm2kw, remotes: remoteHdr.remotes }).transport, 'http');
  assert.equal(mcpInstall(mcpbOnly), null);
});

test('registryToItem maps a registry entry to an items row', () => {
  const row = registryToItem({ server: { name: 'ai.adeu/adeu', description: 'DOCX redlining', version: '1.7.1',
    repository: { url: 'https://github.com/dealfluence/adeu', source: 'github' }, packages: [{ registryType: 'npm', identifier: '@adeu/mcp-server', transport: { type: 'stdio' } }] },
    _meta: { 'io.modelcontextprotocol.registry/official': { status: 'deprecated', updatedAt: '2026-09-01T00:00:00Z', isLatest: true } } });
  assert.equal(row.slug, 'ai-adeu--adeu');
  assert.equal(row.name, 'adeu');
  assert.equal(row.author, 'dealfluence');
  assert.equal(row.repo_full_name, 'dealfluence/adeu');
  assert.equal(row.source_url, 'https://registry.modelcontextprotocol.io/v0.1/servers/ai.adeu%2Fadeu/versions/latest');
  assert.equal(row.status, 'removed');
  assert.equal(row.updated_at, '2026-09-01T00:00:00Z');
  assert.equal(registryToItem({ server: { name: 'noslash' } }), null);
  assert.equal(registryToItem({ server: { name: 'a.b/c' } }).status, 'active'); // server.json has no _meta
});

test('gateReadme: full text only for permissive licenses, capped at 90 KB', () => {
  const long = 'a'.repeat(2000);
  assert.equal(gateReadme(long, 'MIT'), long);
  assert.equal(gateReadme(long, null).length, 500);
  assert.equal(gateReadme(long, 'GPL-3.0').length, 500);
  assert.ok(Buffer.byteLength(gateReadme('é'.repeat(80_000), 'Apache-2.0')) <= 90_000);
  assert.equal(gateReadme(null, 'MIT'), null);
});

test('contentHash ignores whitespace and CR differences', () => {
  assert.equal(contentHash('a  b\r\nc'), contentHash('a b\nc'));
  assert.notEqual(contentHash('a b'), contentHash('a c'));
});

test('categorize picks the category with most whole-word keyword hits', () => {
  const cats = [{ id: 'database', keywords: ['postgres', 'sql'] }, { id: 'devops', keywords: ['docker', 'kubernetes', 'ci'] }];
  assert.equal(categorize('Query Postgres with SQL', cats), 'database');
  assert.equal(categorize('docker and kubernetes deploys', cats), 'devops');
  assert.equal(categorize('circle', cats), null); // 'ci' is not a whole word here
});

test('matchTools matches curated aliases on word boundaries', () => {
  const tools = [{ id: 'stripe', name: 'Stripe', aliases: ['stripe'] }, { id: 'postgres', name: 'PostgreSQL', aliases: ['postgres', 'postgresql'] }];
  assert.deepEqual(matchTools('Stripe payments + PostgreSQL', tools), ['stripe', 'postgres']);
  assert.deepEqual(matchTools('stripes', tools), []);
});

test('itemSitemapPages chunks by type in slug order with lastmod per chunk', () => {
  const rows = [
    { type: 'mcp', slug: 'c', updated_at: '2026-10-02' }, { type: 'mcp', slug: 'a', updated_at: '2026-10-05' },
    { type: 'mcp', slug: 'b', updated_at: null }, { type: 'agent', slug: 'z', updated_at: '2026-09-01' },
  ];
  assert.deepEqual(itemSitemapPages(rows, '2026-10-09T00:00:00Z', 2), [
    { name: 'mcp-0', start_key: 'a', url_count: 2, lastmod: '2026-10-05' },
    { name: 'mcp-1', start_key: 'c', url_count: 1, lastmod: '2026-10-02' },
    { name: 'agents-0', start_key: 'z', url_count: 1, lastmod: '2026-09-01' },
  ]);
});

const baseRow = {
  type: 'mcp', slug: 'acme--stripe', name: 'Stripe', author: 'acme', description: 'Payments', repo_full_name: 'acme/stripe',
  source_url: 'https://registry.modelcontextprotocol.io/v0.1/servers/acme%2Fstripe/versions/latest', path: null, branch: 'main',
  stars: 1, license: 'MIT', homepage: null, author_avatar: null, category: null, tags: ['payments'],
  install_json: { type: 'mcp', transport: 'stdio', command: 'npx', args: ['-y', 'stripe-mcp'] }, readme: 'hello',
  content_hash: null, status: 'active', pushed_at: null, updated_at: '2026-10-01T00:00:00Z',
};

test('upsertItemSql inserts, updates on (type, slug), keeps takedown sticky', () => {
  const db = freshDb();
  db.exec(upsertItemSql(baseRow));
  db.exec(upsertItemSql({ ...baseRow, name: 'Stripe MCP', stars: 9 }));
  assert.deepEqual(plain(db.prepare('SELECT name, stars, status, tags, install_json FROM items').all()), [{
    name: 'Stripe MCP', stars: 9, status: 'active', tags: '["payments"]',
    install_json: '{"type":"mcp","transport":"stdio","command":"npx","args":["-y","stripe-mcp"]}',
  }]);
  db.exec(`UPDATE items SET status = 'takedown'`);
  db.exec(upsertItemSql(baseRow));
  assert.equal(db.prepare('SELECT status FROM items').get().status, 'takedown');
});

test('upsertItemSql falls back to an excerpt instead of breaking the 100 KB statement cap', () => {
  const sql = upsertItemSql({ ...baseRow, readme: 'é'.repeat(80_000) });
  assert.ok(Buffer.byteLength(sql) < 100_000);
  assert.ok(sql.includes('é'.repeat(500)) && !sql.includes('é'.repeat(501)));
});

test('itemToolsSql / seedToolsSql / setStateSql / sitemapPagesSql run on the real schema', () => {
  const db = freshDb();
  db.exec(upsertItemSql(baseRow));
  for (const s of seedToolsSql([{ id: 'stripe', name: 'Stripe', aliases: ['stripe'], homepage: 'https://stripe.com' }])) db.exec(s);
  for (const s of itemToolsSql('mcp', 'acme--stripe', ['stripe'])) db.exec(s);
  const seq = db.prepare('SELECT seq FROM items').get().seq;
  assert.deepEqual(plain(db.prepare('SELECT item_type, item_ref, tool_id FROM item_tools').all()), [{ item_type: 'mcp', item_ref: String(seq), tool_id: 'stripe' }]);
  db.exec(setStateSql('k', 'v1')); db.exec(setStateSql('k', 'v2'));
  assert.equal(db.prepare(`SELECT value FROM job_state WHERE key = 'k'`).get().value, 'v2');
  db.exec(`INSERT INTO sitemap_pages VALUES ('mcp-7','x',1,'2020'), ('skills-en-0','a',1,'2020')`);
  for (const s of sitemapPagesSql([{ name: 'mcp-0', start_key: 'a', url_count: 3, lastmod: '2026-10-05' }])) db.exec(s);
  assert.deepEqual(db.prepare('SELECT name FROM sitemap_pages ORDER BY name').all().map((r) => r.name), ['mcp-0', 'skills-en-0']);
});

test('DEDUPE_SQL points copies at the earliest-created repo and leaves the upstream canonical', () => {
  const db = freshDb();
  db.exec(`INSERT INTO repo_scan (repo_full_name, created_at) VALUES ('old/a', '2020-01-01'), ('new/b', '2024-01-01')`);
  for (const repo of ['new/b', 'old/a']) {
    db.exec(upsertItemSql({ ...baseRow, type: 'agent', slug: slugify(...repo.split('/'), 'rev'), repo_full_name: repo,
      source_url: `https://github.com/${repo}/blob/HEAD/.claude/agents/rev.md`, content_hash: 'h1' }));
  }
  db.exec(DEDUPE_SQL);
  const bySlug = Object.fromEntries(db.prepare('SELECT slug, seq, canonical_seq FROM items').all().map((r) => [r.slug, { ...r }]));
  assert.equal(bySlug['old--a--rev'].canonical_seq, null);
  assert.equal(bySlug['new--b--rev'].canonical_seq, bySlug['old--a--rev'].seq);
});

test('malformed registry entries map to a row or null, never throw (Review Focus #2)', () => {
  assert.equal(registryToItem(null), null);
  assert.equal(registryToItem({}), null);
  const r = registryToItem({ server: { name: 'a.b/no-install', description: 'no packages or remotes' } });
  assert.equal(r.install_json, null);
  assert.equal(mcpInstall({ packages: [{ registryType: 'npm' }] }), null); // missing transport -> skipped
  assert.equal(mcpInstall({ remotes: [{ type: 'websocket', url: 'wss://x' }], packages: [{}] }), null);
});

import { skillToolsSql } from './items-parse.mjs';

test('skillToolsSql tags skills on word boundaries via skills_fts', () => {
  const db = freshDb();
  db.exec(`INSERT INTO skills (id, name, author, description, github_url) VALUES
    ('k1', 'stripe-checkout', 'acme', 'Build Stripe checkout flows', 'https://github.com/a/1'),
    ('k2', 'law-helper', 'acme', 'Draws on case laws', 'https://github.com/a/2'),
    ('k3', 'cloud-kit', 'acme', 'Deploy to AWS Lambda', 'https://github.com/a/3');`);
  const tools = [{ id: 'stripe', name: 'Stripe', aliases: ['stripe'] }, { id: 'aws', name: 'AWS', aliases: ['aws', 'amazon web services'] }];
  for (const s of skillToolsSql(tools)) db.exec(s);
  assert.deepEqual(db.prepare(`SELECT item_ref || ':' || tool_id AS e FROM item_tools WHERE item_type = 'skill' ORDER BY e`).all().map((r) => r.e),
    ['k1:stripe', 'k3:aws']);
});

import { pool } from './github.mjs';
import { readFileSync } from 'node:fs';

test('pool runs with bounded concurrency and keeps order', async () => {
  let live = 0, peak = 0;
  const out = await pool([5, 1, 3, 2], 2, async (x) => { live++; peak = Math.max(peak, live); await new Promise((r) => setTimeout(r, x)); live--; return x * 10; });
  assert.deepEqual(out, [50, 10, 30, 20]);
  assert.equal(peak, 2);
});

test('tools.json: unique ids, every tool has lowercase aliases', () => {
  const tools = JSON.parse(readFileSync(new URL('../data/tools.json', import.meta.url), 'utf8'));
  assert.ok(tools.length >= 40);
  assert.equal(new Set(tools.map((t) => t.id)).size, tools.length);
  for (const t of tools) assert.ok(t.aliases.length && t.aliases.every((a) => a === a.toLowerCase()), t.id);
});

import { agentSlug, findTargets, parseAgentFile, packageJsonToMcp, dripPlan, CODE_PLAN, removeMissingSql, repoScanSql, optOutSql } from './items-parse.mjs';

const AGENT_MD = `---
name: code-reviewer
description: Reviews code for quality and best practices. Use after any change.
tools: Read, Glob, Grep
model: sonnet
---
You are a senior reviewer. Check correctness first.`;

test('agentSlug strips only the leading .claude/agents/ and .md', () => {
  assert.equal(agentSlug('Acme/Kit', '.claude/agents/code-reviewer.md'), 'acme--kit--code-reviewer');
  assert.equal(agentSlug('acme/kit', 'agents/code-reviewer.md'), 'acme--kit--agents--code-reviewer');
  assert.equal(agentSlug('acme/kit', 'plugins/x/agents/rev.md'), 'acme--kit--plugins--x--agents--rev');
});

test('findTargets picks agents, root marketplace, server.json, opt-out file', () => {
  const t = findTargets(['.claude/agents/a.md', '.claude/agents/README.md', 'agents/b.md', '.github/agents/c.agent.md',
    'node_modules/x/agents/d.md', 'docs/e.md', 'sub/.claude-plugin/marketplace.json', '.claude-plugin/marketplace.json',
    'server.json', 'pkgs/srv/server.json', 'package.json', '.agentskills-ignore']);
  assert.deepEqual(t.agents, ['.claude/agents/a.md', 'agents/b.md']);
  assert.equal(t.marketplace, '.claude-plugin/marketplace.json');
  assert.deepEqual(t.serverJson, ['server.json']);
  assert.equal(t.packageJson, true);
  assert.equal(t.ignore, true);
  assert.equal(findTargets(['x.md']).ignore, false);
});

test('parseAgentFile reads frontmatter, keeps body as readme, rejects invalid files', () => {
  const r = parseAgentFile(AGENT_MD, { repo: 'acme/kit', path: '.claude/agents/code-reviewer.md' });
  assert.equal(r.slug, 'acme--kit--code-reviewer');
  assert.equal(r.name, 'code-reviewer');
  assert.equal(r.source_url, 'https://github.com/acme/kit/blob/HEAD/.claude/agents/code-reviewer.md');
  assert.deepEqual(r.install_json, { type: 'agent', file: 'code-reviewer.md', path: '.claude/agents/code-reviewer.md',
    rawUrl: 'https://raw.githubusercontent.com/acme/kit/HEAD/.claude/agents/code-reviewer.md', tools: ['Read', 'Glob', 'Grep'], model: 'sonnet' });
  assert.equal(r.readme, 'You are a senior reviewer. Check correctness first.');
  assert.equal(r.content_hash.length, 32);
  assert.deepEqual(parseAgentFile(AGENT_MD.replace('tools: Read, Glob, Grep', 'tools: [Read, Bash]'), { repo: 'a/b', path: 'agents/x.md' }).install_json.tools, ['Read', 'Bash']);
  assert.equal(parseAgentFile('# just markdown', { repo: 'a/b', path: 'agents/x.md' }), null);
  assert.equal(parseAgentFile('---\nname: x\n---\nbody', { repo: 'a/b', path: 'agents/x.md' }), null);
  assert.equal(parseAgentFile('---\nname: [\n---', { repo: 'a/b', path: 'agents/x.md' }), null);
});

test('packageJsonToMcp only for public bin packages tagged mcp', () => {
  const ok = packageJsonToMcp(JSON.stringify({ name: '@acme/mcp-db', description: 'DB tools', bin: { 'mcp-db': 'x.js' }, keywords: ['MCP', 'db'] }), 'acme/db');
  assert.equal(ok.slug, 'npm--acme-mcp-db');
  assert.deepEqual(ok.install_json, { type: 'mcp', transport: 'stdio', command: 'npx', args: ['-y', '@acme/mcp-db'] });
  assert.equal(packageJsonToMcp(JSON.stringify({ name: 'x', keywords: ['mcp'] }), 'a/b'), null); // no bin
  assert.equal(packageJsonToMcp(JSON.stringify({ name: 'x', bin: 'x', private: true, keywords: ['mcp'] }), 'a/b'), null);
  assert.equal(packageJsonToMcp('{bad', 'a/b'), null);
});

test('dripPlan: daily topic queries + rotating code-search slices within budget', () => {
  const { queries, nextCursor } = dripPlan(CODE_PLAN.length - 1, 6, '2026-10-09T02:00:00Z');
  assert.equal(queries.length, 6);
  assert.equal(queries[0].q, 'topic:mcp-server pushed:2026-10-07..2026-10-09');
  assert.equal(queries[0].hint, 'mcp');
  assert.equal(queries[3], CODE_PLAN.at(-1));
  assert.equal(queries[4], CODE_PLAN[0]); // wraps
  assert.equal(nextCursor, 2);
  assert.ok(CODE_PLAN.every((c) => c.kind === 'code' && c.page >= 1 && c.page <= 10 && /size:/.test(c.q)));
});

test('repo state SQL: opt-out removes items; missing files get removed; scan row upserts (slim repo_scan)', () => {
  const db = freshDb();
  const a = parseAgentFile(AGENT_MD, { repo: 'acme/tools', path: '.claude/agents/code-reviewer.md' });
  const b = parseAgentFile(AGENT_MD.replace('code-reviewer', 'other'), { repo: 'acme/tools', path: '.claude/agents/other.md' });
  for (const r of [a, b]) db.exec(upsertItemSql({ ...r, stars: 0, status: 'active' }));
  db.exec(removeMissingSql('acme/tools', 'agent', [a.source_url]));
  assert.deepEqual(db.prepare('SELECT slug, status FROM items ORDER BY slug').all().map((r) => `${r.slug}:${r.status}`),
    ['acme--tools--code-reviewer:active', 'acme--tools--other:removed']);
  const m = { headSha: 'abc', pushedAt: '2026-10-01', createdAt: '2020-01-01', stars: 5, license: 'MIT', isFork: false };
  for (const s of optOutSql('acme/tools', m, '2026-10-09')) db.exec(s);
  assert.equal(db.prepare(`SELECT count(*) AS n FROM items WHERE status = 'active'`).get().n, 0);
  assert.deepEqual({ ...db.prepare(`SELECT head_sha, created_at, stars FROM repo_scan WHERE repo_full_name = 'acme/tools'`).get() }, { head_sha: 'abc', created_at: '2020-01-01', stars: 5 });
});

import { parseMarketplace, pluginComponents } from './items-parse.mjs';

const MARKET = JSON.stringify({ name: 'acme-tools', owner: { name: 'Acme' }, plugins: [
  { name: 'review', source: './plugins/review', description: 'Code review bundle', keywords: ['review', 'qa'] },
  { name: 'remote-one', source: { source: 'github', repo: 'acme/remote-one' } },
  { source: './plugins/nameless' },
  { name: 'escape', source: './../evil' },
] });
const TREE = new Set(['plugins/review/skills/lint/SKILL.md', 'plugins/review/agents/reviewer.md', 'plugins/review/commands/review.md',
  'plugins/review/.mcp.json', 'plugins/review/README.md', 'plugins/other/agents/x.md']);

test('pluginComponents lists bundled parts under the plugin dir only', () => {
  assert.deepEqual(pluginComponents(TREE, 'plugins/review'), { skills: ['lint'], agents: ['reviewer'], commands: ['review'], mcp: true, hooks: false });
  assert.deepEqual(pluginComponents(new Set(['agents/a.md', 'hooks/hooks.json']), ''), { skills: [], agents: ['a'], commands: [], mcp: false, hooks: true });
});

test('parseMarketplace: one row per valid plugin entry, rejects nameless and ".." sources', () => {
  const rows = parseMarketplace(MARKET, { repo: 'Acme/Kit', paths: TREE });
  assert.deepEqual(rows.map((r) => r.slug), ['acme--kit--review', 'acme--kit--remote-one']);
  const [review, remote] = rows;
  assert.equal(review.path, 'plugins/review');
  assert.equal(review.source_url, 'https://github.com/Acme/Kit/blob/HEAD/.claude-plugin/marketplace.json#review');
  assert.deepEqual(review.tags, ['review', 'qa']);
  assert.deepEqual(review.install_json, { type: 'plugin', marketplace: 'Acme/Kit', marketplaceName: 'acme-tools', plugin: 'review',
    components: { skills: ['lint'], agents: ['reviewer'], commands: ['review'], mcp: true, hooks: false } });
  assert.equal(remote.path, null);
  assert.equal(remote.install_json.components, null);
  assert.equal(review.content_hash.length, 32);
  assert.deepEqual(parseMarketplace('{bad', { repo: 'a/b', paths: TREE }), []);
  assert.deepEqual(parseMarketplace('{"plugins":[]}', { repo: 'a/b', paths: TREE }), []); // no marketplace name
});
