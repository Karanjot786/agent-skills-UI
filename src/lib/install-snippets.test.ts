import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildInstallTabs, parseInstall, serverKey, shellQuote, type InstallSpec } from './install-snippets.ts';

const stdio: InstallSpec = { type: 'mcp', transport: 'stdio', command: 'npx', args: ['-y', '@2kw/ai-mcp-server'],
  env: { AI_2KW_API_KEY: '<required>' },
  vars: [{ kind: 'env', name: 'AI_2KW_API_KEY', description: 'API key', required: true, secret: true }] };
const byId = (tabs: { id: string; code: string }[]) => Object.fromEntries(tabs.map((t) => [t.id, t.code]));

test('serverKey + shellQuote', () => {
  assert.equal(serverKey('ai-2kw--mcp-server'), 'mcp-server');
  assert.equal(shellQuote('@scope/pkg'), '@scope/pkg');
  assert.equal(shellQuote("it's x"), `'it'\\''s x'`);
});

test('stdio MCP: one tab per client with the right file format', () => {
  const tabs = buildInstallTabs('mcp', 'ai-2kw--mcp-server', stdio);
  assert.deepEqual(tabs.map((t) => t.id), ['cli', 'claude-code', 'cursor', 'vscode', 'codex', 'windsurf', 'claude-desktop', 'gemini']);
  const c = byId(tabs);
  assert.equal(c.cli, 'npx agent-skills-cli install ai-2kw--mcp-server --type mcp');
  assert.equal(c['claude-code'], `claude mcp add --transport stdio --env 'AI_2KW_API_KEY=<your AI_2KW_API_KEY>' mcp-server -- npx -y @2kw/ai-mcp-server`);
  assert.deepEqual(JSON.parse(c.cursor), { mcpServers: { 'mcp-server': { type: 'stdio', command: 'npx', args: ['-y', '@2kw/ai-mcp-server'], env: { AI_2KW_API_KEY: '<your AI_2KW_API_KEY>' } } } });
  const vs = JSON.parse(c.vscode);
  assert.deepEqual(vs.inputs, [{ type: 'promptString', id: 'AI_2KW_API_KEY', description: 'API key', password: true }]);
  assert.equal(vs.servers['mcp-server'].env.AI_2KW_API_KEY, '${input:AI_2KW_API_KEY}');
  assert.equal(c.codex, [
    '[mcp_servers.mcp-server]', 'command = "npx"', 'args = ["-y", "@2kw/ai-mcp-server"]', '',
    '[mcp_servers.mcp-server.env]', 'AI_2KW_API_KEY = "<your AI_2KW_API_KEY>"'].join('\n'));
  assert.deepEqual(Object.keys(JSON.parse(c.gemini).mcpServers['mcp-server']), ['command', 'args', 'env']);
});

test('remote http MCP with a required header', () => {
  const spec: InstallSpec = { type: 'mcp', transport: 'http', url: 'https://propick.ae/mcp', headers: { Authorization: '<required>' } };
  const c = byId(buildInstallTabs('mcp', 'ae-propick--mcp', spec));
  assert.equal(c['claude-code'], `claude mcp add --transport http mcp https://propick.ae/mcp --header 'Authorization: <your Authorization>'`);
  assert.deepEqual(JSON.parse(c.cursor).mcpServers.mcp, { url: 'https://propick.ae/mcp', headers: { Authorization: '<your Authorization>' } });
  assert.equal(JSON.parse(c.vscode).servers.mcp.type, 'http');
  assert.match(c.codex, /^\[mcp_servers\.mcp\]\nurl = "https:\/\/propick\.ae\/mcp"\nhttp_headers = \{ "Authorization" = "<your Authorization>" \}$/);
  assert.equal(JSON.parse(c.windsurf).mcpServers.mcp.serverUrl, 'https://propick.ae/mcp');
  assert.equal(JSON.parse(c.gemini).mcpServers.mcp.httpUrl, 'https://propick.ae/mcp');
  assert.equal(c['claude-desktop'], 'https://propick.ae/mcp');
});

test('remote sse MCP: no Codex tab (streamable HTTP only), Gemini uses url', () => {
  const tabs = buildInstallTabs('mcp', 'x--sse', { type: 'mcp', transport: 'sse', url: 'https://a.b/sse' });
  assert.ok(!tabs.some((t) => t.id === 'codex'));
  assert.equal(JSON.parse(byId(tabs).gemini).mcpServers.sse.url, 'https://a.b/sse');
});

test('agent and plugin tabs', () => {
  const a = byId(buildInstallTabs('agent', 'acme--kit--reviewer', { type: 'agent', file: 'reviewer.md', path: '.claude/agents/reviewer.md',
    rawUrl: 'https://raw.githubusercontent.com/acme/kit/HEAD/.claude/agents/reviewer.md' }));
  assert.equal(a['claude-code'], 'mkdir -p .claude/agents && curl -fsSL https://raw.githubusercontent.com/acme/kit/HEAD/.claude/agents/reviewer.md -o .claude/agents/reviewer.md');
  const agentTab = buildInstallTabs('agent', 'acme--kit--reviewer', { type: 'agent', file: 'reviewer.md', rawUrl: 'https://x/r.md' }).find((t) => t.id === 'claude-code');
  assert.match(agentTab!.note!, /~\/\.claude\/agents/);
  const p = byId(buildInstallTabs('plugin', 'acme--kit--review', { type: 'plugin', marketplace: 'acme/kit', marketplaceName: 'acme-tools', plugin: 'review' }));
  assert.equal(p['claude-code'], '/plugin marketplace add acme/kit\n/plugin install review@acme-tools');
  assert.equal(p['claude-shell'], 'claude plugin marketplace add acme/kit\nclaude plugin install review@acme-tools');
});

test('missing or mismatched spec -> no tabs; parseInstall tolerates junk', () => {
  assert.deepEqual(buildInstallTabs('mcp', 'x', null), []);
  assert.deepEqual(buildInstallTabs('agent', 'x', stdio), []);
  assert.equal(parseInstall('{bad'), null);
  assert.equal(parseInstall(null), null);
  assert.equal(parseInstall(JSON.stringify(stdio))?.type, 'mcp');
});
