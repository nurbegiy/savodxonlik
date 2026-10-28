import { simReducer } from './reducer.js';
import { createInitialSimState } from './seed.js';

// Tiny synchronous store. Each dispatched action receives a monotonically
// increasing `seq`, which lets the guide ignore duplicate deliveries.
export function createSimStore(initial = createInitialSimState()) {
  let state = initial;
  let seq = 0;
  const subs = new Set();
  const actionSubs = new Set();

  return {
    getState: () => state,
    getSeq: () => seq,
    dispatch(action) {
      const stamped = { ...action, seq: ++seq };
      state = simReducer(state, stamped);
      actionSubs.forEach((fn) => fn(stamped, state));
      subs.forEach((fn) => fn());
      return stamped;
    },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    // Fires with (action, nextState) BEFORE render subscribers — used by the guide.
    onAction(fn) { actionSubs.add(fn); return () => actionSubs.delete(fn); },
  };
}
