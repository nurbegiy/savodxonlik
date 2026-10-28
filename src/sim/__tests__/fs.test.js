import { describe, it, expect } from 'vitest';
import { createInitialSimState } from '../seed.js';
import { createSimStore } from '../store.js';
import { findByName, children, TRASH_ID } from '../fs.js';

const setup = () => createSimStore(createInitialSimState());

describe('virtual filesystem', () => {
  it('copy then paste creates a real file in the destination and keeps the original', () => {
    const s = setup();
    s.dispatch({ type: 'explorer.newFolder', windowId: 'x' });
    s.dispatch({ type: 'app.open', app: 'explorer', props: { folderId: 'documents' } });
    const win = s.getState().windows[0].id;
    s.dispatch({ type: 'explorer.newFolder', windowId: win, name: 'Loyiha' });
    const folder = findByName(s.getState().fs, 'Loyiha');
    s.dispatch({ type: 'clipboard.copy', ids: ['f1'] });
    s.dispatch({ type: 'clipboard.paste', destId: folder.id, windowId: win });
    const fs = s.getState().fs;
    expect(children(fs, folder.id).map((n) => n.name)).toEqual(['Hisobot.txt']);
    expect(fs.nodes.f1.parentId).toBe('documents');
    expect(children(fs, folder.id)[0].id).not.toBe('f1');
    expect(children(fs, folder.id)[0].content).toBe(fs.nodes.f1.content);
  });

  it('cut + paste moves the file and clears the clipboard', () => {
    const s = setup();
    s.dispatch({ type: 'clipboard.cut', ids: ['f2'] });
    s.dispatch({ type: 'clipboard.paste', destId: 'pictures' });
    expect(s.getState().fs.nodes.f2.parentId).toBe('pictures');
    expect(s.getState().clipboard).toBeNull();
  });

  it('pasting a file twice into the same folder produces a unique name', () => {
    const s = setup();
    s.dispatch({ type: 'clipboard.copy', ids: ['f1'] });
    s.dispatch({ type: 'clipboard.paste', destId: 'documents' });
    const names = children(s.getState().fs, 'documents').map((n) => n.name);
    expect(names).toContain('Hisobot.txt');
    expect(names).toContain('Hisobot (2).txt');
  });

  it('rename changes the real name and rejects duplicates / invalid names', () => {
    const s = setup();
    s.dispatch({ type: 'app.open', app: 'explorer', props: { folderId: 'documents' } });
    const win = s.getState().windows[0].id;
    s.dispatch({ type: 'explorer.commitRename', windowId: win, id: 'f1', name: 'Yangi.txt' });
    expect(s.getState().fs.nodes.f1.name).toBe('Yangi.txt');
    s.dispatch({ type: 'explorer.commitRename', windowId: win, id: 'f1', name: 'Eslatma.txt' });
    expect(s.getState().fs.nodes.f1.name).toBe('Yangi.txt');
    expect(s.getState().windows[0].props.renameError).toBe('exists');
    s.dispatch({ type: 'explorer.commitRename', windowId: win, id: 'f1', name: 'a/b' });
    expect(s.getState().windows[0].props.renameError).toBe('invalid');
  });

  it('delete moves to trash and restore returns to the previous location', () => {
    const s = setup();
    s.dispatch({ type: 'fs.trash', ids: ['f1'] });
    expect(s.getState().fs.nodes.f1.parentId).toBe(TRASH_ID);
    s.dispatch({ type: 'fs.restore', ids: ['f1'] });
    expect(s.getState().fs.nodes.f1.parentId).toBe('documents');
  });

  it('restore falls back to Documents when the old folder was deleted', () => {
    const s = setup();
    s.dispatch({ type: 'app.open', app: 'explorer', props: { folderId: 'documents' } });
    const win = s.getState().windows[0].id;
    s.dispatch({ type: 'explorer.newFolder', windowId: win, name: 'Tmp' });
    const tmp = findByName(s.getState().fs, 'Tmp');
    s.dispatch({ type: 'clipboard.cut', ids: ['f1'] });
    s.dispatch({ type: 'clipboard.paste', destId: tmp.id });
    s.dispatch({ type: 'fs.trash', ids: ['f1'] });
    s.dispatch({ type: 'fs.trash', ids: [tmp.id] });
    s.dispatch({ type: 'fs.restore', ids: ['f1'] });
    expect(s.getState().fs.nodes.f1.parentId).toBe('documents');
  });

  it('cannot paste a folder into itself', () => {
    const s = setup();
    s.dispatch({ type: 'app.open', app: 'explorer', props: { folderId: 'documents' } });
    const win = s.getState().windows[0].id;
    s.dispatch({ type: 'explorer.newFolder', windowId: win, name: 'A' });
    const a = findByName(s.getState().fs, 'A');
    s.dispatch({ type: 'clipboard.copy', ids: [a.id] });
    s.dispatch({ type: 'clipboard.paste', destId: a.id });
    expect(children(s.getState().fs, a.id)).toHaveLength(0);
  });

  it('window lifecycle: minimize, restore, maximize, close update real state', () => {
    const s = setup();
    s.dispatch({ type: 'app.open', app: 'explorer' });
    const id = s.getState().windows[0].id;
    s.dispatch({ type: 'window.minimize', id });
    expect(s.getState().windows[0].mode).toBe('minimized');
    s.dispatch({ type: 'window.restore', id });
    expect(s.getState().windows[0].mode).toBe('normal');
    s.dispatch({ type: 'window.maximize', id });
    expect(s.getState().windows[0].mode).toBe('maximized');
    s.dispatch({ type: 'window.close', id });
    expect(s.getState().windows).toHaveLength(0);
    expect(s.getState().activeWindowId).toBeNull();
  });
});
