import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { LanguageSelect, ThemeToggle } from '../ui/AppControls.jsx';
import { Logo, Wordmark } from '../ui/Logo.jsx';

export default function Layout({ children }) {
  const { t } = useTranslation();
  const { isAdmin, signOut, demo } = useAuth();
  return (
    <div className="page">
      <header className="topbar">
        <Link to="/" className="topbar__brand" aria-label={t('app.name')}><Logo size={28} /><Wordmark /></Link>
        <nav aria-label={t('common.home')}>
          <NavLink to="/" end className="btn btn--ghost btn--sm">{t('common.home')}</NavLink>
          {isAdmin && <NavLink to="/admin" className="btn btn--ghost btn--sm">{t('admin.title')}</NavLink>}
        </nav>
        <span className="topbar__spacer" />
        <LanguageSelect />
        <ThemeToggle />
        <button type="button" className="btn btn--ghost btn--sm" onClick={signOut}><LogOut size={16} aria-hidden="true" /> {t('common.logout')}</button>
      </header>
      {demo && <div className="banner" role="note" style={{ margin: 0, borderRadius: 0 }}>{t('auth.demoBanner')}</div>}
      {children}
    </div>
  );
}
