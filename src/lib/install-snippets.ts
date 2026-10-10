// install_json (spec §7.3) -> per-client install snippets. Pure: unit-tested with node --test.
// Formats verified 2026-10-09 against vendor docs (Claude Code, Cursor, VS Code, Codex, Windsurf/Devin, Claude Desktop, Gemini CLI).
import type { ItemType } from './items-sql';

export interface McpVar { kind: 'env' | 'header' | 'url'; name: string; description: string; required: boolean; secret: boolean }
export type McpStdio = { type: 'mcp'; transport: 'stdio'; command: string; args?: string[]; env?: Record<string, string>; vars?: McpVar[] };
export type McpRemote = { type: 'mcp'; transport: 'http' | 'sse'; url: string; headers?: Record<string, string>; vars?: McpVar[] };
export type AgentSpec = { type: 'agent'; file: string; path: string; rawUrl: string; tools?: string[]; model?: string };
export interface PluginComponents { skills: string[]; agents: string[]; commands: string[]; mcp: boolean; hooks: boolean }
export type PluginSpec = { type: 'plugin'; marketplace: string; marketplaceName: string; plugin: string; components?: PluginComponents | null };
export type InstallSpec = McpStdio | McpRemote | AgentSpec | PluginSpec;
export interface InstallTab { id: string; label: string; lang: 'bash' | 'json' | 'toml' | 'text'; code: string; file?: string; note?: string }

export function parseInstall(json: string | null): InstallSpec | null {
    if (!json) return null;
    try {
        const v = JSON.parse(json);
        return v && typeof v === 'object' && typeof v.type === 'string' ? (v as InstallSpec) : null;
    } catch {
        return null;
    }
}

