import { evaluate, matchAction } from '../sim/conditions.js';
import { NEUTRAL_ACTIONS } from '../sim/reducer.js';
import { isValidSimState } from '../sim/seed.js';
import { validateLesson } from './lesson.js';

// Guide statuses: ready -> explaining | awaiting_action -> (validating) -> completed
// plus: paused, blocked. `validating` is entered and resolved synchronously inside
// one event; it is exposed in `lastTransitions` for tests and diagnostics.
export const STATUS = {
  READY: 'ready',
  EXPLAINING: 'explaining',
  AWAITING: 'awaiting_action',
  VALIDATING: 'validating',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  PAUSED: 'paused',
};

export const CHECKPOINT_VERSION = 1;
const TYPING_ACTIONS = new Set(['explorer.search', 'notepad.edit']);

/**
 * Creates a guided-lesson controller bound to a sim store.
 * It is framework-free: no React, no DOM — testable on its own.
 */
export function createGuide(lesson, store, { onCheckpoint } = {}) {
  const errors = validateLesson(lesson);
  if (errors.length) {
    return { ok: false, errors };
  }

  const steps = lesson.steps;
  const initialSim = store.getState();
  const subs = new Set();

  let g = {
    status: STATUS.READY,
    stepIndex: 0,
    completedSteps: [],
    hintLevel: 0,        // how many hints were revealed for the current step
    hintsUsed: 0,
    mistakes: 0,
    feedback: null,      // { kind: 'wrong'|'hint'|'success'|'blocked', key, nonce }
    replayNonce: 0,
    lastSeq: 0,
    lastTransitions: [],
    pausedFrom: null,
  };
  let nonce = 0;
  let softTimer = null;
  const clearSoft = () => { if (softTimer) { clearTimeout(softTimer); softTimer = null; } };

  const emit = () => { subs.forEach((fn) => fn()); };
  const set = (patch) => { g = { ...g, ...patch }; emit(); };
  const stepAt = (i) => steps[i];

  function enterStep(index, transitions = []) {
    if (index >= steps.length) {
      transitions.push(STATUS.COMPLETED);
      g = { ...g, stepIndex: steps.length, status: STATUS.COMPLETED, hintLevel: 0, lastTransitions: transitions };
      return;
    }
    const step = stepAt(index);
    g = { ...g, stepIndex: index, hintLevel: 0 };

    // Expected initial state: if unmet, try the step's declared recovery actions.
    if (step.requires && !evaluate(step.requires, store.getState())) {
      for (const a of step.recover ?? []) store.dispatch({ ...a, silent: true });
      if (!evaluate(step.requires, store.getState())) {
        transitions.push(STATUS.BLOCKED);
        g = { ...g, status: STATUS.BLOCKED, feedback: { kind: 'blocked', key: 'guide.blocked', nonce: ++nonce }, lastTransitions: transitions };
        return;
      }
    }
    const status = step.type === 'ack' ? STATUS.EXPLAINING : STATUS.AWAITING;
    transitions.push(status);
    g = { ...g, status, lastTransitions: transitions };
  }

  function completeStep(step, transitions) {
    // Idempotent: a step can only be completed while it is the current one.
    if (stepAt(g.stepIndex)?.id !== step.id || g.completedSteps.includes(step.id)) return;
    transitions.push(STATUS.VALIDATING);
    g = { ...g, completedSteps: [...g.completedSteps, step.id], feedback: { kind: 'success', key: null, nonce: ++nonce } };
    enterStep(g.stepIndex + 1, transitions);
  }

  function findMismatchRule(step, action) {
    return (step.mismatch ?? []).find((rule) => matchAction(rule.when, action)) ?? null;
  }

  function handleAction(action, nextState) {
    if (action.silent || NEUTRAL_ACTIONS.has(action.type)) return;
    clearSoft();
    if (g.status !== STATUS.AWAITING && g.status !== STATUS.EXPLAINING) return;
    if (action.seq <= g.lastSeq) return; // duplicate / replayed delivery
    g = { ...g, lastSeq: action.seq };

    const step = stepAt(g.stepIndex);
    if (!step || step.type !== 'action') return;

    const transitions = [g.status];
    const matches = matchAction(step.expect, action);
    // Harmless actions a step explicitly tolerates (e.g. selecting a file before clicking Copy).
    if (!matches && (step.allow ?? []).includes(action.type)) return;
    if (matches) {
      if (!step.check || evaluate(step.check, nextState)) {
        completeStep(step, transitions);
        emit();
        onCheckpoint?.();
        return;
      }
      if (TYPING_ACTIONS.has(action.type)) return; // still typing: not an error
      g = { ...g, mistakes: g.mistakes + 1, feedback: { kind: 'wrong', key: `steps.${step.id}.wrong.check`, fallbackKey: 'guide.checkFailed', nonce: ++nonce }, lastTransitions: transitions };
      emit();
      return;
    }
    // Typing in a text field is not a decision: ignore until the final value matches.
    if (TYPING_ACTIONS.has(action.type)) return;

    const rule = findMismatchRule(step, action);
    const applyWrong = () => {
      if (stepAt(g.stepIndex)?.id !== step.id || g.status !== STATUS.AWAITING) return;
      g = {
        ...g, mistakes: g.mistakes + 1, lastTransitions: transitions,
        feedback: { kind: 'wrong', key: rule ? `steps.${step.id}.wrong.${rule.key}` : 'guide.wrongDefault', fallbackKey: 'guide.wrongDefault', nonce: ++nonce },
      };
      emit();
    };
    // "soft" rules wait briefly: the first click of a double-click must not look like an error.
    if (rule?.soft) { softTimer = setTimeout(applyWrong, 550); return; }
    applyWrong();
  }

  // Some steps are satisfied by state alone after an unrelated action (e.g. the user closed
  // the window with Alt+F4 rather than clicking). Not used by chapter 1/2, kept minimal.

  const unsubscribe = store.onAction(handleAction);

  const api = {
    ok: true,
    lesson,
    getState: () => g,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    destroy() { clearSoft(); unsubscribe(); subs.clear(); },
    currentStep: () => stepAt(g.stepIndex) ?? null,
    // Exposed for tests and for transports that may redeliver events (e.g. a remote sync).
    deliver: (action, nextState) => handleAction(action, nextState),

    start() {
      if (g.status !== STATUS.READY) return;
      g = { ...g, lastSeq: store.getSeq() };
      enterStep(0, [STATUS.READY]);
      emit();
    },

    // Acknowledge an `ack` (explanation-only) step. Action steps cannot be skipped this way.
    ack() {
      const step = stepAt(g.stepIndex);
      if (g.status !== STATUS.EXPLAINING || !step || step.type !== 'ack') return false;
      g = { ...g, lastSeq: store.getSeq() };
      completeStep(step, [STATUS.EXPLAINING]);
      emit();
      onCheckpoint?.();
      return true;
    },

    // Reveals the next hint. Never mutates the sim and never completes the step.
    hint() {
      const step = stepAt(g.stepIndex);
      if (g.status !== STATUS.AWAITING || !step) return;
      const max = step.hints ?? 0;
      const level = Math.min(g.hintLevel + 1, Math.max(max, 1));
      set({
        hintLevel: level,
        hintsUsed: g.hintsUsed + 1,
        feedback: max === 0
          ? { kind: 'hint', key: 'guide.noHint', nonce: ++nonce }
          : { kind: 'hint', key: `steps.${step.id}.hints.${level - 1}`, nonce: ++nonce },
      });
    },

    replay() { set({ replayNonce: g.replayNonce + 1, feedback: null }); },
    dismissFeedback() { if (g.feedback) set({ feedback: null }); },

    pause() {
      if (g.status !== STATUS.AWAITING && g.status !== STATUS.EXPLAINING) return;
      set({ status: STATUS.PAUSED, pausedFrom: g.status });
    },
    resume() {
      if (g.status !== STATUS.PAUSED) return;
      g = { ...g, lastSeq: store.getSeq() };
      set({ status: g.pausedFrom ?? STATUS.AWAITING, pausedFrom: null });
    },

    // Retry current step: re-apply recovery for its starting state.
    retryStep() {
      const step = stepAt(g.stepIndex);
      if (!step) return;
      for (const a of step.recover ?? []) store.dispatch({ ...a, silent: true });
      g = { ...g, lastSeq: store.getSeq(), feedback: null };
      enterStep(g.stepIndex, [g.status]);
      emit();
    },

    // Full reset: fresh computer, first step.
    restart() {
      store.dispatch({ type: 'sim.load', state: initialSim, silent: true });
      g = { ...g, completedSteps: [], hintsUsed: 0, mistakes: 0, feedback: null, lastSeq: store.getSeq(), status: STATUS.READY };
      enterStep(0, [STATUS.READY]);
      emit();
      onCheckpoint?.();
    },

    getCheckpoint() {
      return {
        v: CHECKPOINT_VERSION,
        lessonId: lesson.id,
        lessonVersion: lesson.version,
        stepIndex: g.stepIndex,
        completedSteps: g.completedSteps,
        hintsUsed: g.hintsUsed,
        mistakes: g.mistakes,
        sim: store.getState(),
        savedAt: new Date().toISOString(),
      };
    },

    // Returns { ok: true } or { ok: false, reason }. Never leaves the guide half-restored.
    restoreCheckpoint(cp) {
      const check = validateCheckpoint(cp, lesson);
      if (!check.ok) return check;
      store.dispatch({ type: 'sim.load', state: cp.sim, silent: true });
      g = {
        ...g,
        completedSteps: cp.completedSteps.slice(),
        hintsUsed: cp.hintsUsed ?? 0,
        mistakes: cp.mistakes ?? 0,
        feedback: null,
        lastSeq: store.getSeq(),
        status: STATUS.READY,
      };
      enterStep(cp.stepIndex, [STATUS.READY]);
      emit();
      return { ok: true };
    },
  };
  return api;
}

export function validateCheckpoint(cp, lesson) {
  if (!cp || typeof cp !== 'object') return { ok: false, reason: 'missing' };
  if (cp.v !== CHECKPOINT_VERSION) return { ok: false, reason: 'format' };
  if (cp.lessonId !== lesson.id) return { ok: false, reason: 'lesson' };
  if (cp.lessonVersion !== lesson.version) return { ok: false, reason: 'version' };
  if (!Number.isInteger(cp.stepIndex) || cp.stepIndex < 0 || cp.stepIndex > lesson.steps.length) return { ok: false, reason: 'step' };
  if (!Array.isArray(cp.completedSteps)) return { ok: false, reason: 'steps' };
  const ids = lesson.steps.map((s) => s.id);
  if (cp.completedSteps.some((id) => !ids.includes(id))) return { ok: false, reason: 'steps' };
  // completed steps must be exactly the prefix before stepIndex
  const prefix = ids.slice(0, cp.stepIndex);
  if (prefix.length !== cp.completedSteps.length || prefix.some((id, i) => id !== cp.completedSteps[i])) return { ok: false, reason: 'steps' };
  if (!isValidSimState(cp.sim)) return { ok: false, reason: 'sim' };
  return { ok: true };
}
