import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, ArrowRight, ArrowUp, Search, FolderPlus, Scissors, Copy, ClipboardPaste, PenLine, Trash2,
  Undo2, Eraser,
} from 'lucide-react';
import { useSim, useTarget, useNodeLabel, useActivate } from './SimContext.jsx';
import { NavGlyph, NodeGlyph } from './icons.jsx';
import { children, getNode, searchNodes, TRASH_ID, ROOT_ID, pathOf, isTrashed } from '../fs.js';

const NAV = ['documents', 'downloads', 'pictures', ROOT_ID, TRASH_ID];
const ERR = { empty: 'errEmpty', invalid: 'errInvalid', exists: 'errExists' };

function Cmd({ id, icon: Icon, label, disabled, onClick, primary }) {
  const ref = useTarget(id);
  return (
    <button ref={ref} type="button" className={`sim-cmd${primary ? ' sim-cmd--primary' : ''}`} disabled={disabled} onClick={onClick} aria-label={label} title={label}>
      <Icon size={16} aria-hidden="true" /> <span>{label}</span>
    </button>
  );
}

function NavButton({ id, label, active, onClick }) {
  const ref = useTarget(`nav:${id}`);
  return (
    <button ref={ref} type="button" className={`sim-nav__item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={onClick} aria-label={label} title={label}>
      <NavGlyph id={id} /> <span>{label}</span>
    </button>
  );
}

function RenameInput({ node, error, onCommit, onCancel }) {
  const ref = useRef(null);
  const target = useTarget('rename-input');
  const done = useRef(false);
  const { t } = useTranslation();
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  const setRef = useCallback((el) => { ref.current = el; target(el); }, [target]);
  const commit = () => { if (done.current) return; onCommit(ref.current.value); };
  return (
    <span className="sim-rename">
      <input
        ref={setRef}
        className="sim-rename__input" defaultValue={node.name} maxLength={120}
        aria-label={t('sim.explorer.renameInput')} aria-invalid={Boolean(error)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          else if (e.key === 'Escape') { done.current = true; onCancel(); }
        }}
        onBlur={commit}
      />
      {error && <span className="sim-error" role="alert">{t(`sim.explorer.${ERR[error] ?? 'errInvalid'}`)}</span>}
    </span>
  );
}

function Item({ node, selected, win, label, onSelect, onOpen, onContext, renameProps }) {
  const targetRef = useTarget(`item:${(node.name ?? node.id).toLowerCase()}`);
  const act = useActivate((e) => onSelect(node, e), () => onOpen(node));
  const editing = win.props.editing?.id === node.id;
  return (
    <li
      ref={targetRef} role="option" aria-selected={selected} tabIndex={0}
      className={`sim-item${selected ? ' is-selected' : ''}`}
      onClick={editing ? undefined : act.onClick} onKeyDown={editing ? undefined : act.onKeyDown}
      onContextMenu={(e) => onContext(e, node)}
    >
      <NodeGlyph node={node} />
      {editing ? <RenameInput node={node} {...renameProps} /> : <span className="sim-item__name">{label(node)}</span>}
    </li>
  );
}

export default function Explorer({ win }) {
  const { state, dispatch, stageRef } = useSim();
  const { t } = useTranslation();
  const label = useNodeLabel();
  const p = win.props;
  const fs = state.fs;
  const folder = getNode(fs, p.folderId) ?? getNode(fs, ROOT_ID);
  const inTrash = p.folderId === TRASH_ID;
  const searching = p.query.trim().length > 0;
  const items = searching ? searchNodes(fs, p.query) : children(fs, folder.id);
  const sel = p.selection.filter((id) => fs.nodes[id]);
  const selNodes = sel.map((id) => fs.nodes[id]);
  const canEditSel = selNodes.length === 1 && !selNodes[0].system;
  const winId = win.id;
  const d = (a) => dispatch({ ...a, windowId: winId });

  const searchRef = useTarget('explorer-search');
  const upParent = folder.parentId;

  const crumbs = pathOf(fs, folder.id).map((id) => label(fs.nodes[id])).join(' › ');

  const open = (node) => {
    if (node.type === 'folder') d({ type: 'explorer.navigate', folderId: node.id });
    else if (!isTrashed(fs, node.id)) dispatch({ type: 'app.open', app: 'notepad', props: { fileId: node.id, text: node.content } });
  };
  const select = (node, e) => {
    const multi = e?.ctrlKey || e?.metaKey;
    d({ type: 'explorer.select', ids: multi ? (sel.includes(node.id) ? sel.filter((i) => i !== node.id) : [...sel, node.id]) : [node.id] });
  };
  const ctxAt = (e, kind, node) => {
    e.preventDefault(); e.stopPropagation();
    const r = stageRef.current.getBoundingClientRect();
    if (node && !sel.includes(node.id)) d({ type: 'explorer.select', ids: [node.id] });
    dispatch({ type: 'ctx.open', kind, targetId: node?.id ?? null, windowId: winId, x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const newFolder = () => d({ type: 'explorer.newFolder', name: t('sim.explorer.newFolderName') });
  const beginRename = () => canEditSel && d({ type: 'explorer.beginRename', id: selNodes[0].id });
  const trash = () => sel.length && dispatch({ type: 'fs.trash', ids: sel, windowId: winId });

  const onKeyDown = (e) => {
    if (e.target.tagName === 'INPUT') return;
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (mod && k === 'c') { e.preventDefault(); dispatch({ type: 'clipboard.copy', ids: sel, windowId: winId }); }
    else if (mod && k === 'x') { e.preventDefault(); dispatch({ type: 'clipboard.cut', ids: sel, windowId: winId }); }
    else if (mod && k === 'v') { e.preventDefault(); if (!inTrash) dispatch({ type: 'clipboard.paste', destId: folder.id, windowId: winId }); }
    else if (mod && k === 'a') { e.preventDefault(); d({ type: 'explorer.select', ids: items.map((n) => n.id) }); }
    else if (e.key === 'Delete' && !inTrash) { e.preventDefault(); trash(); }
    else if (e.key === 'F2') { e.preventDefault(); beginRename(); }
    else if (e.key === 'Backspace') { e.preventDefault(); d({ type: 'explorer.up' }); }
  };

  return (
    <div className="sim-explorer" tabIndex={-1} onKeyDown={onKeyDown}>
      <div className="sim-toolbar">
        <button type="button" className="sim-icon-btn" aria-label={t('sim.explorer.back')} title={t('sim.explorer.back')} disabled={p.index <= 0} onClick={() => d({ type: 'explorer.back' })}><ArrowLeft size={16} aria-hidden="true" /></button>
        <button type="button" className="sim-icon-btn" aria-label={t('sim.explorer.forward')} title={t('sim.explorer.forward')} disabled={p.index >= p.history.length - 1} onClick={() => d({ type: 'explorer.forward' })}><ArrowRight size={16} aria-hidden="true" /></button>
        <UpButton disabled={!upParent} label={t('sim.explorer.up')} onClick={() => d({ type: 'explorer.up' })} />
        <div className="sim-address" aria-label={crumbs}>{searching ? t('sim.explorer.searchResults') : crumbs}</div>
        <label className="sim-search">
          <Search size={14} aria-hidden="true" />
          <input ref={searchRef} type="search" value={p.query} placeholder={t('sim.explorer.searchPlaceholder')} aria-label={t('sim.explorer.search')}
            onChange={(e) => d({ type: 'explorer.search', query: e.target.value })} />
        </label>
      </div>

      <div className="sim-toolbar sim-toolbar--cmds" role="toolbar" aria-label={t('sim.apps.explorer')}>
        {inTrash ? (
          <>
            <Cmd id="explorer-restore" icon={Undo2} label={t('sim.explorer.restore')} disabled={!sel.length} onClick={() => dispatch({ type: 'fs.restore', ids: sel, windowId: winId })} />
            <Cmd id="explorer-delete-forever" icon={Trash2} label={t('sim.explorer.deleteForever')} disabled={!sel.length} onClick={() => dispatch({ type: 'fs.deleteForever', ids: sel })} />
            <Cmd id="explorer-empty-trash" icon={Eraser} label={t('sim.explorer.emptyTrash')} disabled={!items.length} onClick={() => dispatch({ type: 'fs.emptyTrash' })} />
          </>
        ) : (
          <>
            <Cmd id="explorer-newfolder" icon={FolderPlus} label={t('sim.explorer.newFolder')} disabled={searching} onClick={newFolder} />
            <Cmd id="explorer-cut" icon={Scissors} label={t('sim.explorer.cut')} disabled={!sel.length} onClick={() => dispatch({ type: 'clipboard.cut', ids: sel, windowId: winId })} />
            <Cmd id="explorer-copy" icon={Copy} label={t('sim.explorer.copy')} disabled={!sel.length} onClick={() => dispatch({ type: 'clipboard.copy', ids: sel, windowId: winId })} />
            <Cmd id="explorer-paste" icon={ClipboardPaste} label={t('sim.explorer.paste')} disabled={!state.clipboard || searching} onClick={() => dispatch({ type: 'clipboard.paste', destId: folder.id, windowId: winId })} />
            <Cmd id="explorer-rename" icon={PenLine} label={t('sim.explorer.rename')} disabled={!canEditSel} onClick={beginRename} />
            <Cmd id="explorer-delete" icon={Trash2} label={t('sim.explorer.delete')} disabled={!sel.length} onClick={trash} />
          </>
        )}
      </div>

      <div className="sim-explorer__main">
        <nav className="sim-nav" aria-label={t('sim.explorer.nav')}>
          {NAV.map((id) => (
            <NavButton key={id} id={id} label={label(fs.nodes[id])} active={!searching && p.folderId === id}
              onClick={() => d({ type: 'explorer.navigate', folderId: id })} />
          ))}
        </nav>
        <ul
          className="sim-list" role="listbox" aria-multiselectable="true" aria-label={t('sim.explorer.listLabel')}
          onClick={() => d({ type: 'explorer.select', ids: [] })}
          onContextMenu={(e) => ctxAt(e, 'bg', null)}
        >
          {items.length === 0 && <li className="sim-empty" role="presentation">{searching ? t('sim.explorer.noResults') : t('sim.explorer.empty')}</li>}
          {items.map((node) => (
            <Item key={node.id} node={node} win={win} label={label} selected={sel.includes(node.id)}
              onSelect={select} onOpen={open} onContext={(e, n) => ctxAt(e, 'item', n)}
              renameProps={{
                error: p.renameError,
                onCommit: (name) => d({ type: 'explorer.commitRename', id: node.id, name }),
                onCancel: () => d({ type: 'explorer.cancelRename' }),
              }} />
          ))}
        </ul>
      </div>
      <footer className="sim-status" aria-live="polite">
        {sel.length ? t('sim.explorer.selected', { count: sel.length }) : t('sim.explorer.items', { count: items.length })}
      </footer>
    </div>
  );
}

function UpButton({ disabled, label, onClick }) {
  const ref = useTarget('explorer-up');
  return <button ref={ref} type="button" className="sim-icon-btn" aria-label={label} title={label} disabled={disabled} onClick={onClick}><ArrowUp size={16} aria-hidden="true" /></button>;
}
