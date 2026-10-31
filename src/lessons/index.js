import { ch1 } from './ch1/definition.js';
import { ch2 } from './ch2/definition.js';
import { ch3 } from './ch3/definition.js';
import { ch5 } from './ch5/definition.js';
import ch1uz from './ch1/uz.js';
import ch1ru from './ch1/ru.js';
import ch1en from './ch1/en.js';
import ch2uz from './ch2/uz.js';
import ch2ru from './ch2/ru.js';
import ch2en from './ch2/en.js';
import ch3uz from './ch3/uz.js';
import ch3ru from './ch3/ru.js';
import ch3en from './ch3/en.js';
import ch5uz from './ch5/uz.js';
import ch5ru from './ch5/ru.js';
import ch5en from './ch5/en.js';
import { validateLesson, findMissingContent } from '../engine/lesson.js';

export const LANGS = ['uz', 'ru', 'en'];

// Registry of published lessons. Definitions are language-independent; copy is per language.
export const LESSONS = [
  { def: ch1, content: { uz: ch1uz, ru: ch1ru, en: ch1en } },
  { def: ch2, content: { uz: ch2uz, ru: ch2ru, en: ch2en } },
  { def: ch3, content: { uz: ch3uz, ru: ch3ru, en: ch3en } },
  { def: ch5, content: { uz: ch5uz, ru: ch5ru, en: ch5en } },
];

// Published lessons in teaching order; each one requires the previous (matches the DB seed).
export const sortedLessons = () => [...LESSONS].sort((a, b) => a.def.order - b.def.order);
export const nextLesson = (id) => { const s = sortedLessons(); const i = s.findIndex((l) => l.def.id === id); return i >= 0 ? s[i + 1] ?? null : null; };

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
