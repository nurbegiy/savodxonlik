import { createContext, useCallback, useContext, useRef, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

// ---- Explicit target registry (no global DOM selectors) ----------------------
export function createTargetRegistry() {
  const map = new Map(); // id -> element[]
  const subs = new Set();
  const emit = () => subs.forEach((f) => f());
  return {
    register(id, el) {
      const list = map.get(id) ?? [];
      if (!list.includes(el)) list.push(el);
      map.set(id, list);
      emit();
    },
    unregister(id, el) {
      const list = (map.get(id) ?? []).filter((x) => x !== el);
      if (list.length) map.set(id, list); else map.delete(id);
      emit();
    },
    get(id) {
      const list = map.get(id);
      return list?.length ? list[list.length - 1] : null;
    },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
}

const SimCtx = createContext(null);
export const SimProvider = SimCtx.Provider;
export const useSim = () => useContext(SimCtx);

// Returns a ref callback that registers an element as a guide target.
export function useTarget(id) {
  const { registry } = useSim();
  const elRef = useRef(null);
  return useCallback((el) => {
    if (el) { elRef.current = el; if (id) registry.register(id, el); }
    else if (elRef.current) { if (id) registry.unregister(id, elRef.current); elRef.current = null; }
  }, [id, registry]);
}

export function useSimState(store) {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

// Localised label for a filesystem node (system folders carry a translation key).
export function useNodeLabel() {
  const { t } = useTranslation();
  return useCallback((node) => (node?.nameKey ? t(node.nameKey) : node?.name ?? ''), [t]);
}

// Click-count activation that works with mouse, touch and keyboard:
// first click selects, a second click within `ms` activates.
export function useActivate(onSelect, onOpen, ms = 450) {
  const last = useRef(0);
  return {
    onClick(e) {
      e.stopPropagation();
      const now = performance.now();
      if (now - last.current < ms) { last.current = 0; onOpen(e); }
      else { last.current = now; onSelect(e); }
    },
    onKeyDown(e) {
      if (e.key === 'Enter') { e.preventDefault(); onOpen(e); }
      else if (e.key === ' ') { e.preventDefault(); onSelect(e); }
    },
  };
}
