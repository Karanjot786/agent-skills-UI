export interface LlmsData {
  base: string; total: number;
  categories: { id: string; name: string; count: number }[];
  best: { topic: string; title: string }[];
  tools: { id: string; name: string }[];
  top: { path: string; name: string; description: string }[];
}

export function buildLlmsTxt(d: LlmsData): string {
  const u = (p: string) => d.base + p;
  const one = (s: string) => s.replace(/\s+/g, ' ').trim();
  return `# Agent Skills

> Directory and CLI for ${d.total.toLocaleString('en-US')} open-source skills (SKILL.md instruction files) for Claude Code, Cursor, GitHub Copilot, Codex, Gemini CLI, Windsurf, Cline and 40+ AI coding agents. Install any skill with \`npx agent-skills-cli install @owner/name\`.

## Main pages

- [Marketplace](${u('/marketplace')}): all skills, most starred first, paginated
- [Categories](${u('/categories')}): skills grouped by topic
- [Documentation](${u('/docs')}): CLI commands and skill authoring
- [Full documentation](${u('/llms-full.txt')}): complete CLI reference as plain text
- [CLI on npm](https://www.npmjs.com/package/agent-skills-cli): \`npm install -g agent-skills-cli\`
- [GitHub](https://github.com/Karanjot786/agent-skills-cli): source and issues

## Categories

${d.categories.map((c) => `- [${c.name}](${u(`/categories/${c.id}`)}): ${c.count.toLocaleString('en-US')} skills`).join('\n')}

## Best-of guides

${d.best.map((b) => `- [${b.title}](${u(`/best/${b.topic}`)})`).join('\n') || '- (none yet)'}

## By tool

${d.tools.map((t) => `- [${t.name}](${u(`/for/${t.id}`)}): skills and install commands for ${t.name}`).join('\n')}

## URL patterns

- Skill page: ${u('/marketplace/@owner/name')}
- Raw markdown of any skill page: ${u('/marketplace/@owner/name.md')}
- Author page: ${u('/authors/owner')}
- Category page: ${u('/categories/{category-id}')}
- JSON API: ${u('/api/skills?search=jira&limit=10')}

## Top ${d.top.length} skills by GitHub stars

${d.top.map((s) => `- [${s.name}](${u(s.path)}): ${one(s.description) || 'Agent skill'}`).join('\n')}
`;
}
