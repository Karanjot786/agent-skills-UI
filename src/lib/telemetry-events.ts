const EVENTS = ['install', 'search', 'check', 'update', 'command'];
const KEY_RE = /^[A-Za-z0-9@._\/-]{1,100}$/;

// Daily counts only: (event, skill|command) and (agent). Never query text, args or IP.
export function parseTelemetry(p: URLSearchParams): Array<[string, string]> | null {
    const event = p.get('event');
    if (!event || !EVENTS.includes(event)) return null;
    if (p.get('ci') === '1') return [];
    const key = p.get('skill') ?? p.get('command') ?? '';
    const rows: Array<[string, string]> = [[event, KEY_RE.test(key) ? key : '']];
    const agent = p.get('agent');
    if (agent && KEY_RE.test(agent)) rows.push(['agent', agent]);
    return rows;
}
