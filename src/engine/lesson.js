import { CONDITION_KINDS } from '../sim/conditions.js';

export const STEP_TYPES = ['ack', 'action'];
export const ACTION_TYPES = [
  'icon.select', 'app.open', 'window.minimize', 'window.maximize', 'window.restore', 'window.close',
  'start.open', 'start.toggle', 'explorer.navigate', 'explorer.newFolder', 'explorer.commitRename',
  'explorer.beginRename', 'explorer.search', 'explorer.select', 'explorer.back', 'explorer.up',
  'clipboard.copy', 'clipboard.cut', 'clipboard.paste', 'fs.trash', 'fs.restore', 'notepad.save',
  'notepad.edit', 'guide.ack', 'desktop.click', 'explorer.up', 'explorer.forward',
];

function checkCondition(c, path, errors) {
  if (!c || typeof c !== 'object' || !CONDITION_KINDS.includes(c.kind)) {
    errors.push(`${path}: unknown condition kind "${c?.kind}"`);
    return;
  }
  if (c.kind === 'all' || c.kind === 'any') {
    if (!Array.isArray(c.of)) errors.push(`${path}: "${c.kind}.of" must be an array`);
    else c.of.forEach((x, i) => checkCondition(x, `${path}.of[${i}]`, errors));
  }
  if (c.kind === 'not') checkCondition(c.of, `${path}.of`, errors);
}

// Returns a list of human-readable problems; empty list means the definition is safe to run.
export function validateLesson(def) {
  const errors = [];
  if (!def || typeof def !== 'object') return ['lesson is not an object'];
  if (typeof def.id !== 'string' || !/^[a-z0-9-]+$/.test(def.id)) errors.push('id must be a lowercase slug');
  if (!Number.isInteger(def.version) || def.version < 1) errors.push('version must be a positive integer');
  if (!Array.isArray(def.steps) || def.steps.length === 0) {
    errors.push('steps must be a non-empty array');
    return errors;
  }
  const seen = new Set();
  def.steps.forEach((s, i) => {
    const p = `steps[${i}]`;
    if (!s || typeof s !== 'object') { errors.push(`${p}: not an object`); return; }
    if (typeof s.id !== 'string' || !s.id) errors.push(`${p}: missing id`);
    else if (seen.has(s.id)) errors.push(`${p}: duplicate id "${s.id}"`);
    else seen.add(s.id);
    if (!STEP_TYPES.includes(s.type)) errors.push(`${p}: unknown type "${s.type}"`);
    if (s.type === 'action') {
      const types = s.expect ? [].concat(s.expect.type) : [];
      if (!types.length || types.some((t) => !ACTION_TYPES.includes(t))) errors.push(`${p}: expect.type "${s.expect?.type}" is not a supported action`);
      for (const a of s.allow ?? []) if (!ACTION_TYPES.includes(a)) errors.push(`${p}: allow contains unsupported action "${a}"`);
      if (s.hints !== undefined && (!Number.isInteger(s.hints) || s.hints < 0 || s.hints > 5)) errors.push(`${p}: hints must be an integer 0-5`);
    }
    if (s.check) checkCondition(s.check, `${p}.check`, errors);
    if (s.requires) checkCondition(s.requires, `${p}.requires`, errors);
    for (const r of s.recover ?? []) {
      if (!r || typeof r.type !== 'string') errors.push(`${p}: invalid recover action`);
    }
    for (const m of s.mismatch ?? []) {
      if (!m || typeof m.key !== 'string' || typeof m.when?.type !== 'string') errors.push(`${p}: invalid mismatch rule`);
    }
  });
  return errors;
}

// Flatten nested content into dot-keys ("a.b.0.c"). Used to compare locales.
export function flattenKeys(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') out.push(...flattenKeys(v, key));
    else out.push(key);
  }
  return out;
}

// Keys a lesson requires in each language's content.
export function requiredContentKeys(def) {
  const keys = ['title', 'summary'];
  for (const s of def.steps) {
    keys.push(`steps.${s.id}.title`, `steps.${s.id}.message`);
    for (let i = 0; i < (s.hints ?? 0); i++) keys.push(`steps.${s.id}.hints.${i}`);
    for (const m of s.mismatch ?? []) keys.push(`steps.${s.id}.wrong.${m.key}`);
  }
  return keys;
}

// Returns missing keys for a language's content block (lesson-level content object).
export function findMissingContent(def, content) {
  const have = new Set(flattenKeys(content));
  return requiredContentKeys(def).filter((k) => !have.has(k));
}
