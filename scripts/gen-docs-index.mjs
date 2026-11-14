// Build-time docs index: Workers have no runtime fs, so inline content/docs into src/generated/docs-index.json.
// English at content/docs/*.mdx; translations at content/docs/<locale>/<slug>.mdx (+ faq.json).
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = path.join(process.cwd(), 'content', 'docs');
const OUT = path.join(process.cwd(), 'src', 'generated', 'docs-index.json');

const readDir = (dir) => (fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []);
const parse = (file, slug) => {
    const { data, content } = matter(fs.readFileSync(file, 'utf-8'));
    return {
        slug,
        title: data.title || slug,
        order: data.order || 0,
        icon: data.icon || 'terminal',
        description: data.description || '',
        commands: data.commands || [],
        content,
    };
};

const slugs = readDir(ROOT).filter((d) => d.isFile() && d.name.endsWith('.mdx')).map((d) => d.name.slice(0, -4)).sort();
const locales = readDir(ROOT).filter((d) => d.isDirectory()).map((d) => d.name).sort();

const docs = { en: Object.fromEntries(slugs.map((s) => [s, parse(path.join(ROOT, `${s}.mdx`), s)])) };
const faq = {};
const enFaq = path.join(ROOT, 'faq.json');
if (fs.existsSync(enFaq)) faq.en = JSON.parse(fs.readFileSync(enFaq, 'utf-8'));
for (const l of locales) {
    docs[l] = {};
    for (const d of readDir(path.join(ROOT, l))) {
        if (d.isFile() && d.name.endsWith('.mdx')) docs[l][d.name.slice(0, -4)] = parse(path.join(ROOT, l, d.name), d.name.slice(0, -4));
    }
    const f = path.join(ROOT, l, 'faq.json');
    if (fs.existsSync(f)) faq[l] = JSON.parse(fs.readFileSync(f, 'utf-8'));
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ slugs, docs, faq }));
console.log(`docs-index: ${slugs.length} slugs, locales: en${locales.length ? ',' + locales.join(',') : ''}`);
