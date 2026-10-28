import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SimProvider, useSim, useTarget, useActivate, useSimState, useNodeLabel } from './SimContext.jsx';
import { DesktopGlyph } from './icons.jsx';
import SimWindow from './Window.jsx';
import Explorer from './Explorer.jsx';
import Notepad from './Notepad.jsx';
import Taskbar, { StartMenu } from './Taskbar.jsx';
import ContextMenu from './ContextMenu.jsx';

function DesktopIcon({ icon, selected }) {
  const { dispatch } = useSim();
  const { t } = useTranslation();
  const ref = useTarget(`icon:${icon.id}`);
  const act = useActivate(
    () => dispatch({ type: 'icon.select', iconId: icon.id }),
    () => dispatch({ type: 'app.open', app: icon.app, iconId: icon.id }),
  );
  return (
    <button ref={ref} type="button" className={`sim-icon${selected ? ' is-selected' : ''}`} aria-pressed={selected} {...act}>
      <DesktopGlyph glyph={icon.glyph} />
      <span>{t(icon.labelKey)}</span>
    </button>
  );
}

function windowTitle(w, state, label, t) {
  if (w.app === 'explorer') return label(state.fs.nodes[w.props.folderId]) || t('sim.apps.explorer');
  const f = w.props.fileId && state.fs.nodes[w.props.fileId];
  return `${f ? f.name : t('sim.notepad.untitled')}${w.props.dirty ? ' *' : ''} — ${t('sim.apps.notepad')}`;
}

function Stage({ store, registry, children }) {
  const state = useSimState(store);
  const { t } = useTranslation();
  const label = useNodeLabel();
  const stageRef = useRef(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setCompact(entry.contentRect.width < 720));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const dispatch = store.dispatch;
  const ctx = { store, state, dispatch, registry, stageRef };
  const titleOf = (w) => windowTitle(w, state, label, t);

  return (
    <SimProvider value={ctx}>
      <div className="sim-stage" ref={stageRef} role="application" aria-label={t('sim.desktop')}
        onKeyDown={(e) => { if (e.key === 'Escape') { dispatch({ type: 'ctx.close' }); dispatch({ type: 'start.close' }); } }}>
        <div className="sim-workarea" onClick={() => dispatch({ type: 'desktop.click' })}>
          <div className="sim-wallpaper" aria-hidden="true" />
          <div className="sim-icons">
            {state.desktop.icons.map((icon) => <DesktopIcon key={icon.id} icon={icon} selected={state.desktop.selectedIcon === icon.id} />)}
          </div>
          {state.windows.map((w) => (
            <SimWindow key={w.id} win={w} title={titleOf(w)} active={state.activeWindowId === w.id} compact={compact} stageRef={stageRef}>
              {w.app === 'explorer' ? <Explorer win={w} /> : <Notepad win={w} />}
            </SimWindow>
          ))}
        </div>
        <Taskbar titleOf={titleOf} />
        {state.startOpen && <StartMenu />}
        {state.contextMenu && <ContextMenu menu={state.contextMenu} />}
        {children /* guide overlay shares the stage coordinate space */}
      </div>
    </SimProvider>
  );
}

export default Stage;
