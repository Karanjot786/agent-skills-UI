// Prompts and output checks shared by the AI batch jobs (categorize, summaries). Flags: use node:util parseArgs.
import { createHash } from 'node:crypto';

const clean = (s, n) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);

export function categoryPrompt(catLines, r) {
  return `Pick the single best category id for this AI agent skill. Reply with the id only.\n\nCategories:\n${catLines}\n\nSkill: ${r.name}\nDescription: ${clean(r.d, 240)}`;
}

export function parseCategory(text, ids) {
  const t = String(text).trim().toLowerCase().replace(/^["'`]+|["'`.]+$/g, '');
  return ids.includes(t) ? t : null;
}

export function summaryPrompt(r) {
  return `Write a 40-60 word summary of this AI agent skill as exactly three sentences.
1. What it does (start with "${r.name}").
2. When to use it (name one concrete situation).
3. How to install: "Install with npx agent-skills-cli install ${r.scoped_name}."
Use only facts in the text below. No marketing words. Plain text, no markdown.

Name: ${r.name}
Description: ${clean(r.d, 300)}
SKILL.md (start): ${clean(r.head, 1500)}`;
}

export function validSummary(text, scoped) {
  const t = String(text).trim();
  const words = t.split(/\s+/).length;
  return words >= 35 && words <= 75 && t.includes(`npx agent-skills-cli install ${scoped}`) && !/[#*`]/.test(t);
}

export const sourceHash = (r) => createHash('sha1').update([r.name, r.d, r.head].join('\n')).digest('hex').slice(0, 16);
