// Chapter 2 — files and order. A complete filesystem workflow with real simulated operations.
export const ch2 = {
  id: 'ch2-files',
  version: 1,
  order: 2,
  competencies: ['folders', 'naming', 'copyPaste', 'rename', 'deleteRestore', 'search'],
  steps: [
    { id: 'intro', type: 'ack' },
    {
      id: 'open-documents', type: 'action', target: 'icon:documents', hints: 1,
      expect: { type: 'app.open', iconId: 'documents' },
      check: { kind: 'explorer.at', folderId: 'documents' },
      mismatch: [{ key: 'single', when: { type: 'icon.select' }, soft: true }],
    },
    {
      id: 'new-folder', type: 'action', target: 'explorer-newfolder', hints: 1,
      expect: { type: 'explorer.newFolder' },
      check: { kind: 'explorer.renaming' },
    },
    {
      id: 'name-folder', type: 'action', target: 'rename-input', targetFallback: 'explorer-rename', hints: 2,
      expect: { type: 'explorer.commitRename', nameEquals: 'Loyiha' },
      check: { kind: 'fs.exists', name: 'Loyiha', type: 'folder', parent: 'documents' },
      allow: ['explorer.beginRename', 'explorer.select'],
      mismatch: [{ key: 'name', when: { type: 'explorer.commitRename' } }],
    },
    {
      id: 'open-folder', type: 'action', target: 'item:loyiha', hints: 1,
      expect: { type: 'explorer.navigate' },
      check: { kind: 'explorer.atName', name: 'Loyiha' },
      allow: ['explorer.select'],
    },
    {
      id: 'go-up', type: 'action', target: 'explorer-up', hints: 1,
      expect: { type: ['explorer.up', 'explorer.back', 'explorer.navigate'] },
      check: { kind: 'explorer.at', folderId: 'documents' },
    },
    {
      id: 'select-file', type: 'action', target: 'item:hisobot.txt', hints: 1,
      expect: { type: 'explorer.select' },
      check: { kind: 'explorer.selectedName', name: 'Hisobot.txt' },
    },
    {
      id: 'copy-file', type: 'action', target: 'explorer-copy', hints: 2,
      expect: { type: 'clipboard.copy' },
      check: { kind: 'clipboard.has', mode: 'copy', name: 'Hisobot.txt' },
      allow: ['explorer.select'],
    },
    {
      id: 'enter-folder', type: 'action', target: 'item:loyiha', hints: 1,
      expect: { type: 'explorer.navigate' },
      check: { kind: 'explorer.atName', name: 'Loyiha' },
      allow: ['explorer.select'],
    },
    {
      id: 'paste-file', type: 'action', target: 'explorer-paste', hints: 2,
      expect: { type: 'clipboard.paste' },
      check: { kind: 'fs.exists', name: 'Hisobot.txt', parentName: 'Loyiha' },
    },
    {
      id: 'begin-rename', type: 'action', target: 'explorer-rename', hints: 1,
      expect: { type: 'explorer.beginRename' },
      check: { kind: 'explorer.renaming' },
      allow: ['explorer.select'],
    },
    {
      id: 'rename-file', type: 'action', target: 'rename-input', targetFallback: 'explorer-rename', hints: 2,
      expect: { type: 'explorer.commitRename', nameEquals: 'Hisobot-2026.txt' },
      check: { kind: 'fs.exists', name: 'Hisobot-2026.txt', parentName: 'Loyiha' },
      allow: ['explorer.beginRename', 'explorer.select'],
      mismatch: [{ key: 'name', when: { type: 'explorer.commitRename' } }],
    },
    {
      id: 'delete-file', type: 'action', target: 'explorer-delete', hints: 2,
      expect: { type: 'fs.trash' },
      check: { kind: 'fs.trashed', name: 'Hisobot-2026.txt' },
      allow: ['explorer.select'],
    },
    {
      id: 'open-trash', type: 'action', target: 'nav:trash', hints: 1,
      expect: { type: 'explorer.navigate' },
      check: { kind: 'explorer.at', folderId: 'trash' },
    },
    {
      id: 'select-trashed', type: 'action', target: 'item:hisobot-2026.txt', hints: 1,
      expect: { type: 'explorer.select' },
      check: { kind: 'explorer.selectedName', name: 'Hisobot-2026.txt' },
    },
    {
      id: 'restore-file', type: 'action', target: 'explorer-restore', hints: 1,
      expect: { type: 'fs.restore' },
      check: { kind: 'fs.exists', name: 'Hisobot-2026.txt', parentName: 'Loyiha' },
    },
    {
      id: 'search-file', type: 'action', target: 'explorer-search', hints: 2,
      expect: { type: 'explorer.search', queryIncludes: 'hisobot' },
      check: { kind: 'explorer.query', contains: 'hisobot' },
    },
    { id: 'finish', type: 'ack' },
  ],
};
