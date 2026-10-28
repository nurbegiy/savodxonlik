import {
  ROOT_ID, TRASH_ID, children, getNode, createNode, renameNode, updateContent, copyNode, moveNode,
  trashNode, restoreNode, deleteForever, emptyTrash, uniqueName, displayName, validateName, isTrashed,
} from './fs.js';
import { createInitialSimState, isValidSimState } from './seed.js';

// Actions that never count as "a decision" by the learner (the guide ignores them).
export const NEUTRAL_ACTIONS = new Set([
  'window.focus', 'window.move', 'ctx.close', 'start.close', 'sim.load', 'sim.reset', 'guide.ack', 'explorer.cancelRename',
]);

const APPS = { explorer: { w: 760, h: 440 }, notepad: { w: 480, h: 360 } };

function updateWindow(state, id, fn) {
  return { ...state, windows: state.windows.map((w) => (w.id === id ? fn(w) : w)) };
}
const getWindow = (state, id) => state.windows.find((w) => w.id === id) ?? null;

function bringToFront(state, id) {
  const z = state.zCounter + 1;
  return { ...updateWindow(state, id, (w) => ({ ...w, z })), zCounter: z, activeWindowId: id };
}

function topVisibleWindowId(state, excludeId) {
  const vis = state.windows.filter((w) => w.id !== excludeId && w.mode !== 'minimized');
  if (!vis.length) return null;
  return vis.reduce((a, b) => (a.z > b.z ? a : b)).id;
}

function explorerProps(folderId) {
  return { folderId, history: [folderId], index: 0, selection: [], editing: null, renameError: null, query: '' };
}

function openWindow(state, app, props = {}) {
  const winCounter = state.winCounter + 1;
  const id = `w${winCounter}`;
  const size = APPS[app] ?? APPS.explorer;
  const offset = (state.windows.length % 5) * 28;
  const base = app === 'explorer' ? explorerProps(props.folderId ?? ROOT_ID) : { fileId: props.fileId ?? null, text: props.text ?? '', dirty: false, saveError: null };
  const win = {
    id, app, mode: 'normal', prevMode: 'normal', z: 0,
    x: 130 + offset, y: 24 + offset, w: size.w, h: size.h,
    props: base,
  };
  const next = { ...state, windows: [...state.windows, win], winCounter, startOpen: false, contextMenu: null };
  return bringToFront(next, id);
}

function navigate(w, folderId) {
  if (w.props.folderId === folderId) return w;
  const history = [...w.props.history.slice(0, w.props.index + 1), folderId];
  return {
    ...w,
    props: { ...w.props, folderId, history, index: history.length - 1, selection: [], editing: null, renameError: null, query: '' },
  };
}

function withFs(state, result) {
  return result.fs ? { ...state, fs: result.fs } : state;
}

