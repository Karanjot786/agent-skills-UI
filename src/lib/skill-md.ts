import { skillPath } from './site.ts';

export interface MdSkill {
  name: string; scoped_name: string; author: string; description: string | null; stars: number;
  github_url: string; updated_at: string | null; content: string | null;
}

// Body capped at 25K like the HTML page.
export function skillMarkdown(s: MdSkill, summary: string | null, base: string): string {
  const url = base + skillPath(s.scoped_name);
  const lead = (summary ?? s.description ?? '').replace(/\s+/g, ' ').trim();
  return [
    `# ${s.name}`, '',
    `> ${lead}`, '',
    `- Author: [@${s.author}](${base}/authors/${encodeURIComponent(s.author)})`,
    `- GitHub stars: ${s.stars}`,
    ...(s.updated_at ? [`- Updated: ${s.updated_at.slice(0, 10)}`] : []),
    `- Source: ${s.github_url}`,
    `- Page: ${url}`, '',
    '## Install', '', '```bash', `npx agent-skills-cli install ${s.scoped_name}`, '```', '',
    ...(s.content ? ['## SKILL.md', '', s.content.slice(0, 25_000)] : []), '',
  ].join('\n');
}