export const shellQuote = (s: string) => (/^[A-Za-z0-9_@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`);
export const serverKey = (slug: string) => (slug.split('--').pop() ?? '').replace(/[^a-z0-9_-]/g, '-').slice(0, 64) || 'server';
const fill = (name: string) => `<your ${name}>`;
const json = (v: unknown) => JSON.stringify(v, null, 2);
const toml = (s: string) => JSON.stringify(s); // JSON strings are valid TOML basic strings
const filled = (m?: Record<string, string>) =>
    (m && Object.keys(m).length ? Object.fromEntries(Object.keys(m).map((k) => [k, fill(k)])) : undefined);

export function cliTab(type: ItemType, slug: string): InstallTab {
    return { id: 'cli', label: 'Agent Skills CLI', lang: 'bash', code: `npx agent-skills-cli install ${slug} --type ${type}`,
        note: "Detects your installed agents and writes each one's config. Prompts for required values." };
}

function stdioTabs(key: string, s: McpStdio): InstallTab[] {
    const args = s.args ?? [];
    const envKeys = Object.keys(s.env ?? {});
    const env = filled(s.env);
    const local = { command: s.command, args, ...(env ? { env } : {}) };
    const varOf = new Map((s.vars ?? []).map((v) => [v.name, v]));
    const envFlags = envKeys.map((k) => ` --env ${shellQuote(`${k}=${fill(k)}`)}`).join('');
    const inputs = envKeys.map((k) => ({ type: 'promptString', id: k, description: varOf.get(k)?.description || k, password: !!varOf.get(k)?.secret }));
    const vsEnv = envKeys.length ? Object.fromEntries(envKeys.map((k) => [k, `\${input:${k}}`])) : undefined;
    const tomlLines = [`[mcp_servers.${key}]`, `command = ${toml(s.command)}`, `args = [${args.map(toml).join(', ')}]`];
    if (env) tomlLines.push('', `[mcp_servers.${key}.env]`, ...Object.entries(env).map(([k, v]) => `${k} = ${toml(v)}`));
    return [
        { id: 'claude-code', label: 'Claude Code', lang: 'bash', code: `claude mcp add --transport stdio${envFlags} ${key} -- ${[s.command, ...args].map(shellQuote).join(' ')}`,
            note: 'Add --scope project to share it via .mcp.json, or --scope user for all projects.' },
        { id: 'cursor', label: 'Cursor', lang: 'json', file: '.cursor/mcp.json', code: json({ mcpServers: { [key]: { type: 'stdio', ...local } } }),
            note: 'Or ~/.cursor/mcp.json for every project.' },
        { id: 'vscode', label: 'VS Code', lang: 'json', file: '.vscode/mcp.json',
            code: json({ ...(inputs.length ? { inputs } : {}), servers: { [key]: { type: 'stdio', command: s.command, args, ...(vsEnv ? { env: vsEnv } : {}) } } }),
            note: 'VS Code asks for each input the first time the server starts.' },
        { id: 'codex', label: 'Codex', lang: 'toml', file: '~/.codex/config.toml', code: tomlLines.join('\n') },
        { id: 'windsurf', label: 'Windsurf', lang: 'json', file: '~/.codeium/windsurf/mcp_config.json', code: json({ mcpServers: { [key]: local } }),
            note: 'Devin Desktop (formerly Windsurf) on macOS/Linux reads ~/.config/devin/mcp_config.json.' },
        { id: 'claude-desktop', label: 'Claude Desktop', lang: 'json', file: 'claude_desktop_config.json', code: json({ mcpServers: { [key]: local } }),
            note: 'Settings → Developer → Edit Config. macOS: ~/Library/Application Support/Claude/, Windows: %APPDATA%\\Claude\\.' },
        { id: 'gemini', label: 'Gemini CLI', lang: 'json', file: '.gemini/settings.json', code: json({ mcpServers: { [key]: local } }),
            note: 'Or ~/.gemini/settings.json for every project.' },
    ];
}

function remoteTabs(key: string, s: McpRemote): InstallTab[] {
    const headers = filled(s.headers);
    const hdrFlags = Object.keys(s.headers ?? {}).map((h) => ` --header ${shellQuote(`${h}: ${fill(h)}`)}`).join('');
    const withHeaders = (o: Record<string, unknown>) => (headers ? { ...o, headers } : o);
    const tabs: InstallTab[] = [
        { id: 'claude-code', label: 'Claude Code', lang: 'bash', code: `claude mcp add --transport ${s.transport} ${key} ${shellQuote(s.url)}${hdrFlags}`,
            note: 'Add --scope project to share it via .mcp.json, or --scope user for all projects.' },
        { id: 'cursor', label: 'Cursor', lang: 'json', file: '.cursor/mcp.json', code: json({ mcpServers: { [key]: withHeaders({ url: s.url }) } }) },
        { id: 'vscode', label: 'VS Code', lang: 'json', file: '.vscode/mcp.json', code: json({ servers: { [key]: withHeaders({ type: s.transport, url: s.url }) } }) },
    ];
    if (s.transport === 'http') { // Codex documents streamable HTTP only
        const lines = [`[mcp_servers.${key}]`, `url = ${toml(s.url)}`];
        if (headers) lines.push(`http_headers = { ${Object.entries(headers).map(([k, v]) => `${toml(k)} = ${toml(v)}`).join(', ')} }`);
        tabs.push({ id: 'codex', label: 'Codex', lang: 'toml', file: '~/.codex/config.toml', code: lines.join('\n') });
    }
    tabs.push(
        { id: 'windsurf', label: 'Windsurf', lang: 'json', file: '~/.codeium/windsurf/mcp_config.json', code: json({ mcpServers: { [key]: withHeaders({ serverUrl: s.url }) } }),
            note: 'Devin Desktop (formerly Windsurf) on macOS/Linux reads ~/.config/devin/mcp_config.json.' },
        { id: 'claude-desktop', label: 'Claude Desktop', lang: 'text', code: s.url, note: 'Settings → Connectors → Add custom connector, then paste this URL.' },
        { id: 'gemini', label: 'Gemini CLI', lang: 'json', file: '.gemini/settings.json',
            code: json({ mcpServers: { [key]: withHeaders({ [s.transport === 'http' ? 'httpUrl' : 'url']: s.url }) } }) },
    );
    return tabs;
}

function agentTabs(s: AgentSpec): InstallTab[] {
    const url = shellQuote(s.rawUrl);
    const file = shellQuote(s.file);
    return [
        // ponytail: one tab; the user-scope variant differs only by directory, so it lives in the note.
        { id: 'claude-code', label: 'Claude Code', lang: 'bash', code: `mkdir -p .claude/agents && curl -fsSL ${url} -o .claude/agents/${file}`,
            note: 'For all projects, use ~/.claude/agents instead of .claude/agents.' },
    ];
}

function pluginTabs(s: PluginSpec): InstallTab[] {
    const id = `${s.plugin}@${s.marketplaceName}`;
    return [
        { id: 'claude-code', label: 'Claude Code (in session)', lang: 'text', code: `/plugin marketplace add ${s.marketplace}\n/plugin install ${id}` },
        { id: 'claude-shell', label: 'Claude Code (shell)', lang: 'bash', code: `claude plugin marketplace add ${s.marketplace}\nclaude plugin install ${shellQuote(id)}` },
    ];
}

export function buildInstallTabs(type: ItemType, slug: string, spec: InstallSpec | null): InstallTab[] {
    if (!spec || spec.type !== type) return [];
    if (spec.type === 'mcp') {
        const key = serverKey(slug);
        return [cliTab(type, slug), ...(spec.transport === 'stdio' ? stdioTabs(key, spec) : remoteTabs(key, spec))];
    }
    if (spec.type === 'agent') return [cliTab(type, slug), ...agentTabs(spec)];
    return [cliTab(type, slug), ...pluginTabs(spec)];
}