export function simReducer(state, action) {
  switch (action.type) {
    // ---- desktop -------------------------------------------------------
    case 'desktop.click':
      return { ...state, desktop: { ...state.desktop, selectedIcon: null }, startOpen: false, contextMenu: null };
    case 'icon.select':
      return { ...state, desktop: { ...state.desktop, selectedIcon: action.iconId }, startOpen: false, contextMenu: null };

    // ---- windows -------------------------------------------------------
    case 'app.open': {
      const icon = action.iconId ? state.desktop.icons.find((i) => i.id === action.iconId) : null;
      const props = { ...(icon?.folderId ? { folderId: icon.folderId } : {}), ...(action.props ?? {}) };
      return openWindow(state, action.app, props);
    }
    case 'window.focus': {
      if (!getWindow(state, action.id)) return state;
      return { ...bringToFront(state, action.id), startOpen: false };
    }
    case 'window.minimize': {
      const w = getWindow(state, action.id);
      if (!w || w.mode === 'minimized') return state;
      const next = updateWindow(state, action.id, (x) => ({ ...x, prevMode: x.mode, mode: 'minimized' }));
      return { ...next, activeWindowId: topVisibleWindowId(next, action.id) };
    }
    case 'window.maximize': {
      const w = getWindow(state, action.id);
      if (!w || w.mode === 'maximized') return state;
      return bringToFront(updateWindow(state, action.id, (x) => ({ ...x, prevMode: 'normal', mode: 'maximized' })), action.id);
    }
    case 'window.restore': {
      const w = getWindow(state, action.id);
      if (!w) return state;
      const target = w.mode === 'minimized' ? w.prevMode : 'normal';
      return bringToFront(updateWindow(state, action.id, (x) => ({ ...x, mode: target, prevMode: 'normal' })), action.id);
    }
    case 'window.close': {
      if (!getWindow(state, action.id)) return state;
      const next = { ...state, windows: state.windows.filter((w) => w.id !== action.id), contextMenu: null };
      return { ...next, activeWindowId: next.activeWindowId === action.id ? topVisibleWindowId(next) : next.activeWindowId };
    }
    case 'window.move': {
      const w = getWindow(state, action.id);
      if (!w || w.mode !== 'normal') return state;
      return updateWindow(state, action.id, (x) => ({ ...x, x: Math.round(action.x), y: Math.round(action.y) }));
    }

    // ---- start menu / context menu --------------------------------------
    case 'start.toggle': return { ...state, startOpen: !state.startOpen, contextMenu: null };
    case 'start.open': return { ...state, startOpen: true, contextMenu: null };
    case 'start.close': return { ...state, startOpen: false };
    case 'ctx.open':
      return { ...state, contextMenu: { x: action.x, y: action.y, kind: action.kind, targetId: action.targetId ?? null, windowId: action.windowId ?? null }, startOpen: false };
    case 'ctx.close': return state.contextMenu ? { ...state, contextMenu: null } : state;

    // ---- explorer navigation / selection ---------------------------------
    case 'explorer.navigate': {
      const target = getNode(state.fs, action.folderId);
      if (!target || target.type !== 'folder') return state;
      return updateWindow(state, action.windowId, (w) => (w.app === 'explorer' ? navigate(w, action.folderId) : w));
    }
    case 'explorer.back':
      return updateWindow(state, action.windowId, (w) => {
        if (w.app !== 'explorer' || w.props.index <= 0) return w;
        const index = w.props.index - 1;
        return { ...w, props: { ...w.props, index, folderId: w.props.history[index], selection: [], editing: null, query: '' } };
      });
    case 'explorer.forward':
      return updateWindow(state, action.windowId, (w) => {
        if (w.app !== 'explorer' || w.props.index >= w.props.history.length - 1) return w;
        const index = w.props.index + 1;
        return { ...w, props: { ...w.props, index, folderId: w.props.history[index], selection: [], editing: null, query: '' } };
      });
    case 'explorer.up':
      return updateWindow(state, action.windowId, (w) => {
        if (w.app !== 'explorer') return w;
        const cur = getNode(state.fs, w.props.folderId);
        if (!cur?.parentId) return w;
        return navigate(w, cur.parentId);
      });
    case 'explorer.select':
      return { ...updateWindow(state, action.windowId, (w) => ({ ...w, props: { ...w.props, selection: action.ids } })), contextMenu: null, startOpen: false };
    case 'explorer.search':
      return updateWindow(state, action.windowId, (w) => ({ ...w, props: { ...w.props, query: String(action.query ?? '').slice(0, 80), selection: [] } }));

    // ---- explorer file operations ----------------------------------------
    case 'explorer.newFolder': {
      const w = getWindow(state, action.windowId);
      if (!w || w.app !== 'explorer') return state;
      const parent = getNode(state.fs, w.props.folderId);
      if (!parent || parent.type !== 'folder' || isTrashed(state.fs, parent.id) || parent.id === TRASH_ID) return state;
      const name = uniqueName(state.fs, parent.id, action.name || 'New folder');
      const created = createNode(state.fs, { parentId: parent.id, type: 'folder', name });
      return {
        ...state, fs: created.fs, contextMenu: null,
        windows: state.windows.map((x) => x.id === w.id
          ? { ...x, props: { ...x.props, query: '', selection: [created.id], editing: { id: created.id, isNew: true }, renameError: null } }
          : x),
      };
    }
    case 'explorer.beginRename': {
      const node = getNode(state.fs, action.id);
      if (!node || node.system) return state;
      return { ...updateWindow(state, action.windowId, (w) => ({ ...w, props: { ...w.props, selection: [action.id], editing: { id: action.id, isNew: false }, renameError: null } })), contextMenu: null };
    }
    case 'explorer.commitRename': {
      const node = getNode(state.fs, action.id);
      if (!node) return state;
      const result = renameNode(state.fs, action.id, action.name);
      if (result.error) {
        return updateWindow(state, action.windowId, (w) => ({ ...w, props: { ...w.props, renameError: result.error } }));
      }
      return updateWindow({ ...state, fs: result.fs }, action.windowId, (w) => ({ ...w, props: { ...w.props, editing: null, renameError: null } }));
    }
    case 'explorer.cancelRename':
      return updateWindow(state, action.windowId, (w) => ({ ...w, props: { ...w.props, editing: null, renameError: null } }));

    // ---- clipboard -------------------------------------------------------
    case 'clipboard.copy':
    case 'clipboard.cut': {
      const ids = (action.ids ?? []).filter((id) => { const n = getNode(state.fs, id); return n && !n.system; });
      if (!ids.length) return state;
      return { ...state, clipboard: { mode: action.type === 'clipboard.copy' ? 'copy' : 'cut', ids }, contextMenu: null };
    }
    case 'clipboard.paste': {
      const cb = state.clipboard;
      const dest = getNode(state.fs, action.destId);
      if (!cb || !dest || dest.type !== 'folder' || dest.id === TRASH_ID || isTrashed(state.fs, dest.id)) return { ...state, contextMenu: null };
      let fs = state.fs;
      const newIds = [];
      for (const id of cb.ids) {
        if (!getNode(fs, id) || isTrashed(fs, id)) continue;
        const res = cb.mode === 'copy' ? copyNode(fs, id, dest.id) : moveNode(fs, id, dest.id);
        if (res.error) continue;
        fs = res.fs;
        newIds.push(res.newId);
      }
      const clipboard = cb.mode === 'cut' ? null : cb;
      const next = { ...state, fs, clipboard, contextMenu: null };
      if (!action.windowId) return next;
      return updateWindow(next, action.windowId, (w) => ({ ...w, props: { ...w.props, selection: newIds } }));
    }

    // ---- delete / restore -------------------------------------------------
    case 'fs.trash': {
      let fs = state.fs;
      for (const id of action.ids ?? []) fs = trashNode(fs, id);
      const clipboard = state.clipboard && state.clipboard.ids.some((id) => isTrashed(fs, id) && !isTrashed(state.fs, id)) ? null : state.clipboard;
      const windows = state.windows.map((w) => (w.app === 'explorer' ? { ...w, props: { ...w.props, selection: w.props.selection.filter((id) => !isTrashed(fs, id)) } } : w));
      return { ...state, fs, clipboard, windows, contextMenu: null };
    }
    case 'fs.restore': {
      let fs = state.fs;
      for (const id of action.ids ?? []) fs = restoreNode(fs, id, 'documents').fs;
      const windows = state.windows.map((w) => (w.app === 'explorer' ? { ...w, props: { ...w.props, selection: [] } } : w));
      return { ...state, fs, windows, contextMenu: null };
    }
    case 'fs.deleteForever': {
      let fs = state.fs;
      for (const id of action.ids ?? []) fs = deleteForever(fs, id);
      const windows = state.windows.map((w) => (w.app === 'explorer' ? { ...w, props: { ...w.props, selection: [] } } : w));
      return { ...state, fs, windows, contextMenu: null };
    }
    case 'fs.emptyTrash':
      return { ...state, fs: emptyTrash(state.fs), contextMenu: null };

    // ---- notepad ------------------------------------------------------------
    case 'notepad.edit':
      return updateWindow(state, action.windowId, (w) => ({ ...w, props: { ...w.props, text: String(action.text ?? '').slice(0, 20000), dirty: true, saveError: null } }));
    case 'notepad.save': {
      const w = getWindow(state, action.windowId);
      if (!w || w.app !== 'notepad') return state;
      if (w.props.fileId && getNode(state.fs, w.props.fileId)) {
        const fs = updateContent(state.fs, w.props.fileId, w.props.text);
        return updateWindow({ ...state, fs }, w.id, (x) => ({ ...x, props: { ...x.props, dirty: false, saveError: null } }));
      }
      const folderId = action.folderId ?? 'documents';
      const err = validateName(state.fs, folderId, action.name);
      if (err) return updateWindow(state, w.id, (x) => ({ ...x, props: { ...x.props, saveError: err } }));
      const created = createNode(state.fs, { parentId: folderId, type: 'file', name: action.name.trim(), content: w.props.text });
      return updateWindow({ ...state, fs: created.fs }, w.id, (x) => ({ ...x, props: { ...x.props, fileId: created.id, dirty: false, saveError: null } }));
    }

    // ---- system ---------------------------------------------------------------
    case 'sim.reset': return createInitialSimState();
    case 'sim.load': return isValidSimState(action.state) ? action.state : state;
    default:
      return state;
  }
}

export { children, displayName };
