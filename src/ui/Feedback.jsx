import { Component } from 'react';
import { Link } from 'react-router-dom';
import ContactLinks from './ContactLinks.jsx';
import { useTranslation } from 'react-i18next';

export function Spinner({ label }) {
  return (
    <div className="center-screen" role="status">
      <div className="spinner" aria-hidden="true" />
      <p className="muted">{label}</p>
    </div>
  );
}

export function BlockedScreen({ title, body, onLogout, home }) {
  const { t } = useTranslation();
  return (
    <main className="center-screen">
      <h1>{title}</h1>
      <p className="muted" style={{ maxWidth: 480, textAlign: 'center' }}>{body}</p>
      {onLogout && <p className="muted" style={{ margin: 0 }}>{t('login.accessTitle')}</p>}
      {onLogout && <ContactLinks />}
      {onLogout && <button type="button" className="btn btn--primary" onClick={onLogout}>{t('common.logout')}</button>}
      {home && <Link className="btn" to="/">{t('common.home')}</Link>}
    </main>
  );
}

function ErrorFallback({ onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="center-screen" role="alert">
      <h1>{t('common.error')}</h1>
      <button type="button" className="btn btn--primary" onClick={onRetry}>{t('common.retry')}</button>
    </div>
  );
}

export class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error('[ErrorBoundary]', error); }
  render() {
    if (this.state.failed) return <ErrorFallback onRetry={() => this.setState({ failed: false })} />;
    return this.props.children;
  }
}
