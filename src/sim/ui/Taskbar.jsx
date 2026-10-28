import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutGrid } from 'lucide-react';
import { useSim, useTarget } from './SimContext.jsx';
import { AppGlyph } from './icons.jsx';
import { LOCALE_TAGS } from '../../i18n/index.js';

function TaskButton({ win, title, active }) {
  const { dispatch } = useSim();
  const ref = useTarget(`taskbar:${win.app}`);
  const click = () => {
    if (win.mode === 'minimized') dispatch({ type: 'window.restore', id: win.id });
    else if (active) dispatch({ type: 'window.minimize', id: win.id });
    else dispatch({ type: 'window.focus', id: win.id });
  };
  return (
    <button ref={ref} type="button" className={`sim-task${active ? ' is-active' : ''}${win.mode === 'minimized' ? ' is-min' : ''}`}
      aria-pressed={active} onClick={click}>
      <AppGlyph app={win.app} /> <span>{title}</span>
    </button>
  );
}

function Clock() {
  const { i18n } = useTranslation();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(id); }, []);
  const tag = LOCALE_TAGS[i18n.language] ?? 'en-GB';
  return (
    <time className="sim-clock" dateTime={now.toISOString()}>
      <span>{new Intl.DateTimeFormat(tag, { hour: '2-digit', minute: '2-digit' }).format(now)}</span>
      <span>{new Intl.DateTimeFormat(tag, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(now)}</span>
    </time>
  );
}

export default function Taskbar({ titleOf }) {
  const { state, dispatch } = useSim();
  const { t } = useTranslation();
  const startRef = useTarget('start-button');
  return (
    <div className="sim-taskbar" role="toolbar" aria-label={t('sim.taskbar')}>
      <button ref={startRef} type="button" className={`sim-start${state.startOpen ? ' is-open' : ''}`} aria-expanded={state.startOpen} aria-haspopup="menu"
        onClick={() => dispatch({ type: 'start.toggle' })}>
        <LayoutGrid size={18} aria-hidden="true" /> <span>{t('sim.start.label')}</span>
      </button>
      <div className="sim-tasks">
        {state.windows.map((w) => <TaskButton key={w.id} win={w} title={titleOf(w)} active={state.activeWindowId === w.id && w.mode !== 'minimized'} />)}
      </div>
      <Clock />
    </div>
  );
}

function StartItem({ id, app, props, label }) {
  const { dispatch } = useSim();
  const ref = useTarget(`start-app:${id}`);
  return (
    <li role="none">
      <button ref={ref} type="button" role="menuitem" className="sim-startmenu__item" onClick={() => dispatch({ type: 'app.open', app, props })}>
        <AppGlyph app={app} size={20} /> <span>{label}</span>
      </button>
    </li>
  );
}

export function StartMenu() {
  const { t } = useTranslation();
  const { dispatch } = useSim();
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') dispatch({ type: 'start.close' }); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [dispatch]);
  return (
    <div className="sim-startmenu" role="menu" aria-label={t('sim.start.menu')} onPointerDown={(e) => e.stopPropagation()}>
      <h2 className="sim-startmenu__title">{t('sim.start.apps')}</h2>
      <ul>
        <StartItem id="explorer" app="explorer" props={{ folderId: 'documents' }} label={t('sim.apps.explorer')} />
        <StartItem id="notepad" app="notepad" label={t('sim.apps.notepad')} />
      </ul>
    </div>
  );
}
