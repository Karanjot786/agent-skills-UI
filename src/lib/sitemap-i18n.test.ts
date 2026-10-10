import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localeUrlsetXml } from './sitemap-i18n.ts';

const opts = { base: 'https://www.agentskills.in', defaultLocale: 'en', order: ['en', 'ja', 'zh-CN', 'vi', 'de', 'pt-BR', 'es'] };

test('locale url lists self + en + sibling translations + x-default, nothing else', () => {
    const xml = localeUrlsetXml('ja', [{ scoped_name: '@anthropics/xlsx', updated_at: '2026-09-30T10:00:00Z', locales: 'zh-CN,ja' }], opts);
    assert.match(xml, /<loc>https:\/\/www\.agentskills\.in\/ja\/marketplace\/%40anthropics\/xlsx<\/loc>/);
    assert.match(xml, /<lastmod>2026-09-30<\/lastmod>/);
    for (const l of ['en', 'ja', 'zh-CN', 'x-default']) assert.match(xml, new RegExp(`hreflang="${l}"`));
    for (const l of ['vi', 'de', 'pt-BR', 'es']) assert.doesNotMatch(xml, new RegExp(`hreflang="${l}"`));
    assert.match(xml, /hreflang="x-default" href="https:\/\/www\.agentskills\.in\/marketplace\/%40anthropics\/xlsx"/);
});

test('missing locales column still self-references; null lastmod is omitted', () => {
    const xml = localeUrlsetXml('de', [{ scoped_name: '@a/b', updated_at: null, locales: null }], opts);
    assert.match(xml, /hreflang="de" href="https:\/\/www\.agentskills\.in\/de\/marketplace\/%40a\/b"/);
    assert.doesNotMatch(xml, /lastmod/);
});
