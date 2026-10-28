import { children, displayName, isTrashed, TRASH_ID } from './fs.js';

// Declarative, JSON-serialisable conditions (no executable code in lesson data).
export const CONDITION_KINDS = [
  'all', 'any', 'not',
  'window.exists', 'window.mode', 'explorer.at', 'start.open',
  'fs.exists', 'fs.trashed', 'clipboard.has', 'notepad.text', 'desktop.selected', 'explorer.query',
  'explorer.atName', 'explorer.selectedName', 'explorer.renaming',
];

const lower = (s) => String(s ?? '').toLowerCase();

export function evaluate(cond, state) {
  if (!cond) return true;
  switch (cond.kind) {
    case 'all': return cond.of.every((c) => evaluate(c, state));
    case 'any': return cond.of.some((c) => evaluate(c, state));
    case 'not': return !evaluate(cond.of, state);
    case 'window.exists':
      return state.windows.some((w) => w.app === cond.app && (cond.folderId === undefined || w.props.folderId === cond.folderId));
    case 'window.mode':
      return state.windows.some((w) => w.app === cond.app && w.mode === cond.mode);
    case 'explorer.at':
      return state.windows.some((w) => w.app === 'explorer' && w.mode !== 'minimized' && w.props.folderId === cond.folderId);
    case 'start.open': return state.startOpen === (cond.value ?? true);
    case 'fs.exists': {
      return Object.values(state.fs.nodes).some(
        (n) => !n.system && lower(displayName(n)) === lower(cond.name) &&
          (cond.type === undefined || n.type === cond.type) &&
          (cond.parent === undefined || n.parentId === cond.parent) &&
          (cond.parentName === undefined || lower(displayName(state.fs.nodes[n.parentId] ?? {})) === lower(cond.parentName)) &&
          !isTrashed(state.fs, n.id),
      );
    }
    case 'fs.trashed':
      return children(state.fs, TRASH_ID).some((n) => lower(displayName(n)) === lower(cond.name));
    case 'clipboard.has': {
      const cb = state.clipboard;
      if (!cb) return false;
      if (cond.mode && cb.mode !== cond.mode) return false;
      return cb.ids.some((id) => lower(displayName(state.fs.nodes[id] ?? {})) === lower(cond.name));
    }
    case 'notepad.text':
      return state.windows.some((w) => w.app === 'notepad' && String(w.props.text).trim().length >= (cond.minLength ?? 1));
    case 'explorer.query':
      return state.windows.some((w) => w.app === 'explorer' && lower(w.props.query).includes(lower(cond.contains)));
    case 'explorer.atName':
      return state.windows.some((w) => w.app === 'explorer' && w.mode !== 'minimized' &&
        lower(displayName(state.fs.nodes[w.props.folderId] ?? {})) === lower(cond.name));
    case 'explorer.selectedName':
      return state.windows.some((w) => w.app === 'explorer' &&
        w.props.selection.some((id) => lower(displayName(state.fs.nodes[id] ?? {})) === lower(cond.name)));
    case 'explorer.renaming':
      return state.windows.some((w) => w.app === 'explorer' && !!w.props.editing);
    case 'desktop.selected': return state.desktop.selectedIcon === cond.iconId;
    default: return false;
  }
}

// Does a dispatched action satisfy a step's `expect` pattern?
// All keys except `type`, `nameEquals` are compared by strict equality.
export function matchAction(expect, action) {
  if (!expect || ![].concat(expect.type).includes(action.type)) return false;
  for (const [k, v] of Object.entries(expect)) {
    if (k === 'type') continue;
    if (k === 'nameEquals') {
      if (lower(String(action.name ?? '').trim()) !== lower(v)) return false;
    } else if (k === 'queryIncludes') {
      if (!lower(action.query).includes(lower(v))) return false;
    } else if (k === 'name') {
      if (lower(action.name) !== lower(v)) return false;
    } else if (action[k] !== v) return false;
  }
  return true;
}
