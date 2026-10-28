import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthProvider.jsx';
import { isConfigured, DEMO_MODE } from '../lib/supabase.js';
import { LanguageSelect, ThemeToggle } from '../ui/AppControls.jsx';

export default function LoginPage() {
  const { t } = useTranslation();
  const { access, signIn, signInDemo, loading } = useAuth();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!loading && access !== 'anonymous') return <Navigate to={loc.state?.from ?? '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await signIn(email, password);
    setBusy(false);
    if (res.error) setError(res.error);
  };

  return (
    <div className="login">
      <section className="login__intro">
        <span className="topbar__logo" aria-hidden="true" style={{ width: 44, height: 44 }} />
        <h1>{t('app.name')}</h1>
        <p>{t('app.tagline')}</p>
        <p>{t('home.intro')}</p>
      </section>
      <main className="login__form">
        <div className="login__top"><LanguageSelect /><ThemeToggle /></div>
        <h2>{t('auth.signInTitle')}</h2>
        {!isConfigured && !DEMO_MODE && (
          <div className="banner" role="alert"><strong>{t('auth.notConfigured')}.</strong> {t('auth.notConfiguredBody')}</div>
        )}
        {DEMO_MODE && <div className="banner" role="note">{t('auth.demoBanner')}</div>}
        {isConfigured && (
          <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
            <p className="muted" style={{ margin: 0 }}>{t('auth.signInSubtitle')}</p>
            <label className="field">{t('auth.email')}
              <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="field">{t('auth.password')}
              <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && <p className="error" role="alert">{t(`auth.${error}`)}</p>}
            <button className="btn btn--primary" disabled={busy} type="submit">{busy ? t('auth.signingIn') : t('auth.signIn')}</button>
          </form>
        )}
        {DEMO_MODE && <button type="button" className="btn" onClick={signInDemo}>{t('auth.demoEnter')}</button>}
        <p className="muted" style={{ fontSize: 'var(--fs-sm)' }}>{t('auth.noSignup')}</p>
      </main>
    </div>
  );
}
