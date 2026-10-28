import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSimStore } from '../../sim/store.js';
import { createInitialSimState } from '../../sim/seed.js';
import { createGuide, STATUS, validateCheckpoint } from '../guide.js';
import { validateLesson, findMissingContent } from '../lesson.js';
import { ch1 } from '../../lessons/ch1/definition.js';
import { ch2 } from '../../lessons/ch2/definition.js';
import { LESSONS, auditLessons } from '../../lessons/index.js';

let store, guide;
const boot = (lesson = ch1) => {
  store = createSimStore(createInitialSimState());
  guide = createGuide(lesson, store);
  guide.start();
};
const stepId = () => guide.currentStep()?.id;
const winId = () => store.getState().windows[0]?.id;

// Drive chapter 1 up to (not including) the given step id
function playCh1Until(target) {
  const plan = {
    welcome: () => guide.ack(),
    'select-icon': () => store.dispatch({ type: 'icon.select', iconId: 'documents' }),
    'open-icon': () => store.dispatch({ type: 'app.open', app: 'explorer', iconId: 'documents' }),
    maximize: () => store.dispatch({ type: 'window.maximize', id: winId() }),
    'restore-size': () => store.dispatch({ type: 'window.restore', id: winId() }),
    minimize: () => store.dispatch({ type: 'window.minimize', id: winId() }),
    'taskbar-restore': () => store.dispatch({ type: 'window.restore', id: winId() }),
    'close-window': () => store.dispatch({ type: 'window.close', id: winId() }),
    'open-start': () => store.dispatch({ type: 'start.toggle' }),
    'open-notes': () => store.dispatch({ type: 'app.open', app: 'notepad' }),
    'type-text': () => store.dispatch({ type: 'notepad.edit', windowId: winId(), text: 'salom' }),
    'close-notes': () => store.dispatch({ type: 'window.close', id: winId() }),
  };
  while (stepId() !== target) plan[stepId()]();
}

describe('lesson definitions', () => {
  it('shipped lessons are valid and fully translated (uz/ru/en)', () => {
    expect(auditLessons()).toEqual([]);
  });
  it('invalid definitions fail safely instead of crashing', () => {
    expect(validateLesson({ id: 'x', version: 1, steps: [{ id: 'a', type: 'action', expect: { type: 'nope' } }] })).not.toEqual([]);
    expect(validateLesson(null)).not.toEqual([]);
    expect(validateLesson({ id: 'x', version: 1, steps: [{ id: 'a', type: 'ack' }, { id: 'a', type: 'ack' }] }).join()).toMatch(/duplicate/);
    const bad = createGuide({ id: 'x', version: 1, steps: [] }, createSimStore());
    expect(bad.ok).toBe(false);
  });
  it('reports missing translations', () => {
    expect(findMissingContent(ch1, { title: 't', summary: 's', steps: {} }).length).toBeGreaterThan(0);
  });
});

