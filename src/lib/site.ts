export const SITE_URL = 'https://www.agentskills.in';

export function absoluteUrl(path: string): string {
    return SITE_URL + (path && !path.startsWith('/') ? '/' : '') + path;
}
