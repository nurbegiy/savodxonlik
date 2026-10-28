import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Check } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { LESSONS } from '../lessons/index.js';
import { createProgressService } from '../lib/progress.js';
import { Spinner } from '../ui/Feedback.jsx';
import Layout from './Layout.jsx';

const UPCOMING = ['ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8', 'ch9'];

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const progress = useMemo(() => createProgressService(user.id), [user.id]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setError(false);
    progress.loadSummary().then((s) => alive && setSummary(s)).catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [progress, attempt]);

  if (error) {
    return <Layout><div className="center-screen" role="alert"><p>{t('common.error')}</p><button className="btn btn--primary" onClick={() => setAttempt((a) => a + 1)}>{t('common.retry')}</button></div></Layout>;
  }
  if (!summary) return <Layout><Spinner label={t('common.loading')} /></Layout>;

  const lang = i18n.language;
  const done = (id) => summary.lessons[id]?.status === 'completed';
  const sorted = [...LESSONS].sort((a, b) => a.def.order - b.def.order);

  return (
    <Layout>
      <div className="home">
        <main className="home__main">
          <div>
            <h1>{t('home.heading')}</h1>
            <p className="muted">{t('home.intro')}</p>
          </div>
          <section aria-labelledby="chapters-h">
            <h2 id="chapters-h" className="visually-hidden">{t('home.chaptersTitle')}</h2>
            <ol className="chapters">
              {sorted.map((entry, i) => {
                const { def } = entry;
                const prev = sorted[i - 1];
                const locked = prev ? !done(prev.def.id) : false;
                const isDone = done(def.id);
                const content = entry.content[lang] ?? entry.content.uz;
                return (
                  <li key={def.id} className={`chapter${isDone ? ' chapter--done' : !locked ? ' chapter--active' : ' chapter--off'}`}>
                    <span className="chapter__no" aria-hidden="true">{isDone ? <Check size={20} /> : def.order}</span>
                    <div>
                      <h2>{content.title}</h2>
                      <p>{content.summary}</p>
                      <p><span className="tag">{t('home.steps', { count: def.steps.length })}</span>{' '}
                        <span className="tag">{isDone ? t('home.statusDone') : locked ? t('home.locked') : t('home.statusNew')}</span></p>
                      {locked && <p>{t('home.lockedBy')}</p>}
                    </div>
                    {locked
                      ? <span className="tag"><Lock size={14} aria-hidden="true" /> {t('home.locked')}</span>
                      : <Link className={`btn ${isDone ? '' : 'btn--primary'}`} to={`/learn/${def.id}`}>{isDone ? t('home.review') : t('home.start')}</Link>}
                  </li>
                );
              })}
              {UPCOMING.map((k, i) => (
                <li key={k} className="chapter chapter--off">
                  <span className="chapter__no" aria-hidden="true">{sorted.length + i + 1}</span>
                  <div><h2>{t(`curriculum.${k}`)}</h2></div>
                  <span className="tag">{t('home.comingSoon')}</span>
                </li>
              ))}
            </ol>
          </section>
        </main>
        <aside className="home__side">
          <section>
            <h2 style={{ fontSize: 'var(--fs-md)', marginBottom: 8 }}>{t('home.competencies')}</h2>
            {summary.competencies.length === 0
              ? <p className="muted">{t('home.noCompetencies')}</p>
              : <ul className="skills">{summary.competencies.map((c) => <li key={c}><Check size={14} aria-hidden="true" /> {t(`competency.${c}`)}</li>)}</ul>}
          </section>
          <p className="side-note"><strong>{t('home.realWorldTitle')}</strong>{t('home.realWorldBody')}</p>
          <p className="side-note">{t('home.mobileNote')}</p>
        </aside>
      </div>
    </Layout>
  );
}

