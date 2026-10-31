// Chapter 5 — creating a document: write, save with a name in a chosen folder, find it, reopen, edit, save again.
export const ch5 = {
  id: 'ch5-documents',
  version: 1,
  order: 5,
  competencies: ['writeText', 'saveAs', 'chooseLocation', 'reopenFile', 'editSave'],
  steps: [
    { id: 'intro', type: 'ack' },
    {
      id: 'open-notepad', type: 'action', target: 'icon:notes', hints: 1,
      expect: { type: 'app.open', iconId: 'notes' },
      check: { kind: 'window.exists', app: 'notepad' },
      mismatch: [{ key: 'single', when: { type: 'icon.select' }, soft: true }],
    },
    {
      id: 'write-doc', type: 'action', target: 'notepad-text', hints: 1,
      expect: { type: 'notepad.edit' },
      check: { kind: 'notepad.lines', min: 3, minLength: 30 },
    },
    {
      id: 'save-doc', type: 'action', target: 'notepad-save', hints: 2,
      expect: { type: 'notepad.save', nameEquals: 'Mening hujjatim.txt', folderId: 'documents' },
      check: { kind: 'fs.exists', name: 'Mening hujjatim.txt', parent: 'documents' },
      allow: ['notepad.edit'],
      mismatch: [{ key: 'name', when: { type: 'notepad.save' } }],
    },
    {
      id: 'close-notepad', type: 'action', target: 'win-close:notepad', hints: 1,
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
      id: 'select-file', type: 'action', target: 'item:mening hujjatim.txt', hints: 1,
      expect: { type: 'explorer.select' },
      check: { kind: 'explorer.selectedName', name: 'Mening hujjatim.txt' },
    },
    {
      id: 'open-file', type: 'action', target: 'item:mening hujjatim.txt', hints: 1,
      expect: { type: 'app.open', app: 'notepad' },
      check: { kind: 'notepad.fileOpen', name: 'Mening hujjatim.txt' },
      allow: ['explorer.select'],
    },
    {
      id: 'edit-doc', type: 'action', target: 'notepad-text', hints: 1,
      expect: { type: 'notepad.edit' },
      check: { kind: 'notepad.has', contains: 'tayyor' },
    },
    {
      id: 'save-edit', type: 'action', target: 'notepad-save', hints: 1,
      expect: { type: 'notepad.save' },
      check: { kind: 'notepad.saved' },
      allow: ['notepad.edit'],
    },
    {
      id: 'close-notepad2', type: 'action', target: 'win-close:notepad', hints: 1,
      expect: { type: 'window.close' },
      check: { kind: 'not', of: { kind: 'window.exists', app: 'notepad' } },
    },
    {
      id: 'reopen-file', type: 'action', target: 'item:mening hujjatim.txt', hints: 1,
      expect: { type: 'app.open', app: 'notepad' },
      check: { kind: 'all', of: [{ kind: 'notepad.fileOpen', name: 'Mening hujjatim.txt' }, { kind: 'notepad.has', contains: 'tayyor' }] },
      allow: ['explorer.select'],
    },
    { id: 'finish', type: 'ack' },
  ],
};
