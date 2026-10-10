#!/usr/bin/env node
// Offline translation pipeline (spec 6.4). Never runs on the request path. Needs GEMINI_API_KEY (never printed).
//   skills   --wave 1|2|3|3b --locales a,b [--limit N] [--max-usd 25] [--dry] [--apply] [--remote]
//            select rows, mask, Gemini batch (resumable), checks + 2% judge gate, SQL files; --apply writes D1.
//            --dry prints the selection and cost estimate only. A small real run (--limit 10, no --apply) is the sample.
//   messages --locales de,pt-BR   translate messages/en.json (UI strings)
//   docs     --locales ja,zh-CN   translate content/docs/*.mdx (+ faq.json if present) into content/docs/<locale>/
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import matter from 'gray-matter';
import { query } from './lib/d1-query.mjs';
import { writeSqlChunks, applySqlFiles, sqlValue } from './lib/d1.mjs';
import { runBatches, generate } from './lib/gemini-batch.mjs';
import { PROMPT_VERSION, TARGETS, sourceHash, mask, unmask, alreadyIn, checkField, buildSystemPrompt, estimateUsd } from './lib/i18n.mjs';

const MODEL = process.env.TRANSLATE_MODEL ?? 'gemini-3.1-flash-lite'; // stable id per ai.google.dev/gemini-api/docs/models, 2026-10-09
const JUDGE = process.env.JUDGE_MODEL ?? 'gemini-3.8-flash';
const STATE = 'scripts/jobs/.state';
const glossary = JSON.parse(readFileSync(new URL('./i18n-glossary.json', import.meta.url), 'utf8'));
// top = rows by stars; bodyTop = how many of those also get the body translated
const WAVES = { '1': { top: 500, bodyTop: 0 }, '2': { top: 2000, bodyTop: 0 }, '3': { top: 22000, bodyTop: 0 }, '3b': { top: 2000, bodyTop: 2000 } };
const BODY_CHARS = 12_000;

const { values: o, positionals: [cmd] } = parseArgs({ allowPositionals: true, options: {
  wave: { type: 'string', default: '1' }, locales: { type: 'string', default: 'ja,zh-CN' }, limit: { type: 'string' },
  'max-usd': { type: 'string', default: '25' }, dry: { type: 'boolean' }, apply: { type: 'boolean' }, remote: { type: 'boolean' },
} });
const die = (m) => { console.error(m); process.exit(1); };
const remote = !!o.remote;
const locales = o.locales.split(',').map((s) => s.trim());
// messages/docs may target a locale before it joins src/i18n/config.ts (D7 adds de/pt-BR with their message files).
if (cmd === 'skills') for (const l of locales) if (!TARGETS.includes(l)) die(`unsupported locale ${l} (targets: ${TARGETS.join(', ')})`);
const parseJson = (t) => JSON.parse(t.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, ''));
const jsonRequest = (system, user, temperature = 0.2) => ({
  system_instruction: { parts: [{ text: system }] },
  contents: [{ role: 'user', parts: [{ text: user }] }],
  generation_config: { response_mime_type: 'application/json', temperature },
});

// ---------- selection ----------------------------------------------------------------------------
async function selectRows(wave) {
  const { top, bodyTop } = WAVES[wave] ?? die(`unknown wave ${wave}`);
  const n = Math.min(top, Number(o.limit ?? top));
  // ponytail: one query, top-N by stars (<= 22K rows, offline); highest-starred row per scoped_name.
  const rows = await query(`SELECT s.seq, s.scoped_name, s.description,
      (SELECT summary FROM skill_summaries m WHERE m.skill_seq = s.seq) AS summary,
      ${bodyTop ? `substr(s.content, 1, ${BODY_CHARS})` : 'NULL'} AS body
    FROM skills s
    WHERE s.indexable = 1 AND s.scoped_name IS NOT NULL AND instr(s.scoped_name, '.') = 0 AND instr(s.scoped_name, '//') = 0
      AND s.seq = (SELECT x.seq FROM skills x WHERE x.scoped_name = s.scoped_name ORDER BY x.stars DESC, x.indexable DESC LIMIT 1)
    ORDER BY s.stars DESC, s.seq LIMIT ${n}`, { remote });
  return rows.map((r, i) => ({ ...r, wantBody: i < bodyTop }));
}

