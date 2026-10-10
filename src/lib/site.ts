export const SITE_URL = 'https://www.agentskills.in';

export function absoluteUrl(path: string): string {
    return SITE_URL + (path && !path.startsWith('/') ? '/' : '') + path;
}

// Canonical skill URL path: one encoding of each segment (@ -> %40) shared by pages, canonicals and sitemaps.
export const skillPath = (scopedName: string) => `/marketplace/${scopedName.split('/').map(encodeURIComponent).join('/')}`;