describe('guided engine', () => {
  beforeEach(() => boot());

  it('starts on an explanation step and cannot be skipped by clicking in the sim', () => {
    expect(guide.getState().status).toBe(STATUS.EXPLAINING);
    store.dispatch({ type: 'icon.select', iconId: 'documents' });
    expect(stepId()).toBe('welcome');
  });

  it('a correct action advances; an incorrect one does not and explains why', () => {
    guide.ack();
    expect(stepId()).toBe('select-icon');
    store.dispatch({ type: 'desktop.click' });
    expect(stepId()).toBe('select-icon');
    expect(guide.getState().feedback.key).toBe('steps.select-icon.wrong.wallpaper');
    expect(guide.getState().mistakes).toBe(1);
    store.dispatch({ type: 'icon.select', iconId: 'trash' });
    expect(guide.getState().feedback.key).toBe('steps.select-icon.wrong.otherIcon');
    expect(stepId()).toBe('select-icon');
    store.dispatch({ type: 'icon.select', iconId: 'documents' });
    expect(stepId()).toBe('open-icon');
    expect(store.getState().desktop.selectedIcon).toBe('documents');
  });

  it('a hint never completes the step or changes the simulation', () => {
    guide.ack();
    const before = JSON.stringify(store.getState());
    guide.hint(); guide.hint(); guide.hint();
    expect(stepId()).toBe('select-icon');
    expect(JSON.stringify(store.getState())).toBe(before);
    expect(guide.getState().hintLevel).toBe(2);
    expect(guide.getState().hintsUsed).toBe(3);
    expect(guide.getState().feedback.kind).toBe('hint');
  });

  it('ack() cannot bypass an action step', () => {
    guide.ack();
    expect(guide.ack()).toBe(false);
    expect(stepId()).toBe('select-icon');
  });

  it('duplicate delivery of one event completes the step once', () => {
    guide.ack();
    let first;
    const off = store.onAction((a) => { first = a; });
    store.dispatch({ type: 'icon.select', iconId: 'documents' });
    off();
    expect(stepId()).toBe('open-icon');
    // the same stamped event arrives again (same seq): must be ignored, not complete 'open-icon'
    guide.deliver(first, store.getState());
    guide.deliver(first, store.getState());
    expect(stepId()).toBe('open-icon');
    expect(guide.getState().completedSteps).toEqual(['welcome', 'select-icon']);
    expect(guide.getState().mistakes).toBe(0);
  });

  it('single click then double-click: the soft "single" warning is cancelled by the real open', () => {
    vi.useFakeTimers();
    boot();
    playCh1Until('open-icon');
    store.dispatch({ type: 'icon.select', iconId: 'documents' });
    store.dispatch({ type: 'app.open', app: 'explorer', iconId: 'documents' });
    vi.advanceTimersByTime(1000);
    expect(guide.getState().mistakes).toBe(0);
    expect(stepId()).toBe('maximize');
    vi.useRealTimers();
  });

  it('a lone single click on open-icon shows a delayed explanation, not an advance', () => {
    vi.useFakeTimers();
    boot();
    playCh1Until('open-icon');
    store.dispatch({ type: 'icon.select', iconId: 'documents' });
    expect(guide.getState().feedback?.kind).not.toBe('wrong');
    vi.advanceTimersByTime(700);
    expect(guide.getState().feedback.key).toBe('steps.open-icon.wrong.single');
    expect(stepId()).toBe('open-icon');
    vi.useRealTimers();
  });

  it('typing fewer than 3 characters is not an error and does not advance', () => {
    playCh1Until('type-text');
    store.dispatch({ type: 'notepad.edit', windowId: winId(), text: 'sa' });
    expect(stepId()).toBe('type-text');
    expect(guide.getState().mistakes).toBe(0);
    store.dispatch({ type: 'notepad.edit', windowId: winId(), text: 'sal' });
    expect(stepId()).toBe('close-notes');
  });

  it('plays all of chapter 1 to completion', () => {
    playCh1Until('finish');
    guide.ack();
    expect(guide.getState().status).toBe(STATUS.COMPLETED);
    expect(guide.getState().completedSteps).toHaveLength(ch1.steps.length);
  });

  it('pause ignores actions; resume continues from the same step', () => {
    guide.ack();
    guide.pause();
    store.dispatch({ type: 'icon.select', iconId: 'documents' });
    expect(stepId()).toBe('select-icon');
    guide.resume();
    store.dispatch({ type: 'icon.select', iconId: 'documents' });
    expect(stepId()).toBe('open-icon');
  });

  it('requires + recover re-creates the expected starting state', () => {
    playCh1Until('maximize');
    store.dispatch({ type: 'window.close', id: winId() }); // learner closed the window early
    expect(store.getState().windows).toHaveLength(0);
    guide.retryStep();
    expect(store.getState().windows).toHaveLength(1);
    expect(stepId()).toBe('maximize');
  });
});

