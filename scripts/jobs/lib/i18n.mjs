// Pure helpers for scripts/jobs/translate.mjs. No I/O so `node --test` can run them.
import { createHash } from 'node:crypto';
import { locales, defaultLocale } from '../../../src/i18n/config.ts';

export const PROMPT_VERSION = 'v1';
export const TARGETS = locales.filter((l) => l !== defaultLocale);
const NAMES = new Intl.DisplayNames(['en'], { type: 'language' });
export const langName = (locale) => NAMES.of(locale);

export const sha256 = (s) => createHash('sha256').update(s).digest('hex');
// Spec 6.1: sha256(description + summary + body source). NUL separators keep fields from bleeding into each other.
export const sourceHash = ({ description, summary, body }) => sha256([description ?? '', summary ?? '', body ?? ''].join('\0'));

// ---- masking: things the model must never touch -------------------------------------------
export function mask(text, extra) {
  const tokens = [];
  const put = (m) => { tokens.push(m); return `⟦${tokens.length - 1}⟧`; };
  const out = (extra ? text.replace(extra, put) : text)
    .replace(/^---\n[\s\S]*?\n---\n/, put)          // YAML frontmatter
    .replace(/(```|~~~)[\s\S]*?\1/g, put)           // fenced code
    .replace(/`[^`\n]+`/g, put)                     // inline code
    .replace(/https?:\/\/[^\s)>\]]+/g, put)         // URLs
    .replace(/@[\w.-]+\/[\w.-]+/g, put);            // @owner/skill names
  return { text: out, tokens };
}

// Strict ⟦n⟧ only: a mangled placeholder ("⟦ 1 ⟧") counts as dropped, so the row is rejected, not guessed.
export function unmask(text, tokens) {
  const seen = new Map();
  const out = text.replace(/⟦(\d+)⟧/g, (m, n) => {
    seen.set(+n, (seen.get(+n) ?? 0) + 1);
    return tokens[+n] ?? m;
  });
  const ok = tokens.every((_, i) => seen.get(i) === 1) && [...seen.keys()].every((i) => i < tokens.length);
  return { text: out, ok };
}

// ---- language ID (script + stopword heuristic) ---------------------------------------------
// ponytail: heuristic, reliable for >= 5 words. Upgrade: franc-min if the sample judge flags wrong-language rows that slip through.
const STOP = {
  en: 'the and is of to for with that this you your are can use when it in on a an'.split(' '),
  de: 'der die das und ist mit für nicht ein eine zu von den auf im dem sie wird sich auch oder'.split(' '),
  'pt-BR': 'de que não para uma com os em um é do da no na por mais se como ao'.split(' '),
  es: 'el la de que y en los las para con una un es del se por su como al'.split(' '),
};
const n = (s, re) => (s.match(re) ?? []).length;
const stopRate = (words, lang) => words.filter((w) => STOP[lang].includes(w)).length / words.length;

export function isLang(text, locale) {
  const letters = n(text, /\p{L}/gu) || 1;
  const kana = n(text, /[\p{Script=Hiragana}\p{Script=Katakana}]/gu) / letters;
  const han = n(text, /\p{Script=Han}/gu) / letters;
  if (locale === 'ja') return kana > 0.03 && kana + han > 0.3;
  if (locale === 'zh-CN') return han > 0.3 && kana < 0.03;
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.length < 5) return true; // too short to judge; the other checks still run
  if (locale === 'vi') return n(text, /[ăâđêôơưĂÂĐÊÔƠƯẠ-ỹ]/g) / letters > 0.03 && stopRate(words, 'en') < 0.12;
  const r = stopRate(words, locale);
  return r >= 0.05 && r > stopRate(words, 'en');
}

// ---- checks ----------------------------------------------------------------------------------
const units = (s) => s.length + n(s, /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu); // CJK char ~ 2 Latin chars
const fences = (s) => n(s, /```|~~~/g);

// Returns a list of problems; empty list = pass. srcMasked/outMasked still hold placeholders (code removed).
export function checkField({ srcMasked, outMasked, tokens, locale, dnt }) {
  const problems = [];
  const { text, ok } = unmask(outMasked, tokens);
  if (!ok) problems.push('placeholders dropped or duplicated');
  if (!outMasked.trim()) return [...problems, 'empty'];
  const srcPlain = unmask(srcMasked, tokens).text;
  if (!isLang(outMasked.replace(/⟦\d+⟧/g, ' '), locale)) problems.push(`language-ID is not ${locale}`);
  const us = units(srcMasked);
  if (us >= 20) {
    const ratio = units(outMasked) / us;
    if (ratio < 0.5 || ratio > 2.5) problems.push(`length ratio ${ratio.toFixed(2)} outside 0.5-2.5`);
  }
  if (fences(text) !== fences(srcPlain)) problems.push('code fence count changed');
  for (const t of dnt) if (srcPlain.includes(t) && !text.includes(t)) problems.push(`do-not-translate term lost: ${t}`);
  return problems;
}

// Spec 6.4: skip sources already written in the target language.
export const alreadyIn = (text, locale) => {
  if (!text) return false;
  const enough = locale === 'ja' || locale === 'zh-CN' ? n(text, /\p{L}/gu) >= 15 : n(text, /\p{L}+/gu) >= 5;
  return enough && isLang(text, locale);
};

// ---- prompt ----------------------------------------------------------------------------------
export function buildSystemPrompt(locale, fields, glossary) {
  const terms = Object.entries(glossary.terms[locale] ?? {}).map(([k, v]) => `${k} => ${v}`).join('; ');
  return [
    `You are a professional software-documentation translator. Translate English developer-tool text into ${langName(locale)} for a directory of skills for AI coding agents.`,
    `Return JSON only, with exactly these keys: ${fields.join(', ')}.`,
    'Keep every placeholder like ⟦3⟧ exactly as written, once each, in the same relative order. Never add, remove or reorder them.',
    `Never translate these terms, keep them verbatim: ${glossary.doNotTranslate.join(', ')}.`,
    terms ? `Use these fixed translations: ${terms}.` : '',
    `Register: ${glossary.register[locale]}`,
    'Keep markdown structure (headings, lists, tables, link text). Do not add facts, examples or commentary. Do not wrap output in code fences.',
    'If a field is already written in the target language, return it unchanged.',
  ].filter(Boolean).join('\n');
}

// ---- cost estimate (budget guard for --max-usd) ----------------------------------------------
export const PRICE = { 'gemini-3.1-flash-lite': { in: 0.125, out: 0.75 } }; // USD per 1M tokens, batch (research 04, 2026-10-09)
const OUT_RATIO = { ja: 1.6, 'zh-CN': 1.3, vi: 1.8, de: 1.4, 'pt-BR': 1.3, es: 1.3 };
const OVERHEAD_TOKENS = 450; // system prompt per request

export function estimateUsd(requests, model) {
  const p = PRICE[model] ?? PRICE['gemini-3.1-flash-lite'];
  let tin = 0, tout = 0;
  for (const { chars, locale } of requests) {
    const content = chars / 3.5;
    tin += OVERHEAD_TOKENS + content;
    tout += content * (OUT_RATIO[locale] ?? 1.5);
  }
  return { tokensIn: Math.round(tin), tokensOut: Math.round(tout), usd: (tin * p.in + tout * p.out) / 1e6 };
}
