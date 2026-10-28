import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase, isConfigured } from '../lib/supabase.js';
import Layout from '../app/Layout.jsx';

// All privileged writes go through the `admin-users` Edge Function, which re-checks that the
// caller is an active admin and uses the service-role key on the SERVER only.
async function callAdmin(body) {
  const { data, error } = await supabase.functions.invoke('admin-users', { body });
  if (error) {
    let message = error.message;
    try { const j = await error.context?.json?.(); if (j?.error) message = j.error; } catch { /* keep default */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function AdminPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [msg, setMsg] = useState(null); // { kind, text }
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', password: '', expires: '', role: 'learner' });

  const load = useCallback(async () => {
    setLoadError(false);
    const { data, error } = await supabase.from('profiles')
      .select('id, email, full_name, role, status, access_expires_at, must_change_password, created_at').order('created_at', { ascending: false });
    if (error) { setLoadError(true); return; }
    setUsers(data);
  }, []);
  useEffect(() => { if (isConfigured) load(); }, [load]);

  const run = async (body, okKey) => {
    setBusy(true); setMsg(null);
    try {
      await callAdmin(body);
      setMsg({ kind: 'ok', text: t(okKey) });
      await load(); // only reflect success after the backend accepted it
      return true;
    } catch (e) {
      setMsg({ kind: 'err', text: t('admin.failed', { message: e.message }) });
      return false;
    } finally { setBusy(false); }
  };

  const create = async (e) => {
    e.preventDefault();
    const ok = await run({
      action: 'create', email: form.email.trim(), fullName: form.fullName.trim(), password: form.password,
      role: form.role, accessExpiresAt: form.expires ? new Date(`${form.expires}T23:59:59`).toISOString() : null,
    }, 'admin.created');
    if (ok) setForm({ email: '', fullName: '', password: '', expires: '', role: 'learner' });
  };

  const setExpiry = (u) => {
    const cur = u.access_expires_at ? u.access_expires_at.slice(0, 10) : '';
    const v = window.prompt(`${t('admin.expires')} (YYYY-MM-DD)`, cur);
    if (v === null) return;
    if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return setMsg({ kind: 'err', text: t('admin.failed', { message: 'date' }) });
    run({ action: 'update', userId: u.id, accessExpiresAt: v ? new Date(`${v}T23:59:59`).toISOString() : null }, 'admin.updated');
  };
  const resetPw = (u) => {
    const v = window.prompt(t('admin.newTempPassword'));
    if (!v) return;
    if (v.length < 8) return setMsg({ kind: 'err', text: t('admin.failed', { message: t('auth.passwordShort') }) });
    run({ action: 'reset-password', userId: u.id, password: v }, 'admin.updated');
  };

  const fmt = (iso) => (iso ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso)) : t('admin.never'));

  return (
    <Layout>
      <main className="admin">
        <h1>{t('admin.title')}</h1>
        <p className="muted">{t('admin.contentNote')}</p>
        {!isConfigured && <p className="banner" role="alert">{t('admin.notConfigured')}</p>}
        {msg && <p className={msg.kind === 'ok' ? 'banner' : 'error'} role={msg.kind === 'ok' ? 'status' : 'alert'}>{msg.text}</p>}

        <section aria-labelledby="create-h">
          <h2 id="create-h" style={{ marginBottom: 8 }}>{t('admin.createUser')}</h2>
          <form onSubmit={create}>
            <label className="field">{t('admin.fullName')}<input required maxLength={120} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
            <label className="field">{t('admin.email')}<input type="email" required autoComplete="off" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="field">{t('admin.tempPassword')}<input type="text" required minLength={8} autoComplete="off" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            <label className="field">{t('admin.expires')}<input type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} /></label>
            <label className="field">{t('admin.role')}
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="learner">{t('admin.learner')}</option><option value="admin">{t('admin.admin')}</option>
              </select></label>
            <button className="btn btn--primary" disabled={busy || !isConfigured}>{busy ? t('admin.creating') : t('admin.create')}</button>
          </form>
        </section>

        <section aria-labelledby="users-h">
          <h2 id="users-h" style={{ marginBottom: 8 }}>{t('admin.users')}</h2>
          {loadError && <p className="error" role="alert">{t('admin.loadFailed')} <button className="btn btn--sm" onClick={load}>{t('common.retry')}</button></p>}
          {users && users.length === 0 && <p className="muted">{t('admin.empty')}</p>}
          {users && users.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>{t('admin.fullName')}</th><th>{t('admin.email')}</th><th>{t('admin.role')}</th><th>{t('admin.status')}</th><th>{t('admin.expiresShort')}</th><th /></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.full_name}</td><td>{u.email}</td>
                      <td>{u.role === 'admin' ? t('admin.admin') : t('admin.learner')}</td>
                      <td>{u.status === 'active' ? t('admin.active') : t('admin.suspended')}{u.must_change_password ? ` · ${t('admin.mustChange')}` : ''}</td>
                      <td>{fmt(u.access_expires_at)}</td>
                      <td><div className="row-actions">
                        <button className="btn btn--sm" disabled={busy} onClick={() => run({ action: 'update', userId: u.id, status: u.status === 'active' ? 'suspended' : 'active' }, 'admin.updated')}>
                          {u.status === 'active' ? t('admin.suspend') : t('admin.activate')}</button>
                        <button className="btn btn--sm" disabled={busy} onClick={() => setExpiry(u)}>{t('admin.setExpiry')}</button>
                        <button className="btn btn--sm" disabled={busy} onClick={() => resetPw(u)}>{t('admin.resetPassword')}</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </Layout>
  );
}

