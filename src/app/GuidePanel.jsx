import { useTranslation } from 'react-i18next';
import { Lightbulb, RotateCcw, Pause, Play, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { STATUS } from '../engine/guide.js';
import { getStepContent } from '../lessons/index.js';

const lookup = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

// Resolve feedback copy: UI keys via i18n, lesson keys via lesson content (language -> uz fallback).
export function resolveFeedbackText(entry, lang, t, fb) {
  if (!fb?.key) return null;
  if (fb.key.startsWith('guide.')) return t(fb.key);
  const own = lookup(entry.content[lang], fb.key) ?? lookup(entry.content.uz, fb.key);
  if (typeof own === 'string') return own;
  return fb.fallbackKey ? t(fb.fallbackKey) : null;
}

export default function GuidePanel({ entry, guide, g, collapsed, onToggle, completion, onRetryComplete, nextLesson, onRestart, onHome }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const step = guide.currentStep();
  const total = entry.def.steps.length;
  const content = step ? getStepContent(entry, lang, step.id) : null;
  const fbText = resolveFeedbackText(entry, lang, t, g.feedback);
  const completed = g.status === STATUS.COMPLETED;
  const paused = g.status === STATUS.PAUSED;
  const blocked = g.status === STATUS.BLOCKED;
  const awaiting = g.status === STATUS.AWAITING;
  const explaining = g.status === STATUS.EXPLAINING;
  const counter = t('guide.stepOf', { n: Math.min(g.stepIndex + 1, total), total });

  return (
    <aside className={`guide${collapsed ? ' is-collapsed' : ''}`} aria-label={t('guide.panelLabel')}>
      <div className="guide__scroll">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span className="guide__step">{t('guide.panelLabel')} · {completed ? `${total} / ${total}` : counter}</span>
          <button type="button" className="btn btn--ghost btn--sm guide__toggle" onClick={onToggle} aria-expanded={!collapsed}>
            {collapsed ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
            {collapsed ? t('guide.expand') : t('guide.collapse')}
          </button>
        </div>

        {/* announced to screen readers whenever the step changes */}
        <p className="visually-hidden" role="status" aria-live="polite">
          {step && content ? t('guide.srStep', { n: g.stepIndex + 1, total, title: content.title }) : ''}
        </p>

        {completed ? (
          <>
            <h2>{t('guide.completedTitle')}</h2>
            <p className="guide__msg">{content?.message ?? lookup(entry.content[lang], 'steps.finish.message') ?? ''}</p>
            <p>{t('guide.completedBody')}</p>
            <ul className="done-list">{entry.def.competencies.map((c) => <li key={c}>{t(`competency.${c}`)}</li>)}</ul>
            <p className="note note--hint">{t('guide.realWorld')}</p>
            {completion === 'saving' && <p className="muted" role="status">{t('guide.completing')}</p>}
            {completion === 'failed' && (
              <div role="alert" className="note note--wrong">
                <strong>{t('guide.wrongLabel')}</strong>{t('guide.completeFailed')}
                <button type="button" className="btn btn--sm" onClick={onRetryComplete}>{t('common.retry')}</button>
              </div>
            )}
            <p className="stats"><span>{t('guide.mistakes')}: {g.mistakes}</span><span>{t('guide.hintsUsed')}: {g.hintsUsed}</span></p>
          </>
        ) : paused ? (
          <>
            <h2>{content?.title}</h2>
            <p className="guide__msg">{t('guide.paused')}</p>
          </>
        ) : (
          <>
            <h2>{content?.title}</h2>
            <p className="guide__msg">{content?.message}</p>
            {fbText && g.feedback && (
              <div className={`note note--${g.feedback.kind === 'wrong' ? 'wrong' : g.feedback.kind === 'hint' ? 'hint' : 'ok'}`} role={g.feedback.kind === 'wrong' ? 'alert' : 'status'} key={g.feedback.nonce}>
                <strong>{g.feedback.kind === 'wrong' ? t('guide.wrongLabel') : t('guide.hintLabel')}</strong>
                {fbText}
              </div>
            )}
            {blocked && <p className="note note--wrong" role="alert">{t('guide.blocked')}</p>}
          </>
        )}
      </div>

      <div className="guide__actions">
        {completed ? (
          <>
            {nextLesson && <button type="button" className="btn btn--primary" onClick={nextLesson}>{t('guide.nextChapter')}</button>}
            <button type="button" className="btn" onClick={onHome}>{t('guide.backToHome')}</button>
            <button type="button" className="btn btn--ghost" onClick={onRestart}><RotateCcw size={16} aria-hidden="true" /> {t('guide.replayLesson')}</button>
          </>
        ) : paused ? (
          <button type="button" className="btn btn--primary" onClick={() => guide.resume()}><Play size={16} aria-hidden="true" /> {t('guide.resume')}</button>
        ) : (
          <>
            {explaining && <button type="button" className="btn btn--primary" onClick={() => guide.ack()}>{t('guide.continue')}</button>}
            {awaiting && (
              <>
                <button type="button" className="btn" onClick={() => guide.hint()}><Lightbulb size={16} aria-hidden="true" /> {t('guide.hint')}</button>
                <button type="button" className="btn" onClick={() => guide.replay()}><Eye size={16} aria-hidden="true" /> {t('guide.replay')}</button>
              </>
            )}
            {(awaiting || explaining) && <button type="button" className="btn btn--ghost" onClick={() => guide.pause()}><Pause size={16} aria-hidden="true" /> {t('guide.pause')}</button>}
            {(awaiting || blocked) && <button type="button" className="btn btn--ghost" onClick={() => guide.retryStep()}>{t('guide.retryStep')}</button>}
            <button type="button" className="btn btn--ghost" onClick={onRestart}><RotateCcw size={16} aria-hidden="true" /> {t('guide.restartLesson')}</button>
          </>
        )}
      </div>
    </aside>
  );
}
