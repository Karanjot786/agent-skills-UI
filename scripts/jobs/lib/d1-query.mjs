import { execFileSync } from 'node:child_process';

export function parseWranglerJson(stdout) {
  return JSON.parse(stdout.slice(stdout.indexOf('[')))[0].results;
}

export function query(sql, { remote = false } = {}) {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'agentskills-db', remote ? '--remote' : '--local', '--json', '--command', sql],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return parseWranglerJson(out);
}
