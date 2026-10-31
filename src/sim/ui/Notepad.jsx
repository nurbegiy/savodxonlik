import { useState, useRef, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, SaveAll, Undo2, Scissors, Copy, ClipboardPaste, TextSelect } from 'lucide-react';
import { useSim, useTarget, useNodeLabel } from './SimContext.jsx';
import { isTrashed } from '../fs.js';

const errMap = { empty: 'errEmpty', invalid: 'errInvalid', exists: 'errExists' };

function Btn({ icon: Icon, text, hint, onClick, refCb, disabled }) {
  return (
    <button type="button" className="sim-cmd" onClick={onClick} ref={refCb} disabled={disabled} title={hint}>
      <Icon size={16} aria-hidden="true" /> <span className="sim-cmd__txt">{text}</span><kbd className="sim-kbd">{hint}</kbd>
    </button>
  );
}

export default function Notepad({ win }) {
  const { state, dispatch } = useSim();
  const { t } = useTranslation();
  const label = useNodeLabel();
  const targetRef = useTarget('notepad-text');
  const taRef = useRef(null);
  const setRefs = (el) => { taRef.current = el; targetRef(el); };
  const saveRef = useTarget('notepad-save');
  const [saving, setSaving] = useState(false);
  const openedAt = useRef(0);
  const openForm = () => { openedAt.current = p.savedNonce ?? 0; setSaving(true); };
  const [name, setName] = useState(() => `${t('sim.notepad.untitled')}.txt`);
  const [folderId, setFolderId] = useState('documents');
  const p = win.props;
  const w = win.id;

  // After cut/paste/undo the reducer says where the caret should be.
  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el || !p.caretNonce) return;
    const c = Math.min(p.caret ?? el.value.length, el.value.length);
    el.focus(); el.setSelectionRange(c, c);
  }, [p.caretNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const sel = () => {
    const el = taRef.current;
    return { start: el?.selectionStart ?? 0, end: el?.selectionEnd ?? 0 };
  };
  const doSelectAll = () => { taRef.current?.focus(); taRef.current?.select(); dispatch({ type: 'notepad.selectAll', windowId: w }); };
  const doCopy = () => { const { start, end } = sel(); dispatch({ type: 'notepad.copy', windowId: w, text: p.text.slice(start, end) }); };
  const doCut = () => dispatch({ type: 'notepad.cut', windowId: w, ...sel() });
  const doPaste = () => dispatch({ type: 'notepad.paste', windowId: w, ...sel() });
  const doUndo = () => dispatch({ type: 'notepad.undo', windowId: w });
  const save = () => {
    if (p.fileId && state.fs.nodes[p.fileId]) dispatch({ type: 'notepad.save', windowId: w });
    else openForm();
  };
  const confirmSave = (e) => {
    e.preventDefault();
    dispatch({ type: 'notepad.save', windowId: w, name, folderId, saveAs: true });
  };
  // Close the save form only after the reducer accepted the file.
  if (saving && (p.savedNonce ?? 0) !== openedAt.current) setSaving(false);

  const onKeyDown = (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (e.target.tagName !== 'TEXTAREA') { if (k === 's') { e.preventDefault(); if (e.shiftKey) openForm(); else save(); } return; }
    if (k === 's') { e.preventDefault(); if (e.shiftKey) openForm(); else save(); }
    else if (k === 'a') { e.preventDefault(); doSelectAll(); }
    else if (k === 'c') { doCopy(); }            // let the browser copy too; harmless
    else if (k === 'x') { e.preventDefault(); doCut(); }
    else if (k === 'v') { e.preventDefault(); doPaste(); }
    else if (k === 'z') { e.preventDefault(); doUndo(); }
  };

  return (
    <div className="sim-notepad" onKeyDown={onKeyDown}>
      <div className="sim-toolbar sim-toolbar--wrap">
        <Btn icon={Save} text={t('sim.notepad.save')} hint="Ctrl+S" onClick={save} refCb={saveRef} />
        <Btn icon={SaveAll} text={t('sim.notepad.saveAsBtn')} hint="Ctrl+Shift+S" onClick={openForm} />
        <Btn icon={TextSelect} text={t('sim.notepad.selectAll')} hint="Ctrl+A" onClick={doSelectAll} />
        <Btn icon={Copy} text={t('sim.explorer.copy')} hint="Ctrl+C" onClick={doCopy} />
        <Btn icon={Scissors} text={t('sim.explorer.cut')} hint="Ctrl+X" onClick={doCut} />
        <Btn icon={ClipboardPaste} text={t('sim.explorer.paste')} hint="Ctrl+V" onClick={doPaste} disabled={!state.textClipboard} />
        <Btn icon={Undo2} text={t('sim.notepad.undo')} hint="Ctrl+Z" onClick={doUndo} disabled={!(p.history ?? []).length} />
        <span className="sim-muted">{p.dirty ? t('sim.notepad.unsaved') : p.fileId ? t('sim.notepad.saved') : ''}</span>
      </div>
      {saving && (
        <form className="sim-saveform" onSubmit={confirmSave}>
          <strong>{t('sim.notepad.saveAs')}</strong>
          <label>{t('sim.notepad.fileName')}
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </label>
          <label>{t('sim.notepad.folder')}
            <select value={folderId} onChange={(e) => setFolderId(e.target.value)}>
              {Object.values(state.fs.nodes).filter((n) => n.type === 'folder' && n.id !== 'trash' && n.id !== 'thispc' && !isTrashed(state.fs, n.id)).map((n) => <option key={n.id} value={n.id}>{label(n)}</option>)}
            </select>
          </label>
          {p.saveError && <p className="sim-error" role="alert">{t(`sim.notepad.${errMap[p.saveError] ?? 'errInvalid'}`)}</p>}
          <div className="sim-saveform__row">
            <button type="submit" className="sim-cmd sim-cmd--primary">{t('sim.notepad.save')}</button>
            <button type="button" className="sim-cmd" onClick={() => setSaving(false)}>{t('common.cancel')}</button>
          </div>
        </form>
      )}
      <textarea
        ref={setRefs}
        className="sim-notepad__text"
        value={p.text}
        placeholder={t('sim.notepad.placeholder')}
        aria-label={t('sim.notepad.textLabel')}
        spellCheck={false}
        onChange={(e) => dispatch({ type: 'notepad.edit', windowId: w, text: e.target.value })}
      />
    </div>
  );
}