// item: { key, seq, scoped, locale, hash, fields: { name: { srcMasked, tokens } }, chars }
async function buildItems(wave) {
  const rows = await selectRows(wave);
  const items = [];
  const skipped = { upToDate: 0, alreadyTarget: 0, empty: 0 };
  for (const locale of locales) {
    const have = new Map((await query(`SELECT skill_seq, source_hash, body IS NOT NULL AS has_body FROM skill_i18n WHERE locale = ${sqlValue(locale)}`, { remote }))
      .map((r) => [r.skill_seq, r]));
    for (const r of rows) {
      const src = { description: r.description ?? '', summary: r.summary ?? '', body: r.wantBody ? (r.body ?? '') : '' };
      if (!src.description.trim()) { skipped.empty++; continue; }
      const hash = sourceHash(src);
      const ex = have.get(r.seq);
      if (ex && (ex.source_hash === hash || (ex.has_body && !r.wantBody))) { skipped.upToDate++; continue; }
      if (alreadyIn(src.description, locale)) { skipped.alreadyTarget++; continue; }
      const fields = {};
      for (const [name, text] of Object.entries(src)) if (text.trim()) { const m = mask(text); fields[name] = { srcMasked: m.text, tokens: m.tokens }; }
      items.push({ key: `${r.seq}:${locale}`, seq: r.seq, scoped: r.scoped_name, locale, hash, fields,
        chars: Object.values(fields).reduce((n, f) => n + f.srcMasked.length, 0) });
    }
  }
  return { items, skipped, rowCount: rows.length };
}

// Every field must pass every check, otherwise the row is not written (spec 6.4).
function verify(p, parsed) {
  const out = {}, problems = [];
  for (const [name, f] of Object.entries(p.fields)) {
    const t = parsed?.[name];
    if (typeof t !== 'string') { problems.push(`${name}: missing`); continue; }
    const pr = checkField({ srcMasked: f.srcMasked, outMasked: t, tokens: f.tokens, locale: p.locale, dnt: glossary.doNotTranslate });
    if (pr.length) problems.push(...pr.map((x) => `${name}: ${x}`)); else out[name] = unmask(t, f.tokens).text;
  }
  return { ok: problems.length === 0, out, problems };
}

// Stronger model rates a 2% sample (>= 10 rows); gate: mean >= 4 and no score below 3, else the locale writes nothing.
async function judge(locale, accepted) {
  const sample = accepted.filter((_, i) => i % 50 === 0 || accepted.length < 50).slice(0, Math.max(10, Math.ceil(accepted.length * 0.02)));
  const scores = [];
  for (let i = 0; i < sample.length; i += 10) {
    const group = sample.slice(i, i + 10).map((s, j) => ({ id: j, english: s.p.fields.description?.srcMasked, translation: s.out.description }));
    scores.push(...parseJson(await generate(jsonRequest(
      `Rate each ${locale} translation of an English developer-tool description from 1 (wrong/unusable) to 5 (native, accurate). Placeholders like ⟦0⟧ are expected. Return JSON: [{"id":number,"score":number,"issue":string}].`,
      JSON.stringify(group), 0), JUDGE)));
  }
  const mean = scores.reduce((n, s) => n + s.score, 0) / (scores.length || 1);
  const min = Math.min(...scores.map((s) => s.score), 5);
  return { n: scores.length, mean, min, pass: scores.length > 0 && mean >= 4 && min >= 3, issues: scores.filter((s) => s.score < 4).map((s) => s.issue) };
}

