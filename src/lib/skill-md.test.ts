import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skillMarkdown } from './skill-md.ts';

const s = { name: 'jira-search', scoped_name: '@a/jira-search', author: 'a', description: 'Search\nJira', stars: 9,
  github_url: 'https://github.com/a/r', updated_at: '2026-07-04T02:36:47.772Z', content: '# Body\n' + 'x'.repeat(40_000) };

test('markdown has title, summary quote, install block and capped body', () => {
  const md = skillMarkdown(s, 'Does X. Use when Y.', 'https://www.agentskills.in');
  assert.match(md, /^# jira-search\n\n> Does X\. Use when Y\.\n/);
  assert.match(md, /```bash\nnpx agent-skills-cli install @a\/jira-search\n```/);
  assert.match(md, /Page: https:\/\/www\.agentskills\.in\/marketplace\/%40a\/jira-search/);
  assert.match(md, /Updated: 2026-07-04/);
  assert.ok(md.length < 31_000);
});

test('falls back to description and omits body when content is null', () => {
  const md = skillMarkdown({ ...s, content: null }, null, 'https://x');
  assert.match(md, /> Search Jira\n/);
  assert.ok(!md.includes('## SKILL.md'));
});
