import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSim } from './SimContext.jsx';
import { TRASH_ID } from '../fs.js';

export default function ContextMenu({ menu }) {
  const { state, dispatch } = useSim();
  const { t } = useTranslation();
  const ref = useRef(null);
  const win = state.windows.find((w) => w.id === menu.windowId);
  const sel = win ? win.props.selection : [];
  const inTrash = win?.props.folderId === TRASH_ID;
  const folderId = win?.props.folderId;
  const winId = menu.windowId;

  useEffect(() => {
    const away = (e) => { if (!ref.current?.contains(e.target)) dispatch({ type: 'ctx.close' }); };
    const esc = (e) => { if (e.key === 'Escape') dispatch({ type: 'ctx.close' }); };
    document.addEventListener('pointerdown', away, true);
    document.addEventListener('keydown', esc);
    ref.current?.querySelector('button:not([disabled])')?.focus();
    return () => { document.removeEventListener('pointerdown', away, true); document.removeEventListener('keydown', esc); };
  }, [dispatch]);

  const node = menu.targetId ? state.fs.nodes[menu.targetId] : null;
  const E = 'sim.explorer.';
  let entries = [];
  if (menu.kind === 'item' && node) {
    entries = inTrash
      ? [[t(E + 'restore'), () => dispatch({ type: 'fs.restore', ids: sel, windowId: winId })],
         [t(E + 'deleteForever'), () => dispatch({ type: 'fs.deleteForever', ids: sel })]]
      : [[t(E + 'open'), () => (node.type === 'folder'
            ? dispatch({ type: 'explorer.navigate', windowId: winId, folderId: node.id })
            : dispatch({ type: 'app.open', app: 'notepad', props: { fileId: node.id, text: node.content } }))],
         [t(E + 'cut'), () => dispatch({ type: 'clipboard.cut', ids: sel })],
         [t(E + 'copy'), () => dispatch({ type: 'clipboard.copy', ids: sel })],
         [t(E + 'rename'), () => dispatch({ type: 'explorer.beginRename', windowId: winId, id: node.id }), node.system],
         [t(E + 'delete'), () => dispatch({ type: 'fs.trash', ids: sel, windowId: winId })]];
  } else if (menu.kind === 'bg') {
    entries = inTrash
      ? [[t(E + 'emptyTrash'), () => dispatch({ type: 'fs.emptyTrash' })]]
      : [[t(E + 'newFolder'), () => dispatch({ type: 'explorer.newFolder', windowId: winId, name: t(E + 'newFolderName') })],
         [t(E + 'paste'), () => dispatch({ type: 'clipboard.paste', destId: folderId, windowId: winId }), !state.clipboard]];
  }
  if (!entries.length) return null;

  return (
    <ul ref={ref} className="sim-ctx" role="menu" aria-label={t('sim.ctx.menu')} style={{ left: menu.x, top: menu.y }}>
      {entries.map(([text, run, disabled]) => (
        <li key={text} role="none">
          <button type="button" role="menuitem" disabled={disabled} onClick={() => { dispatch({ type: 'ctx.close' }); run(); }}>{text}</button>
        </li>
      ))}
    </ul>
  );
}
