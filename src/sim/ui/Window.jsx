import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Square, Copy as RestoreIcon, X } from 'lucide-react';
import { useSim, useTarget } from './SimContext.jsx';
import { AppGlyph } from './icons.jsx';

export default function SimWindow({ win, title, active, compact, stageRef, children }) {
  const { dispatch } = useSim();
  const { t } = useTranslation();
  const drag = useRef(null);
  const minRef = useTarget(`win-min:${win.app}`);
  const maxRef = useTarget(`win-max:${win.app}`);
  const closeRef = useTarget(`win-close:${win.app}`);
  const maximized = win.mode === 'maximized';
  const full = maximized || compact;

  const onPointerDown = (e) => {
    if (full || e.button !== 0 || e.target.closest('button')) return;
    const stage = stageRef.current.getBoundingClientRect();
    drag.current = { dx: e.clientX - stage.left - win.x, dy: e.clientY - stage.top - win.y, stage };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const x = Math.max(0, Math.min(e.clientX - d.stage.left - d.dx, d.stage.width - 80));
    const y = Math.max(0, Math.min(e.clientY - d.stage.top - d.dy, d.stage.height - 100));
    dispatch({ type: 'window.move', id: win.id, x, y });
  };
  const endDrag = () => { drag.current = null; };

  const style = full ? undefined : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: 10 + win.z };
  const cls = ['sim-win', active && 'is-active', full && 'is-full', compact && 'is-compact'].filter(Boolean).join(' ');

  return (
    <section
      className={cls}
      style={full ? { zIndex: 10 + win.z } : style}
      hidden={win.mode === 'minimized'}
      aria-label={title}
      onPointerDown={() => dispatch({ type: 'window.focus', id: win.id })}
    >
      <header className="sim-win__bar" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}
        onDoubleClick={() => dispatch({ type: maximized ? 'window.restore' : 'window.maximize', id: win.id })}>
        <span className="sim-win__title"><AppGlyph app={win.app} /> <span>{title}</span></span>
        <span className="sim-win__ctrls">
          <button ref={minRef} type="button" className="sim-win__btn" aria-label={t('sim.window.minimize')} title={t('sim.window.minimize')}
            onClick={() => dispatch({ type: 'window.minimize', id: win.id })}><Minus size={16} aria-hidden="true" /></button>
          {!compact && (
            <button ref={maxRef} type="button" className="sim-win__btn" aria-label={maximized ? t('sim.window.restore') : t('sim.window.maximize')}
              title={maximized ? t('sim.window.restore') : t('sim.window.maximize')}
              onClick={() => dispatch({ type: maximized ? 'window.restore' : 'window.maximize', id: win.id })}>
              {maximized ? <RestoreIcon size={14} aria-hidden="true" /> : <Square size={14} aria-hidden="true" />}
            </button>
          )}
          <button ref={closeRef} type="button" className="sim-win__btn sim-win__btn--close" aria-label={t('sim.window.close')} title={t('sim.window.close')}
            onClick={() => dispatch({ type: 'window.close', id: win.id })}><X size={16} aria-hidden="true" /></button>
        </span>
      </header>
      <div className="sim-win__body">{children}</div>
    </section>
  );
}
