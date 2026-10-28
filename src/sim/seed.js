import { ROOT_ID, TRASH_ID } from './fs.js';

export const SIM_VERSION = 1;

const sys = (id, parentId, nameKey) => ({
  id, parentId, nameKey, type: 'folder', content: '', trashedFrom: null, system: true,
});

// Deterministic starting computer. Seed files use language-independent names.
export function createInitialSimState() {
  const nodes = {
    [ROOT_ID]: sys(ROOT_ID, null, 'sim.fs.thispc'),
    documents: sys('documents', ROOT_ID, 'sim.fs.documents'),
    downloads: sys('downloads', ROOT_ID, 'sim.fs.downloads'),
    pictures: sys('pictures', ROOT_ID, 'sim.fs.pictures'),
    [TRASH_ID]: sys(TRASH_ID, null, 'sim.fs.trash'),
    f1: { id: 'f1', parentId: 'documents', name: 'Hisobot.txt', type: 'file', trashedFrom: null,
      content: 'Oylik hisobot\nSotuvlar: 120\nXarajatlar: 80' },
    f2: { id: 'f2', parentId: 'documents', name: 'Eslatma.txt', type: 'file', trashedFrom: null,
      content: 'Dushanba kuni uchrashuv.' },
    f3: { id: 'f3', parentId: 'downloads', name: 'Shartnoma.txt', type: 'file', trashedFrom: null,
      content: 'Namuna shartnoma matni.' },
    f4: { id: 'f4', parentId: 'pictures', name: 'Manzara.txt', type: 'file', trashedFrom: null,
      content: '(rasm o‘rniga matn fayli)' },
  };
  return {
    v: SIM_VERSION,
    fs: { nodes, nextId: 100 },
    windows: [],
    activeWindowId: null,
    winCounter: 0,
    zCounter: 0,
    desktop: {
      selectedIcon: null,
      icons: [
        { id: 'thispc', app: 'explorer', folderId: ROOT_ID, labelKey: 'sim.fs.thispc', glyph: 'monitor' },
        { id: 'documents', app: 'explorer', folderId: 'documents', labelKey: 'sim.fs.documents', glyph: 'folder' },
        { id: 'notes', app: 'notepad', labelKey: 'sim.apps.notepad', glyph: 'notes' },
        { id: 'trash', app: 'explorer', folderId: TRASH_ID, labelKey: 'sim.fs.trash', glyph: 'trash' },
      ],
    },
    startOpen: false,
    contextMenu: null,
    clipboard: null,
    settings: { language: 'uz' },
  };
}

export function isValidSimState(s) {
  return !!(
    s && typeof s === 'object' && s.v === SIM_VERSION &&
    s.fs && typeof s.fs.nodes === 'object' && s.fs.nodes[ROOT_ID] && s.fs.nodes[TRASH_ID] &&
    Array.isArray(s.windows) && s.desktop && Array.isArray(s.desktop.icons)
  );
}
