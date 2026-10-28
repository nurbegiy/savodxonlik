import { describe, it, expect } from 'vitest';
import uz from '../locales/uz.js';
import ru from '../locales/ru.js';
import en from '../locales/en.js';
import { flattenKeys } from '../../engine/lesson.js';

describe('UI locales', () => {
  const base = flattenKeys(uz).sort();
  it.each([['ru', ru], ['en', en]])('%s has exactly the same keys as uz', (_n, loc) => {
    const keys = flattenKeys(loc).sort();
    expect(base.filter((k) => !keys.includes(k))).toEqual([]);
    expect(keys.filter((k) => !base.includes(k))).toEqual([]);
  });
  it('no empty strings', () => {
    for (const loc of [uz, ru, en]) {
      const walk = (o) => Object.values(o).forEach((v) => (typeof v === 'object' ? walk(v) : expect(String(v).trim()).not.toBe('')));
      walk(loc);
    }
  });
});
