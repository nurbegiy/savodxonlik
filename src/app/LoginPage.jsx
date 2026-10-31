import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, MousePointer2, Keyboard, Languages } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { isConfigured, DEMO_MODE } from '../lib/supabase.js';
import { LanguageSelect, ThemeToggle } from '../ui/AppControls.jsx';
import { Logo, Wordmark } from '../ui/Logo.jsx';
import ContactLinks from '../ui/ContactLinks.jsx';
import LoginDemo from './LoginDemo.jsx';
import './auth.css';

export default function LoginPage() {
  const { t } = useTranslation();
  const { access, signIn, signInDemo, loading } = useAuth();
  const loc = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
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
    <div className="auth">
      <aside className="auth__brand">
        <div className="auth__glow" aria-hidden="true" />
        <div className="auth__grid" aria-hidden="true" />
        <div className="auth__brandInner">
          <div className="auth__logo"><Logo size={40} /><Wordmark className="auth__wm" /></div>
          <h1 className="auth__hero">{t('login.hero')}</h1>
          <p className="auth__lead">{t('login.lead')}</p>
          <LoginDemo />
          <ul className="auth__points">
            <li><MousePointer2 size={18} aria-hidden="true" /><span>{t('login.p1')}</span></li>
            <li><Keyboard size={18} aria-hidden="true" /><span>{t('login.p2')}</span></li>
            <li><Languages size={18} aria-hidden="true" /><span>{t('login.p3')}</span></li>
          </ul>
        </div>
      </aside>

      <main className="auth__panel">
        <div className="auth__top">
          <span className="auth__mobileLogo"><Logo size={28} /><Wordmark /></span>
          <span className="auth__ctrl"><LanguageSelect /><ThemeToggle /></span>
        </div>

        <div className="auth__center">
          <div className="auth__formWrap">
            <h2>{t('auth.signInTitle')}</h2>
            <p className="muted auth__sub">{t('auth.signInSubtitle')}</p>
            {!isConfigured && !DEMO_MODE && (
              <div className="banner" role="alert"><strong>{t('auth.notConfigured')}.</strong> {t('auth.notConfiguredBody')}</div>
            )}
            {DEMO_MODE && <div className="banner" role="note">{t('auth.demoBanner')}</div>}
            {isConfigured && (
              <form onSubmit={submit} className="auth__form">
                <label className="auth__field">
                  <span>{t('auth.email')}</span>
                  <span className="auth__input">
                    <Mail size={18} aria-hidden="true" />
                    <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </span>
                </label>
                <label className="auth__field">
                  <span>{t('auth.password')}</span>
                  <span className="auth__input">
                    <Lock size={18} aria-hidden="true" />
                    <input type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" className="auth__eye" onClick={() => setShow((v) => !v)} aria-label={show ? t('login.hidePassword') : t('login.showPassword')} aria-pressed={show}>
                      {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </span>
                </label>
                {error && <p className="error" role="alert">{t(`auth.${error}`)}</p>}
                <button className="btn btn--primary auth__submit" disabled={busy} type="submit">{busy ? t('auth.signingIn') : t('auth.signIn')}</button>
              </form>
            )}
            {DEMO_MODE && <button type="button" className="btn auth__submit" onClick={signInDemo}>{t('auth.demoEnter')}</button>}
          </div>
        </div>

        <section className="auth__access" aria-labelledby="access-title">
          <div className="auth__accessHead">
            <ShieldCheck size={20} aria-hidden="true" />
            <div>
              <h3 id="access-title">{t('login.accessTitle')}</h3>
              <p>{t('login.accessBody')}</p>
            </div>
          </div>
          <ContactLinks />
        </section>
      </main>
    </div>
  );
}
