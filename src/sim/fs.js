// Pure, immutable virtual file-system helpers.
// A filesystem is { nodes: { [id]: Node }, nextId: number }.
// Node: { id, name, nameKey?, type: 'folder'|'file', parentId, content, trashedFrom, system? }
// Trashed items keep their subtree; only the top item gets parentId = TRASH_ID.

export const ROOT_ID = 'thispc';
export const TRASH_ID = 'trash';
export const MAX_NAME = 120;
const INVALID_CHARS = /[\\/:*?"<>|]/;

export function children(fs, parentId) {
  return Object.values(fs.nodes)
    .filter((n) => n.parentId === parentId)
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return displayName(a).localeCompare(displayName(b), undefined, { numeric: true, sensitivity: 'base' });
    });
}

// Name used for sorting and comparisons when no translator is available.
export function displayName(node) {
  return node.name ?? node.nameKey ?? node.id;
}

export function getNode(fs, id) {
  return fs.nodes[id] ?? null;
}

export function pathOf(fs, id) {
  const path = [];
  let cur = fs.nodes[id];
  const guard = new Set();
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    path.unshift(cur.id);
    cur = cur.parentId ? fs.nodes[cur.parentId] : null;
  }
  return path;
}

export function isTrashed(fs, id) {
  const path = pathOf(fs, id);
  return path[0] === TRASH_ID || path.includes(TRASH_ID);
}

export function isDescendant(fs, id, ancestorId) {
  if (id === ancestorId) return true;
  return pathOf(fs, id).includes(ancestorId);
}

export function validateName(fs, parentId, name, ignoreId = null) {
  const trimmed = String(name ?? '').trim();
  if (!trimmed) return 'empty';
  if (trimmed.length > MAX_NAME || INVALID_CHARS.test(trimmed) || trimmed === '.' || trimmed === '..') return 'invalid';
  const clash = children(fs, parentId).some(
    (n) => n.id !== ignoreId && displayName(n).toLowerCase() === trimmed.toLowerCase(),
  );
  return clash ? 'exists' : null;
}

export function uniqueName(fs, parentId, base) {
  const taken = new Set(children(fs, parentId).map((n) => displayName(n).toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  const dot = base.lastIndexOf('.');
  const stem = dot > 0 ? base.slice(0, dot) : base;
  const ext = dot > 0 ? base.slice(dot) : '';
  for (let i = 2; i < 10000; i++) {
    const candidate = `${stem} (${i})${ext}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return `${stem} (${Date.now()})${ext}`;
}

export function createNode(fs, { parentId, type, name, content = '' }) {
  const id = `n${fs.nextId}`;
  const node = { id, name, type, parentId, content: type === 'file' ? content : '', trashedFrom: null };
  return { fs: { nodes: { ...fs.nodes, [id]: node }, nextId: fs.nextId + 1 }, id };
}

export function renameNode(fs, id, newName) {
  const node = fs.nodes[id];
  if (!node || node.system) return { error: 'invalid' };
  const error = validateName(fs, node.parentId, newName, id);
  if (error) return { error };
  return { fs: { ...fs, nodes: { ...fs.nodes, [id]: { ...node, name: newName.trim() } } } };
}

export function updateContent(fs, id, content) {
  const node = fs.nodes[id];
  if (!node || node.type !== 'file') return fs;
  return { ...fs, nodes: { ...fs.nodes, [id]: { ...node, content } } };
}

function collectSubtree(fs, id) {
  const out = [id];
  for (const child of children(fs, id)) out.push(...collectSubtree(fs, child.id));
  return out;
}

// Deep-copy `id` (and its subtree) into destId. Returns { fs, newId } or { error }.
export function copyNode(fs, id, destId) {
  const src = fs.nodes[id];
  const dest = fs.nodes[destId];
  if (!src || !dest || dest.type !== 'folder' || src.system) return { error: 'invalid' };
  if (destId === TRASH_ID || isTrashed(fs, destId)) return { error: 'invalid' };
  if (src.type === 'folder' && isDescendant(fs, destId, id)) return { error: 'into-self' };

  let next = fs;
  const clone = (nodeId, parentId, forceName) => {
    const n = next.nodes[nodeId];
    const name = forceName ?? n.name;
    const created = createNode(next, { parentId, type: n.type, name, content: n.content });
    next = created.fs;
    if (n.type === 'folder') {
      for (const ch of children(fs, nodeId)) clone(ch.id, created.id);
    }
    return created.id;
  };
  const newId = clone(id, destId, uniqueName(fs, destId, displayName(src)));
  return { fs: next, newId };
}

export function moveNode(fs, id, destId) {
  const src = fs.nodes[id];
  const dest = fs.nodes[destId];
  if (!src || !dest || dest.type !== 'folder' || src.system) return { error: 'invalid' };
  if (destId === TRASH_ID || isTrashed(fs, destId)) return { error: 'invalid' };
  if (src.parentId === destId) return { fs, newId: id, unchanged: true };
  if (src.type === 'folder' && isDescendant(fs, destId, id)) return { error: 'into-self' };
  const name = uniqueName(fs, destId, displayName(src));
  return {
    fs: { ...fs, nodes: { ...fs.nodes, [id]: { ...src, parentId: destId, name } } },
    newId: id,
  };
}

export function trashNode(fs, id) {
  const node = fs.nodes[id];
  if (!node || node.system || isTrashed(fs, id)) return fs;
  return {
    ...fs,
    nodes: { ...fs.nodes, [id]: { ...node, parentId: TRASH_ID, trashedFrom: node.parentId } },
  };
}

// Restores to the previous location when it still exists (and is not trashed),
// otherwise falls back to `fallbackId`. Returns { fs, restoredTo, fellBack }.
export function restoreNode(fs, id, fallbackId = 'documents') {
  const node = fs.nodes[id];
  if (!node || node.parentId !== TRASH_ID) return { fs, restoredTo: null, fellBack: false };
  const prev = node.trashedFrom && fs.nodes[node.trashedFrom];
  const ok = prev && prev.type === 'folder' && !isTrashed(fs, prev.id);
  const dest = ok ? prev.id : fallbackId;
  const name = uniqueName(fs, dest, displayName(node));
  return {
    fs: { ...fs, nodes: { ...fs.nodes, [id]: { ...node, parentId: dest, trashedFrom: null, name } } },
    restoredTo: dest,
    fellBack: !ok,
  };
}

export function deleteForever(fs, id) {
  const node = fs.nodes[id];
  if (!node || node.system || node.parentId !== TRASH_ID) return fs;
  const doomed = new Set(collectSubtree(fs, id));
  const nodes = {};
  for (const [k, v] of Object.entries(fs.nodes)) if (!doomed.has(k)) nodes[k] = v;
  return { ...fs, nodes };
}

export function emptyTrash(fs) {
  let next = fs;
  for (const n of children(fs, TRASH_ID)) next = deleteForever(next, n.id);
  return next;
}

export function searchNodes(fs, query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return [];
  return Object.values(fs.nodes).filter(
    (n) => !n.system && !isTrashed(fs, n.id) && displayName(n).toLowerCase().includes(q),
  );
}

export function findByName(fs, name, parentId) {
  const lower = String(name).toLowerCase();
  return Object.values(fs.nodes).find(
    (n) =>
      !n.system &&
      displayName(n).toLowerCase() === lower &&
      (parentId === undefined || n.parentId === parentId),
  ) ?? null;
}