async function skills() {
  const { items, skipped, rowCount } = await buildItems(o.wave);
  const est = estimateUsd(items.map((p) => ({ chars: p.chars, locale: p.locale })), MODEL);
  console.log(JSON.stringify({ wave: o.wave, model: MODEL, locales, rowsSelected: rowCount, requests: items.length, skipped, estimatedUsd: Number(est.usd.toFixed(2)) }));
  if (o.dry || !items.length) return;
  if (est.usd > Number(o['max-usd'])) die(`estimated $${est.usd.toFixed(2)} exceeds --max-usd ${o['max-usd']}`);

  const answers = await runBatches(items.map((p) => ({
    key: p.key,
    request: jsonRequest(buildSystemPrompt(p.locale, Object.keys(p.fields), glossary), JSON.stringify(Object.fromEntries(Object.entries(p.fields).map(([k, f]) => [k, f.srcMasked])))),
  })), { name: `i18n-w${o.wave}-${locales.join('+')}`, model: MODEL, chunk: 5000, stateFile: join(STATE, `translate-w${o.wave}-${locales.join('+')}.json`) });

  const accepted = [], rejects = [];
  for (const p of items) {
    let v; try { v = verify(p, parseJson(answers.get(p.key) ?? '')); } catch (e) { v = { ok: false, problems: [`bad JSON: ${e.message}`] }; }
    v.ok ? accepted.push({ p, out: v.out }) : rejects.push({ key: p.key, problems: v.problems });
    if (items.length <= 20) console.log(`${v.ok ? 'PASS' : 'FAIL'} ${p.locale} ${p.scoped}${v.ok ? `\n   ${v.out.description.slice(0, 120)}` : '\n   ' + v.problems.join('\n   ')}`);
  }
  const stmts = [], report = {};
  const now = new Date().toISOString();
  for (const locale of locales) {
    const mine = accepted.filter((a) => a.p.locale === locale);
    if (!mine.length) { report[locale] = { accepted: 0 }; continue; }
    const j = await judge(locale, mine);
    report[locale] = { accepted: mine.length, judge: { n: j.n, mean: Number(j.mean.toFixed(2)), min: j.min, pass: j.pass } };
    if (!j.pass) { console.error(`${locale}: judge gate FAILED (mean ${j.mean.toFixed(2)}, min ${j.min}); no rows written. Issues: ${j.issues.slice(0, 5).join(' | ')}`); continue; }
    for (const { p, out } of mine) {
      const s = `INSERT OR REPLACE INTO skill_i18n (skill_seq,locale,description,summary,body,source_hash,model,prompt_version,translated_at) VALUES (${[
        p.seq, p.locale, out.description ?? null, out.summary ?? null, out.body ?? null, p.hash, MODEL, PROMPT_VERSION, now].map(sqlValue).join(',')});`;
      Buffer.byteLength(s) < 95_000 ? stmts.push(s) : rejects.push({ key: p.key, problems: ['statement too large'] });
    }
  }
  const dir = join(STATE, `sql-w${o.wave}-${locales.join('+')}`);
  mkdirSync(dir, { recursive: true });
  const files = stmts.length ? writeSqlChunks(stmts, dir) : [];
  writeFileSync(join(dir, 'rejects.json'), JSON.stringify(rejects, null, 1));
  console.log(JSON.stringify({ report, rows: stmts.length, rejected: rejects.length, sqlDir: dir, files: files.length }));
  if (o.apply && files.length) { applySqlFiles(files, { remote }); console.log(`applied ${files.length} files${remote ? ' (remote)' : ' (local)'}`); }
  else if (files.length) console.log('not applied (add --apply; rerun resumes the stored batches, no second charge)');
}

