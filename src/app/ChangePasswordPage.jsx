import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import Layout from './Layout.jsx';

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { refreshProfile } = useAuth();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return setError(t('auth.passwordShort'));
    if (pw !== pw2) return setError(t('auth.passwordMismatch'));
    setBusy(true); setError(null);
    // The flag is only cleared after the backend confirmed the password change.
    const up = await supabase.auth.updateUser({ password: pw });
    if (up.error) { setBusy(false); return setError(up.error.message); }
    const rpc = await supabase.rpc('clear_must_change_password');
    if (rpc.error) { setBusy(false); return setError(rpc.error.message); }
    await refreshProfile();
    nav('/', { replace: true });
  };

  return (
    <Layout>
      <main className="center-screen" style={{ flex: 1 }}>
        <form onSubmit={submit} style={{ display: 'grid', gap: 14, width: 'min(380px, 100%)', textAlign: 'left' }}>
          <h1>{t('auth.changePasswordTitle')}</h1>
          <p className="muted">{t('auth.changePasswordBody')}</p>
          <label className="field">{t('auth.newPassword')}
            <input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
          </label>
          <label className="field">{t('auth.repeatPassword')}
            <input type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn btn--primary" disabled={busy} type="submit">{t('auth.savePassword')}</button>
        </form>
      </main>
    </Layout>
  );
}
