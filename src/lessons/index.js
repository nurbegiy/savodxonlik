import { ch1 } from './ch1/definition.js';
import { ch2 } from './ch2/definition.js';
import ch1uz from './ch1/uz.js';
import ch1ru from './ch1/ru.js';
import ch1en from './ch1/en.js';
import ch2uz from './ch2/uz.js';
import ch2ru from './ch2/ru.js';
import ch2en from './ch2/en.js';
import { validateLesson, findMissingContent } from '../engine/lesson.js';

export const LANGS = ['uz', 'ru', 'en'];

// Registry of published lessons. Definitions are language-independent; copy is per language.
export const LESSONS = [
  { def: ch1, content: { uz: ch1uz, ru: ch1ru, en: ch1en } },
  { def: ch2, content: { uz: ch2uz, ru: ch2ru, en: ch2en } },
];

export const getLessonEntry = (id) => LESSONS.find((l) => l.def.id === id) ?? null;

// Content lookup that never silently shows a raw key: returns null when missing.
export function getStepContent(entry, lang, stepId) {
  return entry.content[lang]?.steps?.[stepId] ?? entry.content.uz?.steps?.[stepId] ?? null;
}

// Development-time check: reports invalid definitions and missing translations.
export function auditLessons() {
  const problems = [];
  for (const { def, content } of LESSONS) {
    for (const e of validateLesson(def)) problems.push(`${def.id}: ${e}`);
    for (const lang of LANGS) {
      if (!content[lang]) { problems.push(`${def.id}: missing language ${lang}`); continue; }
      for (const k of findMissingContent(def, content[lang])) problems.push(`${def.id}/${lang}: missing "${k}"`);
    }
  }
  return problems;
}
