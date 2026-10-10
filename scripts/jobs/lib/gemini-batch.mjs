// Gemini Batch API over REST (no SDK). https://ai.google.dev/gemini-api/docs/batch-api
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const API = 'https://generativelanguage.googleapis.com';
export const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite';

function apiKey() {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
  return process.env.GEMINI_API_KEY;
}

async function call(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { 'x-goog-api-key': apiKey(), ...init.headers } });
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${url.replace(API, '')} -> ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res;
}
const json = { 'content-type': 'application/json' };

export const requestBody = (prompt, maxOutputTokens) => ({
  contents: [{ parts: [{ text: prompt }] }],
  generation_config: { temperature: 0, max_output_tokens: maxOutputTokens },
});
// An item may carry a full `request` (system instruction, JSON mime type) instead of a plain prompt.
export const toJsonl = (items, maxOutputTokens) =>
  items.map(({ key, prompt, request }) => JSON.stringify({ key, request: request ?? requestBody(prompt, maxOutputTokens) })).join('\n') + '\n';
export const textOf = (response) => response?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? '';
export const stateOf = (b) => b.metadata?.state ?? b.state ?? '';

// Synchronous call (2x batch price): judge samples, UI messages and docs only.
export async function generate(request, model = DEFAULT_MODEL) {
  const res = await call(`${API}/v1beta/models/${model}:generateContent`, { method: 'POST', headers: json, body: JSON.stringify(request) });
  return textOf(await res.json());
}

export function parseResultLines(jsonl) {
  const out = new Map();
  for (const line of jsonl.split('\n')) {
    if (!line.trim()) continue;
    const o = JSON.parse(line);
    out.set(o.key, o.error ? '' : textOf(o.response));
  }
  return out;
}

async function uploadJsonl(text, displayName) {
  const bytes = Buffer.from(text);
  const start = await call(`${API}/upload/v1beta/files`, {
    method: 'POST',
    headers: { ...json, 'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start', 'X-Goog-Upload-Header-Content-Length': String(bytes.length), 'X-Goog-Upload-Header-Content-Type': 'application/jsonl' },
    body: JSON.stringify({ file: { display_name: displayName } }),
  });
  const url = start.headers.get('x-goog-upload-url');
  if (!url) throw new Error('upload start returned no x-goog-upload-url');
  const done = await call(url, { method: 'POST', headers: { 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' }, body: bytes });
  return (await done.json()).file.name; // files/abc123
}

async function createBatch(fileName, displayName, model) {
  const res = await call(`${API}/v1beta/models/${model}:batchGenerateContent`, {
    method: 'POST', headers: json,
    body: JSON.stringify({ batch: { display_name: displayName, input_config: { file_name: fileName } } }),
  });
  const b = await res.json();
  if (!b.name) throw new Error('batch create returned no name: ' + JSON.stringify(b).slice(0, 200));
  return b.name; // batches/123
}

async function waitFor(name, log, everyMs) {
  for (;;) {
    const b = await (await call(`${API}/v1beta/${name}`)).json();
    const state = stateOf(b);
    log(`${name}: ${state}`);
    if (/(SUCCEEDED|FAILED|CANCELLED|EXPIRED)$/.test(state)) {
      if (!/SUCCEEDED$/.test(state)) throw new Error(`${name} ended ${state}`);
      return b;
    }
    await new Promise((r) => setTimeout(r, everyMs));
  }
}

async function results(batch) {
  const file = batch.response?.responsesFile ?? batch.metadata?.output?.responsesFile ?? batch.dest?.fileName;
  if (!file) throw new Error('no responsesFile in batch: ' + JSON.stringify(batch).slice(0, 300));
  return parseResultLines(await (await call(`${API}/download/v1beta/${file}:download?alt=media`)).text());
}

// Submits every chunk first (state file makes a rerun resume instead of re-paying), then waits and merges results.
export async function runBatches(items, { name, model = DEFAULT_MODEL, maxOutputTokens, chunk = 20_000, stateFile, log = console.log, pollMs = 60_000 }) {
  const state = existsSync(stateFile) ? JSON.parse(readFileSync(stateFile, 'utf8')) : {};
  const ids = [];
  for (let i = 0; i < items.length; i += chunk) {
    const part = items.slice(i, i + chunk);
    const id = `${name}:${part[0].key}:${part.length}`;
    ids.push(id);
    if (state[id]) continue;
    const file = await uploadJsonl(toJsonl(part, maxOutputTokens), id.replace(/[^\w-]/g, '-'));
    state[id] = await createBatch(file, id.replace(/[^\w-]/g, '-'), model);
    mkdirSync(dirname(stateFile), { recursive: true });
    writeFileSync(stateFile, JSON.stringify(state, null, 1));
    log(`submitted ${id} -> ${state[id]}`);
  }
  const all = new Map();
  for (const id of ids) for (const [k, v] of await results(await waitFor(state[id], log, pollMs))) all.set(k, v);
  return all;
}