// ---------- map translation (UI messages, docs, FAQ) ---------------------------------------------
async function translateMap(map, locale, extraMask) {
  const masked = {}, toks = {};
  for (const [k, v] of Object.entries(map)) { const m = mask(v, extraMask); masked[k] = m.text; toks[k] = m.tokens; }
  const keys = Object.keys(map);
  const sys = buildSystemPrompt(locale, ['<every input key>'], glossary).replace('exactly these keys: <every input key>', 'exactly the same keys as the input object');
  const out = {};
  for (let i = 0; i < keys.length; i += 60) {
    const part = Object.fromEntries(keys.slice(i, i + 60).map((k) => [k, masked[k]]));
    for (let attempt = 0; ; attempt++) {
      const raw = await generate(jsonRequest(sys, JSON.stringify(part)), MODEL); // API errors propagate; only bad JSON is retried
      let parsed; try { parsed = parseJson(raw); } catch { parsed = {}; }
      const bad = [];
      for (const k of Object.keys(part)) {
        const t = parsed[k];
        if (typeof t !== 'string') { bad.push(`${k}: missing`); continue; }
        if (t === part[k]) { out[k] = unmask(t, toks[k]).text; continue; } // brand strings may stay identical
        const pr = checkField({ srcMasked: part[k], outMasked: t, tokens: toks[k], locale, dnt: glossary.doNotTranslate });
        pr.length ? bad.push(`${k}: ${pr.join(', ')}`) : (out[k] = unmask(t, toks[k]).text);
      }
      if (!bad.length) break;
      if (attempt >= 2) die(`${locale}: checks failed after 3 attempts:\n${bad.join('\n')}`);
      console.error(`${locale}: retrying ${bad.length} keys`);
      for (const k of Object.keys(part)) if (out[k] !== undefined) delete part[k];
    }
  }
  return out;
}
const flatten = (obj, p = '') => Object.entries(obj).flatMap(([k, v]) => typeof v === 'object' && v ? flatten(v, `${p}${k}.`) : [[`${p}${k}`, v]]);
const unflatten = (pairs) => pairs.reduce((acc, [k, v]) => { k.split('.').reduce((n, s, i, a) => (n[s] ??= i === a.length - 1 ? v : {}), acc); return acc; }, {});
const ICU = /\{[^}]+\}|<\/?[a-z][^>]*>/g;

async function messages() {
  const en = Object.fromEntries(flatten(JSON.parse(readFileSync('messages/en.json', 'utf8'))));
  for (const locale of locales) {
    const done = await translateMap(en, locale, ICU);
    writeFileSync(`messages/${locale}.json`, JSON.stringify(unflatten(Object.keys(en).map((k) => [k, done[k]])), null, 4) + '\n');
    console.log(`messages/${locale}.json written (${Object.keys(en).length} keys)`);
  }
}

async function docs() {
  const dir = 'content/docs';
  for (const locale of locales) {
    mkdirSync(join(dir, locale), { recursive: true });
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.mdx'))) {
      const { data, content } = matter(readFileSync(join(dir, f), 'utf8'));
      const t = await translateMap({ title: data.title ?? '', description: data.description ?? '', body: content }, locale);
      writeFileSync(join(dir, locale, f), matter.stringify(t.body, { ...data, title: t.title, description: t.description }));
      console.log(`${locale}/${f}`);
    }
    // ponytail: FAQ translated as one JSON string (keys, arrays and icons kept by the JSON structure itself).
    if (existsSync(join(dir, 'faq.json'))) {
      const t = await translateMap({ faq: readFileSync(join(dir, 'faq.json'), 'utf8') }, locale);
      writeFileSync(join(dir, locale, 'faq.json'), JSON.stringify(JSON.parse(t.faq), null, 2) + '\n');
      console.log(`${locale}/faq.json`);
    }
  }
}

const commands = { skills, messages, docs };
(commands[cmd] ?? (() => die(`usage: translate.mjs <${Object.keys(commands).join('|')}> [--wave 1|2|3|3b] [--locales a,b] [--limit N] [--max-usd N] [--dry] [--apply] [--remote]`)))().catch((e) => die(e.stack ?? String(e)));
