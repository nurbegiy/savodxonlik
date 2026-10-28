// Chapter 1 — language-independent definition. All copy lives in uz.js / ru.js / en.js.
export const ch1 = {
  id: 'ch1-desktop',
  version: 1,
  order: 1,
  competencies: ['mouse', 'icons', 'windows', 'taskbar', 'startMenu'],
  steps: [
    { id: 'welcome', type: 'ack' },
    {
      id: 'select-icon', type: 'action', target: 'icon:documents', hints: 2,
      expect: { type: 'icon.select', iconId: 'documents' },
      mismatch: [
        { key: 'wallpaper', when: { type: 'desktop.click' } },
        { key: 'otherIcon', when: { type: 'icon.select' } },
      ],
    },
    {
      id: 'open-icon', type: 'action', target: 'icon:documents', hints: 2,
      expect: { type: 'app.open', iconId: 'documents' },
      check: { kind: 'window.exists', app: 'explorer' },
      mismatch: [{ key: 'single', when: { type: 'icon.select' }, soft: true }],
    },
    {
      id: 'maximize', type: 'action', target: 'win-max:explorer', hints: 1,
      expect: { type: 'window.maximize' },
      check: { kind: 'window.mode', app: 'explorer', mode: 'maximized' },
      requires: { kind: 'window.exists', app: 'explorer' },
      recover: [{ type: 'app.open', app: 'explorer', props: { folderId: 'documents' } }],
    },
    {
      id: 'restore-size', type: 'action', target: 'win-max:explorer', hints: 1,
      expect: { type: 'window.restore' },
      check: { kind: 'window.mode', app: 'explorer', mode: 'normal' },
    },
    {
      id: 'minimize', type: 'action', target: 'win-min:explorer', hints: 1,
      expect: { type: 'window.minimize' },
      check: { kind: 'window.mode', app: 'explorer', mode: 'minimized' },
    },
    {
      id: 'taskbar-restore', type: 'action', target: 'taskbar:explorer', hints: 2,
      expect: { type: 'window.restore' },
      check: { kind: 'window.mode', app: 'explorer', mode: 'normal' },
    },
    {
      id: 'close-window', type: 'action', target: 'win-close:explorer', hints: 1,
      expect: { type: 'window.close' },
      check: { kind: 'not', of: { kind: 'window.exists', app: 'explorer' } },
    },
    {
      id: 'open-start', type: 'action', target: 'start-button', hints: 1,
      expect: { type: 'start.toggle' },
      check: { kind: 'start.open' },
    },
    {
      id: 'open-notes', type: 'action', target: 'start-app:notepad', hints: 1,
      expect: { type: 'app.open', app: 'notepad' },
      check: { kind: 'window.exists', app: 'notepad' },
    },
    {
      id: 'type-text', type: 'action', target: 'notepad-text', hints: 1,
      expect: { type: 'notepad.edit' },
      check: { kind: 'notepad.text', minLength: 3 },
    },
    {
      id: 'close-notes', type: 'action', target: 'win-close:notepad', hints: 1,
      expect: { type: 'window.close' },
      check: { kind: 'not', of: { kind: 'window.exists', app: 'notepad' } },
    },
    { id: 'finish', type: 'ack' },
  ],
};
