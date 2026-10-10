import { cache } from 'react';
import { getDb } from './db';

export interface TranslationRow { locale: string; description: string | null; summary: string | null; body: string | null; translated_at: string }

// One query per page: every translation of a skill (locales for hreflang + the row for the current locale).
// ponytail: item translation getters arrive with the item pages that need them (item_i18n table already exists).
export const getSkillTranslations = cache(async (seq: number): Promise<TranslationRow[]> =>
    (await getDb().prepare('SELECT locale, description, summary, body, translated_at FROM skill_i18n WHERE skill_seq = ?')
        .bind(seq).all<TranslationRow>()).results);
