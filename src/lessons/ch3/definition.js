// Chapter 3 — keyboard shortcuts. Typing, select all, copy/paste/cut/undo in text, save, and file shortcuts.
export const ch3 = {
  id: 'ch3-keyboard',
  version: 1,
  order: 3,
  competencies: ['typing', 'selectAll', 'textClipboard', 'undo', 'saveShortcut', 'fileShortcuts'],
  steps: [
    { id: 'intro', type: 'ack' },
    {
      id: 'open-notepad', type: 'action', target: 'icon:notes', hints: 1,
      expect: { type: 'app.open', iconId: 'notes' },
      check: { kind: 'window.exists', app: 'notepad' },
      mismatch: [{ key: 'single', when: { type: 'icon.select' }, soft: true }],
    },
    {
      id: 'type-text', type: 'action', target: 'notepad-text', hints: 1,
      expect: { type: 'notepad.edit' },
      check: { kind: 'notepad.lines', min: 1, minLength: 12 },
    },
    {
      id: 'select-all', type: 'action', target: 'notepad-text', hints: 1,
      expect: { type: 'notepad.selectAll' },
      check: { kind: 'notepad.selectedAll' },
    },
    {
      id: 'copy-text', type: 'action', target: 'notepad-text', hints: 1,
      expect: { type: 'notepad.copy' },
      check: { kind: 'textclip.equalsText' },
      allow: ['notepad.selectAll'],
    },
    {
      id: 'paste-text', type: 'action', target: 'notepad-text', hints: 2,
      expect: { type: 'notepad.paste' },
      check: { kind: 'notepad.textTimes', n: 2 },
    },
    {
      id: 'undo', type: 'action', target: 'notepad-text', hints: 1,
      expect: { type: 'notepad.undo' },
      check: { kind: 'notepad.textTimes', n: 1 },
    },
    {
      id: 'cut-text', type: 'action', target: 'notepad-text', hints: 1,
      expect: { type: 'notepad.cut' },
      check: { kind: 'notepad.empty' },
      allow: ['notepad.selectAll'],
    },
    {
      id: 'paste-back', type: 'action', target: 'notepad-text', hints: 1,
      expect: { type: 'notepad.paste' },
      check: { kind: 'notepad.textTimes', n: 1 },
    },
    {
      id: 'save-shortcut', type: 'action', target: 'notepad-text', hints: 2,
      expect: { type: 'notepad.save' },
      check: { kind: 'notepad.saved' },
      allow: ['notepad.edit'],
    },
    {
      id: 'close-notes', type: 'action', target: 'win-close:notepad', hints: 1,
      expect: { type: 'window.close' },
      check: { kind: 'not', of: { kind: 'window.exists', app: 'notepad' } },
    },
    {
      id: 'open-documents', type: 'action', target: 'icon:documents', hints: 1,
      expect: { type: 'app.open', iconId: 'documents' },
      check: { kind: 'explorer.at', folderId: 'documents' },
      mismatch: [{ key: 'single', when: { type: 'icon.select' }, soft: true }],
    },
    {
      id: 'select-file', type: 'action', target: 'item:eslatma.txt', hints: 1,
      expect: { type: 'explorer.select' },
      check: { kind: 'explorer.selectedName', name: 'Eslatma.txt' },
    },
    {
      id: 'key-copy', type: 'action', target: 'item:eslatma.txt', hints: 1,
      expect: { type: 'clipboard.copy', via: 'key' },
      check: { kind: 'clipboard.has', mode: 'copy', name: 'Eslatma.txt' },
      allow: ['explorer.select'],
      mismatch: [{ key: 'mouse', when: { type: 'clipboard.copy' } }],
    },
    {
      id: 'go-downloads', type: 'action', target: 'nav:downloads', hints: 1,
      expect: { type: 'explorer.navigate' },
      check: { kind: 'explorer.at', folderId: 'downloads' },
    },
    {
      id: 'key-paste', type: 'action', target: 'nav:downloads', hints: 1,
      expect: { type: 'clipboard.paste', via: 'key' },
      check: { kind: 'fs.exists', name: 'Eslatma.txt', parent: 'downloads' },
      mismatch: [{ key: 'mouse', when: { type: 'clipboard.paste' } }],
    },
    {
      id: 'key-delete', type: 'action', target: 'item:eslatma.txt', hints: 1,
      expect: { type: 'fs.trash', via: 'key' },
      check: { kind: 'fs.trashed', name: 'Eslatma.txt' },
      allow: ['explorer.select'],
      mismatch: [{ key: 'mouse', when: { type: 'fs.trash' } }],
    },
    { id: 'finish', type: 'ack' },
  ],
};
