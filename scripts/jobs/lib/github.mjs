// GitHub access for offline jobs (never on the request path). Token: GITHUB_TOKEN (repo secret GH_INDEX_TOKEN in Actions).
// Raw file bodies come from raw.githubusercontent.com, which does not count against REST limits.
export const UA = 'agentskills-in-indexer/1.0 (+https://www.agentskills.in)';
const API = 'https://api.github.com';
const SEARCH_GAP_MS = 6_700;      // code/repo search: stay under 9 requests/minute
const MAX_WAIT_MS = 20 * 60_000;  // fail the run rather than sleep past the Action timeout
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function headers(extra = {}) {
  const h = { 'User-Agent': UA, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...extra };
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
}

export async function gh(path, init = {}) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(`${API}${path}`, { ...init, headers: headers(init.headers) });
    if (res.status !== 403 && res.status !== 429) return res;
    const remaining = res.headers.get('x-ratelimit-remaining');
    const reset = Number(res.headers.get('x-ratelimit-reset') ?? 0) * 1000;
    const retryAfter = Number(res.headers.get('retry-after') ?? 0) * 1000;
    if (res.status === 403 && remaining !== '0' && !retryAfter) return res; // real 403 (blocked/DMCA repo), not a limit
    const wait = Math.max(retryAfter, remaining === '0' ? reset - Date.now() : 0, attempt * 30_000);
    if (wait > MAX_WAIT_MS) throw new Error(`GitHub rate limit: next window in ${Math.round(wait / 1000)}s`);
    console.warn(`GitHub ${res.status} on ${path.split('?')[0]}, waiting ${Math.round(wait / 1000)}s`);
    await sleep(wait + 1000);
  }
  throw new Error(`GitHub ${path.split('?')[0]}: still rate-limited after 5 attempts`);
}

const REPO_FIELDS = 'nameWithOwner isFork createdAt pushedAt stargazerCount licenseInfo { spdxId } defaultBranchRef { name target { oid } }';

// 100 repos per GraphQL query: ~260 queries for all 25.8K known repos.
export async function repoMeta(fullNames) {
  const out = new Map();
  for (let i = 0; i < fullNames.length; i += 100) {
    const chunk = fullNames.slice(i, i + 100);
    const body = chunk.map((n, j) => {
      const [owner, name] = n.split('/');
      return `r${j}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { ${REPO_FIELDS} }`;
    }).join('\n');
    const res = await gh('/graphql', { method: 'POST', body: JSON.stringify({ query: `query {\n${body}\n}` }), headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);
    const json = await res.json();
    if (!json.data) throw new Error(`GitHub GraphQL: ${json.errors?.[0]?.message ?? 'no data'}`);
    // NOT_FOUND repos come back as null data + an errors entry: expected (deleted/private), not fatal.
    chunk.forEach((n, j) => {
      const r = json.data[`r${j}`];
      out.set(n, r ? {
        fullName: r.nameWithOwner, isFork: r.isFork, createdAt: r.createdAt, pushedAt: r.pushedAt,
        stars: r.stargazerCount, license: r.licenseInfo?.spdxId ?? null,
        branch: r.defaultBranchRef?.name ?? null, headSha: r.defaultBranchRef?.target?.oid ?? null,
      } : null);
    });
    if (i && i % 5000 === 0) console.log(`repoMeta: ${i}/${fullNames.length}`);
  }
  return out;
}

// Tree by commit sha is immutable: no ETag needed, we only call this when the head sha changed.
export async function treePaths(repo, sha) {
  const res = await gh(`/repos/${repo}/git/trees/${sha}?recursive=1`);
  if (res.status === 404 || res.status === 409) return null; // gone or empty repo
  if (!res.ok) throw new Error(`tree ${repo}: ${res.status}`);
  const t = await res.json();
  if (t.truncated) console.warn(`tree ${repo}: truncated (>100K entries), scanning partial list`);
  return t.tree.filter((e) => e.type === 'blob').map((e) => e.path);
}

export async function raw(repo, ref, path) {
  const url = `https://raw.githubusercontent.com/${repo}/${ref}/${path.split('/').map(encodeURIComponent).join('/')}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.text();
    if (res.status === 404) return null;
    if (res.status === 429 || res.status >= 500) { await sleep(attempt * 5000); continue; }
    return null;
  }
  return null;
}

let lastSearchAt = 0;
export async function search(kind, q, page = 1) {
  const wait = lastSearchAt + SEARCH_GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastSearchAt = Date.now();
  const res = await gh(`/search/${kind}?q=${encodeURIComponent(q)}&per_page=100&page=${page}`);
  if (res.status === 422) return []; // past the 1,000-result window
  if (!res.ok) throw new Error(`search ${kind} "${q}" p${page}: ${res.status}`);
  const { items } = await res.json();
  return items.map((it) => (kind === 'code' ? it.repository.full_name : it.full_name));
}

export async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) { const k = next++; out[k] = await fn(items[k], k); }
  }));
  return out;
}
