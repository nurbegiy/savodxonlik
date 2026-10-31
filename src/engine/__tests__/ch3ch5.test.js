import { describe, it, expect } from 'vitest';
import { createSimStore } from '../../sim/store.js';
import { createInitialSimState } from '../../sim/seed.js';
import { createGuide, STATUS } from '../guide.js';
import { ch3 } from '../../lessons/ch3/definition.js';
import { ch5 } from '../../lessons/ch5/definition.js';

const setup = (lesson) => {
  const store = createSimStore(createInitialSimState());
  const guide = createGuide(lesson, store);
  guide.start();
  const d = (a) => store.dispatch(a);
  const win = (app) => store.getState().windows.find((w) => w.app === app);
  const step = () => guide.currentStep()?.id;
  return { store, guide, d, win, step };
};
const openNotes = ({ d }) => d({ type: 'app.open', app: 'notepad', iconId: 'notes' });
const folderWin = (s) => s.win('explorer').id;

describe('sim notepad shortcuts', () => {
  it('select-all, copy, paste at caret, undo, cut', () => {
    const s = setup(ch3); openNotes(s); const w = s.win('notepad').id;
    s.d({ type: 'notepad.edit', windowId: w, text: 'Salom, dunyo!' });
    s.d({ type: 'notepad.selectAll', windowId: w });
    expect(s.win('notepad').props.sel).toBe(true);
    s.d({ type: 'notepad.copy', windowId: w, text: 'Salom, dunyo!' });
    s.d({ type: 'notepad.paste', windowId: w, start: 13, end: 13 });
    expect(s.win('notepad').props.text).toBe('Salom, dunyo!Salom, dunyo!');
    s.d({ type: 'notepad.undo', windowId: w });
    expect(s.win('notepad').props.text).toBe('Salom, dunyo!');
    s.d({ type: 'notepad.cut', windowId: w, start: 0, end: 13 });
    expect(s.win('notepad').props.text).toBe('');
    expect(s.store.getState().textClipboard).toBe('Salom, dunyo!');
  });
  it('typing is one undo step; empty copy and paste are ignored', () => {
    const s = setup(ch3); openNotes(s); const w = s.win('notepad').id;
    for (const t of ['a', 'ab', 'abc']) s.d({ type: 'notepad.edit', windowId: w, text: t });
    s.d({ type: 'notepad.undo', windowId: w });
    expect(s.win('notepad').props.text).toBe('');
    s.d({ type: 'notepad.paste', windowId: w, start: 0, end: 0 });
    expect(s.win('notepad').props.text).toBe('');
    s.d({ type: 'notepad.copy', windowId: w, text: '' });
    expect(s.store.getState().textClipboard).toBeNull();
  });
});

describe('chapter 3 playthrough', () => {
  it('completes through real simulated actions', () => {
    const s = setup(ch3);
    s.guide.ack();
    openNotes(s); const w = s.win('notepad').id;
    s.d({ type: 'notepad.edit', windowId: w, text: 'Salom, dunyo!' });
    s.d({ type: 'notepad.selectAll', windowId: w });
    s.d({ type: 'notepad.copy', windowId: w, text: 'Salom, dunyo!' });
    expect(s.step()).toBe('paste-text');
    // pasting over a full selection replaces it: must NOT pass
    s.d({ type: 'notepad.paste', windowId: w, start: 0, end: 13 });
    expect(s.step()).toBe('paste-text');
    s.d({ type: 'notepad.paste', windowId: w, start: 13, end: 13 });
    expect(s.step()).toBe('undo');
    s.d({ type: 'notepad.undo', windowId: w });
    expect(s.step()).toBe('cut-text');
    s.d({ type: 'notepad.selectAll', windowId: w });
    s.d({ type: 'notepad.cut', windowId: w, start: 0, end: 13 });
    s.d({ type: 'notepad.paste', windowId: w, start: 0, end: 0 });
    expect(s.step()).toBe('save-shortcut');
    s.d({ type: 'notepad.save', windowId: w, name: 'Eslatma-2.txt', folderId: 'documents' });
    s.d({ type: 'window.close', id: w });
    s.d({ type: 'app.open', app: 'explorer', iconId: 'documents' });
    s.d({ type: 'explorer.select', windowId: folderWin(s), ids: ['f2'] });
    // mouse copy rejected, keyboard accepted
    s.d({ type: 'clipboard.copy', ids: ['f2'], windowId: folderWin(s) });
    expect(s.step()).toBe('key-copy');
    s.d({ type: 'clipboard.copy', ids: ['f2'], windowId: folderWin(s), via: 'key' });
    s.d({ type: 'explorer.navigate', windowId: folderWin(s), folderId: 'downloads' });
    s.d({ type: 'clipboard.paste', destId: 'downloads', windowId: folderWin(s), via: 'key' });
    const copyId = s.win('explorer').props.selection[0];
    s.d({ type: 'fs.trash', ids: [copyId], windowId: folderWin(s), via: 'key' });
    expect(s.step()).toBe('finish');
    s.guide.ack();
    expect(s.guide.getState().status).toBe(STATUS.COMPLETED);
  });
});

describe('chapter 5 playthrough', () => {
  it('rejects a wrong file name, then completes', () => {
    const s = setup(ch5);
    s.guide.ack();
    openNotes(s); const w = s.win('notepad').id;
    s.d({ type: 'notepad.edit', windowId: w, text: 'Maqsad: o‘rganish\nReja: har kuni\nNatija: yaxshi' });
    s.d({ type: 'notepad.save', windowId: w, name: 'boshqa.txt', folderId: 'documents' });
    expect(s.step()).toBe('save-doc');
    s.d({ type: 'notepad.save', windowId: w, name: 'Mening hujjatim.txt', folderId: 'documents', saveAs: true });
    s.d({ type: 'window.close', id: w });
    s.d({ type: 'app.open', app: 'explorer', iconId: 'documents' });
    const ex = folderWin(s);
    const fid = Object.values(s.store.getState().fs.nodes).find((n) => n.name === 'Mening hujjatim.txt').id;
    s.d({ type: 'explorer.select', windowId: ex, ids: [fid] });
    s.d({ type: 'app.open', app: 'notepad', props: { fileId: fid, text: s.store.getState().fs.nodes[fid].content } });
    const w2 = s.win('notepad').id;
    s.d({ type: 'notepad.edit', windowId: w2, text: s.win('notepad').props.text + '\nHujjat tayyor' });
    s.d({ type: 'notepad.save', windowId: w2 });
    s.d({ type: 'window.close', id: w2 });
    const text = s.store.getState().fs.nodes[fid].content;
    s.d({ type: 'app.open', app: 'notepad', props: { fileId: fid, text } });
    expect(s.step()).toBe('finish');
  });
});
