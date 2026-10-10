import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLlmsTxt } from './llms.ts';

const d = {
  base: 'https://www.agentskills.in', total: 222056,
  categories: [{ id: 'devops', name: 'DevOps', count: 4491 }],
  best: [{ topic: 'code-review', title: 'Best AI Agent Skills for code review' }],
  tools: [{ id: 'claude', name: 'Claude Code' }],
  top: [{ path: '/marketplace/%40a/x', name: 'x', description: 'Does\nX' }],
};

test('llms.txt has H1, blockquote and link sections on the www host', () => {
  const t = buildLlmsTxt(d);
  assert.match(t, /^# Agent Skills\n\n> .*222,056/);
  assert.match(t, /- \[DevOps\]\(https:\/\/www\.agentskills\.in\/categories\/devops\): 4,491 skills/);
  assert.match(t, /\[Best AI Agent Skills for code review\]\(https:\/\/www\.agentskills\.in\/best\/code-review\)/);
  assert.match(t, /\[Claude Code\]\(https:\/\/www\.agentskills\.in\/for\/claude\)/);
  assert.match(t, /\[x\]\(https:\/\/www\.agentskills\.in\/marketplace\/%40a\/x\): Does X/);
  assert.match(t, /\.md/);
  assert.ok(!t.includes('https://agentskills.in'));
});
