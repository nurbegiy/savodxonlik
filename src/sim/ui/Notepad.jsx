import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import { useSim, useTarget, useNodeLabel } from './SimContext.jsx';

const SAVE_FOLDERS = ['documents', 'downloads', 'pictures'];

export default function Notepad({ win }) {
  const { state, dispatch } = useSim();
  const { t } = useTranslation();
  const label = useNodeLabel();
  const textRef = useTarget('notepad-text');
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(() => `${t('sim.notepad.untitled')}.txt`);
  const [folderId, setFolderId] = useState('documents');
  const p = win.props;
  const errMap = { empty: 'errEmpty', invalid: 'errInvalid', exists: 'errExists' };

  const save = () => {
    if (p.fileId && state.fs.nodes[p.fileId]) dispatch({ type: 'notepad.save', windowId: win.id });
    else setSaving(true);
  };
  const confirmSave = (e) => {
    e.preventDefault();
    dispatch({ type: 'notepad.save', windowId: win.id, name, folderId });
  };
  // Close the save form only after the reducer accepted the file.
  if (saving && p.fileId) setSaving(false);

  const onKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
  };

  return (
    <div className="sim-notepad" onKeyDown={onKeyDown}>
      <div className="sim-toolbar">
        <button type="button" className="sim-cmd" onClick={save}><Save size={16} aria-hidden="true" /> {t('sim.notepad.save')}</button>
        <span className="sim-muted">{p.dirty ? t('sim.notepad.unsaved') : p.fileId ? t('sim.notepad.saved') : ''}</span>
      </div>
      {saving && !p.fileId && (
        <form className="sim-saveform" onSubmit={confirmSave}>
          <strong>{t('sim.notepad.saveAs')}</strong>
          <label>{t('sim.notepad.fileName')}
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
          </label>
          <label>{t('sim.notepad.folder')}
            <select value={folderId} onChange={(e) => setFolderId(e.target.value)}>
              {SAVE_FOLDERS.map((id) => <option key={id} value={id}>{label(state.fs.nodes[id])}</option>)}
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
        ref={textRef}
        className="sim-notepad__text"
        value={p.text}
        placeholder={t('sim.notepad.placeholder')}
        aria-label={t('sim.notepad.textLabel')}
        spellCheck={false}
        onChange={(e) => dispatch({ type: 'notepad.edit', windowId: win.id, text: e.target.value })}
      />
    </div>
  );
}