describe('checkpoints', () => {
  it('saved checkpoint resumes on the same step with the same simulation', () => {
    boot();
    playCh1Until('maximize');
    const cp = JSON.parse(JSON.stringify(guide.getCheckpoint())); // via storage round-trip
    boot();
    expect(guide.restoreCheckpoint(cp)).toEqual({ ok: true });
    expect(stepId()).toBe('maximize');
    expect(store.getState().windows).toHaveLength(1);
    store.dispatch({ type: 'window.maximize', id: store.getState().windows[0].id });
    expect(stepId()).toBe('restore-size');
  });

  it('rejects tampered, stale-version or foreign checkpoints without changing state', () => {
    boot();
    playCh1Until('maximize');
    const good = guide.getCheckpoint();
    boot();
    const snapshot = JSON.stringify(store.getState());
    for (const bad of [
      { ...good, lessonVersion: 99 },
      { ...good, lessonId: 'other' },
      { ...good, stepIndex: 999 },
      { ...good, completedSteps: ['maximize'] },
      { ...good, sim: { nope: true } },
      null,
    ]) {
      expect(guide.restoreCheckpoint(bad).ok).toBe(false);
    }
    expect(JSON.stringify(store.getState())).toBe(snapshot);
    expect(stepId()).toBe('welcome');
    expect(validateCheckpoint(good, ch1).ok).toBe(true);
  });

  it('language changes never touch guide or simulation state (content is resolved at render time)', () => {
    boot();
    playCh1Until('maximize');
    const before = JSON.stringify([guide.getState(), store.getState()]);
    // the language is not part of either state container; a "change" is just a different lookup
    const uz = LESSONS[0].content.uz.steps.maximize.message;
    const en = LESSONS[0].content.en.steps.maximize.message;
    expect(uz).not.toBe(en);
    expect(JSON.stringify([guide.getState(), store.getState()])).toBe(before);
  });
});

describe('chapter 2 filesystem workflow, end to end', () => {
  it('completes using only real simulated operations', () => {
    boot(ch2);
    const S = () => store.getState();
    const win = () => S().windows[0].id;
    const nodeId = (name) => Object.values(S().fs.nodes).find((n) => n.name === name && !n.system)?.id;
    guide.ack();
    store.dispatch({ type: 'app.open', app: 'explorer', iconId: 'documents' });
    store.dispatch({ type: 'explorer.newFolder', windowId: win(), name: 'Yangi papka' });
    // wrong name first: engine explains, step does not advance
    store.dispatch({ type: 'explorer.commitRename', windowId: win(), id: nodeId('Yangi papka'), name: 'Boshqa' });
    expect(stepId()).toBe('name-folder');
    expect(guide.getState().feedback.key).toBe('steps.name-folder.wrong.name');
    store.dispatch({ type: 'explorer.beginRename', windowId: win(), id: nodeId('Boshqa') });
    expect(stepId()).toBe('name-folder'); // allowed, silent
    store.dispatch({ type: 'explorer.commitRename', windowId: win(), id: nodeId('Boshqa'), name: 'Loyiha' });
    expect(stepId()).toBe('open-folder');
    const loyiha = nodeId('Loyiha');
    store.dispatch({ type: 'explorer.navigate', windowId: win(), folderId: loyiha });
    store.dispatch({ type: 'explorer.up', windowId: win() });
    store.dispatch({ type: 'explorer.select', windowId: win(), ids: ['f1'] });
    store.dispatch({ type: 'clipboard.copy', ids: ['f1'] });
    store.dispatch({ type: 'explorer.navigate', windowId: win(), folderId: loyiha });
    store.dispatch({ type: 'clipboard.paste', destId: loyiha, windowId: win() });
    expect(stepId()).toBe('begin-rename');
    const pasted = S().windows[0].props.selection[0];
    store.dispatch({ type: 'explorer.beginRename', windowId: win(), id: pasted });
    store.dispatch({ type: 'explorer.commitRename', windowId: win(), id: pasted, name: 'Hisobot-2026.txt' });
    store.dispatch({ type: 'fs.trash', ids: [pasted] });
    expect(S().fs.nodes[pasted].parentId).toBe('trash');
    store.dispatch({ type: 'explorer.navigate', windowId: win(), folderId: 'trash' });
    store.dispatch({ type: 'explorer.select', windowId: win(), ids: [pasted] });
    store.dispatch({ type: 'fs.restore', ids: [pasted] });
    expect(S().fs.nodes[pasted].parentId).toBe(loyiha);
    expect(stepId()).toBe('search-file');
    store.dispatch({ type: 'explorer.search', windowId: win(), query: 'hi' });
    expect(stepId()).toBe('search-file');
    store.dispatch({ type: 'explorer.search', windowId: win(), query: 'hisobot' });
    expect(stepId()).toBe('finish');
    guide.ack();
    expect(guide.getState().status).toBe(STATUS.COMPLETED);
    expect(S().fs.nodes.f1.parentId).toBe('documents'); // original untouched
  });
});
