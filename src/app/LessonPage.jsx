import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, HelpCircle, X } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { createSimStore } from '../sim/store.js';
import { createGuide, STATUS } from '../engine/guide.js';
import { LESSONS, getLessonEntry } from '../lessons/index.js';
import { createProgressService } from '../lib/progress.js';
import { createTargetRegistry } from '../sim/ui/SimContext.jsx';
import Desktop from '../sim/ui/Desktop.jsx';
import GuideOverlay from '../sim/ui/GuideOverlay.jsx';
import GuidePanel from './GuidePanel.jsx';
import { LanguageSelect, ThemeToggle } from '../ui/AppControls.jsx';
import { BlockedScreen, Spinner } from '../ui/Feedback.jsx';

export default function LessonPage() {
  const { lessonId } = useParams();
  const { t } = useTranslation();
  const entry = getLessonEntry(lessonId);
  if (!entry) return <BlockedScreen title={t('notFound.title')} body={t('guide.notFound')} home />;
  return <LessonRunner key={lessonId} entry={entry} />;
}

function LessonRunner({ entry }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const nav = useNavigate();
  const progress = useMemo(() => createProgressService(user.id), [user.id]);
  const registry = useMemo(() => createTargetRegistry(), []);
  const [store] = useState(() => createSimStore());
  const persistRef = useRef(() => {});
  const [guide] = useState(() => createGuide(entry.def, store, { onCheckpoint: () => persistRef.current() }));
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState(null);
  const [saveState, setSaveState] = useState('idle');
  const [collapsed, setCollapsed] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [completion, setCompletion] = useState('idle'); // idle | saving | done | failed
  const g = useSyncExternalStore(guide.ok ? guide.subscribe : () => () => {}, guide.ok ? guide.getState : () => null);

  // --- load checkpoint (or start fresh) --------------------------------------------------------
  useEffect(() => {
    if (!guide.ok) return undefined;
    let cancelled = false;
    (async () => {
      const cp = await progress.loadCheckpoint(entry.def.id);
      if (cancelled) return;
      if (cp) {
        const res = guide.restoreCheckpoint(cp);
        if (!res.ok) { setNotice(t('guide.restoreFailed')); guide.start(); progress.clearCheckpoint(entry.def.id); }
      } else {
        guide.start();
      }
      setReady(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide, progress, entry.def.id]);

  // --- persistence: immediate on step completion, debounced on simulation changes ---------------
  useEffect(() => {
    if (!guide.ok || !ready) return undefined;
    let timer = null;
    const persist = async () => {
      setSaveState('saving');
      const r = await progress.saveCheckpoint(entry.def.id, guide.getCheckpoint());
      setSaveState(r.ok ? 'saved' : 'failed');
    };
    persistRef.current = persist;
    const schedule = () => { clearTimeout(timer); timer = setTimeout(persist, 1200); };
    const off = store.subscribe(schedule);
    const flush = () => { clearTimeout(timer); progress.saveCheckpoint(entry.def.id, guide.getCheckpoint()); };
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      off(); flush(); persistRef.current = () => {};
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    };
  }, [guide, ready, store, progress, entry.def.id]);

  // --- completion is recorded server-side and validated against the published step list ----------
  const completedOnce = useRef(false);
  const recordCompletion = async () => {
    setCompletion('saving');
    const res = await progress.completeLesson({
      lessonId: entry.def.id, version: entry.def.version, completedSteps: g.completedSteps,
      hintsUsed: g.hintsUsed, mistakes: g.mistakes, competencies: entry.def.competencies,
    });
    setCompletion(res.ok ? 'done' : 'failed');
  };
  useEffect(() => {
    if (g?.status === STATUS.COMPLETED && !completedOnce.current) { completedOnce.current = true; recordCompletion(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g?.status]);

  useEffect(() => { document.title = `${entry.content[i18n.language]?.title ?? entry.content.uz.title} · ${t('app.name')}`; }, [entry, i18n.language, t]);

  if (!guide.ok) {
    console.error('[lesson] invalid definition', guide.errors);
    return <BlockedScreen title={t('common.error')} body={t('guide.invalidLesson')} home />;
  }
  if (!ready || !g) return <Spinner label={t('common.loading')} />;

  const step = guide.currentStep();
  const total = entry.def.steps.length;
  const lang = i18n.language;
  const title = (entry.content[lang] ?? entry.content.uz).title;
  const nextEntry = LESSONS.find((l) => l.def.order === entry.def.order + 1);
  const overlayActive = g.status === STATUS.AWAITING && step?.type === 'action';

  const restart = () => {
    if (g.status !== STATUS.COMPLETED && !window.confirm(t('guide.restartLesson') + '?')) return;
    completedOnce.current = false; setCompletion('idle'); setNotice(null);
    guide.restart();
  };

  return (
    <div className="lesson">
      <header className="lesson__bar">
        <Link to="/" className="btn btn--ghost btn--sm" aria-label={t('guide.backToHome')}><ArrowLeft size={16} aria-hidden="true" /> <span className="visually-hidden">{t('guide.backToHome')}</span></Link>
        <h1 className="lesson__title">{title}</h1>
        <span className="lesson__count" aria-hidden="true">{t('guide.stepOf', { n: Math.min(g.stepIndex + 1, total), total })}</span>
        <span style={{ flex: 1 }} />
        <span className="lesson__save" role="status">{saveState === 'saving' ? t('guide.saving') : saveState === 'saved' ? t('guide.saved') : saveState === 'failed' ? t('guide.saveFailed') : ''}</span>
        <LanguageSelect />
        <ThemeToggle />
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setHelpOpen(true)}><HelpCircle size={16} aria-hidden="true" /> <span className="visually-hidden">{t('common.help')}</span></button>
      </header>
      <div className="progressbar" aria-hidden="true"><div style={{ width: `${(g.completedSteps.length / total) * 100}%` }} /></div>
      {notice && <div className="banner" role="status" style={{ borderRadius: 0, margin: 0 }}>{notice}</div>}

      <div className="lesson__main">
        <div className="lesson__stage">
          <Desktop store={store} registry={registry}>
            <GuideOverlay registry={registry} targetId={step?.target} fallbackId={step?.targetFallback} replayNonce={g.replayNonce} active={overlayActive} />
          </Desktop>
        </div>
        <GuidePanel entry={entry} guide={guide} g={g} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)}
          completion={completion} onRetryComplete={recordCompletion} onRestart={restart} onHome={() => nav('/')}
          nextLesson={nextEntry && completion === 'done' ? () => nav(`/learn/${nextEntry.def.id}`) : null} />
      </div>

      {helpOpen && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="help-h" onKeyDown={(e) => e.key === 'Escape' && setHelpOpen(false)}>
          <div className="modal__box">
            <h2 id="help-h">{t('guide.helpTitle')}</h2>
            <p>{t('guide.helpBody')}</p>
            <button type="button" autoFocus className="btn btn--primary" onClick={() => setHelpOpen(false)}><X size={16} aria-hidden="true" /> {t('common.close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
